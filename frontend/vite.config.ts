import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { serviceWorkerBuild } from './build/service-worker.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorkerBuild()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/proxy': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: false,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    manifest: 'asset-manifest.json',
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@faker-js/faker')) {
            return 'vendor-faker';
          }
          if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@lezer')) {
            return 'vendor-codemirror';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie';
          }
        },
      },
    },
  },
});
