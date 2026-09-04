/**
 * Cloudflare Pages Functions - KV API
 * Automatically handles GET and PUT for Cloudflare KV storage
 * Bind your KV Namespace in Cloudflare Pages Dashboard as "SPAGE_KV"
 */

type KVNamespace = any;

interface Env {
  ONENAV_KV?: KVNamespace;
  SPAGE_KV?: KVNamespace;
  KV?: KVNamespace;
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || 'lylme_spage_config';
  const kv = context.env.ONENAV_KV || context.env.SPAGE_KV || context.env.KV;

  if (!kv) {
    return new Response(JSON.stringify({ error: 'ONENAV_KV / SPAGE_KV binding not configured on Cloudflare Pages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const value = await kv.get(key);
  if (!value) {
    return new Response(JSON.stringify({ error: 'Config not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(value, {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const onRequestPut = async (context: { env: Env; request: Request }) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || 'lylme_spage_config';
  const kv = context.env.ONENAV_KV || context.env.SPAGE_KV || context.env.KV;

  if (!kv) {
    return new Response(JSON.stringify({ error: 'ONENAV_KV / SPAGE_KV binding not configured on Cloudflare Pages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const body = await context.request.text();
  await kv.put(key, body);

  return new Response(JSON.stringify({ success: true, message: 'Saved to Cloudflare KV' }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
