const DEFAULT_NETEASE_UPSTREAM = 'https://api-enhanced-ochre-kappa.vercel.app';
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/gif', 'gif'], ['image/webp', 'webp'],
  ['image/avif', 'avif'], ['image/bmp', 'bmp'], ['image/heic', 'heic'], ['image/heif', 'heic']
]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_KEY = /^album\/[0-9]{4}\/[0-9]{2}\/[a-z0-9-]{16,80}\.(?:avif|bmp|gif|jpe?g|png|webp|heic)$/;

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  const isLocalOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
  const allowOrigin = isLocalOrigin || allowed.includes(origin) ? origin : (allowed.includes('*') ? origin : allowed[0] || origin);
  return { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS', 'Access-Control-Expose-Headers': 'ETag, Content-Type', 'Cache-Control': 'no-store', Vary: 'Origin' };
}

function json(data, status, request, env) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request, env) } }); }

function encodeToken(value) {
  const bytes = new TextEncoder().encode(String(value || '')); let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeToken(value) {
  try { const raw = String(value || ''), normalized = raw.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(raw.length / 4) * 4, '='); const binary = atob(normalized); return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))); } catch { return ''; }
}

function responseCookies(response) {
  const values = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : (response.headers.get('Set-Cookie') ? [response.headers.get('Set-Cookie')] : []);
  return values.map(value => value.split(';', 1)[0]).filter(Boolean).join('; ');
}

function bodyCookie(body) { const value = body?.cookie || body?.cookies || ''; return Array.isArray(value) ? value.join('; ') : String(value || ''); }

function mergeCookies(...values) {
  const map = new Map();
  values.join('; ').split(';').forEach(part => { const [key, ...rest] = part.trim().split('='); if (key && rest.length) map.set(key, `${key}=${rest.join('=')}`); });
  return [...map.values()].join('; ');
}

function upstreamBase(env) { return String(env.NETEASE_UPSTREAM || DEFAULT_NETEASE_UPSTREAM).replace(/\/+$/, ''); }

async function upstreamGet(env, path, params = {}, cookie = '') {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  query.set('timestamp', String(Date.now())); if (cookie) query.set('cookie', cookie);
  const response = await fetch(`${upstreamBase(env)}${path}?${query}`, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' } });
  let body = {}; try { body = await response.json(); } catch {}
  if (!response.ok) throw new Error(`网易云上游 HTTP ${response.status}`);
  return { body, cookie: mergeCookies(cookie, responseCookies(response), bodyCookie(body)) };
}

function requestCookie(request) {
  const authorization = request.headers.get('Authorization') || '';
  if (/^Bearer\s+/i.test(authorization)) return decodeToken(authorization.replace(/^Bearer\s+/i, '').trim());
  return request.headers.get('Cookie') || '';
}

async function qrKey(request, env) {
  const result = await upstreamGet(env, '/login/qr/key'); const unikey = result.body?.data?.unikey || result.body?.unikey || '';
  if (!unikey) throw new Error('网易云没有返回二维码 key');
  return json({ code: 200, data: { unikey, qrSessionToken: encodeToken(result.cookie) } }, 200, request, env);
}

function qrParams(request) { const url = new URL(request.url); const key = url.searchParams.get('key') || ''; const qrSessionToken = url.searchParams.get('qrSessionToken') || ''; return { key, qrSessionToken, cookie: decodeToken(qrSessionToken) }; }

async function qrCreate(request, env) {
  const { key, qrSessionToken, cookie } = qrParams(request); if (!key || !qrSessionToken) return json({ error: '缺少二维码 key 或扫码会话' }, 400, request, env);
  const result = await upstreamGet(env, '/login/qr/create', { key, qrimg: true }, cookie); return json(result.body, 200, request, env);
}

async function qrCheck(request, env) {
  const { key, qrSessionToken, cookie } = qrParams(request); if (!key || !qrSessionToken) return json({ error: '缺少二维码 key 或扫码会话' }, 400, request, env);
  const result = await upstreamGet(env, '/login/qr/check', { key }, cookie); const payload = { ...result.body }; const code = Number(result.body?.data?.code ?? result.body?.code);
  if (code === 803) {
    const loginCookie = mergeCookies(result.cookie, bodyCookie(result.body), bodyCookie(result.body?.data));
    if (/(?:^|;\s*)(?:MUSIC_U|MUSIC_A)=/i.test(loginCookie)) payload.sessionToken = encodeToken(loginCookie); else payload.error = '手机已授权，但网易云未返回登录凭证，请重新扫码。';
    delete payload.cookie; delete payload.cookies;
  }
  return json(payload, 200, request, env);
}

async function syncNetease(request, env) {
  const cookie = requestCookie(request); if (!cookie) return json({ error: '网易云登录会话不存在，请重新扫码' }, 401, request, env);
  const accountResult = await upstreamGet(env, '/user/account', {}, cookie); const account = accountResult.body?.account || {}; const uid = String(account.id || account.userId || account.uid || ''); let profile = accountResult.body?.profile || {};
  if (uid) { try { profile = (await upstreamGet(env, '/user/detail', { uid }, cookie)).body?.profile || profile; } catch {} }
  let playlists = [];
  if (uid) {
    try {
      const list = (await upstreamGet(env, '/user/playlist', { uid, limit: 20, offset: 0 }, cookie)).body?.playlist || [];
      playlists = await Promise.all(list.map(async playlist => { try { const tracks = (await upstreamGet(env, '/playlist/track/all', { id: playlist.id, limit: 100, offset: 0 }, cookie)).body?.songs || []; return { ...playlist, tracks }; } catch { return { ...playlist, tracks: [] }; } }));
    } catch {}
  }
  return json({ userId: uid, profile: { ...profile, userId: profile.userId || uid }, account: accountResult.body, vip: { vipType: profile.vipType || account.vipType || 0 }, playlists }, 200, request, env);
}

async function proxyNetease(request, env, path) {
  const url = new URL(request.url); const cookie = requestCookie(request);
  if (path === '/search') { const result = await upstreamGet(env, '/cloudsearch', { keywords: url.searchParams.get('keywords') || '', type: url.searchParams.get('type') || 1, limit: url.searchParams.get('limit') || 24, offset: url.searchParams.get('offset') || 0 }, cookie); return json(result.body, 200, request, env); }
  const lyric = path.match(/^\/lyric\/([^/]+)$/); if (lyric) { const result = await upstreamGet(env, '/lyric', { id: decodeURIComponent(lyric[1]) }, cookie); return json(result.body, 200, request, env); }
  const song = path.match(/^\/song\/([^/]+)\/url$/); if (song) { const result = await upstreamGet(env, '/song/url/v1', { id: decodeURIComponent(song[1]), level: Number(url.searchParams.get('br') || 320000) >= 320000 ? 'exhigh' : 'standard' }, cookie); return json(result.body, 200, request, env); }
  return null;
}

function imagePublicUrl(request, env, key) { const base = String(env.PUBLIC_IMAGE_BASE_URL || new URL(request.url).origin).replace(/\/$/, ''); return `${base}/images/${key.split('/').map(encodeURIComponent).join('/')}`; }
function imageKeyFromRequest(request) { const key = decodeURIComponent(new URL(request.url).pathname.slice('/images/'.length)); return IMAGE_KEY.test(key) ? key : ''; }
function imageUploadAllowed(request, env) { const expected = String(env.IMAGE_UPLOAD_TOKEN || ''); return Boolean(expected) && request.headers.get('Authorization') === `Bearer ${expected}`; }

async function uploadImage(request, env) {
  if (!imageUploadAllowed(request, env)) return json({ error: '图床上传未授权' }, 401, request, env);
  const contentType = String(request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase(); const extension = IMAGE_TYPES.get(contentType);
  if (!extension) return json({ error: '只支持 JPEG、PNG、GIF、WebP、AVIF、BMP、HEIC 图片' }, 415, request, env);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_IMAGE_BYTES) return json({ error: '图片不能超过 12 MB' }, 413, request, env);
  const body = await request.arrayBuffer(); if (!body.byteLength) return json({ error: '图片内容为空' }, 400, request, env); if (body.byteLength > MAX_IMAGE_BYTES) return json({ error: '图片不能超过 12 MB' }, 413, request, env);
  const now = new Date(); const key = `album/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().toLowerCase()}.${extension}`;
  const object = await env.IMAGE_BUCKET.put(key, body, { httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { uploadedAt: now.toISOString() } });
  return json({ key: object.key, url: imagePublicUrl(request, env, object.key), size: object.size }, 201, request, env);
}

async function serveImage(request, env) {
  const key = imageKeyFromRequest(request); if (!key) return json({ error: '图片地址无效' }, 400, request, env); const object = await env.IMAGE_BUCKET.get(key); if (!object) return json({ error: '图片不存在' }, 404, request, env);
  const headers = new Headers(corsHeaders(request, env)); object.writeHttpMetadata(headers); headers.set('ETag', object.httpEtag); headers.set('Cache-Control', 'public, max-age=31536000, immutable'); return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
}

export default { async fetch(request, env) {
  const url = new URL(request.url); if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
  try {
    if (url.pathname === '/images' && request.method === 'POST') return await uploadImage(request, env);
    if (url.pathname.startsWith('/images/') && (request.method === 'GET' || request.method === 'HEAD')) return await serveImage(request, env);
    if (!['GET', 'HEAD', 'POST'].includes(request.method)) return json({ error: '只允许 GET、HEAD 或 POST 请求' }, 405, request, env);
    const path = url.pathname.replace(/^\/api/, '') || '/';
    if (path === '/auth/qr/key') return await qrKey(request, env); if (path === '/auth/qr/create') return await qrCreate(request, env); if (path === '/auth/qr/check') return await qrCheck(request, env);
    if (path === '/auth/logout') { try { await upstreamGet(env, '/logout', {}, requestCookie(request)); } catch {} return json({ code: 200, message: '已退出' }, 200, request, env); }
    if (path === '/user/sync') return await syncNetease(request, env);
    const proxyResponse = await proxyNetease(request, env, path); if (proxyResponse) return proxyResponse;
    return json({ error: '不支持的网易云接口路径' }, 404, request, env);
  } catch (error) { console.error(JSON.stringify({ event: 'worker_error', message: error?.message || 'unknown' })); return json({ error: error?.message || '服务暂时不可用' }, 502, request, env); }
} };
