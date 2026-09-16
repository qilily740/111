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

function json(response, data, status = 200) {
  const payload = JSON.stringify(data);
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Ideal-Target-URL',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(payload);
}

async function proxyAI(request, response, url) {
  if (!url.pathname.startsWith('/api/ai/')) return false;
  const target = String(request.headers['x-ideal-target-url'] || '').trim();
  if (!/^https:\/\/[^\s]+$/i.test(target)) {
    json(response, { error: 'AI 转发目标必须是 HTTPS 地址' }, 400);
    return true;
  }
  const targetUrl = new URL(target);
  if (!/(?:^|\/)(?:models|chat\/completions|embeddings)$/i.test(targetUrl.pathname)) {
    json(response, { error: '不支持的 AI 接口路径' }, 400);
    return true;
  }
  if (!['GET', 'POST'].includes(request.method)) {
    json(response, { error: 'AI 转发只允许 GET 或 POST' }, 405);
    return true;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const headers = {};
  if (request.headers.authorization) headers.Authorization = request.headers.authorization;
  if (request.headers['content-type']) headers['Content-Type'] = request.headers['content-type'];
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined
  });
  const body = Buffer.from(await upstream.arrayBuffer());
  response.writeHead(upstream.status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
  });
  response.end(body);
  return true;
}

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.manifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
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
  return { body };
}

async function handle(request, response) {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Ideal-Target-URL', 'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS' }); response.end(); return; }
  const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (await proxyAI(request, response, requestUrl)) return;
  if (!['GET', 'HEAD'].includes(request.method)) { json(response, { error: '本地中转服务只允许 GET、HEAD 或 OPTIONS' }, 405); return; }
  const url = requestUrl;
  if (await serveApp(request, response, url)) return;
  if (url.pathname === '/api/music/search') {
    const keyword = url.searchParams.get('keywords') || '';
    if (!keyword.trim()) { json(response, { code: 400, error: '缺少搜索关键词' }, 400); return; }
    const result = await neteasePost('/api/cloudsearch/pc', { s: keyword.trim(), type: 1, offset: 0, limit: Math.min(30, Math.max(1, Number(url.searchParams.get('limit') || 24))) });
    json(response, result.body);
    return;
  }
  if (url.pathname.startsWith('/api/music/song/') && url.pathname.endsWith('/url')) {
    const songId = decodeURIComponent(url.pathname.slice('/api/music/song/'.length, -'/url'.length));
    if (!/^\d+$/.test(songId)) { json(response, { code: 400, error: '歌曲 ID 无效' }, 400); return; }
    const result = await neteasePost('/api/song/enhance/player/url/v1', { ids: JSON.stringify([songId]), level: 'exhigh', encodeType: 'mp3' });
    json(response, result.body);
    return;
  }
  json(response, { error: '本地中转服务不提供音乐登录接口，请使用 music-auth-worker' }, 404);
}

http.createServer((request, response) => {
  handle(request, response).catch(error => {
    console.log(`[relay-error] path=${new URL(request.url, `http://127.0.0.1:${PORT}`).pathname} message=${String(error.message || '本地中转服务失败').slice(0, 100)}`);
    json(response, { error: error.message || '本地中转服务失败' }, 502);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`理想机本地中转服务已启动：http://127.0.0.1:${PORT}`);
});
