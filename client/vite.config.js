import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 100, // reduce how often Vite polls for changes
    },
    fs: {
      strict: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        secure: false,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});

