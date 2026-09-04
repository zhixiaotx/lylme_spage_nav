/**
 * Cloudflare Pages Functions - D1 API
 * Automatically handles SQL queries for Cloudflare D1 storage
 * Bind your D1 Database in Cloudflare Pages Dashboard as "SPAGE_D1"
 */

type D1Database = any;

interface Env {
  ONENAV_D1?: D1Database;
  DB?: D1Database;
  SPAGE_D1?: D1Database;
}

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  const d1 = context.env.ONENAV_D1 || context.env.DB || context.env.SPAGE_D1;
  if (!d1) {
    return new Response(JSON.stringify({ error: 'ONENAV_D1 / DB / SPAGE_D1 binding not configured on Cloudflare Pages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { action, sql, params = [] } = await context.request.json();

    if (action === 'init') {
      await d1.prepare(
        'CREATE TABLE IF NOT EXISTS lylme_spage_sync (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER);'
      ).run();
      return new Response(JSON.stringify({ success: true, message: 'D1 table initialized' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (action === 'query') {
      const stmt = d1.prepare(sql).bind(...params);
      const { results } = await stmt.all();
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (action === 'execute') {
      const stmt = d1.prepare(sql).bind(...params);
      await stmt.run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'D1 operation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
