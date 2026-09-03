const IMAGE_HOST_API = 'https://imgdb.io/api/v1/upload?ttl=0';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/avif', 'image/bmp', 'image/heic', 'image/heif'
]);

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const allowOrigin = configured.includes('*')
    ? origin || '*'
    : configured.includes(origin) ? origin : '';
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    'Vary': 'Origin'
  };
  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;
  return headers;
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request, env) }
  });
}

async function relayUpload(request, env) {
  const contentType = String(request.headers.get('Content-Type') || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (!IMAGE_TYPES.has(contentType)) return json({ error: '只支持常见图片格式' }, 415, request, env);
  const size = Number(request.headers.get('Content-Length') || 0);
  if (size > MAX_IMAGE_BYTES) return json({ error: '图片不能超过 12 MB' }, 413, request, env);
  if (!request.body) return json({ error: '图片内容为空' }, 400, request, env);

  const body = await request.arrayBuffer();
  if (!body.byteLength) return json({ error: '图片内容为空' }, 400, request, env);
  if (body.byteLength > MAX_IMAGE_BYTES) return json({ error: '图片不能超过 12 MB' }, 413, request, env);

  const upstream = await fetch(IMAGE_HOST_API, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body
  });
  let returned = null;
  try { returned = await upstream.json(); } catch { returned = null; }
  if (!upstream.ok || !/^https:\/\/imgdb\.io\/i\//i.test(String(returned?.url || ''))) {
    return json({ error: returned?.error || `第三方图床上传失败（${upstream.status}）` }, 502, request, env);
  }
  return json({ url: returned.url, provider: 'imgdb', expires: returned.expires ?? null }, 201, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'ideal-machine-catbox-relay' }, 200, request, env);
      if (url.pathname === '/images' && request.method === 'POST') return await relayUpload(request, env);
      return json({ error: '请求路径或方法不支持' }, 404, request, env);
    } catch (error) {
      console.error(JSON.stringify({ event: 'catbox_relay_error', message: error?.message || 'unknown_error' }));
      return json({ error: '第三方图床暂时不可用' }, 502, request, env);
    }
  }
};
