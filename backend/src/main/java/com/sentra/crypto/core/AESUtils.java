package com.sentra.crypto.core;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import com.sentra.backend.runtime.Log;

public class AESUtils {
    private static final int DEFAULT_KEY_SIZE_BYTES = 32;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;

    public static byte[] generateAesKey() {
        return generateAesKey(DEFAULT_KEY_SIZE_BYTES);
    }

    public static byte[] generateAesKey(int keySizeBytes) {
        if (keySizeBytes != 16 && keySizeBytes != 24 && keySizeBytes != 32) {
            Log.warn("CRYPTO", "aes_key", "invalid size, using AES-256");
            keySizeBytes = 32;
        }
        byte[] key = new byte[keySizeBytes];
        new SecureRandom().nextBytes(key);
        Log.debug("CRYPTO", "aes_key", "generated size=" + (keySizeBytes * 8));
        return key;
    }

    public static Map<String, Object> getFileInfo(Path filePath) throws IOException {
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + filePath);
        }

        long sizeBytes = Files.size(filePath);
        double sizeMb = Math.round((sizeBytes / (1024.0 * 1024.0)) * 1000.0) / 1000.0;

        String mimeType = Files.probeContentType(filePath);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        String encoding = null;
        String sha256Hash;
        try {
            sha256Hash = sha256Hex(filePath);
        } catch (Exception e) {
            throw new IOException(e);
        }

        Map<String, Object> info = new HashMap<>();
        info.put("name", filePath.getFileName().toString());
        info.put("path", filePath.toString());
        String extension = "";
        String name = filePath.getFileName().toString();
        if (name.contains(".")) {
            extension = name.substring(name.lastIndexOf('.')).toLowerCase();
        }
        info.put("extension", extension);
        info.put("size_bytes", sizeBytes);
        info.put("size_mb", sizeMb);
        info.put("mime_type", mimeType);
        info.put("encoding", encoding);
        info.put("sha256_hash", sha256Hash);

        Log.debug("CRYPTO", "file_info", "name=" + info.get("name") + " size_mb=" + info.get("size_mb"));
        return info;
    }

    public static EncryptionResult encryptFile(Path inputFilePath, Path outputFilePath, byte[] aesKey) {
        try {
            Map<String, Object> fileInfo = getFileInfo(inputFilePath);

            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            byte[] plaintext = Files.readAllBytes(inputFilePath);
            byte[] combined = encryptAesGcmToCombined(plaintext, aesKey, iv);

            int tagLength = 16;
            int ctLength = combined.length - tagLength;
            byte[] ciphertext = new byte[ctLength];
            byte[] tagBytes = new byte[tagLength];
            System.arraycopy(combined, 0, ciphertext, 0, ctLength);
            System.arraycopy(combined, ctLength, tagBytes, 0, tagLength);

            Files.createDirectories(outputFilePath.getParent());
            try (OutputStream out = Files.newOutputStream(outputFilePath)) {
                out.write(ciphertext);
            }

            Log.debug("CRYPTO", "encrypt", "file=" + outputFilePath.getFileName());
            return new EncryptionResult(true, iv, tagBytes, fileInfo);

        } catch (Exception e) {
            Log.error("CRYPTO", "encrypt", "failed");
            return new EncryptionResult(false, null, null, null);
        }
    }

    public static boolean decryptFile(Path encryptedFilePath, Path outputFilePath, byte[] aesKey, byte[] iv, byte[] tag) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(aesKey, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            Files.createDirectories(outputFilePath.getParent());

            byte[] ciphertext = Files.readAllBytes(encryptedFilePath);
            byte[] combined = new byte[ciphertext.length + tag.length];
            System.arraycopy(ciphertext, 0, combined, 0, ciphertext.length);
            System.arraycopy(tag, 0, combined, ciphertext.length, tag.length);

            byte[] plaintext = cipher.doFinal(combined);
            Files.write(outputFilePath, plaintext);

            Log.debug("CRYPTO", "decrypt", "file=" + outputFilePath.getFileName());
            return true;

        } catch (Exception e) {
            Log.error("CRYPTO", "decrypt", "failed");
            return false;
        }
    }

    public static boolean verifyFileIntegrity(Path filePath, String expectedHash) {
        try {
            String actualHash = sha256Hex(filePath);
            if (actualHash.equals(expectedHash)) {
                Log.debug("CRYPTO", "integrity", "verified");
                return true;
            }
            Log.warn("CRYPTO", "integrity", "mismatch");
            return false;
        } catch (Exception e) {
            Log.error("CRYPTO", "integrity", "failed");
            return false;
        }
    }

    public static int getRecommendedKeySize(double fileSizeMb, String fileType) {
        return 32;
    }

    private static String sha256Hex(Path filePath) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = Files.newInputStream(filePath)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }
        byte[] hash = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static byte[] encryptAesGcmToCombined(byte[] plaintext, byte[] key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
        return cipher.doFinal(plaintext);
    }

    public static byte[] decryptAesGcmFromCombined(byte[] combined, byte[] key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
        return cipher.doFinal(combined);
    }

    public static ByteEncryptionResult encryptBytesDeterministic(byte[] plaintext, byte[] key, byte[] iv) throws Exception {
        byte[] combined = encryptAesGcmToCombined(plaintext, key, iv);
        int tagLength = 16;
        int ctLength = combined.length - tagLength;
        byte[] ciphertext = new byte[ctLength];
        byte[] tagBytes = new byte[tagLength];
        System.arraycopy(combined, 0, ciphertext, 0, ctLength);
        System.arraycopy(combined, ctLength, tagBytes, 0, tagLength);
        return new ByteEncryptionResult(ciphertext, iv, tagBytes);
    }

    public static class EncryptionResult {
        public final boolean success;
        public final byte[] iv;
        public final byte[] tag;
        public final Map<String, Object> fileInfo;

        public EncryptionResult(boolean success, byte[] iv, byte[] tag, Map<String, Object> fileInfo) {
            this.success = success;
            this.iv = iv;
            this.tag = tag;
            this.fileInfo = fileInfo;
        }
    }

    public static class ByteEncryptionResult {
        public final byte[] ciphertext;
        public final byte[] iv;
        public final byte[] tag;

        public ByteEncryptionResult(byte[] ciphertext, byte[] iv, byte[] tag) {
            this.ciphertext = ciphertext;
            this.iv = iv;
            this.tag = tag;
        }
    }
}
