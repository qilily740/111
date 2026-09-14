import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.IDEAL_NETEASE_RELAY_PORT || 3210);
const ORIGIN = 'https://music.163.com';
const APP_ROOT = path.dirname(fileURLToPath(import.meta.url));
const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Referer: 'https://music.163.com/'
};

function encodeToken(value) {
  return Buffer.from(String(value || ''), 'utf8').toString('base64url');
}

function decodeToken(value) {
  try { return Buffer.from(String(value || ''), 'base64url').toString('utf8'); } catch { return ''; }
}

function bodyCookie(body) {
  const value = body?.cookie || body?.cookies || '';
  return Array.isArray(value) ? value.join('; ') : String(value || '');
}

function responseCookies(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
  return values.map(value => value.split(';', 1)[0]).filter(Boolean).join('; ');
}

function mergeCookies(...values) {
  const map = new Map();
  values.join('; ').split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length) map.set(key, `${key}=${rest.join('=')}`);
  });
  return [...map.values()].join('; ');
}

function json(response, data, status = 200) {
  const payload = JSON.stringify(data);
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(payload);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.manifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

async function serveApp(request, response, url) {
  if (!['GET', 'HEAD'].includes(request.method)) return false;
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return false; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  // The relay is bound to loopback. Still keep the static server limited to
  // the app's public web files so .git and local config files are never exposed.
  if (!(relative === 'index.html' || relative === 'app.js' || relative === 'style.css' || relative === 'icons.svg' || relative === 'sw.js' || relative === 'site.webmanifest' || relative.startsWith('apps/') || relative.startsWith('assets/'))) return false;
  const filename = path.resolve(APP_ROOT, relative);
  if (filename !== APP_ROOT && !filename.startsWith(`${APP_ROOT}${path.sep}`)) return false;
  try {
    const body = await readFile(filename);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream'
    });
    if (request.method === 'HEAD') response.end(); else response.end(body);
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return false;
  }
}

function qrUrl(key) {
  return `${ORIGIN}/login?codekey=${encodeURIComponent(key)}`;
}

function params(request) {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  const key = url.searchParams.get('key') || '';
  const qrSessionToken = url.searchParams.get('qrSessionToken') || '';
  return { url, key, qrSessionToken, cookie: decodeToken(qrSessionToken) };
}

async function neteasePost(path, values, cookie = '') {
  const requestHeaders = { ...headers };
  if (cookie) requestHeaders.Cookie = cookie;
  const response = await fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: requestHeaders,
    body: new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value ?? '')]))
  });
  let body = {};
  try { body = await response.json(); } catch {}
  if (!response.ok) throw new Error(`网易云上游 HTTP ${response.status}`);
  return { body, cookie: mergeCookies(cookie, responseCookies(response), bodyCookie(body)) };
}

async function handle(request, response) {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }); response.end(); return; }
  if (!['GET', 'HEAD'].includes(request.method)) { json(response, { error: '本机扫码代理只允许 GET、HEAD 或 OPTIONS' }, 405); return; }
  const { url, key, qrSessionToken, cookie } = params(request);
  if (url.pathname.startsWith('/api/auth/qr/')) console.log(`[qr-request] path=${url.pathname} key=${key ? key.slice(-6) : 'none'} token=${qrSessionToken ? qrSessionToken.length : 0}`);
  if (url.pathname === '/api/auth/qr/key') {
    const result = await neteasePost('/api/login/qrcode/unikey', { type: 3 });
    if (!result.body?.unikey) throw new Error('网易云没有返回二维码 key');
    json(response, { code: 200, data: { unikey: result.body.unikey, qrSessionToken: encodeToken(result.cookie) } });
    return;
  }
  if (await serveApp(request, response, url)) return;
  if (!key || !qrSessionToken) { json(response, { error: '缺少二维码 key 或扫码会话' }, 400); return; }
  if (url.pathname === '/api/auth/qr/create') {
    json(response, { code: 200, data: { qrurl: qrUrl(key), qrimg: 'local-relay' } });
    return;
  }
  if (url.pathname === '/api/auth/qr/image') {
    const image = await fetch(`https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(qrUrl(key))}`);
    if (!image.ok) throw new Error('二维码图片生成失败');
    response.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', 'Content-Type': image.headers.get('content-type') || 'image/png' });
    response.end(Buffer.from(await image.arrayBuffer()));
    return;
  }
  if (url.pathname === '/api/auth/qr/check') {
    const result = await neteasePost('/api/login/qrcode/client/login', { key, type: 3 }, cookie);
    const payload = { ...result.body };
    const code = Number(result.body?.data?.code ?? result.body?.code);
    console.log(`[qr-result] key=${key.slice(-6)} code=${code} message=${String(result.body?.data?.message ?? result.body?.message ?? '').slice(0, 40)}`);
    if (code === 803) {
      const loginCookie = mergeCookies(result.cookie, bodyCookie(result.body), bodyCookie(result.body?.data));
      if (/(?:^|;\s*)(?:MUSIC_U|MUSIC_A)=/i.test(loginCookie)) payload.sessionToken = encodeToken(loginCookie);
      else payload.error = '手机已授权，但网易云未返回登录凭证。';
      delete payload.cookie;
      delete payload.cookies;
    }
    json(response, payload);
    return;
  }
  json(response, { error: '不支持的本机扫码代理路径' }, 404);
}

http.createServer((request, response) => {
  handle(request, response).catch(error => {
    console.log(`[relay-error] path=${new URL(request.url, `http://127.0.0.1:${PORT}`).pathname} message=${String(error.message || '本机扫码代理失败').slice(0, 100)}`);
    json(response, { error: error.message || '本机扫码代理失败' }, 502);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`网易云本机扫码代理已启动：http://127.0.0.1:${PORT}/api`);
});
