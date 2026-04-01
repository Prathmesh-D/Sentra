package com.sentra.crypto.utils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import com.sentra.backend.runtime.Log;
import com.sentra.backend.runtime.JsonUtil;

public class FileHelper {
    public static Map<String, Path> createProjectFolders(Path baseDir) throws IOException {
        Map<String, Path> folders = new LinkedHashMap<>();
        folders.put("files", baseDir.resolve("files"));
        folders.put("encrypted", baseDir.resolve("encrypted"));
        folders.put("decrypted", baseDir.resolve("decrypted"));
        folders.put("metadata", baseDir.resolve("metadata"));
        folders.put("keys", baseDir.resolve("keys"));

        for (Map.Entry<String, Path> entry : folders.entrySet()) {
            Files.createDirectories(entry.getValue());
        }
        Log.info("BOOT", "folders", "initialized baseDir=" + baseDir);
        return folders;
    }

    public static String generateTimestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    }

    public static String generateFilename(String originalName, String suffix, String extension, boolean includeTimestamp) {
        String baseName = originalName;
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = originalName.substring(0, dotIndex);
        }

        List<String> parts = new ArrayList<>();
        parts.add(baseName);
        if (suffix != null && !suffix.isEmpty()) {
            parts.add(suffix);
        }
        if (includeTimestamp) {
            parts.add(generateTimestamp());
        }

        return String.join("_", parts) + extension;
    }

    public static boolean saveMetadata(Map<String, Object> metadata, Path metadataFilePath) {
        try {
            Files.createDirectories(metadataFilePath.getParent());
            String json = JsonUtil.stringifyPretty(metadata);
            Files.writeString(metadataFilePath, json, StandardCharsets.UTF_8);
            Log.debug("META", "save", "file=" + metadataFilePath.getFileName());
            return true;
        } catch (Exception e) {
            Log.error("META", "save", "failed file=" + metadataFilePath.getFileName());
            return false;
        }
    }

    public static Map<String, Object> loadMetadata(Path metadataFilePath) {
        try {
            String content = Files.readString(metadataFilePath, StandardCharsets.UTF_8);
            Map<String, Object> metadata = JsonUtil.parseObject(content);
            Log.debug("META", "load", "file=" + metadataFilePath.getFileName());
            return metadata;
        } catch (Exception e) {
            Log.error("META", "load", "failed file=" + metadataFilePath.getFileName());
            return null;
        }
    }

    public static Map<String, Object> createEncryptionMetadata(
        Map<String, Object> fileInfo,
        String encryptedFilename,
        byte[] iv,
        byte[] tag,
        byte[] encryptedAesKey,
        String sender,
        String receiver
    ) {
        String timestamp = generateTimestamp();

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("encrypted_file", encryptedFilename);
        metadata.put("iv", bytesToHex(iv));
        metadata.put("tag", bytesToHex(tag));
        metadata.put("encrypted_aes_key", bytesToHex(encryptedAesKey));
        metadata.put("aes_key_size", iv.length <= 4 ? iv.length * 8 : 256);

        Map<String, Object> originalFile = new LinkedHashMap<>();
        originalFile.put("name", fileInfo.get("name"));
        originalFile.put("extension", fileInfo.get("extension"));
        originalFile.put("size_bytes", fileInfo.get("size_bytes"));
        originalFile.put("size_mb", fileInfo.get("size_mb"));
        originalFile.put("mime_type", fileInfo.get("mime_type"));
        originalFile.put("encoding", fileInfo.get("encoding"));
        originalFile.put("sha256_hash", fileInfo.get("sha256_hash"));
        metadata.put("original_file", originalFile);

        Map<String, Object> encryptionInfo = new LinkedHashMap<>();
        encryptionInfo.put("algorithm", "AES-GCM + RSA-OAEP");
        encryptionInfo.put("aes_mode", "GCM");
        encryptionInfo.put("rsa_padding", "OAEP");
        encryptionInfo.put("timestamp", timestamp);
        encryptionInfo.put("created_at", LocalDateTime.now().toString());
        metadata.put("encryption_info", encryptionInfo);

        Map<String, Object> communication = new LinkedHashMap<>();
        communication.put("sender", sender);
        communication.put("receiver", receiver);
        metadata.put("communication", communication);

        metadata.put("metadata_version", "1.0");

        return metadata;
    }

    public static List<String> listFilesInFolder(Path folderPath) {
        try {
            if (!Files.exists(folderPath)) {
                Log.warn("FILES", "list", "missing folder=" + folderPath.getFileName());
                return Collections.emptyList();
            }
            List<String> files = new ArrayList<>();
            Files.list(folderPath).forEach(path -> {
                if (Files.isRegularFile(path)) {
                    files.add(path.toString());
                }
            });
            Collections.sort(files);
            Log.debug("FILES", "list", "folder=" + folderPath.getFileName() + " count=" + files.size());
            return files;
        } catch (Exception e) {
            Log.error("FILES", "list", "failed folder=" + folderPath.getFileName());
            return Collections.emptyList();
        }
    }

    public static Map<String, Object> getFolderSummary(Path folderPath) {
        try {
            if (!Files.exists(folderPath)) {
                return mapOf("file_count", 0, "total_size_mb", 0, "files", new ArrayList<>());
            }
            List<Map<String, Object>> files = new ArrayList<>();
            long totalSize = 0;
            Files.list(folderPath).forEach(path -> {
                try {
                    if (Files.isRegularFile(path) && !path.getFileName().toString().startsWith(".")) {
                        long size = Files.size(path);
                        Map<String, Object> info = new LinkedHashMap<>();
                        info.put("name", path.getFileName().toString());
                        info.put("size_bytes", size);
                        info.put("size_mb", Math.round((size / (1024.0 * 1024.0)) * 1000.0) / 1000.0);
                        files.add(info);
                    }
                } catch (Exception ex) {
                    Log.warn("FILES", "summary", "skip_file=" + path.getFileName() + " error=" + ex.getMessage());
                }
            });
            for (Map<String, Object> f : files) {
                totalSize += ((Number) f.get("size_bytes")).longValue();
            }

            files.sort(Comparator.comparing(o -> String.valueOf(o.get("name"))));

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("file_count", files.size());
            summary.put("total_size_mb", Math.round((totalSize / (1024.0 * 1024.0)) * 1000.0) / 1000.0);
            summary.put("files", files);
            return summary;
        } catch (Exception e) {
            return mapOf("file_count", 0, "total_size_mb", 0, "files", new ArrayList<>());
        }
    }

    public static void printFolderContents(Map<String, Path> folders) {
        Log.debug("FILES", "summary", "project folder contents");

        for (Map.Entry<String, Path> entry : folders.entrySet()) {
            Map<String, Object> summary = getFolderSummary(entry.getValue());
            Log.debug("FILES", "summary", entry.getKey() + " files=" + summary.get("file_count") + " size_mb=" + summary.get("total_size_mb"));

            List<Map<String, Object>> files = (List<Map<String, Object>>) summary.get("files");
            int limit = Math.min(5, files.size());
            for (int i = 0; i < limit; i++) {
                Map<String, Object> f = files.get(i);
                Log.debug("FILES", "summary", "file=" + f.get("name"));
            }

            if (files.size() > 5) {
                Log.debug("FILES", "summary", "more_files=" + (files.size() - 5));
            }
        }
    }

    public static int cleanupTempFiles(Path folderPath, String pattern) {
        try {
            if (!Files.exists(folderPath)) {
                return 0;
            }
            int removed = 0;
            String prefix = pattern.replace("*", "");
            for (Path path : (Iterable<Path>) Files.list(folderPath)::iterator) {
                if (Files.isRegularFile(path) && path.getFileName().toString().startsWith(prefix)) {
                    try {
                        Files.delete(path);
                        removed++;
                    } catch (Exception ex) {
                        Log.warn("FILES", "cleanup", "skip_file=" + path.getFileName() + " error=" + ex.getMessage());
                    }
                }
            }
            if (removed > 0) {
                Log.debug("FILES", "cleanup", "removed=" + removed);
            }
            return removed;
        } catch (Exception e) {
            Log.error("FILES", "cleanup", "failed");
            return 0;
        }
    }

    private static String bytesToHex(byte[] data) {
        StringBuilder sb = new StringBuilder(data.length * 2);
        for (byte b : data) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }
}
