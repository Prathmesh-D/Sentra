package com.sentra.backend.runtime;

import java.util.ArrayList;
import java.util.List;

public final class CorsInitializer {
    private final List<String> allowedOrigins;

    private CorsInitializer(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins != null ? new ArrayList<>(allowedOrigins) : new ArrayList<>();
    }

    public static CorsInitializer initialize(AppConfig config) {
        return new CorsInitializer(config.CORS_ORIGINS);
    }

    public List<String> getAllowedOrigins() {
        return new ArrayList<>(allowedOrigins);
    }
}
