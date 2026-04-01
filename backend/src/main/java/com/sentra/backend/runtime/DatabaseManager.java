package com.sentra.backend.runtime;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class DatabaseManager {
    private final AppConfig config;
    private MongoClient client;
    private MongoDatabase db;
    private volatile boolean ready;

    public DatabaseManager(AppConfig config) {
        this.config = config;
    }

    private synchronized void connect() {
        if (client != null) {
            return;
        }
        if (config.MONGO_URI == null || config.MONGO_URI.isEmpty()) {
            throw new IllegalStateException("MONGO_URI not configured in environment");
        }
        client = MongoClients.create(config.MONGO_URI);
        db = client.getDatabase(config.MONGO_DB_NAME);
        // Verify connection with ping
        db.runCommand(new org.bson.Document("ping", 1));
        ready = true;
    }

    public MongoDatabase getDatabase() {
        if (db == null) {
            connect();
        }
        return db;
    }

    public boolean checkReady() {
        try {
            connect();
            if (db != null) {
                db.runCommand(new org.bson.Document("ping", 1));
                ready = true;
                return true;
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    public void close() {
        if (client != null) {
            client.close();
            client = null;
            db = null;
            ready = false;
        }
    }
}
