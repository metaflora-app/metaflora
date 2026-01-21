import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: '0.0.0.0',
    allowedHosts: [
      'web-production-fc84.up.railway.app',
      '.railway.app',
      '.up.railway.app',
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
        assetFileNames: (assetInfo) => {
          // Aggressive caching for images
          if (/\.(png|jpe?g|webp|gif|svg)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Increase chunk size limit to reduce number of requests
    chunkSizeWarningLimit: 2000,
    // Minify aggressively
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
