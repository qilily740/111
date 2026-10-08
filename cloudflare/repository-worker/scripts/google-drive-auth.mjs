import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const configPath = process.argv[2];
if (!configPath) {
  console.error('用法：node scripts/google-drive-auth.mjs /path/to/client_secret.json');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const client = raw.installed || raw.web || raw;
const clientId = String(client.client_id || '').trim();
const clientSecret = String(client.client_secret || '').trim();
if (!clientId || !clientSecret) throw new Error('OAuth 配置文件中缺少 client_id 或 client_secret');

const port = 8765;
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
const state = crypto.randomBytes(24).toString('hex');
const params = new URLSearchParams({
  client_id:clientId,
  redirect_uri:redirectUri,
  response_type:'code',
  scope:'https://www.googleapis.com/auth/drive.file',
  access_type:'offline',
  prompt:'consent',
  state
});

function putSecret(name, value) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['wrangler', 'secret', 'put', name], { cwd:process.cwd(), stdio:['pipe','inherit','inherit'] });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`wrangler secret put ${name} 失败 (${code})`)));
    child.stdin.end(`${value}\n`);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname !== '/oauth2callback') { response.writeHead(404); response.end('Not found'); return; }
  if (url.searchParams.get('state') !== state) { response.writeHead(400); response.end('Invalid state'); server.close(); return; }
  const error = url.searchParams.get('error');
  if (error) { response.writeHead(400, {'Content-Type':'text/plain; charset=utf-8'}); response.end(`Google 授权失败：${error}`); server.close(); return; }
  const code = url.searchParams.get('code');
  if (!code) { response.writeHead(400); response.end('Missing code'); server.close(); return; }
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({ code, client_id:clientId, client_secret:clientSecret, redirect_uri:redirectUri, grant_type:'authorization_code' })
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.refresh_token) throw new Error(token.error_description || '没有取得 refresh token');
    await putSecret('GOOGLE_CLIENT_ID', clientId);
    await putSecret('GOOGLE_CLIENT_SECRET', clientSecret);
    await putSecret('GOOGLE_REFRESH_TOKEN', token.refresh_token);
    response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    response.end('<!doctype html><meta charset="utf-8"><title>授权完成</title><p>Google Drive 授权完成，可以关闭此页面。</p>');
    console.log('Google Drive 授权完成，三个 Worker Secret 已更新。');
  } catch (err) {
    response.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
    response.end(`授权配置失败：${err.message}`);
    console.error(err.message);
  } finally {
    setTimeout(() => server.close(), 300);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('请在已登录 Google 的浏览器打开下面的地址完成授权：');
  console.log(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  console.log('等待授权回调……');
});
