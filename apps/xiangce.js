(() => {
  const storageKey = 'ideal-machine-album-v1';
  const imageConfigKey = 'ideal-machine-album-host-v1';
  function readImageConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(imageConfigKey) || '{}');
      const configured = window.IdealMachineConfig || {};
      return {
        imageHostProvider:String(saved.imageHostProvider || configured.imageHostProvider || (saved.imageApiBase || configured.imageApiBase ? 'worker' : 'local')),
        imageApiBase:String(saved.imageApiBase || configured.imageApiBase || '').replace(/\/$/, ''),
        imageUploadToken:String(saved.imageUploadToken || configured.imageUploadToken || '')
      };
    } catch { return { imageHostProvider:String(window.IdealMachineConfig?.imageHostProvider || 'local'), imageApiBase:String(window.IdealMachineConfig?.imageApiBase || '').replace(/\/$/, ''), imageUploadToken:String(window.IdealMachineConfig?.imageUploadToken || '') }; }
  }
  let { imageHostProvider, imageApiBase, imageUploadToken } = readImageConfig();
  let hasImageHost = (imageHostProvider === 'catbox' || imageHostProvider === 'worker') && /^https?:\/\//i.test(imageApiBase);
  let hostConfigOpen = false;
  const sourceLabels = {
    'ideal-machine-desktop': '桌面',
    'ideal-machine-beauty': '美化',
    'ideal-machine-chat': '聊天',
    'ideal-machine-forum': '论坛',
    'ideal-machine-forum-profile': '论坛',
    'ideal-machine-calendar-events': '日历',
    'ideal-machine-image-activity': '生图',
    'ideal-machine-couple': '情侣空间',
    'ideal-machine-home': '家',
    'ideal-machine-town': '小镇',
    'ideal-machine-magazine': '杂志社'
  };
  const appSourceSelectors = [
    ['.chat-app', '聊天'], ['.forum-app', '论坛'], ['.calendar-app', '日历'],
    ['.beauty-app', '美化'], ['.settings-app', '设置'], ['.couple-app', '情侣空间'],
    ['.doubao-app', '豆包'], ['.shopping-app', '购物'], ['.house-app', '家'],
    ['.town-app', '小镇'], ['.magazine-app', '杂志社'], ['.music-app', '音乐'],
    ['.ifspace-app', '如果时空'], ['.worldbook-app', '世界书'], ['.memory-library-app', '记忆库'],
    ['.debate-app', '辩论'], ['.fanfic-app', '同人文'], ['.ta-app', 'Ta'], ['.image-app', '生图']
  ];
  const app = document.createElement('section');
  app.className = 'album-app';
  app.setAttribute('aria-hidden', 'true');
  document.body.appendChild(app);

  let state = readState();
  let query = '';
  let activeId = '';
  let importing = false;
  let toastTimer = null;

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const items = Array.isArray(saved.items) ? saved.items.filter(item => item?.id && item?.url) : [];
      return { items, migratedExisting:saved.migratedExisting === true };
    } catch { return { items: [], migratedExisting:false }; }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({ items: state.items.slice(0, 1200), migratedExisting:state.migratedExisting === true }));
    window.dispatchEvent(new CustomEvent('ideal-machine-album-updated', { detail: { count: state.items.length } }));
  }
  function saveImageConfig() {
    localStorage.setItem(imageConfigKey, JSON.stringify({ imageHostProvider, imageApiBase, imageUploadToken }));
    hasImageHost = (imageHostProvider === 'catbox' || imageHostProvider === 'worker') && /^https?:\/\//i.test(imageApiBase);
  }

  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
  const uid = () => `album-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const isImage = file => file && (String(file.type || '').startsWith('image/') || /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i.test(String(file.name || '')));
  const isPublicImageUrl = value => /^https?:\/\//i.test(String(value || ''));
  const formatDate = value => new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value || Date.now()));
  const formatSize = value => { const bytes = Math.max(0, Number(value) || 0); if (!bytes) return '未知大小'; if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; };

  function sourceForInput(input) {
    for (const [selector, label] of appSourceSelectors) if (input.closest(selector)) return label;
    const openApp = appSourceSelectors.find(([selector]) => document.querySelector(`${selector}.is-open`));
    if (openApp) return openApp[1];
    if (input.closest('#editModal, .desktop-scroll-wrap')) return '桌面';
    return '其他 App';
  }

  function fingerprint(file) {
    return [file.name || '', file.size || 0, file.lastModified || 0, file.type || ''].join(':');
  }

  function imageDimensions(source) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve({ width:image.naturalWidth || 0, height:image.naturalHeight || 0 });
      image.onerror = () => resolve({ width:0, height:0 });
      image.src = source;
    });
  }

  async function uploadToImageHost(file) {
    if (!hasImageHost) throw new Error('尚未配置图床地址');
    const request = window.IdealMachineFetch || window.fetch.bind(window);
    const headers = { 'Content-Type':file.type || 'application/octet-stream', 'X-File-Name':file.name || 'image' };
    if (imageUploadToken) headers.Authorization = `Bearer ${imageUploadToken}`;
    const response = await request(`${imageApiBase}/images`, { method:'POST', body:file, headers, credentials:'omit', cache:'no-store', idealScope:'album' });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.error || `图床上传失败（${response.status}）`);
    if (!isPublicImageUrl(data?.url)) throw new Error('图床没有返回有效的公开 URL');
    return data.url;
  }

  async function makePublicUrl(item) {
    if (!item) throw new Error('图片不存在');
    if (isPublicImageUrl(item.url)) return item.url;
    if (!hasImageHost) throw new Error('尚未配置图床');
    const source = item.url.startsWith('idb:image:') && window.IdealMachineGetImage ? await window.IdealMachineGetImage(item.url) : item.url;
    if (!source) throw new Error('本地图片读取失败');
    const response = await fetch(source);
    const blob = await response.blob();
    const file = new File([blob], item.name || 'image', { type:blob.type || item.type || 'image/png' });
    const url = await uploadToImageHost(file);
    item.url = url;
    item.hosting = 'public';
    saveState();
    return url;
  }

  async function archiveFile(file, source = '其他 App') {
    if (!isImage(file)) return null;
    const mark = fingerprint(file);
    const existing = state.items.find(item => item.fingerprint === mark);
    if (existing) return existing;
    const image = window.IdealMachineReadImage
      ? await window.IdealMachineReadImage(file, 2000, .88)
      : await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => resolve(''); reader.readAsDataURL(file); });
    if (!image) return null;
    const dimensions = await imageDimensions(image);
    let url = '';
    let hosting = 'local';
    if (hasImageHost) {
      try { url = await uploadToImageHost(file); hosting = 'public'; }
      catch (error) { console.warn('album_image_upload_failed', error); }
    }
    if (!url) url = window.IdealMachinePutImage ? await window.IdealMachinePutImage(image) : image;
    const item = {
      id:uid(), url, name:String(file.name || '未命名图片').slice(0, 120), source,
      createdAt:Date.now(), size:Number(file.size) || 0, type:file.type || 'image/*',
      width:dimensions.width, height:dimensions.height, fingerprint:mark, hosting
    };
    state.items.unshift(item);
    saveState();
    if (app.classList.contains('is-open')) render();
    return item;
  }

  function syncStoredImages() {
    if (state.migratedExisting) return;
    const known = new Set(state.items.map(item => item.url));
    let changed = false;
    Object.keys(localStorage).forEach(key => {
      if (key === storageKey) return;
      const value = localStorage.getItem(key) || '';
      const matches = value.match(/idb:image:[^"'\\\s,}\]]+/g) || [];
      matches.forEach(url => {
        if (known.has(url)) return;
        known.add(url);
        state.items.push({ id:uid(), url, name:'已保存的图片', source:sourceLabels[key] || '已有数据', createdAt:Date.now(), size:0, type:'image/*', width:0, height:0, fingerprint:'' });
        changed = true;
      });
    });
    if (changed) state.items.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    state.migratedExisting = true;
    saveState();
  }

  function filteredItems() {
    const keyword = query.trim().toLocaleLowerCase('zh-CN');
    if (!keyword) return state.items;
    return state.items.filter(item => `${item.name} ${item.source} ${formatDate(item.createdAt)}`.toLocaleLowerCase('zh-CN').includes(keyword));
  }

  function photoMarkup(item) {
    return `<button class="album-photo" type="button" data-album-open="${esc(item.id)}" aria-label="查看${esc(item.name)}"><span class="album-photo-image"><img data-album-src="${esc(item.url)}" alt="${esc(item.name)}"></span><span class="album-photo-meta"><b>${esc(item.name)}</b><small>${esc(item.source)} · ${esc(formatDate(item.createdAt))}</small></span></button>`;
  }

  function detailMarkup(item) {
    if (!item) return '';
    const resolution = item.width && item.height ? `${item.width} × ${item.height}` : '读取中';
    const publicUrl = isPublicImageUrl(item.url);
    const hostButton = publicUrl ? '' : `<button data-album-host="${esc(item.id)}" type="button" ${hasImageHost ? '' : 'disabled'}>${hasImageHost ? '上传至图床' : '图床未配置'}</button>`;
    return `<aside class="album-detail" data-album-detail aria-label="图片详情"><button class="album-detail-backdrop" data-album-detail-close type="button" aria-label="关闭图片详情"></button><section><header><div><span>PHOTO DETAILS</span><h2>图片详情</h2></div><button data-album-detail-close type="button" aria-label="关闭">×</button></header><div class="album-detail-preview"><img data-album-src="${esc(item.url)}" alt="${esc(item.name)}"></div><div class="album-detail-copy"><h3>${esc(item.name)}</h3><p>${esc(item.source)} · ${esc(formatDate(item.createdAt))}</p><dl><div><dt>尺寸</dt><dd data-album-resolution="${esc(item.id)}">${esc(resolution)}</dd></div><div><dt>文件</dt><dd>${esc(formatSize(item.size))}</dd></div></dl><label><span>${publicUrl ? '公开图片 URL' : '本地图片地址'}</span><input readonly value="${esc(item.url)}" aria-label="图片地址"></label><small>${publicUrl ? '这是可直接显示的 http(s) 图片 URL；从相册删除记录不会删除这个链接。' : (hasImageHost ? '点击“上传至图床”后会得到可公开显示的 http(s) 图片 URL。' : '请先配置图床，才能生成删除后仍可显示的 http(s) 图片 URL。')}</small></div><footer><button data-album-delete="${esc(item.id)}" type="button">删除</button>${hostButton}<button class="is-primary" data-album-copy="${esc(item.id)}" type="button">复制 URL</button></footer></section></aside>`;
  }

  function render() {
    const items = filteredItems();
    const detail = state.items.find(item => item.id === activeId);
    const hostedCount = state.items.filter(item => isPublicImageUrl(item.url)).length;
    const storageNote = hasImageHost ? `已配置${imageHostProvider === 'catbox' ? '免费第三方图床' : '自建图床'}：${hostedCount} 张图片已有公开 URL；删除相册记录不会删除图床图片。` : '尚未配置图床：当前图片只保存在浏览器，不能生成公开 http(s) URL。';
    app.innerHTML = `<div class="album-page"><header class="album-header"><button data-album-close type="button" aria-label="关闭相册">‹</button><div><span>PHOTO HOSTING LIBRARY</span><h1>相册</h1></div><div class="album-header-actions"><button class="album-host-settings-button" data-album-host-settings type="button" aria-label="图床设置">⚙</button><label class="album-import ${importing ? 'is-busy' : ''}">${importing ? '导入中…' : '导入'}<input data-album-file type="file" accept="image/*" multiple ${importing ? 'disabled' : ''}></label></div></header><section class="album-hero"><div><small>全部照片</small><strong>${state.items.length}</strong><span>张图片保存在这台设备</span></div><div class="album-hero-mark" aria-hidden="true"><i></i><i></i><i></i></div></section><div class="album-search"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="11"/><path d="m30 30 10 10"/></svg><input data-album-search value="${esc(query)}" placeholder="搜索图片名称或来源…"><button data-album-clear type="button" ${query ? '' : 'hidden'}>×</button></div><main class="album-main">${items.length ? `<div class="album-grid">${items.map(photoMarkup).join('')}</div>` : `<div class="album-empty"><div>▧</div><h2>${query ? '没有找到图片' : '相册还是空的'}</h2><p>${query ? '换个关键词试试。' : '以后在任何 App 选择上传图片，它都会自动出现在这里。'}</p>${query ? '' : '<label>选择第一张图片<input data-album-file type="file" accept="image/*" multiple></label>'}</div>`}</main><footer class="album-footnote"><i></i><span>${esc(storageNote)}</span></footer></div>${hostConfigOpen ? `<aside class="album-host-config" data-album-host-config><button class="album-host-config-backdrop" data-album-host-config-close type="button" aria-label="关闭图床设置"></button><section><header><div><span>IMAGE HOSTING</span><h2>图床设置</h2></div><button data-album-host-config-close type="button" aria-label="关闭">×</button></header><label><span>图片存储方式</span><select data-album-provider><option value="local" ${imageHostProvider === 'local' ? 'selected' : ''}>仅保存在本机</option><option value="catbox" ${imageHostProvider === 'catbox' ? 'selected' : ''}>免费第三方图床（ImgDB）</option><option value="worker" ${imageHostProvider === 'worker' ? 'selected' : ''}>自己的 Worker 图床</option></select></label><label data-album-endpoint-field ${imageHostProvider === 'local' ? 'hidden' : ''}><span>${imageHostProvider === 'catbox' ? '中转 Worker 地址' : 'Worker 地址'}</span><input data-album-api value="${esc(imageApiBase)}" placeholder="https://你的-worker.workers.dev"></label><label data-album-token-field ${imageHostProvider === 'worker' ? '' : 'hidden'}><span>上传口令</span><input data-album-token type="password" value="${esc(imageUploadToken)}" placeholder="Worker 的 IMAGE_UPLOAD_TOKEN"></label><p data-album-provider-note>${imageHostProvider === 'catbox' ? '图片会通过中转 Worker 上传到 ImgDB 并返回公开 URL；不要上传私人照片。' : imageHostProvider === 'worker' ? '图片会上传到你自己的 Worker 和 R2，并返回公开 URL。' : '图片只保存在当前浏览器，不会上传到网络。'}</p><footer><button data-album-host-config-close type="button">取消</button><button data-album-host-config-save class="is-primary" type="button">保存设置</button></footer></section></aside>` : ''}${detailMarkup(detail)}<div class="album-toast" data-album-toast role="status"></div>`;
    hydrateImages();
  }

  async function hydrateImages() {
    const images = [...app.querySelectorAll('[data-album-src]')];
    await Promise.all(images.map(async image => {
      const stored = image.dataset.albumSrc || '';
      const source = stored.startsWith('idb:image:') && window.IdealMachineGetImage ? await window.IdealMachineGetImage(stored) : stored;
      if (source) image.src = source;
      if (activeId && image.closest('.album-detail-preview') && source) {
        const dimensions = await imageDimensions(source);
        const item = state.items.find(entry => entry.id === activeId);
        if (item && dimensions.width && dimensions.height && (!item.width || !item.height)) {
          item.width = dimensions.width; item.height = dimensions.height; saveState();
          const target = app.querySelector(`[data-album-resolution="${CSS.escape(item.id)}"]`);
          if (target) target.textContent = `${dimensions.width} × ${dimensions.height}`;
        }
      }
    }));
  }

  function showToast(message) {
    const toast = app.querySelector('[data-album-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); return true; }
    catch {
      const field = document.createElement('textarea');
      field.value = value; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.appendChild(field); field.select();
      const copied = document.execCommand('copy'); field.remove(); return copied;
    }
  }

  async function copyUrl(id) {
    const item = state.items.find(entry => entry.id === id);
    if (!item) return;
    const button = app.querySelector(`[data-album-copy="${CSS.escape(id)}"]`);
    if (button) { button.disabled = true; button.textContent = '处理中…'; }
    let url = '';
    try { url = await makePublicUrl(item); }
    catch (error) { showToast(error.message || '公开 URL 生成失败'); if (button) { button.disabled = false; button.textContent = '复制 URL'; } return; }
    const copied = await copyText(url);
    showToast(copied ? 'URL 已复制，可粘贴到其他 App' : '复制失败，请重试');
    if (button) { button.disabled = false; button.textContent = '复制 URL'; }
  }

  async function hostItem(id) {
    const item = state.items.find(entry => entry.id === id);
    if (!item) return;
    const button = app.querySelector(`[data-album-host="${CSS.escape(id)}"]`);
    if (button) { button.disabled = true; button.textContent = '上传中…'; }
    try { await makePublicUrl(item); render(); showToast('已生成公开图片 URL'); }
    catch (error) { showToast(error.message || '上传图床失败'); if (button) { button.disabled = false; button.textContent = '上传至图床'; } }
  }

  async function deleteItem(id) {
    const item = state.items.find(entry => entry.id === id);
    if (!item || !window.confirm('确定从相册删除这张图片吗？其他 App 正在使用的图片不会被清除。')) return;
    state.items = state.items.filter(entry => entry.id !== id);
    activeId = '';
    const referencedElsewhere = Object.keys(localStorage).some(key => key !== storageKey && (localStorage.getItem(key) || '').includes(item.url));
    saveState();
    if (!referencedElsewhere && item.url.startsWith('idb:image:')) await window.IdealMachineDeleteImage?.(item.url);
    render();
    showToast(referencedElsewhere ? '已从相册移除，原 App 仍可使用' : '图片已删除');
  }

  async function importFiles(files, source = '相册') {
    const images = [...files].filter(isImage);
    if (!images.length) return;
    importing = true; render();
    for (const file of images) await archiveFile(file, source);
    importing = false; render();
    showToast(`${images.length} 张图片已保存`);
  }

  document.addEventListener('change', event => {
    const input = event.target.closest?.('input[type="file"]');
    if (!input || input.matches('[data-album-file]')) return;
    const files = [...(input.files || [])].filter(isImage);
    if (files.length) files.forEach(file => archiveFile(file, sourceForInput(input)));
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="xiangce"]')) {
      state = readState(); syncStoredImages(); query = ''; activeId = '';
      app.classList.add('is-open'); app.setAttribute('aria-hidden', 'false'); render(); return;
    }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-album-close]')) { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); return; }
    if (event.target.closest('[data-album-host-settings]')) { hostConfigOpen = true; render(); return; }
    if (event.target.closest('[data-album-host-config-close]')) { hostConfigOpen = false; render(); return; }
    if (event.target.closest('[data-album-host-config-save]')) {
      const provider = app.querySelector('[data-album-provider]')?.value || 'local';
      const api = app.querySelector('[data-album-api]')?.value.trim().replace(/\/$/, '') || '';
      const token = app.querySelector('[data-album-token]')?.value.trim() || '';
      if (api && !/^https?:\/\//i.test(api)) { showToast('Worker 地址必须以 http:// 或 https:// 开头'); return; }
      if (provider !== 'local' && !api) { showToast('请填写 Worker 地址，或选择仅保存在本机'); return; }
      imageHostProvider = provider; imageApiBase = api; imageUploadToken = token; saveImageConfig(); hostConfigOpen = false; render(); showToast(hasImageHost ? '图床设置已保存' : '已关闭图床上传'); return;
    }
    const open = event.target.closest('[data-album-open]');
    if (open) { activeId = open.dataset.albumOpen; render(); return; }
    if (event.target.closest('[data-album-detail-close]')) { activeId = ''; render(); return; }
    const copy = event.target.closest('[data-album-copy]');
    if (copy) { copyUrl(copy.dataset.albumCopy); return; }
    const host = event.target.closest('[data-album-host]');
    if (host) { hostItem(host.dataset.albumHost); return; }
    const remove = event.target.closest('[data-album-delete]');
    if (remove) { deleteItem(remove.dataset.albumDelete); return; }
    if (event.target.closest('[data-album-clear]')) { query = ''; render(); app.querySelector('[data-album-search]')?.focus(); }
  });

  document.addEventListener('input', event => {
    if (!app.classList.contains('is-open') || !event.target.matches('[data-album-search]')) return;
    const position = event.target.selectionStart;
    query = event.target.value; render();
    const input = app.querySelector('[data-album-search]');
    input?.focus(); input?.setSelectionRange(position, position);
  });

  document.addEventListener('change', event => {
    if (!event.target.matches('[data-album-file]')) return;
    const files = event.target.files || [];
    importFiles(files);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !app.classList.contains('is-open')) return;
    if (activeId) { activeId = ''; render(); }
    else { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); }
  });

  syncStoredImages();
  window.IdealMachineAlbum = { archiveFile, open:() => document.querySelector('[data-app-key="xiangce"]')?.click(), items:() => [...state.items] };
})();
