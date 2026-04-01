package com.sentra.backend.runtime;

import com.sentra.backend.encryption.EncryptionApiModule.UploadedFile;

import java.nio.charset.StandardCharsets;
import java.util.*;

public class MultipartParser {
    public static class Result {
        public final Map<String, String> fields;
        public final UploadedFile file;

        public Result(Map<String, String> fields, UploadedFile file) {
            this.fields = fields;
            this.file = file;
        }
    }

    public static Result parse(byte[] body, String contentType) {
        String boundary = extractBoundary(contentType);
        if (boundary == null) {
            return new Result(new HashMap<>(), null);
        }
        Map<String, String> fields = new HashMap<>();
        UploadedFile file = null;

        byte[] boundaryLine = ("--" + boundary).getBytes(StandardCharsets.UTF_8);
        byte[] boundaryDelimiter = ("\r\n--" + boundary).getBytes(StandardCharsets.UTF_8);
        byte[] boundaryClose = ("\r\n--" + boundary + "--").getBytes(StandardCharsets.UTF_8);

        int pos = indexOf(body, boundaryLine, 0);
        if (pos < 0) {
            return new Result(fields, null);
        }
        pos += boundaryLine.length;

        if (pos + 1 < body.length && body[pos] == '-' && body[pos + 1] == '-') {
            return new Result(fields, null);
        }
        if (pos + 1 < body.length && body[pos] == '\r' && body[pos + 1] == '\n') {
            pos += 2;
        }

        while (pos < body.length) {
            int headerEnd = indexOf(body, "\r\n\r\n".getBytes(StandardCharsets.UTF_8), pos);
            if (headerEnd < 0) break;

            String headers = new String(body, pos, headerEnd - pos, StandardCharsets.UTF_8);
            int contentStart = headerEnd + 4;

            int boundaryIdx = indexOf(body, boundaryDelimiter, contentStart);
            if (boundaryIdx < 0) {
                boundaryIdx = indexOf(body, boundaryClose, contentStart);
                if (boundaryIdx < 0) {
                    break;
                }
            }

            int contentEnd = boundaryIdx;
            byte[] content = Arrays.copyOfRange(body, contentStart, contentEnd);

            String name = getHeaderParam(headers, "name");
            String filename = getHeaderParam(headers, "filename");
            String partContentType = getHeaderValue(headers, "content-type");

            if (name != null) {
                if (filename != null) {
                    file = new UploadedFile(filename, trimTrailingCrlf(content), partContentType);
                } else {
                    fields.put(name, new String(trimTrailingCrlf(content), StandardCharsets.UTF_8));
                }
            }

            int afterBoundary = boundaryIdx + 2 + boundaryLine.length;
            if (afterBoundary + 1 < body.length && body[afterBoundary] == '-' && body[afterBoundary + 1] == '-') {
                break;
            }
            if (afterBoundary + 1 < body.length && body[afterBoundary] == '\r' && body[afterBoundary + 1] == '\n') {
                pos = afterBoundary + 2;
            } else {
                pos = afterBoundary;
            }
        }

        return new Result(fields, file);
    }

    private static String extractBoundary(String contentType) {
        if (contentType == null) return null;
        String[] parts = contentType.split(";");
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.startsWith("boundary=")) {
                return trimmed.substring("boundary=".length());
            }
        }
        return null;
    }

    private static String getHeaderParam(String headers, String param) {
        String[] lines = headers.split("\r\n");
        for (String line : lines) {
            if (line.toLowerCase().startsWith("content-disposition")) {
                String[] parts = line.split(";");
                for (String p : parts) {
                    String t = p.trim();
                    if (t.startsWith(param + "=")) {
                        String val = t.substring((param + "=").length());
                        if (val.startsWith("\"") && val.endsWith("\"")) {
                            val = val.substring(1, val.length() - 1);
                        }
                        return val;
                    }
                }
            }
        }
        return null;
    }

    private static String getHeaderValue(String headers, String headerName) {
        if (headers == null || headerName == null) {
            return null;
        }
        String[] lines = headers.split("\r\n");
        for (String line : lines) {
            int idx = line.indexOf(':');
            if (idx <= 0) {
                continue;
            }
            String key = line.substring(0, idx).trim();
            if (headerName.equalsIgnoreCase(key)) {
                String value = line.substring(idx + 1).trim();
                return value.isEmpty() ? null : value;
            }
        }
        return null;
    }


    private static int indexOf(byte[] haystack, byte[] needle) {
        return indexOf(haystack, needle, 0);
    }

    private static int indexOf(byte[] haystack, byte[] needle, int start) {
        for (int i = start; i <= haystack.length - needle.length; i++) {
            boolean match = true;
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }

    private static byte[] trimTrailingCrlf(byte[] data) {
        int len = data.length;
        if (len >= 2 && data[len - 2] == '\r' && data[len - 1] == '\n') {
            return Arrays.copyOfRange(data, 0, len - 2);
        }
        return data;
    }
}
