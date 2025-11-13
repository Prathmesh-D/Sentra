import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
   plugins: [
     react(),
     tailwindcss(),
     electron([
       {
         entry: 'electron/main.cjs',
       },
       {
         entry: 'electron/preload.cjs',
         onstart({ reload }) {
           reload();
         },
       },
     ]),
     renderer(),
   ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': ['react-hot-toast', 'react-icons', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],

          // HTTP client
          'http-vendor': ['axios'],
        },
      },
    },
    // Increase chunk size warning limit if needed
    chunkSizeWarningLimit: 1000, // Set to 1000kb to reduce warnings
  },
  base: './', // Important for Electron apps
})
