package com.sentra.backend.runtime;

public final class JwtManager {
    private final String secretKey;
    private final int tokenExpiryHours;
    private final int refreshTokenExpiryDays;

    private JwtManager(String secretKey, int tokenExpiryHours, int refreshTokenExpiryDays) {
        this.secretKey = secretKey;
        this.tokenExpiryHours = tokenExpiryHours;
        this.refreshTokenExpiryDays = refreshTokenExpiryDays;
    }

    public static JwtManager initialize(AppConfig config) {
        return new JwtManager(
            config.JWT_SECRET_KEY,
            config.TOKEN_EXPIRY_HOURS,
            config.REFRESH_TOKEN_EXPIRY_DAYS
        );
    }

    public String getSecretKey() {
        return secretKey;
    }

    public int getTokenExpiryHours() {
        return tokenExpiryHours;
    }

    public int getRefreshTokenExpiryDays() {
        return refreshTokenExpiryDays;
    }
}
