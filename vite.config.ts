import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/analyze': {
        target: 'https://n8n.srv1048087.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analyze/, '/webhook/recruit-ai'),
      },
    },
  },
});