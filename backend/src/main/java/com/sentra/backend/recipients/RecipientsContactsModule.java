package com.sentra.backend.recipients;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.UpdateOptions;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.*;

public class RecipientsContactsModule {
    private final MongoDatabase db;

    public RecipientsContactsModule(MongoDatabase db) {
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
    // Route Handlers (recipients.py)
    // =====================================================================

    /**
     * [PRESERVED]
     * GET /api/recipients
     */
    public Response getRecipients(String username) {
        try {
            if (db == null) {
                return new Response(500, mapOf(
                    "contacts", new ArrayList<>(),
                    "total", 0,
                    "error", "Database not available"
                ));
            }

            List<Document> contacts = getUserContacts(username, null, false, null);
            List<Map<String, Object>> formattedContacts = new ArrayList<>();

            for (Document contact : contacts) {
                Map<String, Object> formatted = new HashMap<>();

                Object id = contact.get("_id");
                formatted.put("_id", id != null ? id.toString() : null);
                formatted.put("owner_username", getStringOrNull(contact.get("owner_username")));
                formatted.put("contact_username", getStringOrNull(contact.get("contact_username")));

                Object contactEmail = contact.get("contact_email");
                formatted.put("contact_email", contactEmail != null ? contactEmail : "");

                Object contactFullName = contact.get("contact_full_name");
                Object contactUsername = contact.get("contact_username");
                formatted.put("contact_full_name", contactFullName != null ? contactFullName : contactUsername);

                formatted.put("nickname", contact.get("nickname"));
                Object notes = contact.get("notes");
                formatted.put("notes", notes != null ? notes : "");

                formatted.put("tags", contact.containsKey("tags") ? contact.get("tags") : new ArrayList<>());
                formatted.put("is_favorite", contact.containsKey("is_favorite") ? contact.get("is_favorite") : false);
                formatted.put("shared_files_count", contact.containsKey("shared_files_count") ? contact.get("shared_files_count") : 0);

                formatted.put("last_shared_at", toIsoOrNull(contact.get("last_shared_at")));
                formatted.put("added_at", toIsoOrNull(contact.get("added_at")));
                formatted.put("updated_at", toIsoOrNull(contact.get("updated_at")));

                formattedContacts.add(formatted);
            }

            return new Response(200, mapOf(
                "contacts", formattedContacts,
                "total", formattedContacts.size()
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to fetch recipients"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/recipients
     */
    public Response addRecipient(String username, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("error", "Missing required fields"));
            }

            String name = getStringOrNull(data.get("name"));
            String email = getStringOrNull(data.get("email"));
            String nickname = getStringOrNull(data.get("nickname"));
            String usernameField = getStringOrNull(data.get("username"));
            String contactUsername = nickname != null ? nickname : usernameField;

            if (name == null || name.isEmpty() || email == null || email.isEmpty()) {
                return new Response(400, mapOf("error", "Missing required fields"));
            }

            if (contactUsername == null || contactUsername.isEmpty()) {
                contactUsername = email;
            }

            Document contact = addContact(
                username,
                contactUsername,
                email,
                name,
                nickname
            );

            if (contact == null) {
                return new Response(500, mapOf("error", "Failed to add recipient"));
            }

            Object id = contact.get("_id");
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("_id", id != null ? id.toString() : null);
            formatted.put("owner_username", getStringOrNull(contact.get("owner_username")));
            formatted.put("contact_username", getStringOrNull(contact.get("contact_username")));
            formatted.put("contact_email", getStringOrNull(contact.get("contact_email")));
            formatted.put("contact_full_name", getStringOrNull(contact.get("contact_full_name")));
            formatted.put("nickname", contact.get("nickname"));
            formatted.put("notes", contact.get("notes") != null ? contact.get("notes") : "");
            formatted.put("tags", contact.containsKey("tags") ? contact.get("tags") : new ArrayList<>());
            formatted.put("is_favorite", contact.containsKey("is_favorite") ? contact.get("is_favorite") : false);
            formatted.put("shared_files_count", contact.containsKey("shared_files_count") ? contact.get("shared_files_count") : 0);
            formatted.put("last_shared_at", toIsoOrNull(contact.get("last_shared_at")));
            formatted.put("added_at", toIsoOrNull(contact.get("added_at")));
            formatted.put("updated_at", toIsoOrNull(contact.get("updated_at")));

            return new Response(201, mapOf(
                "message", "Recipient added successfully",
                "recipient", formatted
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to add recipient"));
        }
    }

    /**
     * [PRESERVED]
     * DELETE /api/recipients/{recipient_id}
     */
    public Response deleteRecipient(String username, String recipientId) {
        try {
            if (db == null) {
                return new Response(500, mapOf("error", "Database not available"));
            }

            ObjectId objectId;
            try {
                objectId = new ObjectId(recipientId);
            } catch (Exception e) {
                return new Response(400, mapOf("error", "Invalid contact ID"));
            }

            MongoCollection<Document> contacts = db.getCollection("contacts");
            Document contact = contacts.find(Filters.eq("_id", objectId)).first();

            if (contact == null) {
                return new Response(404, mapOf("error", "Contact not found"));
            }

            Object owner = contact.get("owner_username");
            if (owner == null || !owner.toString().equals(username)) {
                return new Response(403, mapOf("error", "Permission denied"));
            }

            contacts.deleteOne(Filters.eq("_id", objectId));

            return new Response(200, mapOf(
                "message", "Contact deleted successfully",
                "recipient_id", recipientId
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to delete recipient"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/recipients/search?q=...
     */
    public Response searchRecipients(String query) {
        try {
            if (query == null || query.length() < 2) {
                return new Response(400, mapOf("error", "Query too short"));
            }

            return new Response(200, mapOf(
                "users", new ArrayList<>(),
                "total", 0,
                "query", query,
                "status", "pending_database_integration"
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Search failed"));
        }
    }

    // =====================================================================
    // Contact Utilities (db_utils.py contact-related)
    // =====================================================================

    /**
     * [PRESERVED]
     */
    public Document addContact(
        String ownerUsername,
        String contactUsername,
        String contactEmail,
        String contactFullName,
        String nickname
    ) {
        try {
            if (db == null) {
                return null;
            }

            MongoCollection<Document> contacts = db.getCollection("contacts");

            Document existing = contacts.find(new Document()
                .append("owner_username", ownerUsername)
                .append("contact_username", contactUsername)
            ).first();

            if (existing != null) {
                return existing;
            }

            Document contactDoc = new Document()
                .append("owner_username", ownerUsername)
                .append("contact_username", contactUsername)
                .append("contact_email", contactEmail)
                .append("contact_full_name", contactFullName)
                .append("nickname", nickname)
                .append("notes", "")
                .append("tags", new ArrayList<>())
                .append("is_favorite", false)
                .append("shared_files_count", 0)
                .append("last_shared_at", null)
                .append("added_at", new Date())
                .append("updated_at", new Date());

            contacts.insertOne(contactDoc);
            return contactDoc;

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [PRESERVED]
     */
    public List<Document> getUserContacts(String username, Object filterTags, boolean favoritesOnly, Integer limit) {
        try {
            if (db == null) {
                return Collections.emptyList();
            }

            MongoCollection<Document> contacts = db.getCollection("contacts");
            Document query = new Document("owner_username", username);

            if (filterTags != null) {
                if (filterTags instanceof List) {
                    query.append("tags", new Document("$in", filterTags));
                } else {
                    query.append("tags", new Document("$in", Collections.singletonList(filterTags)));
                }
            }

            if (favoritesOnly) {
                query.append("is_favorite", true);
            }

            FindIterable<Document> cursor = contacts.find(query).sort(Sorts.descending("last_shared_at"));
            if (limit != null) {
                cursor = cursor.limit(limit);
            }

            List<Document> results = new ArrayList<>();
            for (Document doc : cursor) {
                results.add(doc);
            }

            return results;

        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * [PRESERVED]
     */
    public void updateContactShareStats(String ownerUsername, String contactUsername) {
        try {
            if (db == null) {
                return;
            }

            MongoCollection<Document> contacts = db.getCollection("contacts");
            Document filter = new Document()
                .append("owner_username", ownerUsername)
                .append("contact_username", contactUsername);

            Document update = new Document()
                .append("$inc", new Document("shared_files_count", 1))
                .append("$set", new Document("last_shared_at", new Date())
                    .append("updated_at", new Date())
                );

            contacts.updateOne(filter, update, new UpdateOptions().upsert(true));

        } catch (Exception e) {
            // Preserve silent failure behavior
        }
    }

    /**
     * [PRESERVED]
     */
    public List<Document> getFrequentRecipients(String username, int limit) {
        try {
            if (db == null) {
                return Collections.emptyList();
            }

            MongoCollection<Document> contacts = db.getCollection("contacts");
            FindIterable<Document> cursor = contacts.find(Filters.eq("owner_username", username))
                .sort(Sorts.descending("shared_files_count"))
                .limit(limit);

            List<Document> results = new ArrayList<>();
            for (Document doc : cursor) {
                results.add(doc);
            }

            return results;

        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private static String getStringOrNull(Object value) {
        return value == null ? null : value.toString();
    }

    private static Object toIsoOrNull(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Date) {
            return Instant.ofEpochMilli(((Date) value).getTime()).toString();
        }
        if (value instanceof Instant) {
            return ((Instant) value).toString();
        }
        throw new IllegalStateException("Unexpected date type: " + value.getClass().getName());
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }
}
