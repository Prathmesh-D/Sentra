package com.sentra.backend.users;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Accumulators;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.UpdateOptions;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class UserStatsDashboardModule {
    private final MongoDatabase db;

    public UserStatsDashboardModule(MongoDatabase db) {
        this.db = db;
    }

    public static class Response {
        public final int statusCode;
        public final Map<String, Object> body;

        public Response(int statusCode, Map<String, Object> body) {
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    // =====================================================================
    // Route Handlers (users.py stats/dashboard only)
    // =====================================================================

    /**
     * [PRESERVED]
     * GET /api/users/statistics
     */
    public Response getStatistics(String username) {
        try {
            return new Response(200, mapOf(
                "total_encrypted", 0,
                "total_decrypted", 0,
                "storage_used", 0,
                "files_sent", 0,
                "files_received", 0,
                "status", "pending_database_integration"
            ));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to get statistics"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/users/stats?use_cache=true|false
     */
    public Response getStats(String username, boolean useCache) {
        try {
            if (useCache) {
                Document cachedStats = getCachedStatistics(username, 60);
                if (cachedStats != null) {
                    long totalFilesSent = getLongOrThrow(cachedStats.get("total_files_sent"), 0);
                    long totalFilesReceived = getLongOrThrow(cachedStats.get("total_files_received"), 0);
                    long totalStorageBytes = getLongOrThrow(cachedStats.get("total_storage_used_bytes"), 0);
                    long activeFiles = getLongOrThrow(cachedStats.get("active_files_count"), 0);
                    long expiredFiles = getLongOrThrow(cachedStats.get("expired_files_count"), 0);

                    return new Response(200, mapOf(
                        "files_sent", totalFilesSent,
                        "files_received", totalFilesReceived,
                        "sensitive_files", 0,
                        "storage_used_mb", roundTo(totalStorageBytes / (1024.0 * 1024.0), 2),
                        "storage_limit_mb", 100 * 1024,
                        "total_files", totalFilesSent + totalFilesReceived,
                        "active_files", activeFiles,
                        "expired_files", expiredFiles,
                        "cached", true
                    ));
                }
            }

            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");

            long filesSent = filesCollection.countDocuments(new Document()
                .append("sender", username)
                .append("status", "active")
            );

            long filesReceived = filesCollection.countDocuments(new Document()
                .append("recipients", username)
                .append("sender", new Document("$ne", username))
                .append("status", "active")
            );

            long sensitiveFiles = filesCollection.countDocuments(new Document()
                .append("sender", username)
                .append("self_destruct", true)
                .append("status", new Document("$in", Arrays.asList("active", "expired")))
            );

            long storageUsedBytes = getTotalStorageUsed(username);
            double storageUsedMb = storageUsedBytes / (1024.0 * 1024.0);
            long storageLimitMb = 1000;

            long totalFiles = filesCollection.countDocuments(new Document("$or", Arrays.asList(
                new Document("sender", username),
                new Document("recipients", username)
            )));

            long activeFiles = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("status", "active")
            );

            long expiredFiles = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("status", "expired")
            );

            return new Response(200, mapOf(
                "files_sent", filesSent,
                "files_received", filesReceived,
                "sensitive_files", sensitiveFiles,
                "storage_used_mb", roundTo(storageUsedMb, 2),
                "storage_limit_mb", storageLimitMb,
                "total_files", totalFiles,
                "active_files", activeFiles,
                "expired_files", expiredFiles
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to get statistics"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/users/dashboard
     */
    public Response getDashboard(String username) {
        try {
            MongoCollection<Document> filesCollection = db.getCollection("encrypted_files");

            long filesSent = filesCollection.countDocuments(new Document()
                .append("sender", username)
                .append("status", "active")
            );

            long filesReceived = filesCollection.countDocuments(new Document()
                .append("recipients", username)
                .append("sender", new Document("$ne", username))
                .append("status", "active")
            );

            long sensitiveFiles = filesCollection.countDocuments(new Document()
                .append("sender", username)
                .append("self_destruct", true)
                .append("status", new Document("$in", Arrays.asList("active", "expired")))
            );

            long storageUsedBytes = getTotalStorageUsed(username);
            double storageUsedMb = storageUsedBytes / (1024.0 * 1024.0);
            long storageLimitMb = 1000;

            long totalFiles = filesCollection.countDocuments(new Document("$or", Arrays.asList(
                new Document("sender", username),
                new Document("recipients", username)
            )));

            long activeFiles = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("status", "active")
            );

            long expiredFiles = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("status", "expired")
            );

            List<Map<String, Object>> recentActivity = new ArrayList<>();
            FindIterable<Document> recentFiles = filesCollection.find(new Document("$or", Arrays.asList(
                new Document("sender", username),
                new Document("recipients", username)
            ))).sort(Sorts.descending("created_at")).limit(10);

            for (Document fileDoc : recentFiles) {
                Object sender = fileDoc.get("sender");
                String action = (sender != null && sender.toString().equals(username)) ? "encrypted" : "shared";

                Object timestamp = fileDoc.containsKey("created_at") ? fileDoc.get("created_at") : "";
                String timestampStr = toIsoOrString(timestamp);

                Object status = fileDoc.get("status");
                String statusStr = (status != null && status.toString().equals("active")) ? "success" : "warning";

                Map<String, Object> activity = new HashMap<>();
                Object id = fileDoc.get("_id");
                activity.put("id", id != null ? id.toString() : null);
                activity.put("action", action);
                activity.put("file_name", fileDoc.getOrDefault("original_filename", "Unknown file"));
                activity.put("timestamp", timestampStr);
                activity.put("status", statusStr);

                recentActivity.add(activity);
            }

            long aes128Count = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("encryption_type", "AES-128")
                .append("status", "active")
            );

            long aes256Count = filesCollection.countDocuments(new Document()
                .append("$or", Arrays.asList(
                    new Document("sender", username),
                    new Document("recipients", username)
                ))
                .append("encryption_type", "AES-256")
                .append("status", "active")
            );

            long totalEncrypted = aes128Count + aes256Count;
            List<Map<String, Object>> encryptionBreakdown = new ArrayList<>();
            if (totalEncrypted > 0) {
                if (aes128Count > 0) {
                    encryptionBreakdown.add(mapOf(
                        "type", "AES-128",
                        "count", aes128Count,
                        "percentage", roundTo((aes128Count / (double) totalEncrypted) * 100.0, 1)
                    ));
                }
                if (aes256Count > 0) {
                    encryptionBreakdown.add(mapOf(
                        "type", "AES-256",
                        "count", aes256Count,
                        "percentage", roundTo((aes256Count / (double) totalEncrypted) * 100.0, 1)
                    ));
                }
            }

            List<Bson> fileTypePipeline = Arrays.asList(
                Aggregates.match(Filters.and(
                    Filters.or(
                        Filters.eq("sender", username),
                        Filters.eq("recipients", username)
                    ),
                    Filters.eq("status", "active")
                )),
                Aggregates.group("$file_type", Accumulators.sum("count", 1)),
                Aggregates.sort(Sorts.descending("count")),
                Aggregates.limit(10)
            );

            List<Document> fileTypeResults = new ArrayList<>();
            for (Document doc : filesCollection.aggregate(fileTypePipeline)) {
                fileTypeResults.add(doc);
            }

            long totalFilesForTypes = 0;
            for (Document result : fileTypeResults) {
                Object countObj = result.get("count");
                if (!(countObj instanceof Number)) {
                    throw new IllegalStateException("Invalid count type in aggregation");
                }
                totalFilesForTypes += ((Number) countObj).longValue();
            }

            List<Map<String, Object>> fileTypeDistribution = new ArrayList<>();
            for (Document result : fileTypeResults) {
                Object fileType = result.get("_id");
                Object countObj = result.get("count");
                if (!(countObj instanceof Number)) {
                    throw new IllegalStateException("Invalid count type in aggregation");
                }
                long count = ((Number) countObj).longValue();
                double percentage = totalFilesForTypes > 0
                    ? roundTo((count / (double) totalFilesForTypes) * 100.0, 1)
                    : 0;

                fileTypeDistribution.add(mapOf(
                    "type", fileType != null ? fileType : "unknown",
                    "count", count,
                    "percentage", percentage
                ));
            }

            return new Response(200, mapOf(
                "stats", mapOf(
                    "files_sent", filesSent,
                    "files_received", filesReceived,
                    "sensitive_files", sensitiveFiles,
                    "storage_used_mb", roundTo(storageUsedMb, 2),
                    "storage_limit_mb", storageLimitMb,
                    "total_files", totalFiles,
                    "active_files", activeFiles,
                    "expired_files", expiredFiles
                ),
                "recent_activity", recentActivity,
                "encryption_breakdown", encryptionBreakdown,
                "file_type_distribution", fileTypeDistribution
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to get dashboard data"));
        }
    }

    // =====================================================================
    // Stats Utilities (db_utils.py + cleanup_service.py)
    // =====================================================================

    /**
     * [PRESERVED]
     */
    public Document calculateUserStatistics(String username) {
        try {
            MongoCollection<Document> files = db.getCollection("encrypted_files");
            MongoCollection<Document> contacts = db.getCollection("contacts");

            long filesSent = files.countDocuments(Filters.eq("sender", username));

            long filesReceived = files.countDocuments(new Document()
                .append("recipients", username)
                .append("sender", new Document("$ne", username))
            );

            List<Bson> storagePipeline = Arrays.asList(
                Aggregates.match(new Document()
                    .append("sender", username)
                    .append("status", "active")
                ),
                Aggregates.group(null, Accumulators.sum("total", "$file_size"))
            );

            List<Document> storageResult = new ArrayList<>();
            for (Document doc : files.aggregate(storagePipeline)) {
                storageResult.add(doc);
            }
            long storageUsed = 0;
            if (!storageResult.isEmpty()) {
                Object totalObj = storageResult.get(0).get("total");
                if (totalObj instanceof Number) {
                    storageUsed = ((Number) totalObj).longValue();
                } else if (totalObj != null) {
                    throw new IllegalStateException("Invalid storage total type");
                }
            }

            long activeCount = files.countDocuments(new Document()
                .append("sender", username)
                .append("status", "active")
            );

            long expiredCount = files.countDocuments(new Document()
                .append("sender", username)
                .append("status", "expired")
            );

            long deletedCount = files.countDocuments(new Document()
                .append("sender", username)
                .append("status", "deleted")
            );

            long totalDownloads = 0;
            FindIterable<Document> downloadsCursor = files.find(new Document("sender", username))
                .projection(Projections.include("download_count"));
            for (Document fileDoc : downloadsCursor) {
                Object count = fileDoc.get("download_count");
                if (count == null) {
                    totalDownloads += 0;
                } else if (count instanceof Number) {
                    totalDownloads += ((Number) count).longValue();
                } else {
                    throw new IllegalStateException("Invalid download_count type");
                }
            }

            long contactsCount = contacts.countDocuments(Filters.eq("owner_username", username));

            Map<Object, Long> filesByType = new HashMap<>();
            FindIterable<Document> typeCursor = files.find(new Document("sender", username))
                .projection(Projections.include("file_type"));
            for (Document fileDoc : typeCursor) {
                Object fileType;
                if (fileDoc.containsKey("file_type")) {
                    fileType = fileDoc.get("file_type");
                } else {
                    fileType = "unknown";
                }
                filesByType.put(fileType, filesByType.getOrDefault(fileType, 0L) + 1);
            }

            List<Map<String, Object>> filesByMonth = new ArrayList<>();
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            for (int i = 0; i < 12; i++) {
                ZonedDateTime monthStart = now.withDayOfMonth(1).minusDays(30L * i);
                ZonedDateTime monthEnd = monthStart.plusDays(30);

                long count = files.countDocuments(new Document()
                    .append("sender", username)
                    .append("created_at", new Document("$gte", Date.from(monthStart.toInstant()))
                        .append("$lt", Date.from(monthEnd.toInstant())))
                );

                filesByMonth.add(mapOf(
                    "month", monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    "count", count
                ));
            }

            List<Bson> topRecipientsPipeline = Arrays.asList(
                Aggregates.match(Filters.eq("sender", username)),
                Aggregates.unwind("$recipients"),
                Aggregates.group("$recipients", Accumulators.sum("count", 1)),
                Aggregates.sort(Sorts.descending("count")),
                Aggregates.limit(10)
            );

            List<Map<String, Object>> topRecipients = new ArrayList<>();
            for (Document result : files.aggregate(topRecipientsPipeline)) {
                topRecipients.add(mapOf(
                    "username", result.get("_id"),
                    "count", result.get("count")
                ));
            }

            Document stats = new Document()
                .append("username", username)
                .append("total_files_sent", filesSent)
                .append("total_files_received", filesReceived)
                .append("total_storage_used_bytes", storageUsed)
                .append("active_files_count", activeCount)
                .append("expired_files_count", expiredCount)
                .append("deleted_files_count", deletedCount)
                .append("total_downloads", totalDownloads)
                .append("contacts_count", contactsCount)
                .append("files_by_type", filesByType)
                .append("files_by_month", filesByMonth)
                .append("top_recipients", topRecipients)
                .append("updated_at", Date.from(Instant.now()));

            return stats;

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [PRESERVED]
     */
    public boolean updateUserStatistics(String username) {
        try {
            Document stats = calculateUserStatistics(username);
            if (stats == null) {
                return false;
            }

            MongoCollection<Document> userStatistics = db.getCollection("user_statistics");
            userStatistics.updateOne(
                new Document("username", username),
                new Document("$set", stats),
                new UpdateOptions().upsert(true)
            );

            return true;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * [PRESERVED]
     */
    public Document getCachedStatistics(String username, int maxAgeMinutes) {
        try {
            MongoCollection<Document> userStatistics = db.getCollection("user_statistics");
            Document stats = userStatistics.find(new Document("username", username)).first();

            if (stats != null) {
                Object updatedAt = stats.get("updated_at");
                if (!(updatedAt instanceof Date)) {
                    throw new IllegalStateException("Invalid updated_at type");
                }
                long ageSeconds = (Instant.now().toEpochMilli() - ((Date) updatedAt).getTime()) / 1000;
                if (ageSeconds < (maxAgeMinutes * 60L)) {
                    return stats;
                }
            }

            updateUserStatistics(username);
            return userStatistics.find(new Document("username", username)).first();

        } catch (Exception e) {
            return calculateUserStatistics(username);
        }
    }

    /**
     * [PRESERVED]
     */
    public long getTotalStorageUsed(String username) {
        try {
            MongoCollection<Document> files = db.getCollection("encrypted_files");

            List<Bson> pipeline = Arrays.asList(
                Aggregates.match(new Document()
                    .append("sender", username)
                    .append("status", new Document("$in", Arrays.asList("active", "expired")))
                ),
                Aggregates.group(null, Accumulators.sum("total_size", "$file_size"))
            );

            List<Document> result = new ArrayList<>();
            for (Document doc : files.aggregate(pipeline)) {
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

    private static String toIsoOrString(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Date) {
            return Instant.ofEpochMilli(((Date) value).getTime()).toString();
        }
        if (value instanceof Instant) {
            return ((Instant) value).toString();
        }
        return String.valueOf(value);
    }

    private static long getLongOrThrow(Object value, long defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        throw new IllegalStateException("Expected numeric value");
    }

    private static double roundTo(double value, int decimals) {
        return new BigDecimal(value).setScale(decimals, RoundingMode.HALF_EVEN).doubleValue();
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }
}
