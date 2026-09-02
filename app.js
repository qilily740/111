(() => {
  const storageKey = 'ideal-machine-desktop';
  const state = (() => { try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } })();
  localStorage.removeItem('ideal-machine-layout');
  localStorage.removeItem('ideal-machine-removed-widgets');
  if (!state['calendar-image'] && state['calendar-avatar']) state['calendar-image'] = state['calendar-avatar'];
  const modal = document.querySelector('#editModal');
  const form = document.querySelector('#editForm');
  const title = document.querySelector('#editTitle');
  const desktop = document.querySelector('.desktop-scroll-wrap');
  const widgetEmptyFace = '(^_^)';
  const sharedWidgetDefault = '(^_^)';
  const elapsedTitleDefault = '(^_^)';
  const chatWidgetDefaults = { 'chat-widget-content-0': '(*^▽^*)', 'chat-widget-time-0': '05:20', 'chat-widget-content-1': '(^_^)', 'chat-widget-time-1': '05:20' };
  const nowWidgetDefaults = { 'now-title': '正在听 WILDFLOWER-BillieEilish', 'now-time': '5:21PM', 'now-temperature': '32°C', 'now-weather': '多云', 'now-content': 'things^in*myphone' };
  const moodWidgetDefaults = { 'mood-text-0': 'ヽ(✿ﾟ▽ﾟ)ノ', 'mood-text-1': '(๑•̀ㅂ•́)و✧', 'mood-text-2': '૮(˶ᵔ ᵕ ᵔ˶)ა', 'mood-text-3': '(｡･ω･｡)ﾉ♡', 'mood-footer': '♡ (｡•ㅅ•｡) ♡' };
  const frostProfileDefaults = { 'frost-profile-name': '૮ ˶ᵔ ᵕ ᵔ˶ ა', 'frost-profile-signature': '♡ (｡•ㅅ•｡) ♡' };
  const squareWidgetDefaults = { 'contact-mini-name': '૮ ˶ᵔ ᵕ ᵔ˶ ა', 'contact-mini-status': '今天也在认真生活', 'daily-photo-caption': '今天也值得收藏', 'relationship-mini-name-0': '૮₍˶ᵔ ᵕ ᵔ˶₎ა', 'relationship-mini-name-1': '(｡•ㅅ•｡)♡', 'polaroid-mini-caption': 'our little moments ♡' };
  let activeGroup = null;

  const textLabels = { 'user-name': '用户昵称', 'char-name': '角色昵称', signature: '个性签名', 'calendar-note': '日历寄语', 'countdown-title': '倒计时标题', 'shared-note': '右侧文字', 'shared-replies': '回复数量', 'shared-likes': '喜欢数量', 'elapsed-title': '显示文字', 'chat-widget-content-0': '第一条气泡内容', 'chat-widget-time-0': '第一条时间', 'chat-widget-content-1': '第二条气泡内容', 'chat-widget-time-1': '第二条时间', 'now-title': '顶部文字', 'now-time': '时间', 'now-temperature': '气温', 'now-weather': '天气', 'now-content': '下方文字', 'mood-text-0': '左上文字', 'mood-text-1': '左下文字', 'mood-text-2': '右上文字', 'mood-text-3': '右下文字', 'mood-footer': '底部文字', 'frost-profile-name': '用户名', 'frost-profile-signature': '个性签名' };
  const imageLabels = { 'user-avatar': '用户头像', 'char-avatar': '角色头像', 'calendar-image': '图片', 'photo-0': '第一张图片', 'photo-1': '第二张图片', 'photo-2': '第三张图片', 'widget-image': '小组件图片', 'shared-image-0': '左侧第一张图片', 'shared-image-1': '左侧第二张图片', 'chat-widget-avatar-0': '第一条头像', 'chat-widget-avatar-1': '第二条头像', 'now-avatar': '头像', 'now-image-0': '第一张图片', 'now-image-1': '第二张图片', 'now-image-2': '第三张图片', 'mood-avatar': '头像', 'time-photo-avatar': '头像', 'time-photo-0': '第一张图片', 'time-photo-1': '第二张图片', 'time-photo-2': '第三张图片', 'time-photo-3': '第四张图片', 'frost-profile-cover': '完整背景图片', 'frost-profile-avatar': '头像' };
  const groups = { profile: ['user-name', 'char-name', 'signature', 'user-avatar', 'char-avatar'], photos: ['photo-0', 'photo-1', 'photo-2'], calendar: ['calendar-note', 'calendar-image'], countdown: ['countdown-title', 'countdown-date'], shared: ['shared-note', 'shared-replies', 'shared-likes', 'shared-image-0', 'shared-image-1'], elapsed: ['elapsed-title', 'elapsed-date'], 'chat-widget': ['chat-widget-content-0', 'chat-widget-time-0', 'chat-widget-content-1', 'chat-widget-time-1', 'chat-widget-avatar-0', 'chat-widget-avatar-1'], now: ['now-title', 'now-time', 'now-temperature', 'now-weather', 'now-content', 'now-avatar', 'now-image-0', 'now-image-1', 'now-image-2'], mood: ['mood-text-0', 'mood-text-1', 'mood-text-2', 'mood-text-3', 'mood-footer', 'mood-avatar'], 'time-photo': ['time-photo-avatar', 'time-photo-0', 'time-photo-1', 'time-photo-2', 'time-photo-3'], 'frost-profile': ['frost-profile-name', 'frost-profile-signature', 'frost-profile-cover', 'frost-profile-avatar'] };
  Object.assign(textLabels, { 'contact-mini-name':'联系人昵称', 'contact-mini-status':'个性状态', 'daily-photo-caption':'照片文字', 'relationship-mini-name-0':'左侧昵称', 'relationship-mini-name-1':'右侧昵称', 'polaroid-mini-caption':'相册文字' });
  Object.assign(imageLabels, { 'contact-mini-cover':'背景图片', 'contact-mini-avatar':'联系人头像', 'daily-photo-image':'今日照片', 'daily-photo-avatar':'头像', 'relationship-mini-avatar-0':'左侧头像', 'relationship-mini-avatar-1':'右侧头像', 'polaroid-mini-0':'第一张照片', 'polaroid-mini-1':'第二张照片', 'polaroid-mini-2':'第三张照片' });
  Object.assign(groups, { 'contact-mini':['contact-mini-name','contact-mini-status','contact-mini-cover','contact-mini-avatar'], 'daily-photo':['daily-photo-caption','daily-photo-image','daily-photo-avatar'], 'relationship-mini':['relationship-mini-name-0','relationship-mini-name-1','relationship-mini-date','relationship-mini-avatar-0','relationship-mini-avatar-1'], 'polaroid-mini':['polaroid-mini-caption','polaroid-mini-0','polaroid-mini-1','polaroid-mini-2'] });
  const squareWidgetImageKeys = new Set(['contact-mini-cover','contact-mini-avatar','daily-photo-image','daily-photo-avatar','relationship-mini-avatar-0','relationship-mini-avatar-1','polaroid-mini-0','polaroid-mini-1','polaroid-mini-2']);
  const groupForKey = Object.fromEntries(Object.entries(groups).flatMap(([group, keys]) => keys.map(key => [key, group])));

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cssUrl = value => String(value).replace(/[)'"\\]/g, char => `\\${char}`);
  const saveState = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const habitUsageStorageKey = 'ideal-machine-habit-foreground-v1';
  const habitGoalMs = 5 * 60 * 1000;
  let habitUsage = (() => { try { const value = JSON.parse(localStorage.getItem(habitUsageStorageKey) || '{}'); return { days:value && typeof value.days === 'object' && !Array.isArray(value.days) ? value.days : {} }; } catch { return { days:{} }; } })();
  let habitActiveSince = document.visibilityState === 'visible' ? Date.now() : 0;
  let habitSaveTicks = 0;
  function habitDateKey(timestamp) { const date = new Date(timestamp); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function saveHabitUsage() { try { localStorage.setItem(habitUsageStorageKey, JSON.stringify(habitUsage)); } catch {} }
  function addHabitVisibleTime(start, end) {
    let cursor = start;
    while (cursor < end) {
      const date = new Date(cursor);
      const nextMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
      const segmentEnd = Math.min(end, nextMidnight);
      const key = habitDateKey(cursor);
      habitUsage.days[key] = Math.min(habitGoalMs, Math.max(0, Number(habitUsage.days[key]) || 0) + Math.max(0, segmentEnd - cursor));
      cursor = segmentEnd;
    }
  }
  function renderHabitMini() {
    const key = habitDateKey(Date.now());
    const elapsed = Math.min(habitGoalMs, Math.max(0, Number(habitUsage.days[key]) || 0));
    const completed = elapsed >= habitGoalMs;
    const total = Object.values(habitUsage.days).filter(value => Number(value) >= habitGoalMs).length;
    const progress = Math.max(0, Math.min(1, elapsed / habitGoalMs));
    document.querySelectorAll('.habit-mini-widget').forEach(widget => {
      const ring = widget.querySelector('[data-habit-mini-progress]');
      const totalElement = widget.querySelector('[data-habit-mini-total]');
      const status = widget.querySelector('[data-habit-mini-status]');
      const bar = widget.querySelector('[data-habit-mini-bar]');
      widget.classList.toggle('is-complete', completed);
      if (ring) ring.style.setProperty('--habit-progress', `${progress * 360}deg`);
      if (totalElement) totalElement.textContent = String(total);
      if (bar) bar.style.width = `${progress * 100}%`;
      if (status) { const minutes = Math.floor(elapsed / 60000); const seconds = Math.floor((elapsed % 60000) / 1000); status.textContent = completed ? '今日完成' : `${minutes}:${String(seconds).padStart(2, '0')} / 5:00`; }
    });
  }
  function flushHabitForeground(forceSave = false) {
    const now = Date.now();
    if (habitActiveSince && now > habitActiveSince) addHabitVisibleTime(habitActiveSince, now);
    habitActiveSince = document.visibilityState === 'visible' ? now : 0;
    habitSaveTicks += 1;
    if (forceSave || habitSaveTicks >= 5) { habitSaveTicks = 0; saveHabitUsage(); }
    renderHabitMini();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') habitActiveSince = Date.now(); else flushHabitForeground(true); renderHabitMini(); });
  window.addEventListener('pagehide', () => flushHabitForeground(true));
  setInterval(() => flushHabitForeground(false), 1000);
  function readImageFile(file, maxSize = 900, quality = .68) {
    return new Promise(resolve => {
      if (!file) return resolve('');
      let finished = false;
      const finish = value => { if (finished) return; finished = true; resolve(value || ''); };
      const reader = new FileReader();
      reader.onerror = () => finish('');
      reader.onload = () => {
        const source = String(reader.result || '');
        const image = new Image();
        image.onload = () => { try { const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale)); canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); const webp = canvas.toDataURL('image/webp', quality); finish(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality)); } catch { finish(source); } };
        image.onerror = () => finish(source);
        image.src = source;
      };
      reader.readAsDataURL(file);
      setTimeout(() => finish(''), 8000);
    });
  }
  window.IdealMachineReadImage = readImageFile;
  const nativeFetch = window.fetch.bind(window);
  const activeRequests = new Map();
  window.IdealMachineFetch = async function idealMachineFetch(input, init = {}) {
    const scope = String(init.idealScope || 'shared');
    const timeout = Math.max(1000, Number(init.timeout) || 45000);
    const controller = new AbortController();
    const externalSignal = init.signal;
    const abortFromExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal) {
      if (externalSignal.aborted) abortFromExternal();
      else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    }
    const requests = activeRequests.get(scope) || new Set();
    requests.add(controller);
    activeRequests.set(scope, requests);
    const timer = setTimeout(() => controller.abort(new DOMException('请求超时', 'TimeoutError')), timeout);
    const { idealScope, timeout: ignoredTimeout, ...fetchInit } = init;
    try { return await nativeFetch(input, { ...fetchInit, signal: controller.signal }); }
    finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.('abort', abortFromExternal);
      requests.delete(controller);
      if (!requests.size) activeRequests.delete(scope);
    }
  };
  window.IdealMachineCancelRequests = scope => {
    const requests = activeRequests.get(String(scope || 'shared'));
    requests?.forEach(controller => controller.abort(new DOMException('页面已关闭', 'AbortError')));
    activeRequests.delete(String(scope || 'shared'));
  };
  window.IdealMachineCancelAllRequests = () => { [...activeRequests.keys()].forEach(scope => window.IdealMachineCancelRequests(scope)); };
  window.fetch = (input, init = {}) => window.IdealMachineFetch(input, init);
  window.addEventListener('pagehide', window.IdealMachineCancelAllRequests);
  document.addEventListener('click', event => { if (event.target.closest?.('[data-app-key]')) window.IdealMachineCancelAllRequests(); }, true);
  const assetDBPromise = typeof indexedDB === 'undefined' ? Promise.resolve(null) : new Promise(resolve => { const request = indexedDB.open('ideal-machine-assets', 1); request.onupgradeneeded = () => request.result.createObjectStore('images'); request.onsuccess = () => resolve(request.result); request.onerror = () => resolve(null); });
  function putImageAsset(value) { return assetDBPromise.then(db => new Promise(resolve => { if (!db) return resolve(value); const id = 'idb:image:' + Date.now() + ':' + Math.random().toString(36).slice(2); const transaction = db.transaction('images', 'readwrite'); transaction.objectStore('images').put(String(value || ''), id); transaction.oncomplete = () => resolve(id); transaction.onerror = () => resolve(value); })); }
  function getImageAsset(value) { if (!String(value || '').startsWith('idb:image:')) return Promise.resolve(value); return assetDBPromise.then(db => new Promise(resolve => { if (!db) return resolve(''); const request = db.transaction('images').objectStore('images').get(value); request.onsuccess = () => resolve(request.result || ''); request.onerror = () => resolve(''); })); }
  function deleteImageAsset(value) { if (!String(value || '').startsWith('idb:image:')) return Promise.resolve(false); return assetDBPromise.then(db => new Promise(resolve => { if (!db) return resolve(false); const transaction = db.transaction('images', 'readwrite'); transaction.objectStore('images').delete(value); transaction.oncomplete = () => resolve(true); transaction.onerror = () => resolve(false); })); }
  function cleanupImageAssets() { return assetDBPromise.then(db => new Promise(resolve => { if (!db) return resolve(0); const referenced = new Set(); Object.keys(localStorage).forEach(key => { const text = localStorage.getItem(key) || ''; (text.match(/idb:image:[^"'\\\s,}\]]+/g) || []).forEach(value => referenced.add(value)); }); const transaction = db.transaction('images', 'readwrite'); const store = transaction.objectStore('images'); const request = store.getAllKeys(); let removed = 0; request.onsuccess = () => { (request.result || []).forEach(key => { if (!referenced.has(String(key))) { store.delete(key); removed += 1; } }); }; transaction.oncomplete = () => resolve(removed); transaction.onerror = () => resolve(0); })); }
  window.IdealMachinePutImage = putImageAsset;
  window.IdealMachineGetImage = getImageAsset;
  window.IdealMachineDeleteImage = deleteImageAsset;
  window.IdealMachineCleanupAssets = cleanupImageAssets;
  setTimeout(cleanupImageAssets, 5000);
  function updateStoredObject(key, fallback, update) {
    try {
      const current = JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
      const next = update(current) ?? current;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    } catch { return fallback; }
  }
  function removeRoleData(roleId) {
    if (!roleId) return;
    window.IdealMachineMemory?.forgetRole?.(roleId);
    updateStoredObject('ideal-machine-calendar-events', [], events => Array.isArray(events) ? events.filter(item => item?.contactId !== roleId && item?.authorId !== roleId && item?.roleId !== roleId) : []);
    updateStoredObject('ideal-machine-couple', {}, couple => {
      const wasCurrent = couple.contactId === roleId;
      if (couple.spaces && typeof couple.spaces === 'object') delete couple.spaces[roleId];
      if (!couple.spaces && wasCurrent) return {};
      if (wasCurrent) couple.contactId = '';
      return couple;
    });
    updateStoredObject('ideal-machine-home', {}, data => { if (data.roleId === roleId) data.roleId = ''; return data; });
    updateStoredObject('ideal-machine-town', {}, data => {
      if (data.roleId === roleId) data.roleId = '';
      if (data.towns && typeof data.towns === 'object') Object.keys(data.towns).forEach(key => { if (key.endsWith(`::${roleId}`)) delete data.towns[key]; });
      return data;
    });
    updateStoredObject('ideal-machine-shopping', {}, data => {
      if (data.companion && typeof data.companion === 'object') Object.keys(data.companion).forEach(key => { if (data.companion[key] === roleId) delete data.companion[key]; });
      ['gifts', 'orders', 'wishes'].forEach(group => { if (data[group] && typeof data[group] === 'object') Object.keys(data[group]).forEach(key => { if (Array.isArray(data[group][key])) data[group][key] = data[group][key].filter(item => item?.roleId !== roleId && item?.contactId !== roleId); }); });
      return data;
    });
    updateStoredObject('ideal-machine-music', {}, data => { if (data.rooms && typeof data.rooms === 'object') Object.keys(data.rooms).forEach(key => { if (data.rooms[key]?.roleId === roleId) delete data.rooms[key]; }); return data; });
    updateStoredObject('ideal-machine-ta', {}, data => { if (data.roleId === roleId) data.roleId = ''; return data; });
    ['ideal-machine-ta-snapshots', 'ideal-machine-ta-npcs'].forEach(key => updateStoredObject(key, {}, data => { delete data[roleId]; return data; }));
    updateStoredObject('ideal-machine-if-shikong', {}, data => { if (data.roleId === roleId) data.roleId = ''; if (Array.isArray(data.spaces)) data.spaces = data.spaces.filter(item => item?.roleId !== roleId); return data; });
    window.dispatchEvent(new CustomEvent('ideal-machine-role-deleted', { detail: { roleId } }));
  }
  function removeProfileData(profileId) {
    if (!profileId) return;
    window.IdealMachineMemory?.forgetProfile?.(profileId);
    updateStoredObject('ideal-machine-home', {}, data => { if (data.profileId === profileId) data.profileId = ''; if (data.homes) delete data.homes[profileId]; return data; });
    updateStoredObject('ideal-machine-town', {}, data => {
      if (data.profileId === profileId) data.profileId = '';
      if (data.towns && typeof data.towns === 'object') Object.keys(data.towns).forEach(key => { if (key.startsWith(`${profileId}::`)) delete data.towns[key]; });
      return data;
    });
    updateStoredObject('ideal-machine-shopping', {}, data => {
      if (data.profileId === profileId) data.profileId = '';
      ['carts', 'orders', 'wishes', 'gifts', 'companion'].forEach(group => { if (data[group]) delete data[group][profileId]; });
      return data;
    });
    let localTrackIds = [];
    updateStoredObject('ideal-machine-music', {}, data => {
      localTrackIds = Array.isArray(data.library?.[profileId]) ? data.library[profileId].filter(item => item?.source === 'file').map(item => item.id).filter(Boolean) : [];
      if (data.profileId === profileId) data.profileId = '';
      ['current', 'rooms', 'library'].forEach(group => { if (data[group]) delete data[group][profileId]; });
      return data;
    });
    if (localTrackIds.length && window.indexedDB) { const request = indexedDB.open('ideal-machine-music-files'); request.onsuccess = () => { const db = request.result; if (!db.objectStoreNames.contains('tracks')) return db.close(); const transaction = db.transaction('tracks', 'readwrite'); localTrackIds.forEach(id => transaction.objectStore('tracks').delete(id)); transaction.oncomplete = () => db.close(); transaction.onerror = () => db.close(); }; }
    localStorage.removeItem(`ideal-machine-netease-profile-${profileId}`);
    window.dispatchEvent(new CustomEvent('ideal-machine-profile-deleted', { detail: { profileId } }));
  }
  window.IdealMachineData = { removeRole: removeRoleData, removeProfile: removeProfileData };
  function compactImageData(source, maxSize = 900, quality = .62) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const webp = canvas.toDataURL('image/webp', quality);
        const compacted = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
        resolve(compacted.length < String(source).length ? compacted : source);
      };
      image.onerror = () => resolve(source);
      image.src = source;
    });
  }
  async function compactStoredValue(value) {
    if (typeof value === 'string') return /^data:image\//i.test(value) && value.length > 120000 ? compactImageData(value) : value;
    if (Array.isArray(value)) return Promise.all(value.map(item => compactStoredValue(item)));
    if (value && typeof value === 'object') { const result = {}; for (const [key, item] of Object.entries(value)) result[key] = await compactStoredValue(item); return result; }
    return value;
  }
  window.IdealMachineCompactStoredValue = compactStoredValue;

  function imageField(key) {
    const value = state[key] || '';
    const urlValue = value.startsWith('data:') || value.startsWith('idb:image:') ? '' : value;
    return `<div class="edit-field image-edit-field"><label>${imageLabels[key]}</label><input data-image-url="${key}" type="url" placeholder="粘贴图片地址（可选）" value="${escapeHtml(urlValue)}"><div class="edit-image-actions"><label class="file-picker">选择本地图片<input class="edit-file" data-image-file="${key}" type="file" accept="image/*"></label><button class="edit-album-pick" data-album-pick="${key}" type="button">从相册选择</button></div><div class="edit-preview" data-image-preview="${key}"></div></div>`;
  }

  function countdownDateField() {
    const match = String(state['countdown-date'] || '').match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
    const month = match?.[1] || '';
    const day = match?.[2] || '';
    const monthOptions = Array.from({ length:12 }, (_, index) => { const value = String(index + 1).padStart(2, '0'); return `<option value="${value}" ${value === month ? 'selected' : ''}>${index + 1}月</option>`; }).join('');
    const dayOptions = Array.from({ length:31 }, (_, index) => { const value = String(index + 1).padStart(2, '0'); return `<option value="${value}" ${value === day ? 'selected' : ''}>${index + 1}日</option>`; }).join('');
    return `<div class="edit-field"><label>每年日期</label><div class="countdown-date-pickers"><select id="countdownMonth" class="edit-select" aria-label="选择月份"><option value="">选择月份</option>${monthOptions}</select><select id="countdownDay" class="edit-select" aria-label="选择日期"><option value="">选择日期</option>${dayOptions}</select></div><small>只选择月和日，每年自动计算下一次日期</small></div>`;
  }

  function elapsedDateField() {
    return `<div class="edit-field"><label for="elapsedDate">开始日期</label><input id="elapsedDate" type="date" value="${escapeHtml(state['elapsed-date'] || '')}"><small>请选择开始计算的年月日，天数由系统自动计算</small></div>`;
  }

  function fieldMarkup(key) {
    if (key === 'relationship-mini-date') return `<div class="edit-field"><label for="relationshipMiniDate">开始相伴的日期</label><input id="relationshipMiniDate" type="date" value="${escapeHtml(state[key] || '')}"><small>选择后自动显示相伴天数</small></div>`;
    if (key === 'shared-note') return `<div class="edit-field"><label for="editText-shared-note">右侧文字</label><textarea id="editText-shared-note" maxlength="300" placeholder="填写要显示在组件右侧的文字">${escapeHtml(Object.prototype.hasOwnProperty.call(state, 'shared-note') ? state['shared-note'] : sharedWidgetDefault)}</textarea></div>`;
    if (key.startsWith('chat-widget-content-')) return `<div class="edit-field"><label for="editText-${key}">${textLabels[key]}</label><textarea id="editText-${key}" maxlength="160" placeholder="填写要显示在聊天气泡里的内容">${escapeHtml(state[key] || '')}</textarea></div>`;
    if (textLabels[key]) {
      const fallback = document.querySelector(`[data-edit="${key}"]`)?.textContent || '';
      const placeholder = key === 'countdown-title' ? '例如：生日还剩' : key === 'elapsed-title' ? '例如：和 xxx 在一起' : key === 'shared-replies' ? '例如：99k' : key === 'shared-likes' ? '例如：520k' : '';
      const defaultValue = key === 'elapsed-title' && !Object.prototype.hasOwnProperty.call(state, key) ? elapsedTitleDefault : (state[key] ?? fallback);
      return `<div class="edit-field"><label for="editText-${key}">${textLabels[key]}</label><input id="editText-${key}" type="text" maxlength="80" placeholder="${placeholder}" value="${escapeHtml(defaultValue)}"></div>`;
    }
    if (key === 'todo') return `<div class="edit-field"><label for="editText-todo">每行一项待办</label><textarea id="editText-todo" placeholder="例如：\n买菜\n整理房间">${escapeHtml(state.todo || '')}</textarea></div>`;
    if (key === 'countdown-date') return countdownDateField();
    if (key === 'elapsed-date') return elapsedDateField();
    return imageField(key);
  }

  function fontSizeFields() {
    const fields = [['user-name', '用户昵称字号', state['user-name-size'] || 18], ['char-name', '角色昵称字号', state['char-name-size'] || 18], ['signature', '个性签名字号', state['signature-size'] || 13]];
    return fields.map(([key, label, value]) => `<div class="edit-field font-size-control"><label for="fontSize-${key}">${label}</label><input id="fontSize-${key}" data-font-size="${key}" type="number" min="10" max="30" step="1" value="${value}"><span class="font-size-value" data-font-value="${key}">px</span></div>`).join('');
  }

  function calendarFields() {
    return `<div class="edit-field font-size-control"><label for="fontSize-calendar-note">寄语字号</label><input id="fontSize-calendar-note" data-font-size="calendar-note" type="number" min="9" max="24" step="1" value="${state['calendar-note-size'] || 11}"><span class="font-size-value" data-font-value="calendar-note">px</span></div><div class="edit-field font-size-control"><label for="calendarNoteLeft">寄语左边距</label><input id="calendarNoteLeft" type="number" min="80" max="360" step="1" value="${state['calendar-note-left'] ?? 205}"><span class="font-size-value">px</span></div><div class="edit-field"><label for="calendarNoteAlign">寄语对齐方式</label><select id="calendarNoteAlign" class="edit-select"><option value="left" ${state['calendar-note-align'] !== 'center' && state['calendar-note-align'] !== 'right' ? 'selected' : ''}>左对齐</option><option value="center" ${state['calendar-note-align'] === 'center' ? 'selected' : ''}>居中对齐</option><option value="right" ${state['calendar-note-align'] === 'right' ? 'selected' : ''}>右对齐</option></select></div>`;
  }

  function openEditor(key) {
    activeGroup = groups[key] ? key : (groupForKey[key] || key);
    const keys = groups[activeGroup] || [activeGroup];
    title.textContent = activeGroup === 'profile' ? '编辑个人资料' : activeGroup === 'photos' ? '编辑图片' : activeGroup === 'calendar' ? '编辑日历' : activeGroup === 'todo' ? '编辑待办' : activeGroup === 'countdown' ? '编辑周年倒计时' : activeGroup === 'shared' ? '编辑共享小组件' : activeGroup === 'elapsed' ? '编辑累计天数' : activeGroup === 'chat-widget' ? '编辑聊天气泡' : activeGroup === 'now' ? '编辑正在听与天气' : activeGroup === 'mood' ? '编辑头像心情卡片' : activeGroup === 'time-photo' ? '编辑时间照片卡片' : activeGroup === 'frost-profile' ? '编辑磨砂个人名片' : imageLabels[activeGroup] || '编辑';
    title.textContent = ({ 'contact-mini':'编辑联系人快捷卡', 'daily-photo':'编辑今日照片', 'relationship-mini':'编辑双人关系卡', 'polaroid-mini':'编辑拍立得相册' })[activeGroup] || title.textContent;
    form.innerHTML = keys.map(fieldMarkup).join('') + (activeGroup === 'profile' ? fontSizeFields() : activeGroup === 'calendar' ? calendarFields() : activeGroup === 'todo' ? '<div class="edit-field font-size-control"><label for="fontSize-todo">待办文字字号</label><input id="fontSize-todo" data-font-size="todo" type="number" min="9" max="24" step="1" value="' + (state['todo-size'] || 12) + '"><span class="font-size-value" data-font-value="todo">px</span></div>' : '');
    form.querySelectorAll('[data-image-file]').forEach(input => input.addEventListener('change', previewLocalImage));
    form.querySelectorAll('[data-font-size]').forEach(input => input.addEventListener('input', event => { document.querySelector(`[data-font-value="${event.target.dataset.fontSize}"]`).textContent = `${event.target.value}px`; }));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    keys.filter(key => String(state[key] || '').startsWith('idb:image:')).forEach(key => window.IdealMachineGetImage(state[key]).then(value => setBackground(document.querySelector(`[data-image-preview="${key}"]`), value)));
    form.querySelector('input, textarea')?.focus();
  }

  function closeEditor() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    form.replaceChildren();
    activeGroup = null;
  }

  function previewLocalImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackground(document.querySelector(`[data-image-preview="${event.target.dataset.imageFile}"]`), reader.result);
    reader.readAsDataURL(file);
  }

  function readFile(file) {
    return window.IdealMachineReadImage(file);
  }

  async function saveEditor() {
    if (!activeGroup) return;
    const keys = groups[activeGroup] || [activeGroup];
    for (const key of keys) {
      if (textLabels[key] || key === 'todo') state[key] = document.querySelector(`#editText-${key}`).value.trim();
      else if (key === 'countdown-date') {
        const month = document.querySelector('#countdownMonth').value;
        const day = document.querySelector('#countdownDay').value;
        state[key] = month && day ? `${month}-${day}` : '';
      }
      else if (key === 'elapsed-date') state[key] = document.querySelector('#elapsedDate').value;
      else if (key === 'relationship-mini-date') state[key] = document.querySelector('#relationshipMiniDate').value;
      else {
        const file = document.querySelector(`[data-image-file="${key}"]`).files[0];
        const url = document.querySelector(`[data-image-url="${key}"]`).value.trim();
        const uploadedImage = await readFile(file);
        if (uploadedImage) state[key] = window.IdealMachinePutImage ? await window.IdealMachinePutImage(uploadedImage) : uploadedImage;
        else if (url) { state[key] = url; window.IdealMachineAlbum?.archiveUrl?.(url, '桌面'); }
      }
    }
    if (activeGroup === 'profile') ['user-name', 'char-name', 'signature'].forEach(key => { state[`${key}-size`] = Number(document.querySelector(`[data-font-size="${key}"]`).value); });
    if (activeGroup === 'calendar') { state['calendar-note-size'] = Number(document.querySelector('[data-font-size="calendar-note"]').value); state['calendar-note-left'] = Number(document.querySelector('#calendarNoteLeft').value); state['calendar-note-align'] = document.querySelector('#calendarNoteAlign').value; }
    if (activeGroup === 'todo') state['todo-size'] = Number(document.querySelector('[data-font-size="todo"]').value);
    try { saveState(); } catch (error) { try { const compacted = await compactStoredValue(state); Object.keys(state).forEach(key => delete state[key]); Object.assign(state, compacted); saveState(); } catch { return window.alert('图片保存失败：Safari 的本地存储空间不足，请先清理旧图片后重试。'); } }
    render();
    closeEditor();
  }

  function setBackground(element, value) {
    if (!element || !value) return;
    element.style.backgroundImage = `url("${String(value).replace(/"/g, '\\"')}")`;
  }

  function render() {
    Object.keys(textLabels).forEach(key => {
      const element = document.querySelector(`[data-edit="${key}"]`);
      if (element && state[key]) element.textContent = state[key];
      if (element && state[`${key}-size`]) element.style.fontSize = `${state[`${key}-size`]}px`;
      if (element && key === 'calendar-note' && state['calendar-note-left'] !== undefined) element.style.left = `${state['calendar-note-left']}px`;
      if (element && key === 'calendar-note' && state['calendar-note-align']) element.style.textAlign = state['calendar-note-align'];
    });
    const todoSize = state['todo-size'] || 12;
    document.querySelectorAll('.todo-title, .todo-list, .todo-new-row').forEach(element => { element.style.fontSize = `${todoSize}px`; });
    const todoList = document.querySelector('.todo-list');
    if (todoList) todoList.innerHTML = (state.todo || '').split('\n').map(item => item.trim()).filter(Boolean).map(item => `<div class="todo-item">□ ${escapeHtml(item)}</div>`).join('');
    const todoHint = document.querySelector('.todo-new-row');
    if (todoHint) todoHint.style.display = (state.todo || '').trim() ? 'none' : '';
    const sharedNote = document.querySelector('[data-shared-note]');
    if (sharedNote) sharedNote.textContent = Object.prototype.hasOwnProperty.call(state, 'shared-note') ? state['shared-note'] : sharedWidgetDefault;
    const sharedReplies = document.querySelector('[data-shared-replies]');
    const sharedLikes = document.querySelector('[data-shared-likes]');
    if (sharedReplies) sharedReplies.textContent = state['shared-replies'] || '';
    if (sharedLikes) sharedLikes.textContent = state['shared-likes'] || '';
    ['chat-widget-content-0', 'chat-widget-time-0', 'chat-widget-content-1', 'chat-widget-time-1'].forEach(key => { const element = document.querySelector(`[data-edit="${key}"]`); if (element) element.textContent = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : chatWidgetDefaults[key]; });
    ['chat-widget-avatar-0', 'chat-widget-avatar-1'].forEach(key => { const element = document.querySelector(`[data-edit="${key}"]`); if (element && !state[key]) element.style.backgroundImage = ''; });
    Object.entries(nowWidgetDefaults).forEach(([key, fallback]) => { const element = document.querySelector(`[data-edit="${key}"]`); if (element) element.textContent = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback; });
    [...['now-avatar', 'now-image-0', 'now-image-1', 'now-image-2'], 'mood-avatar', 'time-photo-avatar', 'time-photo-0', 'time-photo-1', 'time-photo-2', 'time-photo-3', 'frost-profile-cover', 'frost-profile-avatar', ...squareWidgetImageKeys].forEach(key => { const element = document.querySelector(`[data-edit="${key}"]`); if (element && !state[key]) { element.style.backgroundImage = ''; element.classList.remove('has-image'); } });
    Object.entries(moodWidgetDefaults).forEach(([key, fallback]) => { const element = document.querySelector(`[data-edit="${key}"]`); if (element) element.textContent = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback; });
    Object.entries(frostProfileDefaults).forEach(([key, fallback]) => { const element = document.querySelector(`[data-edit="${key}"]`); if (element) element.textContent = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback; });
    Object.entries(squareWidgetDefaults).forEach(([key, fallback]) => { const element = document.querySelector(`[data-edit="${key}"]`); if (element) element.textContent = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback; });
    renderSquareWidgets();
    renderCountdown();
    renderElapsedDays();
    Object.keys(imageLabels).forEach(key => {
      const element = document.querySelector(`[data-edit="${key}"]`);
      if (!element || !state[key]) return;
      const value = state[key];
      const applyImage = resolved => { if (!resolved) return; if (key === 'calendar-image') { element.replaceChildren(); const image = document.createElement('img'); image.src = resolved; image.alt = '图片'; element.appendChild(image); } else { setBackground(element, resolved); if (key === 'widget-image' || key.startsWith('shared-image-') || key === 'now-avatar' || key.startsWith('now-image-') || key === 'mood-avatar' || key === 'time-photo-avatar' || key.startsWith('time-photo-') || key.startsWith('frost-profile-') || squareWidgetImageKeys.has(key)) element.classList.add('has-image'); const preview = document.querySelector(`[data-image-preview="${key}"]`); if (preview) setBackground(preview, resolved); } };
      if (window.IdealMachineGetImage && String(value).startsWith('idb:image:')) window.IdealMachineGetImage(value).then(applyImage); else applyImage(value);
    });
  }

  function renderSquareWidgets() {
    const now = new Date();
    const date = document.querySelector('[data-daily-photo-date]');
    if (date) date.textContent = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const days = document.querySelector('[data-relationship-mini-days]');
    if (days) {
      const match = String(state['relationship-mini-date'] || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const start = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
      const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      days.textContent = Number.isFinite(start) ? String(Math.max(0, Math.floor((today - start) / 86400000))) : '0';
    }
    const polaroid = document.querySelector('.polaroid-mini-widget');
    if (polaroid) polaroid.dataset.active = String((Number(state['polaroid-mini-index']) || 0) % 3);
    renderHabitMini();
  }

  function renderCountdown() {
    const titleElement = document.querySelector('[data-countdown-title]');
    const daysElement = document.querySelector('[data-countdown-days]');
    const dateElement = document.querySelector('[data-countdown-date]');
    if (!titleElement || !daysElement || !dateElement) return;
    titleElement.textContent = String(state['countdown-title'] || '').trim();
    const match = String(state['countdown-date'] || '').match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
    if (!match) {
      daysElement.textContent = widgetEmptyFace;
      daysElement.classList.add('is-empty');
      dateElement.textContent = '请选择每年日期';
      return;
    }
    const month = Number(match[1]);
    const day = Number(match[2]);
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const targetForYear = year => {
      const lastDay = new Date(year, month, 0).getDate();
      return { year, month, day:Math.min(day, lastDay) };
    };
    let target = targetForYear(today.getFullYear());
    let targetUtc = Date.UTC(target.year, target.month - 1, target.day);
    if (targetUtc < todayUtc) {
      target = targetForYear(today.getFullYear() + 1);
      targetUtc = Date.UTC(target.year, target.month - 1, target.day);
    }
    daysElement.textContent = String(Math.max(0, Math.round((targetUtc - todayUtc) / 86400000)));
    daysElement.classList.remove('is-empty');
    dateElement.textContent = `- ${target.year}-${String(target.month).padStart(2, '0')}-${String(target.day).padStart(2, '0')} -`;
  }
  function renderElapsedDays() {
    const titleElement = document.querySelector('[data-elapsed-title]');
    const daysElement = document.querySelector('[data-elapsed-days]');
    const dateElement = document.querySelector('[data-elapsed-date]');
    if (!titleElement || !daysElement || !dateElement) return;
    titleElement.textContent = Object.prototype.hasOwnProperty.call(state, 'elapsed-title') ? String(state['elapsed-title'] || '').trim() : elapsedTitleDefault;
    const match = String(state['elapsed-date'] || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      daysElement.textContent = widgetEmptyFace;
      daysElement.classList.add('is-empty');
      dateElement.textContent = '请选择开始日期';
      return;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const startUtc = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const elapsed = Math.max(0, Math.floor((todayUtc - startUtc) / 86400000));
    daysElement.textContent = `${elapsed} 天`;
    daysElement.classList.remove('is-empty');
    dateElement.textContent = `- ${match[1]}-${match[2]}-${match[3]} -`;
  }
  setInterval(renderCountdown, 60 * 1000);
  setInterval(renderElapsedDays, 60 * 1000);

  async function migrateDesktopImages() { if (!window.IdealMachinePutImage) return; let changed = false; for (const key of Object.keys(imageLabels)) { const value = state[key]; if (!String(value || '').startsWith('data:image/')) continue; state[key] = await window.IdealMachinePutImage(value); changed = true; } if (changed) { try { saveState(); render(); } catch {} } }

  compactStoredValue(state).then(compacted => { Object.keys(state).forEach(key => delete state[key]); Object.assign(state, compacted); try { saveState(); render(); } catch {} });

  function updatePageIndicator() {
    const pageDots = [...document.querySelectorAll('.page-indicator .dot')];
    if (!desktop || !pageDots.length) return;
    const pageIndex = Math.min(pageDots.length - 1, Math.round(desktop.scrollLeft / desktop.clientWidth));
    pageDots.forEach((dot, index) => dot.classList.toggle('active', index === pageIndex));
  }

  function renderTimePhotoWidget() {
    const clock = document.querySelector('[data-time-photo-clock]');
    const weekday = document.querySelector('[data-time-photo-weekday]');
    if (!clock || !weekday) return;
    const now = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    weekday.textContent = weekdays[now.getDay()];
  }
  setInterval(renderTimePhotoWidget, 60 * 1000);
  setInterval(renderSquareWidgets, 60 * 1000);

  function formatDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

  function renderCalendar() {
    const daysElement = document.querySelector('.calendar-days');
    if (!daysElement) return;
    const today = new Date();
    let calendarEvents = [];
    try { calendarEvents = JSON.parse(localStorage.getItem('ideal-machine-calendar-events') || '[]'); } catch {}
    const eventDates = new Map(calendarEvents.map(item => [item.date, item.title || '纪念日']));
    const todayKey = formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    document.querySelector('.date-calendar-year').textContent = `${today.getFullYear()}年`;
    document.querySelector('.date-calendar-month-day').textContent = `${today.getMonth() + 1}月${today.getDate()}日`;
    document.querySelector('.date-calendar-weekday').textContent = weekdayNames[today.getDay()];
    const firstWeek = new Date(today);
    firstWeek.setDate(today.getDate() - today.getDay() - 26 * 7);
    const weeks = [];
    let todayWeekIndex = 0;
    for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
      const weekStart = new Date(firstWeek);
      weekStart.setDate(firstWeek.getDate() + weekIndex * 7);
      const week = document.createElement('div'); week.className = 'calendar-week';
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = new Date(weekStart); date.setDate(weekStart.getDate() + dayIndex);
        const dateKey = formatDateKey(date);
        const isToday = dateKey === todayKey;
        const day = document.createElement('span'); day.className = `calendar-day${isToday ? ' today' : ''}${eventDates.has(dateKey) ? ' has-event' : ''}`; day.dataset.calendarToday = String(isToday); day.setAttribute('aria-current', isToday ? 'date' : 'false'); day.innerHTML = isToday ? `<span class="calendar-day-number">${date.getDate()}</span><svg class="calendar-today-heart" viewBox="0 0 34 30" aria-hidden="true"><path d="M17 27.1C14.7 24.9 4.4 19.5 3.6 12.3C3.1 7.7 6 4.2 10.1 4.3C13.4 4.3 15.8 6.3 17.1 9.3C18.4 6.3 20.8 4.3 24.1 4.3C28.2 4.2 31.1 7.7 30.6 12.3C29.8 19.5 19.5 24.9 17 27.1"/></svg>` : date.getDate();
        if (eventDates.has(dateKey)) day.title = eventDates.get(dateKey);
        day.setAttribute('aria-label', `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`); week.appendChild(day);
        if (dateKey === todayKey) todayWeekIndex = weekIndex;
      }
      weeks.push(week);
    }
    daysElement.replaceChildren(...weeks);
    requestAnimationFrame(() => {
      const weekStep = 22;
      daysElement.scrollTop = Math.max(0, todayWeekIndex * weekStep - (daysElement.clientHeight - 20) / 2);
    });
  }
  window.IdealMachineRenderCalendar = renderCalendar;
  setInterval(renderCalendar, 60 * 1000);

  document.addEventListener('click', event => {
    const shortcut = event.target.closest('[data-mini-open-app]');
    if (shortcut) {
      event.preventDefault();
      const appKey = String(shortcut.dataset.miniOpenApp || '').replace(/[^a-z0-9-]/gi, '');
      document.querySelector(`[data-app-key="${appKey}"]`)?.click();
      return;
    }
    if (event.target.closest('[data-polaroid-rotate]')) {
      event.preventDefault();
      state['polaroid-mini-index'] = ((Number(state['polaroid-mini-index']) || 0) + 1) % 3;
      saveState();
      renderSquareWidgets();
      return;
    }
    const target = event.target.closest('[data-edit]');
    if (target && !event.target.closest('#editModal')) openEditor(target.dataset.edit);
    const albumPick = event.target.closest('[data-album-pick]');
    if (albumPick) {
      event.preventDefault();
      window.IdealMachineAlbum?.pick?.(url => {
        const input = form.querySelector(`[data-image-url="${albumPick.dataset.albumPick}"]`);
        if (!input) return;
        input.value = url || '';
        setBackground(form.querySelector(`[data-image-preview="${albumPick.dataset.albumPick}"]`), url);
      });
      return;
    }
    if (event.target.closest('[data-edit-close]')) closeEditor();
  });
  document.querySelector('#editSave').addEventListener('click', saveEditor);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeGroup) closeEditor(); });
  desktop?.addEventListener('scroll', updatePageIndicator, { passive: true });
  window.addEventListener('resize', updatePageIndicator);
  renderCalendar();
  renderTimePhotoWidget();
  render();
  updatePageIndicator();
  migrateDesktopImages();

  const imageUrlSelectors = '#beautyWallpaperUrl, .chat-wallpaper-url, #contactAvatarUrl, #profileAvatarUrl, input[data-image-url], input[data-beauty-url]';
  function decorateImageUrlInputs(root = document) {
    root.querySelectorAll(imageUrlSelectors).forEach(input => {
      if (input.dataset.hasFetchButton) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'url-fetch-button'; button.dataset.urlFetch = 'true'; button.textContent = '获取';
      const field = document.createElement('div'); field.className = 'url-fetch-field'; input.replaceWith(field); field.append(input, button); input.dataset.hasFetchButton = 'true';
    });
  }
  function previewImageUrl(input) {
    const value = input.value.trim(); if (!value) return;
    const set = (element, url) => { if (element) element.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`; };
    if (input.matches('#beautyWallpaperUrl')) { set(document.body, value); set(document.querySelector('#beautyWallpaperPreview'), value); return; }
    if (input.matches('.chat-wallpaper-url')) { set(document.querySelector('.chat-conversation'), value); set(document.querySelector('.chat-wallpaper-preview'), value); return; }
    if (input.matches('input[data-image-url]')) { set(document.querySelector(`[data-image-preview="${input.dataset.imageUrl}"]`), value); return; }
    if (input.matches('input[data-beauty-url]')) { set(document.querySelector(`[data-beauty-preview="${input.dataset.beautyUrl}"]`), value); return; }
    const avatar = input.closest('.chat-avatar-picker')?.querySelector('.chat-editor-avatar');
    if (avatar) { avatar.innerHTML = `<img src="${value.replace(/"/g, '&quot;')}" alt="头像预览">`; avatar.style.backgroundImage = ''; }
  }
  document.addEventListener('click', event => { const button = event.target.closest('[data-url-fetch]'); if (!button) return; const input = button.previousElementSibling?.matches('input[type="url"]') ? button.previousElementSibling : button.parentElement?.querySelector('input[type="url"]'); if (input) { previewImageUrl(input); input.dispatchEvent(new Event('change', { bubbles: true })); } });
  decorateImageUrlInputs();
  new MutationObserver(() => decorateImageUrlInputs()).observe(document.body, { childList: true, subtree: true });

  function registerIdealMachineServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
    navigator.serviceWorker.register('./sw.js?v=20260902-1', { updateViaCache: 'none' }).catch(() => {});
  }
  registerIdealMachineServiceWorker();
})();
