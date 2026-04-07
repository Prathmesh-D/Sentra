package com.sentra.backend.runtime;

import com.sentra.backend.auth.AuthIdentityModule;
import com.sentra.backend.encryption.CryptoServiceAdapter;
import com.sentra.backend.encryption.EncryptionApiModule;
import com.sentra.backend.files.FileLifecycleModule;
import com.sentra.backend.recipients.RecipientsContactsModule;
import com.sentra.backend.users.UserStatsDashboardModule;
import com.mongodb.client.MongoDatabase;

import java.util.logging.Logger;
import com.sentra.backend.runtime.Log;

public class Bootstrap {
    private AppConfig config;
    private Logger logger;
    private DatabaseManager dbManager;
    private MongoDatabase db;
    private CryptoServiceAdapter cryptoService;
    private HttpServerApp serverApp;

    public void start() throws Exception {
        Log.info("BOOT", "start", "Sentra backend initializing");

        // 1) Load configuration
        config = AppConfig.load();

        // 2) Create filesystem directories
        DirectoryInitializer.initialize(config);

        // 3) Initialize logging
        logger = LogInitializer.initialize(config);

        // 4) Initialize JWT
        JwtManager jwtManager = JwtManager.initialize(config);

        // 5) Initialize CORS
        CorsInitializer cors = CorsInitializer.initialize(config);

        // Optional: initialize database (behavioral parity with Python)
        dbManager = new DatabaseManager(config);
        try {
            if (config.MONGO_URI != null && !config.MONGO_URI.isEmpty()) {
                if (dbManager.checkReady()) {
                    db = dbManager.getDatabase();
                    Log.info("DB", "connect", "success");
                } else {
                    Log.error("DB", "connect", "failed; backend not ready");
                }
            } else {
                Log.error("DB", "config", "MONGO_URI missing; backend not ready");
            }
        } catch (Exception e) {
            String detail = e.getClass().getSimpleName();
            if (e.getMessage() != null && !e.getMessage().isBlank()) {
                detail += ": " + e.getMessage();
            }
            Log.error("DB", "connect", "failed; " + detail);
        }

        // 6) Initialize Crypto Service Adapter
        cryptoService = new CryptoServiceAdapter(config.DATA_DIR);
        try {
            cryptoService.initialize();
            Log.info("CRYPTO", "init", "success");
        } catch (Exception e) {
            Log.error("CRYPTO", "init", "failed");
            Log.warn("CRYPTO", "init", "encryption may be unavailable");
        }

        // 7) Register ALL routes
        AuthIdentityModule authModule = new AuthIdentityModule(
            db,
            jwtManager.getSecretKey(),
            config.BCRYPT_ROUNDS,
            config.TOKEN_EXPIRY_HOURS,
            config.REFRESH_TOKEN_EXPIRY_DAYS
        );
        RecipientsContactsModule recipientsModule = new RecipientsContactsModule(db);
        UserStatsDashboardModule usersModule = new UserStatsDashboardModule(db);
        FileLifecycleModule filesModule = new FileLifecycleModule(db);
        EncryptionApiModule encryptionModule = new EncryptionApiModule(db, cryptoService, config.DATA_DIR, config.MAX_FILE_SIZE);

        serverApp = HttpServerInitializer.initialize(
            config,
            db,
            authModule,
            recipientsModule,
            usersModule,
            filesModule,
            cryptoService,
            encryptionModule,
            cors.getAllowedOrigins(),
            dbManager::checkReady
        );

        // 8) Start HTTP server
        Log.info("HTTP", "start", "url=http://" + config.HOST + ":" + config.PORT + " env=" + config.APP_ENV);

        serverApp.start();

        // 9) Register graceful shutdown hook
        registerShutdownHook();
    }

    private void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (serverApp != null) {
                try {
                    serverApp.stop();
                } catch (Exception ignored) {
                }
            }
            if (dbManager != null) {
                dbManager.close();
            }
            if (logger != null) {
                Log.info("BOOT", "shutdown", "complete");
            }
        }));
    }
}
