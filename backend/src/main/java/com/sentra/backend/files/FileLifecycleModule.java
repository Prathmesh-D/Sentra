package com.sentra.backend.files;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.sentra.backend.runtime.Log;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

import com.sentra.backend.runtime.JsonUtil;

public class FileLifecycleModule {
    private final MongoDatabase db;
    private static final String GRIDFS_BUCKET = "encrypted_files";
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PER_PAGE = 20;
    private static final int MAX_PER_PAGE = 100;
    private static final int MIN_PAGE = 1;
    private static final int MAX_PAGE = 100000;
    private static final int MIN_EXTEND_DAYS = 1;
    private static final int MAX_EXTEND_DAYS = 365;

    public FileLifecycleModule(MongoDatabase db) {
        this.db = db;
        ensureIndexes();
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

    // =====================================================================
    // Route Handlers (files.py)
    // =====================================================================

    /**
     * [PRESERVED]
     * GET /api/files/inbox
     */
    public Response getInbox(String username, Integer page, Integer perPage, String filterTag, String sortBy) {
        try {
            int pageNumber = normalizePage(page);
            int perPageValue = normalizePerPage(perPage);
            String sortField = (sortBy == null || sortBy.isEmpty() || "date".equals(sortBy)) ? "created_at" : sortBy;

            if (db == null) {
                return new Response(500, mapOf(
                    "files", new ArrayList<>(),
                    "total", 0,
                    "page", pageNumber,
                    "per_page", perPageValue,
                    "error", "Database not available"
                ));
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document exactQuery = new Document("recipients", username)
                .append("status", new Document("$ne", "deleted"));

            Document query = exactQuery;

            if (filterTag != null && !filterTag.isEmpty()) {
                exactQuery.append("tag", filterTag);
            }

            int skipCount = Math.max(0, (pageNumber - 1) * perPageValue);
            long total = filesCollection.countDocuments(exactQuery);
            if (total == 0) {
                Pattern recipientPattern = Pattern.compile("(^|[\\[\\\",\\s])" + Pattern.quote(username) + "($|[\\]\\\",\\s])");
                Document regexQuery = new Document("recipients", new Document("$regex", recipientPattern))
                    .append("status", new Document("$ne", "deleted"));
                if (filterTag != null && !filterTag.isEmpty()) {
                    regexQuery.append("tag", filterTag);
                }
                query = regexQuery;
                total = filesCollection.countDocuments(query);
            }

            FindIterable<Document> cursor = filesCollection.find(query)
                .sort(Sorts.descending(sortField))
                .skip(skipCount)
                .limit(perPageValue);

            List<Map<String, Object>> files = new ArrayList<>();
            for (Document doc : cursor) {
                Object id = doc.get("_id");
                doc.remove("_id");
                doc.put("id", id != null ? id.toString() : null);
                List<String> normalizedRecipients = normalizeRecipients(doc.get("recipients"));
                doc.put("recipients", normalizedRecipients);
                doc.put("created_at", normalizeDate(doc.get("created_at")));
                doc.put("expires_at", normalizeDate(doc.get("expires_at")));
                Log.debug("FILES", "outbox", "file=" + id + " recipients=" + normalizedRecipients.size());
                files.add(doc);
            }

            return new Response(200, mapOf(
                "files", files,
                "total", total,
                "page", pageNumber,
                "per_page", perPageValue
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to fetch inbox"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/files/outbox
     */
    public Response getOutbox(String username, Integer page, Integer perPage, String filterTag, String sortBy) {
        try {
            int pageNumber = normalizePage(page);
            int perPageValue = normalizePerPage(perPage);
            String sortField = (sortBy == null || sortBy.isEmpty() || "date".equals(sortBy)) ? "created_at" : sortBy;

            if (db == null) {
                return new Response(500, mapOf(
                    "files", new ArrayList<>(),
                    "total", 0,
                    "page", pageNumber,
                    "per_page", perPageValue,
                    "error", "Database not available"
                ));
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document query = new Document()
                .append("sender", username)
                .append("status", new Document("$ne", "deleted"));

            if (filterTag != null && !filterTag.isEmpty()) {
                query.append("tag", filterTag);
            }

            int skipCount = Math.max(0, (pageNumber - 1) * perPageValue);
            FindIterable<Document> cursor = filesCollection.find(query)
                .sort(Sorts.descending(sortField))
                .skip(skipCount)
                .limit(perPageValue);

            long total = filesCollection.countDocuments(query);

            List<Map<String, Object>> files = new ArrayList<>();
            for (Document doc : cursor) {
                Object id = doc.get("_id");
                doc.remove("_id");
                doc.put("id", id != null ? id.toString() : null);
                List<String> normalizedRecipients = normalizeRecipients(doc.get("recipients"));
                doc.put("recipients", normalizedRecipients);
                doc.put("created_at", normalizeDate(doc.get("created_at")));
                doc.put("expires_at", normalizeDate(doc.get("expires_at")));
                Log.debug("FILES", "inbox", "file=" + id + " recipients=" + normalizedRecipients.size());
                files.add(doc);
            }

            return new Response(200, mapOf(
                "files", files,
                "total", total,
                "page", pageNumber,
                "per_page", perPageValue
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to fetch outbox"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/files/{file_id}
     */
    public Response getFileDetails(String fileId) {
        try {
            return new Response(200, mapOf(
                "file_id", fileId,
                "status", "pending_database_integration"
            ));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to get file details"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/files/{file_id}/download
     */
    public FileResponse downloadFile(String username, String fileId) {
        try {
            if (db == null) {
                return new FileResponse(500, mapOf("error", "Database not available"), null, null, null, null);
            }

            ObjectId objectId;
            try {
                objectId = new ObjectId(fileId);
            } catch (Exception e) {
                return new FileResponse(400, mapOf("error", "Invalid file ID"), null, null, null, null);
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document fileDoc = filesCollection.find(Filters.eq("_id", objectId)).first();

            if (fileDoc == null) {
                return new FileResponse(404, mapOf("error", "File not found"), null, null, null, null);
            }

            Object recipients = fileDoc.get("recipients");
            Object sender = fileDoc.get("sender");
            boolean allowed = false;
            if (sender != null && sender.toString().equals(username)) {
                allowed = true;
            } else if (recipients instanceof List) {
                for (Object r : (List<?>) recipients) {
                    if (r != null && r.toString().equals(username)) {
                        allowed = true;
                        break;
                    }
                }
            }

            if (!allowed) {
                return new FileResponse(403, mapOf("error", "Permission denied"), null, null, null, null);
            }

            String gridfsId = fileDoc.containsKey("encrypted_file_gridfs_id")
                ? String.valueOf(fileDoc.get("encrypted_file_gridfs_id"))
                : null;

            if (gridfsId == null) {
                return new FileResponse(404, mapOf("error", "File not available for download"), null, null, null, null);
            }

            byte[] encryptedBytes;
            try {
                GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
                bucket.downloadToStream(new ObjectId(gridfsId), output);
                encryptedBytes = output.toByteArray();
            } catch (Exception e) {
                return new FileResponse(404, mapOf("error", "File not available for download"), null, null, null, null);
            }

            String downloadName = String.valueOf(fileDoc.getOrDefault("original_filename", "file.enc"));
            FileResponse response = new FileResponse(200, null, null, downloadName, "application/octet-stream", encryptedBytes);

            if (Boolean.TRUE.equals(fileDoc.get("self_destruct"))) {
                filesCollection.updateOne(
                    Filters.eq("_id", objectId),
                    new Document("$set", new Document("status", "deleted")
                        .append("deleted_at", new Date()))
                );

                if (gridfsId != null) {
                    try {
                        GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                        bucket.delete(new ObjectId(gridfsId));
                    } catch (Exception ignored) {
                    }
                }
            }

            filesCollection.updateOne(
                Filters.eq("_id", objectId),
                new Document("$inc", new Document("download_count", 1))
            );

            return response;

        } catch (Exception e) {
            return new FileResponse(500, mapOf("error", "Failed to download file"), null, null, null, null);
        }
    }

    /**
     * [PRESERVED]
     * DELETE /api/files/{file_id}
     */
    public Response deleteFile(String username, String fileId) {
        try {
            if (db == null) {
                return new Response(500, mapOf("error", "Database not available"));
            }

            ObjectId objectId;
            try {
                objectId = new ObjectId(fileId);
            } catch (Exception e) {
                return new Response(400, mapOf("error", "Invalid file ID"));
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document fileDoc = filesCollection.find(Filters.eq("_id", objectId)).first();

            if (fileDoc == null) {
                return new Response(404, mapOf("error", "File not found"));
            }

            Object sender = fileDoc.get("sender");
            if (sender == null || !sender.toString().equals(username)) {
                return new Response(403, mapOf("error", "Permission denied"));
            }

            filesCollection.updateOne(
                Filters.eq("_id", objectId),
                new Document("$set", new Document("status", "deleted")
                    .append("deleted_at", new Date()))
            );

            Object encryptedFilePathObj = fileDoc.get("encrypted_file_path");
            if (encryptedFilePathObj != null) {
                tryDeleteFile(String.valueOf(encryptedFilePathObj));
            }

            Object gridfsIdObj = fileDoc.get("encrypted_file_gridfs_id");
            if (gridfsIdObj != null) {
                try {
                    GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                    bucket.delete(new ObjectId(String.valueOf(gridfsIdObj)));
                } catch (Exception ignored) {
                }
            }

            Object metadataFileObj = fileDoc.get("metadata_file");
            if (metadataFileObj != null) {
                tryDeleteFile(String.valueOf(metadataFileObj));
            }

            logActivity(username, "deleted", fileId, String.valueOf(fileDoc.get("original_filename")), null, true, null, null);

            return new Response(200, mapOf(
                "message", "File deleted successfully",
                "file_id", fileId
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to delete file"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/files/{file_id}/extend
     */
    public Response extendExpiry(String username, String fileId, Map<String, Object> data) {
        try {
            if (db == null) {
                return new Response(500, mapOf("error", "Database not available"));
            }

            ObjectId objectId;
            try {
                objectId = new ObjectId(fileId);
            } catch (Exception e) {
                return new Response(400, mapOf("error", "Invalid file ID"));
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            Document fileDoc = filesCollection.find(Filters.eq("_id", objectId)).first();

            if (fileDoc == null) {
                return new Response(404, mapOf("error", "File not found"));
            }

            Object sender = fileDoc.get("sender");
            if (sender == null || !sender.toString().equals(username)) {
                return new Response(403, mapOf("error", "Permission denied"));
            }

            int days = 7;
            if (data != null && data.containsKey("days")) {
                Object daysObj = data.get("days");
                if (daysObj instanceof Number) {
                    days = ((Number) daysObj).intValue();
                } else {
                    try {
                        days = Integer.parseInt(String.valueOf(daysObj));
                    } catch (Exception ignored) {
                        return new Response(400, mapOf("error", "Invalid days value"));
                    }
                }
            }

            if (days < MIN_EXTEND_DAYS || days > MAX_EXTEND_DAYS) {
                return new Response(400, mapOf("error", "days must be between " + MIN_EXTEND_DAYS + " and " + MAX_EXTEND_DAYS));
            }

            Object currentExpiryObj = fileDoc.get("expires_at");
            Date currentExpiry;
            if (currentExpiryObj instanceof Date) {
                currentExpiry = (Date) currentExpiryObj;
            } else if (currentExpiryObj instanceof String) {
                currentExpiry = parseIsoDate(String.valueOf(currentExpiryObj));
            } else {
                throw new IllegalStateException("Invalid expires_at type");
            }

            Date newExpiry = Date.from(Instant.ofEpochMilli(currentExpiry.getTime()).plusSeconds(days * 86400L));

            filesCollection.updateOne(
                Filters.eq("_id", objectId),
                new Document("$set", new Document("expires_at", newExpiry)
                    .append("updated_at", new Date()))
            );

            logActivity(username, "extended", fileId, String.valueOf(fileDoc.get("original_filename")), null, true, null,
                mapOf("extended_days", days, "new_expiry", toIsoString(newExpiry))
            );

            return new Response(200, mapOf(
                "message", "Expiry extended successfully",
                "file_id", fileId,
                "extended_days", days,
                "new_expiry", toIsoString(newExpiry)
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to extend expiry"));
        }
    }

    // =====================================================================
    // Cleanup Service (cleanup_service.py)
    // =====================================================================

    /**
     * [PRESERVED]
     */
    public int cleanupExpiredFiles() {
        try {
            if (db == null) {
                return 0;
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            FindIterable<Document> expiredFiles = filesCollection.find(new Document()
                .append("status", "active")
                .append("expires_at", new Document("$lt", new Date()))
            );

            int cleanedCount = 0;
            for (Document fileDoc : expiredFiles) {
                try {
                    Object id = fileDoc.get("_id");

                    filesCollection.updateOne(
                        Filters.eq("_id", id),
                        new Document("$set", new Document("status", "expired")
                            .append("expired_at", new Date()))
                    );

                    Object encryptedFilePathObj = fileDoc.get("encrypted_file_path");
                    if (encryptedFilePathObj != null) {
                        tryDeleteFile(String.valueOf(encryptedFilePathObj));
                    }

                    Object gridfsIdObj = fileDoc.get("encrypted_file_gridfs_id");
                    if (gridfsIdObj != null) {
                        try {
                            GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                            bucket.delete(new ObjectId(String.valueOf(gridfsIdObj)));
                        } catch (Exception ignored) {
                        }
                    }

                    Object metadataFileObj = fileDoc.get("metadata_file");
                    if (metadataFileObj != null) {
                        tryDeleteFile(String.valueOf(metadataFileObj));
                    }

                    cleanedCount += 1;
                } catch (Exception ignored) {
                    // preserve behavior
                }
            }

            return cleanedCount;

        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * [PRESERVED]
     */
    public int cleanupDeletedFiles() {
        try {
            if (db == null) {
                return 0;
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            FindIterable<Document> deletedFiles = filesCollection.find(new Document("status", "deleted"));

            int cleanedCount = 0;
            for (Document fileDoc : deletedFiles) {
                try {
                    Object encryptedFilePathObj = fileDoc.get("encrypted_file_path");
                    if (encryptedFilePathObj != null) {
                        tryDeleteFile(String.valueOf(encryptedFilePathObj));
                    }

                    Object gridfsIdObj = fileDoc.get("encrypted_file_gridfs_id");
                    if (gridfsIdObj != null) {
                        try {
                            GridFSBucket bucket = GridFSBuckets.create(db, GRIDFS_BUCKET);
                            bucket.delete(new ObjectId(String.valueOf(gridfsIdObj)));
                        } catch (Exception ignored) {
                        }
                    }

                    Object metadataFileObj = fileDoc.get("metadata_file");
                    if (metadataFileObj != null) {
                        tryDeleteFile(String.valueOf(metadataFileObj));
                    }

                    filesCollection.deleteOne(Filters.eq("_id", fileDoc.get("_id")));
                    cleanedCount += 1;
                } catch (Exception ignored) {
                    // preserve behavior
                }
            }

            return cleanedCount;

        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * [PRESERVED]
     */
    public long getTotalStorageUsed(String username) {
        try {
            if (db == null) {
                return 0;
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");
            List<Document> result = new ArrayList<>();

            for (Document doc : filesCollection.aggregate(Arrays.asList(
                new Document("$match", new Document()
                    .append("sender", username)
                    .append("status", new Document("$in", Arrays.asList("active", "expired")))
                ),
                new Document("$group", new Document("_id", null)
                    .append("total_size", new Document("$sum", "$file_size")))
            ))) {
                result.add(doc);
            }

            if (!result.isEmpty()) {
                Object totalSize = result.get(0).get("total_size");
                if (totalSize instanceof Number) {
                    return ((Number) totalSize).longValue();
                }
                return 0;
            }

            return 0;

        } catch (Exception e) {
            return 0;
        }
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private void logActivity(String username, String action, String fileId, String fileName,
                             String targetUser, boolean success, String errorMessage, Map<String, Object> details) {
        try {
            if (db == null) {
                return;
            }

            MongoCollection<Document> activityLogs = db.getCollection("activity_logs");
            Document logDoc = new Document()
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

            activityLogs.insertOne(logDoc);
        } catch (Exception ignored) {
            // preserve behavior
        }
    }

    private static void tryDeleteFile(String path) {
        try {
            if (path != null && Files.exists(Path.of(path))) {
                Files.delete(Path.of(path));
            }
        } catch (Exception ignored) {
            // preserve behavior
        }
    }

    private static Date parseIsoDate(String value) {
        try {
            String normalized = value.replace("Z", "+00:00");
            OffsetDateTime odt = OffsetDateTime.parse(normalized);
            return Date.from(odt.toInstant());
        } catch (DateTimeParseException e) {
            throw new IllegalStateException("Invalid ISO date");
        }
    }

    private static String toIsoString(Date date) {
        return DateTimeFormatter.ISO_INSTANT.format(date.toInstant().atZone(ZoneOffset.UTC));
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }

    private static List<String> normalizeRecipients(Object raw) {
        List<String> recipients = new ArrayList<>();
        if (raw == null) {
            return recipients;
        }

        if (raw instanceof List) {
            for (Object item : (List<?>) raw) {
                String value = item != null ? item.toString().trim() : "";
                if (!value.isEmpty()) {
                    recipients.add(value);
                }
            }
            return recipients;
        }

        if (raw instanceof String) {
            String text = ((String) raw).trim();
            if (text.startsWith("[") && text.endsWith("]")) {
                try {
                    Object parsed = JsonUtil.parse(text);
                    if (parsed instanceof List) {
                        for (Object item : (List<?>) parsed) {
                            String value = item != null ? item.toString().trim() : "";
                            if (!value.isEmpty()) {
                                recipients.add(value);
                            }
                        }
                        return recipients;
                    }
                } catch (Exception ignored) {
                    // fall through to CSV parsing
                }
            }

            if (!text.isEmpty()) {
                for (String part : text.split(",")) {
                    String value = part.trim();
                    if (!value.isEmpty()) {
                        recipients.add(value);
                    }
                }
            }
            return recipients;
        }

        String value = raw.toString().trim();
        if (!value.isEmpty()) {
            recipients.add(value);
        }
        return recipients;
    }

    private static Object normalizeDate(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Date) {
            return Instant.ofEpochMilli(((Date) raw).getTime()).toString();
        }
        if (raw instanceof Instant) {
            return ((Instant) raw).toString();
        }
        return raw;
    }

    private void ensureIndexes() {
        if (db == null) {
            return;
        }
        try {
            MongoCollection<Document> files = db.getCollection("encrypted_files");
            files.createIndex(Indexes.compoundIndex(Indexes.ascending("sender"), Indexes.ascending("status"), Indexes.descending("created_at")));
            files.createIndex(Indexes.compoundIndex(Indexes.ascending("recipients"), Indexes.ascending("status"), Indexes.descending("created_at")));
            files.createIndex(Indexes.compoundIndex(Indexes.ascending("status"), Indexes.ascending("expires_at")));
            files.createIndex(Indexes.ascending("encrypted_file_gridfs_id"), new IndexOptions().sparse(true));

            MongoCollection<Document> users = db.getCollection("users");
            users.createIndex(Indexes.ascending("username"), new IndexOptions().unique(true));
            users.createIndex(Indexes.ascending("email"), new IndexOptions().unique(true));

            Log.info("DB", "indexes", "ensured encrypted_files/users indexes");
        } catch (Exception e) {
            Log.warn("DB", "indexes", "failed to ensure indexes: " + e.getMessage());
        }
    }

    private static int normalizePage(Integer page) {
        if (page == null) {
            return DEFAULT_PAGE;
        }
        if (page < MIN_PAGE) {
            return MIN_PAGE;
        }
        return Math.min(page, MAX_PAGE);
    }

    private static int normalizePerPage(Integer perPage) {
        if (perPage == null) {
            return DEFAULT_PER_PAGE;
        }
        if (perPage < 1) {
            return 1;
        }
        return Math.min(perPage, MAX_PER_PAGE);
    }
}
