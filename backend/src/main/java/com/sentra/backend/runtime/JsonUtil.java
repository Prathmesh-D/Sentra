package com.sentra.backend.runtime;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

public class JsonUtil {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static Map<String, Object> parseObject(String json) {
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JSON object", e);
        }
    }

    public static Object parse(String json) {
        try {
            return MAPPER.readValue(json, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JSON", e);
        }
    }

    public static String stringify(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize JSON", e);
        }
    }

    public static String stringifyPretty(Object value) {
        try {
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize pretty JSON", e);
        }
    }
}
