import http from 'node:http';
import { createCipheriv, publicEncrypt, randomBytes, constants as cryptoConstants } from 'node:crypto';

const PORT = Number(process.env.IDEAL_MUSIC_AUTH_PORT || 3211);
const NETEASE_ORIGIN = 'https://music.163.com';
const QR_SESSION_TTL_MS = 10 * 60 * 1000;
const qrSessions = new Map();
const NETEASE_WEAPI_PRESET_KEY = '0CoJUm6Qyw8W8jud';
const NETEASE_WEAPI_IV = '0102030405060708';
const NETEASE_WEAPI_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB
-----END PUBLIC KEY-----`;
const WEAPI_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const WEB_TOKEN_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

const upstreamHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
  Referer: 'https://music.163.com/',
  Origin: 'https://music.163.com',
  'x-os': 'web',
  'X-channelSource': 'undefined',
  'Nm-GCore-Status': '1'
};

function corsHeaders(request) {
  const origin = request.headers.origin || '';
  const allowed = new Set([
    'https://qilily740.github.io',
    'http://localhost:8787',
    'http://127.0.0.1:8787'
  ]);
  const isLocal = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
  return {
    'Access-Control-Allow-Origin': isLocal || allowed.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  };
}

function json(response, data, status = 200, request) {
  response.writeHead(status, {
    ...corsHeaders(request),
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(data));
}

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

function randomWebToken(length) {
  const bytes = randomBytes(length);
  return [...bytes].map(value => WEB_TOKEN_ALPHABET[value % WEB_TOKEN_ALPHABET.length]).join('');
}

function webQrCookie() {
  const nuid = randomBytes(16).toString('hex');
  return mergeCookies(
    `JSESSIONID-WYYY=${randomWebToken(190)}`,
    '_iuqxldmzr_=33',
    `_ntes_nnid=${nuid},${Date.now()}`,
    `_ntes_nuid=${nuid}`,
    `NMTID=00${randomWebToken(39)}`,
    'WEVNSM=1.0.0',
    `WNMCID=${randomWebToken(6).toLowerCase()}.${Date.now()}.01.0`,
    `sDeviceId=${randomBytes(26).toString('hex').toUpperCase()}`
  );
}

function chainIdFor(cookie) {
  const deviceId = cookie.match(/(?:^|;\s*)sDeviceId=([^;]+)/i)?.[1] || `unknown-${randomBytes(4).toString('hex')}`;
  return `v1_${deviceId}_web_login_${Date.now()}`;
}

function randomWeapiKey() {
  const bytes = randomBytes(16);
  return [...bytes].map(value => WEAPI_ALPHABET[value % WEAPI_ALPHABET.length]).join('');
}

function aesCbcBase64(text, key) {
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(NETEASE_WEAPI_IV));
  return Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]).toString('base64');
}

function weapiEncrypt(values) {
  const secretKey = randomWeapiKey();
  const firstLayer = aesCbcBase64(JSON.stringify(values), NETEASE_WEAPI_PRESET_KEY);
  const params = aesCbcBase64(firstLayer, secretKey);
  const encSecKey = publicEncrypt({
    key: NETEASE_WEAPI_PUBLIC_KEY,
    padding: cryptoConstants.RSA_NO_PADDING
  }, Buffer.concat([
    Buffer.alloc(128 - Buffer.byteLength(secretKey)),
    Buffer.from([...secretKey].reverse().join(''), 'utf8')
  ])).toString('hex');
  return { params, encSecKey };
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of qrSessions) {
    if (session.expiresAt < now) qrSessions.delete(token);
  }
}

function newSession(cookie, key, chainId) {
  cleanupSessions();
  const token = randomBytes(32).toString('base64url');
  qrSessions.set(token, { key, cookie, chainId, expiresAt: Date.now() + QR_SESSION_TTL_MS });
  return token;
}

function sessionFor(url) {
  cleanupSessions();
  const key = url.searchParams.get('key') || '';
  const token = url.searchParams.get('qrSessionToken') || '';
  const session = qrSessions.get(token);
  return session && session.key === key ? { key, token, ...session } : null;
}

async function neteasePost(path, values = {}, cookie = '', extraHeaders = {}) {
  const headers = { ...upstreamHeaders, ...extraHeaders };
  if (cookie) headers.Cookie = cookie;
  const separator = path.includes('?') ? '&' : '?';
  const upstream = await fetch(`${NETEASE_ORIGIN}${path}${separator}timestamp=${Date.now()}`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(weapiEncrypt(values))
  });
  let body = {};
  try { body = await upstream.json(); } catch {}
  if (!upstream.ok) throw new Error(`网易云上游 HTTP ${upstream.status}`);
  return { body, cookie: mergeCookies(cookie, responseCookies(upstream), bodyCookie(body)) };
}

function qrUrl(key, chainId) {
  const params = new URLSearchParams({
    codekey: key,
    chainId,
    hdw_device: 'web',
    hdw_appid: 'web',
    hitExp: '1'
  });
  return `${NETEASE_ORIGIN}/st/platform/scanlogin?${params}`;
}

async function handle(request, response) {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders(request));
    response.end();
    return;
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const token = (request.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const cookie = decodeToken(token);
    if (cookie) {
      try { await neteasePost('/weapi/logout', {}, cookie); } catch {}
    }
    json(response, { code: 200, message: '已退出' }, 200, request);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    json(response, { error: '登录服务只允许 GET、HEAD、POST 或 OPTIONS 请求' }, 405, request);
    return;
  }
  if (url.pathname === '/api/auth/qr/key') {
    const cookie = webQrCookie();
    const chainId = chainIdFor(cookie);
    const result = await neteasePost('/weapi/login/qrcode/unikey', { type: 1 }, cookie);
    const unikey = result.body?.unikey || result.body?.data?.unikey || '';
    if (!unikey) throw new Error('网易云没有返回二维码 key');
    json(response, { code: 200, data: { unikey, chainId, qrSessionToken: newSession(result.cookie, unikey, chainId) } }, 200, request);
    return;
  }
  if (!url.pathname.startsWith('/api/auth/qr/')) {
    json(response, { error: '不支持的音乐登录接口路径' }, 404, request);
    return;
  }
  const session = sessionFor(url);
  if (!session) {
    json(response, { error: '二维码会话已失效，请重新获取二维码' }, 400, request);
    return;
  }
  if (url.pathname === '/api/auth/qr/create') {
    json(response, { code: 200, data: { qrurl: qrUrl(session.key, session.chainId), qrimg: 'local-auth-server', chainId: session.chainId } }, 200, request);
    return;
  }
  if (url.pathname === '/api/auth/qr/image') {
    const image = await fetch(`https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(qrUrl(session.key, session.chainId))}`);
    if (!image.ok) throw new Error('二维码图片生成失败');
    response.writeHead(200, { ...corsHeaders(request), 'Content-Type': image.headers.get('content-type') || 'image/png' });
    response.end(Buffer.from(await image.arrayBuffer()));
    return;
  }
  if (url.pathname === '/api/auth/qr/check') {
    const result = await neteasePost('/weapi/login/qrcode/client/login', { key: session.key, type: 1 }, session.cookie, {
      'X-LoginMethod': 'QrCode',
      'X-Login-Chain-Id': session.chainId,
      'X-OS': 'web',
      'X-ChannelSource': 'undefined',
      'NM-GCORE-STATUS': '1'
    });
    const payload = { ...result.body };
    const code = Number(result.body?.data?.code ?? result.body?.code);
    if (code === 803) {
      const loginCookie = mergeCookies(result.cookie, bodyCookie(result.body), bodyCookie(result.body?.data));
      if (/(?:^|;\s*)(?:MUSIC_U|MUSIC_A)=/i.test(loginCookie)) {
        payload.sessionToken = encodeToken(loginCookie);
        qrSessions.delete(session.token);
      } else {
        payload.error = '手机已授权，但网易云未返回登录凭证。';
      }
      delete payload.cookie;
      delete payload.cookies;
    }
    json(response, payload, 200, request);
    return;
  }
  json(response, { error: '不支持的音乐登录接口路径' }, 404, request);
}

http.createServer((request, response) => {
  handle(request, response).catch(error => {
    console.error(`[music-auth-error] ${error?.message || '登录服务失败'}`);
    json(response, { error: error?.message || '登录服务失败' }, 502, request);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`理想机音乐本地登录服务已启动：http://127.0.0.1:${PORT}/api`);
});
