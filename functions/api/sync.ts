/**
 * Cloudflare Pages Functions - Unified /api/sync Endpoint
 * Inspired by CF-Navs (https://github.com/zhixiaotx/CF-Navs)
 * 
 * Binds directly via Cloudflare Dashboard -> Settings -> Functions:
 * - KV Namespace: ONENAV_KV (or SPAGE_KV / KV)
 * - D1 Database:  ONENAV_D1 (or DB / SPAGE_D1)
 *
 * 100% Zero-CORS, Zero-Client-Credentials Edge Serverless API.
 */

interface Env {
  ONENAV_KV?: any;
  SPAGE_KV?: any;
  KV?: any;
  ONENAV_D1?: any;
  DB?: any;
  SPAGE_D1?: any;
  EXPORT_ADMIN_USER?: string;
  EXPORT_ADMIN_PASS?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_CONFIG_KEY = 'cf_navs_config';

function validateAccountAccess(request: Request, env: Env, key: string): { ok: boolean; status: number; message: string; account: string } {
  const expectedAdminUser = env.EXPORT_ADMIN_USER || 'admin';
  const expectedAdminPass = env.EXPORT_ADMIN_PASS || '123456';

  const authHeader = request.headers.get('Authorization') || '';
  const xUser = request.headers.get('X-Auth-User') || '';
  const xPass = request.headers.get('X-Auth-Pass') || '';

  let basicUser = '';
  let basicPass = '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const [u, p] = decoded.split(':');
      basicUser = u || '';
      basicPass = p || '';
    } catch {
      // ignore
    }
  }

  const user = (xUser || basicUser).trim();
  const pass = (xPass || basicPass).trim();

  let targetAccount = expectedAdminUser;
  if (key.startsWith('cf_navs_config_')) {
    targetAccount = key.slice('cf_navs_config_'.length);
  }

  // Cross-account isolation enforcement: an account can only access its own data
  if (user && user !== targetAccount) {
    return {
      ok: false,
      status: 403,
      message: `跨账号越权拦截：账号 [${user}] 只能读取自个的数据，不能读取账号 [${targetAccount}] 的数据`,
      account: user,
    };
  }

  // Verify admin password if accessing admin key and password provided
  if (targetAccount === expectedAdminUser && pass && pass !== expectedAdminPass) {
    return {
      ok: false,
      status: 401,
      message: '管理员认证失败：密码错误，无权访问该账号数据',
      account: targetAccount,
    };
  }

  return { ok: true, status: 200, message: 'OK', account: user || targetAccount };
}

function getKvBinding(env: Env) {

  return env.ONENAV_KV || env.SPAGE_KV || env.KV;
}

function getD1Binding(env: Env) {
  return env.ONENAV_D1 || env.DB || env.SPAGE_D1;
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || DEFAULT_CONFIG_KEY;

  // Enforce account isolation and access validation
  const auth = validateAccountAccess(context.request, context.env, key);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ error: auth.message, code: auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' }),
      { status: auth.status, headers: CORS_HEADERS }
    );
  }

  const kv = getKvBinding(context.env);
  const d1 = getD1Binding(context.env);

  // 1. Try Cloudflare KV first if bound
  if (kv) {
    try {
      const val = await kv.get(key);
      if (val) {
        return new Response(val, {
          status: 200,
          headers: CORS_HEADERS,
        });
      }
      // Fallback check alternative key name
      if (key !== 'lylme_spage_config') {
        const altVal = await kv.get('lylme_spage_config');
        if (altVal) {
          return new Response(altVal, { status: 200, headers: CORS_HEADERS });
        }
      }
      return new Response(
        JSON.stringify({ error: 'Config not found in KV', code: 'KEY_NOT_FOUND' }),
        { status: 404, headers: CORS_HEADERS }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `KV Read error: ${err.message}` }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  // 2. Try Cloudflare D1 if bound
  if (d1) {
    try {
      // Ensure table exists
      await d1
        .prepare(
          'CREATE TABLE IF NOT EXISTS cf_navs_config (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER);'
        )
        .run();

      const row = await d1
        .prepare('SELECT value FROM cf_navs_config WHERE key = ? LIMIT 1')
        .bind(key)
        .first();

      if (row && row.value) {
        return new Response(row.value, {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      return new Response(
        JSON.stringify({ error: 'Config not found in D1', code: 'KEY_NOT_FOUND' }),
        { status: 404, headers: CORS_HEADERS }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `D1 Read error: ${err.message}` }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  return new Response(
    JSON.stringify({
      error: 'No KV or D1 binding found. Please bind ONENAV_KV or ONENAV_D1 in Cloudflare Pages Settings -> Functions.',
      code: 'NO_BINDING',
    }),
    { status: 503, headers: CORS_HEADERS }
  );
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  return handleSave(context);
};

export const onRequestPut = async (context: { env: Env; request: Request }) => {
  return handleSave(context);
};

async function handleSave(context: { env: Env; request: Request }) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || DEFAULT_CONFIG_KEY;

  // Enforce account isolation and access validation
  const auth = validateAccountAccess(context.request, context.env, key);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ error: auth.message, code: auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' }),
      { status: auth.status, headers: CORS_HEADERS }
    );
  }

  const kv = getKvBinding(context.env);
  const d1 = getD1Binding(context.env);

  let rawBody = '';
  try {
    rawBody = await context.request.text();
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Invalid body' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    // raw text
  }

  // Handle D1 explicit actions if requested
  if (parsed && parsed.action && d1) {
    try {
      if (parsed.action === 'init') {
        await d1
          .prepare(
            'CREATE TABLE IF NOT EXISTS cf_navs_config (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER);'
          )
          .run();
        return new Response(
          JSON.stringify({ success: true, message: 'D1 table initialized successfully' }),
          { status: 200, headers: CORS_HEADERS }
        );
      }
      if (parsed.action === 'query') {
        const stmt = d1.prepare(parsed.sql).bind(...(parsed.params || []));
        const res = await stmt.all();
        return new Response(JSON.stringify({ success: true, results: res.results }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }
      if (parsed.action === 'execute') {
        const stmt = d1.prepare(parsed.sql).bind(...(parsed.params || []));
        await stmt.run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'D1 operation failed' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  // If payload contains wrapped { key, value }
  const saveKey = parsed?.key || key;
  const saveValue =
    typeof parsed?.value === 'string'
      ? parsed.value
      : parsed?.value
      ? JSON.stringify(parsed.value)
      : rawBody;

  let savedTarget = '';

  // Write to KV
  if (kv) {
    try {
      await kv.put(saveKey, saveValue);
      // Also save alias for backward compatibility
      if (saveKey === DEFAULT_CONFIG_KEY) {
        await kv.put('lylme_spage_config', saveValue);
      }
      savedTarget += 'KV (ONENAV_KV) ';
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `Failed to write to KV: ${err.message}` }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  // Write to D1
  if (d1) {
    try {
      await d1
        .prepare(
          'CREATE TABLE IF NOT EXISTS cf_navs_config (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER);'
        )
        .run();

      await d1
        .prepare(
          'INSERT INTO cf_navs_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;'
        )
        .bind(saveKey, saveValue, Date.now())
        .run();

      savedTarget += 'D1 (ONENAV_D1) ';
    } catch (err: any) {
      // If no KV was bound and D1 failed, return error
      if (!kv) {
        return new Response(
          JSON.stringify({ error: `Failed to write to D1: ${err.message}` }),
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }
  }

  if (!savedTarget) {
    return new Response(
      JSON.stringify({
        error: 'No KV or D1 binding found. Please bind ONENAV_KV or ONENAV_D1 in Cloudflare Pages Settings -> Functions.',
        code: 'NO_BINDING',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `已成功通过 Cloudflare Pages 边缘后端同步至 ${savedTarget.trim()}`,
      timestamp: Date.now(),
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
