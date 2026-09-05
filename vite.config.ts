import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const syncDevPlugin = (): Plugin => ({
  name: 'sync-dev-api',
  configureServer(server) {
    const memoryStorage: Record<string, string> = {};
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      if (url.pathname === '/api/sync') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const key = url.searchParams.get('key') || 'cf_navs_config';

        if (req.method === 'GET') {
          if (memoryStorage[key]) {
            res.statusCode = 200;
            return res.end(memoryStorage[key]);
          }
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Config not found in dev cache', code: 'KEY_NOT_FOUND' }));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            memoryStorage[key] = body;
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              message: '已成功通过 /api/sync 边缘接口写入',
              timestamp: Date.now(),
            }));
          });
          return;
        }
      }
      next();
    });
  },
});

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), syncDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
