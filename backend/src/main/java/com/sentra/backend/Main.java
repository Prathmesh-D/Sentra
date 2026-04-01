package com.sentra.backend;

import com.sentra.backend.runtime.Bootstrap;

public class Main {
    public static void main(String[] args) {
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.start();
        } catch (Exception e) {
                com.sentra.backend.runtime.Log.error("BOOT", "start", "failed");
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
