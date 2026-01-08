import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'web-production-fc84.up.railway.app',
      '.railway.app',
      '.up.railway.app',
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});

