import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const localBinary = path.join(root, '.tools', 'cloudflared');
const pageUrl = process.env.IDEAL_PUBLIC_PAGE_URL || 'https://qilily740.github.io/111/';

async function executable() {
  try {
    await access(localBinary, constants.X_OK);
    return localBinary;
  } catch {
    return 'cloudflared';
  }
}

async function authServiceIsRunning() {
  try {
    const response = await fetch('http://127.0.0.1:3211/api/auth/qr/key', {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

let authServer = null;
if (await authServiceIsRunning()) {
  console.log('检测到 3211 登录服务已运行，将直接复用。');
} else {
  authServer = spawn(process.execPath, [path.join(root, 'music-auth-server.mjs')], {
    cwd: root,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe']
  });
  authServer.stdout.on('data', chunk => process.stdout.write(chunk));
  authServer.stderr.on('data', chunk => process.stderr.write(chunk));
}

const tunnel = spawn(await executable(), ['tunnel', '--no-autoupdate', '--protocol', 'http2', '--url', 'http://127.0.0.1:3211'], {
  cwd: root,
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe']
});

let announced = false;
let tunnelUrl = '';
function tunnelOutput(chunk) {
  const message = String(chunk);
  process.stderr.write(message);
  tunnelUrl ||= message.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)?.[0] || '';
  if (!tunnelUrl || announced || !/Registered tunnel connection/i.test(message)) return;
  announced = true;
  const authApi = `${tunnelUrl}/api`;
  const launchUrl = new URL(pageUrl);
  launchUrl.searchParams.set('neteaseAuthApiBase', authApi);
  console.log('\n跨网络网易云登录已就绪：');
  console.log(`登录接口：${authApi}`);
  console.log(`请在手机或其他网络打开：${launchUrl.href}`);
  console.log('首次打开后地址会保存在该浏览器；本窗口必须保持运行。\n');
}

tunnel.stdout.on('data', tunnelOutput);
tunnel.stderr.on('data', tunnelOutput);

function stop(signal = 'SIGTERM') {
  if (authServer && !authServer.killed) authServer.kill(signal);
  if (!tunnel.killed) tunnel.kill(signal);
}

process.on('SIGINT', () => { stop('SIGINT'); });
process.on('SIGTERM', () => { stop('SIGTERM'); });

tunnel.on('error', error => {
  console.error(`无法启动 cloudflared：${error.message}`);
  console.error('请把 Cloudflare 官方 cloudflared 放到项目的 .tools/cloudflared 后重试。');
  stop();
  process.exitCode = 1;
});

authServer?.on('exit', code => {
  if (code && code !== 0) console.error(`音乐登录服务异常退出（${code}）`);
  stop();
});

tunnel.on('exit', code => {
  if (code && code !== 0) console.error(`Cloudflare Tunnel 异常退出（${code}）`);
  stop();
});
