package com.sentra.backend.encryption;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.sentra.backend.runtime.Log;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class EncryptionApiModule {
    private final MongoDatabase db;
    private final CryptoServiceAdapter cryptoService;
    private final Path dataDir;
    private final long maxFileSize;
    private static final String GRIDFS_BUCKET = "encrypted_files";
    private static final long AUTO_AES_128_MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> BLOCKED_UPLOAD_EXTENSIONS = Set.of(
        "exe", "dll", "bat", "cmd", "com", "msi", "ps1", "vbs", "js", "jar", "sh", "scr"
    );

    public EncryptionApiModule(MongoDatabase db, CryptoServiceAdapter cryptoService, Path dataDir, long maxFileSize) {
        this.db = db;
        this.cryptoService = cryptoService;
        this.dataDir = dataDir;
        this.maxFileSize = maxFileSize;
    }

    public static class Response {
        public final int statusCode;
        public final Map<String, Object> body;

        public Response(int statusCode, Map<String, Object> body) {
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    public static class FileResponse {
        public final int statusCode;
        public final Map<String, Object> body;
        public final String filePath;
        public final String downloadName;
        public final String mimeType;
        public final byte[] fileBytes;

        public FileResponse(int statusCode, Map<String, Object> body, String filePath, String downloadName, String mimeType, byte[] fileBytes) {
            this.statusCode = statusCode;
            this.body = body;
            this.filePath = filePath;
            this.downloadName = downloadName;
            this.mimeType = mimeType;
            this.fileBytes = fileBytes;
        }
    }

    public static class UploadedFile {
        public final String filename;
        public final byte[] content;
        public final String contentType;

        public UploadedFile(String filename, byte[] content) {
            this(filename, content, null);
        }

        public UploadedFile(String filename, byte[] content, String contentType) {
            this.filename = filename;
            this.content = content;
            this.contentType = contentType;
        }
    }

    /**
     * [PRESERVED]
     * POST /api/encrypt/encrypt
     */
    public Response encryptFile(String username,
                                UploadedFile file,
                                List<String> recipients,
                                String encryptionType,
                                Integer expiryDays,
                                Boolean selfDestruct,
                                String message,
                                String processingMode,
                                String manualTag) {
        try {
            long totalStart = System.nanoTime();
            if (file == null) {
                return new Response(400, mapOf("error", "No file provided"));
            }
            if (file.filename == null || file.filename.isEmpty()) {
                return new Response(400, mapOf("error", "No file selected"));
            }
            if (file.content == null || file.content.length == 0) {
                return new Response(400, mapOf("error", "File content is empty"));
            }
            if (isUnsafeFilename(file.filename)) {
                return new Response(400, mapOf("error", "Invalid filename"));
            }
            if (recipients == null || recipients.isEmpty()) {
                return new Response(400, mapOf("error", "Recipients are required"));
            }

            List<String> resolvedRecipients = normalizeRecipientsAndEnsureKeys(recipients, username);
            if (resolvedRecipients.isEmpty()) {
                return new Response(400, mapOf("error", "Recipients are required"));
            }

            String resolvedMode = normalizeProcessingMode(processingMode);
            String tag = resolveTag(resolvedMode, manualTag, file.filename);
            int resolvedExpiryDays = resolveExpiryDays(resolvedMode, expiryDays, file.filename);
            boolean resolvedSelfDestruct = resolveSelfDestruct(resolvedMode, selfDestruct, resolvedRecipients);

            if (file.content.length > maxFileSize) {
                return new Response(413, mapOf("error", "File too large"));
            }

            if (db == null) {
                return new Response(503, mapOf("error", "Database not available"));
            }

            String originalFilename = secureFilename(file.filename);
            String ext = fileExtension(originalFilename);
            if (BLOCKED_UPLOAD_EXTENSIONS.contains(ext)) {
                return new Response(415, mapOf("error", "Unsupported file type"));
            }

            String normalizedContentType = file.contentType == null ? "" : file.contentType.toLowerCase().trim();
            if (normalizedContentType.contains(";") ) {
                normalizedContentType = normalizedContentType.substring(0, normalizedContentType.indexOf(';')).trim();
            }
            if (isBlockedContentType(normalizedContentType)) {
                return new Response(415, mapOf("error", "Unsupported media type"));
            }

            String detectedType = detectSignatureType(file.content);
            if ("exe".equals(detectedType) || "script".equals(detectedType)) {
                return new Response(415, mapOf("error", "Unsupported media type"));
            }
            if (!isMimeCompatibleWithSignature(normalizedContentType, detectedType)) {
                return new Response(415, mapOf("error", "Content type does not match file data"));
            }
            int expiry = resolvedExpiryDays;
            String encType = resolveEncryptionType(resolvedMode, encryptionType, file.content.length);

            long encryptStart = System.nanoTime();
            Map<String, Object> result = cryptoService.encryptBytes(
                file.content,
                originalFilename,
                username,
                resolvedRecipients,
                encType,
                expiry,
                resolvedSelfDestruct,
                message != null ? message : ""
            );
            long encryptMs = (System.nanoTime() - encryptStart) / 1_000_000;

            if (!Boolean.TRUE.equals(result.get("success"))) {
                return new Response(500, mapOf("error", result.getOrDefault("error", "Encryption failed")));
            }

            Map<String, Object> metadata = (Map<String, Object>) result.get("metadata");
            metadata.put("tag", tag);
            metadata.put("processing_mode", resolvedMode);

            byte[] encryptedBytes = (byte[]) result.get("encrypted_bytes");
            if (encryptedBytes == null) {
                return new Response(500, mapOf("error", "Encryption failed"));
            }

            String gridfsId;
            long uploadStart = System.nanoTime();
            try {
                GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                String encryptedFilename = String.valueOf(result.get("encrypted_filename"));
                try (ByteArrayInputStream input = new ByteArrayInputStream(encryptedBytes)) {
                    ObjectId gridId = bucket.uploadFromStream(encryptedFilename, input);
                    gridfsId = gridId.toHexString();
                }
            } catch (Exception e) {
                return new Response(500, mapOf("error", "Failed to store encrypted file", "details", e.getMessage()));
            }
            long uploadMs = (System.nanoTime() - uploadStart) / 1_000_000;

            metadata.put("encrypted_file_gridfs_id", gridfsId);
            metadata.put("encrypted_file_gridfs_bucket", GRIDFS_BUCKET);

            String fileId;
            long metadataStart = System.nanoTime();
            try {
                MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
                Document doc = new Document(metadata);
                ObjectId id = new ObjectId();
                doc.put("_id", id);
                filesCollection.insertOne(doc);
                fileId = id.toString();

                if (resolvedRecipients != null) {
                    for (String recipient : resolvedRecipients) {
                        try {
                            Document userDoc = db.getCollection("users").find(new Document("username", recipient)).first();
                            if (userDoc != null) {
                                addContact(username, recipient, String.valueOf(userDoc.get("email")), String.valueOf(userDoc.get("full_name")));
                                updateContactShareStats(username, recipient);
                                createNotification(
                                    recipient,
                                    "file_shared",
                                    "New File Shared",
                                    username + " shared \"" + originalFilename + "\" with you",
                                    fileId,
                                    username,
                                    "/inbox",
                                    "normal"
                                );
                            }
                        } catch (Exception ignored) {
                            // preserve behavior
                        }
                    }
                }

                logActivity(username, "encrypted", fileId, originalFilename, null, true, null, mapOf(
                    "recipients", resolvedRecipients,
                    "encryption_type", encType,
                    "file_size", file.content.length
                ));

            } catch (Exception e) {
                return new Response(500, mapOf("error", "Failed to save metadata", "details", e.getMessage()));
            }
            long metadataMs = (System.nanoTime() - metadataStart) / 1_000_000;
            long totalMs = (System.nanoTime() - totalStart) / 1_000_000;
            Log.info(
                "ENCRYPT",
                "timing_api",
                "file=" + originalFilename
                    + " encrypt_ms=" + encryptMs
                    + " upload_ms=" + uploadMs
                    + " metadata_ms=" + metadataMs
                    + " total_ms=" + totalMs
                    + " size_bytes=" + file.content.length
                    + " recipients=" + resolvedRecipients.size()
            );

            Object expiresAt = metadata.get("expires_at");
            String expiresAtStr = expiresAt instanceof Date ? ((Date) expiresAt).toInstant().toString() : String.valueOf(expiresAt);

            return new Response(200, mapOf(
                "success", true,
                "message", "File encrypted successfully",
                "file_id", fileId,
                "filename", originalFilename,
                "encrypted_filename", metadata.get("encrypted_filename"),
                "recipients", resolvedRecipients,
                "encryption_type", encType,
                "expires_at", expiresAtStr
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Encryption failed", "details", e.getMessage()));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/encrypt/decrypt/{file_id}
     */
    public FileResponse decryptFile(String username, String fileId) {
        String stage = "start";
        try {
            stage = "db_check";
            if (db == null) {
                return new FileResponse(503, mapOf("error", "Database not available"), null, null, null, null);
            }

            stage = "parse_id";
            ObjectId objectId;
            try {
                objectId = new ObjectId(fileId);
            } catch (Exception e) {
                Log.warn("DECRYPT", "invalid_id", "fileId=" + fileId + " user=" + username);
                return new FileResponse(500, mapOf("error", "Failed to retrieve file metadata"), null, null, null, null);
            }

            stage = "metadata_lookup";
            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document fileMetadata = filesCollection.find(Filters.eq("_id", objectId)).first();
            if (fileMetadata == null) {
                Log.warn("DECRYPT", "metadata_missing", "fileId=" + fileId + " user=" + username);
                return new FileResponse(404, mapOf("error", "File not found"), null, null, null, null);
            }

            Object sender = fileMetadata.get("sender");
            boolean allowed = sender != null && sender.toString().equals(username);
            Object recipients = fileMetadata.get("recipients");
            if (!allowed && recipients instanceof List) {
                for (Object r : (List<?>) recipients) {
                    if (r != null && r.toString().equals(username)) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (!allowed) {
                Log.warn("DECRYPT", "access_denied", "fileId=" + fileId + " user=" + username);
                return new FileResponse(403, mapOf("error", "Access denied - not authorized to decrypt this file"), null, null, null, null);
            }

            Object expiresAtObj = fileMetadata.get("expires_at");
            if (expiresAtObj != null) {
                if (!(expiresAtObj instanceof Date)) {
                    throw new IllegalStateException("Invalid expires_at type");
                }
                if (new Date().after((Date) expiresAtObj)) {
                    return new FileResponse(410, mapOf("error", "File has expired"), null, null, null, null);
                }
            }

            Object selfDestructObj = fileMetadata.get("self_destruct");
            if (Boolean.TRUE.equals(selfDestructObj)) {
                Object downloadCountObj = fileMetadata.getOrDefault("download_count", 0);
                if (!(downloadCountObj instanceof Number)) {
                    throw new IllegalStateException("Invalid download_count type");
                }
                if (((Number) downloadCountObj).intValue() > 0) {
                    return new FileResponse(410, mapOf("error", "File has self-destructed after first download"), null, null, null, null);
                }
            }

            String gridfsId = fileMetadata.containsKey("encrypted_file_gridfs_id")
                ? String.valueOf(fileMetadata.get("encrypted_file_gridfs_id"))
                : null;

            if (gridfsId == null) {
                Log.error("DECRYPT", "gridfs_missing", "fileId=" + fileId + " user=" + username);
                return new FileResponse(404, mapOf("error", "Encrypted file not found"), null, null, null, null);
            }

            stage = "gridfs_download";
            byte[] encryptedBytes;
            try {
                GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                bucket.downloadToStream(new ObjectId(gridfsId), output);
                encryptedBytes = output.toByteArray();
            } catch (Exception e) {
                Log.error("DECRYPT", "gridfs_download", "fileId=" + fileId + " user=" + username + " error=" + e.getMessage());
                return new FileResponse(404, mapOf("error", "Encrypted file not found in GridFS"), null, null, null, null);
            }

            stage = "wrapped_key";
            Map<String, String> wrappedKeys = extractWrappedKeys(fileMetadata.get("wrapped_keys"));
            String userWrappedKey = findWrappedKeyForIdentity(wrappedKeys, username);

            if (userWrappedKey == null) {
                userWrappedKey = recoverWrappedKeyFromSender(fileMetadata, wrappedKeys, username, fileId, objectId, filesCollection);
            }

            if (userWrappedKey == null) {
                Object legacyKey = fileMetadata.get("encrypted_aes_key");
                if (legacyKey != null) {
                    userWrappedKey = String.valueOf(legacyKey);
                }
            }

            if (userWrappedKey == null) {
                Log.error("DECRYPT", "wrapped_key_missing", "fileId=" + fileId + " user=" + username);
                return new FileResponse(404, mapOf("error", "Encryption key not found"), null, null, null, null);
            }

            stage = "metadata_iv_tag";
            String ivHex = String.valueOf(fileMetadata.get("iv"));
            String authTagHex = fileMetadata.get("auth_tag") != null ? String.valueOf(fileMetadata.get("auth_tag")) : null;
            String tagFallback = fileMetadata.get("tag") != null ? String.valueOf(fileMetadata.get("tag")) : null;
            String tagHex = authTagHex != null && !authTagHex.isEmpty()
                ? authTagHex
                : (isHexString(tagFallback) ? tagFallback : null);
            if (ivHex == null || ivHex.isEmpty() || tagHex == null || tagHex.isEmpty()) {
                Log.error("DECRYPT", "metadata_missing", "fileId=" + fileId + " user=" + username + " iv=" + ivHex + " auth_tag=" + authTagHex + " tag=" + tagFallback);
                return new FileResponse(500, mapOf("error", "Missing encryption metadata"), null, null, null, null);
            }

            stage = "decrypt_bytes";
            Map<String, Object> result = cryptoService.decryptBytes(encryptedBytes, username, userWrappedKey, ivHex, tagHex);
            if (!Boolean.TRUE.equals(result.get("success"))) {
                Log.error("DECRYPT", "decrypt_failed", "fileId=" + fileId + " user=" + username + " error=" + result.get("error"));
                return new FileResponse(500, mapOf("error", result.getOrDefault("error", "Decryption failed")), null, null, null, null);
            }

            byte[] decryptedBytes = (byte[]) result.get("plaintext");

            try {
                filesCollection.updateOne(
                    Filters.eq("_id", objectId),
                    new Document("$inc", new Document("download_count", 1))
                        .append("$set", new Document("last_accessed", new Date()))
                );

                if (Boolean.TRUE.equals(selfDestructObj)) {
                    filesCollection.updateOne(
                        Filters.eq("_id", objectId),
                        new Document("$set", new Document("status", "deleted"))
                    );
                    try {
                        GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                        bucket.delete(new ObjectId(gridfsId));
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception ignored) {
                // preserve behavior
            }

            String originalFilename = String.valueOf(fileMetadata.getOrDefault("original_filename", "decrypted_file"));
            return new FileResponse(200, null, null, originalFilename, "application/octet-stream", decryptedBytes);
        } catch (Exception e) {
            Log.error("DECRYPT", "exception", "fileId=" + fileId + " user=" + username + " stage=" + stage + " error=" + e.getMessage());
            return new FileResponse(500, mapOf("error", "Decryption failed", "stage", stage), null, null, null, null);
        }
    }

    private static String normalizeProcessingMode(String processingMode) {
        String mode = processingMode != null ? processingMode.trim().toLowerCase() : "auto";
        return "manual".equals(mode) ? "manual" : "auto";
    }

    private static String resolveEncryptionType(String processingMode, String requestedType, int fileSizeBytes) {
        if (!"manual".equals(processingMode)) {
            return fileSizeBytes > 0 && fileSizeBytes < AUTO_AES_128_MAX_BYTES ? "AES-128" : "AES-256";
        }
        return requestedType != null && !requestedType.isEmpty() ? requestedType : "AES-256";
    }

    private static int resolveExpiryDays(String processingMode, Integer expiryDays, String filename) {
        if (!"manual".equals(processingMode)) {
            if (expiryDays != null) {
                return expiryDays;
            }
            String tag = tagFromFilename(filename);
            switch (tag) {
                case "image":
                case "video":
                    return 7;
                case "pdf":
                case "word":
                case "excel":
                    return 14;
                case "archive":
                    return 5;
                default:
                    return 3;
            }
        }
        return expiryDays != null ? expiryDays : 7;
    }

    private static boolean resolveSelfDestruct(String processingMode, Boolean selfDestruct, List<String> recipients) {
        if (!"manual".equals(processingMode)) {
            if (selfDestruct != null) {
                return selfDestruct;
            }
            int count = recipients != null ? recipients.size() : 0;
            return count >= 2;
        }
        return selfDestruct != null ? selfDestruct : false;
    }

    private static String resolveTag(String processingMode, String manualTag, String filename) {
        if (!"manual".equals(processingMode)) {
            return tagFromFilename(filename);
        }
        return manualTag != null && !manualTag.trim().isEmpty() ? manualTag.trim() : "General";
    }

    private static String tagFromFilename(String filename) {
        String ext = fileExtension(filename);
        switch (ext) {
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
                return "image";
            case "mp4":
            case "mkv":
            case "avi":
            case "mov":
                return "video";
            case "mp3":
            case "wav":
            case "flac":
                return "audio";
            case "pdf":
                return "pdf";
            case "doc":
            case "docx":
                return "word";
            case "xls":
            case "xlsx":
                return "excel";
            case "zip":
            case "rar":
            case "7z":
                return "archive";
            default:
                return "file";
        }
    }

    private static String fileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return filename.substring(dot + 1).trim().toLowerCase();
    }

    private static String secureFilename(String filename) {
        if (filename == null) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(filename, java.text.Normalizer.Form.NFKD)
            .replaceAll("[^\\p{ASCII}]", "");
        String replaced = normalized.replaceAll("[\\s]+", "_")
            .replaceAll("[^A-Za-z0-9_.-]", "");
        String cleaned = replaced.replaceAll("^[._]+|[._]+$", "");
        return cleaned.isEmpty() ? "file" : cleaned;
    }

    private static boolean isUnsafeFilename(String filename) {
        if (filename == null || filename.length() > 255) {
            return true;
        }
        return filename.contains("..")
            || filename.contains("/")
            || filename.contains("\\")
            || filename.indexOf('\u0000') >= 0;
    }

    private static boolean isBlockedContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        return contentType.equals("application/x-msdownload")
            || contentType.equals("application/x-dosexec")
            || contentType.equals("application/x-msi")
            || contentType.equals("application/x-bat")
            || contentType.equals("application/x-sh")
            || contentType.equals("text/x-shellscript")
            || contentType.equals("application/x-powershell")
            || contentType.equals("application/java-archive");
    }

    private static String detectSignatureType(byte[] content) {
        if (content == null || content.length < 4) {
            return "unknown";
        }
        if (content.length >= 2 && content[0] == 'M' && content[1] == 'Z') {
            return "exe";
        }
        if (content.length >= 4
            && content[0] == '%'
            && content[1] == 'P'
            && content[2] == 'D'
            && content[3] == 'F') {
            return "pdf";
        }
        if ((content[0] & 0xFF) == 0x89 && content[1] == 'P' && content[2] == 'N' && content[3] == 'G') {
            return "image/png";
        }
        if ((content[0] & 0xFF) == 0xFF && (content[1] & 0xFF) == 0xD8 && (content[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (content.length >= 12
            && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
            && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') {
            return "image/webp";
        }
        if (content.length >= 4 && content[0] == 'P' && content[1] == 'K' && (content[2] & 0xFF) == 0x03 && (content[3] & 0xFF) == 0x04) {
            return "zip";
        }
        if (content.length >= 2 && content[0] == '#' && content[1] == '!') {
            return "script";
        }
        return "unknown";
    }

    private static boolean isMimeCompatibleWithSignature(String contentType, String signatureType) {
        if (contentType == null || contentType.isBlank() || "unknown".equals(signatureType)) {
            return true;
        }
        if ("pdf".equals(signatureType)) {
            return "application/pdf".equals(contentType);
        }
        if ("image/png".equals(signatureType) || "image/jpeg".equals(signatureType) || "image/webp".equals(signatureType)) {
            return contentType.equals(signatureType)
                || ("image/jpeg".equals(signatureType) && "image/jpg".equals(contentType));
        }
        if ("zip".equals(signatureType)) {
            return contentType.equals("application/zip") || contentType.equals("application/x-zip-compressed") || contentType.equals("application/octet-stream");
        }
        return true;
    }

    private List<String> normalizeRecipientsAndEnsureKeys(List<String> recipients, String senderUsername) {
        List<String> resolved = new ArrayList<>();
        if (recipients == null || recipients.isEmpty()) {
            return resolved;
        }

        Set<String> seen = new HashSet<>();
        MongoCollection<Document> usersCollection = db != null ? db.getCollection("users") : null;

        for (String rawRecipient : recipients) {
            String candidate = rawRecipient != null ? rawRecipient.trim() : "";
            if (candidate.isEmpty()) {
                continue;
            }

            String resolvedRecipient = resolveRecipientUsername(usersCollection, candidate);
            String dedupeKey = normalizeIdentity(resolvedRecipient);
            if (!seen.add(dedupeKey)) {
                continue;
            }

            resolved.add(resolvedRecipient);

            if (usersCollection != null) {
                Document userDoc = usersCollection.find(Filters.eq("username", resolvedRecipient)).first();
                if (userDoc != null) {
                    boolean keysReady = cryptoService.ensureUserKeys(resolvedRecipient);
                    if (!keysReady) {
                        Log.warn("ENCRYPT", "recipient_keys", "failed sender=" + senderUsername + " recipient=" + resolvedRecipient);
                    }
                } else {
                    Log.warn("ENCRYPT", "recipient_not_found", "sender=" + senderUsername + " recipient=" + candidate);
                }
            }
        }

        return resolved;
    }

    private String resolveRecipientUsername(MongoCollection<Document> usersCollection, String recipient) {
        if (recipient == null) {
            return "";
        }

        String trimmed = recipient.trim();
        if (trimmed.isEmpty() || usersCollection == null) {
            return trimmed;
        }

        Document userDoc = usersCollection.find(Filters.eq("username", trimmed)).first();
        if (userDoc == null) {
            String lowered = trimmed.toLowerCase(Locale.ROOT);
            if (!lowered.equals(trimmed)) {
                userDoc = usersCollection.find(Filters.eq("username", lowered)).first();
            }
        }
        if (userDoc == null && trimmed.contains("@")) {
            String loweredEmail = trimmed.toLowerCase(Locale.ROOT);
            userDoc = usersCollection.find(Filters.eq("email", loweredEmail)).first();
        }

        String canonicalUsername = userDoc != null ? asNonBlank(userDoc.get("username")) : null;
        return canonicalUsername != null ? canonicalUsername : trimmed;
    }

    private Map<String, String> extractWrappedKeys(Object wrappedKeysObj) {
        Map<String, String> wrappedKeys = new LinkedHashMap<>();

        if (wrappedKeysObj instanceof Document) {
            Document wrappedDoc = (Document) wrappedKeysObj;
            for (Map.Entry<String, Object> entry : wrappedDoc.entrySet()) {
                if (entry.getKey() == null || entry.getValue() == null) {
                    continue;
                }
                String value = String.valueOf(entry.getValue());
                if (!value.isBlank()) {
                    wrappedKeys.put(entry.getKey(), value);
                }
            }
            return wrappedKeys;
        }

        if (wrappedKeysObj instanceof Map) {
            Map<?, ?> wrappedMap = (Map<?, ?>) wrappedKeysObj;
            for (Map.Entry<?, ?> entry : wrappedMap.entrySet()) {
                if (entry.getKey() == null || entry.getValue() == null) {
                    continue;
                }
                String key = String.valueOf(entry.getKey());
                String value = String.valueOf(entry.getValue());
                if (!key.isBlank() && !value.isBlank()) {
                    wrappedKeys.put(key, value);
                }
            }
        }

        return wrappedKeys;
    }

    private String findWrappedKeyForIdentity(Map<String, String> wrappedKeys, String identity) {
        if (wrappedKeys == null || wrappedKeys.isEmpty() || identity == null) {
            return null;
        }

        String trimmed = identity.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        String direct = wrappedKeys.get(trimmed);
        if (direct != null && !direct.isBlank()) {
            return direct;
        }

        String normalizedIdentity = normalizeIdentity(trimmed);
        for (Map.Entry<String, String> entry : wrappedKeys.entrySet()) {
            if (normalizedIdentity.equals(normalizeIdentity(entry.getKey()))) {
                String value = entry.getValue();
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }

        return null;
    }

    private String recoverWrappedKeyFromSender(Document fileMetadata,
                                               Map<String, String> wrappedKeys,
                                               String username,
                                               String fileId,
                                               ObjectId objectId,
                                               MongoCollection<Document> filesCollection) {
        String sender = asNonBlank(fileMetadata.get("sender"));
        if (sender == null) {
            return null;
        }

        String senderWrappedKey = findWrappedKeyForIdentity(wrappedKeys, sender);
        if (senderWrappedKey == null) {
            return null;
        }

        String recoveredWrappedKey = cryptoService.rewrapKeyForRecipient(sender, senderWrappedKey, username);
        if (recoveredWrappedKey == null || recoveredWrappedKey.isBlank()) {
            return null;
        }

        Map<String, Object> persistedWrappedKeys = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : wrappedKeys.entrySet()) {
            persistedWrappedKeys.put(entry.getKey(), entry.getValue());
        }
        persistedWrappedKeys.put(username, recoveredWrappedKey);

        try {
            filesCollection.updateOne(
                Filters.eq("_id", objectId),
                new Document("$set", new Document("wrapped_keys", new Document(persistedWrappedKeys))
                    .append("updated_at", new Date()))
            );
        } catch (Exception e) {
            Log.warn("DECRYPT", "wrapped_key_recover_persist_failed", "fileId=" + fileId + " user=" + username + " error=" + e.getMessage());
        }

        Log.info("DECRYPT", "wrapped_key_recovered", "fileId=" + fileId + " user=" + username + " sender=" + sender);
        return recoveredWrappedKey;
    }

    private static String normalizeIdentity(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String asNonBlank(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private void addContact(String ownerUsername, String contactUsername, String contactEmail, String contactFullName) {
        try {
            MongoCollection<Document> contacts = db.getCollection("contacts");
            Document existing = contacts.find(new Document("owner_username", ownerUsername)
                .append("contact_username", contactUsername)).first();
            if (existing != null) {
                return;
            }
            Document doc = new Document()
                .append("owner_username", ownerUsername)
                .append("contact_username", contactUsername)
                .append("contact_email", contactEmail)
                .append("contact_full_name", contactFullName)
                .append("nickname", null)
                .append("notes", "")
                .append("tags", new ArrayList<>())
                .append("is_favorite", false)
                .append("shared_files_count", 0)
                .append("last_shared_at", null)
                .append("added_at", new Date())
                .append("updated_at", new Date());
            contacts.insertOne(doc);
        } catch (Exception ignored) {
            // preserve behavior
        }
    }

    private void updateContactShareStats(String ownerUsername, String contactUsername) {
        try {
            MongoCollection<Document> contacts = db.getCollection("contacts");
            contacts.updateOne(
                new Document("owner_username", ownerUsername).append("contact_username", contactUsername),
                new Document("$inc", new Document("shared_files_count", 1))
                    .append("$set", new Document("last_shared_at", new Date())
                        .append("updated_at", new Date())),
                new com.mongodb.client.model.UpdateOptions().upsert(true)
            );
        } catch (Exception ignored) {
        }
    }

    private void logActivity(String username, String action, String fileId, String fileName,
                             String targetUser, boolean success, String errorMessage, Map<String, Object> details) {
        try {
            MongoCollection<Document> activity = db.getCollection("activity_logs");
            Document log = new Document()
                .append("username", username)
                .append("action", action)
                .append("file_id", fileId)
                .append("file_name", fileName)
                .append("target_user", targetUser)
                .append("ip_address", null)
                .append("user_agent", null)
                .append("timestamp", new Date())
                .append("details", details != null ? details : new Document())
                .append("success", success)
                .append("error_message", errorMessage);
            activity.insertOne(log);
        } catch (Exception ignored) {
        }
    }

    private void createNotification(String username, String type, String title, String message,
                                    String fileId, String fromUser, String actionUrl, String priority) {
        try {
            MongoCollection<Document> notifications = db.getCollection("notifications");
            Document doc = new Document()
                .append("username", username)
                .append("type", type)
                .append("title", title)
                .append("message", message)
                .append("file_id", fileId)
                .append("from_user", fromUser)
                .append("is_read", false)
                .append("read_at", null)
                .append("created_at", new Date())
                .append("action_url", actionUrl)
                .append("priority", priority);
            notifications.insertOne(doc);
        } catch (Exception ignored) {
        }
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }

    private static boolean isHexString(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || (trimmed.length() % 2 != 0)) {
            return false;
        }
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            boolean hex = (c >= '0' && c <= '9')
                || (c >= 'a' && c <= 'f')
                || (c >= 'A' && c <= 'F');
            if (!hex) {
                return false;
            }
        }
        return true;
    }
}
