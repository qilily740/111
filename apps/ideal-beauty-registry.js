(() => {
  const adapters = window.IdealMachineBeautyAdapters || {};
  const registry = new Map();
  const libraryKey = 'ideal-machine-my-beauties-v1';
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
  function toJSON(asset) { return { version:1, type:'ideal-css', appId:asset.appId, sectionId:asset.sectionId, name:asset.name || '未命名美化', css:String(asset.css || '') }; }
  function downloadJson(asset) {
    const blob = new Blob([JSON.stringify(toJSON(asset), null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${String(asset.name || '美化').replace(/[\\/:*?"<>|]/g, '-')}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function addAsset(asset) {
    const item = { id:asset.id || `beauty-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`, name:String(asset.name || '未命名美化'), appId:asset.appId, sectionId:asset.sectionId, css:String(asset.css || ''), source:asset.source || 'local', code:asset.code || '', previewImage:asset.previewImage || '', createdAt:asset.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString() };
    const list = readLibrary(); list.unshift(item); writeLibrary(list); return item;
  }
  function updateAsset(id, patch) { const list = readLibrary(); const item = list.find(entry => entry.id === id); if (!item) return null; Object.assign(item, patch, { updatedAt:new Date().toISOString() }); writeLibrary(list); return item; }
  function removeAsset(id) { writeLibrary(readLibrary().filter(item => item.id !== id)); }
  async function api(path, options = {}) {
    const config = window.IdealMachineConfig || {};
    const base = String(config.beautyApiBase || '').replace(/\/+$/, '');
    if (!base) throw new Error('美化码云端服务尚未配置。请先部署 cloudflare/beauty-worker 并设置 beautyApiBase。');
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
    toJSON, downloadJson, api, show, safeImage, escapeHtml:esc
  };
})();
