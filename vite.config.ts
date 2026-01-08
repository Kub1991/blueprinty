import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const _env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // SECURITY: Do NOT add API keys here. The 'define' block injects values
    // directly into the frontend bundle, making them PUBLIC.
    // Backend keys (GEMINI, YOUTUBE, SUPADATA) must only be in Convex env vars.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
