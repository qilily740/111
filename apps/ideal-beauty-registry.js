(() => {
  const adapters = window.IdealMachineBeautyAdapters || {};
  const registry = new Map();
  const libraryKey = 'ideal-machine-my-beauties-v1';
  const beautyEndpoint = { base:'', checkedAt:0, pending:null };
  const readLibrary = () => { try { const value = JSON.parse(localStorage.getItem(libraryKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const writeLibrary = value => localStorage.setItem(libraryKey, JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  function registerAdapter(adapter) {
    if (!adapter?.appId || typeof adapter.sections !== 'function') return;
    registry.set(adapter.appId, adapter);
  }
  Object.values(adapters).forEach(registerAdapter);
  function listSections() {
    return [...registry.values()].flatMap(adapter => adapter.sections().map(section => ({ ...section, appId:adapter.appId, appName:adapter.appName })));
  }
  function find(appId, sectionId) { return listSections().find(item => item.appId === appId && item.id === sectionId) || null; }
  function applyBeauty({ appId, sectionId, css }) {
    const section = find(appId, sectionId);
    if (!section) throw new Error('找不到对应的美化接口');
    section.setCss(String(css ?? ''));
    section.runtimeApply?.();
    window.dispatchEvent(new CustomEvent('ideal-machine-beauty-applied', { detail:{ appId, sectionId } }));
    return true;
  }
  function toJSON(asset) { return { version:1, type:'ideal-css', appId:asset.appId, sectionId:asset.sectionId, name:asset.name || '未命名美化', author:String(asset.author || ''), css:String(asset.css || '') }; }
  function downloadJson(asset) {
    if (asset?.source === 'imported-code' || asset?.source === 'json' || asset?.imported) { window.alert('这是导入的作者美化副本，不能再次导出或分享。'); return; }
    const blob = new Blob([JSON.stringify(toJSON(asset), null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${String(asset.name || '美化').replace(/[\\/:*?"<>|]/g, '-')}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportWithChoice({ jsonExport, codeAssets = [], blocked = false }) {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'presentation');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(18,20,24,.5);backdrop-filter:blur(8px)';
    const panel = document.createElement('section');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'idealExportTitle');
    panel.style.cssText = 'box-sizing:border-box;width:min(420px,100%);padding:24px;border:1px solid rgba(0,0,0,.08);border-radius:22px;background:#fff;color:#202124;box-shadow:0 24px 80px rgba(0,0,0,.24);font:14px/1.5 system-ui,-apple-system,sans-serif';
    if (blocked) {
      panel.innerHTML = '<h2 id="idealExportTitle" style="margin:0 0 8px;font-size:20px">暂不可导出</h2><p style="margin:0 0 18px;color:#696b70;line-height:1.7">这是从作者处导入的美化副本，可以在本机修改和使用，但不能再次导出美化码或 JSON 分享给其他人。</p><div data-export-actions style="display:grid;gap:10px"><button type="button" data-export-cancel>知道了</button></div>';
      panel.querySelectorAll('button').forEach(button => { button.style.cssText = 'min-height:42px;padding:10px 14px;border:1px solid #dedfe3;border-radius:12px;background:#202124;color:#fff;font:inherit;font-weight:600;cursor:pointer'; });
      overlay.appendChild(panel); document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
      panel.querySelector('[data-export-cancel]').addEventListener('click', close);
      return;
    }
    const exportableAssets = codeAssets.filter(asset => String(asset.css || '').trim());
    const nameFields = exportableAssets.map((asset, index) => `<label style="display:grid;gap:6px;color:#696b70;font-size:12px">${exportableAssets.length > 1 ? `<span>${esc(asset.name || `第 ${index + 1} 个美化`)}</span>` : '<span>美化名称</span>'}<input data-export-name-index="${index}" type="text" maxlength="60" value="${esc(asset.name || '')}" placeholder="例如：紫色聊天主题" style="box-sizing:border-box;width:100%;min-height:40px;border:1px solid #dedfe3;border-radius:10px;padding:9px 11px;background:#fff;color:#202124;font:inherit"></label>`).join('');
    panel.innerHTML = `<h2 id="idealExportTitle" style="margin:0 0 8px;font-size:20px">选择导出方式</h2><p style="margin:0 0 18px;color:#696b70">导出为 JSON 文件，或生成可分享的美化码。</p><div data-export-name-fields style="display:grid;gap:10px;margin:0 0 16px">${nameFields}</div><label style="display:grid;gap:6px;margin:0 0 16px;color:#696b70;font-size:12px">作者（选填，仅生成美化码时保存）<input data-export-author type="text" maxlength="60" placeholder="例如：你的昵称" style="box-sizing:border-box;width:100%;min-height:40px;border:1px solid #dedfe3;border-radius:10px;padding:9px 11px;background:#fff;color:#202124;font:inherit"></label><div data-export-message style="display:none;margin:0 0 16px;padding:12px;border-radius:12px;background:#f4f5f7;overflow-wrap:anywhere"></div><div data-export-actions style="display:grid;gap:10px"><button type="button" data-export-json>导出 JSON</button><button type="button" data-export-code>生成美化码</button><button type="button" data-export-cancel>取消</button></div>`;
    panel.querySelectorAll('button').forEach(button => { button.style.cssText = 'min-height:42px;padding:10px 14px;border:1px solid #dedfe3;border-radius:12px;background:#fff;color:inherit;font:inherit;font-weight:600;cursor:pointer'; });
    panel.querySelector('[data-export-code]').style.background = '#202124'; panel.querySelector('[data-export-code]').style.color = '#fff';
    overlay.appendChild(panel); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    panel.querySelector('[data-export-cancel]').addEventListener('click', close);
    panel.querySelector('[data-export-json]').addEventListener('click', () => { close(); jsonExport?.(); });
    panel.querySelector('[data-export-code]').addEventListener('click', async event => {
      const button = event.currentTarget; const message = panel.querySelector('[data-export-message]');
      const author = panel.querySelector('[data-export-author]')?.value.trim() || '';
      const assets = exportableAssets.map((asset, index) => ({ ...asset, name:panel.querySelector(`[data-export-name-index="${index}"]`)?.value.trim() || asset.name || '未命名美化', author }));
      if (!assets.length) { message.textContent = '当前没有可生成美化码的 CSS。'; message.style.display = 'block'; return; }
      button.disabled = true; button.textContent = '生成中…';
      panel.querySelector('[data-export-json]').disabled = true; panel.querySelector('[data-export-cancel]').disabled = true;
      try {
        const created = [];
        for (const asset of assets) {
          const result = await api('/api/beauty/codes', { method:'POST', body:JSON.stringify({ appId:asset.appId, sectionId:asset.sectionId, name:asset.name || '未命名美化', author:asset.author || '', css:String(asset.css), previewImage:asset.previewImage || '' }) });
          const item = { ...asset, ...(result.item || {}), code:result.item?.code || result.code };
          created.push({ ...item, reused:Boolean(result.reused) });
          if (!readLibrary().some(entry => entry.code && entry.code === item.code)) {
            try { addAsset({ ...item, source:'generated' }); } catch {}
          }
        }
        message.textContent = `${created.some(item => item.reused) ? '已有相同美化码，已复用原码。' : `已生成 ${created.length} 个美化码：`}\n${created.map(item => `${item.name || '美化'}：${item.code}`).join('\n')}`;
        message.style.whiteSpace = 'pre-wrap'; message.style.display = 'block';
        const actions = panel.querySelector('[data-export-actions]');
        const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = '复制美化码'; copy.style.cssText = 'min-height:42px;padding:10px 14px;border:0;border-radius:12px;background:#202124;color:#fff;font:inherit;font-weight:600;cursor:pointer';
        copy.addEventListener('click', async () => { const codes = created.map(item => item.code).join('\n'); try { await navigator.clipboard.writeText(codes); copy.textContent = '已复制'; } catch { window.prompt('复制美化码', codes); } });
        actions.replaceChildren(copy); const done = document.createElement('button'); done.type = 'button'; done.textContent = '完成'; done.style.cssText = 'min-height:42px;padding:10px 14px;border:1px solid #dedfe3;border-radius:12px;background:#fff;color:inherit;font:inherit;font-weight:600;cursor:pointer'; done.addEventListener('click', close); actions.appendChild(done);
      } catch (error) {
        message.textContent = error.message || '生成美化码失败'; message.style.display = 'block';
        button.disabled = false; button.textContent = '重试'; panel.querySelector('[data-export-json]').disabled = false; panel.querySelector('[data-export-cancel]').disabled = false;
      }
    });
  }
  function addAsset(asset) {
    const item = { id:asset.id || `beauty-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`, name:String(asset.name || '未命名美化'), author:String(asset.author || ''), appId:asset.appId, sectionId:asset.sectionId, css:String(asset.css || ''), source:asset.source || 'local', imported:Boolean(asset.imported || asset.source === 'imported-code' || asset.source === 'json'), code:asset.code || '', repositoryPostId:asset.repositoryPostId || '', previewImage:asset.previewImage || '', createdAt:asset.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString() };
    const list = readLibrary(); list.unshift(item); writeLibrary(list); return item;
  }
  function updateAsset(id, patch) { const list = readLibrary(); const item = list.find(entry => entry.id === id); if (!item) return null; Object.assign(item, patch, { updatedAt:new Date().toISOString() }); writeLibrary(list); return item; }
  function removeAsset(id) { writeLibrary(readLibrary().filter(item => item.id !== id)); }
  async function chooseBeautyBase(primary, fallback) {
    if (!fallback || primary === fallback) return primary;
    if (beautyEndpoint.base && Date.now() - beautyEndpoint.checkedAt < 60_000) return beautyEndpoint.base;
    if (!beautyEndpoint.pending) {
      beautyEndpoint.pending = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try {
          const response = await fetch(`${primary}/api/beauty/codes`, { method:'OPTIONS', credentials:'omit', cache:'no-store', signal:controller.signal });
          return response.ok ? primary : fallback;
        } catch { return fallback; }
        finally { clearTimeout(timer); }
      })().then(base => {
        beautyEndpoint.base = base;
        beautyEndpoint.checkedAt = Date.now();
        return base;
      }).finally(() => { beautyEndpoint.pending = null; });
    }
    return beautyEndpoint.pending;
  }
  async function api(path, options = {}) {
    const config = window.IdealMachineConfig || {};
    const primary = String(config.beautyApiBase || '').replace(/\/+$/, '');
    if (!primary) throw new Error('美化码云端服务尚未配置。请先部署 cloudflare/beauty-worker 并设置 beautyApiBase。');
    const fallback = String(config.beautyApiFallbackBase || '').replace(/\/+$/, '');
    const base = await chooseBeautyBase(primary, fallback);
    const token = window.IdealMachineAuth?.getToken?.() || '';
    const headers = new Headers(options.headers || {}); if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${base}${path}`, { ...options, headers, credentials:'omit', cache:'no-store' });
    let payload = {}; try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
    return payload;
  }
  function show(view = 'beauty') { window.dispatchEvent(new CustomEvent('ideal-machine-beauty-open', { detail:{ view } })); }
  function safeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader(); reader.onerror = () => reject(new Error('效果图读取失败'));
      reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error('效果图无法预览')); image.onload = () => { const scale = Math.min(1, 1000 / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale)); canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .76)); }; image.src = String(reader.result || ''); };
      reader.readAsDataURL(file);
    });
  }
  window.IdealMachineBeauty = {
    register:registerAdapter,
    listApps:() => [...registry.values()].map(({ appId, appName }) => ({ appId, appName })),
    listSections, find,
    getCss:({ appId, sectionId }) => { const section = find(appId, sectionId); if (!section) throw new Error('找不到对应的美化接口'); return String(section.getCss() || ''); },
    applyBeauty,
    reset:({ appId, sectionId }) => { const section = find(appId, sectionId); if (!section) throw new Error('找不到对应的美化接口'); section.resetCss(); section.runtimeApply?.(); },
    library:{ list:readLibrary, add:addAsset, update:updateAsset, remove:removeAsset },
    toJSON, downloadJson, exportWithChoice, api, show, safeImage, escapeHtml:esc
  };
})();
