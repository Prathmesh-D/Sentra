package com.sentra.crypto.core;

import com.sentra.crypto.utils.FileHelper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import com.sentra.backend.runtime.Log;

public class EncryptionEngine {
    private final Path baseDir;
    private final Map<String, Path> folders;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    public EncryptionEngine(Path baseDir) throws IOException {
        this.baseDir = baseDir;
        this.folders = FileHelper.createProjectFolders(baseDir);
        Log.info("CRYPTO", "init", "baseDir=" + baseDir);
    }

    public boolean generateOrLoadKeys(String keyName, boolean forceNew) {
        try {
            Path privateKeyPath = folders.get("keys").resolve(keyName + "_private.pem");
            Path publicKeyPath = folders.get("keys").resolve(keyName + "_public.pem");

            if (!forceNew && Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
                try {
                    this.privateKey = RSAUtils.loadPrivateKeyFromFile(privateKeyPath);
                    this.publicKey = RSAUtils.loadPublicKeyFromFile(publicKeyPath);
                    Log.debug("CRYPTO", "keys", "loaded name=" + keyName);
                    return true;
                } catch (Exception e) {
                    Log.warn("CRYPTO", "keys", "load_failed name=" + keyName);
                }
            }

            KeyPair keyPair = RSAUtils.generateRsaKeypair();
            this.privateKey = keyPair.getPrivate();
            this.publicKey = keyPair.getPublic();
            RSAUtils.saveKeysToFiles(privateKey, publicKey, folders.get("keys"), keyName);
            return true;

        } catch (Exception e) {
            Log.error("CRYPTO", "keys", "generation_failed");
            return false;
        }
    }

    public Map<String, Object> encryptFile(Path inputFilePath, String sender, String receiver) {
        Log.info("ENCRYPT", "start", "file=" + inputFilePath.getFileName());

        try {
            if (privateKey == null || publicKey == null) {
                if (!generateOrLoadKeys("main_key", false)) {
                    return mapOf("success", false, "error", "Failed to load/generate RSA keys");
                }
            }

            byte[] aesKey = AESUtils.generateAesKey();

            String encryptedFilename = FileHelper.generateFilename(
                inputFilePath.getFileName().toString(),
                "encrypted",
                ".enc",
                true
            );
            Path encryptedFilePath = folders.get("encrypted").resolve(encryptedFilename);

            AESUtils.EncryptionResult encResult = AESUtils.encryptFile(inputFilePath, encryptedFilePath, aesKey);
            if (!encResult.success) {
                return mapOf("success", false, "error", "AES encryption failed");
            }

            byte[] encryptedAesKey = RSAUtils.encryptAesKeyWithRsa(aesKey, publicKey);
            if (encryptedAesKey == null) {
                return mapOf("success", false, "error", "RSA key encryption failed");
            }

            Map<String, Object> metadata = FileHelper.createEncryptionMetadata(
                encResult.fileInfo,
                encryptedFilename,
                encResult.iv,
                encResult.tag,
                encryptedAesKey,
                sender,
                receiver
            );

            String metadataFilename = FileHelper.generateFilename(
                inputFilePath.getFileName().toString(),
                "metadata",
                ".json",
                true
            );
            Path metadataFilePath = folders.get("metadata").resolve(metadataFilename);
            FileHelper.saveMetadata(metadata, metadataFilePath);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("encrypted_file", encryptedFilePath.toString());
            result.put("metadata_file", metadataFilePath.toString());
            result.put("original_file_info", encResult.fileInfo);
            result.put("sender", sender);
            result.put("receiver", receiver);

            Log.info("ENCRYPT", "done", "encrypted=" + encryptedFilename + " metadata=" + metadataFilename);

            return result;

        } catch (Exception e) {
            String errorMsg = "Encryption failed: " + e.getMessage();
            Log.error("ENCRYPT", "failed", errorMsg);
            return mapOf("success", false, "error", errorMsg);
        }
    }

    public Map<String, Object> decryptFile(Path metadataFilePath, String outputFilename) {
        Log.info("DECRYPT", "start", "metadata=" + metadataFilePath.getFileName());

        try {
            if (privateKey == null) {
                if (!generateOrLoadKeys("main_key", false)) {
                    return mapOf("success", false, "error", "Failed to load RSA private key");
                }
            }

            Map<String, Object> metadata = FileHelper.loadMetadata(metadataFilePath);
            if (metadata == null) {
                return mapOf("success", false, "error", "Failed to load metadata");
            }

            String encryptedFilename = String.valueOf(metadata.get("encrypted_file"));
            byte[] iv = hexToBytes(String.valueOf(metadata.get("iv")));
            byte[] tag = hexToBytes(String.valueOf(metadata.get("tag")));
            byte[] encryptedAesKey = hexToBytes(String.valueOf(metadata.get("encrypted_aes_key")));

            Map<String, Object> originalFileInfo = (Map<String, Object>) metadata.get("original_file");

            Path encryptedFilePath = folders.get("encrypted").resolve(encryptedFilename);
            if (!Files.exists(encryptedFilePath)) {
                return mapOf("success", false, "error", "Encrypted file not found: " + encryptedFilename);
            }

            byte[] aesKey = RSAUtils.decryptAesKeyWithRsa(encryptedAesKey, privateKey);
            if (aesKey == null) {
                return mapOf("success", false, "error", "RSA key decryption failed");
            }

            if (outputFilename == null) {
                String originalName = String.valueOf(originalFileInfo.get("name"));
                String extension = String.valueOf(originalFileInfo.get("extension"));
                outputFilename = FileHelper.generateFilename(originalName, "decrypted", extension, true);
            }

            Path decryptedFilePath = folders.get("decrypted").resolve(outputFilename);
            boolean success = AESUtils.decryptFile(encryptedFilePath, decryptedFilePath, aesKey, iv, tag);
            if (!success) {
                return mapOf("success", false, "error", "AES decryption failed");

                // Unreachable block preserved from Python (intentional)
            }

            return null;

        } catch (Exception e) {
            String errorMsg = "Decryption failed: " + e.getMessage();
            Log.error("DECRYPT", "failed", errorMsg);
            return mapOf("success", false, "error", errorMsg);
        }
    }

    public Map<String, Object> encryptMultipleFiles(Path inputFolder, String sender, String receiver) {
        Log.debug("ENCRYPT", "batch_start", "folder=" + inputFolder);

        List<String> files = FileHelper.listFilesInFolder(inputFolder);
        if (files.isEmpty()) {
            Log.warn("ENCRYPT", "batch", "no_files");
            return mapOf("success", true, "encrypted_count", 0, "failed_count", 0, "results", List.of());
        }

        int successful = 0;
        int failed = 0;
        List<Map<String, Object>> results = new java.util.ArrayList<>();

        for (String filePath : files) {
            Log.debug("ENCRYPT", "batch", "processing=" + Path.of(filePath).getFileName());
            Map<String, Object> result = encryptFile(Path.of(filePath), sender, receiver);

            Map<String, Object> entry = new HashMap<>();
            entry.put("file", Path.of(filePath).getFileName().toString());
            entry.put("result", result);
            results.add(entry);

            Object successObj = result.get("success");
            if (successObj instanceof Boolean && (Boolean) successObj) {
                successful += 1;
            } else {
                failed += 1;
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("success", true);
        summary.put("encrypted_count", successful);
        summary.put("failed_count", failed);
        summary.put("total_files", files.size());
        summary.put("results", results);

        Log.info("ENCRYPT", "batch_summary", "total=" + files.size() + " ok=" + successful + " failed=" + failed);

        return summary;
    }

    public void showStatus() {
        Log.debug("CRYPTO", "status", "summary");

        Log.debug("CRYPTO", "status", "rsa_keys");
        if (privateKey != null && publicKey != null) {
            Map<String, Object> keyInfo = RSAUtils.getKeyInfo(publicKey);
            Log.debug("CRYPTO", "status", "keys_loaded");
        } else {
            Log.warn("CRYPTO", "status", "keys_not_loaded");
        }

        FileHelper.printFolderContents(folders);
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
}
