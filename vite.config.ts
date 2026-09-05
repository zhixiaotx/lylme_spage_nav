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
        const expectedAdminPass = process.env.VITE_EXPORT_ADMIN_PASS || '123456';
        const expectedAdminUser = process.env.VITE_EXPORT_ADMIN_USER || 'admin';

        // Extract credentials from headers or query
        const reqUser = (req.headers['x-auth-user'] as string) || url.searchParams.get('account') || '';
        const reqPass = (req.headers['x-auth-pass'] as string) || '';

        let targetAccount = expectedAdminUser;
        if (key.startsWith('cf_navs_config_')) {
          targetAccount = key.slice('cf_navs_config_'.length);
        }

        // Cross-account isolation check
        if (reqUser && reqUser !== targetAccount) {
          res.statusCode = 403;
          return res.end(JSON.stringify({
            error: `跨账号越权拦截：账号 [${reqUser}] 只能读取自个的数据，不能读取账号 [${targetAccount}] 的数据`,
            code: 'FORBIDDEN',
          }));
        }

        // Admin password verification
        if (targetAccount === expectedAdminUser && reqPass && reqPass !== expectedAdminPass) {
          res.statusCode = 401;
          return res.end(JSON.stringify({
            error: '管理员认证失败：密码错误，无权访问该账号数据',
            code: 'UNAUTHORIZED',
          }));
        }

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
    base: './',
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
