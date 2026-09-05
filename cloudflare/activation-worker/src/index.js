const FEATURE = 'st_character_card_import';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function originAllowed(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return configured.includes('*') ? (origin || '*') : (configured.includes(origin) ? origin : '');
}

function corsHeaders(request, env) {
  const allowOrigin = originAllowed(request, env);
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function normalizeDeviceCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeActivationCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '-');
}

function validDeviceCode(value) {
  return /^IM-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){1,2}$/.test(value);
}

function validActivationCode(value) {
  return /^IMAK-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,3}$/.test(value);
}

async function sha256(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomCode(prefix, groups = 3) {
  const values = new Uint32Array(groups * 4);
  crypto.getRandomValues(values);
  const chars = [];
  for (const value of values) chars.push(CODE_ALPHABET[value % CODE_ALPHABET.length]);
  const chunks = [];
  for (let index = 0; index < groups; index += 1) chunks.push(chars.slice(index * 4, index * 4 + 4).join(''));
  return `${prefix}-${chunks.join('-')}`;
}

function randomId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function createActivation(request, env) {
  if (!env.DB) return json({ error: 'D1 尚未绑定到 Worker' }, 503, request, env);
  const payload = await readJson(request);
  const deviceCode = normalizeDeviceCode(payload?.deviceCode);
  const feature = String(payload?.feature || FEATURE);
  if (!validDeviceCode(deviceCode)) return json({ error: '设备码格式不正确' }, 400, request, env);
  if (feature !== FEATURE) return json({ error: '不支持的授权功能' }, 400, request, env);

  const deviceHash = await sha256(deviceCode);
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO devices (device_code_hash, created_at, last_seen_at) VALUES (?, ?, ?) ON CONFLICT(device_code_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at')
    .bind(deviceHash, now, now).run();

  // Reissuing automatically invalidates the previous code for this device.
  await env.DB.prepare('UPDATE licenses SET status = ? WHERE device_code_hash = ? AND feature = ? AND status = ?')
    .bind('replaced', deviceHash, feature, 'active').run();
  let activationCode = randomCode('IMAK', 3);
  let codeHash = await sha256(activationCode);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await env.DB.prepare('SELECT id FROM licenses WHERE activation_code_hash = ?').bind(codeHash).first();
    if (!existing) break;
    activationCode = randomCode('IMAK', 3);
    codeHash = await sha256(activationCode);
  }
  const token = randomCode('IMLT', 4);
  const tokenHash = await sha256(token);
  await env.DB.prepare('INSERT INTO licenses (id, device_code_hash, activation_code_hash, license_token_hash, feature, status, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(randomId('license'), deviceHash, codeHash, tokenHash, feature, 'active', now).run();
  return json({ ok: true, activationCode, feature, issuedAt: now, message: '激活码已生成，请回到理想机填写。' }, 201, request, env);
}

async function verifyActivation(request, env) {
  if (!env.DB) return json({ error: 'D1 尚未绑定到 Worker' }, 503, request, env);
  const payload = await readJson(request);
  const deviceCode = normalizeDeviceCode(payload?.deviceCode);
  const activationCode = normalizeActivationCode(payload?.activationCode);
  const feature = String(payload?.feature || FEATURE);
  if (!validDeviceCode(deviceCode) || !validActivationCode(activationCode)) return json({ error: '设备码或激活码格式不正确' }, 400, request, env);
  if (feature !== FEATURE) return json({ error: '不支持的授权功能' }, 400, request, env);
  const deviceHash = await sha256(deviceCode);
  const codeHash = await sha256(activationCode);
  const license = await env.DB.prepare('SELECT id, feature, status, issued_at FROM licenses WHERE device_code_hash = ? AND activation_code_hash = ? AND feature = ? LIMIT 1')
    .bind(deviceHash, codeHash, feature).first();
  if (!license || license.status !== 'active') return json({ ok: false, error: '激活码无效、已替换或不属于此设备' }, 403, request, env);
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE licenses SET last_verified_at = ? WHERE id = ?').bind(now, license.id).run();
  return json({ ok: true, license: { id: license.id, feature: license.feature, status: license.status, issuedAt: license.issued_at, verifiedAt: now } }, 200, request, env);
}

function activationPage(apiBase) {
  const safeApi = JSON.stringify(apiBase);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>理想机激活</title><style>body{margin:0;min-height:100vh;background:#f3f3f0;color:#202020;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center}.card{width:min(420px,calc(100% - 40px));box-sizing:border-box;padding:30px;border-radius:26px;background:#fff;box-shadow:0 18px 60px #00000012}.eyebrow{font-size:11px;letter-spacing:.16em;color:#999}.card h1{margin:8px 0 10px;font-size:26px}.card p{color:#777;line-height:1.7;font-size:14px}.card input{box-sizing:border-box;width:100%;padding:14px 15px;border:1px solid #ddd;border-radius:13px;font-size:16px;text-transform:uppercase;outline:0}.card button{width:100%;margin-top:14px;padding:14px;border:0;border-radius:13px;background:#202020;color:#fff;font-size:15px;cursor:pointer}.card button:disabled{opacity:.5}.result{margin-top:18px;padding:16px;border-radius:14px;background:#f4f4f2;white-space:pre-wrap;word-break:break-word}.code{font-size:20px;letter-spacing:.08em;font-weight:700}.hint{font-size:12px;color:#999}</style></head><body><main class="card"><div class="eyebrow">IDEAL MACHINE</div><h1>获取激活码</h1><p>请在理想机“导入酒馆角色卡”页面复制设备码，粘贴到这里即可自动获取激活码。</p><input id="device" maxlength="17" placeholder="IM-XXXX-XXXX-XXXX" autocomplete="off"><button id="submit">获取激活码</button><div id="result" class="result" hidden></div><p class="hint">激活码只绑定当前设备码。请不要把激活码分享给其他设备。</p></main><script>const API=${safeApi};const device=document.querySelector('#device');const button=document.querySelector('#submit');const result=document.querySelector('#result');function show(text,code=''){result.hidden=false;result.innerHTML=code?'<div>'+text+'</div><div class="code">'+code+'</div>':'<div>'+text+'</div>';}button.addEventListener('click',async()=>{const value=device.value.trim().toUpperCase();if(!/^IM-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){1,2}$/.test(value)){show('设备码格式不正确。');return}button.disabled=true;show('正在生成激活码……');try{const response=await fetch(API+'/activation/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceCode:value,feature:'${FEATURE}'})});const data=await response.json();if(!response.ok)throw new Error(data.error||'生成失败');show(data.message||'激活码已生成：',data.activationCode)}catch(error){show(error.message||'暂时无法获取激活码，请稍后重试。')}finally{button.disabled=false}});</script></body></html>`;
}

function activationPageWithCopy(apiBase) {
  const safeApi = JSON.stringify(apiBase);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>理想机激活</title><style>body{margin:0;min-height:100vh;background:#f3f3f0;color:#202020;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center}.card{width:min(420px,calc(100% - 40px));box-sizing:border-box;padding:30px;border-radius:26px;background:#fff;box-shadow:0 18px 60px #00000012}.eyebrow{font-size:11px;letter-spacing:.16em;color:#999}.card h1{margin:8px 0 10px;font-size:26px}.card p{color:#777;line-height:1.7;font-size:14px}.card input{box-sizing:border-box;width:100%;padding:14px 15px;border:1px solid #ddd;border-radius:13px;font-size:16px;text-transform:uppercase;outline:0}.card button{width:100%;margin-top:14px;padding:14px;border:0;border-radius:13px;background:#202020;color:#fff;font-size:15px;cursor:pointer}.card button:disabled{opacity:.5}.result{margin-top:18px;padding:16px;border-radius:14px;background:#f4f4f2;white-space:pre-wrap;word-break:break-word}.code-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}.code{min-width:0;overflow:hidden;font-size:20px;letter-spacing:.08em;font-weight:700;text-overflow:ellipsis}.copy-button{width:auto!important;margin:0!important;flex:0 0 auto;padding:9px 12px!important;border:1px solid #d7d7d3!important;background:#fff!important;color:#202020!important;font-size:13px!important}.hint{font-size:12px;color:#999}</style></head><body><main class="card"><div class="eyebrow">IDEAL MACHINE</div><h1>获取激活码</h1><p>请在理想机“导入酒馆角色卡”页面复制设备码，粘贴到这里即可自动获取激活码。</p><input id="device" maxlength="17" placeholder="IM-XXXX-XXXX-XXXX" autocomplete="off"><button id="submit">获取激活码</button><div id="result" class="result" hidden></div><p class="hint">激活码只绑定当前设备码。请不要把激活码分享给其他设备。</p></main><script>const API=${safeApi};const device=document.querySelector('#device');const button=document.querySelector('#submit');const result=document.querySelector('#result');function copyValue(value,source){const done=()=>{source.textContent='已复制';setTimeout(()=>{source.textContent='复制'},1600)};if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(done).catch(()=>fallback())}else fallback();function fallback(){const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{document.execCommand('copy');done()}catch{source.textContent='请长按复制'}area.remove()}}function show(text,code=''){result.hidden=false;result.innerHTML=code?'<div>'+text+'</div><div class="code-row"><div class="code">'+code+'</div><button type="button" class="copy-button" id="copyCode">复制</button></div>':'<div>'+text+'</div>';if(code)document.querySelector('#copyCode')?.addEventListener('click',event=>copyValue(code,event.currentTarget))}button.addEventListener('click',async()=>{const value=device.value.trim().toUpperCase();if(!/^IM-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){1,2}$/.test(value)){show('设备码格式不正确。');return}button.disabled=true;show('正在生成激活码……');try{const response=await fetch(API+'/activation/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceCode:value,feature:'${FEATURE}'})});const data=await response.json();if(!response.ok)throw new Error(data.error||'生成失败');show(data.message||'激活码已生成：',data.activationCode)}catch(error){show(error.message||'暂时无法获取激活码，请稍后重试。')}finally{button.disabled=false}});</script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      if (url.pathname === '/' && request.method === 'GET') return html(activationPageWithCopy(url.origin));
      if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'ideal-machine-activation' }, 200, request, env);
      if (url.pathname === '/activation/create' && request.method === 'POST') return await createActivation(request, env);
      if (url.pathname === '/activation/verify' && request.method === 'POST') return await verifyActivation(request, env);
      return json({ error: '请求路径或方法不支持' }, 404, request, env);
    } catch (error) {
      console.error(JSON.stringify({ event: 'activation_error', message: error?.message || 'unknown_error' }));
      return json({ error: '激活服务暂时不可用' }, 500, request, env);
    }
  }
};
