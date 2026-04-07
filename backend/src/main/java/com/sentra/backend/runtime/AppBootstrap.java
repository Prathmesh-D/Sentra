package com.sentra.backend.runtime;

import com.sentra.backend.auth.AuthIdentityModule;
import com.sentra.backend.encryption.CryptoServiceAdapter;
import com.sentra.backend.encryption.EncryptionApiModule;
import com.sentra.backend.files.FileLifecycleModule;
import com.sentra.backend.recipients.RecipientsContactsModule;
import com.sentra.backend.users.UserStatsDashboardModule;
import com.mongodb.client.MongoDatabase;

import java.io.IOException;
import java.nio.file.Path;
import java.util.logging.*;
import com.sentra.backend.runtime.Log;

public class AppBootstrap {
    public static void main(String[] args) {
        Log.info("BOOT", "start", "Sentra backend initializing");

        try {
            // 1) Config
            AppConfig config = AppConfig.load();

            // 2) Directories
            config.createDirectories();

            // 3) Logging
            Logger logger = setupLogging(config);

            // 4) Database
            DatabaseManager dbManager = new DatabaseManager(config);
            MongoDatabase db = null;
            try {
                if (config.MONGO_URI != null && !config.MONGO_URI.isEmpty()) {
                    db = dbManager.getDatabase();
                    Log.info("DB", "connect", "success");
                } else {
                    Log.warn("DB", "config", "MONGO_URI missing; database disabled");
                }
            } catch (Exception e) {
                String detail = e.getClass().getSimpleName();
                if (e.getMessage() != null && !e.getMessage().isBlank()) {
                    detail += ": " + e.getMessage();
                }
                Log.warn("DB", "connect", "failed; " + detail);
            }

            // 5) Crypto service init
            CryptoServiceAdapter cryptoService = new CryptoServiceAdapter(config.DATA_DIR);
            try {
                cryptoService.initialize();
                Log.info("CRYPTO", "init", "success");
            } catch (Exception e) {
                Log.error("CRYPTO", "init", "failed");
                Log.warn("CRYPTO", "init", "encryption may be unavailable");
            }

            // 6) Modules / routes
            AuthIdentityModule authModule = new AuthIdentityModule(db, config.JWT_SECRET_KEY, config.BCRYPT_ROUNDS, config.TOKEN_EXPIRY_HOURS, config.REFRESH_TOKEN_EXPIRY_DAYS);
            RecipientsContactsModule recipientsModule = new RecipientsContactsModule(db);
            UserStatsDashboardModule usersModule = new UserStatsDashboardModule(db);
            FileLifecycleModule filesModule = new FileLifecycleModule(db);
            EncryptionApiModule encryptionModule = new EncryptionApiModule(db, cryptoService, config.DATA_DIR, config.MAX_FILE_SIZE);

            // 7) Start HTTP server
            HttpServerApp app = new HttpServerApp(
                config,
                db,
                authModule,
                recipientsModule,
                usersModule,
                filesModule,
                cryptoService,
                encryptionModule,
                config.CORS_ORIGINS,
                dbManager::checkReady
            );
            Log.info("HTTP", "start", "url=http://" + config.HOST + ":" + config.PORT + " env=" + config.APP_ENV);

            app.start();

        } catch (Exception e) {
            Log.error("BOOT", "start", "failed");
        }
    }

    private static Logger setupLogging(AppConfig config) throws IOException {
        Logger logger = Logger.getLogger("SentraBackend");
        logger.setUseParentHandlers(false);

        Level level = Level.INFO;
        try {
            level = Level.parse(config.LOG_LEVEL.toUpperCase());
        } catch (Exception ignored) {
        }

        FileHandler fileHandler = new FileHandler(config.LOG_FILE.toString(), true);
        fileHandler.setLevel(level);
        fileHandler.setFormatter(new Formatter() {
            @Override
            public String format(LogRecord record) {
                return String.format("%1$tF %1$tT - %2$s - %3$s%n", record.getMillis(), record.getLevel(), record.getMessage());
            }
        });

        ConsoleHandler consoleHandler = new ConsoleHandler();
        consoleHandler.setLevel(level);
        consoleHandler.setFormatter(new Formatter() {
            @Override
            public String format(LogRecord record) {
                return record.getLevel() + " - " + record.getMessage() + "\n";
            }
        });

        logger.addHandler(fileHandler);
        logger.addHandler(consoleHandler);
        logger.setLevel(level);

        return logger;
    }
}
