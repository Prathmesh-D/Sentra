package com.sentra.backend.auth;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.model.Updates;
import com.sentra.backend.runtime.JsonUtil;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.mindrot.jbcrypt.BCrypt;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.net.URI;
import java.util.*;
import java.util.regex.Pattern;

public class AuthIdentityModule {
    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z\\s-]{2,50}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_]{3,20}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PASSWORD_UPPER = Pattern.compile(".*[A-Z].*");
    private static final Pattern PASSWORD_NUMBER = Pattern.compile(".*\\d.*");
    private static final Pattern PASSWORD_SPECIAL = Pattern.compile(".*[^A-Za-z0-9].*");
    private static final int MAX_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_AVATAR_MIME = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final MongoDatabase db;
    private final String jwtSecret;
    private final int bcryptRounds;
    private final int tokenExpiryHours;
    private final int refreshTokenExpiryDays;

    public AuthIdentityModule(MongoDatabase db, String jwtSecret, int bcryptRounds, int tokenExpiryHours, int refreshTokenExpiryDays) {
        this.db = db;
        this.jwtSecret = jwtSecret;
        this.bcryptRounds = bcryptRounds;
        this.tokenExpiryHours = tokenExpiryHours;
        this.refreshTokenExpiryDays = refreshTokenExpiryDays;
    }

    public static class Response {
        public final int statusCode;
        public final Map<String, Object> body;

        public Response(int statusCode, Map<String, Object> body) {
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    private static class AvatarValidationResult {
        public final boolean success;
        public final int statusCode;
        public final String errorMessage;
        public final String avatarDataUrl;

        private AvatarValidationResult(boolean success, int statusCode, String errorMessage, String avatarDataUrl) {
            this.success = success;
            this.statusCode = statusCode;
            this.errorMessage = errorMessage;
            this.avatarDataUrl = avatarDataUrl;
        }

        static AvatarValidationResult ok(String avatarDataUrl) {
            return new AvatarValidationResult(true, 200, null, avatarDataUrl);
        }

        static AvatarValidationResult fail(int statusCode, String errorMessage) {
            return new AvatarValidationResult(false, statusCode, errorMessage, null);
        }
    }

    // =====================================================================
    // Route Handlers (auth.py)
    // =====================================================================

    /**
     * [PRESERVED]
     * POST /api/auth/register
     */
    public Response register(Map<String, Object> data) {
        return register(data, "Unknown Device", "0.0.0.0", "Unknown", "Unknown", "desktop", "Unknown");
    }

    public Response register(Map<String, Object> data, String deviceLabel, String ip, String browser, String os, String deviceType, String location) {
        try {
            if (data == null) {
                return new Response(400, mapOf("error", "Missing required fields"));
            }

            if (!data.containsKey("username") || !data.containsKey("email") || !data.containsKey("password")) {
                return new Response(400, mapOf("error", "Missing required fields"));
            }

            String username = String.valueOf(data.get("username"));
            String email = String.valueOf(data.get("email"));
            String password = String.valueOf(data.get("password"));
            Object fullNameObj = data.get("full_name");
            String fullName = fullNameObj != null ? String.valueOf(fullNameObj) : "";

            Document user = createUser(username, email, password, fullName);
            if (user == null) {
                return new Response(400, mapOf("error", "User already exists or registration failed"));
            }

            String sessionId = UUID.randomUUID().toString();
            String accessToken = createAccessToken(username, tokenExpiryHours, sessionId);
            String refreshToken = createRefreshToken(username, refreshTokenExpiryDays, sessionId);
            createOrUpdateSession(username, sessionId, accessToken, refreshToken, deviceLabel, ip, browser, os, deviceType, location);
            recordLastLogin(username, deviceLabel, browser, os, location, ip);

            return new Response(201, mapOf(
                "message", "User registered successfully",
                "access_token", accessToken,
                "refresh_token", refreshToken,
                "user", mapOf(
                    "username", username,
                    "email", email,
                    "full_name", fullName
                )
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Registration failed"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/auth/login
     */
    public Response login(Map<String, Object> data) {
        return login(data, "Unknown Device", "0.0.0.0", "Unknown", "Unknown", "desktop", "Unknown");
    }

    public Response login(Map<String, Object> data, String deviceLabel, String ip, String browser, String os, String deviceType, String location) {
        try {
            String username = data != null ? getStringOrNull(data.get("username")) : null;
            String password = data != null ? getStringOrNull(data.get("password")) : null;

            if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
                return new Response(400, mapOf("error", "Username and password required"));
            }

            Document user;
            try {
                user = verifyCredentials(username, password);
            } catch (Exception e) {
                return new Response(500, mapOf("error", "Database connection error. Please check your internet connection."));
            }

            if (user == null) {
                return new Response(401, mapOf("error", "Invalid credentials"));
            }

            String sessionId = UUID.randomUUID().toString();
            String accessToken = createAccessToken(username, tokenExpiryHours, sessionId);
            String refreshToken = createRefreshToken(username, refreshTokenExpiryDays, sessionId);
            createOrUpdateSession(username, sessionId, accessToken, refreshToken, deviceLabel, ip, browser, os, deviceType, location);
            recordLastLogin(username, deviceLabel, browser, os, location, ip);

            Object profileObj = user.get("profile");
            String fullName = username;
            if (profileObj instanceof Document) {
                Object fn = ((Document) profileObj).get("full_name");
                if (fn != null) {
                    fullName = String.valueOf(fn);
                }
            }
            String avatarUrl = getProfileAvatarUrl(user);
            String bio = getProfileBio(user);
            boolean isPublic = isProfilePublic(user);

            return new Response(200, mapOf(
                "access_token", accessToken,
                "refresh_token", refreshToken,
                "user", mapOf(
                    "username", user.get("username"),
                    "email", user.get("email"),
                    "full_name", fullName,
                    "bio", bio,
                    "avatar_url", avatarUrl,
                    "is_public", isPublic
                )
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Login failed"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/auth/logout
     */
    public Response logout(String accessToken) {
        try {
            TokenResult result = requireAccessToken(accessToken);
            if (!result.success) {
                return result.response;
            }
            if (result.sessionId != null && !result.sessionId.isEmpty()) {
                deactivateSession(result.identity, result.sessionId);
            }
            return new Response(200, mapOf("message", "Logged out successfully"));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Logout failed"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/auth/refresh
     */
    public Response refresh(String refreshToken) {
        try {
            TokenResult result = requireRefreshToken(refreshToken);
            if (!result.success) {
                return result.response;
            }

            String sessionId = result.sessionId != null ? result.sessionId : UUID.randomUUID().toString();
            String newAccessToken = createAccessToken(result.identity, tokenExpiryHours, sessionId);
            updateSessionAccessToken(result.identity, sessionId, newAccessToken);
            return new Response(200, mapOf("access_token", newAccessToken));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Token refresh failed"));
        }
    }

    /**
     * [PRESERVED]
     * GET /api/auth/me
     */
    public Response getCurrentUser(String accessToken) {
        try {
            TokenResult result = requireAccessToken(accessToken);
            if (!result.success) {
                return result.response;
            }
            String username = result.identity;

            Document user = getUserByUsername(username);
            if (user == null) {
                return new Response(404, mapOf("error", "User not found"));
            }

            Object createdAt = user.get("created_at");
            Object lastLogin = user.get("last_login");
            Object passwordChangedAt = user.get("lastPasswordChangedAt") != null ? user.get("lastPasswordChangedAt") : user.get("password_changed_at");
            String avatarUrl = getProfileAvatarUrl(user);
            String bio = getProfileBio(user);
            boolean isPublic = isProfilePublic(user);

            return new Response(200, mapOf(
                "username", user.get("username"),
                "email", user.get("email"),
                "full_name", getProfileFullName(user, username),
                "bio", bio,
                "avatar_url", avatarUrl,
                "is_public", isPublic,
                "created_at", toIsoOrNull(createdAt),
                "last_login", toIsoOrNull(lastLogin),
                "password_changed_at", toIsoOrNull(passwordChangedAt)
            ));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to get user information"));
        }
    }

    /**
     * [PRESERVED]
     * POST /api/auth/change-password
     */
    public Response changePassword(String accessToken, Map<String, Object> data) {
        try {
            TokenResult result = requireAccessToken(accessToken);
            if (!result.success) {
                return result.response;
            }

            if (data == null) {
                return new Response(400, mapOf("error", "Both current and new password required"));
            }

            Object currentPasswordObj = data.get("current_password");
            Object newPasswordObj = data.get("new_password");

            if (currentPasswordObj == null || newPasswordObj == null) {
                return new Response(400, mapOf("error", "Both current and new password required"));
            }

            String currentPassword = String.valueOf(currentPasswordObj);
            String newPassword = String.valueOf(newPasswordObj);

            boolean success = changePassword(result.identity, currentPassword, newPassword);
            if (!success) {
                return new Response(401, mapOf("error", "Current password is incorrect"));
            }

            if (result.sessionId != null) {
                deactivateOtherSessions(result.identity, result.sessionId);
            }

            return new Response(200, mapOf("message", "Password changed successfully"));

        } catch (Exception e) {
            return new Response(500, mapOf("error", "Password change failed"));
        }
    }

    // =====================================================================
    // User Service Methods (user_service.py)
    // =====================================================================

    /**
     * [PRESERVED]
     */
    public Document createUser(String username, String email, String password, String fullName) {
        try {
            MongoCollection<Document> users = getUsersCollection();

            Document existing = users.find(new Document("$or", Arrays.asList(
                new Document("username", username),
                new Document("email", email)
            ))).first();

            if (existing != null) {
                return null;
            }

            String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(bcryptRounds));

            KeyPair keyPair = generateRsaKeypair(2048);
            String publicKeyPem = toPemPublic((RSAPublicKey) keyPair.getPublic());
            String privateKeyPem = toPemPrivate((RSAPrivateKey) keyPair.getPrivate());

            Document userDoc = new Document()
                .append("username", username)
                .append("email", email)
                .append("password_hash", passwordHash)
                .append("passwordHash", passwordHash)
                .append("public_key", publicKeyPem)
                .append("private_key_encrypted", privateKeyPem)
                .append("created_at", new Date())
                .append("updated_at", new Date())
                .append("updatedAt", new Date())
                .append("last_login", null)
                .append("is_active", true)
                .append("name", (fullName == null || fullName.isEmpty()) ? username : fullName)
                .append("bio", "")
                .append("avatarUrl", null)
                .append("isPublic", false)
                .append("lastPasswordChangedAt", null)
                .append("emailChangeToken", null)
                .append("emailChangePending", null)
                .append("emailChangeExpiry", null)
                .append("profile", new Document()
                    .append("full_name", (fullName == null || fullName.isEmpty()) ? username : fullName)
                    .append("bio", "")
                    .append("avatar_url", null)
                    .append("is_public", false)
                    .append("phone", "")
                    .append("organization", "")
                );

            users.insertOne(userDoc);
            return userDoc;

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [PRESERVED]
     */
    public Document verifyCredentials(String username, String password) throws Exception {
        try {
            MongoCollection<Document> users = getUsersCollection();
            Document user = users.find(new Document("username", username)).first();

            if (user == null) {
                return null;
            }

            Object isActive = user.get("is_active");
            if (isActive instanceof Boolean && !((Boolean) isActive)) {
                return null;
            }

            Object passwordHash = user.get("password_hash");
            if (passwordHash == null) {
                return null;
            }

            boolean valid = BCrypt.checkpw(password, String.valueOf(passwordHash));
            return valid ? user : null;

        } catch (Exception e) {
            throw new Exception("Failed to connect to database. Please check your internet connection.");
        }
    }

    /**
     * [PRESERVED]
     */
    public Document getUserByUsername(String username) {
        try {
            MongoCollection<Document> users = getUsersCollection();
            return users.find(new Document("username", username)).first();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [PRESERVED]
     */
    public Document getUserById(String userId) {
        try {
            MongoCollection<Document> users = getUsersCollection();
            return users.find(Filters.eq("_id", new ObjectId(userId))).first();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [PRESERVED]
     */
    public boolean updateProfile(String username, Map<String, Object> profileData) {
        try {
            MongoCollection<Document> users = getUsersCollection();
            Document updateFields = new Document("updated_at", new Date());

            List<String> allowedFields = Arrays.asList("full_name", "email", "phone", "organization");
            for (String field : allowedFields) {
                if (profileData.containsKey(field)) {
                    if (field.equals("email")) {
                        updateFields.append("email", profileData.get(field));
                    } else {
                        updateFields.append("profile." + field, profileData.get(field));
                    }
                }
            }

            return users.updateOne(
                new Document("username", username),
                new Document("$set", updateFields)
            ).getModifiedCount() > 0;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * [PRESERVED]
     */
    public boolean changePassword(String username, String currentPassword, String newPassword) {
        try {
            Document user = verifyCredentials(username, currentPassword);
            if (user == null) {
                return false;
            }

            String newPasswordHash = BCrypt.hashpw(newPassword, BCrypt.gensalt(bcryptRounds));

            MongoCollection<Document> users = getUsersCollection();
                Date now = new Date();
            return users.updateOne(
                new Document("username", username),
                new Document("$set", new Document("password_hash", newPasswordHash)
                    .append("passwordHash", newPasswordHash)
                    .append("password_changed_at", now)
                    .append("lastPasswordChangedAt", now)
                    .append("updated_at", now)
                    .append("updatedAt", now))
            ).getModifiedCount() > 0;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * [PRESERVED]
     */
    public String getUserPublicKey(String username) {
        try {
            MongoCollection<Document> users = getUsersCollection();
            Document user = users.find(new Document("username", username))
                .projection(new Document("public_key", 1))
                .first();
            return user != null ? String.valueOf(user.get("public_key")) : null;
        } catch (Exception e) {
            return null;
        }
    }

    public Response getUserProfile(String username) {
        try {
            Document user = getUserByUsername(username);
            if (user == null) {
                return new Response(404, mapOf("error", "User not found"));
            }
            Document profile = user.get("profile", Document.class);
            String fullName = user.get("name") != null ? String.valueOf(user.get("name"))
                : profile != null ? String.valueOf(profile.getOrDefault("full_name", username)) : username;
            String bio = user.get("bio") != null ? String.valueOf(user.get("bio"))
                : profile != null ? String.valueOf(profile.getOrDefault("bio", "")) : "";
            String avatarUrl = user.get("avatarUrl") != null ? String.valueOf(user.get("avatarUrl"))
                : profile != null && profile.get("avatar_url") != null ? String.valueOf(profile.get("avatar_url")) : null;
            boolean isPublic = user.get("isPublic") instanceof Boolean ? (Boolean) user.get("isPublic")
                : profile != null && Boolean.TRUE.equals(profile.getOrDefault("is_public", false));
            Document preferences = withPreferenceDefaults(user.get("preferences", Document.class));
            Document security = user.get("security", Document.class);
            Object passwordChangedAt = user.get("lastPasswordChangedAt") != null ? user.get("lastPasswordChangedAt") : user.get("password_changed_at");
            String createdAtIso = toIsoOrNull(user.get("created_at")) != null ? String.valueOf(toIsoOrNull(user.get("created_at"))) : null;
            String pwdChangedIso = toIsoOrNull(passwordChangedAt) != null ? String.valueOf(toIsoOrNull(passwordChangedAt)) : null;

            Map<String, Object> normalizedUser = new LinkedHashMap<>();
            normalizedUser.put("id", String.valueOf(user.get("_id")));
            normalizedUser.put("name", fullName);
            normalizedUser.put("username", username);
            normalizedUser.put("email", user.get("email"));
            normalizedUser.put("bio", bio);
            normalizedUser.put("avatarUrl", avatarUrl);
            normalizedUser.put("isPublic", isPublic);
            normalizedUser.put("lastPasswordChangedAt", pwdChangedIso);
            normalizedUser.put("createdAt", createdAtIso);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("user", normalizedUser);
            body.put("id", normalizedUser.get("id"));
            body.put("username", normalizedUser.get("username"));
            body.put("email", normalizedUser.get("email"));
            body.put("full_name", fullName);
            body.put("bio", bio);
            body.put("avatar_url", avatarUrl);
            body.put("is_public", isPublic);
            body.put("created_at", createdAtIso);
            body.put("password_changed_at", pwdChangedIso);
            body.put("preferences", preferences);
            body.put("security", security != null ? security : mapOf("autoLockTimeout", "never", "sessionTimeout", "8h"));

            return new Response(200, body);
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to load profile"));
        }
    }

    public Response updateUserProfile(String username, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("errors", mapOf("profile", "Missing profile payload")));
            }
            String fullName = data.get("name") != null ? String.valueOf(data.get("name")).trim() : null;
            if (fullName == null && data.get("full_name") != null) {
                fullName = String.valueOf(data.get("full_name")).trim();
            }
            String requestedUsername = data.get("username") != null ? String.valueOf(data.get("username")).trim().toLowerCase(Locale.ROOT) : username;
            String bio = data.get("bio") != null ? String.valueOf(data.get("bio")).trim() : "";
            String avatar = null;
            if (data.containsKey("avatarUrl")) {
                Object avatarRaw = data.get("avatarUrl");
                avatar = avatarRaw == null ? null : String.valueOf(avatarRaw).trim();
            } else if (data.get("avatar") != null) {
                avatar = String.valueOf(data.get("avatar")).trim();
            }
            boolean isPublic = data.get("isPublic") instanceof Boolean
                ? (Boolean) data.get("isPublic")
                : Boolean.parseBoolean(String.valueOf(data.getOrDefault("isPublic", "false")));

            Map<String, String> validationErrors = new LinkedHashMap<>();
            if (fullName == null || !NAME_PATTERN.matcher(fullName).matches()) {
                validationErrors.put("name", "Name must be 2-50 chars and contain only letters, spaces, and hyphens.");
            }
            if (requestedUsername == null || !USERNAME_PATTERN.matcher(requestedUsername).matches()) {
                validationErrors.put("username", "Username must be 3-20 chars and only lowercase letters, numbers, and underscores.");
            }
            if (bio.length() > 200) {
                validationErrors.put("bio", "Bio must be at most 200 characters.");
            }
            if (data.containsKey("isPublic") && !(data.get("isPublic") instanceof Boolean)) {
                String raw = String.valueOf(data.get("isPublic"));
                if (!"true".equalsIgnoreCase(raw) && !"false".equalsIgnoreCase(raw)) {
                    validationErrors.put("isPublic", "isPublic must be a boolean.");
                }
            }
            if (avatar != null && !avatar.isEmpty()) {
                if (avatar.startsWith("data:")) {
                    AvatarValidationResult avatarValidation = validateAndNormalizeAvatarDataUrl(avatar);
                    if (!avatarValidation.success) {
                        validationErrors.put("avatarUrl", avatarValidation.errorMessage);
                    } else {
                        avatar = avatarValidation.avatarDataUrl;
                    }
                } else {
                    try {
                        URI parsed = URI.create(avatar);
                        if (parsed.getScheme() == null || (!"http".equalsIgnoreCase(parsed.getScheme()) && !"https".equalsIgnoreCase(parsed.getScheme()))) {
                            validationErrors.put("avatarUrl", "avatarUrl must be a valid http/https URL, data URL, or null.");
                        }
                    } catch (Exception ex) {
                        validationErrors.put("avatarUrl", "avatarUrl must be a valid http/https URL, data URL, or null.");
                    }
                }
            }

            if (!validationErrors.isEmpty()) {
                return new Response(400, mapOf("errors", validationErrors));
            }

            if (!username.equals(requestedUsername)) {
                Document existingUsername = getUsersCollection().find(Filters.eq("username", requestedUsername)).first();
                if (existingUsername != null) {
                    return new Response(409, mapOf("errors", mapOf("username", "Username is already taken")));
                }
            }

            Document setDoc = new Document("updated_at", new Date())
                .append("updatedAt", new Date())
                .append("name", fullName)
                .append("bio", bio)
                .append("isPublic", isPublic)
                .append("profile.full_name", fullName)
                .append("profile.bio", bio)
                .append("profile.is_public", isPublic)
                .append("username", requestedUsername);
            if (data.containsKey("avatarUrl") || data.containsKey("avatar")) {
                String avatarValue = (avatar == null || avatar.isEmpty()) ? null : avatar;
                setDoc.append("avatarUrl", avatarValue);
                setDoc.append("profile.avatar_url", avatarValue);
            }

            getUsersCollection().updateOne(Filters.eq("username", username), new Document("$set", setDoc));
            Response profileResponse = getUserProfile(requestedUsername);
            if (profileResponse.statusCode != 200) {
                return profileResponse;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> userBody = (Map<String, Object>) profileResponse.body.get("user");
            return new Response(200, mapOf("success", true, "user", userBody));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to update profile"));
        }
    }

    public Response checkUsernameAvailability(String currentUsername, String candidateUsername) {
        try {
            String candidate = candidateUsername != null ? candidateUsername.trim().toLowerCase(Locale.ROOT) : "";
            if (!USERNAME_PATTERN.matcher(candidate).matches()) {
                return new Response(400, mapOf("error", "Invalid username format"));
            }
            if (candidate.equals(currentUsername)) {
                return new Response(200, mapOf("available", true, "unchanged", true));
            }

            Document existing = getUsersCollection().find(Filters.eq("username", candidate)).first();
            return new Response(200, mapOf("available", existing == null));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to check username"));
        }
    }

    public Response changePasswordStrict(String username, String currentSessionId, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("errors", mapOf("password", "Missing password payload")));
            }
            String currentPassword = String.valueOf(data.getOrDefault("currentPassword", ""));
            String newPassword = String.valueOf(data.getOrDefault("newPassword", ""));
            String confirmNewPassword = String.valueOf(data.getOrDefault("confirmNewPassword", ""));

            Map<String, String> errors = new LinkedHashMap<>();
            if (currentPassword.trim().isEmpty()) {
                errors.put("currentPassword", "Current password is required.");
            }
            if (!isStrongPassword(newPassword)) {
                errors.put("newPassword", "Password must be at least 8 chars and include uppercase, number, and special character.");
            }
            if (!newPassword.equals(confirmNewPassword)) {
                errors.put("confirmNewPassword", "Confirmation password does not match.");
            }
            if (currentPassword.equals(newPassword) && !currentPassword.isEmpty()) {
                errors.put("newPassword", "New password must be different from current password.");
            }
            if (!errors.isEmpty()) {
                return new Response(400, mapOf("errors", errors));
            }

            boolean changed = changePassword(username, currentPassword, newPassword);
            if (!changed) {
                return new Response(401, mapOf("errors", mapOf("currentPassword", "Current password is incorrect.")));
            }

            Date now = new Date();
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document()
                    .append("lastPasswordChangedAt", now)
                    .append("password_changed_at", now)
                    .append("updated_at", now)
                    .append("updatedAt", now)
                )
            );

            deactivateOtherSessions(username, currentSessionId);
            return new Response(200, mapOf("success", true, "lastPasswordChangedAt", toIsoOrNull(now)));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Password update failed"));
        }
    }

    public Response requestEmailChange(String username, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("errors", mapOf("newEmail", "Missing payload")));
            }
            String newEmail = String.valueOf(data.getOrDefault("newEmail", "")).trim().toLowerCase(Locale.ROOT);
            String currentPassword = String.valueOf(data.getOrDefault("currentPassword", ""));

            Map<String, String> errors = new LinkedHashMap<>();
            if (!EMAIL_PATTERN.matcher(newEmail).matches()) {
                errors.put("newEmail", "Enter a valid email address.");
            }
            if (currentPassword.trim().isEmpty()) {
                errors.put("currentPassword", "Current password is required.");
            }
            Document currentUser = getUserByUsername(username);
            if (currentUser == null) {
                return new Response(404, mapOf("error", "User not found"));
            }
            String existingEmail = String.valueOf(currentUser.getOrDefault("email", "")).toLowerCase(Locale.ROOT);
            if (existingEmail.equals(newEmail)) {
                errors.put("newEmail", "New email must be different from current email.");
            }
            if (!errors.isEmpty()) {
                return new Response(400, mapOf("errors", errors));
            }

            Document existingEmailDoc = getUsersCollection().find(Filters.eq("email", newEmail)).first();
            if (existingEmailDoc != null && !username.equals(String.valueOf(existingEmailDoc.get("username")))) {
                return new Response(400, mapOf("errors", mapOf("newEmail", "This email is already associated with another account.")));
            }

            Document verifiedUser = verifyCredentials(username, currentPassword);
            if (verifiedUser == null) {
                return new Response(401, mapOf("errors", mapOf("currentPassword", "Current password is incorrect.")));
            }

            byte[] tokenBytes = new byte[32];
            new java.security.SecureRandom().nextBytes(tokenBytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            String tokenHash = sha256Hex(rawToken);
            Date expiresAt = Date.from(Instant.now().plusSeconds(60 * 60));

            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document()
                    .append("emailChangeToken", tokenHash)
                    .append("emailChangePending", newEmail)
                    .append("emailChangeExpiry", expiresAt)
                    .append("updated_at", new Date())
                    .append("updatedAt", new Date())
                )
            );

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("message", "Verification sent");
            if (isDevelopmentMode()) {
                body.put("devToken", rawToken);
            }
            return new Response(200, body);
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to request email change"));
        }
    }

    public Response confirmEmailChange(Map<String, Object> data) {
        try {
            if (data == null || data.get("token") == null) {
                return new Response(400, mapOf("error", "Missing token"));
            }
            String token = String.valueOf(data.get("token"));
            String tokenHash = sha256Hex(token);

            Document pending = getUsersCollection().find(Filters.eq("emailChangeToken", tokenHash)).first();
            if (pending == null || pending.get("emailChangePending") == null) {
                return new Response(400, mapOf("error", "Invalid token"));
            }
            Date expiresAt = pending.getDate("emailChangeExpiry");
            if (expiresAt == null || expiresAt.before(new Date())) {
                getUsersCollection().updateOne(
                    Filters.eq("_id", pending.get("_id")),
                    new Document("$set", new Document()
                        .append("emailChangeToken", null)
                        .append("emailChangePending", null)
                        .append("emailChangeExpiry", null)
                        .append("updated_at", new Date())
                        .append("updatedAt", new Date())
                    )
                );
                return new Response(400, mapOf("error", "Token expired"));
            }

            String username = String.valueOf(pending.get("username"));
            String newEmail = String.valueOf(pending.get("emailChangePending"));
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document("email", newEmail)
                    .append("emailChangeToken", null)
                    .append("emailChangePending", null)
                    .append("emailChangeExpiry", null)
                    .append("updated_at", new Date())
                    .append("updatedAt", new Date())
                )
            );

            return new Response(200, mapOf("success", true, "newEmail", newEmail));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to confirm email change"));
        }
    }

    public Response cancelEmailChange(String username) {
        try {
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document()
                    .append("emailChangeToken", null)
                    .append("emailChangePending", null)
                    .append("emailChangeExpiry", null)
                    .append("updated_at", new Date())
                    .append("updatedAt", new Date())
                )
            );
            return new Response(200, mapOf("success", true));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to cancel email change"));
        }
    }

    public Response uploadAvatar(String username, Map<String, Object> data) {
        try {
            if (data == null || data.get("avatarBase64") == null) {
                return new Response(400, mapOf("errors", mapOf("avatar", "Avatar image payload is required.")));
            }

            String avatarBase64 = String.valueOf(data.get("avatarBase64")).trim();
            String mimeType = String.valueOf(data.getOrDefault("mimeType", "")).toLowerCase(Locale.ROOT).trim();
            String avatarCandidate = avatarBase64;
            if (!avatarCandidate.startsWith("data:")) {
                if (mimeType == null || mimeType.isBlank()) {
                    return new Response(400, mapOf("errors", mapOf("avatar", "Avatar mime type is required.")));
                }
                avatarCandidate = "data:" + mimeType + ";base64," + avatarBase64;
            }

            AvatarValidationResult avatarValidation = validateAndNormalizeAvatarDataUrl(avatarCandidate);
            if (!avatarValidation.success) {
                return new Response(avatarValidation.statusCode, mapOf("errors", mapOf("avatar", avatarValidation.errorMessage)));
            }

            String normalizedAvatarDataUrl = avatarValidation.avatarDataUrl;

            String avatarHash = sha256Hex(normalizedAvatarDataUrl + ":" + username);
            String avatarRef = "avatar_ref:" + avatarHash;
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document()
                    .append("avatarUrl", normalizedAvatarDataUrl)
                    .append("profile.avatar_url", normalizedAvatarDataUrl)
                    .append("avatarRef", avatarRef)
                    .append("profile.avatar_ref", avatarRef)
                    .append("updated_at", new Date())
                    .append("updatedAt", new Date())
                )
            );
            return new Response(200, mapOf("success", true, "avatarRef", avatarRef, "avatarUrl", normalizedAvatarDataUrl));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to upload avatar"));
        }
    }

    public Response removeAvatar(String username) {
        try {
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document()
                    .append("avatarUrl", null)
                    .append("profile.avatar_url", null)
                    .append("avatarRef", null)
                    .append("profile.avatar_ref", null)
                    .append("updated_at", new Date())
                    .append("updatedAt", new Date())
                )
            );
            return new Response(200, mapOf("success", true));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to remove avatar"));
        }
    }

    public Response updatePreferences(String username, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("error", "Missing payload"));
            }
            Document user = getUserByUsername(username);
            if (user == null) {
                return new Response(404, mapOf("error", "User not found"));
            }
            Document current = withPreferenceDefaults(user.get("preferences", Document.class));

            if (data.containsKey("theme")) {
                String theme = String.valueOf(data.get("theme"));
                if (!Arrays.asList("light", "dark", "system").contains(theme)) {
                    return new Response(400, mapOf("field", "theme", "error", "Invalid theme option."));
                }
                current.put("theme", theme);
            }
            if (data.containsKey("density")) {
                String density = String.valueOf(data.get("density"));
                if (!Arrays.asList("comfortable", "compact", "spacious").contains(density)) {
                    return new Response(400, mapOf("field", "density", "error", "Invalid density option."));
                }
                current.put("density", density);
            }
            if (data.containsKey("language")) {
                String language = String.valueOf(data.get("language"));
                if (language == null || language.trim().isEmpty()) {
                    return new Response(400, mapOf("field", "language", "error", "Language is required."));
                }
                current.put("language", language.trim());
            }
            if (data.containsKey("fontScale")) {
                String fontScale = String.valueOf(data.get("fontScale"));
                if (!Arrays.asList("small", "default", "large").contains(fontScale)) {
                    return new Response(400, mapOf("field", "fontScale", "error", "Invalid font scale option."));
                }
                current.put("fontScale", fontScale);
            }
            if (data.containsKey("reduceMotion")) {
                Object reduceMotionRaw = data.get("reduceMotion");
                Boolean reduceMotion = null;

                if (reduceMotionRaw instanceof Boolean) {
                    reduceMotion = (Boolean) reduceMotionRaw;
                } else if (reduceMotionRaw != null) {
                    String raw = String.valueOf(reduceMotionRaw).trim().toLowerCase(Locale.ROOT);
                    if ("true".equals(raw) || "1".equals(raw)) {
                        reduceMotion = true;
                    } else if ("false".equals(raw) || "0".equals(raw)) {
                        reduceMotion = false;
                    }
                }

                if (reduceMotion == null) {
                    return new Response(400, mapOf("field", "reduceMotion", "error", "reduceMotion must be a boolean."));
                }
                current.put("reduceMotion", reduceMotion);
            }
            if (data.containsKey("statusBadgeStyle")) {
                String statusBadgeStyle = String.valueOf(data.get("statusBadgeStyle"));
                if (!Arrays.asList("filled", "outline", "minimal").contains(statusBadgeStyle)) {
                    return new Response(400, mapOf("field", "statusBadgeStyle", "error", "Invalid status badge style option."));
                }
                current.put("statusBadgeStyle", statusBadgeStyle);
            }
            if (data.containsKey("rowStriping")) {
                Object rowStripingRaw = data.get("rowStriping");
                Boolean rowStriping = null;

                if (rowStripingRaw instanceof Boolean) {
                    rowStriping = (Boolean) rowStripingRaw;
                } else if (rowStripingRaw != null) {
                    String raw = String.valueOf(rowStripingRaw).trim().toLowerCase(Locale.ROOT);
                    if ("true".equals(raw) || "1".equals(raw)) {
                        rowStriping = true;
                    } else if ("false".equals(raw) || "0".equals(raw)) {
                        rowStriping = false;
                    }
                }

                if (rowStriping == null) {
                    return new Response(400, mapOf("field", "rowStriping", "error", "rowStriping must be a boolean."));
                }
                current.put("rowStriping", rowStriping);
            }
            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document("preferences", current).append("updated_at", new Date()))
            );

            return new Response(200, mapOf("success", true, "preferences", current));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to update preferences"));
        }
    }

    public Response updateSecurityPreferences(String username, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("error", "Missing payload"));
            }
            Document user = getUserByUsername(username);
            if (user == null) {
                return new Response(404, mapOf("error", "User not found"));
            }
            Document current = user.get("security", Document.class);
            if (current == null) {
                current = new Document("autoLockTimeout", "never")
                    .append("sessionTimeout", "8h");
            }
            if (data.containsKey("autoLockTimeout")) {
                String autoLockTimeout = String.valueOf(data.get("autoLockTimeout"));
                if (!Arrays.asList("5m", "15m", "30m", "never").contains(autoLockTimeout)) {
                    return new Response(400, mapOf("field", "autoLockTimeout", "error", "Invalid auto-lock timeout."));
                }
                current.put("autoLockTimeout", autoLockTimeout);
            }
            if (data.containsKey("sessionTimeout")) {
                String sessionTimeout = String.valueOf(data.get("sessionTimeout"));
                if (!Arrays.asList("1h", "8h", "24h", "never").contains(sessionTimeout)) {
                    return new Response(400, mapOf("field", "sessionTimeout", "error", "Invalid session timeout."));
                }
                current.put("sessionTimeout", sessionTimeout);
            }
            if (data.containsKey("twoFactorEnabled")) {
                boolean twoFactorEnabled = Boolean.parseBoolean(String.valueOf(data.get("twoFactorEnabled")));
                current.put("twoFactorEnabled", twoFactorEnabled);
                current.put("two_factor_enabled", twoFactorEnabled);
            }

            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document("security", current).append("updated_at", new Date()))
            );
            return new Response(200, mapOf("success", true, "security", current));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to update security settings"));
        }
    }

    public Response getLastLogin(String username) {
        try {
            Document user = getUserByUsername(username);
            if (user == null) {
                return new Response(404, mapOf("error", "User not found"));
            }
            Document info = user.get("last_login_info", Document.class);
            if (info == null) {
                return new Response(200, mapOf(
                    "timestamp", toIsoOrNull(user.get("last_login")),
                    "device", "Unknown Device",
                    "browser", "Unknown",
                    "location", null
                ));
            }
            return new Response(200, mapOf(
                "timestamp", toIsoOrNull(info.get("timestamp")),
                "device", info.getOrDefault("device", "Unknown Device"),
                "browser", info.getOrDefault("browser", "Unknown"),
                "location", info.get("location")
            ));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to load last login info"));
        }
    }

    public Response listSessions(String username, String currentSessionId) {
        try {
            MongoCollection<Document> sessions = getSessionsCollection();
            List<Map<String, Object>> sessionList = new ArrayList<>();
            for (Document doc : sessions.find(Filters.and(Filters.eq("username", username), Filters.eq("is_active", true)))) {
                String sessionId = String.valueOf(doc.get("session_id"));
                sessionList.add(mapOf(
                    "id", sessionId,
                    "device", doc.getOrDefault("device", "Unknown Device"),
                    "browser", doc.getOrDefault("browser", "Unknown"),
                    "os", doc.getOrDefault("os", "Unknown"),
                    "deviceType", doc.getOrDefault("device_type", "desktop"),
                    "ip", doc.getOrDefault("ip", "0.0.0.0"),
                    "location", doc.getOrDefault("location", "Unknown"),
                    "lastActive", toIsoOrNull(doc.get("last_active")),
                    "isCurrent", sessionId.equals(currentSessionId)
                ));
            }
            return new Response(200, mapOf("sessions", sessionList));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to load sessions"));
        }
    }

    public Response revokeSession(String username, String sessionId, String currentSessionId) {
        try {
            if (sessionId == null || sessionId.isEmpty()) {
                return new Response(400, mapOf("error", "Invalid session id"));
            }
            if (sessionId.equals(currentSessionId)) {
                return new Response(400, mapOf("error", "Current session cannot be revoked from this action"));
            }
            getSessionsCollection().updateOne(
                Filters.and(Filters.eq("username", username), Filters.eq("session_id", sessionId)),
                new Document("$set", new Document("is_active", false).append("revoked_at", new Date()))
            );
            return new Response(200, mapOf("success", true));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to revoke session"));
        }
    }

    public Response revokeAllOtherSessions(String username, String currentSessionId) {
        try {
            deactivateOtherSessions(username, currentSessionId);
            return new Response(200, mapOf("success", true, "message", "All other sessions terminated"));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to revoke sessions"));
        }
    }

    public Response deleteAccount(String username, String currentSessionId, Map<String, Object> data) {
        try {
            if (data == null) {
                return new Response(400, mapOf("error", "Missing payload"));
            }
            String password = String.valueOf(data.getOrDefault("password", ""));
            String phrase = String.valueOf(data.getOrDefault("confirmPhrase", ""));
            if (!"DELETE MY ACCOUNT".equals(phrase)) {
                return new Response(400, mapOf("field", "confirmPhrase", "error", "Confirmation phrase must match exactly."));
            }

            Document verified = verifyCredentials(username, password);
            if (verified == null) {
                return new Response(401, mapOf("field", "password", "error", "Incorrect password."));
            }

            getUsersCollection().updateOne(
                Filters.eq("username", username),
                new Document("$set", new Document("is_active", false).append("deleted_at", new Date()).append("updated_at", new Date()))
            );
            getSessionsCollection().updateMany(
                Filters.eq("username", username),
                new Document("$set", new Document("is_active", false).append("revoked_at", new Date()))
            );
            return new Response(200, mapOf("success", true));
        } catch (Exception e) {
            return new Response(500, mapOf("error", "Failed to delete account"));
        }
    }

    // =====================================================================
    // JWT Utilities (behavioral parity)
    // =====================================================================

    private String createAccessToken(String identity, int expiresHours, String sessionId) throws Exception {
        return createToken(identity, "access", expiresHours * 3600L, sessionId);
    }

    private String createRefreshToken(String identity, int expiresDays, String sessionId) throws Exception {
        return createToken(identity, "refresh", expiresDays * 86400L, sessionId);
    }

    private String createToken(String identity, String type, long expiresInSeconds, String sessionId) throws Exception {
        long now = Instant.now().getEpochSecond();
        long exp = now + expiresInSeconds;
        String jti = UUID.randomUUID().toString();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", identity);
        payload.put("type", type);
        payload.put("fresh", false);
        payload.put("jti", jti);
        if (sessionId != null && !sessionId.isEmpty()) {
            payload.put("sid", sessionId);
        }
        payload.put("iat", now);
        payload.put("nbf", now);
        payload.put("exp", exp);

        return signJwt(payload);
    }

    private TokenResult requireAccessToken(String token) {
        return validateToken(token, "access");
    }

    private TokenResult requireRefreshToken(String token) {
        return validateToken(token, "refresh");
    }

    /**
     * [PRESERVED]
     * Access token validation for non-auth routes.
     */
    public TokenResult validateAccessToken(String token) {
        return requireAccessToken(token);
    }

    private TokenResult validateToken(String token, String expectedType) {
        if (token == null || token.trim().isEmpty()) {
            return TokenResult.error(new Response(401, mapOf("error", "Missing authorization token")));
        }

        try {
            Map<String, Object> payload = verifyJwt(token);
            Object expObj = payload.get("exp");
            if (!(expObj instanceof Number)) {
                return TokenResult.error(new Response(401, mapOf("error", "Invalid token")));
            }

            long exp = ((Number) expObj).longValue();
            long now = Instant.now().getEpochSecond();
            if (now >= exp) {
                return TokenResult.error(new Response(401, mapOf("error", "Token has expired")));
            }

            Object typeObj = payload.get("type");
            if (typeObj == null || !expectedType.equals(String.valueOf(typeObj))) {
                return TokenResult.error(new Response(401, mapOf("error", "Invalid token")));
            }

            Object subObj = payload.get("sub");
            if (subObj == null) {
                return TokenResult.error(new Response(401, mapOf("error", "Invalid token")));
            }

            String identity = String.valueOf(subObj);
            String sessionId = payload.get("sid") != null ? String.valueOf(payload.get("sid")) : null;
            String tokenJti = payload.get("jti") != null ? String.valueOf(payload.get("jti")) : null;

            if (sessionId != null && tokenJti != null && !sessionId.isEmpty() && !tokenJti.isEmpty()) {
                Document sessionDoc = "refresh".equals(expectedType)
                    ? resolveRefreshSession(sessionId, tokenJti)
                    : resolveAccessSession(sessionId, tokenJti);
                if (sessionDoc == null) {
                    return TokenResult.error(new Response(401, mapOf("error", "Session is no longer active")));
                }
                String sessionUsername = sessionDoc.getString("username");
                if (sessionUsername != null && !sessionUsername.isBlank()) {
                    identity = sessionUsername;
                }
            }

            return TokenResult.success(identity, sessionId, tokenJti);

        } catch (ExpiredTokenException e) {
            return TokenResult.error(new Response(401, mapOf("error", "Token has expired")));
        } catch (Exception e) {
            return TokenResult.error(new Response(401, mapOf("error", "Invalid token")));
        }
    }

    private String signJwt(Map<String, Object> payload) throws Exception {
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        String headerJson = JsonUtil.stringify(header);
        String payloadJson = JsonUtil.stringify(payload);

        String headerB64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
        String payloadB64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));

        String signingInput = headerB64 + "." + payloadB64;
        String signature = hmacSha256(signingInput, jwtSecret);

        return signingInput + "." + signature;
    }

    private Map<String, Object> verifyJwt(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalStateException("Invalid token");
        }

        String signingInput = parts[0] + "." + parts[1];
        String signatureCheck = hmacSha256(signingInput, jwtSecret);
        if (!constantTimeEquals(signatureCheck, parts[2])) {
            throw new IllegalStateException("Invalid token");
        }

        String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
        return JsonUtil.parseObject(payloadJson);
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(signatureBytes);
    }

    public static class TokenResult {
        private final boolean success;
        private final String identity;
        private final String sessionId;
        private final String tokenJti;
        private final Response response;

        private TokenResult(boolean success, String identity, String sessionId, String tokenJti, Response response) {
            this.success = success;
            this.identity = identity;
            this.sessionId = sessionId;
            this.tokenJti = tokenJti;
            this.response = response;
        }

        static TokenResult success(String identity, String sessionId, String tokenJti) {
            return new TokenResult(true, identity, sessionId, tokenJti, null);
        }

        static TokenResult error(Response response) {
            return new TokenResult(false, null, null, null, response);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getIdentity() {
            return identity;
        }

        public String getSessionId() {
            return sessionId;
        }

        public String getTokenJti() {
            return tokenJti;
        }

        public Response getResponse() {
            return response;
        }
    }

    private static class ExpiredTokenException extends RuntimeException {
        public ExpiredTokenException(String message) {
            super(message);
        }
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private boolean isStrongPassword(String password) {
        return password != null
            && password.length() >= 8
            && PASSWORD_UPPER.matcher(password).matches()
            && PASSWORD_NUMBER.matcher(password).matches()
            && PASSWORD_SPECIAL.matcher(password).matches();
    }

    private MongoCollection<Document> getSessionsCollection() {
        return db.getCollection("user_sessions");
    }

    private void createOrUpdateSession(String username, String sessionId, String accessToken, String refreshToken,
                                       String device, String ip, String browser, String os, String deviceType, String location) {
        String accessJti;
        String refreshJti;
        try {
            Map<String, Object> accessClaims = verifyJwt(accessToken);
            Map<String, Object> refreshClaims = verifyJwt(refreshToken);
            accessJti = String.valueOf(accessClaims.get("jti"));
            refreshJti = String.valueOf(refreshClaims.get("jti"));
        } catch (Exception e) {
            return;
        }

        getSessionsCollection().updateOne(
            Filters.and(Filters.eq("username", username), Filters.eq("session_id", sessionId)),
            new Document("$set", new Document()
                .append("username", username)
                .append("session_id", sessionId)
                .append("access_jti", accessJti)
                .append("refresh_jti", refreshJti)
                .append("device", device)
                .append("browser", browser)
                .append("os", os)
                .append("device_type", deviceType)
                .append("ip", ip)
                .append("location", location)
                .append("last_active", new Date())
                .append("is_active", true)
                .append("updated_at", new Date())
            ).append("$setOnInsert", new Document("created_at", new Date())),
            new UpdateOptions().upsert(true)
        );
    }

    private void recordLastLogin(String username, String deviceLabel, String browser, String os, String location, String ip) {
        Date now = new Date();
        Document info = new Document("timestamp", now)
            .append("device", deviceLabel)
            .append("browser", browser)
            .append("os", os)
            .append("location", location)
            .append("ip", ip);
        getUsersCollection().updateOne(
            Filters.eq("username", username),
            new Document("$set", new Document("last_login", now).append("last_login_info", info).append("updated_at", now))
        );
    }

    private Document resolveAccessSession(String sessionId, String accessJti) {
        Document session = getSessionsCollection().find(
            Filters.and(
                Filters.eq("session_id", sessionId),
                Filters.eq("access_jti", accessJti),
                Filters.eq("is_active", true)
            )
        ).first();
        if (session == null) {
            return null;
        }
        getSessionsCollection().updateOne(
            Filters.eq("_id", session.get("_id")),
            Updates.combine(Updates.set("last_active", new Date()), Updates.set("updated_at", new Date()))
        );
        return session;
    }

    private Document resolveRefreshSession(String sessionId, String refreshJti) {
        return getSessionsCollection().find(
            Filters.and(
                Filters.eq("session_id", sessionId),
                Filters.eq("refresh_jti", refreshJti),
                Filters.eq("is_active", true)
            )
        ).first();
    }

    private void updateSessionAccessToken(String username, String sessionId, String accessToken) {
        String accessJti;
        try {
            Map<String, Object> claims = verifyJwt(accessToken);
            accessJti = String.valueOf(claims.get("jti"));
        } catch (Exception e) {
            return;
        }
        getSessionsCollection().updateOne(
            Filters.and(Filters.eq("username", username), Filters.eq("session_id", sessionId)),
            new Document("$set", new Document("access_jti", accessJti).append("last_active", new Date()).append("updated_at", new Date()).append("is_active", true)),
            new UpdateOptions().upsert(true)
        );
    }

    private void deactivateSession(String username, String sessionId) {
        getSessionsCollection().updateOne(
            Filters.and(Filters.eq("username", username), Filters.eq("session_id", sessionId)),
            new Document("$set", new Document("is_active", false).append("revoked_at", new Date()).append("updated_at", new Date()))
        );
    }

    private void deactivateOtherSessions(String username, String currentSessionId) {
        getSessionsCollection().updateMany(
            Filters.and(
                Filters.eq("username", username),
                Filters.ne("session_id", currentSessionId == null ? "" : currentSessionId)
            ),
            new Document("$set", new Document("is_active", false).append("revoked_at", new Date()).append("updated_at", new Date()))
        );
    }

    private MongoCollection<Document> getUsersCollection() {
        return db.getCollection("users");
    }

    private static String getProfileFullName(Document user, String fallback) {
        Object profileObj = user.get("profile");
        if (profileObj instanceof Document) {
            Object fn = ((Document) profileObj).get("full_name");
            if (fn != null) {
                return String.valueOf(fn);
            }
        }
        return fallback;
    }

    private static String getProfileBio(Document user) {
        if (user == null) {
            return "";
        }
        if (user.get("bio") != null) {
            return String.valueOf(user.get("bio"));
        }
        Object profileObj = user.get("profile");
        if (profileObj instanceof Document) {
            Object bio = ((Document) profileObj).get("bio");
            if (bio != null) {
                return String.valueOf(bio);
            }
        }
        return "";
    }

    private static String getProfileAvatarUrl(Document user) {
        if (user == null) {
            return null;
        }
        Object topLevelAvatar = user.get("avatarUrl");
        if (topLevelAvatar != null) {
            String value = String.valueOf(topLevelAvatar).trim();
            if (!value.isEmpty()) {
                return value;
            }
        }
        Object profileObj = user.get("profile");
        if (profileObj instanceof Document) {
            Object profileAvatar = ((Document) profileObj).get("avatar_url");
            if (profileAvatar != null) {
                String value = String.valueOf(profileAvatar).trim();
                if (!value.isEmpty()) {
                    return value;
                }
            }
        }
        return null;
    }

    private static boolean isProfilePublic(Document user) {
        if (user == null) {
            return false;
        }
        Object topLevelPublic = user.get("isPublic");
        if (topLevelPublic instanceof Boolean) {
            return (Boolean) topLevelPublic;
        }
        Object profileObj = user.get("profile");
        if (profileObj instanceof Document) {
            return Boolean.TRUE.equals(((Document) profileObj).getOrDefault("is_public", false));
        }
        return false;
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

    private static String getStringOrNull(Object value) {
        return value == null ? null : value.toString();
    }

    private static Document withPreferenceDefaults(Document existing) {
        Document defaults = new Document("theme", "system")
            .append("density", "comfortable")
            .append("language", "en")
            .append("fontScale", "default")
            .append("reduceMotion", false)
            .append("statusBadgeStyle", "filled")
            .append("rowStriping", false);
        if (existing != null) {
            defaults.putAll(existing);
        }
        return defaults;
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to hash token");
        }
    }

    private static boolean isDevelopmentMode() {
        String appEnv = System.getenv("APP_ENV");
        if (appEnv == null || appEnv.isEmpty()) {
            return true;
        }
        String lowered = appEnv.toLowerCase(Locale.ROOT);
        return !"production".equals(lowered);
    }

    private static String detectImageMime(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return "unknown";
        }
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
            return "image/png";
        }
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
            && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        return "unknown";
    }

    private static AvatarValidationResult validateAndNormalizeAvatarDataUrl(String avatarDataUrl) {
        if (avatarDataUrl == null || avatarDataUrl.isBlank()) {
            return AvatarValidationResult.fail(400, "Avatar image payload is required.");
        }

        String raw = avatarDataUrl.trim();
        if (!raw.startsWith("data:")) {
            return AvatarValidationResult.fail(400, "Avatar must be provided as a valid data URL.");
        }

        int commaIdx = raw.indexOf(',');
        int semiIdx = raw.indexOf(';');
        if (commaIdx <= 5 || semiIdx <= 5 || semiIdx > commaIdx) {
            return AvatarValidationResult.fail(400, "Invalid avatar image data.");
        }

        String mimeType = raw.substring(5, semiIdx).toLowerCase(Locale.ROOT).trim();
        String encoding = raw.substring(semiIdx + 1, commaIdx).toLowerCase(Locale.ROOT).trim();
        if (!"base64".equals(encoding)) {
            return AvatarValidationResult.fail(400, "Avatar data URL must use base64 encoding.");
        }

        if (!ALLOWED_AVATAR_MIME.contains(mimeType)) {
            return AvatarValidationResult.fail(415, "Only JPG, PNG, and WEBP are supported.");
        }

        String pureBase64 = raw.substring(commaIdx + 1).trim();
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(pureBase64);
        } catch (Exception decodeEx) {
            return AvatarValidationResult.fail(400, "Invalid avatar image data.");
        }

        if (decoded.length > MAX_AVATAR_BYTES) {
            return AvatarValidationResult.fail(413, "Avatar must be 2MB or smaller.");
        }

        String detectedMime = detectImageMime(decoded);
        if (!ALLOWED_AVATAR_MIME.contains(detectedMime) || !isAvatarMimeCompatible(mimeType, detectedMime)) {
            return AvatarValidationResult.fail(415, "Avatar media type does not match image data.");
        }

        String normalizedBase64 = Base64.getEncoder().encodeToString(decoded);
        String normalizedDataUrl = "data:" + detectedMime + ";base64," + normalizedBase64;
        return AvatarValidationResult.ok(normalizedDataUrl);
    }

    private static boolean isAvatarMimeCompatible(String requestedMime, String detectedMime) {
        if (requestedMime == null || requestedMime.isBlank() || detectedMime == null || detectedMime.isBlank()) {
            return false;
        }
        if (requestedMime.equals(detectedMime)) {
            return true;
        }
        return "image/jpg".equals(requestedMime) && "image/jpeg".equals(detectedMime);
    }

    private static String toPemPublic(RSAPublicKey publicKey) {
        return toPem("PUBLIC KEY", publicKey.getEncoded());
    }

    private static String toPemPrivate(RSAPrivateKey privateKey) {
        return toPem("PRIVATE KEY", privateKey.getEncoded());
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

    private static KeyPair generateRsaKeypair(int bits) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(bits);
        return generator.generateKeyPair();
    }

    private static String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private static byte[] base64UrlDecode(String data) {
        return Base64.getUrlDecoder().decode(data);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }
}
