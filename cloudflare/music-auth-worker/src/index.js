const DEFAULT_NETEASE_AUTH_ORIGIN = 'https://music.163.com';
const QR_SESSION_TTL_MS = 10 * 60 * 1000;
const NETEASE_WEAPI_PRESET_KEY = '0CoJUm6Qyw8W8jud';
const NETEASE_WEAPI_IV = new TextEncoder().encode('0102030405060708');
const NETEASE_WEAPI_PUBLIC_KEY_DER = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB';
const WEAPI_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const WEB_TOKEN_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const isLocalOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
  const allowOrigin = isLocalOrigin || allowed.includes(origin)
    ? origin
    : (allowed.includes('*') ? origin : allowed[0] || origin);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env)
    }
  });
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const raw = String(value || '');
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(raw.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function base64Encode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function derValue(bytes, offset, expectedTag) {
  if (bytes[offset] !== expectedTag) throw new Error('网易云公钥格式无效');
  const lengthByte = bytes[offset + 1];
  let length = lengthByte;
  let valueOffset = offset + 2;
  if (lengthByte & 0x80) {
    const lengthBytes = lengthByte & 0x7f;
    length = 0;
    for (let index = 0; index < lengthBytes; index += 1) length = (length << 8) | bytes[valueOffset + index];
    valueOffset += lengthBytes;
  }
  return { value: bytes.slice(valueOffset, valueOffset + length), next: valueOffset + length };
}

function derPublicKeyModulus() {
  const binary = atob(NETEASE_WEAPI_PUBLIC_KEY_DER);
  const der = Uint8Array.from(binary, char => char.charCodeAt(0));
  const outer = derValue(der, 0, 0x30).value;
  const algorithm = derValue(outer, 0, 0x30);
  const bitString = derValue(outer, algorithm.next, 0x03).value.slice(1);
  const rsa = derValue(bitString, 0, 0x30).value;
  const modulus = derValue(rsa, 0, 0x02).value;
  return modulus[0] === 0 ? modulus.slice(1) : modulus;
}

const NETEASE_WEAPI_MODULUS = derPublicKeyModulus();

function bytesToBigInt(bytes) {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return BigInt(`0x${hex || '0'}`);
}

function bigIntToBytes(value, length) {
  const hex = value.toString(16).padStart(length * 2, '0');
  return Uint8Array.from(hex.match(/.{2}/g), pair => parseInt(pair, 16));
}

function bytesToHex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomWebToken(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(value => WEB_TOKEN_ALPHABET[value % WEB_TOKEN_ALPHABET.length]).join('');
}

function randomHex(length) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(length)));
}

function webQrCookie() {
  const nuid = randomHex(16);
  return mergeCookies(
    `JSESSIONID-WYYY=${randomWebToken(190)}`,
    '_iuqxldmzr_=33',
    `_ntes_nnid=${nuid},${Date.now()}`,
    `_ntes_nuid=${nuid}`,
    `NMTID=00${randomWebToken(39)}`,
    'WEVNSM=1.0.0',
    `WNMCID=${randomWebToken(6).toLowerCase()}.${Date.now()}.01.0`,
    `sDeviceId=${randomHex(26).toUpperCase()}`
  );
}

function chainIdFor(cookie) {
  const deviceId = cookie.match(/(?:^|;\s*)sDeviceId=([^;]+)/i)?.[1] || `unknown-${randomHex(4)}`;
  return `v1_${deviceId}_web_login_${Date.now()}`;
}

function rsaNoPadding(message) {
  const reversed = new TextEncoder().encode([...message].reverse().join(''));
  const modulus = bytesToBigInt(NETEASE_WEAPI_MODULUS);
  const encrypted = modPow(bytesToBigInt(reversed), 65537n, modulus);
  return bytesToHex(bigIntToBytes(encrypted, NETEASE_WEAPI_MODULUS.length));
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  let value = base % modulus;
  let power = exponent;
  while (power > 0n) {
    if (power & 1n) result = (result * value) % modulus;
    value = (value * value) % modulus;
    power >>= 1n;
  }
  return result;
}

function randomWeapiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(value => WEAPI_ALPHABET[value % WEAPI_ALPHABET.length]).join('');
}

async function aesCbcBase64(text, key) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: NETEASE_WEAPI_IV },
    cryptoKey,
    new TextEncoder().encode(String(text))
  );
  return base64Encode(new Uint8Array(encrypted));
}

async function weapiEncrypt(values) {
  const secretKey = randomWeapiKey();
  const firstLayer = await aesCbcBase64(JSON.stringify(values), NETEASE_WEAPI_PRESET_KEY);
  return {
    params: await aesCbcBase64(firstLayer, secretKey),
    encSecKey: rsaNoPadding(secretKey)
  };
}

function encodeToken(value) {
  return base64UrlEncode(new TextEncoder().encode(String(value || '')));
}

function decodeToken(value) {
  try { return new TextDecoder().decode(base64UrlDecode(value)); } catch { return ''; }
}

function authSecret(env) {
  const secret = String(env.AUTH_TOKEN_SECRET || '').trim();
  if (!secret) throw new Error('登录服务未配置 AUTH_TOKEN_SECRET');
  return secret;
}

async function sign(value, env) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64UrlEncode(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

async function verify(value, signature, env) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signature),
    new TextEncoder().encode(value)
  );
}

async function createQrSessionToken(cookie, chainId, env) {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    cookie: String(cookie || ''),
    chainId: String(chainId || ''),
    expiresAt: Date.now() + QR_SESSION_TTL_MS
  })));
  return `${payload}.${await sign(payload, env)}`;
}

async function readQrSession(token, env) {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature || !(await verify(payload, signature, env))) return null;
    const value = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (!value?.expiresAt || Number(value.expiresAt) < Date.now()) return null;
    return { cookie: String(value.cookie || ''), chainId: String(value.chainId || '') };
  } catch {
    return null;
  }
}

function responseCookies(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('Set-Cookie') ? [response.headers.get('Set-Cookie')] : []);
  return values.map(value => value.split(';', 1)[0]).filter(Boolean).join('; ');
}

function bodyCookie(body) {
  const value = body?.cookie || body?.cookies || '';
  return Array.isArray(value) ? value.join('; ') : String(value || '');
}

function mergeCookies(...values) {
  const map = new Map();
  values.join('; ').split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length) map.set(key, `${key}=${rest.join('=')}`);
  });
  return [...map.values()].join('; ');
}

function neteaseAuthOrigin(env) {
  return String(env.NETEASE_AUTH_ORIGIN || DEFAULT_NETEASE_AUTH_ORIGIN).replace(/\/$/, '');
}

async function neteasePost(path, values = {}, cookie = '', env, extraHeaders = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
    Referer: 'https://music.163.com/',
    Origin: 'https://music.163.com',
    'x-os': 'web',
    'X-channelSource': 'undefined',
    'Nm-GCore-Status': '1'
  };
  if (cookie) headers.Cookie = cookie;
  Object.assign(headers, extraHeaders);
  const separator = path.includes('?') ? '&' : '?';
  const encrypted = await weapiEncrypt(values);
  const response = await fetch(`${neteaseAuthOrigin(env)}${path}${separator}timestamp=${Date.now()}`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(encrypted)
  });
  let body = {};
  try { body = await response.json(); } catch {}
  if (!response.ok) throw new Error(`网易云上游 HTTP ${response.status}`);
  return { body, cookie: mergeCookies(cookie, responseCookies(response), bodyCookie(body)) };
}

function qrUrl(key, chainId, env) {
  const params = new URLSearchParams({
    codekey: key,
    chainId,
    hdw_device: 'web',
    hdw_appid: 'web',
    hitExp: '1'
  });
  return `${neteaseAuthOrigin(env)}/st/platform/scanlogin?${params}`;
}

function qrParams(request) {
  const url = new URL(request.url);
  return {
    key: url.searchParams.get('key') || '',
    qrSessionToken: url.searchParams.get('qrSessionToken') || ''
  };
}

async function authQrKey(request, env) {
  const cookie = webQrCookie();
  const chainId = chainIdFor(cookie);
  const result = await neteasePost('/weapi/login/qrcode/unikey', { type: 1 }, cookie, env);
  const unikey = result.body?.unikey || result.body?.data?.unikey || '';
  if (!unikey) throw new Error('网易云没有返回二维码 key');
  return json({
    code: 200,
    data: {
      unikey,
      chainId,
      qrSessionToken: await createQrSessionToken(result.cookie, chainId, env)
    }
  }, 200, request, env);
}

async function requireQrSession(request, env) {
  const { key, qrSessionToken } = qrParams(request);
  if (!key || key.length > 512 || !qrSessionToken) {
    return { error: json({ error: '缺少二维码 key 或扫码会话' }, 400, request, env) };
  }
  const session = await readQrSession(qrSessionToken, env);
  if (!session) return { error: json({ error: '二维码会话已失效，请重新获取二维码' }, 400, request, env) };
  return { key, qrSessionToken, cookie: session.cookie, chainId: session.chainId };
}

async function authQrCreate(request, env) {
  const params = await requireQrSession(request, env);
  if (params.error) return params.error;
  return json({ code: 200, data: { qrurl: qrUrl(params.key, params.chainId, env), qrimg: 'worker-generated', chainId: params.chainId } }, 200, request, env);
}

async function authQrImage(request, env) {
  const params = await requireQrSession(request, env);
  if (params.error) return params.error;
  const image = await fetch(`https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(qrUrl(params.key, params.chainId, env))}`);
  if (!image.ok) throw new Error('二维码图片生成失败');
  const headers = new Headers(corsHeaders(request, env));
  headers.set('Content-Type', image.headers.get('Content-Type') || 'image/png');
  return new Response(image.body, { status: 200, headers });
}

async function authQrCheck(request, env) {
  const params = await requireQrSession(request, env);
  if (params.error) return params.error;
  const result = await neteasePost('/weapi/login/qrcode/client/login', { key: params.key, type: 1 }, params.cookie, env, {
    'X-LoginMethod': 'QrCode',
    'X-Login-Chain-Id': params.chainId,
    'X-OS': 'web',
    'X-ChannelSource': 'undefined',
    'NM-GCORE-STATUS': '1'
  });
  const payload = { ...result.body };
  const code = Number(result.body?.data?.code ?? result.body?.code);
  if (code === 803) {
    const loginCookie = mergeCookies(result.cookie, bodyCookie(result.body), bodyCookie(result.body?.data));
    if (/(?:^|;\s*)(?:MUSIC_U|MUSIC_A)=/i.test(loginCookie)) {
      // Keep this browser-to-music-worker token format stable so account and
      // playlist sync continue to use the existing data backend unchanged.
      payload.sessionToken = encodeToken(loginCookie);
    } else {
      payload.error = '手机已授权，但网易云未返回登录凭证。';
    }
    delete payload.cookie;
    delete payload.cookies;
  }
  return json(payload, 200, request, env);
}

async function authLogout(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  const cookie = decodeToken(token);
  if (cookie) {
    try { await neteasePost('/weapi/logout', {}, cookie, env); } catch {}
  }
  return json({ code: 200, message: '已退出' }, 200, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
    if (!['GET', 'HEAD', 'POST'].includes(request.method)) {
      return json({ error: '只允许 GET、HEAD、POST 或 OPTIONS 请求' }, 405, request, env);
    }
    try {
      const path = url.pathname.replace(/^\/api/, '') || '/';
      if (path === '/auth/qr/key' && request.method === 'GET') return await authQrKey(request, env);
      if (path === '/auth/qr/create' && request.method === 'GET') return await authQrCreate(request, env);
      if (path === '/auth/qr/check' && request.method === 'GET') return await authQrCheck(request, env);
      if (path === '/auth/qr/image' && (request.method === 'GET' || request.method === 'HEAD')) return await authQrImage(request, env);
      if (path === '/auth/logout' && request.method === 'POST') return await authLogout(request, env);
      return json({ error: '不支持的音乐登录接口路径' }, 404, request, env);
    } catch (error) {
      console.error(JSON.stringify({ event: 'music_auth_error', message: error?.message || '登录服务失败' }));
      return json({ error: error?.message || '登录服务暂时不可用' }, 502, request, env);
    }
  }
};
