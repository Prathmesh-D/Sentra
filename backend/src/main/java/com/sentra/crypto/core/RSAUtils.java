package com.sentra.crypto.core;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.sentra.backend.runtime.Log;

public class RSAUtils {
    public static KeyPair generateRsaKeypair() throws Exception {
        return generateRsaKeypair(2048);
    }

    public static KeyPair generateRsaKeypair(int keySize) throws Exception {
        Log.debug("CRYPTO", "rsa_key", "generating size=" + keySize);
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(keySize);
        KeyPair keyPair = generator.generateKeyPair();
        Log.debug("CRYPTO", "rsa_key", "generated size=" + keySize);
        return keyPair;
    }

    public static Map<String, Path> saveKeysToFiles(PrivateKey privateKey, PublicKey publicKey, Path keysDir, String keyName) throws Exception {
        Files.createDirectories(keysDir);
        String privatePem = toPem("PRIVATE KEY", privateKey.getEncoded());
        String publicPem = toPem("PUBLIC KEY", publicKey.getEncoded());

        Path privatePath = keysDir.resolve(keyName + "_private.pem");
        Path publicPath = keysDir.resolve(keyName + "_public.pem");
        Files.writeString(privatePath, privatePem);
        Files.writeString(publicPath, publicPem);

        Log.debug("CRYPTO", "rsa_key", "saved dir=" + keysDir);

        Map<String, Path> paths = new HashMap<>();
        paths.put("private", privatePath);
        paths.put("public", publicPath);
        return paths;
    }

    public static byte[] encryptAesKeyWithRsa(byte[] aesKey, PublicKey publicKey) {
        try {
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaepSpec = new OAEPParameterSpec(
                "SHA-256",
                "MGF1",
                MGF1ParameterSpec.SHA256,
                PSource.PSpecified.DEFAULT
            );
            cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepSpec);
            byte[] encrypted = cipher.doFinal(aesKey);
            Log.debug("CRYPTO", "rsa_encrypt", "aes_key_wrapped");
            return encrypted;
        } catch (Exception e) {
            Log.error("CRYPTO", "rsa_encrypt", "failed");
            return null;
        }
    }

    public static byte[] encryptAesKeyWithRsaDeterministic(byte[] aesKey, PublicKey publicKey, SecureRandom rng) {
        try {
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaepSpec = new OAEPParameterSpec(
                "SHA-256",
                "MGF1",
                MGF1ParameterSpec.SHA256,
                PSource.PSpecified.DEFAULT
            );
            cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepSpec, rng);
            byte[] encrypted = cipher.doFinal(aesKey);
            Log.debug("CRYPTO", "rsa_encrypt", "aes_key_wrapped");
            return encrypted;
        } catch (Exception e) {
            Log.error("CRYPTO", "rsa_encrypt", "failed");
            return null;
        }
    }

    public static byte[] decryptAesKeyWithRsa(byte[] encryptedAesKey, PrivateKey privateKey) {
        try {
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaepSpec = new OAEPParameterSpec(
                "SHA-256",
                "MGF1",
                MGF1ParameterSpec.SHA256,
                PSource.PSpecified.DEFAULT
            );
            cipher.init(Cipher.DECRYPT_MODE, privateKey, oaepSpec);
            byte[] decrypted = cipher.doFinal(encryptedAesKey);
            Log.debug("CRYPTO", "rsa_decrypt", "aes_key_unwrapped");
            return decrypted;
        } catch (Exception e) {
            Log.error("CRYPTO", "rsa_decrypt", "failed");
            return null;
        }
    }

    public static PrivateKey loadPrivateKeyFromPem(String pem) throws Exception {
        byte[] der = parsePem(pem);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    public static PublicKey loadPublicKeyFromPem(String pem) throws Exception {
        byte[] der = parsePem(pem);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(new X509EncodedKeySpec(der));
    }

    public static PrivateKey loadPrivateKeyFromFile(Path filePath) throws Exception {
        String pem = Files.readString(filePath);
        return loadPrivateKeyFromPem(pem);
    }

    public static PublicKey loadPublicKeyFromFile(Path filePath) throws Exception {
        String pem = Files.readString(filePath);
        return loadPublicKeyFromPem(pem);
    }

    public static Map<String, Object> getKeyInfo(PublicKey publicKey) {
        Map<String, Object> info = new HashMap<>();
        if (publicKey instanceof RSAPublicKey) {
            RSAPublicKey rsa = (RSAPublicKey) publicKey;
            info.put("algorithm", "RSA");
            info.put("key_size_bits", rsa.getModulus().bitLength());
            info.put("key_size_bytes", rsa.getModulus().bitLength() / 8);
            info.put("public_exponent", rsa.getPublicExponent());
        }
        return info;
    }

    private static String toPem(String type, byte[] derBytes) {
        String base64 = Base64.getEncoder().encodeToString(derBytes);
        StringBuilder sb = new StringBuilder();
        sb.append("-----BEGIN ").append(type).append("-----\n");
        for (int i = 0; i < base64.length(); i += 64) {
            int end = Math.min(i + 64, base64.length());
            sb.append(base64, i, end).append("\n");
        }
        sb.append("-----END ").append(type).append("-----\n");
        return sb.toString();
    }

    private static byte[] parsePem(String pem) {
        String[] lines = pem.replace("\r", "").split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            if (line.startsWith("-----")) {
                continue;
            }
            sb.append(line.trim());
        }
        return Base64.getDecoder().decode(sb.toString());
    }
}
