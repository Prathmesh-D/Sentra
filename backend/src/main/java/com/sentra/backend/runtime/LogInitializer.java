package com.sentra.backend.runtime;

import java.io.IOException;
import java.nio.file.Files;
import java.util.logging.*;

public final class LogInitializer {
    private LogInitializer() {
    }

    public static Logger initialize(AppConfig config) throws IOException {
        Logger logger = Logger.getLogger("SentraBackend");
        logger.setUseParentHandlers(false);

        Level level = Level.INFO;
        try {
            level = Level.parse(config.LOG_LEVEL.toUpperCase());
        } catch (Exception ignored) {
        }

        if (config.LOG_FILE != null && config.LOG_FILE.getParent() != null) {
            Files.createDirectories(config.LOG_FILE.getParent());
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
