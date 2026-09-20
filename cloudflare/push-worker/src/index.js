import { sendPushNotification, WebPushError } from '@mmmike/web-push/send';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  return configured.includes(origin) ? origin : configured[0] || '*';
}

function headers(request, env) {
  return {
    ...jsonHeaders,
    'Access-Control-Allow-Origin': allowedOrigin(request, env),
    'Access-Control-Allow-Headers': 'Content-Type, X-Ideal-Push-Token',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Vary': 'Origin'
  };
}

function response(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(request, env) });
}

function validSubscription(value) {
  return value && typeof value === 'object'
    && /^https:\/\//i.test(String(value.endpoint || ''))
    && typeof value.keys?.p256dh === 'string'
    && typeof value.keys?.auth === 'string';
}

function subscriptionData(value) {
  return { endpoint: String(value.endpoint), keys: { p256dh: String(value.keys.p256dh), auth: String(value.keys.auth) } };
}

function tokenMatches(request, env) {
  const expected = String(env.PUSH_SEND_TOKEN || '');
  return Boolean(expected) && request.headers.get('X-Ideal-Push-Token') === expected;
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function handleSubscribe(request, env) {
  const body = await readJson(request);
  const value = body?.subscription || body;
  if (!validSubscription(value)) return response(request, env, { error: 'invalid_subscription' }, 400);
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO subscriptions (endpoint, p256dh, auth, client_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      client_id = excluded.client_id,
      updated_at = excluded.updated_at
  `).bind(
    String(value.endpoint),
    String(value.keys.p256dh),
    String(value.keys.auth),
    String(body?.clientId || ''),
    now,
    now
  ).run();
  return response(request, env, { ok: true });
}

async function handleUnsubscribe(request, env) {
  const body = await readJson(request);
  const endpoint = String(body?.endpoint || '');
  if (!endpoint) return response(request, env, { error: 'missing_endpoint' }, 400);
  await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(endpoint).run();
  return response(request, env, { ok: true });
}

async function handleSend(request, env) {
  if (!tokenMatches(request, env)) return response(request, env, { error: 'unauthorized' }, 401);
  const body = await readJson(request);
  const title = String(body?.title || 'Ideal');
  const message = String(body?.body || '收到一条新消息');
  const clientId = String(body?.clientId || '');
  const rows = clientId
    ? await env.DB.prepare('SELECT endpoint, p256dh, auth FROM subscriptions WHERE client_id = ?').bind(clientId).all()
    : await env.DB.prepare('SELECT endpoint, p256dh, auth FROM subscriptions').all();
  const delivered = [];
  const removed = [];
  const failed = [];
  const vapid = { subject: String(env.VAPID_SUBJECT || 'mailto:qililyqilily@gmail.com'), publicKey: String(env.VAPID_PUBLIC_KEY), privateKey: String(env.VAPID_PRIVATE_KEY) };
  for (const row of rows.results || []) {
    const subscription = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
    try {
      const ok = await sendPushNotification(subscription, {
        title,
        body: message,
        icon: String(body?.icon || './assets/icons/ideal-orbit-day.png'),
        badge: String(body?.badge || './assets/icons/ideal-orbit-day.png'),
        tag: String(body?.tag || `ideal-${body?.messageId || Date.now()}`),
        url: String(body?.url || './')
      }, vapid, { ttl: 86400, urgency: 'normal' });
      if (ok) delivered.push(row.endpoint);
      else removed.push(row.endpoint);
    } catch (error) {
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) removed.push(row.endpoint);
      else failed.push({ endpoint: row.endpoint, status: error?.statusCode || 500 });
    }
  }
  if (removed.length) {
    const statement = env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?');
    await env.DB.batch(removed.map(endpoint => statement.bind(endpoint)));
  }
  return response(request, env, { ok: true, delivered: delivered.length, removed: removed.length, failed: failed.length });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(request, env) });
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/config') return response(request, env, { publicKey: String(env.VAPID_PUBLIC_KEY || '') });
      if (request.method === 'POST' && url.pathname === '/subscribe') return await handleSubscribe(request, env);
      if (request.method === 'DELETE' && url.pathname === '/subscribe') return await handleUnsubscribe(request, env);
      if (request.method === 'POST' && url.pathname === '/send') return await handleSend(request, env);
      return response(request, env, { error: 'not_found' }, 404);
    } catch (error) {
      console.error(error);
      return response(request, env, { error: 'internal_error' }, 500);
    }
  }
};
