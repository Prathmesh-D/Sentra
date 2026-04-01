package com.sentra.backend.runtime;

import java.io.IOException;

public final class DirectoryInitializer {
    private DirectoryInitializer() {
    }

    public static void initialize(AppConfig config) throws IOException {
        config.createDirectories();
    }
}
