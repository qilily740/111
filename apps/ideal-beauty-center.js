(() => {
  const api = window.IdealMachineBeauty;
  if (!api) return;

  const root = document.createElement('section');
  root.className = 'ideal-beauty-center';
  root.setAttribute('aria-label', '理想机美化中心');
  root.innerHTML = '<div class="ideal-beauty-page"><header class="ideal-beauty-head"><div><span class="ideal-beauty-kicker">IDEAL MACHINE</span><h1 class="ideal-beauty-title" data-view-title>Ideal-美化</h1></div><div class="ideal-beauty-head-actions"><button class="ideal-beauty-icon-button" data-close-center type="button" aria-label="关闭">×</button></div></header><nav class="ideal-beauty-app-tabs" data-category-tabs aria-label="美化分类"></nav><main class="ideal-beauty-content" data-content></main><button class="ideal-beauty-fab" data-toggle-account type="button" aria-label="切换到 Ideal-账号" title="Ideal-账号"></button></div>';
  document.body.appendChild(root);

  const categories = [
    { id:'chat', name:'聊天' },
    { id:'online', name:'线上' },
    { id:'offline', name:'线下' },
    { id:'forum', name:'论坛' },
    { id:'mine', name:'我的' }
  ];
  let category = 'chat';
  let screen = 'categories';
  let view = 'beauty';
  let selectedAssetId = '';
  let activeDialog = false;
  let editedPreviewImage = '';
  let editedPreviewDirty = false;
  let remoteStatus = '';
  let importedAssetsForPreview = [];
  const $ = selector => root.querySelector(selector);
  const esc = api.escapeHtml;

  function categoryForTarget(target) {
    if (!target) return 'mine';
    if (target.appId === 'luntan') return 'forum';
    if (target.appId === 'liaotian') {
      if (target.sectionId === 'offline') return 'offline';
      if (String(target.sectionId).startsWith('online:')) return 'online';
      return 'chat';
    }
    return 'chat';
  }

  function categoryForAsset(item) {
    return categoryForTarget(api.find(item.appId, item.sectionId));
  }

  function isImportedAsset(item) {
    return item?.source === 'imported-code' || item?.source === 'json' || Boolean(item?.imported);
  }

  function categoryName(id) {
    return categories.find(item => item.id === id)?.name || '我的';
  }

  function targetName(item) {
    const target = api.find(item.appId, item.sectionId);
    if (!target) return categoryName(categoryForAsset(item));
    if (categoryForTarget(target) === 'online') return target.name || '线上角色';
    if (categoryForTarget(target) === 'offline') return '线下';
    if (categoryForTarget(target) === 'forum') return target.name || '论坛';
    return target.name && target.name !== '聊天' ? target.name : '聊天';
  }

  function filteredAssets() {
    const items = api.library.list();
    return category === 'mine' ? items : items.filter(item => categoryForAsset(item) === category);
  }

  function toast(message) {
    root.querySelector('.ideal-beauty-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'ideal-beauty-toast';
    node.setAttribute('role', 'status');
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => node.remove(), 2600);
  }

  function openDialog(markup) {
    root.querySelector('.ideal-beauty-dialog-backdrop')?.remove();
    activeDialog = true;
    $('[data-toggle-account]')?.classList.add('ideal-beauty-hidden');
    root.insertAdjacentHTML('beforeend', `<div class="ideal-beauty-dialog-backdrop" data-dialog-backdrop><section class="ideal-beauty-dialog" role="dialog" aria-modal="true">${markup}</section></div>`);
  }

  function closeDialog() {
    root.querySelector('.ideal-beauty-dialog-backdrop')?.remove();
    activeDialog = false;
    $('[data-toggle-account]')?.classList.remove('ideal-beauty-hidden');
  }

  function setEditedPreview(source, label = '已选择图片') {
    const value = String(source || '').trim();
    const preview = root.querySelector('[data-edit-preview-output]');
    const status = root.querySelector('[data-edit-preview-name]');
    if (!preview) return;
    editedPreviewImage = value;
    editedPreviewDirty = true;
    if (value) {
      preview.src = value;
      preview.classList.remove('ideal-beauty-hidden');
    } else {
      preview.removeAttribute('src');
      preview.classList.add('ideal-beauty-hidden');
    }
    if (status) status.textContent = label;
  }

  function syncAssetInfoHeight() {
    const preview = root.querySelector('.ideal-beauty-asset-preview');
    const info = root.querySelector('.ideal-beauty-asset-info');
    if (!preview || !info) return;
    const height = Math.round(preview.getBoundingClientRect().height);
    if (height > 0) {
      info.style.height = `${height}px`;
      info.style.maxHeight = `${height}px`;
    }
  }
  function toggleIcon() {
    return view === 'beauty'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.2 20c.5-3.4 2.8-5.2 6.8-5.2s6.3 1.8 6.8 5.2"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v3M12 17.5v3M3.5 12h3m11 0h3M6.1 6.1l2.1 2.1m7.6 7.6 2.1 2.1m0-11.8-2.1 2.1m-7.6 7.6-2.1 2.1"/><path d="m15.5 3 .55 1.7a1.2 1.2 0 0 0 .75.75l1.7.55-1.7.55a1.2 1.2 0 0 0-.75.75l-.55 1.7-.55-1.7a1.2 1.2 0 0 0-.75-.75L12.5 6.3l1.7-.55a1.2 1.2 0 0 0 .75-.75z"/></svg>';
  }

  function renderTabs() {
    const items = api.library.list();
    const counts = Object.fromEntries(categories.map(item => [item.id, item.id === 'mine' ? items.length : items.filter(asset => categoryForAsset(asset) === item.id).length]));
    $('[data-category-tabs]').innerHTML = categories.map(item => `<button class="ideal-beauty-chip ${item.id === category ? 'is-active' : ''}" data-select-category="${item.id}" type="button">${item.name}<small>${counts[item.id]}</small></button>`).join('');
  }

  function previewMarkup(item, large = false) {
    return item.previewImage
      ? `<img class="ideal-beauty-code-image${large ? ' is-large' : ''}" src="${esc(item.previewImage)}" alt="${esc(item.name)}效果图">`
      : `<span class="ideal-beauty-code-placeholder${large ? ' is-large' : ''}" aria-label="暂无效果图"><i>✦</i><small>暂无效果图</small></span>`;
  }

  function renderCard(item) {
    return `<article class="ideal-beauty-code-card" data-open-asset="${esc(item.id)}" tabindex="0" role="button"><div class="ideal-beauty-code-thumb">${previewMarkup(item)}</div><div class="ideal-beauty-code-copy"><b>${esc(item.name || '未命名美化')}</b><span>${esc(item.code || '未关联美化码')}</span></div></article>`;
  }

  function renderCategory() {
    const items = filteredAssets();
    const title = categoryName(category);
    const intro = category === 'mine' ? '你导入和保存的全部美化。' : `${title}分类下的美化效果。`;
    $('[data-content]').innerHTML = `<div class="ideal-beauty-category-head"><div><h2 class="ideal-beauty-section-title">${title}</h2><p class="ideal-beauty-section-note">${intro}</p></div><button class="ideal-beauty-action is-primary" data-import-code type="button">导入美化</button></div>${remoteStatus ? `<p class="ideal-beauty-caption">${esc(remoteStatus)}</p>` : ''}${items.length ? `<div class="ideal-beauty-code-grid">${items.map(renderCard).join('')}</div>` : `<div class="ideal-beauty-code-empty"><div>✦</div><b>这里还没有美化效果</b><span>导入美化后，效果图会显示在这里。</span><button class="ideal-beauty-action is-primary" data-import-code type="button">导入美化</button></div>`}`;
  }

  function selectedAsset() {
    return api.library.list().find(item => item.id === selectedAssetId) || null;
  }

  function renderAsset() {
    const item = selectedAsset();
    if (!item) { screen = 'categories'; return renderCategory(); }
    const imported = isImportedAsset(item);
    const source = item.source === 'imported-code' ? '导入美化码' : item.source === 'json' ? '导入 JSON' : item.source === 'generated' ? '线上美化码' : '本地美化';
    const category = categoryName(categoryForAsset(item));
    const target = targetName(item);
    const targetMarkup = target && target !== category && target !== item.name ? `<p>${esc(target)}</p>` : '';
    $('[data-content]').innerHTML = `<div class="ideal-beauty-asset-detail"><div class="ideal-beauty-asset-preview">${previewMarkup(item, true)}</div><div class="ideal-beauty-asset-info"><div class="ideal-beauty-asset-title"><span class="ideal-beauty-asset-category">${esc(category)}</span><h2>${esc(item.name || '未命名美化')}</h2>${targetMarkup}</div><div class="ideal-beauty-asset-meta"><div class="ideal-beauty-inline"><b>来源</b><span>${source}</span></div>${item.author ? `<div class="ideal-beauty-inline"><b>作者</b><span>${esc(item.author)}</span></div>` : ''}${item.code ? `<div class="ideal-beauty-inline"><b>美化码</b><span>${esc(item.code)}</span></div>` : ''}</div></div><div class="ideal-beauty-actions"><button class="ideal-beauty-action is-primary" data-use-asset type="button">应用</button>${item.code && !imported ? '<button class="ideal-beauty-action" data-copy-code type="button">复制美化码</button>' : ''}<button class="ideal-beauty-action" data-edit-css type="button">编辑美化</button><button class="ideal-beauty-action" data-edit-asset type="button">编辑效果图</button><button class="ideal-beauty-action is-danger" data-delete-asset type="button">删除</button></div></div>`;
  }

  function renderAccount() {
    const user = window.IdealMachineAuth?.getUser?.();
    if (!user) {
      $('[data-content]').innerHTML = '<div class="ideal-beauty-account-page ideal-beauty-profile"><div class="ideal-beauty-inline"><b>登录状态</b><span>未登录</span></div><p class="ideal-beauty-caption">登录后可以同步和管理你的账号。</p><button class="ideal-beauty-action is-primary ideal-beauty-account-action" data-login type="button">登录或注册</button></div>';
      return;
    }
    const username = String(user.username || user.name || user.email || '已登录');
    const status = user.discordUserId ? 'Discord 已关联' : user.discordVerifiedAt ? 'Discord 已验证' : '账号已登录';
    $('[data-content]').innerHTML = `<div class="ideal-beauty-account-page ideal-beauty-profile"><div class="ideal-beauty-inline"><b>账号</b><span>${esc(username)}</span></div><div class="ideal-beauty-inline"><b>状态</b><span>${esc(status)}</span></div><button class="ideal-beauty-action is-danger ideal-beauty-account-action" data-logout type="button">退出账号</button></div>`;
  }

  function render() {
    try {
      $('[data-view-title]').textContent = view === 'beauty' ? 'Ideal-美化' : 'Ideal-账号';
      $('[data-category-tabs]').classList.toggle('ideal-beauty-hidden', view !== 'beauty');
      $('.ideal-beauty-page').classList.toggle('is-asset-view', view === 'beauty' && screen === 'asset');
      const toggle = $('[data-toggle-account]');
      toggle.innerHTML = toggleIcon();
      toggle.setAttribute('aria-label', view === 'beauty' ? '切换到 Ideal-账号' : '切换到 Ideal-美化');
      toggle.title = view === 'beauty' ? 'Ideal-账号' : 'Ideal-美化';
      if (view === 'beauty') renderTabs();
      $('[data-close-center]').textContent = screen === 'asset' ? '‹' : '×';
      if (view === 'account') renderAccount(); else if (screen === 'asset') renderAsset(); else renderCategory();
      if (view === 'beauty' && screen === 'asset') requestAnimationFrame(syncAssetInfoHeight);
    } catch (error) {
      console.error('[IdealMachineBeauty] render failed', error);
      $('[data-content]').textContent = `美化暂时无法显示：${String(error?.message || '未知错误')}`;
    }
  }

  async function refreshRemoteLibrary() {
    if (!window.IdealMachineAuth?.isAuthenticated?.()) return;
    try {
      const payload = await api.api('/api/beauty/codes');
      const local = api.library.list();
      (Array.isArray(payload.items) ? payload.items : []).filter(item => item?.code).forEach(item => {
        if (!local.some(saved => saved.code === item.code)) api.library.add({ ...item, css:item.css || '', source:'generated' });
      });
      remoteStatus = '';
    } catch (error) {
      remoteStatus = `云端美化暂时无法同步：${error.message}`;
    }
    if (root.classList.contains('is-open')) render();
  }

  function showImportDialog() {
    openDialog('<h2>导入美化</h2><p>可以同时导入美化码和 JSON 文件，支持一次导入多个。</p><label class="ideal-beauty-field">美化码（每行一个）<textarea data-import-codes rows="4" spellcheck="false" placeholder="ideal-CHA-123456"></textarea></label><label class="ideal-beauty-field">JSON 文件（可多选）<span class="ideal-beauty-file-picker"><strong>&#x5bfc;&#x5165; JSON &#x6587;&#x4ef6;</strong><small data-import-json-name>&#x5c1a;&#x672a;&#x9009;&#x62e9;&#x6587;&#x4ef6;</small><input data-import-json-files type="file" accept="application/json,.json" multiple></span></label><p class="ideal-beauty-import-note">导入完成后，再为每个美化上传最终效果图；效果图只保存在 Ideal，不会同步到相册 App。</p><div class="ideal-beauty-dialog-actions"><button class="ideal-beauty-action" data-dialog-cancel type="button">取消</button><button class="ideal-beauty-action is-primary" data-confirm-import type="button">开始导入</button></div>');
  }

  function showPostImportPreviewDialog(items) {
    const names = items.map(item => `<li>${esc(item.name || '未命名美化')}${item.code ? ` <small>${esc(item.code)}</small>` : ''}</li>`).join('');
    openDialog(`<h2>上传最终效果图</h2><p>已导入 ${items.length} 个美化。可多选图片，按下面列表顺序匹配。</p><ul class="ideal-beauty-import-items">${names}</ul><label class="ideal-beauty-field">最终效果图（可多选）<span class="ideal-beauty-file-picker"><strong>&#x9009;&#x62e9;&#x6548;&#x679c;&#x56fe;</strong><small data-post-preview-name>&#x5c1a;&#x672a;&#x9009;&#x62e9;&#x6587;&#x4ef6;</small><input data-post-import-previews type="file" accept="image/png,image/jpeg,image/webp" multiple></span></label><p class="ideal-beauty-import-note">效果图只保存在 Ideal 的美化记录中，不会同步到相册 App。</p><div class="ideal-beauty-dialog-actions"><button class="ideal-beauty-action" data-dialog-cancel type="button">稍后上传</button><button class="ideal-beauty-action is-primary" data-save-post-previews type="button">保存效果图</button></div>`);
  }

  async function savePostImportPreviews(items, button) {
    const files = [...(root.querySelector('[data-post-import-previews]')?.files || [])];
    if (!files.length) return toast('请先选择最终效果图');
    button.disabled = true;
    button.textContent = '保存中…';
    let savedCount = 0;
    try {
      for (const [index, file] of files.slice(0, items.length).entries()) {
        const previewImage = await api.safeImage(file);
        api.library.update(items[index].id, { previewImage });
        savedCount++;
      }
      closeDialog();
      render();
      toast(`已保存 ${savedCount} 张最终效果图`);
    } catch (error) {
      toast(error.message || '效果图保存失败');
    } finally {
      button.disabled = false;
      button.textContent = '保存效果图';
    }
  }

  function parseJsonEntries(raw, fileName) {
    let payload;
    try { payload = JSON.parse(String(raw || '')); } catch { throw new Error(`${fileName} 不是有效的 JSON 文件。`); }
    const entries = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [payload];
    return entries.filter(Boolean).map(entry => {
      if (typeof entry.css !== 'string' || typeof entry.appId !== 'string' || typeof entry.sectionId !== 'string') throw new Error(`${fileName} 缺少有效的美化内容。`);
      const target = api.find(entry.appId, entry.sectionId);
      if (!target) throw new Error(`${fileName} 对应的分类当前不可用。`);
      return { ...entry, target };
    });
  }

  function announceImportedAsset(asset) {
    window.dispatchEvent(new CustomEvent('ideal-machine-beauty-imported', { detail: { appId:asset.appId, sectionId:asset.sectionId, name:asset.name || '导入的美化', author:asset.author || '', css:String(asset.css || ''), code:asset.code || '', previewImage:asset.previewImage || '' } }));
  }

  async function importBatch(codes, jsonFiles, button) {
    const codeList = String(codes || '').split(/[\n,，]+/).map(value => value.trim().toUpperCase()).filter(Boolean);
    if (!codeList.length && !jsonFiles.length) return toast('请填写美化码或选择 JSON 文件');
    button.disabled = true;
    button.textContent = '导入中…';
    let imported = 0;
    const importedAssets = [];
    const errors = [];
    try {
      for (const code of codeList) {
        try {
          const result = await api.api(`/api/beauty/codes/${encodeURIComponent(code)}`);
          const item = result.item || result;
          const target = api.find(item.appId, item.sectionId);
          if (typeof item.css !== 'string' || !target) throw new Error('美化码对应的分类当前不可用。');
          const asset = api.library.add({ name:item.name || '未命名美化', author:item.author || '', appId:item.appId, sectionId:item.sectionId, css:item.css, code:item.code || code, previewImage:item.previewImage || '', source:'imported-code' });
          api.applyBeauty(item); announceImportedAsset(asset); selectedAssetId = asset.id; importedAssets.push(asset); imported++;
        } catch (error) { errors.push(`${code}：${error.message || '导入失败'}`); }
      }
      for (const file of jsonFiles) {
        try {
          const entries = parseJsonEntries(await file.text(), file.name);
          for (const entry of entries) {
            const asset = api.library.add({ name:entry.name || '未命名美化', author:entry.author || '', appId:entry.appId, sectionId:entry.sectionId, css:entry.css, code:entry.code || '', previewImage:entry.previewImage || '', source:'json' });
            api.applyBeauty(entry); announceImportedAsset(asset); selectedAssetId = asset.id; importedAssets.push(asset); imported++;
          }
        } catch (error) { errors.push(error.message || `${file.name} 导入失败`); }
      }
      category = 'mine'; screen = 'categories'; closeDialog(); render();
      importedAssetsForPreview = importedAssets;
      if (importedAssets.length) showPostImportPreviewDialog(importedAssets);
      if (imported) toast(`已导入 ${imported} 个美化${errors.length ? `，${errors.length} 个失败` : ''}`);
      else toast(errors[0] || '没有成功导入美化');
    } finally {
      button.disabled = false;
      button.textContent = '开始导入';
    }
  }

  function open(nextView = 'beauty') {
    root.classList.add('is-open');
    view = nextView === 'account' ? 'account' : 'beauty';
    screen = 'categories';
    render();
    refreshRemoteLibrary();
  }

  function close() {
    root.classList.remove('is-open');
    closeDialog();
  }

  root.addEventListener('click', async event => {
    const button = event.target.closest('button');
    const card = event.target.closest('[data-open-asset]');
    if (card && !button) { selectedAssetId = card.dataset.openAsset; screen = 'asset'; render(); return; }
    if (!button) return;
    if (button.matches('[data-toggle-account]')) { if (activeDialog) return; view = view === 'beauty' ? 'account' : 'beauty'; screen = 'categories'; render(); return; }
    if (button.matches('[data-close-center]')) { if (view === 'beauty' && screen === 'asset') { screen = 'categories'; render(); } else close(); return; }
    if (button.matches('[data-select-category]')) { category = button.dataset.selectCategory; screen = 'categories'; render(); return; }
    if (button.matches('[data-import-code]')) { showImportDialog(); return; }
    if (button.matches('[data-confirm-import]')) { const codes = root.querySelector('[data-import-codes]')?.value || ''; const jsonFiles = [...(root.querySelector('[data-import-json-files]')?.files || [])]; await importBatch(codes, jsonFiles, button); return; }
    if (button.matches('[data-save-post-previews]')) { await savePostImportPreviews(importedAssetsForPreview, button); return; }
    if (button.matches('[data-use-asset]')) { const item = selectedAsset(); if (!item) return; try { api.applyBeauty(item); toast('美化已应用'); } catch (error) { toast(error.message); } return; }
    if (button.matches('[data-copy-code]')) { const item = selectedAsset(); if (!item?.code) return; try { await navigator.clipboard.writeText(item.code); toast('美化码已复制'); } catch { window.prompt('复制美化码', item.code); } return; }
    if (button.matches('[data-edit-css]')) {
      const item = selectedAsset(); if (!item) return;
      openDialog(`<h2>编辑美化</h2><p class="ideal-beauty-import-note">只修改本机副本，不会改变作者的原始美化码。修改后的导入副本仍不能再次导出或分享。</p><label class="ideal-beauty-field">名称<input data-edit-css-name maxlength="60" value="${esc(item.name || '')}"></label><label class="ideal-beauty-field">CSS 美化代码<textarea data-edit-css-input rows="12" spellcheck="false">${esc(item.css || '')}</textarea></label><div class="ideal-beauty-dialog-actions"><button class="ideal-beauty-action" data-dialog-cancel type="button">取消</button><button class="ideal-beauty-action is-primary" data-save-css type="button">保存并应用</button></div>`);
      return;
    }
    if (button.matches('[data-save-css]')) {
      const item = selectedAsset(); if (!item) return;
      const css = root.querySelector('[data-edit-css-input]')?.value || '';
      if (!css.trim()) return toast('CSS 不能为空');
      const updated = api.library.update(item.id, { name:root.querySelector('[data-edit-css-name]')?.value.trim() || item.name, css });
      try { api.applyBeauty(updated); } catch (error) { return toast(error.message || '美化应用失败'); }
      if (isImportedAsset(updated)) announceImportedAsset(updated);
      closeDialog(); render(); toast('美化已修改并应用');
      return;
    }
    if (button.matches('[data-edit-asset]')) {
      const item = selectedAsset(); if (!item) return;
      editedPreviewImage = item.previewImage || ''; editedPreviewDirty = false;
      openDialog(`<h2>编辑效果图</h2><label class="ideal-beauty-field">名称<input data-edit-name maxlength="60" value="${esc(item.name || '')}"></label><div class="ideal-beauty-field"><span>替换最终效果图</span><div class="ideal-beauty-preview-sources"><button class="ideal-beauty-file-picker" data-edit-preview-album type="button"><strong>相册选择</strong><small data-edit-preview-name>${item.previewImage ? '当前效果图' : '选择图片'}</small></button><label class="ideal-beauty-file-picker"><strong>本地选择</strong><small>PNG、JPG、WEBP</small><input data-edit-preview-file type="file" accept="image/png,image/jpeg,image/webp"></label><button class="ideal-beauty-preview-reset" data-edit-preview-reset type="button">恢复默认</button></div><div class="ideal-beauty-preview-url"><input data-edit-preview-url type="url" placeholder="粘贴图片 URL"><button class="ideal-beauty-action" data-edit-preview-url-apply type="button">使用 URL</button></div></div>${item.previewImage ? `<img class="ideal-beauty-dialog-image" data-edit-preview-output src="${esc(item.previewImage)}" alt="效果图预览">` : '<img class="ideal-beauty-dialog-image ideal-beauty-hidden" data-edit-preview-output alt="效果图预览">'}<div class="ideal-beauty-dialog-actions"><button class="ideal-beauty-action" data-dialog-cancel type="button">取消</button><button class="ideal-beauty-action is-primary" data-save-asset type="button">保存</button></div>`);
      return;
    }
    if (button.matches('[data-edit-preview-album]')) {
      if (!window.IdealMachineAlbum?.pick) return toast('相册 App 还没有准备好，请先打开相册导入图片。');
      window.IdealMachineAlbum.pick(value => {
        const source = typeof value === 'string' ? value : value?.url || value?.source || value?.src || '';
        if (!source) return;
        const resolved = source.startsWith('idb:image:') && window.IdealMachineGetImage ? window.IdealMachineGetImage(source) : Promise.resolve(source);
        Promise.resolve(resolved).then(image => { if (image) setEditedPreview(image, '已从相册选择'); }).catch(() => toast('相册图片读取失败'));
      });
      return;
    }
    if (button.matches('[data-edit-preview-url-apply]')) {
      const value = root.querySelector('[data-edit-preview-url]')?.value.trim() || '';
      if (!value) return toast('请先输入图片 URL');
      if (!/^(?:https?:\/\/|data:image\/)/i.test(value)) return toast('请输入有效的图片 URL');
      setEditedPreview(value, '已使用图片 URL');
      return;
    }
    if (button.matches('[data-edit-preview-reset]')) {
      setEditedPreview('', '已恢复默认效果图');
      return;
    }
    if (button.matches('[data-save-asset]')) {
      const item = selectedAsset(); if (!item) return;
      const patch = { name:root.querySelector('[data-edit-name]')?.value.trim() || item.name };
      if (editedPreviewDirty) patch.previewImage = editedPreviewImage;
      api.library.update(item.id, patch); closeDialog(); render(); toast('效果图已更新'); return;
    }
    if (button.matches('[data-delete-asset]')) {
      const item = selectedAsset(); if (!item || !window.confirm(`删除“${item.name}”？如果当前登录账户是美化码原作者，将同时删除云端码；否则只删除本地副本。`)) return;
      button.disabled = true;
      try {
        const authenticated = Boolean(window.IdealMachineAuth?.isAuthenticated?.());
        let removedRemote = false;
        if (item.code && authenticated) {
          try {
            await api.api(`/api/beauty/codes/${encodeURIComponent(item.code)}`, { method:'DELETE' });
            removedRemote = true;
          } catch (error) {
            if (error.message !== 'NOT_FOUND' && error.message !== 'CODE_NOT_FOUND') throw error;
          }
        } else if (item.code && item.source === 'generated') {
          throw new Error('请先登录原作者账号，再删除云端美化码。');
        }
        api.library.remove(item.id); screen = 'categories'; render();
        toast(removedRemote ? '美化码已从云端和本地删除' : item.code && !authenticated ? '本地副本已删除；登录原作者账号后才能删除云端码' : item.code ? '本地副本已删除；云端原作者码保留' : '本地美化已删除');
      } catch (error) {
        button.disabled = false;
        toast(`删除失败：${error.message || '云端暂时不可用'}`);
      }
      return;
    }
    if (button.matches('[data-login]')) { document.querySelector('#idealAuthRoot')?.classList.remove('is-hidden'); return; }
    if (button.matches('[data-logout]')) { if (!window.confirm('退出当前账号？')) return; await window.IdealMachineAuth?.logout?.(); render(); return; }
    if (button.matches('[data-dialog-cancel]') || event.target.matches('[data-dialog-backdrop]')) { closeDialog(); return; }
  });

  root.addEventListener('keydown', event => {
    const card = event.target.closest('[data-open-asset]');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectedAssetId = card.dataset.openAsset; screen = 'asset'; render(); }
  });

  root.addEventListener('change', event => {
    if (event.target.matches('[data-import-json-files]')) {
      const files = [...(event.target.files || [])];
      const label = root.querySelector('[data-import-json-name]');
      if (label) label.textContent = files.length ? `\u5df2\u9009\u62e9 ${files.length} \u4e2a\u6587\u4ef6` : '\u5c1a\u672a\u9009\u62e9\u6587\u4ef6';
      return;
    }
    if (event.target.matches('[data-post-import-previews]')) {
      const files = [...(event.target.files || [])];
      const label = root.querySelector('[data-post-preview-name]');
      if (label) label.textContent = files.length ? `\u5df2\u9009\u62e9 ${files.length} \u5f20\u56fe\u7247` : '\u5c1a\u672a\u9009\u62e9\u6587\u4ef6';
      return;
    }
    if (event.target.matches('[data-edit-preview-file]')) {
      const file = event.target.files?.[0];
      if (!file) return;
      const label = root.querySelector('[data-edit-preview-name]');
      if (label) label.textContent = file.name;
      api.safeImage(file).then(value => setEditedPreview(value, '已选择本地图片')).catch(error => toast(error.message));
    }
  });

  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-app-key="ideal"]')) return;
    event.preventDefault(); event.stopImmediatePropagation(); api.show('beauty');
  }, true);
  window.addEventListener('ideal-machine-beauty-open', event => open(event.detail?.view || 'beauty'));
  window.addEventListener('ideal-machine-auth-changed', event => {
    if (view === 'account' && root.classList.contains('is-open')) render();
    if (event.detail?.authenticated) refreshRemoteLibrary();
  });
  window.addEventListener('resize', () => { if (view === 'beauty' && screen === 'asset') requestAnimationFrame(syncAssetInfoHeight); });
  window.IdealMachineOpenBeautyCenter = open;
})();
