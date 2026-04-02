package com.sentra.backend.runtime;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class AppConfig {
    public final String APP_ENV;
    public final boolean IS_PRODUCTION;
    public final String SECRET_KEY;
    public final String JWT_SECRET_KEY;
    public final String HOST;
    public final int PORT;

    public final String MONGO_URI;
    public final String MONGO_DB_NAME;
    public final String MONGO_COLLECTION_USERS;
    public final String MONGO_COLLECTION_FILES;
    public final String MONGO_COLLECTION_RECIPIENTS;

    public final Path BASE_DIR;
    public final Path DATA_DIR;

    public final long MAX_FILE_SIZE;
    public final Set<String> ALLOWED_EXTENSIONS;

    public final int BCRYPT_ROUNDS;
    public final int TOKEN_EXPIRY_HOURS;
    public final int REFRESH_TOKEN_EXPIRY_DAYS;

    public final List<String> CORS_ORIGINS;

    public final String LOG_LEVEL;
    public final Path LOG_FILE;

    private AppConfig(Map<String, String> env, Path baseDir) {
        this.APP_ENV = envOrDefault(env, "APP_ENV", "development").toLowerCase(Locale.ROOT);
        this.IS_PRODUCTION = "production".equals(APP_ENV);

        String secret = env.get("SECRET_KEY");
        String jwtSecret = env.get("JWT_SECRET_KEY");
        if (IS_PRODUCTION) {
            if (secret == null || secret.isBlank()) {
                throw new IllegalStateException("SECRET_KEY is required in production");
            }
            if (jwtSecret == null || jwtSecret.isBlank()) {
                throw new IllegalStateException("JWT_SECRET_KEY is required in production");
            }
        }
        this.SECRET_KEY = (secret == null || secret.isBlank()) ? UUID.randomUUID().toString() : secret;
        this.JWT_SECRET_KEY = (jwtSecret == null || jwtSecret.isBlank()) ? UUID.randomUUID().toString() : jwtSecret;
        this.HOST = envOrDefault(env, "HOST", "0.0.0.0");
        this.PORT = Integer.parseInt(envOrDefault(env, "PORT", "10000"));

        this.MONGO_URI = env.get("MONGO_URI");
        if (IS_PRODUCTION && (MONGO_URI == null || MONGO_URI.isBlank())) {
            throw new IllegalStateException("MONGO_URI is required in production");
        }
        this.MONGO_DB_NAME = envOrDefault(env, "MONGO_DB_NAME", "sentra_encryption");
        this.MONGO_COLLECTION_USERS = envOrDefault(env, "MONGO_COLLECTION_USERS", "users");
        this.MONGO_COLLECTION_FILES = envOrDefault(env, "MONGO_COLLECTION_FILES", "encrypted_files");
        this.MONGO_COLLECTION_RECIPIENTS = envOrDefault(env, "MONGO_COLLECTION_RECIPIENTS", "recipients");

        this.BASE_DIR = baseDir;
        String dataDirEnv = env.get("DATA_DIR");
        if (dataDirEnv != null && !dataDirEnv.isEmpty()) {
            this.DATA_DIR = Path.of(dataDirEnv);
        } else {
            this.DATA_DIR = BASE_DIR.resolve("data");
        }
        this.MAX_FILE_SIZE = Long.parseLong(envOrDefault(env, "MAX_FILE_SIZE", "104857600"));
        this.ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "txt", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "jpg", "jpeg", "png", "gif", "zip", "rar", "7z"
        ));

        this.BCRYPT_ROUNDS = Integer.parseInt(envOrDefault(env, "BCRYPT_ROUNDS", "12"));
        this.TOKEN_EXPIRY_HOURS = Integer.parseInt(envOrDefault(env, "TOKEN_EXPIRY_HOURS", "24"));
        this.REFRESH_TOKEN_EXPIRY_DAYS = Integer.parseInt(envOrDefault(env, "REFRESH_TOKEN_EXPIRY_DAYS", "30"));

        String clientUrl = env.get("CLIENT_URL");
        String corsOrigins = env.get("CORS_ORIGINS");
        if (IS_PRODUCTION
            && (clientUrl == null || clientUrl.isBlank())
            && (corsOrigins == null || corsOrigins.isBlank())) {
            throw new IllegalStateException("CORS_ORIGINS is required in production");
        }
        LinkedHashSet<String> originSet = new LinkedHashSet<>();
        if (clientUrl != null && !clientUrl.isBlank()) {
            originSet.add(clientUrl.trim());
        }
        if (corsOrigins != null && !corsOrigins.isBlank()) {
            for (String origin : corsOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    originSet.add(trimmed);
                }
            }
        }
        this.CORS_ORIGINS = new ArrayList<>(originSet);

        this.LOG_LEVEL = envOrDefault(env, "LOG_LEVEL", "INFO");
        this.LOG_FILE = Path.of(envOrDefault(env, "LOG_FILE", "./logs/app.log"));
    }

    public static AppConfig load() {
        Map<String, String> env = new HashMap<>(System.getenv());
        Path baseDir = resolveBaseDir(env);
        Map<String, String> dotEnv = loadDotEnv(baseDir.resolve(".env"));
        for (Map.Entry<String, String> entry : dotEnv.entrySet()) {
            env.putIfAbsent(entry.getKey(), entry.getValue());
        }
        return new AppConfig(env, baseDir);
    }

    public void createDirectories() throws IOException {
        List<Path> dirs = Arrays.asList(
            DATA_DIR,
            BASE_DIR.resolve("logs")
        );
        for (Path dir : dirs) {
            Files.createDirectories(dir);
        }
        Log.info("BOOT", "dirs", "created dataDir=" + DATA_DIR);
    }

    private static String envOrDefault(Map<String, String> env, String key, String defaultValue) {
        String val = env.get(key);
        return val != null && !val.isEmpty() ? val : defaultValue;
    }

    private static Path resolveBaseDir(Map<String, String> env) {
        String baseDirEnv = env.get("BACKEND_BASE_DIR");
        if (baseDirEnv != null && !baseDirEnv.isEmpty()) {
            return Path.of(baseDirEnv);
        }
        String baseDirEnvAlt = env.get("BASE_DIR");
        if (baseDirEnvAlt != null && !baseDirEnvAlt.isEmpty()) {
            return Path.of(baseDirEnvAlt);
        }
        return Path.of(System.getProperty("user.dir")).resolve("backend");
    }

    private static Map<String, String> loadDotEnv(Path envPath) {
        Map<String, String> values = new HashMap<>();
        if (!Files.exists(envPath)) {
            Log.warn("BOOT", "env", "missing .env at " + envPath.getFileName());
            return values;
        }
        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }
                int idx = trimmed.indexOf('=');
                String key = trimmed.substring(0, idx).trim();
                String value = trimmed.substring(idx + 1).trim();
                values.putIfAbsent(key, value);
            }
        } catch (Exception e) {
            Log.warn("BOOT", "env", "failed to load .env");
        }
        return values;
    }
}
