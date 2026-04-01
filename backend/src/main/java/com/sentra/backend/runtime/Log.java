package com.sentra.backend.runtime;

public final class Log {
    private enum Level {
        DEBUG,
        INFO,
        WARN,
        ERROR
    }

    private static final Level CURRENT_LEVEL = resolveLevel();

    private Log() {}

    public static void debug(String module, String action, String message) {
        emit(Level.DEBUG, module, action, message);
    }

    public static void info(String module, String action, String message) {
        emit(Level.INFO, module, action, message);
    }

    public static void warn(String module, String action, String message) {
        emit(Level.WARN, module, action, message);
    }

    public static void error(String module, String action, String message) {
        emit(Level.ERROR, module, action, message);
    }

    private static void emit(Level level, String module, String action, String message) {
        if (level.ordinal() < CURRENT_LEVEL.ordinal()) {
            return;
        }
        String line = String.format("[%s] [%s] [%s] %s", level.name(), module, action, message);
        if (level == Level.ERROR) {
            System.err.println(line);
        } else {
            System.out.println(line);
        }
    }

    private static Level resolveLevel() {
        String raw = System.getenv("LOG_LEVEL");
        if (raw == null || raw.isBlank()) {
            return Level.INFO;
        }
        try {
            return Level.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return Level.INFO;
        }
    }
}
