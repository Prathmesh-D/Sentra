package com.sentra.backend.runtime;

import com.sentra.backend.auth.AuthIdentityModule;
import com.sentra.backend.auth.AuthIdentityModule.TokenResult;
import com.sentra.backend.encryption.CryptoServiceAdapter;
import com.sentra.backend.runtime.Log;
import com.sentra.backend.encryption.EncryptionApiModule;
import com.sentra.backend.encryption.EncryptionApiModule.UploadedFile;
import com.sentra.backend.files.FileLifecycleModule;
import com.sentra.backend.recipients.RecipientsContactsModule;
import com.sentra.backend.users.UserStatsDashboardModule;
import com.mongodb.client.MongoDatabase;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BooleanSupplier;

public class HttpServerApp {
    private final AppConfig config;
    private final MongoDatabase db;
    private final AuthIdentityModule authModule;
    private final RecipientsContactsModule recipientsModule;
    private final UserStatsDashboardModule usersModule;
    private final FileLifecycleModule filesModule;
    private final CryptoServiceAdapter cryptoAdapter;
    private final EncryptionApiModule encryptionModule;
    private final List<String> corsOrigins;
    private final Map<String, Deque<Long>> authRateWindowByKey = new ConcurrentHashMap<>();
    private HttpServer server;
    private final BooleanSupplier readyCheck;

    private static final int LOGIN_REGISTER_MAX_ATTEMPTS = 10;
    private static final long LOGIN_REGISTER_WINDOW_MS = 15 * 60 * 1000L;
    private static final int REFRESH_MAX_ATTEMPTS = 30;
    private static final long REFRESH_WINDOW_MS = 15 * 60 * 1000L;
    private static final long ACCESS_COOKIE_MAX_AGE_SECONDS = 15 * 60L;
    private static final long REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60L;

    public HttpServerApp(AppConfig config, MongoDatabase db,
                         AuthIdentityModule authModule,
                         RecipientsContactsModule recipientsModule,
                         UserStatsDashboardModule usersModule,
                         FileLifecycleModule filesModule,
                         CryptoServiceAdapter cryptoAdapter,
                         EncryptionApiModule encryptionModule,
                         List<String> corsOrigins,
                         BooleanSupplier readyCheck) {
        this.config = config;
        this.db = db;
        this.authModule = authModule;
        this.recipientsModule = recipientsModule;
        this.usersModule = usersModule;
        this.filesModule = filesModule;
        this.cryptoAdapter = cryptoAdapter;
        this.encryptionModule = encryptionModule;
        this.corsOrigins = corsOrigins != null ? new ArrayList<>(corsOrigins) : null;
        this.readyCheck = readyCheck != null ? readyCheck : () -> true;
    }

    public void start() throws IOException {
        if (server != null) {
            throw new IllegalStateException("Server already started");
        }
        server = HttpServer.create(new InetSocketAddress(config.HOST, config.PORT), 0);
        server.createContext("/", new RootHandler());
        server.setExecutor(null);
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
    }

    private class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI() != null ? exchange.getRequestURI().getPath() : "<unknown>";
            String requestId = UUID.randomUUID().toString().substring(0, 8);
            try {
                applyCors(exchange);
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendResponse(exchange, 200, JsonUtil.stringify(Map.of()));
                    return;
                }

                if ("/".equals(path)) {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("message", "Sentra Encryption API");
                    body.put("version", "1.0.0");
                    Map<String, String> endpoints = new LinkedHashMap<>();
                    endpoints.put("auth", "/api/auth");
                    endpoints.put("encryption", "/api/encrypt");
                    endpoints.put("files", "/api/files");
                    endpoints.put("recipients", "/api/recipients");
                    endpoints.put("users", "/api/users");
                    endpoints.put("health", "/api/health");
                    endpoints.put("db_ping", "/api/db-ping");
                    body.put("endpoints", endpoints);
                    sendResponse(exchange, 200, JsonUtil.stringify(body));
                    return;
                }

                if ("/api/health".equals(path)) {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("status", "ok");
                    sendResponse(exchange, 200, JsonUtil.stringify(body));
                    return;
                }

                if ("/api/ready".equals(path)) {
                    boolean ready = readyCheck.getAsBoolean();
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("status", ready ? "ready" : "not_ready");
                    body.put("service", "Sentra Encryption API");
                    body.put("version", "1.0.0");
                    sendResponse(exchange, ready ? 200 : 503, JsonUtil.stringify(body));
                    return;
                }

                if ("/api/db-ping".equals(path) && "GET".equalsIgnoreCase(method)) {
                    boolean dbReady = readyCheck.getAsBoolean();
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("status", dbReady ? "ok" : "error");
                    body.put("database", dbReady ? "reachable" : "unreachable");
                    body.put("service", "Sentra Encryption API");
                    body.put("timestamp", Instant.now().toString());
                    sendResponse(exchange, dbReady ? 200 : 503, JsonUtil.stringify(body));
                    return;
                }

                if (path.startsWith("/api/auth")) {
                    handleAuth(exchange, path);
                    return;
                }

                if (path.startsWith("/api/recipients")) {
                    handleRecipients(exchange, path);
                    return;
                }

                if (path.startsWith("/api/users")) {
                    handleUsers(exchange, path);
                    return;
                }

                if (path.equals("/api/user") || path.startsWith("/api/user/")) {
                    handleUserSettings(exchange, path);
                    return;
                }

                if (path.startsWith("/api/files")) {
                    handleFiles(exchange, path);
                    return;
                }

                if (path.startsWith("/api/encrypt")) {
                    handleEncrypt(exchange, path);
                    return;
                }

                sendError(exchange, 404, "not_found", "Endpoint not found", requestId, null);

            } catch (IllegalArgumentException e) {
                Log.warn("HTTP", "request", "requestId=" + requestId + " method=" + method + " path=" + path + " status=400 error=" + e.getMessage());
                sendError(exchange, 400, "bad_request", e.getMessage(), requestId, null);
            } catch (Exception e) {
                Log.error("HTTP", "request", "requestId=" + requestId + " method=" + method + " path=" + path + " status=500 error=" + e.getClass().getSimpleName() + ":" + e.getMessage());
                sendError(exchange, 500, "internal_error", "Internal server error", requestId, null);
            }
        }
    }

    private void handleAuth(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }
        String userAgent = getUserAgent(exchange);
        String ip = getClientIp(exchange);
        String browser = inferBrowser(userAgent);
        String os = inferOs(userAgent);
        String deviceType = inferDeviceType(userAgent);
        String deviceLabel = browser + " on " + os;
        String location = "Unknown";

        if ("/api/auth/register".equals(path) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            String identityKey = extractIdentityKey(data, "register");
            if (isRateLimited("register:ip", ip, LOGIN_REGISTER_MAX_ATTEMPTS, LOGIN_REGISTER_WINDOW_MS)
                || isRateLimited("register:id", identityKey, LOGIN_REGISTER_MAX_ATTEMPTS, LOGIN_REGISTER_WINDOW_MS)) {
                logAuthRateLimit("register", ip, identityKey);
                sendResponse(exchange, 429, JsonUtil.stringify(Map.of("error", "Too many authentication attempts. Please try again later.")));
                return;
            }
            AuthIdentityModule.Response resp = authModule.register(data, deviceLabel, ip, browser, os, deviceType, location);
            logAuthFailureIfNeeded("register", ip, identityKey, resp.statusCode);
            appendAuthCookies(exchange, resp.body);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/auth/login".equals(path) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            String identityKey = extractIdentityKey(data, "login");
            if (isRateLimited("login:ip", ip, LOGIN_REGISTER_MAX_ATTEMPTS, LOGIN_REGISTER_WINDOW_MS)
                || isRateLimited("login:id", identityKey, LOGIN_REGISTER_MAX_ATTEMPTS, LOGIN_REGISTER_WINDOW_MS)) {
                logAuthRateLimit("login", ip, identityKey);
                sendResponse(exchange, 429, JsonUtil.stringify(Map.of("error", "Too many authentication attempts. Please try again later.")));
                return;
            }
            AuthIdentityModule.Response resp = authModule.login(data, deviceLabel, ip, browser, os, deviceType, location);
            logAuthFailureIfNeeded("login", ip, identityKey, resp.statusCode);
            appendAuthCookies(exchange, resp.body);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/auth/logout".equals(path) && "POST".equalsIgnoreCase(method)) {
            String token = getRefreshToken(exchange);
            AuthIdentityModule.Response resp = authModule.logout(token);
            clearAuthCookies(exchange);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/auth/refresh".equals(path) && "POST".equalsIgnoreCase(method)) {
            String token = getRefreshToken(exchange);
            String identityKey = token != null && !token.isBlank() ? token.substring(0, Math.min(24, token.length())) : "unknown";
            if (isRateLimited("refresh:ip", ip, REFRESH_MAX_ATTEMPTS, REFRESH_WINDOW_MS)
                || isRateLimited("refresh:id", identityKey, REFRESH_MAX_ATTEMPTS, REFRESH_WINDOW_MS)) {
                logAuthRateLimit("refresh", ip, identityKey);
                sendResponse(exchange, 429, JsonUtil.stringify(Map.of("error", "Too many refresh attempts. Please try again later.")));
                return;
            }
            AuthIdentityModule.Response resp = authModule.refresh(token);
            logAuthFailureIfNeeded("refresh", ip, identityKey, resp.statusCode);
            appendAuthCookies(exchange, resp.body);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/auth/me".equals(path) && "GET".equalsIgnoreCase(method)) {
            String token = getAccessToken(exchange);
            AuthIdentityModule.Response resp = authModule.getCurrentUser(token);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/auth/change-password".equals(path) && "POST".equalsIgnoreCase(method)) {
            String token = getAccessToken(exchange);
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.changePassword(token, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private void handleRecipients(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }
        TokenResult token = requireAccess(exchange);
        if (!token.isSuccess()) {
            sendResponse(exchange, token.getResponse().statusCode, JsonUtil.stringify(token.getResponse().body));
            return;
        }
        String username = token.getIdentity();

        if (("/api/recipients".equals(path) || "/api/recipients/".equals(path)) && "GET".equalsIgnoreCase(method)) {
            RecipientsContactsModule.Response resp = recipientsModule.getRecipients(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (("/api/recipients".equals(path) || "/api/recipients/".equals(path)) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            RecipientsContactsModule.Response resp = recipientsModule.addRecipient(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (path.startsWith("/api/recipients/") && "DELETE".equalsIgnoreCase(method)) {
            String recipientId = path.substring("/api/recipients/".length());
            RecipientsContactsModule.Response resp = recipientsModule.deleteRecipient(username, recipientId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/recipients/search".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            String q = qs.getOrDefault("q", "");
            RecipientsContactsModule.Response resp = recipientsModule.searchRecipients(q);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private void handleUsers(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }
        TokenResult token = requireAccess(exchange);
        if (!token.isSuccess()) {
            sendResponse(exchange, token.getResponse().statusCode, JsonUtil.stringify(token.getResponse().body));
            return;
        }
        String username = token.getIdentity();

        if ("/api/users/statistics".equals(path) && "GET".equalsIgnoreCase(method)) {
            UserStatsDashboardModule.Response resp = usersModule.getStatistics(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/users/profile".equals(path) && "GET".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.getUserProfile(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/users/profile".equals(path) && "PUT".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.updateUserProfile(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/users/stats".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            boolean useCache = "true".equalsIgnoreCase(qs.getOrDefault("use_cache", "false"));
            UserStatsDashboardModule.Response resp = usersModule.getStats(username, useCache);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/users/dashboard".equals(path) && "GET".equalsIgnoreCase(method)) {
            UserStatsDashboardModule.Response resp = usersModule.getDashboard(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private void handleUserSettings(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }

        if ("/api/user/email/confirm".equals(path) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.confirmEmailChange(data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        TokenResult token = requireAccess(exchange);
        if (!token.isSuccess()) {
            sendResponse(exchange, token.getResponse().statusCode, JsonUtil.stringify(token.getResponse().body));
            return;
        }

        String username = token.getIdentity();
        String currentSessionId = token.getSessionId();

        if ("/api/user/profile".equals(path) && "GET".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.getUserProfile(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/username-availability".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            String candidate = qs.getOrDefault("username", "");
            AuthIdentityModule.Response resp = authModule.checkUsernameAvailability(username, candidate);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/username/check".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            String candidate = qs.getOrDefault("username", "");
            AuthIdentityModule.Response resp = authModule.checkUsernameAvailability(username, candidate);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/last-login".equals(path) && "GET".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.getLastLogin(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/profile".equals(path) && "PUT".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.updateUserProfile(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/password".equals(path) && "PUT".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.changePasswordStrict(username, currentSessionId, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/email/request".equals(path) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.requestEmailChange(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/email/cancel".equals(path) && "POST".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.cancelEmailChange(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/avatar".equals(path) && "POST".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.uploadAvatar(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/avatar".equals(path) && "DELETE".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.removeAvatar(username);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/preferences".equals(path) && "PUT".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.updatePreferences(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/security".equals(path) && "PUT".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.updateSecurityPreferences(username, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/sessions".equals(path) && "GET".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.listSessions(username, currentSessionId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/sessions".equals(path) && "DELETE".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.revokeAllOtherSessions(username, currentSessionId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (path.startsWith("/api/user/sessions/") && "DELETE".equalsIgnoreCase(method)) {
            String sessionId = path.substring("/api/user/sessions/".length());
            AuthIdentityModule.Response resp = authModule.revokeSession(username, sessionId, currentSessionId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/logout-all".equals(path) && "POST".equalsIgnoreCase(method)) {
            AuthIdentityModule.Response resp = authModule.revokeAllOtherSessions(username, currentSessionId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/user/account".equals(path) && "DELETE".equalsIgnoreCase(method)) {
            Map<String, Object> data = readJson(exchange);
            AuthIdentityModule.Response resp = authModule.deleteAccount(username, currentSessionId, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private void handleFiles(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }
        TokenResult token = requireAccess(exchange);
        if (!token.isSuccess()) {
            sendResponse(exchange, token.getResponse().statusCode, JsonUtil.stringify(token.getResponse().body));
            return;
        }
        String username = token.getIdentity();

        if ("/api/files/inbox".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            Integer page;
            Integer per;
            try {
                page = parsePositiveIntQuery(qs, "page", 1, 100000);
                per = parsePositiveIntQuery(qs, "per_page", 1, 100);
            } catch (IllegalArgumentException e) {
                sendResponse(exchange, 400, JsonUtil.stringify(Map.of("error", e.getMessage())));
                return;
            }
            String filter = qs.get("filter");
            String sort = qs.get("sort");
            FileLifecycleModule.Response resp = filesModule.getInbox(username, page, per, filter, sort);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if ("/api/files/outbox".equals(path) && "GET".equalsIgnoreCase(method)) {
            Map<String, String> qs = parseQuery(exchange.getRequestURI().getRawQuery());
            Integer page;
            Integer per;
            try {
                page = parsePositiveIntQuery(qs, "page", 1, 100000);
                per = parsePositiveIntQuery(qs, "per_page", 1, 100);
            } catch (IllegalArgumentException e) {
                sendResponse(exchange, 400, JsonUtil.stringify(Map.of("error", e.getMessage())));
                return;
            }
            String filter = qs.get("filter");
            String sort = qs.get("sort");
            FileLifecycleModule.Response resp = filesModule.getOutbox(username, page, per, filter, sort);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (path.matches("/api/files/[^/]+/download") && "GET".equalsIgnoreCase(method)) {
            String fileId = path.substring("/api/files/".length(), path.lastIndexOf("/download"));
            FileLifecycleModule.FileResponse resp = filesModule.downloadFile(username, fileId);
            sendFileResponse(exchange, resp);
            return;
        }
        if (path.matches("/api/files/[^/]+") && "DELETE".equalsIgnoreCase(method)) {
            String fileId = path.substring("/api/files/".length());
            FileLifecycleModule.Response resp = filesModule.deleteFile(username, fileId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (path.matches("/api/files/[^/]+/extend") && "POST".equalsIgnoreCase(method)) {
            String fileId = path.substring("/api/files/".length(), path.lastIndexOf("/extend"));
            Map<String, Object> data = readJson(exchange);
            FileLifecycleModule.Response resp = filesModule.extendExpiry(username, fileId, data);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }
        if (path.matches("/api/files/[^/]+") && "GET".equalsIgnoreCase(method)) {
            String fileId = path.substring("/api/files/".length());
            FileLifecycleModule.Response resp = filesModule.getFileDetails(fileId);
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            return;
        }

        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private void handleEncrypt(HttpExchange exchange, String path) throws IOException {
        String method = exchange.getRequestMethod();
        if (!readyCheck.getAsBoolean()) {
            sendResponse(exchange, 503, JsonUtil.stringify(Map.of("error", "Database not available")));
            return;
        }
        TokenResult token = requireAccess(exchange);
        if (!token.isSuccess()) {
            sendResponse(exchange, token.getResponse().statusCode, JsonUtil.stringify(token.getResponse().body));
            return;
        }
        String username = token.getIdentity();

        if ("/api/encrypt/encrypt".equals(path) && "POST".equalsIgnoreCase(method)) {
            MultipartParser.Result form = readMultipart(exchange);
            String rawRecipients = form.fields.get("recipients");
            if (rawRecipients == null) {
                Log.warn("HTTP", "encrypt", "missing recipients user=" + username);
                sendResponse(exchange, 400, JsonUtil.stringify(Map.of("error", "Recipients are required")));
                return;
            }
            List<String> recipients = parseRecipients(rawRecipients);
            if (recipients.isEmpty()) {
                Log.warn("HTTP", "encrypt", "empty recipients user=" + username);
                sendResponse(exchange, 400, JsonUtil.stringify(Map.of("error", "Recipients are required")));
                return;
            }
            String encryptionType = form.fields.getOrDefault("encryption_type", "AES-256");
            Integer expiryDays;
            try {
                expiryDays = parseIntegerField(form.fields, "expiry_days", 1, 3650);
            } catch (IllegalArgumentException e) {
                sendResponse(exchange, 400, JsonUtil.stringify(Map.of("error", e.getMessage())));
                return;
            }
            Boolean selfDestruct = form.fields.containsKey("self_destruct") ? "true".equalsIgnoreCase(form.fields.get("self_destruct")) : null;
            String message = form.fields.getOrDefault("message", "");
            String processingMode = form.fields.getOrDefault("processing_mode", "auto");
            String manualTag = form.fields.getOrDefault("tag", "");

            String fileName = form.file != null ? form.file.filename : "<missing>";
            Log.info("HTTP", "encrypt", "start user=" + username + " file=" + fileName + " recipients=" + recipients.size());

            EncryptionApiModule.Response resp = encryptionModule.encryptFile(
                username,
                form.file,
                recipients,
                encryptionType,
                expiryDays,
                selfDestruct,
                message,
                processingMode,
                manualTag
            );
            sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
            Object fileId = resp.body != null ? resp.body.get("file_id") : null;
            Log.info("HTTP", "encrypt", "end user=" + username + " status=" + resp.statusCode + " fileId=" + fileId + " recipients=" + recipients.size());
            return;
        }
        if (path.matches("/api/encrypt/decrypt/[^/]+") && "POST".equalsIgnoreCase(method)) {
            String fileId = path.substring("/api/encrypt/decrypt/".length());
            EncryptionApiModule.FileResponse resp = encryptionModule.decryptFile(username, fileId);
            sendFileResponse(exchange, resp);
            return;
        }
        sendResponse(exchange, 404, JsonUtil.stringify(Map.of("error", "Endpoint not found")));
    }

    private TokenResult requireAccess(HttpExchange exchange) {
        String token = getAccessToken(exchange);
        return authModule.validateAccessToken(token);
    }

    private String getAccessToken(HttpExchange exchange) {
        String fromCookie = getCookieValue(exchange, "access_token");
        if (fromCookie != null && !fromCookie.isBlank()) {
            return fromCookie;
        }
        return getBearerToken(exchange);
    }

    private String getRefreshToken(HttpExchange exchange) {
        String fromCookie = getCookieValue(exchange, "refresh_token");
        if (fromCookie != null && !fromCookie.isBlank()) {
            return fromCookie;
        }
        return getBearerToken(exchange);
    }

    private String getBearerToken(HttpExchange exchange) {
        String auth = exchange.getRequestHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return null;
        }
        return auth.substring("Bearer ".length());
    }

    private String getCookieValue(HttpExchange exchange, String name) {
        List<String> cookieHeaders = exchange.getRequestHeaders().get("Cookie");
        if (cookieHeaders == null || cookieHeaders.isEmpty()) {
            return null;
        }
        for (String header : cookieHeaders) {
            if (header == null || header.isEmpty()) {
                continue;
            }
            String[] pairs = header.split(";");
            for (String pair : pairs) {
                String[] kv = pair.trim().split("=", 2);
                if (kv.length == 2 && name.equals(kv[0].trim())) {
                    return kv[1].trim();
                }
            }
        }
        return null;
    }

    private void appendAuthCookies(HttpExchange exchange, Map<String, Object> body) {
        if (body == null) {
            return;
        }
        Object access = body.get("access_token");
        if (access instanceof String && !((String) access).isBlank()) {
            exchange.getResponseHeaders().add("Set-Cookie", buildCookie("access_token", (String) access, ACCESS_COOKIE_MAX_AGE_SECONDS));
        }
        Object refresh = body.get("refresh_token");
        if (refresh instanceof String && !((String) refresh).isBlank()) {
            exchange.getResponseHeaders().add("Set-Cookie", buildCookie("refresh_token", (String) refresh, REFRESH_COOKIE_MAX_AGE_SECONDS));
        }
    }

    private void clearAuthCookies(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Set-Cookie", buildCookie("access_token", "", 0));
        exchange.getResponseHeaders().add("Set-Cookie", buildCookie("refresh_token", "", 0));
    }

    private String buildCookie(String name, String value, long maxAgeSeconds) {
        String safeValue = value == null ? "" : value.replace(";", "");
        StringBuilder cookie = new StringBuilder();
        cookie.append(name).append("=").append(safeValue)
            .append("; Path=/; HttpOnly; SameSite=Lax; Max-Age=").append(maxAgeSeconds);
        if (config.IS_PRODUCTION) {
            cookie.append("; Secure");
        }
        return cookie.toString();
    }

    private boolean isRateLimited(String action, String ip, int maxAttempts, long windowMs) {
        String key = action + ":" + (ip == null ? "unknown" : ip);
        long now = System.currentTimeMillis();
        Deque<Long> window = authRateWindowByKey.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && (now - window.peekFirst()) > windowMs) {
                window.pollFirst();
            }
            if (window.size() >= maxAttempts) {
                return true;
            }
            window.addLast(now);
            return false;
        }
    }

    private String extractIdentityKey(Map<String, Object> data, String action) {
        if (data == null) {
            return action + ":unknown";
        }
        Object username = data.get("username");
        if (username != null && !String.valueOf(username).isBlank()) {
            return action + ":" + String.valueOf(username).trim().toLowerCase(Locale.ROOT);
        }
        Object email = data.get("email");
        if (email != null && !String.valueOf(email).isBlank()) {
            return action + ":" + String.valueOf(email).trim().toLowerCase(Locale.ROOT);
        }
        return action + ":unknown";
    }

    private void logAuthRateLimit(String action, String ip, String identityKey) {
        Log.warn("SECURITY", "auth_rate_limit", "action=" + action + " ip=" + ip + " identity=" + identityKey);
    }

    private void logAuthFailureIfNeeded(String action, String ip, String identityKey, int statusCode) {
        if (statusCode >= 400 && statusCode != 429) {
            Log.warn("SECURITY", "auth_failure", "action=" + action + " ip=" + ip + " identity=" + identityKey + " status=" + statusCode);
        }
    }

    private String getUserAgent(HttpExchange exchange) {
        String userAgent = exchange.getRequestHeaders().getFirst("User-Agent");
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return "Unknown";
        }
        return userAgent;
    }

    private String getClientIp(HttpExchange exchange) {
        String xForwardedFor = exchange.getRequestHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            String[] ips = xForwardedFor.split(",");
            if (ips.length > 0 && !ips[0].trim().isEmpty()) {
                return ips[0].trim();
            }
        }
        InetSocketAddress remote = exchange.getRemoteAddress();
        if (remote != null && remote.getAddress() != null) {
            return remote.getAddress().getHostAddress();
        }
        return "0.0.0.0";
    }

    private String inferBrowser(String userAgent) {
        String ua = userAgent.toLowerCase(Locale.ROOT);
        if (ua.contains("edg/")) return "Edge";
        if (ua.contains("chrome/")) return "Chrome";
        if (ua.contains("safari/") && !ua.contains("chrome/")) return "Safari";
        if (ua.contains("firefox/")) return "Firefox";
        if (ua.contains("opr/") || ua.contains("opera")) return "Opera";
        return "Unknown";
    }

    private String inferOs(String userAgent) {
        String ua = userAgent.toLowerCase(Locale.ROOT);
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("mac os") || ua.contains("macintosh")) return "macOS";
        if (ua.contains("android")) return "Android";
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) return "iOS";
        if (ua.contains("linux")) return "Linux";
        return "Unknown";
    }

    private String inferDeviceType(String userAgent) {
        String ua = userAgent.toLowerCase(Locale.ROOT);
        if (ua.contains("ipad") || ua.contains("tablet")) return "tablet";
        if (ua.contains("mobi") || ua.contains("android")) return "mobile";
        return "desktop";
    }

    private Map<String, Object> readJson(HttpExchange exchange) throws IOException {
        byte[] body = exchange.getRequestBody().readAllBytes();
        if (body.length == 0) return null;
        String text = new String(body, StandardCharsets.UTF_8);
        return JsonUtil.parseObject(text);
    }

    private MultipartParser.Result readMultipart(HttpExchange exchange) throws IOException {
        String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
        byte[] body = exchange.getRequestBody().readAllBytes();
        return MultipartParser.parse(body, contentType);
    }

    private List<String> parseRecipients(String json) {
        List<String> recipients = new ArrayList<>();
        if (json == null || json.trim().isEmpty()) {
            return recipients;
        }

        Object parsed;
        try {
            parsed = JsonUtil.parse(json);
        } catch (Exception e) {
            parsed = null;
        }

        if (parsed instanceof List) {
            for (Object o : (List<?>) parsed) {
                String value = o != null ? String.valueOf(o).trim() : "";
                if (!value.isEmpty()) {
                    recipients.add(value);
                }
            }
            return recipients;
        }

        if (parsed instanceof String) {
            String raw = ((String) parsed).trim();
            if (raw.startsWith("[") && raw.endsWith("]")) {
                try {
                    Object reParsed = JsonUtil.parse(raw);
                    if (reParsed instanceof List) {
                        for (Object o : (List<?>) reParsed) {
                            String value = o != null ? String.valueOf(o).trim() : "";
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
            if (!raw.isEmpty()) {
                for (String part : raw.split(",")) {
                    String value = part.trim();
                    if (!value.isEmpty()) {
                        recipients.add(value);
                    }
                }
            }
            return recipients;
        }

        if (parsed != null) {
            String value = String.valueOf(parsed).trim();
            if (!value.isEmpty()) {
                recipients.add(value);
            }
        }

        if (recipients.isEmpty()) {
            String raw = json.trim();
            if (raw.startsWith("[") && raw.endsWith("]")) {
                raw = raw.substring(1, raw.length() - 1);
            }
            if (!raw.isEmpty()) {
                for (String part : raw.split(",")) {
                    String value = part.trim();
                    if (value.startsWith("\"") && value.endsWith("\"")) {
                        value = value.substring(1, value.length() - 1);
                    }
                    if (!value.isEmpty()) {
                        recipients.add(value);
                    }
                }
            }
        }

        return recipients;
    }

    private Map<String, String> parseQuery(String query) throws IOException {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String val = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, val);
        }
        return params;
    }

    private Integer parsePositiveIntQuery(Map<String, String> qs, String key, int min, int max) {
        if (qs == null || !qs.containsKey(key)) {
            return null;
        }
        String raw = qs.get(key);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        int value;
        try {
            value = Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid " + key + " parameter");
        }
        if (value < min || value > max) {
            throw new IllegalArgumentException("" + key + " must be between " + min + " and " + max);
        }
        return value;
    }

    private Integer parseIntegerField(Map<String, String> fields, String key, int min, int max) {
        if (fields == null || !fields.containsKey(key)) {
            return null;
        }
        String raw = fields.get(key);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        int value;
        try {
            value = Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid " + key + " value");
        }
        if (value < min || value > max) {
            throw new IllegalArgumentException("" + key + " must be between " + min + " and " + max);
        }
        return value;
    }

    private void sendResponse(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendError(HttpExchange exchange, int status, String code, String message, String requestId, Map<String, Object> details) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", message);
        body.put("code", code);
        body.put("status", status);
        body.put("request_id", requestId);
        if (details != null && !details.isEmpty()) {
            body.put("details", details);
        }
        sendResponse(exchange, status, JsonUtil.stringify(body));
    }

    private void sendFileResponse(HttpExchange exchange, Object respObj) throws IOException {
        if (respObj instanceof EncryptionApiModule.FileResponse) {
            EncryptionApiModule.FileResponse resp = (EncryptionApiModule.FileResponse) respObj;
            if (resp.body != null) {
                sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
                return;
            }
            if (resp.fileBytes != null) {
                exchange.getResponseHeaders().set("Content-Type", resp.mimeType != null ? resp.mimeType : "application/octet-stream");
                exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + resp.downloadName + "\"");
                exchange.sendResponseHeaders(resp.statusCode, resp.fileBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(resp.fileBytes);
                }
                return;
            }
            if (resp.filePath == null) {
                sendResponse(exchange, resp.statusCode, JsonUtil.stringify(Map.of("error", "Failed to download file")));
                return;
            }
            byte[] fileBytes = java.nio.file.Files.readAllBytes(Path.of(resp.filePath));
            exchange.getResponseHeaders().set("Content-Type", resp.mimeType != null ? resp.mimeType : "application/octet-stream");
            exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + resp.downloadName + "\"");
            exchange.sendResponseHeaders(resp.statusCode, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
            return;
        }

        if (respObj instanceof FileLifecycleModule.FileResponse) {
            FileLifecycleModule.FileResponse resp = (FileLifecycleModule.FileResponse) respObj;
            if (resp.body != null) {
                sendResponse(exchange, resp.statusCode, JsonUtil.stringify(resp.body));
                return;
            }
            if (resp.fileBytes != null) {
                exchange.getResponseHeaders().set("Content-Type", resp.mimeType != null ? resp.mimeType : "application/octet-stream");
                exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + resp.downloadName + "\"");
                exchange.sendResponseHeaders(resp.statusCode, resp.fileBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(resp.fileBytes);
                }
                return;
            }
            if (resp.filePath == null) {
                sendResponse(exchange, resp.statusCode, JsonUtil.stringify(Map.of("error", "Failed to download file")));
                return;
            }
            byte[] fileBytes = java.nio.file.Files.readAllBytes(Path.of(resp.filePath));
            exchange.getResponseHeaders().set("Content-Type", resp.mimeType != null ? resp.mimeType : "application/octet-stream");
            exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + resp.downloadName + "\"");
            exchange.sendResponseHeaders(resp.statusCode, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
            return;
        }
    }

    private void applyCors(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        List<String> allowed = corsOrigins != null ? corsOrigins : config.CORS_ORIGINS;
        if (origin != null && allowed.contains(origin)) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", origin);
            exchange.getResponseHeaders().set("Vary", "Origin");
            exchange.getResponseHeaders().set("Access-Control-Allow-Credentials", "true");
        }
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }
}
