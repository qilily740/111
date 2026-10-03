import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.IDEAL_LOCAL_PORT || 3210);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.mp3':'audio/mpeg' };
const routes = /\/(?:models|chat\/completions|responses|embeddings|images\/generations)\/?$/i;
function json(res, status, message) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify({ error:{ message } }));
}
export function createLocalServer({ upstreamFetch = fetch } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || '';
      if (!/^(?:localhost|127\.0\.0\.1):\d+$/.test(host)) return json(res, 403, '仅支持本机访问');
      const url = new URL(req.url, `http://${host}`);
      const origin = req.headers.origin;
      if (origin && origin !== url.origin) return json(res, 403, '仅允许本地页面访问');
      if (url.pathname.startsWith('/api/ai/')) {
        if (!['GET', 'POST'].includes(req.method)) return json(res, 405, '不支持的请求方法');
        let target;
        try { target = new URL(req.headers['x-ideal-target-url']); } catch { return json(res, 400, '缺少有效的 API 地址'); }
        if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || !routes.test(target.pathname)) return json(res, 400, '仅支持模型 API 地址');
        if (['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && Number(target.port || 80) === Number(host.split(':')[1])) return json(res, 400, 'API 地址不能指向本地启动服务自身');
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32 * 1024 * 1024) return json(res, 413, '请求内容过大');
          chunks.push(chunk);
        }
        const headers = new Headers();
        for (const name of ['authorization', 'content-type', 'accept']) if (req.headers[name]) headers.set(name, req.headers[name]);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 600000);
        const cancel = () => { if (!res.writableEnded) controller.abort(); };
        res.on('close', cancel);
        try {
          const upstream = await upstreamFetch(target, { method:req.method, headers, body:req.method === 'POST' ? Buffer.concat(chunks) : undefined, signal:controller.signal, redirect:'error' });
          res.writeHead(upstream.status, { 'Content-Type':upstream.headers.get('content-type') || 'application/json', 'Cache-Control':'no-store' });
          if (upstream.body) await pipeline(Readable.fromWeb(upstream.body), res);
          else res.end();
        } catch (error) {
          if (!res.headersSent) json(res, 502, `本地服务无法连接上游 API（${error.cause?.code || error.name}），请检查接口地址、网络和代理设置。`);
          else res.destroy();
        } finally { clearTimeout(timer); res.off('close', cancel); }
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, '不支持的请求方法');
      const path = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      if (!/^\/(?:index\.html|app\.js|style\.css|sw\.js|icons\.svg|site\.webmanifest|(?:apps|assets)\/[^]+)$/.test(path) || path.split('/').some(part => part.startsWith('.'))) return json(res, 404, '文件不存在');
      const file = await realpath(resolve(root, `.${path}`));
      if (!file.startsWith(root + sep)) return json(res, 403, '禁止访问');
      let body = await readFile(file);
      if (path === '/index.html') body = Buffer.from(body.toString().replace('<head>', '<head><script>window.IdealMachineConfig = { aiProxyBase: location.origin + "/api/ai" };</script>'));
      res.writeHead(200, { 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (!res.headersSent) json(res, error.code === 'ENOENT' ? 404 : 500, '无法读取本地文件');
      else res.destroy();
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createLocalServer();
  server.on('error', error => { console.error(`启动失败：${error.code}，请检查端口 ${port} 是否被占用。`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`理想机已启动：http://127.0.0.1:${port}/\n请保持此终端窗口开启。`));
}
