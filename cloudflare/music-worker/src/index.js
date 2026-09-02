const ALLOWED_PATHS = new Set([
  '/auth/qr/key', '/auth/qr/create', '/auth/qr/check', '/user/profile',
  '/user/account', '/user/playlist', '/user/vip', '/search', '/lyric', '/song'
]);
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/gif', 'gif'], ['image/webp', 'webp'],
  ['image/avif', 'avif'], ['image/bmp', 'bmp'], ['image/heic', 'heic'], ['image/heif', 'heic']
]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_KEY = /^album\/[0-9]{4}\/[0-9]{2}\/[a-z0-9-]{16,80}\.(?:avif|bmp|gif|jpe?g|png|webp|heic)$/;

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (allowed.includes('*') ? origin : allowed[0] || origin);
  return { 'Access-Control-Allow-Origin':allowOrigin, 'Access-Control-Allow-Credentials':'true', 'Access-Control-Allow-Headers':'Authorization, Content-Type', 'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS', 'Access-Control-Expose-Headers':'ETag, Content-Type', 'Vary':'Origin' };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), { status, headers:{ 'Content-Type':'application/json; charset=utf-8', ...corsHeaders(request, env) } });
}

function upstreamUrl(request, env) {
  const base = String(env.UPSTREAM_BASE_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('UPSTREAM_BASE_URL is not configured');
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/^\/api/, '') || '/';
  if (![...ALLOWED_PATHS].some(allowed => path === allowed || path.startsWith(`${allowed}/`))) throw new Error('Path is not allowed');
  const target = new URL(`${base}${path}`); target.search = incoming.search; return target;
}

async function proxy(request, env) {
  const target = upstreamUrl(request, env);
  const headers = new Headers();
  const authorization = request.headers.get('Authorization'); const cookie = request.headers.get('Cookie');
  if (authorization) headers.set('Authorization', authorization); if (cookie) headers.set('Cookie', cookie); headers.set('Accept', 'application/json');
  const upstream = await fetch(target, { method:'GET', headers, redirect:'manual' });
  const responseHeaders = new Headers(corsHeaders(request, env));
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
  const setCookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : (upstream.headers.get('Set-Cookie') ? [upstream.headers.get('Set-Cookie')] : []);
  for (const value of setCookies) responseHeaders.append('Set-Cookie', value);
  return new Response(upstream.body, { status:upstream.status, headers:responseHeaders });
}

function imagePublicUrl(request, env, key) {
  const base = String(env.PUBLIC_IMAGE_BASE_URL || new URL(request.url).origin).replace(/\/$/, '');
  return `${base}/images/${key.split('/').map(encodeURIComponent).join('/')}`;
}
function imageKeyFromRequest(request) {
  const key = decodeURIComponent(new URL(request.url).pathname.slice('/images/'.length));
  return IMAGE_KEY.test(key) ? key : '';
}
function imageUploadAllowed(request, env) {
  const expected = String(env.IMAGE_UPLOAD_TOKEN || '');
  return Boolean(expected) && request.headers.get('Authorization') === `Bearer ${expected}`;
}
async function uploadImage(request, env) {
  if (!imageUploadAllowed(request, env)) return json({ error:'图床上传未授权' }, 401, request, env);
  const contentType = String(request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  const extension = IMAGE_TYPES.get(contentType);
  if (!extension) return json({ error:'只支持 JPEG、PNG、GIF、WebP、AVIF、BMP、HEIC 图片' }, 415, request, env);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_IMAGE_BYTES) return json({ error:'图片不能超过 12 MB' }, 413, request, env);
  const body = await request.arrayBuffer();
  if (!body.byteLength) return json({ error:'图片内容为空' }, 400, request, env);
  if (body.byteLength > MAX_IMAGE_BYTES) return json({ error:'图片不能超过 12 MB' }, 413, request, env);
  const now = new Date();
  const key = `album/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().toLowerCase()}.${extension}`;
  const object = await env.IMAGE_BUCKET.put(key, body, { httpMetadata:{ contentType, cacheControl:'public, max-age=31536000, immutable' }, customMetadata:{ uploadedAt:now.toISOString() } });
  return json({ key:object.key, url:imagePublicUrl(request, env, object.key), size:object.size }, 201, request, env);
}
async function serveImage(request, env) {
  const key = imageKeyFromRequest(request);
  if (!key) return json({ error:'图片地址无效' }, 400, request, env);
  const object = await env.IMAGE_BUCKET.get(key);
  if (!object) return json({ error:'图片不存在' }, 404, request, env);
  const headers = new Headers(corsHeaders(request, env)); object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag); headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(request.method === 'HEAD' ? null : object.body, { status:200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers:corsHeaders(request, env) });
    try {
      if (url.pathname === '/images' && request.method === 'POST') return await uploadImage(request, env);
      if (url.pathname.startsWith('/images/') && (request.method === 'GET' || request.method === 'HEAD')) return await serveImage(request, env);
      if (request.method !== 'GET') return json({ error:'只允许 GET、HEAD 或 POST 请求' }, 405, request, env);
      return await proxy(request, env);
    } catch (error) {
      console.error(JSON.stringify({ event:'worker_error', message:error.message }));
      return json({ error:error.message || '服务暂时不可用' }, 502, request, env);
    }
  }
};
