package com.sentra.backend.encryption;

import com.sentra.crypto.core.AESUtils;
import com.sentra.crypto.core.EncryptionEngine;
import com.sentra.crypto.core.RSAUtils;
import com.sentra.crypto.utils.FileHelper;
import com.sentra.backend.runtime.Log;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class CryptoServiceAdapter {
    private final Path dataDir;
    private EncryptionEngine engine;

    public CryptoServiceAdapter(Path dataDir) {
        this.dataDir = dataDir;
    }

    public void initialize() throws IOException {
        Path cryptoDir = dataDir.resolve("crypto");
        this.engine = new EncryptionEngine(cryptoDir);
    }

    private void ensureInitialized() {
        if (engine == null) {
            throw new IllegalStateException("Crypto service not initialized. Call initialize() first.");
        }
    }

    public String getFileType(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "unknown";
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        Map<String, String> extensionMap = new HashMap<>();
        extensionMap.put("pdf", "PDF");
        extensionMap.put("doc", "Document");
        extensionMap.put("docx", "Document");
        extensionMap.put("txt", "Text");
        extensionMap.put("rtf", "Document");
        extensionMap.put("odt", "Document");
        extensionMap.put("xls", "Spreadsheet");
        extensionMap.put("xlsx", "Spreadsheet");
        extensionMap.put("csv", "Spreadsheet");
        extensionMap.put("ods", "Spreadsheet");
        extensionMap.put("ppt", "Presentation");
        extensionMap.put("pptx", "Presentation");
        extensionMap.put("odp", "Presentation");
        extensionMap.put("jpg", "Image");
        extensionMap.put("jpeg", "Image");
        extensionMap.put("png", "Image");
        extensionMap.put("gif", "Image");
        extensionMap.put("bmp", "Image");
        extensionMap.put("svg", "Image");
        extensionMap.put("webp", "Image");
        extensionMap.put("zip", "Archive");
        extensionMap.put("rar", "Archive");
        extensionMap.put("7z", "Archive");
        extensionMap.put("tar", "Archive");
        extensionMap.put("gz", "Archive");
        extensionMap.put("mp4", "Video");
        extensionMap.put("avi", "Video");
        extensionMap.put("mkv", "Video");
        extensionMap.put("mov", "Video");
        extensionMap.put("wmv", "Video");
        extensionMap.put("mp3", "Audio");
        extensionMap.put("wav", "Audio");
        extensionMap.put("flac", "Audio");
        extensionMap.put("aac", "Audio");
        extensionMap.put("py", "Code");
        extensionMap.put("js", "Code");
        extensionMap.put("html", "Code");
        extensionMap.put("css", "Code");
        extensionMap.put("java", "Code");
        extensionMap.put("cpp", "Code");
        extensionMap.put("c", "Code");

        return extensionMap.getOrDefault(extension, extension.toUpperCase());
    }

    public Map<String, Object> encryptBytes(byte[] fileBytes,
                                            String filename,
                                            String username,
                                            List<String> recipients,
                                            String encryptionType,
                                            int expiryDays,
                                            boolean selfDestruct,
                                            String message) {
        ensureInitialized();
        try {
            Log.info("ENCRYPT", "start", "file=" + filename + " user=" + username);
            long totalStart = System.nanoTime();

            byte[] originalBytes = fileBytes;
            long originalSize = originalBytes.length;

            String senderKeyName = "user_" + username;
            if (!engine.generateOrLoadKeys(senderKeyName, false)) {
                throw new Exception("Failed to load/generate sender keys");
            }

            int keySizeBytes = "AES-128".equals(encryptionType) ? 16 : 32;
            byte[] aesKey = AESUtils.generateAesKey(keySizeBytes);
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);

            long aesStart = System.nanoTime();
            byte[] combined = AESUtils.encryptAesGcmToCombined(fileBytes, aesKey, iv);
            long aesMs = (System.nanoTime() - aesStart) / 1_000_000;
            int tagLength = 16;
            int ctLength = combined.length - tagLength;
            byte[] ciphertext = Arrays.copyOfRange(combined, 0, ctLength);
            byte[] tag = Arrays.copyOfRange(combined, ctLength, combined.length);

            Map<String, String> wrappedKeys = new HashMap<>();
            long wrapStart = System.nanoTime();
            try {
                Path senderPublicKeyPath = engineKeysDir().resolve(senderKeyName + "_public.pem");
                if (Files.exists(senderPublicKeyPath)) {
                    byte[] wrappedForSender = RSAUtils.encryptAesKeyWithRsa(aesKey, RSAUtils.loadPublicKeyFromFile(senderPublicKeyPath));
                    if (wrappedForSender != null) {
                        wrappedKeys.put(username, bytesToHex(wrappedForSender));
                    }
                }
            } catch (Exception ignored) {
                // preserve behavior
            }

            if (recipients != null && !recipients.isEmpty()) {
                wrappedKeys.putAll(wrapKeyForRecipients(aesKey, recipients));
            }
            long wrapMs = (System.nanoTime() - wrapStart) / 1_000_000;

            int keySize = "AES-256".equals(encryptionType) ? 256 : 128;
            Date expiryDate = Date.from(Instant.now().plusSeconds(expiryDays * 86400L));
            String fileType = getFileType(filename);
            String encryptedFilename = FileHelper.generateFilename(filename, "encrypted", ".enc", true);

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("original_filename", filename);
            metadata.put("file_type", fileType);
            metadata.put("encrypted_filename", encryptedFilename);
            metadata.put("encrypted_file_path", null);
            metadata.put("wrapped_key_path", null);
            metadata.put("metadata_file", null);
            metadata.put("sender", username);
            metadata.put("recipients", recipients != null ? recipients : new ArrayList<>());
            metadata.put("wrapped_keys", wrappedKeys);
            metadata.put("encryption_type", encryptionType);
            metadata.put("key_size", keySize);
            metadata.put("file_size", originalSize);
            long hashStart = System.nanoTime();
            String fileHash = sha256Hex(originalBytes);
            long hashMs = (System.nanoTime() - hashStart) / 1_000_000;
            metadata.put("file_hash", fileHash);
            metadata.put("self_destruct", selfDestruct);
            metadata.put("message", message);
            metadata.put("created_at", new Date());
            metadata.put("expires_at", expiryDate);
            metadata.put("download_count", 0);
            metadata.put("status", "active");
            metadata.put("iv", bytesToHex(iv));
            metadata.put("auth_tag", bytesToHex(tag));

            long totalMs = (System.nanoTime() - totalStart) / 1_000_000;
            Log.info(
                "ENCRYPT",
                "timing",
                "file=" + filename
                    + " aes_ms=" + aesMs
                    + " wrap_ms=" + wrapMs
                    + " hash_ms=" + hashMs
                    + " total_ms=" + totalMs
                    + " recipients=" + (recipients != null ? recipients.size() : 0)
            );

            return mapOf(
                "success", true,
                "metadata", metadata,
                "encrypted_bytes", ciphertext,
                "encrypted_filename", encryptedFilename
            );

        } catch (Exception e) {
            Log.error("ENCRYPT", "failed", e.getMessage());
            return mapOf("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> decryptBytes(byte[] encryptedBytes,
                                            String username,
                                            String wrappedKeyHex,
                                            String ivHex,
                                            String tagHex) {
        ensureInitialized();
        try {
            Log.info("DECRYPT", "start", "user=" + username);

            String userKeyName = "user_" + username;
            if (!engine.generateOrLoadKeys(userKeyName, false)) {
                throw new Exception("Failed to load RSA keys for user: " + username);
            }

            if (wrappedKeyHex == null || wrappedKeyHex.isEmpty()) {
                throw new Exception("Missing wrapped key");
            }
            byte[] wrappedKeyBytes = hexToBytes(wrappedKeyHex);
            byte[] aesKey = RSAUtils.decryptAesKeyWithRsa(wrappedKeyBytes, RSAUtils.loadPrivateKeyFromFile(enginePrivateKeyPath(userKeyName)));
            if (aesKey == null) {
                throw new Exception("Failed to decrypt wrapped AES key");
            }

            byte[] iv = hexToBytes(ivHex);
            byte[] tag = hexToBytes(tagHex);
            byte[] combined = new byte[encryptedBytes.length + tag.length];
            System.arraycopy(encryptedBytes, 0, combined, 0, encryptedBytes.length);
            System.arraycopy(tag, 0, combined, encryptedBytes.length, tag.length);

            byte[] plaintext = AESUtils.decryptAesGcmFromCombined(combined, aesKey, iv);
            return mapOf("success", true, "plaintext", plaintext);
        } catch (Exception e) {
            Log.error("DECRYPT", "failed", "user=" + username + " error=" + e.getMessage());
            return mapOf("success", false, "error", e.getMessage());
        }
    }

    /**
     * [PRESERVED]
     */
    public Map<String, Object> encryptFile(Path filePath,
                                           String filename,
                                           String username,
                                           List<String> recipients,
                                           String encryptionType,
                                           int expiryDays,
                                           boolean selfDestruct,
                                           String message) {
        ensureInitialized();
        try {
            Log.info("ENCRYPT", "start", "file=" + filename + " user=" + username);


            String senderKeyName = "user_" + username;
            if (!engine.generateOrLoadKeys(senderKeyName, false)) {
                throw new Exception("Failed to load/generate sender keys");
            }

            Map<String, Object> result = engine.encryptFile(filePath, username, recipients != null && !recipients.isEmpty() ? String.join(",", recipients) : "Unknown");
            Object successObj = result.get("success");
            if (!(successObj instanceof Boolean) || !((Boolean) successObj)) {
                throw new Exception(String.valueOf(result.getOrDefault("error", "Encryption failed")));
            }

            Path metadataFilePath = Path.of(String.valueOf(result.get("metadata_file")));
            Map<String, Object> coreMetadata = FileHelper.loadMetadata(metadataFilePath);
            if (coreMetadata == null) {
                throw new Exception("Failed to load metadata");
            }

            String encryptedAesKeyHex = String.valueOf(coreMetadata.get("encrypted_aes_key"));
            Map<String, String> wrappedKeys = new HashMap<>();
            wrappedKeys.put(username, encryptedAesKeyHex);

            if (recipients != null && !recipients.isEmpty()) {
                Path privateKeyPath = enginePrivateKeyPath(senderKeyName);
                byte[] encryptedAesKey = hexToBytes(encryptedAesKeyHex);
                byte[] aesKey = RSAUtils.decryptAesKeyWithRsa(encryptedAesKey, RSAUtils.loadPrivateKeyFromFile(privateKeyPath));
                if (aesKey != null) {
                    wrappedKeys.putAll(wrapKeyForRecipients(aesKey, recipients));
                }
            }

            int keySize = "AES-256".equals(encryptionType) ? 256 : 128;
            Date expiryDate = Date.from(Instant.now().plusSeconds(expiryDays * 86400L));
            String fileType = getFileType(filename);

            Path dataDirPath = dataDir;
            String encryptedFileRel = relativizePath(dataDirPath, Path.of(String.valueOf(result.get("encrypted_file"))));
            String metadataFileRel = relativizePath(dataDirPath, metadataFilePath);
            String wrappedKeyRel = metadataFileRel;

            Map<String, Object> fileInfo = (Map<String, Object>) result.get("original_file_info");

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("original_filename", filename);
            metadata.put("file_type", fileType);
            metadata.put("encrypted_filename", Path.of(String.valueOf(result.get("encrypted_file"))).getFileName().toString());
            metadata.put("encrypted_file_path", encryptedFileRel);
            metadata.put("wrapped_key_path", wrappedKeyRel);
            metadata.put("metadata_file", metadataFileRel);
            metadata.put("sender", username);
            metadata.put("recipients", recipients != null ? recipients : new ArrayList<>());
            metadata.put("wrapped_keys", wrappedKeys);
            metadata.put("encryption_type", encryptionType);
            metadata.put("key_size", keySize);
            metadata.put("file_size", fileInfo != null ? fileInfo.getOrDefault("size_bytes", 0) : 0);
            metadata.put("file_hash", fileInfo != null ? fileInfo.getOrDefault("sha256_hash", "") : "");
            metadata.put("self_destruct", selfDestruct);
            metadata.put("message", message);
            metadata.put("created_at", new Date());
            metadata.put("expires_at", expiryDate);
            metadata.put("download_count", 0);
            metadata.put("status", "active");

            return mapOf(
                "success", true,
                "metadata", metadata,
                "file_path", result.get("encrypted_file")
            );

        } catch (Exception e) {
            Log.error("ENCRYPT", "failed", e.getMessage());
            return mapOf("success", false, "error", e.getMessage());
        }
    }

    /**
     * [PRESERVED]
     */
    public Map<String, Object> decryptFile(Path encryptedFilePath,
                                           Path wrappedKeyPath,
                                           String username,
                                           String wrappedKeyHex) {
        ensureInitialized();
        try {
            Log.info("DECRYPT", "start", "user=" + username);

            String userKeyName = "user_" + username;
            if (!engine.generateOrLoadKeys(userKeyName, false)) {
                throw new Exception("Failed to load RSA keys for user: " + username);
            }

            if (wrappedKeyHex != null) {
                Log.debug("DECRYPT", "mode", "wrapped_key");
                Path privateKeyPath = enginePrivateKeyPath(userKeyName);
                byte[] wrappedKeyBytes = hexToBytes(wrappedKeyHex);
                byte[] aesKey = RSAUtils.decryptAesKeyWithRsa(wrappedKeyBytes, RSAUtils.loadPrivateKeyFromFile(privateKeyPath));
                if (aesKey == null) {
                    throw new Exception("Failed to decrypt wrapped AES key");
                }

                Map<String, Object> metadata = FileHelper.loadMetadata(wrappedKeyPath);
                if (metadata == null) {
                    throw new Exception("Failed to load metadata");
                }

                byte[] iv = hexToBytes(String.valueOf(metadata.get("iv")));
                Object tagVal = metadata.get("auth_tag") != null ? metadata.get("auth_tag") : metadata.get("tag");
                byte[] tag = hexToBytes(String.valueOf(tagVal));
                Map<String, Object> originalFile = (Map<String, Object>) metadata.get("original_file");
                String originalFilename = String.valueOf(originalFile.get("name"));

                Path outputDir = engineDecryptedDir();
                Path outputPath = outputDir.resolve(originalFilename);

                boolean success = AESUtils.decryptFile(encryptedFilePath, outputPath, aesKey, iv, tag);
                if (!success) {
                    throw new Exception("AES decryption failed");
                }

                return mapOf(
                    "success", true,
                    "decrypted_file", outputPath.toString(),
                    "file_size", Files.size(outputPath),
                    "integrity_verified", true
                );
            }

            Log.debug("DECRYPT", "mode", "legacy_metadata");
            Map<String, Object> result = engine.decryptFile(wrappedKeyPath, null);
            if (result == null || !(Boolean) result.getOrDefault("success", false)) {
                throw new Exception("Decryption failed");
            }

            return mapOf(
                "success", true,
                "decrypted_file", result.get("decrypted_file"),
                "file_size", result.getOrDefault("file_size", 0),
                "integrity_verified", result.getOrDefault("integrity_verified", false)
            );

        } catch (Exception e) {
            Log.error("DECRYPT", "failed", e.getMessage());
            return mapOf("success", false, "error", e.getMessage());
        }
    }

    /**
     * [PRESERVED]
     */
    public Map<String, Object> generateUserKeys(String username) {
        ensureInitialized();
        try {
            String keyName = "user_" + username;
            if (!engine.generateOrLoadKeys(keyName, true)) {
                throw new Exception("Failed to generate keys");
            }
            Map<String, Object> keys = getUserKeysPath(username);
            Log.info("CRYPTO", "keys", "generated user=" + username);
            return mapOf("success", true, "keys", keys);
        } catch (Exception e) {
            Log.error("CRYPTO", "keys", "generation_failed");
            return mapOf("success", false, "error", e.getMessage());
        }
    }

    /**
     * [PRESERVED]
     */
    public Map<String, Object> getUserKeysPath(String username) {
        ensureInitialized();
        String keyName = "user_" + username;
        Path keysDir = engineKeysDir();
        Map<String, Object> keys = new HashMap<>();
        keys.put("public_key", keysDir.resolve(keyName + "_public.pem").toString());
        keys.put("private_key", keysDir.resolve(keyName + "_private.pem").toString());
        return keys;
    }

    /**
     * [PRESERVED]
     */
    public void cleanupTempFiles(Path... filePaths) {
        for (Path filePath : filePaths) {
            try {
                if (filePath != null && Files.exists(filePath)) {
                    Files.delete(filePath);
                    Log.debug("ENCRYPT", "cleanup", "removed=" + filePath.getFileName());
                }
            } catch (Exception e) {
                Log.warn("ENCRYPT", "cleanup", "failed=" + filePath.getFileName());
            }
        }
    }

    private Map<String, String> wrapKeyForRecipients(byte[] aesKey, List<String> recipients) {
        Map<String, String> wrapped = new ConcurrentHashMap<>();
        recipients.parallelStream().forEach(recipient -> {
            try {
                String recipientKeyName = "user_" + recipient;
                Path publicKeyPath = engineKeysDir().resolve(recipientKeyName + "_public.pem");
                if (!Files.exists(publicKeyPath)) {
                    Log.warn("ENCRYPT", "wrap_key", "missing_public_key user=" + recipient);
                    return;
                }
                byte[] wrappedKey = RSAUtils.encryptAesKeyWithRsa(aesKey, RSAUtils.loadPublicKeyFromFile(publicKeyPath));
                if (wrappedKey != null) {
                    wrapped.put(recipient, bytesToHex(wrappedKey));
                    Log.debug("ENCRYPT", "wrap_key", "recipient=" + recipient);
                }
            } catch (Exception e) {
                Log.warn("ENCRYPT", "wrap_key", "failed recipient=" + recipient);
            }
        });
        return new HashMap<>(wrapped);
    }

    private Path engineKeysDir() {
        return dataDir.resolve("crypto").resolve("keys");
    }

    private Path engineDecryptedDir() {
        return dataDir.resolve("crypto").resolve("decrypted");
    }

    private Path enginePrivateKeyPath(String keyName) {
        return engineKeysDir().resolve(keyName + "_private.pem");
    }

    private static String relativizePath(Path baseDir, Path path) {
        try {
            return baseDir.relativize(path).toString();
        } catch (Exception e) {
            return path.toString();
        }
    }

    private static String bytesToHex(byte[] data) {
        StringBuilder sb = new StringBuilder(data.length * 2);
        for (byte b : data) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] out = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            out[i / 2] = (byte) Integer.parseInt(hex.substring(i, i + 2), 16);
        }
        return out;
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }

    private static String sha256Hex(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
