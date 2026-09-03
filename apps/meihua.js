(() => {
  const storageKey = 'ideal-machine-beauty';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { localStorage.removeItem(storageKey); }
  if (Object.prototype.hasOwnProperty.call(saved, 'fullscreen')) {
    delete saved.fullscreen;
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
  }
  const appRoot = window.IdealMachineApps = window.IdealMachineApps || {};
  appRoot.meihua = { name: '美化' };
  const appItems = [...document.querySelectorAll('[data-app-key]')].filter(item => !item.matches('[data-folder-open]'));
  const folderItems = [...document.querySelectorAll('[data-folder-open]')];
  const iconElement = item => item.querySelector('.app-icon, .dock-icon, .folder-app-icon');
  const nameElement = item => item.querySelector('.app-name, .dock-name, .folder-app-name');
  const defaultApps = new Map(appItems.map(item => [item.dataset.appKey, { name: nameElement(item)?.textContent || '', icon: iconElement(item)?.innerHTML || '' }]));
  const launcherPresets = {
    orbit: { name: '1', day: 'assets/icons/ideal-orbit-day.png', night: 'assets/icons/ideal-orbit-night.png' },
    cycle: { name: '2', day: 'assets/icons/ideal-cycle-day.png', night: 'assets/icons/ideal-cycle-night.png' },
    fall: { name: '3', day: 'assets/icons/ideal-fall-day.png', night: 'assets/icons/ideal-fall-night.png' }
  };
  const normalizeLauncherIcon = value => ({ preset: launcherPresets[value?.preset] ? value.preset : 'orbit', appearance: value?.appearance === 'night' ? 'night' : 'day', custom: typeof value?.custom === 'string' ? value.custom : '', revision: Number(value?.revision) || 1 });
  let launcherIconDraft = normalizeLauncherIcon(saved.launcherIcon);
  const modal = document.createElement('div');
  modal.className = 'beauty-modal';
  modal.innerHTML = `
    <div class="beauty-backdrop" data-beauty-close></div>
    <section class="beauty-sheet" role="dialog" aria-modal="true" aria-labelledby="beautyTitle">
      <header class="beauty-head">
        <div><div class="beauty-kicker">DESKTOP STUDIO</div><h2 class="beauty-title" id="beautyTitle">美化桌面</h2><p class="beauty-subtitle">留白之上，重构桌面秩序。</p></div>
        <button class="beauty-close" type="button" data-beauty-close>×</button>
      </header>
      <div class="beauty-content">
        <section class="beauty-transfer">
          <div><h3 class="beauty-section-title">桌面美化档案</h3><p>将壁纸、名称和图标保存为 JSON，方便备份或迁移。</p></div>
          <div class="beauty-transfer-actions"><button class="beauty-btn beauty-transfer-btn" id="beautyExport" type="button">导出 JSON</button><label class="beauty-btn beauty-transfer-btn">导入 JSON<input class="beauty-file" id="beautyImportFile" type="file" accept="application/json,.json"></label></div>
        </section>
        <section class="beauty-section">
          <div class="beauty-section-head"><h3 class="beauty-section-title">桌面壁纸</h3><span class="beauty-section-note">Wallpaper</span></div>
          <div class="beauty-wallpaper-box"><div class="beauty-wallpaper-preview" id="beautyWallpaperPreview"></div><input class="beauty-input" id="beautyWallpaperUrl" type="url" placeholder="粘贴图片 URL"><label class="beauty-file-label">从本地选择<input class="beauty-file" id="beautyWallpaperFile" type="file" accept="image/*"></label></div>
        </section>
        <section class="beauty-section">
          <div class="beauty-section-head"><h3 class="beauty-section-title">App 图标与名称</h3><button class="beauty-btn beauty-inline-reset" id="beautyReset" type="button">恢复默认图标与名称</button></div>
          <div class="beauty-app-list" id="beautyAppList"></div>
        </section>
      </div>
      <footer class="beauty-footer"><button class="beauty-btn beauty-cancel" type="button" data-beauty-close>关闭</button><button class="beauty-btn beauty-save" id="beautySave" type="button">保存更改</button></footer>
    </section>`;
  document.body.appendChild(modal);
  const launcherSetup = document.createElement('aside');
  launcherSetup.className = 'launcher-setup';
  launcherSetup.setAttribute('aria-hidden', 'true');
  launcherSetup.innerHTML = '<button class="launcher-setup-backdrop" data-launcher-setup-close type="button" aria-label="关闭添加到桌面设置"></button><section class="launcher-setup-sheet" role="dialog" aria-modal="true" aria-labelledby="launcherSetupTitle"><header><div><span>IDEAL MACHINE</span><h2 id="launcherSetupTitle">添加到桌面</h2><p>先选择你喜欢的图标，再将理想机添加到手机桌面。</p></div><button type="button" data-launcher-setup-close aria-label="关闭">×</button></header><div class="launcher-setup-body"><div class="launcher-setup-preview"><img id="launcherSetupPreview" alt="理想机图标"><span>桌面图标预览</span></div><div id="launcherSetupPanel"></div></div><footer><button class="launcher-setup-later" type="button" data-launcher-setup-close>稍后设置</button><button class="launcher-setup-install" type="button" data-launcher-setup-install>添加到桌面</button></footer></section>';
  document.body.appendChild(launcherSetup);
  const iconPicker = document.createElement('div');
  iconPicker.className = 'beauty-icon-picker';
  iconPicker.innerHTML = '<div class="beauty-icon-picker-backdrop" data-beauty-picker-close></div><section class="beauty-icon-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="beautyIconPickerTitle"><header><div><span>APP ICON</span><h3 id="beautyIconPickerTitle">更换图标</h3></div><button type="button" data-beauty-picker-close aria-label="关闭">×</button></header><div class="beauty-icon-picker-options"><button type="button" data-beauty-picker-local><b>⌁</b><span>本地图片</span><small>从手机相册选择</small></button><button type="button" data-beauty-picker-url-open><b>↗</b><span>图片 URL</span><small>粘贴网络图片地址</small></button></div><div class="beauty-icon-picker-url" data-beauty-picker-url-panel hidden><input type="url" data-beauty-picker-url placeholder="粘贴图片 URL"><button type="button" data-beauty-picker-url-save>使用</button></div></section>';
  modal.appendChild(iconPicker);
  const deleteWallpaperButton = document.createElement('button');
  deleteWallpaperButton.className = 'beauty-wallpaper-delete';
  deleteWallpaperButton.type = 'button';
  deleteWallpaperButton.textContent = '删除壁纸，恢复默认';
  const wallpaperBox = modal.querySelector('.beauty-wallpaper-box');
  const wallpaperFileLabel = wallpaperBox?.querySelector('.beauty-file-label');
  if (wallpaperBox && wallpaperFileLabel) {
    const wallpaperActions = document.createElement('div');
    wallpaperActions.className = 'beauty-wallpaper-actions';
    wallpaperBox.insertBefore(wallpaperActions, wallpaperFileLabel);
    wallpaperActions.append(wallpaperFileLabel, deleteWallpaperButton);
  }

  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cssUrl = value => String(value).replace(/[)'"\\]/g, char => `\\${char}`);
  const refreshDesktopFolderIcons = () => window.IdealMachineRefreshCreativeFolderIcon?.();
  const readFile = file => window.IdealMachineReadImage ? window.IdealMachineReadImage(file, 900, .68) : new Promise(resolve => { if (!file) return resolve(''); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); });
  const readIconFile = file => new Promise(resolve => { if (!file) return resolve(''); const reader = new FileReader(); reader.onerror = () => resolve(''); reader.onload = () => resolve(String(reader.result || '')); reader.readAsDataURL(file); });
  const launcherSource = (choice = launcherIconDraft) => choice.custom || launcherPresets[choice.preset][choice.appearance];
  let dynamicManifestUrl = '';
  function applyLauncherManifest(choice, source) {
    const link = document.querySelector('#idealMachineManifest');
    if (!link || !source) return;
    const iconUrl = source.startsWith('data:') ? source : new URL(`${source}${source.includes('?') ? '&' : '?'}ideal-machine-icon=${choice.revision}`, document.baseURI).href;
    const manifest = { name:'理想机', short_name:'理想机', lang:'zh-CN', start_url:new URL('./', document.baseURI).href, scope:new URL('./', document.baseURI).href, display:'standalone', background_color:'#f4f4f2', theme_color:'#f4f4f2', description:'理想机：放下日常，也放下理想。', icons:[{ src:iconUrl, sizes:'512x512', type:'image/png', purpose:'any maskable' }] };
    const nextUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type:'application/manifest+json' }));
    const previousUrl = dynamicManifestUrl;
    dynamicManifestUrl = nextUrl;
    link.setAttribute('href', nextUrl);
    if (previousUrl) setTimeout(() => URL.revokeObjectURL(previousUrl), 60000);
  }
  function applyLauncherIcon(choice = normalizeLauncherIcon(saved.launcherIcon)) {
    const setIcon = source => {
      if (!source) return;
      const href = source.startsWith('data:') ? source : `${source}${source.includes('?') ? '&' : '?'}ideal-machine-icon=${choice.revision}`;
      document.querySelector('#idealMachineFavicon')?.setAttribute('href', href);
      document.querySelector('#idealMachineAppleTouchIcon')?.setAttribute('href', href);
      applyLauncherManifest(choice, source);
    };
    const source = launcherSource(choice);
    if (source.startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(source).then(setIcon); else setIcon(source);
  }
  if (window.IdealMachineCompactStoredValue) window.IdealMachineCompactStoredValue(saved).then(compacted => { saved = compacted || {}; try { localStorage.setItem(storageKey, JSON.stringify(saved)); applySettings(); } catch {} });
  async function migrateBeautyImages() { if (!window.IdealMachinePutImage) return; let changed = false; if (String(saved.wallpaper || '').startsWith('data:image/')) { saved.wallpaper = await window.IdealMachinePutImage(saved.wallpaper); changed = true; } for (const key of Object.keys(saved.icons || {})) if (String(saved.icons[key]).startsWith('data:image/')) { saved.icons[key] = await window.IdealMachinePutImage(saved.icons[key]); changed = true; } if (String(saved.launcherIcon?.custom || '').startsWith('data:image/')) { saved.launcherIcon = { ...normalizeLauncherIcon(saved.launcherIcon), custom: await window.IdealMachinePutImage(saved.launcherIcon.custom) }; changed = true; } if (changed) { try { localStorage.setItem(storageKey, JSON.stringify(saved)); applySettings(); } catch {} } }

  function renderLauncherIconControls() {
    const panel = launcherSetup.querySelector('#launcherSetupPanel');
    if (!panel) return;
    const choice = launcherIconDraft;
    panel.innerHTML = `<div class="beauty-launcher-grid">${Object.entries(launcherPresets).map(([id, preset]) => `<button class="beauty-launcher-choice ${!choice.custom && choice.preset === id ? 'is-selected' : ''}" type="button" data-launcher-setup-preset="${id}" aria-label="使用第 ${preset.name} 套图标"><img src="${preset[choice.appearance]}" alt="第 ${preset.name} 套图标"><b>ICON${preset.name}</b></button>`).join('')}<label class="beauty-launcher-upload ${choice.custom ? 'is-selected' : ''}"><span class="beauty-launcher-custom-preview">${choice.custom && !choice.custom.startsWith('idb:image:') ? `<img src="${esc(choice.custom)}" alt="自定义图标">` : '＋'}</span><b>自定义</b><input class="beauty-file" data-launcher-setup-file type="file" accept="image/png,image/jpeg,image/webp"></label></div><label class="beauty-launcher-mode"><span><b>图标版本</b><small>日间和夜间版本可分别选择。</small></span><select data-launcher-setup-appearance><option value="day" ${choice.appearance === 'day' ? 'selected' : ''}>日间</option><option value="night" ${choice.appearance === 'night' ? 'selected' : ''}>夜间</option></select></label><p class="beauty-launcher-note">选择后点击“添加到桌面”，再按照浏览器提示完成添加。</p>`;
    if (choice.custom?.startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(choice.custom).then(source => { const target = panel.querySelector('.beauty-launcher-custom-preview'); if (target && source) target.innerHTML = `<img src="${esc(source)}" alt="自定义图标">`; });
    const preview = launcherSetup.querySelector('#launcherSetupPreview');
    if (preview) {
      const source = launcherSource(choice);
      if (source.startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(source).then(value => { if (value) preview.src = value; });
      else preview.src = source;
    }
  }

  function openLauncherSetup() {
    launcherIconDraft = normalizeLauncherIcon(saved.launcherIcon);
    renderLauncherIconControls();
    launcherSetup.classList.add('is-open');
    launcherSetup.setAttribute('aria-hidden', 'false');
  }
  function closeLauncherSetup() {
    launcherSetup.classList.remove('is-open');
    launcherSetup.setAttribute('aria-hidden', 'true');
    sessionStorage.setItem('ideal-machine-launcher-setup-seen-v2', '1');
  }
  async function saveLauncherChoice() {
    const choice = { ...launcherIconDraft };
    if (String(choice.custom || '').startsWith('data:image/') && window.IdealMachinePutImage) choice.custom = await window.IdealMachinePutImage(choice.custom);
    choice.revision = Date.now();
    saved.launcherIcon = normalizeLauncherIcon(choice);
    launcherIconDraft = saved.launcherIcon;
    localStorage.setItem(storageKey, JSON.stringify(saved));
    applyLauncherIcon(saved.launcherIcon);
  }
  async function installToDesktop() {
    try {
      await saveLauncherChoice();
      closeLauncherSetup();
      window.alert('图标已准备好。请点击浏览器的分享按钮，再选择“添加到主屏幕”。');
    } catch { window.alert('图标保存失败，请稍后重试。'); }
  }

  function appRow(item) {
    const key = item.dataset.appKey;
    const name = saved.names?.[key] || nameElement(item).textContent;
    const icon = saved.icons?.[key] || '';
    const sourceIcon = iconElement(item);
    const previewMarkup = sourceIcon?.matches('.folder-app-icon') ? sourceIcon.outerHTML : sourceIcon?.innerHTML || '';
    return `<div class="beauty-app-row" data-beauty-app="${key}"><button class="beauty-app-preview" data-beauty-preview="${key}" data-beauty-pick="${key}" type="button" aria-label="更换${esc(name)}图标">${previewMarkup}<span class="beauty-app-pick-mark">＋</span></button><input class="beauty-input beauty-app-name" data-beauty-name="${key}" aria-label="${esc(name)}名称" value="${esc(name)}" maxlength="20"><input type="hidden" data-beauty-icon-url="${key}" value="${esc(icon.startsWith('data:') || icon.startsWith('idb:image:') ? '' : icon)}"><input class="beauty-file" data-beauty-file="${key}" type="file" accept="image/*"></div>`;
  }

  function renderRows() {
    document.querySelector('#beautyAppList').innerHTML = appItems.map(appRow).join('');
    appItems.forEach(item => {
      const key = item.dataset.appKey;
      if (saved.icons?.[key]) { const value = saved.icons[key]; if (String(value).startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(value).then(image => setPreview(document.querySelector(`[data-beauty-preview="${key}"]`), image)); else setPreview(document.querySelector(`[data-beauty-preview="${key}"]`), value); }
    });
    modal.querySelectorAll('[data-beauty-file]').forEach(input => input.addEventListener('change', async event => { if (!event.target.files[0]) return; modal.querySelector(`[data-beauty-icon-url="${event.target.dataset.beautyFile}"]`).value = ''; setPreview(document.querySelector(`[data-beauty-preview="${event.target.dataset.beautyFile}"]`), await readIconFile(event.target.files[0])); }));
    modal.querySelectorAll('[data-beauty-pick]').forEach(button => button.addEventListener('click', () => openIconPicker(button.dataset.beautyPick)));
  }

  let activeIconKey = '';
  function openIconPicker(key) {
    activeIconKey = key;
    iconPicker.querySelector('[data-beauty-picker-url-panel]').hidden = true;
    iconPicker.querySelector('[data-beauty-picker-url]').value = '';
    iconPicker.classList.add('is-open');
  }
  function closeIconPicker() { iconPicker.classList.remove('is-open'); activeIconKey = ''; }

  function setPreview(element, value) {
    if (!element || !value) return;
    element.classList.add('has-custom-image');
    element.style.backgroundImage = `url("${cssUrl(value)}")`;
    element.querySelector('svg')?.setAttribute('style', 'display:none');
  }

  function applySettings() {
    applyLauncherIcon();
    const applyWallpaper = value => { const wallpaperValue = value ? `url("${cssUrl(value)}")` : ''; document.body.style.backgroundImage = wallpaperValue; const preview = document.querySelector('#beautyWallpaperPreview'); if (preview) preview.style.backgroundImage = wallpaperValue; updateAutoContrast(); };
    if (String(saved.wallpaper || '').startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(saved.wallpaper).then(applyWallpaper); else applyWallpaper(saved.wallpaper || '');
    const desktop = document.querySelector('.desktop-scroll-wrap');
    if (desktop) desktop.style.backgroundImage = 'none';
    document.querySelectorAll('.bg-layer').forEach(layer => { layer.style.backgroundImage = 'none'; });
    appItems.forEach(item => {
      const key = item.dataset.appKey;
      if (saved.names?.[key]) nameElement(item).textContent = saved.names[key];
      else nameElement(item).textContent = defaultApps.get(key).name;
      if (saved.icons?.[key]) {
        const icon = iconElement(item);
        icon.classList.add('has-custom-image');
        const applyIcon = value => { if (value) { icon.style.backgroundImage = `url("${cssUrl(value)}")`; refreshDesktopFolderIcons(); } };
        if (String(saved.icons[key]).startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(saved.icons[key]).then(applyIcon); else applyIcon(saved.icons[key]);
      } else {
        const icon = iconElement(item);
        icon.classList.remove('has-custom-image');
        icon.style.backgroundImage = '';
        icon.innerHTML = defaultApps.get(key).icon;
      }
    });
    refreshDesktopFolderIcons();
    setTimeout(updateAutoContrast, 80);
  }

  function updateAutoContrast() {
    const folderAppItems = [...document.querySelectorAll('.folder-app-item')];
    const targets = [...appItems, ...folderItems, ...document.querySelectorAll('.profile-card, .todo-widget, .countdown-widget, .shared-widget, .elapsed-days-widget, .chat-widget, .now-playing-widget, .mood-profile-widget, .time-photo-widget, .habit-mini-widget, .search-input, .date-calendar-card, .dock-bar, .page-indicator, .desktop-layout-toolbar > button')].filter(target => !target.matches('.folder-app-item'));
    // 文件夹里的 App 始终使用黑色，不参与桌面壁纸的自动对比度判断。
    folderAppItems.forEach(target => {
      target.classList.remove('auto-light', 'auto-dark');
      target.querySelector('.folder-app-name')?.classList.remove('auto-light', 'auto-dark');
      target.querySelector('.folder-app-icon')?.classList.remove('auto-light', 'auto-dark');
    });
    if (!saved.wallpaper) { targets.forEach(target => target.classList.remove('auto-light', 'auto-dark')); return; }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const scale = Math.max(viewportWidth / image.naturalWidth, viewportHeight / image.naturalHeight);
      const renderedWidth = image.naturalWidth * scale;
      const renderedHeight = image.naturalHeight * scale;
      const offsetX = (viewportWidth - renderedWidth) / 2;
      const offsetY = (viewportHeight - renderedHeight) / 2;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        const viewportX = Math.max(0, Math.min(viewportWidth - 1, rect.left + rect.width / 2));
        const viewportY = Math.max(0, Math.min(viewportHeight - 1, rect.top + rect.height / 2));
        const pixelX = Math.max(0, Math.min(image.naturalWidth - 1, Math.round((viewportX - offsetX) / scale)));
        const pixelY = Math.max(0, Math.min(image.naturalHeight - 1, Math.round((viewportY - offsetY) / scale)));
        const pixel = context.getImageData(pixelX, pixelY, 1, 1).data;
        const luminance = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
        target.classList.toggle('auto-light', luminance < 145);
        target.classList.toggle('auto-dark', luminance >= 145);
      });
    };
    const source = saved.wallpaper;
    if (String(source).startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(source).then(value => { if (value) image.src = value; }); else image.src = source;
  }

  appRoot.meihua.updateAutoContrast = updateAutoContrast;
  window.addEventListener('ideal-machine-folder-open', updateAutoContrast);

  function open() {
    closeIconPicker();
    document.querySelector('#beautyWallpaperUrl').value = saved.wallpaper?.startsWith('data:') ? '' : (saved.wallpaper || '');
    if (String(saved.wallpaper || '').startsWith('idb:image:') && window.IdealMachineGetImage) window.IdealMachineGetImage(saved.wallpaper).then(value => previewWallpaper(value)); else previewWallpaper(saved.wallpaper || '');
    renderRows();
    modal.classList.add('is-open');
  }

  function previewWallpaper(value) {
    const background = value ? `url("${cssUrl(value)}")` : '';
    document.body.style.backgroundImage = background;
    const preview = document.querySelector('#beautyWallpaperPreview');
    if (preview) preview.style.backgroundImage = background;
  }

  async function save() {
    const wallpaperFile = document.querySelector('#beautyWallpaperFile').files[0];
    const wallpaperUrl = document.querySelector('#beautyWallpaperUrl').value.trim();
    if (wallpaperFile) { const uploadedWallpaper = await readFile(wallpaperFile); saved.wallpaper = window.IdealMachinePutImage ? await window.IdealMachinePutImage(uploadedWallpaper) : uploadedWallpaper; }
    else if (wallpaperUrl) { saved.wallpaper = wallpaperUrl; window.IdealMachineAlbum?.archiveUrl?.(wallpaperUrl, '美化壁纸'); }
    saved.names = saved.names || {};
    saved.icons = saved.icons || {};
    for (const item of appItems) {
      const key = item.dataset.appKey;
      saved.names[key] = document.querySelector(`[data-beauty-name="${key}"]`).value.trim() || nameElement(item).textContent;
      const file = document.querySelector(`[data-beauty-file="${key}"]`).files[0];
      const url = document.querySelector(`[data-beauty-icon-url="${key}"]`).value.trim();
      const uploaded = await readIconFile(file);
      if (uploaded) saved.icons[key] = window.IdealMachinePutImage ? await window.IdealMachinePutImage(uploaded) : uploaded;
      else if (url) { saved.icons[key] = url; window.IdealMachineAlbum?.archiveUrl?.(url, '美化图标'); }
    }
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { try { const compacted = window.IdealMachineCompactStoredValue ? await window.IdealMachineCompactStoredValue(saved) : saved; saved = compacted || saved; localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { window.alert('图片保存失败：Safari 的本地存储空间不足，请先删除旧壁纸或旧图标后重试。'); return; } }
    applySettings();
    close();
  }

  function close() { closeIconPicker(); applySettings(); modal.classList.remove('is-open'); }
  function restoreDefaults() {
    delete saved.names;
    delete saved.icons;
    localStorage.setItem(storageKey, JSON.stringify(saved));
    applySettings();
    open();
  }
  function closeRestoreConfirm() { modal.querySelector('.beauty-confirm-backdrop')?.remove(); modal.querySelector('.beauty-confirm-card')?.remove(); }
  function showRestoreConfirm() {
    closeRestoreConfirm();
    modal.querySelector('.beauty-sheet').insertAdjacentHTML('beforeend', '<div class="beauty-confirm-backdrop" data-beauty-confirm-cancel></div><section class="beauty-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="beautyConfirmTitle"><h3 id="beautyConfirmTitle">恢复默认图标与名称？</h3><p>所有可自定义 App 的图标和名称都会恢复为默认形式。</p><div><button class="beauty-btn beauty-confirm-cancel" type="button" data-beauty-confirm-cancel>取消</button><button class="beauty-btn beauty-confirm-ok" type="button" data-beauty-confirm-ok>确定恢复</button></div></section>');
  }
  function exportBeauty() {
    const payload = { format: 'ideal-machine-beauty', version: 2, exportedAt: new Date().toISOString(), wallpaper: saved.wallpaper || '', names: saved.names || {}, icons: saved.icons || {}, launcherIcon: saved.launcherIcon || null };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'desktop-beauty.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function importBeauty(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload || typeof payload !== 'object' || (payload.format && payload.format !== 'ideal-machine-beauty')) throw new Error('invalid');
        if (typeof payload.wallpaper === 'string') saved.wallpaper = payload.wallpaper;
        if (payload.names && typeof payload.names === 'object') saved.names = payload.names;
        if (payload.icons && typeof payload.icons === 'object') saved.icons = payload.icons;
        if (payload.launcherIcon && typeof payload.launcherIcon === 'object') saved.launcherIcon = normalizeLauncherIcon(payload.launcherIcon);
        localStorage.setItem(storageKey, JSON.stringify(saved));
        applySettings();
        open();
      } catch { window.alert('无法读取这个桌面美化 JSON 文件'); }
    };
    reader.readAsText(file);
  }
  modal.addEventListener('click', event => { if (event.target.closest('[data-beauty-confirm-cancel]')) { closeRestoreConfirm(); return; } if (event.target.closest('[data-beauty-confirm-ok]')) { closeRestoreConfirm(); restoreDefaults(); return; } if (event.target.closest('[data-beauty-close]')) close(); });
  launcherSetup.addEventListener('click', event => {
    if (event.target.closest('[data-launcher-setup-close]')) { closeLauncherSetup(); return; }
    const preset = event.target.closest('[data-launcher-setup-preset]');
    if (!preset) return;
    launcherIconDraft.preset = preset.dataset.launcherSetupPreset;
    launcherIconDraft.custom = '';
    renderLauncherIconControls();
    applyLauncherIcon(launcherIconDraft);
  });
  launcherSetup.addEventListener('change', async event => {
    const appearance = event.target.closest('[data-launcher-setup-appearance]');
    if (appearance) {
      launcherIconDraft.appearance = appearance.value;
      renderLauncherIconControls();
      applyLauncherIcon(launcherIconDraft);
      return;
    }
    const file = event.target.closest('[data-launcher-setup-file]');
    if (!file?.files?.[0]) return;
    launcherIconDraft.custom = await readIconFile(file.files[0]);
    renderLauncherIconControls();
    applyLauncherIcon(launcherIconDraft);
  });
  launcherSetup.querySelector('[data-launcher-setup-install]')?.addEventListener('click', installToDesktop);
  iconPicker.addEventListener('click', event => {
    if (event.target.closest('[data-beauty-picker-close]')) { closeIconPicker(); return; }
    if (event.target.closest('[data-beauty-picker-local]')) {
      const key = activeIconKey;
      closeIconPicker();
      if (key) modal.querySelector(`[data-beauty-file="${key}"]`)?.click();
      return;
    }
    if (event.target.closest('[data-beauty-picker-url-open]')) {
      const panel = iconPicker.querySelector('[data-beauty-picker-url-panel]');
      panel.hidden = false;
      panel.querySelector('input')?.focus();
      return;
    }
    if (event.target.closest('[data-beauty-picker-url-save]')) {
      const url = iconPicker.querySelector('[data-beauty-picker-url]').value.trim();
      if (!url || !activeIconKey) return;
      const file = modal.querySelector(`[data-beauty-file="${activeIconKey}"]`);
      const hiddenUrl = modal.querySelector(`[data-beauty-icon-url="${activeIconKey}"]`);
      if (file) file.value = '';
      if (hiddenUrl) hiddenUrl.value = url;
      setPreview(document.querySelector(`[data-beauty-preview="${activeIconKey}"]`), url);
      closeIconPicker();
    }
  });
  deleteWallpaperButton.addEventListener('click', () => { delete saved.wallpaper; localStorage.setItem(storageKey, JSON.stringify(saved)); applySettings(); open(); });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-app="meihua"]')) open();
  });
  document.querySelector('#beautySave').addEventListener('click', save);
  document.querySelector('#beautyReset').addEventListener('click', showRestoreConfirm);
  document.querySelector('#beautyExport').addEventListener('click', exportBeauty);
  document.querySelector('#beautyImportFile').addEventListener('change', event => importBeauty(event.target.files[0]));
  document.querySelector('#beautyWallpaperUrl').addEventListener('input', event => previewWallpaper(event.target.value.trim()));
  document.querySelector('#beautyWallpaperFile').addEventListener('change', async event => { const value = await readFile(event.target.files[0]); if (value) previewWallpaper(value); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  applySettings();
  migrateBeautyImages();
  setTimeout(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!standalone && !sessionStorage.getItem('ideal-machine-launcher-setup-seen-v2')) {
      openLauncherSetup();
    }
  }, 260);
  window.addEventListener('resize', updateAutoContrast);
})();
