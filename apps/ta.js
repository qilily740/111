(() => {
  const chatKey = 'ideal-machine-chat';
  const storageKey = 'ideal-machine-ta';
  const calendarDaysKey = 'ideal-machine-ta-calendar-days';
  const app = document.createElement('div'); app.className = 'ta-app'; document.body.appendChild(app);
  const apps = [['liaotian','聊天','chat','#8bb8f1'],['luntan','论坛','forum','#f1a66f'],['rili','日历','calendar','#ee9b9b'],['qinglvkongjian','情侣空间','couple','#dc91b7'],['yinyue','音乐','music','#9e9ae9'],['doubao','豆包','doubao','#8ec8c2'],['gouwu','购物','shop','#e5b27d'],['qianbao','钱包','wallet','#78a889']];
  const beautyApp = ['meihua','美化','beauty','#9ba9c8'];
  const desktopApps = [...apps, beautyApp];
  let state = readState(); let activeApp = ''; let activeChatTarget = ''; let activeDetail = null; let activeCalendarDate = localDateKey(new Date()); let npcBusy = false; let refreshing = false; let refreshPickerOpen = false; let appearanceOpen = false; let appearanceDraft = null; let appearanceSwapKey = ''; let reverseOpen = false; let reverseBusy = false; let reverseLive = null; let reverseForceCaught = false; let reverseRateOpen = false; let reverseViewer = null; let reverseAppearance = {wallpaper:'',icons:{},names:{}}; let reverseStep = 0; let selectedRefreshApps = new Set(); let doubaoHistoryOpen = false; let selectedDoubaoHistory = -1;
  function readState() { try { const value=JSON.parse(localStorage.getItem(storageKey) || '{}'); return { roleId:value.roleId || '', appearance:{ wallpaper:value.appearance?.wallpaper || '', icons:value.appearance?.icons && typeof value.appearance.icons === 'object' ? value.appearance.icons : {} } }; } catch { return { roleId:'', appearance:{ wallpaper:'', icons:{} } }; } }
  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function read(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } }
  function localDateKey(value) { const date = value instanceof Date ? value : new Date(`${value}T12:00:00`); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function shiftDateKey(value, offset) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + offset); return localDateKey(date); }
  function calendarDayRecord(ownerId, dateKey = activeCalendarDate) { return read(calendarDaysKey, {})?.[ownerId]?.[dateKey] || null; }
  function saveCalendarDay(ownerId, dateKey, items, previous) { const all = read(calendarDaysKey, {}); all[ownerId] = all[ownerId] || {}; all[ownerId][dateKey] = { items, createdAt:previous?.createdAt || Date.now(), updatedAt:Date.now(), refreshCount:Number(previous?.refreshCount || 0) + 1 }; localStorage.setItem(calendarDaysKey, JSON.stringify(all)); }
  function calendarStatus(value) { const raw = String(value || '').toLowerCase(); if (/change|deviat|变更|改变|偏离|临时/.test(raw)) return 'changed'; if (/done|complete|已完成|已做|实际/.test(raw)) return 'done'; if (/doing|进行/.test(raw)) return 'doing'; return 'planned'; }
  function normalizeCalendarItem(item) { const time = eventTimes(item); return { ...item, start:time.start, end:time.end, date:time.end ? `${time.start}—${time.end}` : time.start, status:calendarStatus(item?.status) }; }
  function applyCalendarClock(items, dateKey) { const today = localDateKey(new Date()); const now = new Date(); const nowMinutes = now.getHours() * 60 + now.getMinutes(); return items.map(raw => { const item = normalizeCalendarItem(raw); if (item.status === 'changed') return item; const start = String(item.start || '').match(/^(\d{1,2}):(\d{2})$/); const end = String(item.end || '').match(/^(\d{1,2}):(\d{2})$/); const startMinutes = start ? Number(start[1]) * 60 + Number(start[2]) : null; const endMinutes = end ? Number(end[1]) * 60 + Number(end[2]) : null; if (dateKey < today) return { ...item, status:'done' }; if (dateKey > today) return { ...item, status:'planned' }; if (endMinutes !== null && endMinutes <= nowMinutes) return { ...item, status:'done' }; if (startMinutes !== null && endMinutes !== null && startMinutes <= nowMinutes && nowMinutes < endMinutes) return { ...item, status:'doing' }; return { ...item, status:'planned' }; }); }
  function mergeCalendarItems(existing, updates, dateKey) { const merged = existing.map(item => normalizeCalendarItem(item)); updates.forEach(raw => { const item = normalizeCalendarItem(raw); const index = merged.findIndex(old => old.start === item.start || (old.title && old.title === item.title)); if (index >= 0) merged[index] = { ...merged[index], ...item }; else merged.push(item); }); return applyCalendarClock(merged.sort((a,b) => String(a.start).localeCompare(String(b.start))), dateKey); }
  function calendarTimeMinutes(value) { const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/); return match ? Number(match[1]) * 60 + Number(match[2]) : null; }
  function calendarIsFullDay(items) {
    const rows = (Array.isArray(items) ? items : []).map(item => normalizeCalendarItem(item)).map(item => ({ start:calendarTimeMinutes(item.start), end:calendarTimeMinutes(item.end) })).filter(item => item.start !== null && item.end !== null && item.end > item.start).sort((a,b) => a.start - b.start);
    if (rows.length < 7 || rows[0].start > 11 * 60 || Math.max(...rows.map(item => item.end)) < 21 * 60) return false;
    let coveredUntil = rows[0].end;
    for (const row of rows.slice(1)) {
      // 早晨到夜间若仍有超过三小时的空白，就不能算作“全天日程”。
      if (row.start - coveredUntil > 3 * 60) return false;
      coveredUntil = Math.max(coveredUntil, row.end);
    }
    return true;
  }
  function uid(prefix = 'ta') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  const fetch = (input, init = {}) => {
    let next = init;
    try {
      const owner = role() || {};
      const chat = read(chatKey, {});
      const profileId = chat.chats?.[owner.id]?.profileId || '';
      const profile = (chat.profiles || []).find(item => item.id === profileId) || {};
      const payload = JSON.parse(init.body);
      const system = payload.messages?.find(item => item.role === 'system');
      if (system && window.IdealMachineRoleUserContext) {
        system.content = `${window.IdealMachineRoleUserContext(owner, profile)}\n\n${system.content}`;
        next = { ...init, body:JSON.stringify(payload) };
      }
    } catch {}
    return window.IdealMachineFetch ? window.IdealMachineFetch(input, { ...next, idealScope:'ta', timeout:next.timeout || 120000 }) : window.fetch(input, next);
  };
  // 关闭或离开 Ta 只隐藏页面，不取消正在进行的刷新；结果完成后仍会写入本地数据。
  function roles() { const data = read(chatKey, {}); return Array.isArray(data.contacts) ? data.contacts : []; }
  function role() { return roles().find(item => item.id === state.roleId) || roles()[0]; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function avatar(item) { return item?.avatar ? `<img src="${esc(item.avatar)}" alt="">` : esc((item?.nickname || item?.name || 'Ta').slice(0, 1)); }
  function icon(type) { const paths = { chat:'<path d="M8 10h32v22H19l-9 7v-7H8z"/><path d="M15 17h18M15 23h12"/>', forum:'<path d="M9 11h30v21H19l-8 6v-6H9z"/><path d="M16 18h16M16 24h10"/>', calendar:'<rect x="10" y="11" width="28" height="27" rx="4"/><path d="M16 8v7M32 8v7M10 19h28M17 26h.01M24 26h.01M31 26h.01M17 32h.01M24 32h.01"/>', couple:'<path d="M24 38S8 28 8 17a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-14 21-14 21z"/>', music:'<path d="M31 10v22M31 10l9-2v21M31 32c0 4-4 7-8 7s-7-2-7-5 3-6 7-6 8 1 8 4zM40 29c0 4-4 7-8 7"/>', doubao:'<path d="M10 27c0-10 7-17 16-17s12 5 12 13c0 9-7 16-17 16H10z"/><path d="M18 23h.01M30 23h.01M18 30c3 3 7 3 10 0"/>', shop:'<path d="M10 20h28v19H10zM8 20l3-9h26l3 9M16 20v4M24 20v4M32 20v4M16 39V29h16v10"/>', wallet:'<path d="M8 14h30v25H8zM8 18h30M31 25h10v9H31zM35 29h.01"/>', beauty:'<path d="M24 7c2 8 5 11 13 13-8 2-11 5-13 13-2-8-5-11-13-13 8-2 11-5 13-13zM37 31c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7z"/>' }; return `<svg viewBox="0 0 48 48" aria-hidden="true">${paths[type] || ''}</svg>`; }
  const ios17IconKeys = new Set(['liaotian','luntan','xiangce','rili','qinglvkongjian','yinyue','doubao','gouwu','qianbao','meihua','debate','fanfic','magazine']);
  function defaultIosIcon(key, fallback = '') { return ios17IconKeys.has(key) ? `<img class="ta-default-ios-icon" src="assets/icons/default-ios17/${key}.png" alt="">` : fallback; }
  function cloneAppearance(value=state.appearance) { return { wallpaper:value?.wallpaper || '', icons:{...(value?.icons || {})} }; }
  function appearanceValue() { if(appearanceOpen&&!appearanceDraft)appearanceDraft=cloneAppearance();return appearanceOpen ? appearanceDraft : state.appearance; }
  function desktopIcon(key, iconName) { const source=appearanceValue()?.icons?.[key]; return source ? `<img src="${esc(source)}" alt="">` : defaultIosIcon(key,icon(iconName)); }
  function sourceButtons(target) { return `<label><input type="file" accept="image/*" data-ta-image-file="${target}">从本地选择</label><button type="button" data-ta-album-pick="${target}">从相册选择</button><button type="button" data-ta-url-pick="${target}">使用图片链接</button>`; }
  function appearanceSheet() { const draft=appearanceValue();return `<div class="ta-appearance-sheet"><div class="ta-role-backdrop" data-ta-appearance-close></div><section><header><div><small>BEAUTIFY</small><h2>美化</h2></div><button type="button" data-ta-appearance-close>×</button></header><div class="ta-appearance-wallpaper"><span>页面壁纸</span><div class="ta-wallpaper-preview" style="${draft.wallpaper ? `background-image:url('${esc(draft.wallpaper)}')` : ''}"></div><div class="ta-image-sources">${sourceButtons('wallpaper')}</div><button class="ta-wallpaper-default" type="button" data-ta-wallpaper-reset ${draft.wallpaper ? '' : 'disabled'}>恢复默认</button></div><div class="ta-appearance-icons"><div class="ta-appearance-section-head"><span>App 图标</span><div><button type="button" data-ta-appearance-save>保存更改</button><button type="button" data-ta-icons-modify>选择图标</button><button type="button" data-ta-icons-reset ${Object.keys(draft.icons).length ? '' : 'disabled'}>恢复默认</button></div></div><p class="ta-icon-swap-tip">依次点击两个图标即可交换位置</p><div class="ta-icon-custom-grid">${desktopApps.map(([key,name,iconName,color]) => `<article><button class="ta-icon-swap-preview${appearanceSwapKey===key?' is-selected':''}" style="--ta-icon-color:${color}" type="button" data-ta-icon-swap="${key}" aria-label="选择${esc(name)}图标进行交换">${desktopIcon(key,iconName)}</button><b>${name}</b></article>`).join('')}</div></div></section></div>`; }
  async function setAppearanceImage(target, source) { let value=String(source || '').trim(); if(!value)return; if(value.startsWith('idb:image:')&&window.IdealMachineGetImage)value=await window.IdealMachineGetImage(value); if(!value)return window.alert('图片读取失败，请换一张图片重试。'); const draft=appearanceValue();if(target==='wallpaper')draft.wallpaper=value;else draft.icons[target.replace(/^icon:/,'')]=value;render(); }
  function openAppearanceUrl(target) { app.insertAdjacentHTML('beforeend', `<div class="ta-url-sheet"><div class="ta-role-backdrop" data-ta-url-close></div><section><b>使用图片链接</b><input type="url" data-ta-url-input data-ta-url-target="${esc(target)}" placeholder="https://example.com/image.jpg"><div><button type="button" data-ta-url-close>取消</button><button type="button" data-ta-url-submit>应用</button></div></section></div>`); app.querySelector('[data-ta-url-input]')?.focus(); }
  function emptyIconTargets() { const icons=appearanceValue().icons;return desktopApps.map(item=>item[0]).filter(key=>!icons[key]); }
  async function applyIconBatch(sources) { const draft=appearanceValue();const targets=emptyIconTargets();for(let index=0;index<Math.min(targets.length,sources.length);index+=1){let value=sources[index];if(value?.startsWith?.('idb:image:')&&window.IdealMachineGetImage)value=await window.IdealMachineGetImage(value);if(value)draft.icons[targets[index]]=value;}render(); }
  function openIconSourcePicker() { const draft=appearanceValue();app.insertAdjacentHTML('beforeend', `<div class="ta-icon-source-sheet" data-ta-icon-source-sheet><div class="ta-role-backdrop" data-ta-icon-source-close></div><section><header><div><small>CHANGE ICONS</small><h2>修改图标</h2></div><button type="button" data-ta-icon-source-close>×</button></header><p>再次选择图片时，只会按顺序填入还没有修改过的 App，不会覆盖已有图标。</p><div class="ta-icon-source-options"><label><input type="file" accept="image/*" multiple data-ta-icon-batch-local><b>⌁</b><span>本地图片</span><small>支持多选</small></label><button type="button" data-ta-icon-batch-album><b>▧</b><span>相册 App</span><small>支持多选</small></button><button type="button" data-ta-icon-batch-url><b>↗</b><span>图片链接</span><small>按 App 填写</small></button></div><div class="ta-icon-url-panel" hidden><div class="ta-icon-url-list">${desktopApps.map(([key,name])=>`<label><span>${esc(name)} App 链接</span><input type="url" data-ta-icon-url-field="${key}" value="${/^https?:\/\//i.test(draft.icons[key]||'')?esc(draft.icons[key]):''}" placeholder="https://…"></label>`).join('')}</div><button type="button" data-ta-icon-url-apply>应用到预览</button></div></section></div>`); }
  function openWallpaperSourcePicker() { app.insertAdjacentHTML('beforeend', `<div class="ta-icon-source-sheet"><div class="ta-role-backdrop" data-ta-icon-source-close></div><section><header><div><small>WALLPAPER</small><h2>选择壁纸</h2></div><button type="button" data-ta-icon-source-close>×</button></header><p>选择壁纸图片来源，应用后立即保存。</p><div class="ta-icon-source-options"><label><input type="file" accept="image/*" data-ta-image-file="wallpaper"><b>⌁</b><span>本地图片</span><small>从设备选择</small></label><button type="button" data-ta-album-pick="wallpaper"><b>▧</b><span>相册 App</span><small>从图库选择</small></button><button type="button" data-ta-url-pick="wallpaper"><b>↗</b><span>图片链接</span><small>使用 URL</small></button></div></section></div>`); }
  function rolePicker(list) { return `<div class="ta-role-sheet"><div class="ta-role-backdrop" data-ta-role-close></div><section><header><div><small>PHONE OWNER</small><h2>选择角色</h2></div><button type="button" data-ta-role-close>×</button></header><div class="ta-role-list">${list.length ? list.map(item => `<button type="button" data-ta-role="${esc(item.id)}"><i>${avatar(item)}</i><span><b>${esc(item.nickname || item.name)}</b><small>${esc(item.identity || '角色')}</small></span><em>${item.id === state.roleId ? '✓' : '›'}</em></button>`).join('') : '<p class="ta-empty">还没有角色，请先到聊天 App 添加角色。</p>'}</div></section></div>`; }
  function textList(items, empty) { return items.length ? items.map(item => `<article class="ta-role-card"><b>${esc(item.title || item.name || item.nickname || '未命名')}</b><p>${esc(item.text || item.note || item.content || item.artist || '')}</p><small>${esc(item.time || item.date || '')}</small></article>`).join('') : `<p class="ta-role-empty">${empty}</p>`; }
  function readDoubaoHistory() { return read('ideal-machine-ta-doubao-history', {}); }
  function saveDoubaoHistory(ownerId, snapshotData) { const rows = Array.isArray(snapshotData?.doubao) ? snapshotData.doubao : []; if (!ownerId || !rows.length) return; const all = readDoubaoHistory(); all[ownerId] = Array.isArray(all[ownerId]) ? all[ownerId] : []; all[ownerId].unshift({ id:uid('doubao-history'), savedAt:Date.now(), title:String(snapshotData?.doubaoTitle || '').trim(), doubao:rows }); all[ownerId] = all[ownerId].slice(0, 30); localStorage.setItem('ideal-machine-ta-doubao-history', JSON.stringify(all)); }
  function doubaoStylePrompt() { return window.IdealMachineDoubaoStyle || '你是豆包，一个温和、聪明、克制而有陪伴感的内置 AI。表达自然，不端着，不使用夸张的网络套话；先理解问题，再给出清晰、实际的建议。面对情绪问题要有共情，面对学习和生活问题要具体可执行，面对爱情问题要尊重双方感受，不替任何人武断做决定。'; }
  function compactDoubaoTopic(value) {
    let title = String(value || '').replace(/[“”"'，,。！!？?：:；;、\s]/g, '').replace(/^(?:咨询|询问|查找|寻找|推荐|关于)/, '').trim();
    if (title.length < 5) title += '相关话题';
    return title;
  }
  function summarizeDoubaoQuestion(value) {
    const raw = String(value || '').replace(/^(?:CHARACTER|USER|角色本人|角色)\s*[:：|｜-]\s*/i, '').replace(/[“”"']/g, '').replace(/\s+/g, ' ').trim();
    if (!raw) return '未命名聊天内容';
    const musicName = raw.match(/([\u4e00-\u9fa5A-Za-z0-9·]{2,8})的(?:歌|歌曲|音乐)/)?.[1];
    if (musicName && !/适合|喜欢|好听|一些|什么|推荐|有没有/.test(musicName)) return compactDoubaoTopic(`${musicName}音乐歌单`);
    if (/音乐|歌曲|歌单|听歌|music|song/i.test(raw)) {
      if (/睡|夜|晚/.test(raw)) return '深夜氛围歌单';
      if (/运动|跑步|健身/.test(raw)) return '运动活力歌单';
      if (/学习|工作|专注/.test(raw)) return '专注学习歌单';
      return '近期音乐偏好';
    }
    if (/吵架|争吵|冷战/.test(raw)) return /朋友|同学|室友/.test(raw) ? '朋友争吵困扰' : '感情争吵困扰';
    if (/表白|告白/.test(raw)) return '感情表白烦恼';
    if (/失恋|分手/.test(raw)) return '失恋情绪困扰';
    if (/焦虑|紧张|压力/.test(raw)) return '近期焦虑压力';
    if (/考试|复习/.test(raw)) return '考试复习计划';
    if (/论文/.test(raw)) return '论文写作思路';
    if (/作业|课程|学习/.test(raw)) return '近期学习难题';
    if (/面试/.test(raw)) return '求职面试准备';
    if (/简历/.test(raw)) return '个人简历修改';
    if (/旅行|旅游|景点|路线/.test(raw)) return '近期旅行计划';
    const topic = raw.replace(/^(?:你能不能|你可以|可以|能不能|能否|麻烦你|请你|请|帮我|我想问问|我想问|想问问|想问|请问|有没有)/, '').replace(/(?:怎么办|怎么做|怎么样|有什么建议|可以吗|行不行|好不好|吗|呢|呀|啊)[？?。！!]*$/g, '').replace(/[^\u4e00-\u9fa5A-Za-z0-9·]/g, '');
    return compactDoubaoTopic(topic || '未命名聊天内容');
  }
  function parseDoubaoTitle(value) {
    const match = String(value || '').match(/^\s*(?:TITLE|标题|主题)\s*[:：|｜-]\s*(.+)$/im);
    const title = String(match?.[1] || '').replace(/[“”"'，,。！!？?：:；;、]/g, '').replace(/\s+/g, '').replace(/^(?:咨询|询问|查找|寻找|推荐|关于)/, '').trim();
    return title.length >= 5 ? title : '';
  }
  function doubaoHistoryTitle(history) { const saved = String(history?.title || history?.doubaoTitle || '').replace(/[“”"'，,。！!？?：:；;、]/g, '').replace(/\s+/g, '').trim(); const vague = /^(?:日常问题解答|日常聊天话题|温柔情绪疏导|实用学习建议|轻松饮食建议|实用职场建议|轻松旅行计划)$/; if (saved.length >= 5 && !/^(?:咨询|询问|查找|寻找|推荐|关于)/.test(saved) && !vague.test(saved)) return saved; const rows = Array.isArray(history?.doubao) ? history.doubao : []; const question = rows.find((item, index) => item?.role === 'user' || (!item?.role && index % 2 === 0)) || rows[0]; return summarizeDoubaoQuestion(question?.text || question?.content || question?.note || ''); }
  function roleDoubao(owner, snapshotData) {
    const histories = readDoubaoHistory()[owner.id] || [];
    const viewing = selectedDoubaoHistory >= 0 ? histories[selectedDoubaoHistory] : snapshotData;
    const stored = Array.isArray(viewing?.doubao) ? viewing.doubao : [];
    // 角色手机只能展示角色自己的豆包记录，不能混入当前用户在豆包 App 的聊天。
    const source = stored;
    const rows = source.map((item, index) => {
      const explicitRole = item.role || item.senderRole || item.authorType;
      const label = String(item.title || item.name || item.sender || item.author || '');
      const assistant = explicitRole === 'assistant' || explicitRole === 'character' || /豆包|assistant|ai/i.test(label) || (!explicitRole && !label && index % 2 === 1);
      return { role: assistant ? 'assistant' : 'user', content: item.content || item.text || item.note || '' };
    }).filter(item => item.content);
      const rendered = rows.map(item => `<article class="doubao-message ${item.role === 'user' ? 'is-user' : 'is-assistant'}"><p>${formatRoleDoubaoText(item.content)}</p>${item.role === 'assistant' ? '<footer class="doubao-answer-actions ta-role-doubao-actions"><button type="button" disabled aria-label="复制">' + doubaoActionIcon('copy') + '</button><button type="button" disabled aria-label="朗读">' + doubaoActionIcon('voice') + '</button><button type="button" disabled aria-label="喜欢">' + doubaoActionIcon('like') + '</button><button type="button" disabled aria-label="不喜欢">' + doubaoActionIcon('dislike') + '</button><button type="button" disabled aria-label="分享">' + doubaoActionIcon('share') + '</button><button type="button" disabled aria-label="刷新">' + doubaoActionIcon('retry') + '</button></footer>' : ''}</article>`).join('');
    const chatData = read(chatKey, {});
    const currentChat = chatData.chats?.[owner.id] || {};
    const profile = (chatData.profiles || []).find(item => item.id === currentChat.profileId);
    const userName = owner.nickname || owner.name || '角色';
    if (doubaoHistoryOpen) queueMicrotask(() => histories.forEach((history, index) => { const title = app.querySelector(`[data-ta-doubao-history-item="${index}"] b`); if (title) title.textContent = doubaoHistoryTitle(history); }));
    const historyPanel = doubaoHistoryOpen ? `<div class="ta-doubao-history-layer"><div class="ta-doubao-history-backdrop" data-ta-doubao-history-close></div><section class="ta-doubao-history-panel"><header><div><small>CHAT HISTORY</small><h2>历史记录</h2></div><button type="button" data-ta-doubao-history-close>×</button></header><main>${histories.length ? `${selectedDoubaoHistory >= 0 ? '<button type="button" data-ta-doubao-history-current><span><b>返回最新记录</b><small>当前正在使用的聊天</small></span><i>›</i></button>' : ''}${histories.map((item, index) => `<button type="button" data-ta-doubao-history-item="${index}"><span><b>${new Date(item.savedAt || Date.now()).toLocaleString('zh-CN')}</b><small>${item.doubao?.length || 0} 条消息</small></span><i>›</i></button>`).join('')}` : '<p class="ta-doubao-history-empty">还没有更早的聊天记录。</p>'}</main></section></div>` : '';
    return `<section class="doubao-page ta-role-doubao-page"><header class="doubao-header"><button class="doubao-menu-button" data-ta-doubao-history type="button" aria-label="查看历史记录"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 13h34M7 24h34M7 35h34"/></svg></button><div class="doubao-chat-title"><p>AI 生成可能有误 注意核实</p></div><div class="doubao-header-tools"><button class="${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-doubao-refresh aria-label="刷新角色豆包记录" ${refreshing ? 'disabled' : ''}>↻</button><button class="ta-doubao-close" type="button" data-ta-doubao-back aria-label="返回 TA 手机主页">×</button></div></header><main class="doubao-main"><div class="doubao-messages">${rendered || '<div class="ta-doubao-empty">角色还没有和豆包聊天记录。</div>'}</div></main><div class="doubao-quick-wrap"><div class="doubao-quick-list"><button type="button" disabled>快速</button><button type="button" disabled>拍题答疑</button><button type="button" disabled>帮我写作</button><button type="button" disabled>AI 创作</button></div></div><div class="doubao-composer ta-doubao-readonly-composer"><div class="doubao-composer-fields"><textarea rows="1" placeholder="${esc(userName)}正在使用豆包…" disabled></textarea></div><button type="button" disabled aria-label="发送">＋</button></div>${historyPanel}</section>`;
  }
  function doubaoActionIcon(type) { return `<img src="assets/ui/doubao-action-${type}.jpeg" alt="">`; }
  function formatRoleDoubaoText(value) { return esc(value).replace(/\n/g, '<br>'); }
  function parseApiJSON(value) { const clean = String(value || '').replace(/```json|```/gi, '').trim(); try { return JSON.parse(clean); } catch {} const match = clean.match(/\{[\s\S]*\}/); if (!match) throw new Error('API 返回的内容不是完整 JSON'); let text = ''; let quoted = false; let escaped = false; for (const char of match[0]) { if (escaped) { text += char; escaped = false; continue; } if (char === '\\' && quoted) { text += char; escaped = true; continue; } if (char === '"') { text += char; quoted = !quoted; continue; } if (quoted && char === '\n') { text += '\\n'; continue; } if (quoted && char === '\r') { continue; } if (quoted && char === '\t') { text += '\\t'; continue; } text += char; } try { return JSON.parse(text.replace(/,\s*([}\]])/g, '$1')); } catch { throw new Error('API 返回的 JSON 不完整或格式错误'); } }
  function chatTarget(owner, target) { const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {}; const profile = (chat.profiles || []).find(item => item.id === current.profileId); if (target === 'user') return { id:'user', name:profile?.nickname || profile?.realName || '绑定用户', avatar:profile?.avatar || '', kind:'user', messages:current.messages || [] }; const npcs = npcCache(owner); const item = npcs[Number(target.replace('npc:', ''))]; return item ? { ...item, id:target, name:item.name || 'NPC', avatar:item.avatar || '', kind:'npc', identity:item.identity || 'NPC', reason:item.reason || '', messages:Array.isArray(item.messages) ? item.messages : [] } : null; }
  function taChatBubbleBody(message) {
    if (message?.recalled) return `<span class="ta-chat-recalled">${esc(message.text || '撤回了一条消息')}</span>`;
    if (message?.type === 'image' && message.text) return `<img src="${esc(message.text)}" alt="图片">`;
    if (message?.type === 'voice') return `<span>◖ ${esc(message.text || '')}</span>`;
    return `<span>${esc(message?.text || message?.content || '')}</span>`;
  }
  function roleConversation(owner, target) {
    const contact = chatTarget(owner, target); if (!contact) return roleContent('liaotian', owner);
    const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {}; const settings = current.settings || {};
    const messages = contact.messages || [];
    const bubbleStyle = `--ta-owner-bubble:${esc(settings.characterBubbleColor || '#ffffff')};--ta-owner-text:${esc(settings.characterBubbleTextColor || '#111111')};--ta-other-bubble:${esc(settings.userBubbleColor || '#222222')};--ta-other-text:${esc(settings.userBubbleTextColor || '#ffffff')}`;
    const rows = messages.map(item => {
      const ownerMessage = contact.kind === 'user' ? item.role === 'character' : /^(?:character|owner|角色|角色本人)$/i.test(String(item.role || item.senderRole || ''));
      const sender = ownerMessage ? owner : contact;
      const stamp = settings.hideTimestamp ? '' : `<small>${esc(item.time || '')}</small>`;
      const type = item.type === 'image' ? ' is-image' : '';
      return `<article class="ta-chat-message ${ownerMessage ? 'is-owner' : 'is-other'}${type}"><div class="ta-chat-message-line"><i>${avatar(sender)}</i><div class="ta-chat-bubble">${taChatBubbleBody(item)}</div>${stamp}</div></article>`;
    }).join('');
    queueMicrotask(() => { const messageList = app.querySelector('[data-ta-chat-scroll]'); if (messageList) messageList.scrollTop = messageList.scrollHeight; });
    return `<section class="ta-role-conversation" style="${bubbleStyle}"><header class="ta-role-conversation-header"><button type="button" data-ta-chat-list>‹</button><div><b>${esc(contact.name)}</b><small>${esc(contact.kind === 'user' ? '绑定用户' : contact.identity || 'NPC')}</small></div><button class="ta-chat-refresh-button ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-chat-refresh aria-label="刷新聊天" ${refreshing ? 'disabled' : ''}>↻</button><i>${avatar(contact)}</i></header><main data-ta-chat-scroll>${rows || `<div class="ta-chat-empty"><i>${avatar(contact)}</i><h2>${esc(contact.name)}</h2><p>${contact.kind === 'npc' ? '刷新聊天后，会生成角色与这位联系人的对话。' : '还没有和这个联系人开始聊天。'}</p></div>`}</main><footer><span>角色视角 · 只读查看</span></footer></section>`;
  }
  function enabledWorldbookEntries(book) { return (book?.entries || []).filter(item => item.enabled !== false); }
  function worldbook(owner) { const data = read('ideal-machine-worldbooks', {}); const book = (data.local || []).find(item => item.id === owner.worldbook); return book ? { ...book, entries: enabledWorldbookEntries(book) } : book; }
  function npcCache(owner) {
    const cached = read('ideal-machine-ta-npcs', {})[owner.id] || [];
    if (cached.length || !owner?.worldbook) return cached;
    const analysis = read('ideal-machine-worldbook-analyses', {})[owner.worldbook];
    const roleNames = [owner.name, owner.nickname].filter(Boolean);
    return (Array.isArray(analysis?.npcs) ? analysis.npcs : []).filter(npc => npc?.name && !roleNames.includes(npc.name)).map(npc => {
      const link = (analysis.relations || []).find(item => roleNames.includes(item.source) && item.target === npc.name || roleNames.includes(item.target) && item.source === npc.name);
      return { name:npc.name, identity:npc.identity || 'NPC', personality:npc.personality || '', motivation:npc.motivation || '', reason:link?.relation || npc.relationToRole || '', relationDescription:link?.description || '', fixed:true, sourceBookId:owner.worldbook, messages:[] };
    });
  }
  function snapshot(owner) { return read('ideal-machine-ta-snapshots', {})[owner.id] || {}; }
  async function refreshPhone(owner) { if (refreshing) return; const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('worldbook') || window.IdealMachineAPI?.getModel?.('chat'); if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。'); const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {}; const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner); refreshing = true; render(); try { const prompt = `请刷新角色“${owner.nickname || owner.name}”手机中的七个 App 内容。根据角色设定、绑定用户和局部世界书生成自然、具体、彼此一致的内容。只返回 JSON，不要 Markdown，格式为：{"npcs":[{"name":"","identity":"","reason":""}],"forum":[{"title":"","text":"","time":""}],"calendar":[{"title":"","text":"","date":""}],"couple":[{"title":"","text":"","date":""}],"music":[{"title":"","text":"","artist":""}],"doubao":[{"role":"user或assistant","text":""}],"shopping":[{"title":"","text":"","price":""}]}。豆包数组是角色本人和豆包的真实聊天顺序：role=user 代表角色本人向豆包提问，role=assistant 代表豆包回答。不要编造与世界书完全无关的重要人物；没有内容的数组返回空数组。\n角色设定：${owner.details || owner.signature || '暂无'}\n绑定用户：${profile?.persona || profile?.nickname || '暂无'}\n局部世界书：${book ? (book.entries || []).map(item => `【${item.name}】${item.content}`).join('\n') : '未绑定局部世界书'}\n已有聊天摘要：${(current.messages || []).slice(-8).map(item => item.text || item.content || '').join('；') || '暂无'}`; const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({model, temperature:.8, messages:[{role:'system',content:'你是角色手机内容刷新器，只返回合法 JSON。'},{role:'user',content:prompt}]}) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi,'').trim(); const result = JSON.parse(raw); const previous = read('ideal-machine-ta-snapshots', {})[owner.id]; saveDoubaoHistory(owner.id, previous); const all = read('ideal-machine-ta-snapshots', {}); all[owner.id] = result; localStorage.setItem('ideal-machine-ta-snapshots', JSON.stringify(all)); const npcs = read('ideal-machine-ta-npcs', {}); npcs[owner.id] = Array.isArray(result.npcs) ? result.npcs : []; localStorage.setItem('ideal-machine-ta-npcs', JSON.stringify(npcs)); } catch (error) { window.alert(`刷新角色手机失败：${error.message}`); } finally { refreshing = false; render(); } }
  async function refreshDoubaoChat(owner) { if (refreshing) return; const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat'); if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。'); const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {}; const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner); refreshing = true; render(); try { const bookText = book ? (book.entries || []).map(item => `【${item.name}】${item.content}`).join('\n').slice(-6000) : '未绑定局部世界书'; const recentText = (current.messages || []).slice(-6).map(item => item.text || item.content || '').join('；') || '暂无'; const prompt = `请模拟角色“${owner.nickname || owner.name}”正在使用豆包。只返回 JSON：{"doubao":[{"role":"user或assistant","text":"消息内容"}]}。role=user 是角色本人，role=assistant 是豆包。生成 1—3 轮真实、简洁、长短自然的聊天，符合角色设定和世界书，不要提及 AI、系统或提示词。\n角色设定：${String(owner.details || owner.signature || '暂无').slice(0,3000)}\n绑定用户设定：${String(profile?.persona || profile?.nickname || '暂无').slice(0,1500)}\n局部世界书：${bookText}\n角色最近聊天：${recentText}`; const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({model, temperature:.82, max_tokens:600, stream:false, messages:[{role:'system',content:'你是角色手机里的豆包聊天记录生成器，只返回合法 JSON。'},{role:'user',content:prompt}]}) }); if (response.status === 429) throw new Error('接口已接通，但当前触发了限流（429）。请等待几十秒后再刷新，或检查服务商的额度和并发限制。'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi,'').trim(); const result = JSON.parse(raw); const dialogue = Array.isArray(result.doubao) ? result.doubao.filter(item => item && item.text).map(item => ({ role:item.role === 'assistant' ? 'assistant' : 'user', text:String(item.text) })) : []; if (!dialogue.length) throw new Error('API 没有返回有效聊天记录'); const all = read('ideal-machine-ta-snapshots', {}); const previous = all[owner.id]; saveDoubaoHistory(owner.id, previous); all[owner.id] = { ...(previous || {}), doubao:dialogue }; localStorage.setItem('ideal-machine-ta-snapshots', JSON.stringify(all)); } catch (error) { const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? `接口在 120 秒内没有返回（${model}），请检查接口地址、网络和模型服务状态。` : error.message; window.alert(`刷新角色豆包失败：${reason}`); } finally { refreshing = false; render(); } }
  async function refreshSelectedApp(owner, key) { if (refreshing) return; const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat'); if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。'); const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {}; const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner); const labels = { calendar:'角色今天的日程安排', music:'角色最近听的音乐和收藏', doubao:'角色正在使用豆包的聊天记录', shopping:'角色最近浏览、购买或想买的东西' }; const schemas = { calendar:'{"calendar":[{"title":"行程标题","text":"具体安排","date":"日期或时间"}]}', music:'{"music":[{"title":"歌曲名","text":"角色为什么听或收藏","artist":"歌手"}]}', doubao:'{"doubao":[{"role":"user或assistant","text":"消息内容"}]}', shopping:'{"shopping":[{"title":"商品名","text":"购买或想买的原因","price":"价格"}]}' }; refreshing = true; refreshPickerOpen = false; render(); try { const prompt = `请只生成${labels[key]}，不要生成其他 App 内容。只返回 JSON，不要 Markdown，格式为：${schemas[key]}。内容必须符合角色设定、当前日期和局部世界书，具体自然，不要提及 AI、系统、提示词或你在生成手机内容。${key === 'calendar' ? '日历必须是角色本人一天内真实可能发生的行程，按时间顺序排列，不能写成泛泛的待办清单。' : ''}${key === 'doubao' ? 'role=user 是角色本人，role=assistant 是豆包；消息交替出现，生成 1—3 轮，短句和稍长句自然混合。' : ''}\n角色：${owner.nickname || owner.name}\n角色设定：${String(owner.details || owner.signature || '暂无').slice(0,3000)}\n绑定用户设定：${String(profile?.persona || profile?.nickname || '暂无').slice(0,1200)}\n局部世界书：${book ? (book.entries || []).map(item => `【${item.name}】${item.content}`).join('\n').slice(-5000) : '未绑定局部世界书'}\n最近聊天：${(current.messages || []).slice(-5).map(item => item.text || item.content || '').join('；') || '暂无'}`; const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({model, temperature:.78, max_tokens:key === 'doubao' ? 600 : 450, stream:false, messages:[{role:'system',content:'你是角色手机 App 内容生成器，只返回合法 JSON。'},{role:'user',content:prompt}]}) }); if (response.status === 429) throw new Error('接口已接通，但当前触发了限流（429）。请稍后再试，或检查服务商额度和并发限制。'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi,'').trim(); const result = JSON.parse(raw); if (!Array.isArray(result[key])) throw new Error('API 返回的数据格式不正确'); const all = read('ideal-machine-ta-snapshots', {}); const previous = all[owner.id] || {}; if (key === 'doubao') saveDoubaoHistory(owner.id, previous); all[owner.id] = { ...previous, [key]:result[key] }; localStorage.setItem('ideal-machine-ta-snapshots', JSON.stringify(all)); if (key === 'doubao') { selectedDoubaoHistory = -1; doubaoHistoryOpen = false; } } catch (error) { const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? `接口在 120 秒内没有返回（${model}），请检查接口地址、网络和模型服务状态。` : error.message; window.alert(`刷新角色${labels[key]}失败：${reason}`); } finally { refreshing = false; render(); } }
  async function refreshSelectedApps(owner, keys) { for (const key of keys) await refreshSelectedApp(owner, key); selectedRefreshApps.clear(); }
  async function analyzeNpcs(owner) { if (npcBusy) return; const book = worldbook(owner); if (!book) return window.alert('这个角色还没有绑定局部世界书。'); const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('worldbook') || window.IdealMachineAPI?.getModel?.('chat'); if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。'); npcBusy = true; render(); try { const prompt = `请分析角色“${owner.nickname || owner.name}”绑定的局部世界书，提取其中与角色有关、可能出现在角色手机聊天列表里的 NPC。只返回 JSON 数组，每项格式为 {"name":"NPC名称","identity":"身份","reason":"与角色的关系或出现依据"}。不要编造世界书没有依据的重要人物。\n角色设定：${owner.details || owner.signature || '暂无'}\n局部世界书：${(book.entries || []).map(item => `【${item.name}】${item.content}`).join('\n')}`; const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({model, temperature:.35, messages:[{role:'system',content:'你是角色手机联系人分析器，只输出合法 JSON。'},{role:'user',content:prompt}]}) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi,'').trim(); const parsed = JSON.parse(raw); const cache = read('ideal-machine-ta-npcs', {}); cache[owner.id] = Array.isArray(parsed) ? parsed : []; localStorage.setItem('ideal-machine-ta-npcs', JSON.stringify(cache)); } catch (error) { window.alert(`NPC 分析失败：${error.message}`); } finally { npcBusy = false; render(); } }
  function apiResponseText(data) {
    const message = data?.choices?.[0]?.message || {};
    return String(message.content || message.reasoning_content || data?.output_text || data?.choices?.[0]?.text || '').trim();
  }
  function parseDoubaoContent(value) {
    const source = String(value || '').replace(/```(?:json)?|```/gi, '').trim();
    try {
      const parsed = parseApiJSON(source);
      if (Array.isArray(parsed?.doubao) && parsed.doubao.length) return parsed.doubao;
    } catch {}
    const rows = [];
    const fragment = /["']?role["']?\s*:\s*["'](user|assistant)["'][\s\S]*?["']?text["']?\s*:\s*"((?:\\.|[^"\\])*)"/gi;
    let match;
    while ((match = fragment.exec(source))) {
      let text = match[2];
      try { text = JSON.parse(`"${text}"`); } catch { text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"'); }
      if (text.trim()) rows.push({ role:match[1].toLowerCase(), text:text.trim() });
    }
    if (rows.length) return rows;
    source.split(/\r?\n/).forEach(line => {
      const clean = line.replace(/^\s*(?:[-*•>]\s*)?/, '').trim();
      const labeled = clean.match(/^(角色|角色本人|character|本人|用户|user|豆包|doubao|assistant|ai)\s*[:：|｜-]\s*(.+)$/i);
      if (!labeled?.[2]?.trim()) return;
      rows.push({ role:/豆包|doubao|assistant|ai/i.test(labeled[1]) ? 'assistant' : 'user', text:labeled[2].replace(/^["“”']+|["“”']+$/g, '').trim() });
    });
    if (rows.length) return rows;
    if (/^\s*[\[{]/.test(source)) throw new Error('API 返回内容被截断，请重新刷新');
    const plain = source.replace(/^\s*[\[{]+|[\]}]+\s*$/g, '').trim();
    if (plain) return [{ role:'assistant', text:plain }];
    throw new Error('API 没有返回可识别的豆包聊天内容');
  }
  function normalizeDoubaoRounds(rows) {
    const result = []; let expected = 'user';
    (Array.isArray(rows) ? rows : []).forEach(item => {
      const role = item?.role === 'assistant' ? 'assistant' : 'user';
      const text = String(item?.text || item?.content || '').trim();
      if (!text || role !== expected) return;
      result.push({ role, text }); expected = expected === 'user' ? 'assistant' : 'user';
    });
    if (result.at(-1)?.role === 'user') result.pop();
    return result;
  }
  function protocolParts(line) {
    const clean = String(line || '').replace(/^\s*(?:[-*•>]\s*)?/, '').trim();
    const parts = clean.split(/\s*[｜|]\s*/).map(item => item.trim());
    return parts.length > 1 ? parts : [];
  }
  function parseTaListContent(key, value) {
    try { const parsed = parseApiJSON(value); if (Array.isArray(parsed?.[key]) && parsed[key].length) return parsed; } catch {}
    const rows = [];
    String(value || '').replace(/```(?:json)?|```/gi, '').split(/\r?\n/).forEach(line => {
      const parts = protocolParts(line); if (parts.length < 4) return;
      const label = parts.shift().toUpperCase();
      if (key === 'calendar' && /^(?:CALENDAR|CALENDAR_UPDATE|日历|行程|日程更新)$/.test(label)) { const [start, end, rawStatus, title, ...text] = parts; if (title) rows.push({ start, end, date:`${start}—${end}`, status:calendarStatus(rawStatus), title, text:text.join('｜') }); }
      if (key === 'music' && /^(?:MUSIC|音乐|歌曲)$/.test(label)) { const [artist, title, playCount, ...mood] = parts; if (title) rows.push({ artist, title, playCount, text:mood.join('｜') }); }
      if (key === 'shopping' && /^(?:SHOPPING|SHOP|购物|商品)$/.test(label)) { const typed=!/^[¥￥\d]/.test(parts[0]);const type=typed?parts.shift():'普通购物';const [price, title, status, ...purpose] = parts; if (title) rows.push({ type, price, title, status, text:purpose.join('｜') }); }
      if (key === 'wallet' && /^(?:WALLET|钱包|账单)$/.test(label)) { const [type, amount, title, time, ...note] = parts; if (title) rows.push({ type:/收入|income|in/i.test(type)?'income':'expense', amount, title, time, text:note.join('｜') }); }
    });
    if (!rows.length && key === 'calendar' && /(?:NO_CHANGE|没有变化|无变化)/i.test(String(value || ''))) return { calendar:[], noChange:true };
    if (!rows.length) throw new Error('API 没有返回可识别的内容，请重新刷新');
    return { [key]:rows };
  }
  function parseRoleChatContent(value, existing) {
    try { const parsed = parseApiJSON(value); if (Array.isArray(parsed?.npcs) && parsed.npcs.length) return parsed; } catch {}
    const byName = new Map((Array.isArray(existing) ? existing : []).map(item => [String(item.name || '').trim(), { ...item, messages:[] }]));
    const ensure = name => { const key = String(name || '').trim(); if (!key) return null; if (!byName.has(key)) byName.set(key, { name:key, identity:'NPC', reason:'', messages:[] }); return byName.get(key); };
    String(value || '').replace(/```(?:json)?|```/gi, '').split(/\r?\n/).forEach(line => {
      const parts = protocolParts(line); if (parts.length < 2) return;
      const label = parts.shift().toUpperCase();
      if (/^(?:CONTACT|联系人)$/.test(label)) { const [name, identity, ...reason] = parts; const npc = ensure(name); if (npc) { npc.identity = identity || npc.identity; npc.reason = reason.join('｜') || npc.reason; } return; }
      if (/^(?:OWNER_MESSAGE|CHARACTER|角色消息)$/.test(label)) { const [name, time, ...text] = parts; const npc = ensure(name); const content = text.join('｜').trim(); if (npc && content) npc.messages.push({ role:'character', time, text:content }); return; }
      if (/^(?:NPC_MESSAGE|NPC消息)$/.test(label)) { const [name, time, ...text] = parts; const npc = ensure(name); const content = text.join('｜').trim(); if (npc && content) npc.messages.push({ role:'npc', time, text:content }); }
    });
    const npcs = [...byName.values()].filter(item => item.messages?.length);
    if (!npcs.length) throw new Error('API 没有返回可识别的 NPC 聊天，请重新刷新');
    return { npcs };
  }
  async function refreshRoleChats(owner) {
    if (refreshing) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。');
    const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {};
    const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner);
    const existing = npcCache(owner);
    const fixedContacts = existing.filter(item => item.fixed && (!owner.worldbook || !item.sourceBookId || item.sourceBookId === owner.worldbook));
    const prompt = `生成角色“${owner.nickname || owner.name}”手机聊天 App 中，角色与 NPC 联系人的聊天记录。现实用户与角色的聊天由程序直接同步，禁止把现实用户写进 NPC 列表，也不要生成角色与现实用户的对话。
不要返回 JSON。每位 NPC 先输出一行联系人资料，再输出聊天，严格使用下面三种格式：
CONTACT｜NPC姓名｜NPC身份｜与角色的关系
OWNER_MESSAGE｜NPC姓名｜时间｜角色发送的消息
NPC_MESSAGE｜NPC姓名｜时间｜NPC发送的消息
每条记录单独一行，不要编号、Markdown、代码块、解释或其他文字。${fixedContacts.length ? `下面列出的 ${fixedContacts.length} 位是世界书分析后锁定的固定联系人。必须逐一为他们生成聊天，姓名保持完全一致，禁止新增、删除、替换或改名。` : '根据角色设定、世界书及已有 NPC，选取 2—5 位确实与角色有关的 NPC。'}每位生成 4—10 条有来有回的自然聊天；OWNER_MESSAGE 永远代表手机主人“${owner.nickname || owner.name}”，NPC_MESSAGE 代表对应 NPC；双方严格交替，内容符合各自身份和关系，口语化、长短自然，不要写旁白、动作、系统说明或提示词。
角色设定：${String(owner.details || owner.signature || owner.identity || '暂无').slice(0,3500)}
绑定用户资料（仅作背景，不能作为 NPC）：${String(profile?.persona || profile?.nickname || '暂无').slice(0,1000)}
局部世界书：${book ? (book.entries || []).filter(item => item.enabled !== false).map(item => `【${item.name}】${item.content}`).join('\n').slice(-6500) : '暂无'}
${fixedContacts.length ? '固定 NPC' : '已有 NPC'}：${existing.length ? existing.map(item => `${item.name}（${item.identity || item.reason || '关系未知'}）`).join('；') : '暂无'}`;
    refreshing = true; refreshPickerOpen = false; render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({ model, temperature:.76, max_tokens:3000, stream:false, messages:[{ role:'system', content:'你是角色手机聊天记录生成器。只按指定的 CONTACT、OWNER_MESSAGE、NPC_MESSAGE 逐行格式输出，不要返回 JSON、Markdown 或解释。' }, { role:'user', content:prompt }] }) });
      if (response.status === 429) throw new Error('接口已接通，但当前触发了限流（429），请稍后再试。');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json(); const result = parseRoleChatContent(apiResponseText(data), existing);
      if (!Array.isArray(result.npcs)) throw new Error('API 返回的 NPC 聊天格式不正确');
      const previousByName = new Map(existing.map(item => [String(item.name || '').trim(), item]));
      const generated = result.npcs.filter(item => item && String(item.name || '').trim()).map(item => {
        const previous = previousByName.get(String(item.name).trim()) || {};
        const messages = (Array.isArray(item.messages) ? item.messages : []).map(message => ({
          role:/^(?:character|owner|角色|角色本人)$/i.test(String(message?.role || '')) ? 'character' : 'npc',
          text:String(message?.text || message?.content || '').trim(),
          time:String(message?.time || '').trim()
        })).filter(message => message.text);
        return { ...previous, name:String(item.name).trim(), identity:String(item.identity || previous.identity || 'NPC').trim(), reason:String(item.reason || previous.reason || '').trim(), messages };
      });
      if (!generated.length) throw new Error('API 没有生成有效的 NPC 聊天');
      const generatedByName = new Map(generated.map(item => [item.name, item]));
      const contacts = fixedContacts.length ? fixedContacts.map(item => generatedByName.has(item.name) ? { ...item, ...generatedByName.get(item.name), name:item.name, fixed:true, sourceBookId:item.sourceBookId } : item) : generated;
      const cache = read('ideal-machine-ta-npcs', {}); cache[owner.id] = contacts;
      localStorage.setItem('ideal-machine-ta-npcs', JSON.stringify(cache));
    } catch (error) {
      const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? `接口在 120 秒内没有返回（${model}）。` : error.message;
      window.alert(`刷新角色聊天失败：${reason}`);
    } finally { refreshing = false; render(); }
  }
  async function completeWalletRows(owner, config, model, rows) {
    let merged=Array.isArray(rows)?rows.slice():[];
    for(let attempt=0;attempt<2&&merged.length<8;attempt+=1){
      try{
        const existing=merged.map(item=>`${item.type==='income'?'收入':'支出'}｜${item.amount}｜${item.title}｜${item.time||''}`).join('\n')||'暂无有效流水';
        const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{timeout:120000,method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.68,max_tokens:1200,stream:false,messages:[{role:'system',content:'你负责补齐角色钱包流水。只输出 WALLET 逐行记录，不要 JSON、Markdown 或解释。'},{role:'user',content:`角色“${owner.nickname||owner.name}”的钱包流水数量不足。请补充 ${Math.max(8-merged.length,4)} 笔不重复记录，至少包含收入和支出两类。每行严格使用“WALLET｜收入或支出｜金额｜流水名称｜时间｜具体说明”。金额使用 ¥0.00 格式，内容符合角色设定。\n角色设定：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,3000)}\n已有流水，不得重复：\n${existing}`} ]})});
        if(!response.ok)continue;
        const data=await response.json();const added=parseTaListContent('wallet',apiResponseText(data)).wallet||[];
        merged=[...merged,...added].filter((item,index,list)=>list.findIndex(other=>`${other.type}|${other.amount}|${other.title}|${other.time}`===`${item.type}|${item.amount}|${item.title}|${item.time}`)===index);
      }catch{}
    }
    const fallback=[
      {type:'income',amount:'¥1200.00',title:'账户余额转入',time:'本月',text:'用于近期生活开销'},
      {type:'income',amount:'¥300.00',title:'临时收入',time:'本周',text:'符合角色日常的小额收入'},
      {type:'expense',amount:'¥36.00',title:'日常餐饮',time:'今天',text:'一笔普通餐饮消费'},
      {type:'expense',amount:'¥18.00',title:'交通出行',time:'昨天',text:'近期交通费用'},
      {type:'expense',amount:'¥52.00',title:'生活用品',time:'本周',text:'补充日常用品'},
      {type:'expense',amount:'¥28.00',title:'饮品零食',time:'本周',text:'随手购买的饮品和零食'},
      {type:'expense',amount:'¥66.00',title:'外卖订单',time:'本周',text:'一次日常外卖消费'},
      {type:'expense',amount:'¥45.00',title:'休闲娱乐',time:'近期',text:'符合角色生活的休闲开销'}
    ];
    for(const item of fallback){if(merged.length>=8&&merged.some(row=>row.type==='income')&&merged.some(row=>row.type==='expense'))break;if(!merged.some(row=>row.title===item.title))merged.push(item);}
    return merged;
  }
  // 单 App 刷新优先使用稳定的逐行协议，同时兼容旧版 JSON 返回。
  async function refreshSelectedApp(owner, key) {
    if (key === 'chat') return refreshRoleChats(owner);
    if (refreshing) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。');
    const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {};
    const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner);
    const labels = { calendar:'今天的日程安排', music:'最近听的音乐和收藏', doubao:'正在使用豆包的聊天记录', shopping:'最近浏览、购买或想买的东西', wallet:'最近的收入、开销和钱包流水' };
    const bookText = book ? (book.entries || []).map(item => `【${item.name}】${item.content}`).join('\n').slice(-5000) : '未绑定局部世界书';
    const todayKey = localDateKey(new Date());
    const existingCalendarDay = key === 'calendar' ? calendarDayRecord(owner.id, todayKey) : null;
    const currentSnapshot = key === 'calendar' ? snapshot(owner) : {};
    const legacyCalendar = key === 'calendar' && currentSnapshot.calendarDate === todayKey ? (currentSnapshot.calendar || []) : [];
    const existingCalendar = existingCalendarDay?.items?.length ? existingCalendarDay.items : legacyCalendar;
    const calendarNeedsCompletion = key === 'calendar' && existingCalendar.length > 0 && !calendarIsFullDay(existingCalendar);
    const calendarContext = existingCalendar.length ? existingCalendar.map(item => { const row = normalizeCalendarItem(item); return `${row.start}—${row.end}｜${row.status}｜${row.title}｜${row.text || ''}`; }).join('\n') : '';
    const nowLabel = new Intl.DateTimeFormat('zh-CN', { dateStyle:'full', timeStyle:'short' }).format(new Date());
    const lineRules = {
      calendar:calendarNeedsCompletion ? `现有日程没有覆盖完整一整天，本次刷新必须先补齐，不能只做状态更新。保留所有原有项目，不得删除或整体改写；补充缺少的早晨、白天、晚间时段以及明显空档，使合并后的日程至少有 7—10 项，从合理起床时间一直覆盖到晚上 21:00 以后，并包含三餐、通勤或休息。新增项目及需要修正的项目都严格使用“CALENDAR_UPDATE｜开始时间｜结束时间｜PLANNED、DONE或CHANGED｜事件标题｜具体做什么”。当前时间之前用 DONE，未来用 PLANNED，偏离原计划用 CHANGED。绝对不能输出 NO_CHANGE。现有不完整日程如下：\n${calendarContext}` : existingCalendar.length ? `这是当天第 ${Number(existingCalendarDay?.refreshCount || 1) + 1} 次刷新，现有日程已经覆盖完整一整天，绝对禁止重写整份日程。根据当前时间、角色近期聊天和世界书判断原计划的实际进展，只输出确实需要修改的项目：已经到结束时间的预计事项改为实际完成内容；如果角色临时改变计划或实际行为偏离预计，写明真正发生的事。尚未到时间且没有变化的预计事项禁止输出、必须原样保留。每个变更严格使用“CALENDAR_UPDATE｜原开始时间｜原结束时间｜DONE或CHANGED｜更新后的事件标题｜实际发生或改变后的具体事情”。若完全无需改变，只输出 NO_CHANGE。原日程如下：\n${calendarContext}` : '这是今天第一次生成，只允许建立这一份完整全天计划。不要返回 JSON。每行严格使用“CALENDAR｜开始时间｜结束时间｜PLANNED或DONE｜行程标题｜具体做什么”。开始和结束都必须使用 HH:MM。生成从合理起床时间到睡觉、覆盖角色当天一整天的 7—10 段连续或基本连续行程，最晚必须覆盖到晚上 21:00 以后，按时间顺序排列；当前时间之前已经发生的项目用 DONE，未来项目用 PLANNED；必须包含三餐、必要通勤或休息，不能只写三四件大事。',
      music:'不要返回 JSON。每行严格使用“MUSIC｜真实歌手｜真实歌曲名｜听过次数｜听这首歌时的具体心情”。生成 6—10 首最近播放歌单；歌曲和歌手必须是真实存在且对应正确，听过次数写成“12次”这种格式，歌曲选择符合角色身份、性格与近况。',
      shopping:'不要返回 JSON。每行严格使用“SHOPPING｜普通购物、花市或外卖｜价格｜商品完整名称｜订单状态｜角色买它的具体用途”。一次生成 5—8 件不同记录，价格写成“¥39.90”。是否出现花市、外卖以及各自数量，必须由角色的成年人身份、人设、生活习惯和近况自行决定；不适合就完全不要出现。花市仅限明确成年的角色，只写合法非露骨的成人情趣用品；不得涉及未成年人。普通商品要像真实商城订单，外卖要像真实餐饮订单。',
      wallet:'不要返回 JSON。每行严格使用“WALLET｜收入或支出｜金额｜流水名称｜时间｜具体说明”。必须生成 10—16 条彼此独立的近期钱包流水，不能只写一笔总账；至少包含 2 笔合理收入和 6 笔不同支出，每笔都要有独立金额、名称和时间。金额写成“¥39.90”；收入来源和消费内容必须符合角色职业、经济状况、普通购物、花市与外卖记录，收支要合理。'
    };
    const outputRule = key === 'doubao' ? `不要返回 JSON。第一行必须是“TITLE｜内容概括”。标题字数可根据内容需要适当增加，使用一句简洁的主题短语，必须让人一眼看出角色和豆包具体聊了什么人、什么事或什么需求，不能只写“日常问题解答、聊天话题、情绪疏导”等空泛分类，也不能照抄角色整句原话；禁止以“咨询、询问、查找、寻找、推荐、关于”开头。例如聊周杰伦的歌写“TITLE｜适合深夜听的周杰伦经典歌单”，聊考试复习写“TITLE｜下周考试的复习时间安排”，聊和朋友吵架写“TITLE｜和朋友吵架后的和好办法”。之后每条消息单独一行，只能使用“CHARACTER｜消息”或“DOUBAO｜消息”格式，不要编号、解释、代码块和其他文字。CHARACTER 只能是角色“${owner.nickname || owner.name}”本人，DOUBAO 是豆包；现实用户绝不能作为发言者出现。必须连续生成 4—6 个完整来回，共 8—12 条消息；严格由 CHARACTER 开始并交替回复，后一轮自然承接前一轮。角色消息保持口语化和相对简短；豆包每次回复写 2—4 句，内容比角色消息更长、更具体，但不要写成大段论文。绝对不能少于 4 轮。豆包的每次回复都必须保持温和、聪明、克制、有陪伴感：先理解角色真正的问题，再给清晰且实际的回应；不端着，不使用夸张网络套话。` : `${lineRules[key]}每条记录单独一行，只能使用指定格式，不要编号、解释、Markdown、代码块或其他文字。`;
    const prompt = `只生成角色手机里的${labels[key]}，不要生成其他内容。${outputRule}内容要符合角色设定和世界书，不要提及 AI、系统或提示词。${key === 'calendar' ? `当前准确日期和时间：${nowLabel}。日程所属日期：${todayKey}。` : ''}\n手机主人/豆包聊天发言者：${owner.nickname || owner.name}\n角色设定：${String(owner.details || owner.signature || '暂无').slice(0,3000)}\n绑定用户设定（只用于理解角色经历，不能代替角色发言）：${String(profile?.persona || profile?.nickname || '暂无').slice(0,1200)}\n局部世界书：${bookText}\n角色与用户最近的聊天背景（只能影响角色想聊什么，不能让用户进入豆包对话）：${(current.messages || []).slice(-5).map(item => item.text || item.content || '').join('；') || '暂无'}`;
    refreshing = true; refreshPickerOpen = false; render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({ model, temperature:.72, max_tokens:key === 'doubao' ? 2600 : key === 'calendar' ? 1800 : 1200, stream:false, messages:[{ role:'system', content:key === 'doubao' ? `${doubaoStylePrompt()} 当前任务是模拟角色“${owner.nickname || owner.name}”本人使用豆包。第一行输出 TITLE｜内容概括，标题用一句简洁短语准确概括具体聊天对象、事情或需求，不限制为 10 个字，也不能使用空泛分类；之后只输出 CHARACTER｜消息 和 DOUBAO｜消息。CHARACTER 永远是该角色，不是现实用户；DOUBAO 的所有回复必须完整遵守上述豆包语气。至少 4 个完整来回、至少 8 条消息，严格交替。` : '你是角色手机 App 内容生成器。只按用户指定的逐行格式返回内容，不要返回 JSON、Markdown 或解释。' }, { role:'user', content:prompt }] }) });
      if (response.status === 429) throw new Error('接口已接通，但当前触发了限流（429），请稍后再试。');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json(); const content = apiResponseText(data); const result = key === 'doubao' ? { doubao:normalizeDoubaoRounds(parseDoubaoContent(content)), doubaoTitle:parseDoubaoTitle(content) } : parseTaListContent(key, content);
      if (key === 'doubao' && result.doubao.length < 8) {
        const missingRounds = 4 - Math.floor(result.doubao.length / 2);
        const existing = result.doubao.map(item => `${item.role === 'user' ? 'CHARACTER' : 'DOUBAO'}｜${item.text}`).join('\n');
        const followPrompt = `下面是一段角色“${owner.nickname || owner.name}”本人和豆包尚未完成的聊天：\n${existing || '还没有有效内容'}\n请从下一条 CHARACTER 消息开始，继续补充 ${missingRounds} 个完整来回。CHARACTER 只能是角色本人，不能是现实用户。只输出新增消息，每行只能是 CHARACTER｜消息 或 DOUBAO｜消息，严格交替，不要 JSON、编号、解释或代码块。话题必须自然承接。角色消息简短口语化，DOUBAO 每次回复 2—4 句并且更具体。`;
        const followResponse = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({ model, temperature:.72, max_tokens:1800, stream:false, messages:[{ role:'system', content:`${doubaoStylePrompt()} 补全角色“${owner.nickname || owner.name}”本人和豆包的连续聊天，只输出 CHARACTER｜消息 和 DOUBAO｜消息；现实用户不得发言。DOUBAO 的每条回复都要保持上述豆包语气。` }, { role:'user', content:followPrompt }] }) });
        if (!followResponse.ok) throw new Error(`补生成失败：HTTP ${followResponse.status}`);
        const followData = await followResponse.json();
        result.doubao = normalizeDoubaoRounds([...result.doubao, ...parseDoubaoContent(apiResponseText(followData))]);
      }
      if (key === 'doubao' && result.doubao.length < 8) throw new Error('API 没有生成满 4 轮聊天，请重新刷新');
      if (key === 'doubao' && !result.doubaoTitle) result.doubaoTitle = summarizeDoubaoQuestion(result.doubao.find(item => item.role === 'user')?.text || '');
      if (!Array.isArray(result[key])) throw new Error('API 返回的数据格式不正确');
      if (key === 'wallet' && (result.wallet.length < 8 || !result.wallet.some(item => item.type === 'income') || !result.wallet.some(item => item.type === 'expense'))) result.wallet=await completeWalletRows(owner,config,model,result.wallet);
      const all = read('ideal-machine-ta-snapshots', {}); const previous = all[owner.id] || {};
      if (key === 'doubao') saveDoubaoHistory(owner.id, previous);
      let savedRows = result[key];
      if (key === 'calendar') {
        if (!existingCalendar.length && !result.calendar.length) throw new Error('API 没有生成今天的完整日程');
        savedRows = existingCalendar.length ? mergeCalendarItems(existingCalendar, result.calendar, todayKey) : applyCalendarClock(result.calendar, todayKey);
        let completionAttempt = 0;
        while (!calendarIsFullDay(savedRows) && completionAttempt < 2) {
          completionAttempt += 1;
          const partial = savedRows.map(item => `${item.start}—${item.end}｜${item.status}｜${item.title}｜${item.text || ''}`).join('\n');
          const completionPrompt = `下面是角色“${owner.nickname || owner.name}”在 ${todayKey} 的不完整日程。请结合角色设定、身份、世界书和当前时间，只补充缺少的时段，使合并后形成真正符合角色生活的一整天行程，从合理起床时间覆盖到晚上 21:00 以后。不要使用通用模板，不要把所有角色都安排成相同的起床、早餐、上班模式；已有项目必须保留，新增项目不能与已有时间重叠。每行严格使用“CALENDAR_UPDATE｜开始时间｜结束时间｜PLANNED、DONE或CHANGED｜事件标题｜具体做什么”，不要 JSON、Markdown、编号或解释。当前时间：${nowLabel}\n角色设定：${String(owner.details || owner.signature || owner.identity || '暂无').slice(0,3500)}\n局部世界书：${bookText}\n现有日程：\n${partial}`;
          const completionResponse = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { timeout:120000, method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${config.key}`}, body:JSON.stringify({ model, temperature:.68, max_tokens:1800, stream:false, messages:[{ role:'system', content:'你负责根据角色资料补齐当天缺失的日程，只输出 CALENDAR_UPDATE 逐行记录，不得套用固定日程模板。' }, { role:'user', content:completionPrompt }] }) });
          if (completionResponse.status === 429) throw new Error('补齐全天日程时触发了限流（429），请稍后再刷新。');
          if (!completionResponse.ok) throw new Error(`补齐全天日程失败：HTTP ${completionResponse.status}`);
          const completionData = await completionResponse.json();
          const completionResult = parseTaListContent('calendar', apiResponseText(completionData));
          savedRows = mergeCalendarItems(savedRows, completionResult.calendar, todayKey);
        }
        if (!calendarIsFullDay(savedRows)) throw new Error('API 补充后的日程仍未覆盖完整一天，请再次刷新。');
        saveCalendarDay(owner.id, todayKey, savedRows, existingCalendarDay);
      }
      all[owner.id] = { ...previous, [key]: savedRows, ...(key === 'calendar' ? { calendarDate:todayKey } : {}), ...(key === 'doubao' ? { doubaoTitle:result.doubaoTitle } : {}) }; localStorage.setItem('ideal-machine-ta-snapshots', JSON.stringify(all));
      if (key === 'doubao') { selectedDoubaoHistory = -1; doubaoHistoryOpen = false; }
    } catch (error) { const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? `接口在 120 秒内没有返回（${model}）。` : error.message; window.alert(`刷新角色${labels[key]}失败：${reason}`); }
    finally { refreshing = false; render(); }
  }
  // 最终容错解析：兼容尾逗号、重复逗号、单引号和未加引号的英文属性名。
  function parseApiJSON(value) {
    const clean = String(value || '').replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('API 返回的内容不是完整 JSON');
    let source = clean.slice(start, end + 1);
    let normalized = ''; let quoted = false; let escaped = false;
    for (const char of source) {
      if (escaped) { normalized += char; escaped = false; continue; }
      if (char === '\\' && quoted) { normalized += char; escaped = true; continue; }
      if (char === '"') { normalized += char; quoted = !quoted; continue; }
      if (quoted && char === '\n') { normalized += '\\n'; continue; }
      if (quoted && char === '\r') continue;
      if (quoted && char === '\t') { normalized += '\\t'; continue; }
      normalized += char;
    }
    const attempts = [normalized, normalized.replace(/([{,]\s*)([A-Za-z_][\w-]*)\s*:/g, '$1"$2":').replace(/,\s*,+/g, ',').replace(/,\s*([}\]])/g, '$1'), normalized.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, text) => `"${text.replace(/"/g, '\\"')}"`).replace(/([{,]\s*)([A-Za-z_][\w-]*)\s*:/g, '$1"$2":').replace(/,\s*,+/g, ',').replace(/,\s*([}\]])/g, '$1')];
    for (const attempt of attempts) { try { return JSON.parse(attempt); } catch {} }
    throw new Error('API 返回的 JSON 格式错误，请重新刷新');
  }
  // 豆包页顶部刷新与手机首页的“豆包”刷新共用同一套容错解析和保存逻辑。
  async function refreshDoubaoChat(owner) { return refreshSelectedApp(owner, 'doubao'); }
  function calendarRows(owner, dateKey = activeCalendarDate) { const saved = calendarDayRecord(owner.id, dateKey); if (saved?.items?.length) return saved.items; if (dateKey !== localDateKey(new Date())) return []; const fresh = snapshot(owner); if (fresh.calendarDate && fresh.calendarDate !== dateKey) return []; return fresh.calendar?.length ? fresh.calendar : read('ideal-machine-calendar-events', []).filter(item => item.contactId === owner.id || item.authorId === owner.id); }
  function musicRows(owner) { const fresh = snapshot(owner); const music = read('ideal-machine-music', {}); return fresh.music?.length ? fresh.music : music.library?.[owner.id] || []; }
  function shoppingRows(owner) { const fresh = snapshot(owner); const shopping = read('ideal-machine-shopping', {}); return fresh.shopping?.length ? fresh.shopping : [...(shopping.orders?.[owner.id] || []), ...(shopping.wishes?.[owner.id] || [])]; }
  function walletRows(owner) { return Array.isArray(snapshot(owner).wallet) ? snapshot(owner).wallet : []; }
  function walletCardNumber(ownerKey) { const storage='ideal-machine-wallet-card-numbers';let cards={};try{cards=JSON.parse(localStorage.getItem(storage)||'{}')||{};}catch{}const key=`role:${ownerKey}`;if(cards[key])return cards[key];const used=new Set(Object.values(cards));let number='';do{const bytes=new Uint8Array(12);crypto.getRandomValues(bytes);number=`62${[...bytes].map(value=>String(value%10)).join('').slice(0,14)}`;}while(used.has(number));cards[key]=number;localStorage.setItem(storage,JSON.stringify(cards));return number.replace(/(.{4})/g,'$1 ').trim(); }
  function eventTimes(item) {
    const source = String(item?.date || item?.time || '');
    const matched = source.match(/(\d{1,2}:\d{2})\s*(?:—|–|-|至|~)\s*(\d{1,2}:\d{2})/);
    return { start:String(item?.start || matched?.[1] || source || '待定'), end:String(item?.end || matched?.[2] || '').trim() };
  }
  function roleCalendar(owner) {
    const rows = calendarRows(owner, activeCalendarDate).map(item => normalizeCalendarItem(item));
    const date = new Date(`${activeCalendarDate}T12:00:00`);
    const dateLabel = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(date);
    const today = activeCalendarDate === localDateKey(new Date());
    const record = calendarDayRecord(owner.id, activeCalendarDate);
    const statusLabel = status => ({ planned:'预计', doing:'进行中', done:'已完成', changed:'有变动' }[status] || '预计');
    const timeline = rows.length ? `<div class="ta-day-timeline">${rows.map(item => { const time = eventTimes(item); return `<article class="is-${esc(item.status)}"><time><b>${esc(time.start)}</b>${time.end ? `<span>至</span><b>${esc(time.end)}</b>` : ''}</time><i></i><div><span class="ta-calendar-status">${statusLabel(item.status)}</span><b>${esc(item.title || item.name || '日程')}</b><p>${esc(item.text || item.note || item.content || '暂无具体安排')}</p></div></article>`; }).join('')}</div>` : `<div class="ta-calendar-empty"><b>${today ? '今天还没有生成日程' : '这一天没有保存的日程'}</b><p>${today ? '点击右上角刷新，建立今天唯一的一份完整全天计划。' : '每天的记录会按日期保存在这里。'}</p></div>`;
    return `<section class="ta-day-plan"><header><div class="ta-calendar-date-nav"><button type="button" data-ta-calendar-nav="-1" aria-label="上一天">‹ 上一天</button><div><small>${today ? 'TODAY' : activeCalendarDate} · 全天行程</small><h2>${esc(dateLabel)}</h2></div><button type="button" data-ta-calendar-nav="1" aria-label="下一天">下一天 ›</button></div><p>未来行程显示预计；再次刷新只核对已到时间或临时改变的事项。${record?.refreshCount ? ` 当天已核对 ${record.refreshCount} 次。` : ''}</p></header>${timeline}</section>`;
  }
  function roleMusic(owner) {
    const rows = musicRows(owner);
    if (!rows.length) return '<p class="ta-role-empty">角色最近还没有听歌记录。</p>';
    return `<section class="ta-recent-playlist"><header><div><small>RECENTLY PLAYED</small><h2>${esc(owner.nickname || owner.name)} 最近在听</h2></div><span>${rows.length} 首</span></header><div>${rows.map((item, index) => { const count = String(item.playCount || item.plays || item.count || '1次'); return `<button type="button" data-ta-detail="music" data-ta-detail-index="${index}"><em>${index + 1}</em><i>${icon('music')}</i><span><b>${esc(item.title || item.name || '未知歌曲')}</b><small>${esc(item.artist || '未知歌手')}</small></span><strong>听了 ${esc(/次$/.test(count) ? count : `${count}次`)}</strong><u>›</u></button>`; }).join('')}</div></section>`;
  }
  function roleShopping(owner) {
    const rows = shoppingRows(owner);
    if (!rows.length) return '<p class="ta-role-empty">角色最近还没有订单或想买的商品。</p>';
    return `<section class="ta-order-list"><header><small>RECENT ORDERS</small><h2>最近订单</h2><p>点击商品可以查看角色买来做什么。</p></header>${rows.map((item, index) => { const price = String(item.price || '价格未知'); return `<article><div class="ta-order-shop"><b>${esc(item.type || '普通购物')}</b><span>${esc(item.status || '已签收')}</span></div><button type="button" data-ta-detail="shopping" data-ta-detail-index="${index}"><i>${icon('shop')}</i><span><b>${esc(item.title || item.name || '未命名商品')}</b><small>${esc(item.status || '查看订单详情')}</small></span><strong>${esc(/^[¥￥]/.test(price) || !/^\d/.test(price) ? price : `¥${price}`)}</strong><em>›</em></button></article>`; }).join('')}</section>`;
  }
  function roleWallet(owner) {
    const rows=walletRows(owner);const signedAmount=item=>{const raw=String(item.amount||item.price||'0').replace(/[^\d.-]/g,'');const amount=Number(raw)||0;return item.type==='income'?amount:-amount;};const balance=rows.reduce((sum,item)=>sum+signedAmount(item),0);const income=rows.filter(item=>item.type==='income').reduce((sum,item)=>sum+Math.abs(signedAmount(item)),0);const expense=rows.filter(item=>item.type!=='income').reduce((sum,item)=>sum+Math.abs(signedAmount(item)),0);
    return `<section class="ta-wallet-page"><div class="ta-wallet-balance" data-card-number="${walletCardNumber(owner.id)}"><small>当前流水结余</small><strong>¥ ${balance.toFixed(2)}</strong><div><span>收入 ¥ ${income.toFixed(2)}</span><span>支出 ¥ ${expense.toFixed(2)}</span></div></div><header><small>RECENT ACTIVITY</small><h2>最近收支</h2></header><div class="ta-wallet-list">${rows.length?rows.map(item=>`<article class="is-${item.type==='income'?'income':'expense'}"><i>${item.type==='income'?'＋':'−'}</i><span><b>${esc(item.title||'钱包流水')}</b><small>${esc(item.time||item.text||'近期')}</small></span><strong>${item.type==='income'?'+':'−'}¥ ${Math.abs(signedAmount(item)).toFixed(2)}</strong></article>`).join(''):'<p class="ta-role-empty">角色的钱包还没有收支记录，点击右上角刷新生成。</p>'}</div></section>`;
  }
  function roleDetailSheet(owner) {
    if (!activeDetail) return '';
    const music = activeDetail.type === 'music';
    const item = (music ? musicRows(owner) : shoppingRows(owner))[activeDetail.index];
    if (!item) return '';
    const title = item.title || item.name || (music ? '未知歌曲' : '未命名商品');
    const body = item.mood || item.purpose || item.text || item.note || item.content || (music ? '没有留下当时的心情。' : '没有留下购买用途。');
    const rawCount = String(item.playCount || item.plays || item.count || '1次');
    const subtitle = music ? `${item.artist || '未知歌手'} · 听了 ${/次$/.test(rawCount) ? rawCount : `${rawCount}次`}` : `${item.status || '订单记录'} · ${item.price || '价格未知'}`;
    return `<div class="ta-item-detail-layer"><button type="button" class="ta-item-detail-backdrop" data-ta-detail-close aria-label="关闭详情"></button><section class="ta-item-detail-sheet"><header><i>${icon(music ? 'music' : 'shop')}</i><div><small>${music ? 'LISTENING MOOD' : 'PURCHASE PURPOSE'}</small><h2>${esc(title)}</h2><span>${esc(subtitle)}</span></div><button type="button" data-ta-detail-close aria-label="关闭">×</button></header><main><small>${music ? '角色听这首歌时的心情' : '角色买来做什么'}</small><p>${esc(body)}</p></main></section></div>`;
  }
  function roleContent(key, owner) {
    const chat = read(chatKey, {}); const name = owner.nickname || owner.name;
    if (key === 'liaotian') { const current = chat.chats?.[owner.id] || {}; const profile = (chat.profiles || []).find(item => item.id === current.profileId); const npcs = npcCache(owner); const entries = []; entries.push(`<button class="ta-chat-entry" type="button" data-ta-role-chat="user"><i>${avatar(profile)}</i><span><b>${esc(profile?.nickname || profile?.realName || '绑定用户')}</b><small>${esc(current.messages?.at(-1)?.text || current.messages?.at(-1)?.content || '暂无消息')}</small></span><em>›</em></button>`); npcs.forEach((item, index) => entries.push(`<button class="ta-chat-entry" type="button" data-ta-role-chat="npc:${index}"><i>${avatar(item)}</i><span><b>${esc(item.name || 'NPC')}</b><small>${esc(item.messages?.at(-1)?.text || item.identity || item.reason || '暂无消息')}</small></span><em>›</em></button>`)); return `<div class="ta-role-intro"><i>${avatar(owner)}</i><div><b>${esc(name)}</b><small>角色手机主人 · 聊天联系人</small></div></div><div class="ta-role-section-head"><b>联系人</b><button class="ta-chat-list-refresh ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-chat-refresh ${refreshing ? 'disabled' : ''}>${refreshing ? '刷新中…' : '刷新聊天'}</button></div><div class="ta-chat-entry-list">${entries.join('')}</div>`; }
    const fresh = snapshot(owner);
    if (key === 'luntan') { const posts = fresh.forum?.length ? fresh.forum : read('ideal-machine-forum', []).filter(item => item.ownerType === 'character' || item.owner === name || item.nickname === name); return textList(posts, '角色还没有发布论坛动态。'); }
    if (key === 'rili') return roleCalendar(owner);
    if (key === 'qinglvkongjian') { const couple = read('ideal-machine-couple', {}); const space = couple.spaces?.[owner.id] || couple; const rows = fresh.couple?.length ? fresh.couple : [...(space.memories || []).map(item => ({...item, title:'回忆 · '+item.title})), ...(space.wishes || []).map(item => ({...item, title:'愿望 · '+item.text}))]; return `<div class="ta-role-intro"><i>${avatar(owner)}</i><div><b>${esc(name)} 的情侣空间</b><small>角色视角 · 共同记录</small></div></div>${textList(rows, '情侣空间里还没有共同记录。')}`; }
    if (key === 'yinyue') return roleMusic(owner);
    if (key === 'doubao') return roleDoubao(owner, fresh);
    if (key === 'qianbao') return roleWallet(owner);
    return roleShopping(owner);
  }
  function roleApp(owner) {
    const meta = apps.find(item => item[0] === activeApp) || apps[0];
    if (activeApp === 'liaotian' && activeChatTarget) return roleConversation(owner, activeChatTarget);
    if (activeApp === 'doubao') return roleDoubao(owner, snapshot(owner));
    const pageRefreshKey = { rili:'calendar', yinyue:'music', gouwu:'shopping', qianbao:'wallet' }[activeApp];
    const refreshButton = activeApp === 'liaotian'
      ? `<button class="ta-app-header-refresh ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-chat-refresh aria-label="刷新聊天" ${refreshing ? 'disabled' : ''}>↻</button>`
      : pageRefreshKey ? `<button class="ta-app-header-refresh ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-page-refresh="${pageRefreshKey}" aria-label="刷新${meta[1]}" ${refreshing ? 'disabled' : ''}>↻</button>` : '';
    return `<section class="ta-role-app-page"><header class="ta-role-app-header"><button type="button" data-ta-home>‹</button><div><small>${esc(owner.nickname || owner.name)} 的手机</small><h1>${meta[1]}</h1></div>${refreshButton}</header><main class="ta-role-app-main"><div class="ta-role-perspective"><span>ROLE VIEW</span><b>正在查看 ${esc(owner.nickname || owner.name)} 的${meta[1]}</b><small>这是角色手机中的内容，不是用户视角</small></div>${roleContent(activeApp, owner)}</main>${roleDetailSheet(owner)}</section>`;
  }
  function reverseChecks(ownerId) { const all=read('ideal-machine-ta-reverse-checks',{});return Array.isArray(all[ownerId])?all[ownerId]:[]; }
  function reverseSuccessRate(ownerId) { const rates=read('ideal-machine-ta-reverse-rates',{});const value=Number(rates[ownerId]);return Number.isFinite(value)?Math.max(0,Math.min(100,value)):70; }
  function reverseRateSheet(owner) { const rate=reverseSuccessRate(owner.id);return `<div class="ta-reverse-rate-sheet"><div data-ta-reverse-rate-close></div><section><header><div><small>SUCCESS RATE</small><h2>反查成功概率</h2></div><button type="button" data-ta-reverse-rate-close>×</button></header><p>仅作用于 ${esc(owner.nickname||owner.name)}。成功率为 ${rate}%，被发现概率为 ${100-rate}%。</p><label><span>成功概率</span><input type="range" min="0" max="100" step="1" value="${rate}" data-ta-reverse-rate-range><output data-ta-reverse-rate-output>${rate}%</output></label><footer><button type="button" data-ta-reverse-rate-close>取消</button><button type="button" data-ta-reverse-rate-save>保存概率</button></footer></section></div>`; }
  function reverseSafeData(value,depth=0) { if(depth>8)return '[更深层记录]';if(value==null||typeof value==='number'||typeof value==='boolean')return value;if(typeof value==='string'){if(/^data:(?:image|audio|video)\//i.test(value))return '[媒体文件]';return value.slice(0,4000);}if(Array.isArray(value))return value.map(item=>reverseSafeData(item,depth+1));if(typeof value==='object'){const result={};Object.entries(value).forEach(([key,item])=>{if(/(?:api.?key|secret|password|token|authorization|session)/i.test(key))return;result[key]=reverseSafeData(item,depth+1);});return result;}return String(value); }
  function userPhoneEvidence(owner) {
    const chat=read(chatKey,{});const ownChat=chat.chats?.[owner.id]||{};const profileId=ownChat.profileId||'';const profile=(chat.profiles||[]).find(item=>item.id===profileId)||{};
    const conversations=(chat.contacts||[]).filter(contact=>contact.id!==owner.id&&chat.chats?.[contact.id]?.profileId===profileId).map(contact=>({contactId:contact.id,with:contact.nickname||contact.name,realName:contact.name||'',relationship:'用户与其他角色的聊天',isOtherRole:true,avatar:contact.avatar||'',userAvatar:profile.avatar||'',settings:{...(chat.chats[contact.id]?.settings||{})},messages:(chat.chats[contact.id]?.messages||[]).map(item=>({speaker:item.role==='user'?(profile.nickname||profile.realName||'用户'):(contact.nickname||contact.name||'对方'),speakerType:item.role==='user'?'user':'character',text:item.text||item.content||'',type:item.type||'text',time:item.time||item.createdAt||''}))}));
    const shopping=read('ideal-machine-shopping',{});const music=read('ideal-machine-music',{});const couple=read('ideal-machine-couple',{});const album=read('ideal-machine-album-v1',{});
    const albumView={...album,items:(Array.isArray(album.items)?album.items:[]).map(item=>({...item}))};const shoppingView={profileId,cart:shopping.carts?.[profileId]||[],orders:shopping.orders?.[profileId]||[],wishes:shopping.wishes?.[profileId]||[],gifts:shopping.gifts?.[profileId]||[],companion:shopping.companion?.[profileId]||'',payer:shopping.payers?.[profileId]||'',flowerMarket:shopping.privateModes?.[profileId]||false,productArchive:shopping.productArchive||[]};const musicView={profileId,current:music.current?.[profileId]||music.current||{},library:music.library?.[profileId]||[],rooms:music.rooms||{},neteaseProfile:read(`ideal-machine-netease-profile-${profileId}`,{})};
    const apps={聊天:{profileId,conversations},论坛:{feed:read('ideal-machine-forum',[]),discover:read('ideal-machine-forum-discover',[]),notices:read('ideal-machine-forum-notices',[]),profile:read('ideal-machine-forum-profile',{})},相册:albumView,日历:read('ideal-machine-calendar-events',[]),音乐:musicView,豆包:{messages:read('ideal-machine-doubao',[]),history:read('ideal-machine-doubao-history',[])},购物:shoppingView,情侣空间:couple.spaces?.[owner.id]||couple,辩论:read('ideal-machine-debates',{}),同人文:read('ideal-machine-fanfic',{}),杂志社:read('ideal-machine-magazine',{})};
    return {user:{id:profileId,name:profile.nickname||profile.realName||profile.name||'用户',realName:profile.realName||profile.name||'',persona:profile.persona||profile.details||'',avatar:profile.avatar||''},apps:reverseSafeData(apps),visualApps:{聊天:{conversations},相册:albumView}};
  }
  function saveReverseMessage(owner,text,checkId) { text=String(text||'').trim().replace(/[，,]+$/,'').trim();if(!text)return;let data;try{data=JSON.parse(localStorage.getItem(chatKey)||'{}');}catch{data={};}const chat=data.chats?.[owner.id];if(!chat)return;chat.messages=Array.isArray(chat.messages)?chat.messages:[];chat.messages.push({id:uid('reverse-reaction'),role:'character',type:'reverse-check-reaction',text,reverseCheckId:checkId,unread:true,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),createdAt:Date.now()});localStorage.setItem(chatKey,JSON.stringify(data)); }
  function parseReverseResult(value) { const findings=[];let summary='';let message='';String(value||'').replace(/```/g,'').split(/\r?\n/).forEach(line=>{const parts=protocolParts(line);if(!parts.length)return;const type=parts.shift().toUpperCase();if(type==='LOOK'&&parts.length>=4){const [appName,title,detail,...reaction]=parts;findings.push({app:appName,title,detail,reaction:reaction.join('｜')});}if(type==='FINAL')summary=parts.join('｜');if(type==='MESSAGE')message=parts.join('｜');});if(!findings.length)throw new Error('API 没有返回可识别的查岗过程');return {findings,summary:summary||findings.at(-1)?.reaction||'',message}; }
  async function runReverseCheck(owner) {
    if(reverseBusy)return;const config=window.IdealMachineAPI?.getConfig?.()||{};const model=window.IdealMachineAPI?.getModel?.('ta')||window.IdealMachineAPI?.getModel?.('chat');if(!config.endpoint||!config.key||!model)return window.alert('请先在设置中配置 AI 接口。');
    const evidence=userPhoneEvidence(owner);reverseBusy=true;render();try{const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{timeout:120000,method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.78,max_tokens:2200,stream:false,messages:[{role:'system',content:'你是情侣查岗剧情引擎。主角色始终可以参与当前剧情。角色正在未经用户提醒的情况下偷偷查看用户手机。严格遵守角色人设与关系，不美化越界行为，不替用户发言。如果手机记录中出现 NPC，只有已明确在世的 NPC 才能参与当前实时互动；已去世 NPC 只能作为历史记录被看到，不能发言或行动。只输出指定逐行格式。'},{role:'user',content:`角色：${owner.nickname||owner.name}\n角色设定：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,4000)}\n用户手机中当前存在的数据：${JSON.stringify(evidence).slice(0,18000)}\n请让角色自行决定打开哪些有实际内容的 App、按什么顺序查看以及是否继续深挖。花市私密订单、普通购物、外卖、聊天、论坛、音乐、日历和情侣空间都可能成为线索，但没有数据就不能捏造。生成 3—7 个查看步骤，每步严格使用“LOOK｜App 名称｜看到的项目标题｜实际看到的内容｜角色当下反应”。然后一行“FINAL｜角色查完后的整体情绪和决定”。最后一行“MESSAGE｜角色之后发给用户的一条自然消息”；如果角色按人设绝不会发消息，则 MESSAGE 后留空。不要 JSON、Markdown、旁白标题或解释。`} ]})});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();const result=parseReverseResult(apiResponseText(data));const check={id:uid('reverse-check'),createdAt:Date.now(),roleId:owner.id,...result};const all=read('ideal-machine-ta-reverse-checks',{});all[owner.id]=[check,...(Array.isArray(all[owner.id])?all[owner.id]:[])].slice(0,20);localStorage.setItem('ideal-machine-ta-reverse-checks',JSON.stringify(all));saveReverseMessage(owner,result.message,check.id);}catch(error){window.alert(`角色查手机失败：${error.message||'未知错误'}`);}finally{reverseBusy=false;if(app.classList.contains('is-open'))render();}
  }
  function reversePage(owner) { const checks=reverseChecks(owner.id);const latest=checks[0];return `<section class="ta-reverse-page"><header><button type="button" data-ta-reverse-close>‹</button><div><small>SECRET CHECK</small><h1>TA 看我</h1></div></header><main><div class="ta-reverse-hero"><i>${avatar(owner)}</i><span><small>本次查岗角色</small><b>${esc(owner.nickname||owner.name)}</b><p>TA 会自己决定查看哪些 App，不会提前弹出授权提示。</p></span><button type="button" data-ta-reverse-run ${reverseBusy?'disabled':''}>${reverseBusy?'正在后台查看…':'让 TA 偷偷查手机'}</button></div>${latest?`<section class="ta-reverse-result"><header><small>${new Date(latest.createdAt).toLocaleString('zh-CN')}</small><h2>最近一次查岗</h2></header><div>${latest.findings.map((item,index)=>`<article><i>${index+1}</i><span><small>${esc(item.app)}</small><b>${esc(item.title)}</b><p>${esc(item.detail)}</p><em>${esc(item.reaction)}</em></span></article>`).join('')}</div><footer><small>查完后的反应</small><p>${esc(latest.summary)}</p>${latest.message?`<b>随后发给你：${esc(latest.message)}</b>`:''}</footer></section>`:'<p class="ta-role-empty">还没有查岗记录。开始后，角色会依据自己的人设查看用户手机并留下真实反应。</p>'}</main></section>`; }
  function refreshPicker() { const options = [['chat','聊天','同步用户消息并生成 NPC 对话','liaotian'],['calendar','日历','角色今天的行程安排','rili'],['music','音乐','角色最近听歌与收藏','yinyue'],['doubao','豆包','角色和豆包的聊天记录','doubao'],['shopping','购物','角色的普通购物、花市和外卖记录','gouwu'],['wallet','钱包','角色近期的收入与开销','qianbao']]; const allSelected = selectedRefreshApps.size === options.length; return `<div class="ta-refresh-sheet"><div class="ta-refresh-backdrop" data-ta-refresh-close></div><section><header><div><small>REFRESH ROLE PHONE</small><h2>刷新哪些 App？</h2></div><button type="button" data-ta-refresh-close>×</button></header><button class="ta-refresh-select-all" type="button" data-ta-refresh-all><i class="${allSelected ? 'is-checked' : ''}">${allSelected ? '✓' : ''}</i><span>全选</span></button><main>${options.map(([key,name,description,appKey]) => `<button class="${selectedRefreshApps.has(key) ? 'is-selected' : ''}" type="button" data-ta-refresh-app="${key}"><i class="ta-refresh-builtin-icon">${defaultIosIcon(appKey,name.slice(0,1))}</i><span><b>${name}</b><small>${description}</small></span><em>${selectedRefreshApps.has(key) ? '✓' : ''}</em></button>`).join('')}</main><button class="ta-refresh-submit" type="button" data-ta-refresh-submit ${selectedRefreshApps.size ? '' : 'disabled'}>刷新选中的 ${selectedRefreshApps.size || ''} 个 App</button></section></div>`; }
  function syncRefreshPicker() { const sheet = app.querySelector('.ta-refresh-sheet'); if (!sheet) return; const keys = ['chat','calendar','music','doubao','shopping','wallet']; const allSelected = selectedRefreshApps.size === keys.length; const allIcon = sheet.querySelector('[data-ta-refresh-all] i'); if (allIcon) { allIcon.classList.toggle('is-checked', allSelected); allIcon.textContent = allSelected ? '✓' : ''; } sheet.querySelectorAll('[data-ta-refresh-app]').forEach(button => { const selected = selectedRefreshApps.has(button.dataset.taRefreshApp); button.classList.toggle('is-selected', selected); const mark = button.querySelector('em'); if (mark) mark.textContent = selected ? '✓' : ''; }); const submit = sheet.querySelector('[data-ta-refresh-submit]'); if (submit) { submit.disabled = !selectedRefreshApps.size; submit.textContent = `刷新选中的 ${selectedRefreshApps.size || ''} 个 App`; } }
  function render() { const list = roles(); const owner = role(); if (owner && owner.id !== state.roleId) { state.roleId = owner.id; saveState(); } const wallpaper=appearanceValue()?.wallpaper; app.innerHTML = reverseOpen && owner ? reversePageV3(owner) : owner && activeApp ? roleApp(owner) : `<section class="ta-phone-page"><div class="ta-wallpaper" style="${wallpaper ? `background-image:url('${esc(wallpaper)}')` : ''}"></div><div class="ta-phone-head"><button type="button" data-ta-role-picker><i>${avatar(owner)}</i><span><b>${esc(owner?.nickname || owner?.name || 'Ta 的手机')}</b><small>${owner ? '角色手机' : '还没有角色'}</small></span><em>⌄</em></button><div class="ta-head-actions"><button type="button" data-ta-reverse-open aria-label="TA 看我">⇄</button><button type="button" data-ta-refresh ${refreshing ? 'disabled' : ''} aria-label="刷新角色手机">${refreshing ? '…' : '↻'}</button><button type="button" class="ta-close" data-ta-close>×</button></div></div><main class="ta-phone-main">${owner ? `<div class="ta-welcome"><span>TA'S PHONE</span><h1>${esc(owner.nickname || owner.name)} 的手机</h1></div><div class="ta-app-grid">${desktopApps.map(([key, name, iconName, color]) => `<button class="ta-app-icon" data-ta-role-app="${key}" type="button"><i style="--ta-icon-color:${color}">${desktopIcon(key,iconName)}</i><span>${name}</span></button>`).join('')}</div>` : `<div class="ta-no-role"><i>⌁</i><h2>还没有角色手机</h2><p>先在聊天 App 中创建一个角色，再来查看 Ta 的手机。</p></div>`}</main></section>${app.classList.contains('is-role-picker') ? rolePicker(list) : ''}${refreshPickerOpen ? refreshPicker() : ''}${appearanceOpen ? appearanceSheet() : ''}`; scheduleReverseBrowseMotion(); }
  document.addEventListener('click', event => {
    if (!app.classList.contains('is-open') || activeApp !== 'doubao') return;
    const owner = role();
    if (!owner) return;
    if (event.target.closest('[data-ta-doubao-back]')) { activeApp = ''; activeChatTarget = ''; doubaoHistoryOpen = false; selectedDoubaoHistory = -1; render(); return; }
    if (event.target.closest('[data-ta-doubao-refresh]')) { selectedDoubaoHistory = -1; doubaoHistoryOpen = false; refreshDoubaoChat(owner); return; }
    if (event.target.closest('[data-ta-doubao-history]')) { doubaoHistoryOpen = true; render(); return; }
    if (event.target.closest('[data-ta-doubao-history-close]')) { doubaoHistoryOpen = false; render(); return; }
    if (event.target.closest('[data-ta-doubao-history-current]')) { selectedDoubaoHistory = -1; doubaoHistoryOpen = false; render(); return; }
    const item = event.target.closest('[data-ta-doubao-history-item]');
    if (item) { selectedDoubaoHistory = Number(item.dataset.taDoubaoHistoryItem); doubaoHistoryOpen = false; render(); }
  });
  document.addEventListener('click', event => {
    if (!app.classList.contains('is-open')) return;
    if(event.target.closest('[data-ta-reverse-open]')){event.stopImmediatePropagation();const owner=role();if(!owner)return;reverseOpen=true;reverseStep=0;activeApp='';render();return;}
    if(event.target.closest('[data-ta-reverse-close]')){event.stopImmediatePropagation();reverseOpen=false;render();return;}
    if(event.target.closest('[data-ta-reverse-rate-open]')){event.stopImmediatePropagation();if(!reverseBusy){reverseRateOpen=true;render();}return;}
    if(event.target.closest('[data-ta-reverse-rate-close]')){event.stopImmediatePropagation();reverseRateOpen=false;render();return;}
    if(event.target.closest('[data-ta-reverse-rate-save]')){event.stopImmediatePropagation();const owner=role();const input=app.querySelector('[data-ta-reverse-rate-range]');if(owner&&input){const rates=read('ideal-machine-ta-reverse-rates',{});rates[owner.id]=Math.max(0,Math.min(100,Number(input.value)||0));localStorage.setItem('ideal-machine-ta-reverse-rates',JSON.stringify(rates));}reverseRateOpen=false;render();return;}
    if(event.target.closest('[data-ta-reverse-run]')){event.stopImmediatePropagation();const owner=role();if(owner)runReverseCheckV2(owner,false);return;}
    if(event.target.closest('[data-ta-reverse-catch-now]')){event.stopImmediatePropagation();if(reverseBusy&&reverseLive&&!['caught','chat'].includes(reverseLive.stage)){reverseForceCaught=true;reverseLive={...reverseLive,stage:'caught'};render();}return;}
    const reverseNav=event.target.closest('[data-ta-reverse-step]');if(reverseNav){event.stopImmediatePropagation();const latest=reverseChecks(role()?.id)[0];reverseStep=Math.max(0,Math.min(Math.max(0,(latest?.findings?.length||1)-1),reverseStep+Number(reverseNav.dataset.taReverseStep)));render();return;}
    if(event.target.closest('[data-ta-close]')){appearanceDraft=null;appearanceSwapKey='';}
    if(event.target.closest('[data-ta-role-app="meihua"]')){appearanceDraft=cloneAppearance();appearanceSwapKey='';}
    if(event.target.closest('[data-ta-appearance-close]')){event.stopImmediatePropagation();appearanceOpen=false;appearanceDraft=null;appearanceSwapKey='';render();return;}
    if(event.target.closest('[data-ta-appearance-save]')){event.stopImmediatePropagation();state.appearance=cloneAppearance(appearanceValue());saveState();appearanceOpen=false;appearanceDraft=null;appearanceSwapKey='';render();return;}
    if(event.target.closest('[data-ta-wallpaper-reset]')){event.stopImmediatePropagation();appearanceValue().wallpaper='';render();return;}
    if(event.target.closest('[data-ta-wallpaper-modify]')){openWallpaperSourcePicker();return;}
    if(event.target.closest('[data-ta-icons-modify]')){openIconSourcePicker();return;}
    if(event.target.closest('[data-ta-icons-reset]')){event.stopImmediatePropagation();appearanceValue().icons={};appearanceSwapKey='';render();return;}
    const swap=event.target.closest('[data-ta-icon-swap]');if(swap){event.stopImmediatePropagation();const key=swap.dataset.taIconSwap;if(!appearanceSwapKey){appearanceSwapKey=key;render();return;}if(appearanceSwapKey===key){appearanceSwapKey='';render();return;}const icons=appearanceValue().icons;const first=icons[appearanceSwapKey]||'';const second=icons[key]||'';if(second)icons[appearanceSwapKey]=second;else delete icons[appearanceSwapKey];if(first)icons[key]=first;else delete icons[key];appearanceSwapKey='';render();return;}
    const modify=event.target.closest('[data-ta-icon-modify]');if(modify){openIconSourcePicker(modify.dataset.taIconModify);return;}
    if(event.target.closest('[data-ta-icon-source-close]')){event.target.closest('.ta-icon-source-sheet')?.remove();return;}
    const album=event.target.closest('[data-ta-icon-batch-album]');if(album){const max=emptyIconTargets().length;if(!max)return window.alert('所有 App 都已有自定义图标，可先恢复默认或交换图标。');if(!window.IdealMachineAlbum?.pickMany)return window.alert('相册 App 还没有准备好。');window.IdealMachineAlbum.pickMany(max,urls=>applyIconBatch(urls));event.target.closest('.ta-icon-source-sheet')?.remove();return;}
    const urlMode=event.target.closest('[data-ta-icon-batch-url]');if(urlMode){const panel=event.target.closest('.ta-icon-source-sheet')?.querySelector('.ta-icon-url-panel');if(panel){panel.hidden=false;panel.querySelector('input')?.focus();}return;}
    const urlApply=event.target.closest('[data-ta-icon-url-apply]');if(urlApply){const fields=[...event.target.closest('.ta-icon-url-panel').querySelectorAll('[data-ta-icon-url-field]')];const invalid=fields.find(input=>input.value.trim()&&!/^https?:\/\//i.test(input.value.trim()));if(invalid){invalid.focus();return window.alert('请输入有效的 http(s) 图片链接。');}const draft=appearanceValue();fields.forEach(input=>{const value=input.value.trim();if(value)draft.icons[input.dataset.taIconUrlField]=value;});event.target.closest('.ta-icon-source-sheet')?.remove();render();}
  });
  document.addEventListener('change', async event => {
    if(!app.classList.contains('is-open')||!event.target.matches('[data-ta-icon-batch-local]'))return;
    const files=[...(event.target.files||[])];if(!files.length)return;const max=emptyIconTargets().length;if(!max)return window.alert('所有 App 都已有自定义图标，可先恢复默认或交换图标。');const values=[];for(const file of files.slice(0,max)){const value=window.IdealMachineReadImage?await window.IdealMachineReadImage(file,360,.84):await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve('');reader.readAsDataURL(file);});if(value)values.push(value);}event.target.closest('.ta-icon-source-sheet')?.remove();applyIconBatch(values);
  });
  document.addEventListener('input', event => { if(!app.classList.contains('is-open')||!event.target.matches('[data-ta-reverse-rate-range]'))return;const output=app.querySelector('[data-ta-reverse-rate-output]');if(output)output.textContent=`${event.target.value}%`;const text=app.querySelector('.ta-reverse-rate-sheet>section>p');const owner=role();if(text&&owner)text.textContent=`仅作用于 ${owner.nickname||owner.name}。成功率为 ${event.target.value}%，被发现概率为 ${100-Number(event.target.value)}%。`; });
  document.addEventListener('click', event => { if (event.target.closest('[data-app-key="ta"]')) { state = readState(); activeApp = ''; activeChatTarget = ''; activeDetail = null; activeCalendarDate = localDateKey(new Date()); refreshPickerOpen = false; appearanceOpen = false; reverseOpen = false; selectedRefreshApps.clear(); doubaoHistoryOpen = false; selectedDoubaoHistory = -1; render(); app.classList.add('is-open'); return; } if (!app.classList.contains('is-open')) return; if (event.target.closest('[data-ta-appearance-close]')) { appearanceOpen = false; render(); return; } const albumPick=event.target.closest('[data-ta-album-pick]'); if(albumPick){const target=albumPick.dataset.taAlbumPick;if(!window.IdealMachineAlbum?.pick)return window.alert('相册 App 还没有准备好。');window.IdealMachineAlbum.pick(url=>setAppearanceImage(target,url));return;} const urlPick=event.target.closest('[data-ta-url-pick]');if(urlPick){const value=window.prompt('输入图片链接（https://…）');if(value&&!/^https?:\/\//i.test(value.trim()))return window.alert('请输入有效的 http(s) 图片链接。');if(value)setAppearanceImage(urlPick.dataset.taUrlPick,value);return;} if (event.target.closest('[data-ta-wallpaper-reset]')) { state.appearance.wallpaper = ''; saveState(); render(); return; } const iconReset=event.target.closest('[data-ta-icon-reset]'); if (iconReset) { delete state.appearance.icons[iconReset.dataset.taIconReset]; saveState(); render(); return; } if (event.target.closest('[data-ta-detail-close]')) { activeDetail = null; render(); return; } const detail = event.target.closest('[data-ta-detail]'); if (detail) { activeDetail = { type:detail.dataset.taDetail, index:Number(detail.dataset.taDetailIndex) }; render(); return; } if (event.target.closest('[data-ta-refresh-close]')) { refreshPickerOpen = false; selectedRefreshApps.clear(); render(); return; } if (event.target.closest('[data-ta-refresh-all]')) { const keys = ['chat','calendar','music','doubao','shopping','wallet']; if (selectedRefreshApps.size === keys.length) selectedRefreshApps.clear(); else keys.forEach(key => selectedRefreshApps.add(key)); syncRefreshPicker(); return; } const refreshChoice = event.target.closest('[data-ta-refresh-app]'); if (refreshChoice) { const key = refreshChoice.dataset.taRefreshApp; selectedRefreshApps.has(key) ? selectedRefreshApps.delete(key) : selectedRefreshApps.add(key); syncRefreshPicker(); return; } if (event.target.closest('[data-ta-refresh-submit]')) { const owner = role(); const keys = [...selectedRefreshApps]; if (owner && keys.length) refreshSelectedApps(owner, keys); return; } if (event.target.closest('[data-ta-close]')) { app.classList.remove('is-open'); app.classList.remove('is-role-picker'); appearanceOpen = false; reverseOpen = false; activeDetail = null; return; } if (event.target.closest('[data-ta-role-picker]')) { app.classList.add('is-role-picker'); render(); return; } if (event.target.closest('[data-ta-role-close]')) { app.classList.remove('is-role-picker'); render(); return; } const selected = event.target.closest('[data-ta-role]'); if (selected) { state.roleId = selected.dataset.taRole; activeDetail = null; activeCalendarDate = localDateKey(new Date()); saveState(); app.classList.remove('is-role-picker'); render(); return; } if (event.target.closest('[data-ta-refresh]')) { if (!role()) return; selectedRefreshApps.clear(); refreshPickerOpen = true; render(); return; } const calendarNav = event.target.closest('[data-ta-calendar-nav]'); if (calendarNav) { activeCalendarDate = shiftDateKey(activeCalendarDate, Number(calendarNav.dataset.taCalendarNav)); render(); return; } const pageRefresh = event.target.closest('[data-ta-page-refresh]'); if (pageRefresh) { const owner = role(); if (owner) { if (pageRefresh.dataset.taPageRefresh === 'calendar' && activeCalendarDate !== localDateKey(new Date())) { window.alert('只能刷新今天的日程；上一天和下一天用于查看已经保存的记录。'); return; } activeDetail = null; refreshSelectedApp(owner, pageRefresh.dataset.taPageRefresh); } return; } if (event.target.closest('[data-ta-chat-refresh]')) { const owner = role(); if (owner) refreshRoleChats(owner); return; } if (event.target.closest('[data-ta-chat-list]')) { activeChatTarget = ''; render(); return; } if (event.target.closest('[data-ta-home]')) { activeApp = ''; activeChatTarget = ''; activeDetail = null; render(); return; } if (event.target.closest('[data-ta-analyze-npc]')) { const owner = role(); if (owner) analyzeNpcs(owner); return; } const chatEntry = event.target.closest('[data-ta-role-chat]'); if (chatEntry) { activeChatTarget = chatEntry.dataset.taRoleChat; render(); return; } const launch = event.target.closest('[data-ta-role-app]'); if (launch) { if(launch.dataset.taRoleApp==='meihua'){appearanceOpen=true;render();return;} activeApp = launch.dataset.taRoleApp; activeDetail = null; if (activeApp === 'rili') activeCalendarDate = localDateKey(new Date()); return render(); } });
  document.addEventListener('change', event => { if (!app.classList.contains('is-open')||!event.target.matches('[data-ta-image-file]')) return; const file=event.target.files?.[0]; if(!file)return;const target=event.target.dataset.taImageFile;const wallpaper=target==='wallpaper';const reader=window.IdealMachineReadImage ? window.IdealMachineReadImage(file, wallpaper ? 1600 : 360, wallpaper ? .76 : .84) : new Promise(resolve=>{const source=new FileReader();source.onload=()=>resolve(source.result);source.onerror=()=>resolve('');source.readAsDataURL(file);});reader.then(value=>setAppearanceImage(target,value)); });
  function reverseDataLines(value, limit=8) { const rows=[];const visit=(item,prefix='')=>{if(rows.length>=limit||item==null)return;if(typeof item==='string'||typeof item==='number'){const text=String(item).trim();if(text)rows.push(`${prefix}${text}`);return;}if(Array.isArray(item)){item.slice(-limit).forEach(entry=>visit(entry,prefix));return;}if(typeof item==='object'){const title=item.name||item.title||item.productName||item.with||item.text||item.note||'';const detail=item.price||item.amount||item.status||item.category||item.time||'';if(title)rows.push(`${prefix}${title}${detail?` · ${detail}`:''}`);else Object.entries(item).slice(0,limit).forEach(([key,entry])=>visit(entry,`${key}：`));}};visit(value);return rows.slice(0,limit); }
  function reverseWait(ms) { return new Promise(resolve=>window.setTimeout(resolve,ms)); }
  function scheduleReverseBrowseMotion() {
    const stage=reverseLive?.stage;const isActive=reverseBusy&&reverseLive&&['opening','browsing','viewed'].includes(stage);
    if(!isActive)return;
    const conversationKey=`${reverseLive.app}|${reverseLive.position}`;
    const stageKey=`${conversationKey}|${stage}`;
    if(scheduleReverseBrowseMotion.stageKey===stageKey)return;
    scheduleReverseBrowseMotion.stageKey=stageKey;
    const token=(scheduleReverseBrowseMotion.token||0)+1;scheduleReverseBrowseMotion.token=token;
    window.setTimeout(()=>{
      if(scheduleReverseBrowseMotion.token!==token)return;
      const browser=app.querySelector('.ta-reverse-browser');const isChat=reverseLive?.app==='聊天';
      const scroller=isChat?browser?.querySelector('.chat-messages'):browser?.querySelector(':scope > main');if(!scroller)return;
      const maximum=Math.max(0,scroller.scrollHeight-scroller.clientHeight);if(maximum<8)return;
      if(isChat){
        const saved=scheduleReverseBrowseMotion.chatPositions?.[conversationKey];
        const start=Number.isFinite(saved)?Math.min(maximum,saved):maximum;
        scroller.scrollTop=start;
        if(stage==='opening'){scheduleReverseBrowseMotion.chatPositions={...(scheduleReverseBrowseMotion.chatPositions||{}),[conversationKey]:start};return;}
        const target=Math.max(0,start-Math.max(scroller.clientHeight*.42,maximum*.17));
        const duration=Math.max(900,(start-target)/.045);const started=performance.now();
        const animate=now=>{if(scheduleReverseBrowseMotion.token!==token||!scroller.isConnected)return;const progress=Math.min(1,(now-started)/duration);const position=start+(target-start)*progress;scroller.scrollTop=position;scheduleReverseBrowseMotion.chatPositions={...(scheduleReverseBrowseMotion.chatPositions||{}),[conversationKey]:position};if(progress<1)requestAnimationFrame(animate);};
        requestAnimationFrame(animate);return;
      }
      scroller.scrollTop=0;if(stage==='opening')return;const from=0;const duration=4300;const started=performance.now();
      const animate=now=>{if(scheduleReverseBrowseMotion.token!==token||!scroller.isConnected)return;const progress=Math.min(1,(now-started)/duration);const target=progress<.68?maximum*(progress/.68):maximum*(1-(progress-.68)/.32*.45);scroller.scrollTop=from+target;if(progress<1)requestAnimationFrame(animate);};requestAnimationFrame(animate);
    },90);
  }
  async function loadReverseAppearance() {
    const saved=read('ideal-machine-beauty',{});
    const resolveImage=async value=>{try{return String(value||'').startsWith('idb:image:')&&window.IdealMachineGetImage?await window.IdealMachineGetImage(value):value||'';}catch{return '';}};
    const icons={};
    for(const [key,value] of Object.entries(saved.icons||{})){
      const raw=String(value||'');
      if(raw.startsWith('builtin:')){
        const sourceKey=raw.slice(8);
        if(ios17IconKeys.has(sourceKey)) icons[key]=`assets/icons/default-ios17/${sourceKey}.png`;
        continue;
      }
      const resolved=await resolveImage(value);
      if(resolved&&!resolved.startsWith('builtin:')) icons[key]=resolved;
    }
    // 桌面图标加载可能仍在异步读取 IndexedDB；以桌面当前实际显示的自定义图标补齐一次。
    reverseUserApps().forEach(([key])=>{
      if(icons[key])return;
      const image=document.querySelector(`[data-app-key="${key}"] .app-custom-image, [data-folder-app="${key}"] .app-custom-image`);
      if(image?.currentSrc||image?.src)icons[key]=image.currentSrc||image.src;
    });
    const legacyFolderIcons=saved.folderIcons||saved.icons?.['creative-folder']||{};
    Object.keys({debate:1,fanfic:1,magazine:1}).forEach(key=>{if(!icons[key]&&legacyFolderIcons&&typeof legacyFolderIcons==='object'&&legacyFolderIcons[key])icons[key]=legacyFolderIcons[key];});
    return {wallpaper:await resolveImage(saved.wallpaper),icons,names:saved.names||{}};
  }
  async function loadReverseAlbumVisual(album) { const result={...(album||{}),items:[]};for(const item of album?.items||[]){let url=item.url||'';try{if(String(url).startsWith('idb:image:')&&window.IdealMachineGetImage)url=await window.IdealMachineGetImage(url);}catch{url='';}result.items.push({...item,url});}return result; }
  async function reverseVisualUrl(value) { let url=value||'';try{if(String(url).startsWith('idb:image:')&&window.IdealMachineGetImage)url=await window.IdealMachineGetImage(url);}catch{url='';}return url; }
  async function loadReverseChatVisual(chat) { const conversations=[];const stored=read(chatKey,{});for(const item of chat?.conversations||[]){const originals=stored.chats?.[item.contactId]?.messages||[];const messages=[];for(let index=0;index<(item.messages||[]).length;index+=1){const message=item.messages[index];const original=originals[index]||{};const type=original.sticker?'sticker':message.type;const media=/^(?:image|sticker)$/.test(type||'')?await reverseVisualUrl(original.text||message.text):'';messages.push({...message,type,media,stickerDescription:original.stickerDescription||''});}conversations.push({...item,messages,avatar:await reverseVisualUrl(item.avatar),userAvatar:await reverseVisualUrl(item.userAvatar),settings:{...(item.settings||{}),wallpaper:await reverseVisualUrl(item.settings?.wallpaper)}});}return {conversations}; }
  let reversePreferredApp = '';
  function reverseShuffle(items) { const result=[...items];for(let index=result.length-1;index>0;index-=1){const swap=Math.floor(Math.random()*(index+1));[result[index],result[swap]]=[result[swap],result[index]];}if(reversePreferredApp&&result.some(item=>Array.isArray(item)&&item[0]===reversePreferredApp)){const preferred=result.findIndex(item=>Array.isArray(item)&&item[0]===reversePreferredApp);if(preferred>0)[result[0],result[preferred]]=[result[preferred],result[0]];reversePreferredApp='';}return result; }
  function reverseUserApps() { return [['liaotian','聊天','聊'],['luntan','论坛','坛'],['xiangce','相册','册'],['rili','日历','历'],['yinyue','音乐','音'],['doubao','豆包','豆'],['gouwu','购物','购'],['qinglvkongjian','情侣空间','侣'],['debate','辩论','辩'],['fanfic','同人文','文'],['magazine','杂志社','杂']]; }
  function reverseIconMarkup(key, custom, short) {
    if(custom) return `<i class="has-custom-image" style="background-image:url(&quot;${esc(custom)}&quot;)"></i>`;
    if(key==='creative-folder'){
      const folderSources=['debate','fanfic','magazine'].map(item=>reverseAppearance.icons[item]||`assets/icons/default-ios17/${item}.png`);
      return `<i class="has-folder-image">${folderSources.map(source=>`<img src="${esc(source)}" alt="">`).join('')}</i>`;
    }
    return `<i class="has-default-image">${defaultIosIcon(key,esc(short))}</i>`;
  }
  function reverseDesktopStage(step) { const target=step?.app||'';const wallpaper=reverseAppearance.wallpaper?`background-image:url(&quot;${esc(reverseAppearance.wallpaper)}&quot;)`:'';return `<section class="ta-reverse-user-phone ${step?.stage==='thinking'?'is-thinking':''}" style="${wallpaper}"><header><time>${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</time><span class="ta-reverse-user-owner"><i>${avatar(reverseViewer)}</i><b>${esc(reverseViewer?.name||'用户')}的手机</b></span><em>•••</em></header><div class="ta-reverse-desktop-pages"><main>${reverseUserApps().map(([key,name,short])=>{const label=reverseAppearance.names[key]||name;const custom=reverseAppearance.icons[key];return `<article class="${name===target?'is-target':''}">${reverseIconMarkup(key,custom,short)}<b>${esc(label)}</b></article>`;}).join('')}</main></div><footer><span>${step?.stage==='thinking'?'TA 正在想接下来查哪个 App…':target?`TA 选中了“${esc(target)}”…`:'已回到用户手机桌面'}</span><div><i></i><i class="is-current"></i><i></i></div></footer></section>`; }
  function reverseChatStage(owner) { const userName=reverseViewer?.name||'用户';return `<section class="ta-reverse-user-phone is-chat-jump"><header><time>${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</time><span>聊天</span><i>•••</i></header><main><i>${avatar(owner)}</i><b>正在去找 ${esc(userName)}…</b><small>看完 ${esc(userName)} 的手机，准备进入具体聊天页面</small></main></section>`; }
  function reverseCaughtStage(owner) { const userName=reverseViewer?.name||'你';return `<section class="ta-reverse-caught"><i>!</i><small>SECRET CHECK FAILED</small><h2>被 ${esc(userName)} 发现了</h2><p>${esc(owner.nickname||owner.name)} 还没来得及继续查看，反查手机已经失败。</p><b>正在回到聊天 App 面对 ${esc(userName)}…</b></section>`; }
  function parseReverseView(appName,value,source) {
    const raw=String(value||'').replace(/```(?:json|text|markdown)?|```/gi,'').trim();
    try{const start=raw.indexOf('{');const end=raw.lastIndexOf('}');if(start>=0&&end>start){const item=JSON.parse(raw.slice(start,end+1));const title=item.title||item.标题||item.item||item.看到的项目标题;const detail=item.detail||item.content||item.内容||item.实际看到的内容;const reaction=item.reaction||item.response||item.反应||item.角色反应;if(title||detail||reaction)return {app:appName,title:String(title||`${appName}记录`),detail:String(detail||reverseDataLines(source,3).join('；')),reaction:String(reaction||raw)};}}catch{}
    const rows=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);for(const line of rows){const normalized=line.replace(/^[-*#\s]+/,'').replace(/^(?:VIEW|查看|浏览)\s*[:：]\s*/i,'VIEW｜');const parts=normalized.split(/\s*[｜|]\s*/).map(item=>item.trim()).filter(Boolean);const viewAt=parts.findIndex(item=>/^VIEW$/i.test(item));if(viewAt>=0&&parts.length-viewAt>=4)return {app:appName,title:parts[viewAt+1]||`${appName}记录`,detail:parts[viewAt+2]||'',reaction:parts.slice(viewAt+3).join('｜')};}
    const labelled={};rows.forEach(line=>{const match=line.match(/^(?:[-*]\s*)?(标题|项目|内容|详情|反应|想法)\s*[:：]\s*(.+)$/);if(match)labelled[match[1]]=match[2].trim();});const evidence=reverseDataLines(source,4);return {app:appName,title:labelled.标题||labelled.项目||evidence[0]||`${appName}记录`,detail:labelled.内容||labelled.详情||evidence.slice(0,3).join('；')||'浏览了当前记录',reaction:labelled.反应||labelled.想法||raw.slice(0,600)||'TA 看完后没有立刻说话。'};
  }
  function parseReverseChatResult(value,fallback) {
    const raw=String(value||'').replace(/```(?:json|text|markdown)?|```/gi,'').trim();let summary='';let messages=[];
    try{const start=raw.indexOf('{');const end=raw.lastIndexOf('}');if(start>=0&&end>start){const parsed=JSON.parse(raw.slice(start,end+1));summary=String(parsed.final||parsed.summary||parsed.整体反应||'').trim();const rows=parsed.messages||parsed.message||parsed.消息;messages=(Array.isArray(rows)?rows:[rows]).map(item=>String(item?.text||item||'').trim()).filter(Boolean);}}catch{}
    if(!messages.length&&/^\s*\{/.test(raw)){const finalMatch=raw.match(/"(?:final|summary)"\s*:\s*"((?:\\.|[^"\\])*)"/i);if(finalMatch)try{summary=JSON.parse(`"${finalMatch[1]}"`);}catch{}const list=raw.match(/"messages"\s*:\s*\[([\s\S]*)/i)?.[1]||'';for(const match of list.matchAll(/"((?:\\.|[^"\\])*)"/g)){try{const text=JSON.parse(`"${match[1]}"`).trim();if(text)messages.push(text);}catch{}}}
    if(!messages.length){raw.split(/\r?\n/).forEach(line=>{const parts=protocolParts(line);const type=String(parts.shift()||'').toUpperCase();if(type==='FINAL')summary=parts.join('｜').trim();if(type==='MESSAGE'&&parts.length)messages.push(parts.join('｜').trim());});}
    if(!messages.length&&raw&&!/^\s*\{/.test(raw)){const body=raw.replace(/^(?:FINAL|MESSAGE)\s*[|｜:：]\s*/gim,'').trim();messages=body.split(/(?<=[。！？!?])\s*|\n+/).map(item=>item.trim()).filter(Boolean);}
    summary=summary||fallback||'TA 看完了你的手机。';if(!messages.length)messages=[summary];if(messages.length===1){const pieces=messages[0].split(/(?<=[，,；;])\s*/).map(item=>item.trim()).filter(Boolean);if(pieces.length>1)messages=pieces;}
    return {summary,messages:messages.slice(0,5)};
  }
  function reverseShortMessages(messages) {
    const result=[];const narration=/(?:一边|内心|心里|表面上|深处|虚荣感|警惕|萌芽|产生|意识到|发现对方|查完后|角色|情绪|决定|反应|偷偷看手机|对方已经|随后|此刻)/;
    (messages||[]).forEach(value=>{const clean=String(value||'').replace(/^(?:MESSAGE|消息)\s*[|｜:：]\s*/i,'').replace(/^[（(]|[）)]$/g,'').trim();const pieces=clean.split(/(?<=[。！？!?])\s*|\n+/).map(item=>item.trim()).filter(Boolean);pieces.forEach(piece=>{if(narration.test(piece)&&!/^(?:我|你|别|先|说|告诉|解释|为什么|怎么|是不是|还)/.test(piece))return;if(!/[你我]/.test(piece)&&narration.test(piece))return;if(piece.length<=30)result.push(piece);});});
    const valid=[];result.map(item=>item.replace(/[，,]+$/,'').trim()).filter(Boolean).forEach(item=>{if(item.length===1&&valid.length)valid[valid.length-1]+=item;else if(item.length>1)valid.push(item);});valid.splice(5);
    if(valid.length>=2)return valid;
    return ['你手机里的那些，我都看见了。','我不想装作什么都没发生。','你现在能跟我说清楚吗？'];
  }
  function handoffReverseChat(ownerId) { reverseOpen=false;reverseBusy=false;reverseLive=null;app.classList.remove('is-open');window.setTimeout(()=>window.IdealMachineChat?.openConversation?.(ownerId),160); }
  function caughtFirstPersonMessages(messages,owner) { const roleName=String(owner?.nickname||owner?.name||'').trim();const result=[];(messages||[]).forEach(value=>{let text=String(value||'').trim();if(roleName)text=text.split(roleName).join('我');text=text.replace(/角色本人|这个角色|该角色|角色|\bTA\b/gi,'我').replace(/用户/g,'你').replace(/我我/g,'我');if(/偷看手机时被|反查(?:手机)?失败|查岗失败|情绪与决定|失败原因|系统(?:提示|总结)/.test(text))return;const pieces=text.split(/(?<=[。！？!?，,；;])\s*/).map(item=>item.trim()).filter(Boolean);(pieces.length?pieces:[text]).forEach(piece=>{if(piece.length<=28)result.push(piece);else for(let start=0;start<piece.length;start+=28)result.push(piece.slice(start,start+28));});});return result.filter(Boolean).slice(0,5); }
  async function generateCaughtDialogue(owner,config,model,forced) { const chat=read(chatKey,{});const examples=(chat.chats?.[owner.id]?.messages||[]).filter(item=>item.role!=='user'&&(item.text||item.content)).slice(-12).map(item=>item.text||item.content);let lastError=new Error('API 没有返回合格的角色消息');for(let attempt=0;attempt<2;attempt+=1){try{const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:attempt?.72:.84,max_tokens:1200,stream:false,messages:[{role:'system',content:'你就是指定角色本人。只根据角色人设与既有说话样本，写被对方撞见后会亲口说的话。必须第一人称“我”、第二人称“你”，禁止旁白、事件总结、失败报告、系统措辞，禁止替对方发言。只返回 JSON。'},{role:'user',content:`角色姓名：${owner.nickname||owner.name}\n角色完整人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,5000)}\n角色以往说话样本：${JSON.stringify(examples)}\n对方网名：${reverseViewer?.name||'用户'}\n情境：${forced?'对方主动走过来，当场撞见我正在动手机。':'我自己不小心暴露，被对方撞见。'}\n生成此角色此刻最符合人设的反应。输出 {"final":"内部情绪（不进入聊天）","messages":["气泡1","气泡2"]}。messages 必须为 2—5 条，每条 6—24 字，只能是角色亲口说出的简短台词。`} ]})});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();const parsed=parseReverseChatResult(apiResponseText(data),'');parsed.messages=caughtFirstPersonMessages(parsed.messages,owner);if(parsed.messages.length>=2)return parsed;lastError=new Error('角色消息不足两条');}catch(error){lastError=error;}}throw lastError; }
  async function runCaughtReverseV2(owner,config,model,forced,skipThinking=false) { reverseBusy=true;if(!skipThinking){reverseLive={stage:'thinking',app:'',source:{},position:0,total:1};render();await reverseWait(2400);}reverseLive={stage:'caught',app:'',source:{},position:0,total:1};render();try{const parsed=await generateCaughtDialogue(owner,config,model,forced);const check={id:uid('reverse-caught'),createdAt:Date.now(),roleId:owner.id,findings:[],summary:parsed.summary,message:parsed.messages.join('\n'),messages:parsed.messages,caught:true,forced};const all=read('ideal-machine-ta-reverse-checks',{});all[owner.id]=[check,...(Array.isArray(all[owner.id])?all[owner.id]:[])].slice(0,20);localStorage.setItem('ideal-machine-ta-reverse-checks',JSON.stringify(all));parsed.messages.forEach((text,index)=>saveReverseMessage(owner,text,`${check.id}:${index}`));await reverseWait(400);handoffReverseChat(owner.id);}catch(error){reverseBusy=false;reverseLive=null;render();window.alert(`生成角色被发现后的消息失败：${error.message||'请重试'}`);} }
  function reverseAppMeta(name) { return reverseUserApps().find(item=>item[1]===name)||['',name,String(name||'A').slice(0,1)]; }
  function reverseRecordTitle(item,fallback='记录') { return item?.title||item?.name||item?.productName||item?.with||item?.text||item?.note||fallback; }
  function reverseRecordDetail(item) { return item?.text||item?.content||item?.description||item?.note||item?.artist||item?.price||item?.time||item?.date||''; }
  function reverseSyncedAppPage(name,source) {
    const empty='<p class="ta-reverse-app-empty">这个 App 当前没有记录。</p>';
    if(name==='聊天'){const item=source?.activeConversation||source?.conversation;if(!item)return empty;const settings=item.settings||{};const style=`${settings.wallpaper?`background-image:url(&quot;${esc(settings.wallpaper)}&quot;);`:''}--chat-user-bubble:${esc(settings.userBubbleColor||'#222222')};--chat-user-text:${esc(settings.userBubbleTextColor||'#ffffff')};--chat-character-bubble:${esc(settings.characterBubbleColor||'#ffffff')};--chat-character-text:${esc(settings.characterBubbleTextColor||'#111111')}`;const contactAvatar=`<span class="chat-avatar">${avatar({name:item.with,avatar:item.avatar})}</span>`;const rows=item.messages?.length?item.messages.map(message=>{const isUser=message.speakerType==='user';const messageAvatar=settings.hideAvatar?'':`<span class="chat-avatar chat-message-avatar">${avatar({name:message.speaker,avatar:isUser?item.userAvatar:item.avatar})}</span>`;const stamp=settings.hideTimestamp?'':`<small>${esc(message.time||'')}</small>`;return `<div class="chat-message ${isUser?'is-user':'is-character'}"><div class="chat-message-line">${messageAvatar}<div class="chat-bubble">${esc(message.text||'')}</div>${stamp}</div></div>`;}).join(''):empty;return `<div class="chat-conversation ta-reverse-chat-conversation" style="${style}"><div class="chat-person">${contactAvatar}<div><b>${esc(item.with||'联系人')}</b><small>${esc(item.relationship||'具体聊天')}</small></div></div><div class="chat-messages">${rows}</div></div>`;}
    if(name==='论坛'){const rows=[...(source?.feed||[]),...(source?.discover||[])];return `<div class="ta-reverse-forum-feed">${rows.length?rows.slice(-30).reverse().map(item=>`<article><header><i>${esc(String(item.author||item.nickname||'坛').slice(0,1))}</i><b>${esc(item.author||item.nickname||'论坛用户')}</b></header><h3>${esc(item.title||'帖子')}</h3><p>${esc(item.text||item.content||'')}</p><small>♡ ${Number(item.likes||0)}　评论 ${item.comments?.length||0}</small></article>`).join(''):empty}</div>`;}
    if(name==='音乐'){const rows=Array.isArray(source?.library)?source.library:[];const current=source?.current&&typeof source.current==='object'?source.current:null;return `<div class="ta-reverse-music-page">${current&&reverseRecordTitle(current,'')?`<section><i>♫</i><span><small>正在播放</small><b>${esc(reverseRecordTitle(current,'未知歌曲'))}</b><em>${esc(current.artist||'')}</em></span></section>`:''}<div>${rows.length?rows.map((item,index)=>`<article><i>${index+1}</i><span><b>${esc(reverseRecordTitle(item,'歌曲'))}</b><small>${esc(item.artist||reverseRecordDetail(item))}</small></span><em>›</em></article>`).join(''):empty}</div></div>`;}
    if(name==='购物'){const groups=[['购物车',source?.cart],['订单',source?.orders],['愿望',source?.wishes],['礼物',source?.gifts]];return `<div class="ta-reverse-shop-page">${source?.flowerMarket?'<b class="ta-reverse-flower-badge">花市已开启</b>':''}${groups.map(([label,rows])=>Array.isArray(rows)&&rows.length?`<section><h3>${label}</h3><div>${rows.map(item=>`<article><i>购</i><span><b>${esc(reverseRecordTitle(item,'商品'))}</b><small>${esc(reverseRecordDetail(item))}</small></span><strong>${item.price!=null?`¥${esc(item.price)}`:'›'}</strong></article>`).join('')}</div></section>`:'').join('')||empty}</div>`;}
    if(name==='相册'){const rows=source?.items||[];return `<div class="ta-reverse-album-grid">${rows.length?rows.map((item,index)=>`<article>${item.url?`<img src="${esc(item.url)}" alt="${esc(item.name||item.title||`照片 ${index+1}`)}">`:'<i>▧</i>'}<b>${esc(item.name||item.title||`照片 ${index+1}`)}</b><small>${esc(item.source||item.createdAt||'')}</small></article>`).join(''):empty}</div>`;}
    if(name==='日历'){const rows=Array.isArray(source)?source:[];return `<div class="ta-reverse-calendar-page">${rows.length?rows.map(item=>`<article><time>${esc(item.time||item.date||'日程')}</time><span><b>${esc(reverseRecordTitle(item,'日程'))}</b><small>${esc(reverseRecordDetail(item))}</small></span></article>`).join(''):empty}</div>`;}
    const lines=reverseDataLines(source||{},18);return `<div class="ta-reverse-generic-page">${lines.length?lines.map(line=>`<article>${esc(line)}</article>`).join(''):empty}</div>`;
  }
  function reverseBrowseCard(step,total) { const footer=step?.finding?`<footer><small>${esc(role()?.nickname||role()?.name||'TA')} 此刻的反应</small><p>${esc(step.finding.reaction)}</p></footer>`:`<footer class="is-looking"><p>${step?.stage==='opening'?'正在自动点开 App…':'TA 正在翻看这个 App…'}</p></footer>`;const [key,defaultName,short]=reverseAppMeta(step?.app);const label=reverseAppearance.names[key]||defaultName;const custom=reverseAppearance.icons[key];const openedIcon=reverseIconMarkup(key,custom,short).replace('<i ','<span class="ta-reverse-opened-icon ').replace('</i>','</span>');return `<section class="ta-reverse-browser ta-reverse-app-${esc(key)} is-${esc(step?.stage||'history')}"><header><button type="button" disabled>‹</button>${openedIcon}<div><small>${esc(reverseViewer?.name||'用户')}的手机 · ${Number(step?.position||0)+1}/${total||1}</small><h2>${esc(label||'正在打开…')}</h2></div><i>•••</i></header><main>${reverseSyncedAppPage(step?.app,step?.visualSource||step?.source||{})}</main>${footer}</section>`; }
  function parseTakeoverResult(value) { const raw=String(value||'').replace(/```(?:json)?|```/gi,'').trim();const clean=rows=>(Array.isArray(rows)?rows:[]).map(item=>String(item?.text||item||'').trim()).filter(Boolean).slice(0,3);let parsed={};const start=raw.indexOf('{');const end=raw.lastIndexOf('}');if(start>=0&&end>start){let json=raw.slice(start,end+1).replace(/[，]/g,',').replace(/,\s*([}\]])/g,'$1');try{parsed=JSON.parse(json);}catch{}}let sent=clean(parsed.takeoverMessages||parsed.sent);let replies=clean(parsed.replies||parsed.replyMessages);const extract=keys=>{for(const key of keys){const match=raw.match(new RegExp(`["']?${key}["']?\\s*[:：]\\s*\\[([\\s\\S]*?)\\]`,'i'));if(match){const rows=[...match[1].matchAll(/["“']([^"”']+)["”']/g)].map(item=>item[1]);if(rows.length)return clean(rows);}}return [];};if(!sent.length)sent=extract(['takeoverMessages','sent','顶号消息','发送']);if(!replies.length)replies=extract(['replies','replyMessages','回复']);if(!sent.length||!replies.length){const lines=raw.split(/\r?\n/).map(item=>item.replace(/^[-*\d.、\s]+/,'').trim()).filter(item=>item&&!/[{}\[\]]/.test(item));if(!sent.length)sent=clean(lines.slice(0,Math.max(1,Math.ceil(lines.length/2))));if(!replies.length)replies=clean(lines.slice(Math.max(1,Math.ceil(lines.length/2))));}return {sent,replies}; }
  function appendTakeoverMessage(data,targetId,text,role,owner,index,meta={}) { const chat=data.chats?.[targetId];if(!chat)return null;chat.messages=Array.isArray(chat.messages)?chat.messages:[];const safeText=meta.type==='image'?String(text||''):cleanTakeoverBubble(text);const message={id:uid('takeover'),role,text:safeText,type:'',profileId:chat.profileId||'',time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),createdAt:Date.now()+index,...meta};if(role==='user')message.takeoverByRoleId=owner.id;else{message.replyToTakeover=true;message.unread=true;}chat.messages.push(message);return message; }
  async function runChatTakeover(owner,conversation,visualSource,config,model) { if(!conversation?.isOtherRole)return;const all=read(chatKey,{});const target=(all.contacts||[]).find(item=>item.id===conversation.contactId);const targetChat=all.chats?.[conversation.contactId];if(!target||!targetChat)return;const history=(targetChat.messages||[]).slice(-16).map(item=>`${item.role==='user'?(reverseViewer?.name||'用户'):(target.nickname||target.name)}：${item.text||item.content||''}`).join('\n');const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{timeout:120000,method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.86,max_tokens:1000,stream:false,messages:[{role:'system',content:'你负责模拟一次角色偷偷使用用户手机顶号发消息的剧情。顶号者发送的内容必须体现顶号者本人的人设和目的，但接收者看到的账号仍是用户。接收者不知道顶号真相，除非消息本身足以令其怀疑。禁止替现实用户做决定。只返回合法 JSON。'},{role:'user',content:`顶号角色：${owner.nickname||owner.name}\n顶号角色人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,4500)}\n被联系角色：${target.nickname||target.name}\n被联系角色人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,4500)}\n用户账号名：${reverseViewer?.name||'用户'}\n用户与被联系角色最近聊天：\n${history||'暂无'}\n请生成顶号角色借用户账号发出的 1—3 条短消息，以及被联系角色随后回复的 1—3 条短消息。输出：{"takeoverMessages":[""],"replies":[""]}。每项都是独立聊天气泡，4—30 字。`} ]})});if(!response.ok)throw new Error(`顶号生成失败：HTTP ${response.status}`);const payload=await response.json();const result=parseTakeoverResult(apiResponseText(payload));const visual=visualSource?.conversation;reverseLive={...reverseLive,stage:'takeover',takeoverTyping:'',finding:reverseLive.finding};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(700);let sequence=0;for(const text of result.sent){let typed='';for(const char of text){typed+=char;reverseLive.takeoverTyping=typed;if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(55+Math.floor(Math.random()*75));}const saved=appendTakeoverMessage(all,target.id,text,'user',owner,sequence++);if(visual&&saved)visual.messages.push({speaker:reverseViewer?.name||'用户',speakerType:'user',text,time:saved.time,takeoverByRoleId:owner.id});reverseLive.takeoverTyping='';if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(500);}reverseLive.takeoverWaiting=true;if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(1100);for(const text of result.replies){const saved=appendTakeoverMessage(all,target.id,text,'character',owner,sequence++);if(visual&&saved)visual.messages.push({speaker:target.nickname||target.name,speakerType:'character',text,time:saved.time,replyToTakeover:true});if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(650);}localStorage.setItem(chatKey,JSON.stringify(all));window.dispatchEvent(new CustomEvent('ideal-machine-chat-updated'));reverseLive.takeoverWaiting=false;reverseLive.takeoverDone=true;if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(1400); }
  async function runReverseCheckV2(owner,forceCaught=false) {
    if(reverseBusy)return;const config=window.IdealMachineAPI?.getConfig?.()||{};const model=window.IdealMachineAPI?.getModel?.('ta')||window.IdealMachineAPI?.getModel?.('chat');if(!config.endpoint||!config.key||!model)return window.alert('请先在设置中配置 AI 接口。');const evidence=userPhoneEvidence(owner);reverseViewer=evidence.user;reverseAppearance=await loadReverseAppearance();evidence.visualApps.相册=await loadReverseAlbumVisual(evidence.visualApps.相册);evidence.visualApps.聊天=await loadReverseChatVisual(evidence.visualApps.聊天);reverseForceCaught=false;reverseBusy=true;reverseLive={stage:'thinking',app:'',source:{},position:0,total:1};render();await reverseWait(2600);const success=Math.random()*100<reverseSuccessRate(owner.id);if(reverseForceCaught||!success)return runCaughtReverseV2(owner,config,model,reverseForceCaught,true);const candidates=reverseShuffle(Object.entries(evidence.apps).filter(([name,data])=>name==='聊天'?(data.conversations||[]).length:reverseDataLines(data,2).length));if(!candidates.length){reverseBusy=false;reverseLive=null;render();return window.alert('用户手机里还没有可以查岗的内容。');}const count=Math.min(candidates.length,3+Math.floor(Math.random()*3));const chosen=candidates.slice(0,count);const findings=[];reverseStep=0;
    try{for(let index=0;index<chosen.length;index+=1){const [appName,appData]=chosen[index];const selectedConversation=appName==='聊天'?reverseShuffle(appData.conversations||[])[0]:null;const source=selectedConversation?{conversation:selectedConversation}:appData;const visualConversation=selectedConversation?evidence.visualApps?.聊天?.conversations?.find(item=>item.contactId===selectedConversation.contactId):null;const visualSource=appName==='相册'?evidence.visualApps?.相册:visualConversation?{conversation:visualConversation}:source;reverseLive={stage:'thinking',app:'',source:{},visualSource:null,position:index,total:chosen.length};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(2600);if(reverseForceCaught)return await runCaughtReverseV2(owner,config,model,true,true);reverseLive={stage:'desktop',app:appName,source,visualSource,position:index,total:chosen.length};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(1900);if(reverseForceCaught)return await runCaughtReverseV2(owner,config,model,true,true);reverseLive={...reverseLive,stage:'opening'};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(1050);if(reverseForceCaught)return await runCaughtReverseV2(owner,config,model,true,true);reverseLive={...reverseLive,stage:'browsing'};if(reverseOpen&&app.classList.contains('is-open'))render();const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{timeout:120000,method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.8,max_tokens:650,stream:false,messages:[{role:'system',content:'模拟主角色偷偷查看用户手机中的一个真实 App。只能依据提供的数据，不得捏造记录。严格符合角色人设。只输出一行 VIEW 格式。打开聊天 App 时，可以查看绑定同一用户设定的全部角色聊天；必须区分当前角色自己的会话与用户和其他角色的会话，并依据当前角色人设自然反应，不要预设一定吃醋。已去世 NPC 只能作为旧记录被看到，不能当前发言或行动。'},{role:'user',content:`角色：${owner.nickname||owner.name}\n角色设定：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,3500)}\n当前打开：${appName}\n当前 App 完整相关数据：${JSON.stringify(source)}\n只输出“VIEW｜看到的项目标题｜实际看懂的具体内容｜角色当下真实反应”。`} ]})});if(!response.ok)throw new Error(`${appName}：HTTP ${response.status}`);const data=await response.json();if(reverseForceCaught)return await runCaughtReverseV2(owner,config,model,true,true);const finding=parseReverseView(appName,apiResponseText(data),source);findings.push({...finding,source});reverseLive={...reverseLive,stage:'viewed',finding};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(appName==='聊天'?7000:4300);}
      const finalResponse=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{timeout:120000,method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.78,max_tokens:1400,stream:false,messages:[{role:'system',content:'角色刚刚偷偷查完用户本人的手机，现在主动去找用户并进入双方的聊天页面发消息。必须牢牢记住：被查看的是用户的手机，不是角色自己的手机；说话者始终是角色本人，接收者始终是用户。角色只能依据亲眼看到的记录和自身人设反应，不得身份互换、不得替用户发言、不得写旁白或系统总结。只返回 JSON。'},{role:'user',content:`角色：${owner.nickname||owner.name}\n角色设定：${String(owner.details||owner.signature||'暂无').slice(0,3000)}\n用户网名：${reverseViewer?.name||'用户'}\n明确情境：我（角色）刚查完对方（用户）的手机，现在去找对方发消息。\n发现：${JSON.stringify(findings.map(({source,...item})=>item))}\n只输出 JSON：{\"final\":\"整体情绪和决定\",\"messages\":[\"角色气泡1\",\"角色气泡2\",\"角色气泡3\"]}。messages 必须有 若干条完整、连续、符合角色人设的角色消息，每条 4—24 字、只表达一个意思，每项会成为一个独立的角色侧聊天气泡。禁止把多句话挤进一个数组项。`} ]})});if(!finalResponse.ok)throw new Error(`整理反应失败：HTTP ${finalResponse.status}`);const finalData=await finalResponse.json();const parsedFinal=parseReverseChatResult(apiResponseText(finalData),findings.at(-1)?.reaction||'TA 看完了你的手机。');parsedFinal.messages=reverseShortMessages(parsedFinal.messages);if(parsedFinal.messages.length<2)throw new Error('角色回复不足多条短消息，请重新尝试');const summary=parsedFinal.summary;const message=parsedFinal.messages.join('\n');const check={id:uid('reverse-check'),createdAt:Date.now(),roleId:owner.id,findings,summary,message,messages:parsedFinal.messages};const all=read('ideal-machine-ta-reverse-checks',{});all[owner.id]=[check,...(Array.isArray(all[owner.id])?all[owner.id]:[])].slice(0,20);localStorage.setItem('ideal-machine-ta-reverse-checks',JSON.stringify(all));parsedFinal.messages.forEach((text,index)=>saveReverseMessage(owner,text,`${check.id}:${index}`));reverseStep=0;reverseLive={stage:'chat',app:'聊天',position:chosen.length,total:chosen.length};if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(1600);handoffReverseChat(owner.id);
    }catch(error){window.alert(`角色查手机失败：${error.message||'未知错误'}`);}finally{reverseBusy=false;reverseLive=null;if(app.classList.contains('is-open'))render();}
  }
  function reversePageV2(owner) { const latest=reverseChecks(owner.id)[0];if(reverseBusy&&reverseLive){const scene=reverseLive.stage==='desktop'?reverseDesktopStage(reverseLive):reverseLive.stage==='chat'?reverseChatStage(owner):reverseBrowseCard(reverseLive,reverseLive.total);return `<section class="ta-reverse-page is-live"><header><button type="button" data-ta-reverse-close>‹</button><div><small>SECRET CHECK · ${Number(reverseLive.position||0)+1}/${reverseLive.total||1}</small><h1>${reverseLive.stage==='desktop'?'TA 回到了桌面':reverseLive.stage==='chat'?'TA 正在去聊天':`TA 打开了${esc(reverseLive.app)}`}</h1></div></header><main>${scene}</main></section>`;}const finding=latest?.findings?.[Math.min(reverseStep,Math.max(0,(latest?.findings?.length||1)-1))];return `<section class="ta-reverse-page"><header><button type="button" data-ta-reverse-close>‹</button><div><small>SECRET CHECK</small><h1>TA 看我</h1></div></header><main><div class="ta-reverse-hero"><i>${avatar(owner)}</i><span><small>本次查岗角色</small><b>${esc(owner.nickname||owner.name)}</b><p>TA 会回到用户手机桌面，滑到目标 App 后自动打开，查完再进入与你的聊天。</p></span><button type="button" data-ta-reverse-run ${reverseBusy?'disabled':''}>${reverseBusy?'正在后台查看…':'让 TA 偷偷查手机'}</button></div>${finding?`${reverseBrowseCard({...finding,position:reverseStep,total:latest.findings.length,finding},latest.findings.length)}<nav class="ta-reverse-nav"><button type="button" data-ta-reverse-step="-1" ${reverseStep<=0?'disabled':''}>上一个 App</button><span>${reverseStep+1} / ${latest.findings.length}</span><button type="button" data-ta-reverse-step="1" ${reverseStep>=latest.findings.length-1?'disabled':''}>下一个 App</button></nav>${reverseStep===latest.findings.length-1?`<div class="ta-reverse-final"><small>查完后的决定</small><p>${esc(latest.summary)}</p>${latest.message?`<b>随后发给你：${esc(latest.message)}</b>`:''}</div>`:''}`:'<p class="ta-role-empty">还没有查岗记录。开始后会看到角色逐个打开 App 的过程。</p>'}</main></section>`; }
  function reversePageV3(owner) {
    if(reverseBusy&&reverseLive){
      const scene=['thinking','desktop'].includes(reverseLive.stage)?reverseDesktopStage(reverseLive):reverseLive.stage==='caught'?reverseCaughtStage(owner):reverseLive.stage==='chat'?reverseChatStage(owner):reverseBrowseCard(reverseLive,reverseLive.total);
      const title=reverseLive.stage==='thinking'?'TA 正在考虑查哪里':reverseLive.stage==='caught'?'反查手机失败':reverseLive.stage==='desktop'?'TA 选好了下一个 App':reverseLive.stage==='chat'?`TA 正在去找 ${esc(reverseViewer?.name||'用户')}`:`TA 打开了${esc(reverseLive.app)}`;
      const catchButton=!['caught','chat'].includes(reverseLive.stage)?'<button class="ta-reverse-catch-now" type="button" data-ta-reverse-catch-now>过去看看 TA 在干嘛</button>':'';
      return `<section class="ta-reverse-page is-live"><header><button type="button" data-ta-reverse-close>‹</button><div><small>SECRET CHECK · ${Number(reverseLive.position||0)+1}/${reverseLive.total||1}</small><h1>${title}</h1></div><button class="ta-reverse-rate-open" type="button" disabled aria-label="查岗成功概率">%</button></header><main>${scene}${catchButton}</main></section>`;
    }
    const rate=reverseSuccessRate(owner.id);return `<section class="ta-reverse-page"><header><button type="button" data-ta-reverse-close>‹</button><div><small>SECRET CHECK</small><h1>TA 看我</h1></div><button class="ta-reverse-rate-open" type="button" data-ta-reverse-rate-open aria-label="设置查岗成功概率">%</button></header><main><div class="ta-reverse-hero"><i>${avatar(owner)}</i><span><small>本次查岗角色</small><b>${esc(owner.nickname||owner.name)}</b><p>当前成功率 ${rate}%，被发现概率 ${100-rate}%。点击后 TA 会尝试偷偷查看用户手机。</p></span><button type="button" data-ta-reverse-run>让 TA 偷偷查手机</button></div></main></section>${reverseRateOpen?reverseRateSheet(owner):''}`;
  }
  window.IdealMachineApps = window.IdealMachineApps || {}; window.IdealMachineApps.ta = { name: 'Ta' };
  function taDoubaoActionImage(type) { return `<img src="assets/ui/doubao-action-${type}.jpeg" alt="">`; }
  doubaoActionIcon = taDoubaoActionImage;
  function cleanTakeoverBubble(value) {
    return String(value||'').replace(/[“”"]/g,'').replace(/\\n/g,' ').replace(/\s+/g,' ').trim();
  }
  function mergeSingleCharacterBubbles(rows) { const merged=[];(rows||[]).map(cleanTakeoverBubble).filter(Boolean).forEach(item=>{if(item.length===1&&merged.length)merged[merged.length-1]+=item;else if(item.length>1)merged.push(item);});return merged; }
  function incompleteTakeoverBubble(value,minLength=4) {
    const text=cleanTakeoverBubble(value);
    const unfinishedPhrase=/(?:拿个|找个|说个|讲个|看个|做个|买个|弄个|取个|挑个|选个|写个|发个|来个|问个|拿一下|找一下|说一下|讲一下|看一下|听一下|做一下|弄一下|问一下|一点|一个|一份|一张|一件|一条|一遍|一场|一趟|听着|因为|但是|可是|所以|如果|而且|然后|就是|以及|或者|还是|并且|不过|至于|关于)$/;
    return text.length<minLength||/[，,：:；;、]$/.test(text)||/(?:因为|但是|可是|所以|如果|而且|然后|就是|这个|那个|以及|或者|还是|并且|不过|至于|关于|让|把|被|从|向|对|跟|和)$/.test(text)||unfinishedPhrase.test(text)||(/[（(《【]/.test(text)&&!/[）)》】]/.test(text));
  }
  function splitCompleteTakeoverMessages(rows) {
    const parts=[];
    for (const row of mergeSingleCharacterBubbles(rows)) {
      const text=String(row||'').replace(/\s+/g,' ').trim();
      const sentences=text.match(/[^。！？!?]+[。！？!?]+/g) || [];
      const consumed=sentences.join('').length;
      const tail=text.slice(consumed).trim();
      if (sentences.length && !tail) parts.push(...sentences.map(item=>item.trim()));
      else parts.push(text);
    }
    if(parts.length<3){
      const clauses=parts.flatMap(text=>text.split(/(?<=[，,；;])/).map(item=>item.trim()).filter(Boolean));
      if(clauses.length>=3)return clauses.slice(0,5);
    }
    if(parts.length<=5)return parts;
    return [parts[0],parts[1],parts.slice(2,-2).join(''),parts.at(-2),parts.at(-1)].filter(Boolean);
  }
  function limitTakeoverReplyLength(rows) {
    return splitCompleteTakeoverMessages(rows).map(text=>String(text||'').trim()).filter(Boolean).map(text=>{
      if(text.length<=42)return text;
      const pieces=text.split(/(?<=[，,；;。！？!?])/).map(item=>item.trim()).filter(Boolean);const result=[];let current='';
      pieces.forEach(piece=>{if(current&&current.length+piece.length>42){result.push(current);current='';}current+=piece;});if(current)result.push(current);
      return result.length?result.join('｜'):text;
    }).flatMap(text=>text.split('｜')).slice(0,5);
  }
  const caughtFirstPersonMessagesBase = caughtFirstPersonMessages;
  caughtFirstPersonMessages = function(messages,owner) { return mergeSingleCharacterBubbles(caughtFirstPersonMessagesBase(messages,owner)); };
  const parseTakeoverResultBase = parseTakeoverResult;
  parseTakeoverResult = function(value) { const result=parseTakeoverResultBase(value);result.sent=mergeSingleCharacterBubbles(result.sent);result.replies=mergeSingleCharacterBubbles(result.replies);return result; };
  const parseTakeoverAliasesBase = parseTakeoverResult;
  parseTakeoverResult = function(value) {
    const result=parseTakeoverAliasesBase(value);const raw=String(value||'').replace(/```(?:json)?|```/gi,'').trim();
    try { const start=raw.indexOf('{'),end=raw.lastIndexOf('}');if(start>=0&&end>start){const parsed=JSON.parse(raw.slice(start,end+1));const extra=parsed.replies||parsed.replyMessages||parsed.responses||parsed.reply||parsed.messages;if(Array.isArray(extra))result.replies=mergeSingleCharacterBubbles(extra).slice(0,5);const sentRows=parsed.takeoverMessages||parsed.sent;if(Array.isArray(sentRows))result.sent=mergeSingleCharacterBubbles(sentRows).slice(0,5); } } catch {}
    return result;
  };
  const variableBubbleRules='【消息数量规则覆盖】不要为了固定条数生成或拆分消息。根据当前对话自然输出需要的若干条短消息即可，允许只有 1 条，也允许多条；唯一硬性要求是每条都是自然、完整、可独立发送的短句，不能截断、不能停在逗号或未完成的连接词上。';
  const parseTakeoverResultRecoveryBase=parseTakeoverResult;
  parseTakeoverResult=function(value){
    const result=parseTakeoverResultRecoveryBase(value);const raw=String(value||'').replace(/```(?:json)?|```/gi,'').trim();
    try{
      const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
      if(start>=0&&end>start){
        const parsed=JSON.parse(raw.slice(start,end+1));
        const rows=value=>Array.isArray(value)?value:[value];
        const sentRows=parsed.takeoverMessages||parsed.takeoverMessage||parsed.sent||parsed.sendMessages;
        const replyRows=parsed.replyMessages||parsed.replies||parsed.reply;
        if(!result.sent.length&&sentRows)result.sent=mergeSingleCharacterBubbles(rows(sentRows)).slice(0,6);
        if(!result.replies.length&&replyRows)result.replies=mergeSingleCharacterBubbles(rows(replyRows)).slice(0,6);
        if(!result.sent.length&&!result.replies.length&&Array.isArray(parsed.messages))result.sent=mergeSingleCharacterBubbles(parsed.messages).slice(0,6);
      }
    }catch{}
    if(!result.sent.length&&!result.replies.length){
      const lines=raw.split(/\r?\n/).map(line=>line.replace(/^[-*\d.、\s]+/,'').trim()).filter(line=>line&&!/[{}\[\]]/.test(line)&&!/^只输出|^输出格式|^takeoverMessages|^replyMessages/i.test(line));
      if(lines.length)result.sent=mergeSingleCharacterBubbles(lines).slice(0,6);
    }
    return result;
  };
  const reverseWaitBase = reverseWait;
  function scrollReverseChatLatest(immediate=false) {
    const pin=()=>{const box=app.querySelector('.ta-reverse-chat-conversation > .chat-messages');if(!box)return;box.scrollTop=Math.max(0,box.scrollHeight-box.clientHeight);};
    if(immediate)pin();
    requestAnimationFrame(()=>{pin();requestAnimationFrame(pin);});
  }
  runChatTakeover = async function(owner,conversation,visualSource,config,model,takeoverGate=null) {
    if(!conversation?.isOtherRole)return;const all=read(chatKey,{});const target=(all.contacts||[]).find(item=>item.id===conversation.contactId);const targetChat=all.chats?.[conversation.contactId];if(!target||!targetChat)return;
    const profile=(all.profiles||[]).find(item=>item.id===targetChat.profileId)||{};const originalMessages=(targetChat.messages||[]).slice();const history=originalMessages.slice(-16).map(item=>`${item.role==='user'?(profile.nickname||profile.realName||'用户'):(target.nickname||target.name)}：${item.text||item.content||''}`).join('\n');const userExamples=originalMessages.filter(item=>item.role==='user'&&(item.text||item.content)).slice(-18).map(item=>item.text||item.content).join('\n');const ownerExamples='';const ownerRelationshipHistory='';
    const takeoverRules=`【顶号功能 / Impersonation Mode】\n当前特殊剧情：角色 A 正在未经用户允许的情况下查看用户手机，并使用用户与角色 B 的聊天窗口主动发送消息。必须严格区分三方：用户是真正的手机主人；角色 A 是当前实际操作手机和发送消息的人；角色 B 是聊天窗口另一端的人。任何角色都不得使用上帝视角。\n\n【角色 A 发送规则】\n从用户账号发出的消息，实际发送者均为角色 A，不是用户本人。A 必须先完整读取自己的完整人设、价值观、关系、习惯、情绪、目的和过去真实说话样本，再读取用户与 B 的真实聊天记录，判断两人的关系、惯用称呼、语气、聊天习惯和近期话题。A 要尝试让消息看起来像用户可能会发，但不能完全丢失 A 自身的动机、情绪和措辞痕迹；A 的模仿程度必须由 A 对用户的了解程度决定。A 可以试探、套话、阴阳怪气、挑拨、确认关系、吃醋、查证或故意越界，但具体行为必须符合 A 人设。不得直接复制历史原句，不得长篇解释，不得一次发送一大段文字，不得输出旁白、动作说明或分析。A 的消息必须发给 B，不是发给手机主人；手机主人只提供账号和可见聊天背景。\n\n【A 输出格式】\n连续发送若干条短消息。每条应尽量是 2—18 个汉字，极少超过 25 个汉字；可以出现短句、问号、省略号、表情或突然改口，多条消息要有真实聊天节奏，不要把一篇完整作文机械切开。每条必须语义完整，不得停在逗号、连接词、半个词或未完成的意图上，不使用双引号。\n\n【角色 B 识别规则】\nB 收到消息后不得默认发送者一定是用户。B 必须根据用户与 B 过去的聊天习惯、常用称呼、标点、语气词、句子长度、是否会主动问类似问题、当前消息是否突然改变语气、是否出现 A 的措辞或情绪、时间和上下文、B 对用户的熟悉程度以及 B 自身敏感或迟钝的性格，判断当前发送者。识别结果必须自然产生，不能因为系统提示自动识破。B 可以处于未察觉、起疑或识破状态：未察觉时把对方当用户正常回复；起疑时通过反问、提及只有用户知道的细节、故意换称呼或暂时不正面回答来确认；只有证据足够时才能识破，而且表达必须符合 B 人设。\n\n【B 回复规则】\nB 只根据自己当前相信的事实回复，不能上帝视角知道发送者一定是 A，不能无理由点名 A，不能替用户补充未发生的行为，不能解释识别过程，不能输出概率、分析或内部判断。若起疑，优先继续聊天确认；若未察觉，正常把对方当用户；若识破，可装作没发现、冷淡试探、直接质问、故意配合、反过来戏弄 A、停止回复或联系用户，但必须符合 B 人设。B 连续生成 若干条独立回复气泡，每条完整，不得为了凑数量截断或使用通用兜底话。\n\n【信息边界与核心目标】\nA 只能使用自己原本知道的信息，以及当前手机中可见的用户与 B 聊天记录和剧情明确允许查看的信息；不能因为系统提示自动获得用户全部秘密。B 只能使用自己已知的信息、与用户过去真实发生的互动和当前收到的消息。重点不是完美模仿用户，而是表现 A 试图冒充用户、A 的人设不经意泄露、B 根据熟悉程度逐渐判断，以及真假身份之间的信息差和张力。`;
    const normalizeTakeoverPrompt=value=>String(value||'').replace(/生成 1[—-]3 个完整短气泡/g,'生成若干个完整短气泡').replace(/1[—-]3 条消息/g,'若干条消息').replace(/最多 3 个短气泡/g,'生成若干个独立短气泡').replace(/每条回复控制在 4[—-]42 个汉字/g,'每条回复控制在 4—36 个汉字').replace(/\["消息1","消息2"\]/g,'["消息1","消息2","消息3"]').replace(/\["完整消息1","完整消息2"\]/g,'["完整消息1","完整消息2","完整消息3"]').replace(/\["符合人设的完整消息"\]/g,'["完整消息1","完整消息2","完整消息3"]').replace(/\["回复1","回复2"\]/g,'["回复1","回复2","回复3"]');
    const strictBubbleRules='【气泡格式强制规则】输出若干个独立气泡。每个数组项只放一个语义完整的气泡，保持短句，标点按角色习惯自然使用。先在心里逐项检查：数组数量是否合理、每条是否完整、是否存在双引号、是否停在逗号或连接词；不合格就先重写再输出。禁止为了凑数量把同一句机械切断，也禁止把多条内容塞进一个数组项。';
    const takeoverPromptReference=`【顶号功能 / Takeover Sender】当前触发特殊剧情：角色 A 正在未经用户允许的情况下查看用户的手机，并使用用户与角色 B 的聊天窗口主动发送消息。你必须严格区分三方：用户是真正的手机主人；角色 A 是当前实际操作手机、真正发送消息的人；角色 B 是聊天窗口另一端的角色，也是当前消息的实际收件人。任何角色都不得使用上帝视角。本轮任务只负责生成角色 A 借用用户账号发送给角色 B 的消息，禁止扮演角色 B，禁止生成角色 B 的回复，禁止描述用户本人正在做什么。生成前必须综合理解：角色 A 人设、角色 A 与用户的关系和记忆、用户设定、角色 B 基础信息、用户与角色 B 的历史聊天记录、当前剧情和最近发生的事情。角色 A 必须先理解自己的性格、价值观、关系状态、目的、情绪、习惯和真实说话方式，再阅读用户与角色 B 的真实聊天记录，不得只根据最后一条消息机械生成。角色 A 当前知道自己正在操作用户手机、正在使用用户账号、当前窗口另一端是角色 B、手机中当前真实可见的用户与角色 B 的聊天内容、自己原本知道的信息和剧情明确允许获得的信息；角色 A 不知道系统提示中的幕后信息、不知道没有看到或经历过的秘密、不知道角色 B 当前真实心理活动，也不能因为模型知道完整剧情就自动获得这些信息。角色 A 的消息实际收件人永远是角色 B，消息中的你、你们、他、她、对方、昨晚、那件事、我们等指代都必须符合当前聊天语境，绝不能写成角色 A 在对用户本人讲话。角色 A 知道自己正在冒用用户账号，因此应根据历史聊天自然模仿用户对角色 B 的惯用称呼、句子长度、语气词、标点、连续发消息习惯、撒娇、冷淡、直接或阴阳怪气的方式，但不得完美复制用户，不得直接复制历史原句；角色 A 自身的人设、性格、目的、情绪和措辞习惯必须仍然存在。角色 A 越冲动、嫉妒、占有欲强、愤怒、好奇或控制欲强，越容易自然泄露自己的痕迹，但不得故意自曝身份。角色 A 可以试探、套话、确认关系、确认角色 B 对用户的感情、查证、吃醋、阴阳怪气、越界、挑拨、测试反应、故意暧昧、故意冷淡或获取只有角色 B 才知道的信息，但只能选择符合角色 A 人设、关系和当前情境的行为，禁止让所有角色 A 自动吃醋、挑拨或发疯。角色 A 应连续发送若干条独立聊天消息，每条尽量 2—18 个汉字，极少超过 25 个汉字；可以使用短句、问号、省略号、语气词、符合角色和用户习惯的表情或突然改口，多条消息之间要有真实即时聊天节奏，不得把完整作文机械拆成若干条自然短句，不得为了凑数量输出无意义内容。至少有一条消息应自然联系用户与角色 B 历史聊天中的真实事件、称呼、人物、约定、地点、礼物、见面或持续话题，但不得强行塞入信息，不得凭空制造历史中不存在的事实。禁止输出旁白、动作描写、心理描写、分析、身份解释、系统提示、机制解释、Markdown、代码围栏、用户、角色 A、角色 B、我正在冒充你或 JSON 之外的任何文字；禁止一次输出一整段长作文；禁止空字符串；禁止停在逗号、但是、所以、然后、因为、如果、其实我等明显未完成的表达上，但“然后呢”“所以？”“但是？”这类本身完整的聊天表达可以保留；不得使用中文或英文双引号包裹消息正文。最终只能输出合法 JSON：{"takeoverMessages":["第一条消息","第二条消息","第三条消息"]}。takeoverMessages 必须是长度不固定的字符串数组，不得包含 null、对象、嵌套数组或其他字段。`;
    const aAddressRules=`【本次三方身份】角色 A：“${owner.nickname||owner.name}”；手机主人：“${profile.nickname||profile.realName||reverseViewer?.name||'用户'}”；角色 B：“${target.nickname||target.name}”。当前实际发消息的人是 A，实际收件人是 B。A 可以模仿用户的聊天习惯，但每句话都必须是在对 B 说，不能把手机主人当成听话对象。生成前检查：消息是否同时体现用户账号的表层习惯和 A 自身不经意泄露的动机、情绪或措辞；是否回应了用户与 B 聊天中的具体内容；是否符合 A 与 B 的关系。角色 B 人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,4000)}。`;
    const askPlain=async(system,content,temperature=.84,max_tokens=1100)=>{const normalizedSystem=normalizeTakeoverPrompt(system);const isCharacterGeneration=/【唯一身份】你只能是角色 B|【本次必须执行】|这是最后一次重写|你就是“[^”]+”本人/.test(normalizedSystem);const response=await window.fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature,max_tokens:isCharacterGeneration?Math.max(max_tokens,900):max_tokens,stream:false,messages:[{role:'system',content:`${normalizedSystem}${isCharacterGeneration?`\n${strictBubbleRules}`:''}`},{role:'user',content:normalizeTakeoverPrompt(content)}]})});if(!response.ok)throw new Error(`顶号生成失败：HTTP ${response.status}`);return apiResponseText(await response.json());};
    const ask=async(system,content)=>{const normalizedSystem=normalizeTakeoverPrompt(system);const isAftermath=/已经看到对方回复|决定下一步/.test(normalizedSystem);return askPlain(isAftermath?`${normalizedSystem}\n${aAddressRules}`:`${takeoverRules}\n${takeoverPromptReference}\n${aAddressRules}\n${normalizedSystem}\n${strictBubbleRules}\n${variableBubbleRules}`,normalizeTakeoverPrompt(content));};
    const sentResult=parseTakeoverResult(await ask(`【唯一身份】你就是“${owner.nickname||owner.name}”本人，不是旁白或剧情作者。你正在偷偷使用用户手机，以用户账号联系角色 B“${target.nickname||target.name}”。先完整读取角色 B 的人设以及用户与 B 的具体聊天，再形成一个只有角色 A 才会有、并且明确针对角色 B 的目的。你接下来所有话都直接对角色 B 说；用户只是账号主人，绝不是这些话的收件人。可以结合用户与 B 的聊天习惯进行有限模仿，让消息看起来像用户可能会发，但不能完全丢失 A 自身的动机、情绪、关系痕迹和说话习惯。措辞、称呼、攻击方式、克制程度、幽默感和情绪必须能由 A 人设、B 人设、上下文和历史台词支持。不得机械套用任何通用霸总、吃醋或质问模板；只有与当前具体关系和聊天内容成立时才可以使用类似表达。不能自报幕后身份。不要输出分析、动作或对方回复，只返回 JSON。`,`角色 A 的完整人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,5000)}\n角色 B 的完整人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,5000)}\n角色 A 过去真实说过的话：\n${ownerExamples||'暂无样本，请严格依据人设'}\n手机主人（只提供账号，不能成为收件人）：${profile.nickname||profile.realName||reverseViewer?.name||'用户'}\n唯一收件人角色 B：${target.nickname||target.name}\n用户与角色 B 的真实聊天：\n${history||'暂无'}\n角色 A 的每条消息都必须能明确理解为在对 B 进行回应、质问、试探或要求，不能是在对用户说话；同时要体现 A 试图模仿用户但不经意露出 A 痕迹。必须针对上面聊天中的具体称呼、事件、约定或措辞。只输出 {"takeoverMessages":["消息1","消息2"]}，生成 1—3 个完整短气泡。`));
    let sent=splitCompleteTakeoverMessages(sentResult.sent);const originalSent=sent.slice();let reviewed={sent};try{reviewed=parseTakeoverResult(await ask(`你就是“${owner.nickname||owner.name}”本人。检查下面准备发送的消息是否有截断、残句、引号未闭合、语义没说完或不像你本人。必须补成自然完整的聊天气泡，同时保留 A 试图模仿用户但不经意露出自身痕迹的效果。只有当内容与当前 A、B 的关系或聊天上下文不成立时才重写；不能因为表达直接就一律改成质问，也不能抹掉 A 的人设。不要解释，只返回 JSON。`,`角色 A 人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,4500)}\n角色 B 人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,3500)}\nA 过去真实说话样本：${ownerExamples||'暂无'}\n用户与 B 的具体聊天：${history||'暂无'}\n待检查消息：${JSON.stringify(sent)}\n只输出 {"takeoverMessages":["完整消息1","完整消息2"]}。每条语义完整，必须是 A 发给 B 的消息。`));}catch{}sent=splitCompleteTakeoverMessages(reviewed.sent?.length?reviewed.sent:originalSent);let sequence=0;
    const incomplete=text=>incompleteTakeoverBubble(text,1);const collectValidATakeover=rows=>splitCompleteTakeoverMessages(rows).map(cleanTakeoverBubble).filter(text=>!incomplete(text));let validSent=collectValidATakeover(sent).slice(0,5);for(let attempt=0;attempt<3&&validSent.length<1;attempt+=1){try{const repaired=parseTakeoverResult(await ask(`你就是“${owner.nickname||owner.name}”本人。当前消息有截断、残句或不符合上下文，必须重写。返回若干条独立消息，每条都要语义完整，不要求固定条数。消息收件人是角色 B，不是用户。禁止双引号，禁止逗号、连接词、半个词或“听着”结尾。不要解释，只返回 JSON。`,`角色 A 人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,5000)}\n角色 B 人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,3500)}\n用户与角色 B 的聊天：${history||'暂无'}\n当前不合格消息：${JSON.stringify(validSent)}\n输出 {"takeoverMessages":["完整气泡1","完整气泡2","完整气泡3"]}，数组可以有若干项。`));const candidate=collectValidATakeover(repaired.sent).slice(0,5);if(candidate.length>=1)validSent=candidate;else validSent=[...validSent,...candidate.filter(text=>!validSent.includes(text))].slice(0,6);}catch{}}sent=validSent;if(sent.length<1)throw new Error('角色 A 没有返回完整短消息，请重新尝试');
    const assessmentRaw=await askPlain('你是独立的消息来源鉴别器，不扮演任何角色，也不生成回复。屏幕上的账号属于用户，但新消息的实际发送者未知。只能比较文字风格、称呼、记忆和上下文，绝对不能因为消息来自用户账号就判定是用户。只输出合法 JSON。',`账号主人过去真实发送的样本：\n${userExamples||'样本不足'}\n\n本次突然出现的新消息：\n${sent.join('\n')}\n\n输出 {"verdict":"USER|NOT_USER|UNCERTAIN","reason":"一句具体依据"}。USER=高度像账号主人；NOT_USER=明显不像；UNCERTAIN=证据不足。`,.15,300);let identity={verdict:'UNCERTAIN',reason:'样本不足'};try{const clean=String(assessmentRaw||'').replace(/```(?:json)?|```/gi,'').trim();const start=clean.indexOf('{'),end=clean.lastIndexOf('}');if(start>=0&&end>start)identity={...identity,...JSON.parse(clean.slice(start,end+1))};}catch{}if(!['USER','NOT_USER','UNCERTAIN'].includes(identity.verdict))identity.verdict='UNCERTAIN';const identityAssessment=`${identity.verdict}｜${String(identity.reason||'无明确依据').slice(0,160)}`;const transcript=originalMessages.slice(-16).map(item=>`${item.role==='user'?'账号主人':target.nickname||target.name}：${String(item.text||item.content||'')}`).join('\n');const responsePolicy=identity.verdict==='NOT_USER'?'你已明显察觉发送者不像账号主人。按你的性格表现警惕、试探、拒绝或核验，必须针对异常措辞给出具体反应；不要装作正常聊天，也不能直接知道幕后是谁。':identity.verdict==='USER'?'你认为发送者高度像账号主人。按你与账号主人的关系正常回应具体内容，不要无故质疑身份。':'证据不足。按你的性格一边回应具体内容，一边自然地保留疑心或做轻度核验；不能直接断言是谁。';const bSamples=originalMessages.filter(item=>item.role!=='user'&&(item.text||item.content)).slice(-8).map(item=>String(item.text||item.content||'')).join('\n');const bSystem=`【唯一身份】你只能是角色 B“${target.nickname||target.name}”本人。\n【重要事实】这个聊天账号属于用户，但刚发消息的人身份未知；“账号方向”与“实际发送者”是两回事。你不知道角色 A 在幕后，也禁止说出“顶号”“角色 A”等幕后信息。\n【强制顺序】1. 完整读取 B 人设；2. 接受独立鉴别器的来源结论；3. 严格执行与结论对应的回复策略；4. 用 B 本人的措辞回复新消息的具体内容。\n【本次来源结论】${identityAssessment}\n【本次回复策略】${responsePolicy}\n【B 完整人设】${String(target.details||target.signature||target.identity||'暂无').slice(0,6000)}\n【B 过去真实语气样本】${bSamples||'样本不足，只能依据完整人设'}\n每条 4—42 个汉字，最多 3 个短气泡。禁止空泛回复“怎么突然问这个”“怎么了”“你在说什么”；禁止输出分析、来源结论或旁白。只返回 JSON：{"replies":["回复1","回复2"]}。`;let bPrompt=`账号主人设定：${String(profile.persona||profile.details||'暂无').slice(0,3000)}\n账号主人历史说话样本：\n${userExamples||'样本不足'}\n\n本次消息出现之前的聊天：\n${transcript||'暂无'}\n\n本次实际发送者未知的新消息：\n${sent.join('\n')}\n\n请严格按来源结论和 B 人设回复这些新消息。`;let replyResult=parseTakeoverResult(await askPlain(bSystem,bPrompt,.72,900));const genericB=/^(?:怎么突然问这个|怎么突然|怎么了|你在说什么|发生什么)$/;if(replyResult.replies.some(text=>genericB.test(String(text||'').trim()))){try{const reviewedB=parseTakeoverResult(await askPlain(`${bSystem}\n上一次回复过于空泛，必须重写，并体现来源结论对应的态度。`,`${bPrompt}\n无效回复：${JSON.stringify(replyResult.replies)}`,.62,700));if(reviewedB.replies?.length)replyResult=reviewedB;}catch{}}replyResult.replies=limitTakeoverReplyLength(replyResult.replies);
    bPrompt+=`\nB 过去真实回复样本（只用于学习 B 的个人语气，不得照抄）：\n${bSamples||'样本不足'}\n请引用本次新消息中的具体内容，并保持 B 独有的称呼、句式和态度。`;
    const invalidBReply=text=>incompleteTakeoverBubble(text,1)||String(text||'').length>60||/^[“”"'‘’\s]*(?:怎么突然问这个|怎么突然|怎么了|你在说什么|发生什么)[?？。！!"”'’\s]*$/.test(String(text||''));
    const collectValidBReplies=rows=>limitTakeoverReplyLength(rows).map(cleanTakeoverBubble).filter(text=>!invalidBReply(text));
    let validReplies=collectValidBReplies(replyResult.replies).slice(0,5);
    for(let attempt=0;attempt<3&&validReplies.length<1;attempt+=1){
      try{
        const repaired=parseTakeoverResult(await askPlain(`${bSystem}\n【本次必须执行】重新生成若干个独立完整回复气泡。必须先逐句读取角色 A 刚发的消息，再按来源结论和角色 B 人设回答。每个气泡都必须具体、有承接关系、语义完整；严禁通用兜底句、空泛反问、残句和双引号。`,`${bPrompt}\n当前已生成的回复：${JSON.stringify(validReplies)}\n请给出一组完整替代回复，不要解释。只输出 {"replies":["完整气泡1","完整气泡2","完整气泡3"]}，数组可以有若干项。`,.68-attempt*.08,1200));
        const candidate=collectValidBReplies(repaired.replies).slice(0,5);
        if(candidate.length>=1)validReplies=candidate;
        else validReplies=[...validReplies,...candidate.filter(text=>!validReplies.includes(text))].slice(0,6);
      }catch{}
    }
    if(validReplies.length<1)throw new Error('角色 B 没有返回完整短回复，请重新尝试');
    if(takeoverGate){const allowed=await takeoverGate;if(allowed===false)return;}
    const visual=visualSource?.conversation;reverseLive={...reverseLive,stage:'takeover',takeoverTyping:'',finding:reverseLive.finding};if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest(true);await reverseWait(600);scrollReverseChatLatest(true);
    for(const text of sent){let typed='';for(const char of text){typed+=char;reverseLive.takeoverTyping=typed;if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(55+Math.floor(Math.random()*65));}const saved=appendTakeoverMessage(all,target.id,text,'user',owner,sequence++);if(visual&&saved)visual.messages.push({id:saved.id,speaker:profile.nickname||profile.realName||'用户',speakerType:'user',text,time:saved.time,takeoverByRoleId:owner.id});reverseLive.takeoverTyping='';if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(550);}
    reverseLive.takeoverWaiting=true;if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(700);for(const text of validReplies){const saved=appendTakeoverMessage(all,target.id,text,'character',owner,sequence++);if(visual&&saved)visual.messages.push({id:saved.id,speaker:target.nickname||target.name,speakerType:'character',text,time:saved.time,replyToTakeover:true});if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(700);}
    const replies=validReplies;
    const stickers=(all.emojis?.groups||[]).flatMap(group=>group.items||[]).filter(item=>item?.url).slice(0,30);let aftermath={action:'keep',followups:[],draft:'',sendSticker:''};try{const raw=await ask(`你就是顶号角色“${owner.nickname||owner.name}”。你已经看到对方回复，现在决定下一步。必须严格符合你的人设与目的。可以继续追问、用手机主人已有的表情包、撤回自己的一条消息、删除自己发送的痕迹、保留现场，或者故意在输入框留下未发送草稿。不要机械地每次追问；克制的人也可以就此停手。只返回 JSON。`,`你的人设：${String(owner.details||owner.signature||owner.identity||'暂无').slice(0,4500)}\n你和用户的近期关系：${ownerRelationshipHistory||'暂无'}\n你刚才借用户账号发送：${JSON.stringify(sent)}\n对方回复：${JSON.stringify(replies)}\n可用表情包（只能按名字选择）：${JSON.stringify(stickers.map(item=>item.text||item.name||'未命名'))}\n输出 {"action":"keep|recall|delete|draft","followups":["0—2条完整消息"],"draft":"未发送草稿或空串","sendSticker":"表情包名字或空串"}。followups 必须针对对方刚才的回复；action=recall 只撤回你最后一条文字，delete 会从用户聊天里彻底删除你发过的消息。`);const clean=String(raw||'').replace(/```json|```/gi,'').trim();const start=clean.indexOf('{'),end=clean.lastIndexOf('}');if(start>=0&&end>start)aftermath={...aftermath,...JSON.parse(clean.slice(start,end+1))};}catch{}
    const followups=splitCompleteTakeoverMessages(aftermath.followups||[]).filter(text=>text&&!/[，,：:；;、]$/.test(text)).slice(0,2);for(const text of followups){let typed='';for(const char of text){typed+=char;reverseLive.takeoverTyping=typed;if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(45+Math.floor(Math.random()*45));}const saved=appendTakeoverMessage(all,target.id,text,'user',owner,sequence++);if(visual&&saved)visual.messages.push({id:saved.id,speaker:profile.nickname||profile.realName||'用户',speakerType:'user',text,time:saved.time,takeoverByRoleId:owner.id});reverseLive.takeoverTyping='';if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(420);}
    let stickerWasSent=false;if(aftermath.sendSticker){const wanted=String(aftermath.sendSticker);const sticker=stickers.find(item=>wanted.includes(item.text||item.name||'未命名'));if(sticker){const description=sticker.text||sticker.name||'未命名';const saved=appendTakeoverMessage(all,target.id,sticker.url,'user',owner,sequence++,{type:'image',sticker:true,stickerDescription:description});if(visual&&saved)visual.messages.push({id:saved.id,speaker:profile.nickname||profile.realName||'用户',speakerType:'user',text:sticker.url,type:'sticker',media:sticker.url,stickerDescription:description,time:saved.time,takeoverByRoleId:owner.id});stickerWasSent=true;}}
    if(followups.length||stickerWasSent){reverseLive.takeoverWaiting=true;if(reverseOpen&&app.classList.contains('is-open'))render();try{const secondHistory=targetChat.messages.slice(-22).map(item=>({role:item.role==='user'?'user':'assistant',content:item.type==='image'?(item.sticker?`[表情包：${item.stickerDescription||'未命名'}]`:'[图片]'):String(item.text||item.content||'')}));const secondResponse=await window.fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify({model,temperature:.8,max_tokens:650,stream:false,messages:[{role:'system',content:`你只能是“${target.nickname||target.name}”本人。人设：${String(target.details||target.signature||target.identity||'暂无').slice(0,5500)}。这是同一段连续聊天，对方刚刚又发送了新内容。结合前面的身份疑点和你的性格继续回应；可以核实只有用户知道的细节，也可以停止回应。禁止知道幕后顶号者。只输出 {"replies":["0—2条完整回复"]}。`},...secondHistory]})});if(secondResponse.ok){const second=parseTakeoverResult(apiResponseText(await secondResponse.json())).replies.slice(0,2);for(const text of second){const saved=appendTakeoverMessage(all,target.id,text,'character',owner,sequence++);if(visual&&saved)visual.messages.push({id:saved.id,speaker:target.nickname||target.name,speakerType:'character',text,time:saved.time,replyToTakeover:true});if(reverseOpen&&app.classList.contains('is-open'))render();await reverseWait(600);}}}catch{}reverseLive.takeoverWaiting=false;}
    const takeoverRows=targetChat.messages.filter(message=>message.takeoverByRoleId===owner.id);if(aftermath.action==='recall'&&takeoverRows.length){const row=[...takeoverRows].reverse().find(message=>message.type!=='image')||takeoverRows.at(-1);row.recalled=true;row.recalledText=row.text;row.text='';const visualRow=visual?.messages?.find(message=>message.id===row.id);if(visualRow){visualRow.recalled=true;visualRow.recalledText=visualRow.text;visualRow.text='';}}else if(aftermath.action==='delete'&&takeoverRows.length){const ids=new Set(takeoverRows.map(message=>message.id));targetChat.messages=targetChat.messages.filter(message=>!ids.has(message.id));if(visual)visual.messages=visual.messages.filter(message=>!ids.has(message.id));}
    if(String(aftermath.draft||'').trim()){targetChat.draft=String(aftermath.draft).trim();targetChat.takeoverDraftByRoleId=owner.id;}localStorage.setItem(chatKey,JSON.stringify(all));window.dispatchEvent(new CustomEvent('ideal-machine-chat-updated'));reverseLive.takeoverWaiting=false;reverseLive.takeoverDone=true;if(reverseOpen&&app.classList.contains('is-open'))render();scrollReverseChatLatest();await reverseWait(1300);
  };
  const takeoverPersonaFallback = runChatTakeover;
  runChatTakeover = async function(owner,conversation,visualSource,config,model,takeoverGate=null) {
    await takeoverPersonaFallback(owner,conversation,visualSource,config,model,takeoverGate);
    const all=read(chatKey,{});const chat=all.chats?.[conversation?.contactId];if(!chat)return;
    const target=(all.contacts||[]).find(item=>item.id===conversation?.contactId);const generic=/^[“”"'‘’\s]*(?:你刚才在和谁聊|怎么突然问这个|你现在已经在外面吹冷风了)[?？。！!"”'’\s]*$/;
    const fallback=`${target?.nickname||target?.name||'你'}，我想问清楚你刚才提到的那件事。`;
    chat.messages.filter(item=>item.takeoverByRoleId===owner.id&&generic.test(String(item.text||'').trim())).forEach(item=>{item.text=fallback;});
    localStorage.setItem(chatKey,JSON.stringify(all));
    const visualMessages=visualSource?.conversation?.messages||[];visualMessages.filter(item=>item.takeoverByRoleId===owner.id&&generic.test(String(item.text||'').trim())).forEach(item=>{item.text=fallback;});
  };
  const reverseSyncedAppPageBase = reverseSyncedAppPage;
  reverseSyncedAppPage = function(name,source) {
    if(name!=='聊天')return reverseSyncedAppPageBase(name,source);
    const item=source?.activeConversation||source?.conversation;if(!item)return '<p class="ta-reverse-app-empty">这个 App 当前没有记录。</p>';
    const settings=item.settings||{};const style=`${settings.wallpaper?`background-image:url(&quot;${esc(settings.wallpaper)}&quot;);`:''}--chat-user-bubble:${esc(settings.userBubbleColor||'#222222')};--chat-user-text:${esc(settings.userBubbleTextColor||'#ffffff')};--chat-character-bubble:${esc(settings.characterBubbleColor||'#ffffff')};--chat-character-text:${esc(settings.characterBubbleTextColor||'#111111')}`;
    const rows=(item.messages||[]).map(message=>{const isUser=message.speakerType==='user';const messageAvatar=settings.hideAvatar?'':`<span class="chat-avatar chat-message-avatar">${avatar({name:message.speaker,avatar:isUser?item.userAvatar:item.avatar})}</span>`;const stamp=settings.hideTimestamp||message.recalled?'':`<small>${esc(message.time||'')}</small>`;const rawMedia=String(message.media||message.text||'').trim();const lowerMedia=rawMedia.toLowerCase();const looksSticker=message.type==='sticker'||lowerMedia.includes('/stickers/')||lowerMedia.startsWith('assets/stickers/');const looksImage=looksSticker||message.type==='image'||/\.(?:png|jpe?g|gif|webp)(?:[?#].*)?$/i.test(rawMedia)||/^data:image\//i.test(rawMedia);const visualType=message.recalled?'recalled-bubble':looksSticker?'sticker':looksImage?'image':message.type||'';let content=message.recalled?'<span class="chat-recalled">你撤回了一条消息</span>':esc(message.text||'');if(!message.recalled&&looksImage&&rawMedia)content=`<img class="ta-reverse-message-image${looksSticker?' is-sticker':''}" src="${esc(rawMedia)}" alt="${looksSticker?'表情包':'图片'}" onerror="this.hidden=true">`;else if(!message.recalled&&message.type==='voice')content=`<span class="ta-reverse-message-voice">◖◗　${esc(message.text||'语音消息')}</span>`;else if(!message.recalled&&message.type==='transfer')content=`<span class="ta-reverse-message-transfer">转账　${esc(message.text||'')}</span>`;return `<div class="chat-message ${isUser?'is-user':'is-character'}"><div class="chat-message-line">${messageAvatar}<div class="chat-bubble ${esc(visualType)}">${content}</div>${stamp}</div></div>`;}).join('');
    return `<div class="chat-conversation ta-reverse-chat-conversation" style="${style}"><div class="chat-person"><span class="chat-avatar">${avatar({name:item.with,avatar:item.avatar})}</span><div><b>${esc(item.with||'联系人')}</b><small>${esc(item.relationship||'具体聊天')}</small></div></div><div class="chat-messages">${rows||'<p class="ta-reverse-app-empty">还没有聊天记录。</p>'}</div></div>`;
  };
  let reverseTakeoverKey = '';
  let reverseTakeoverPreparation = null;
  const takeoverWarmupObserver = new MutationObserver(() => {
    if(!reverseBusy||reverseLive?.app!=='聊天'||reverseLive?.stage!=='browsing'||reverseTakeoverPreparation)return;
    const target=reverseLive.source?.conversation;
    if(!target?.isOtherRole)return;
    const config=window.IdealMachineAPI?.getConfig?.()||{};
    const model=window.IdealMachineAPI?.getModel?.('ta')||window.IdealMachineAPI?.getModel?.('chat');
    if(!config.endpoint||!config.key||!model)return;
    const key=`${role()?.id||''}:${target.contactId||''}:${reverseLive.position||0}`;
    if(key===reverseTakeoverKey)return;
    let releaseGate;
    const gate=new Promise(resolve=>{releaseGate=resolve;});
    const preparation={key,release:releaseGate,error:null,promise:null};
    reverseTakeoverKey=key;
    reverseTakeoverPreparation=preparation;
    preparation.promise=runChatTakeover(role(),target,reverseLive.visualSource,config,model,gate).catch(error=>{preparation.error=error;});
  });
  takeoverWarmupObserver.observe(app,{childList:true,subtree:true});
  reverseWait = async function(ms) {
    if (ms === 7000 && reverseBusy && reverseLive?.app === '聊天' && reverseLive.stage === 'viewed') {
      if(reverseTakeoverPreparation){
        const preparation=reverseTakeoverPreparation;
        preparation.release(true);
        await preparation.promise;
        reverseTakeoverPreparation=null;
        if(preparation.error)throw preparation.error;
        return reverseWaitBase(500);
      }
      const evidence = userPhoneEvidence(role());
      const candidates = evidence.apps?.聊天?.conversations?.filter(item => item.isOtherRole) || [];
      const target = reverseShuffle(candidates)[0];
      const key = `${role()?.id || ''}:${target?.contactId || ''}:${reverseLive.position || 0}`;
      if (target && key !== reverseTakeoverKey) {
        reverseTakeoverKey = key;
        const visual = evidence.visualApps?.聊天?.conversations?.find(item => item.contactId === target.contactId) || target;
        reverseLive.source = { conversation: target };
        reverseLive.visualSource = { conversation: visual };
        if (reverseOpen && app.classList.contains('is-open')) render();
        const config = window.IdealMachineAPI?.getConfig?.() || {};
        const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat');
        if (config.endpoint && config.key && model) await runChatTakeover(role(), target, reverseLive.visualSource, config, model);
      }
      return reverseWaitBase(500);
    }
    return reverseWaitBase(ms);
  };
  const takeoverComposerObserver = new MutationObserver(() => {
    if (!reverseBusy || reverseLive?.stage !== 'takeover') return;
    const conversation = app.querySelector('.ta-reverse-chat-conversation');
    if (!conversation || conversation.querySelector('.ta-reverse-takeover-composer')) return;
    conversation.insertAdjacentHTML('beforeend', `<div class="ta-reverse-takeover-composer"><span>${esc(reverseLive.takeoverTyping || (reverseLive.takeoverWaiting ? '对方正在输入…' : reverseLive.takeoverDone ? '已发送' : ''))}</span><i>${reverseLive.takeoverTyping ? '发送' : ''}</i></div>`);
    scrollReverseChatLatest(true);
  });
  takeoverComposerObserver.observe(app, { childList:true, subtree:true });
  const reverseCheatObserver = new MutationObserver(() => {
    if (!reverseOpen || !reverseBusy || reverseLive?.stage !== 'thinking') return;
    const phone=app.querySelector('.ta-reverse-user-phone.is-thinking');
    if(!phone)return;
    const choices=reverseUserApps();
    phone.querySelectorAll('.ta-reverse-desktop-pages main > article').forEach((item,index)=>{const name=choices[index]?.[1];if(!name)return;item.dataset.taReversePrefer=name;item.classList.toggle('is-selected',reversePreferredApp===name);});
    const footer=phone.querySelector('footer span');const footerText=reversePreferredApp?`已暗选“${reversePreferredApp}”，TA 将打开它…`:'点击一个 App 暗中指定；不点击则由 TA 随机选择…';if(footer&&footer.textContent!==footerText)footer.textContent=footerText;
  });
  reverseCheatObserver.observe(app, { childList:true, subtree:true });
  const appearanceSaveObserver = new MutationObserver(() => {
    const sheet=app.querySelector('.ta-appearance-sheet > section');const saveButton=sheet?.querySelector('[data-ta-appearance-save]');
    if(!sheet)return;
    const head=sheet.querySelector('.ta-appearance-section-head');
    if(head&&!head.classList.contains('is-reference-layout')){head.classList.add('is-reference-layout');const title=head.querySelector(':scope > span');if(title)title.textContent='App 图标与名称';const actions=head.querySelector(':scope > div');const modify=actions?.querySelector('[data-ta-icons-modify]');const reset=actions?.querySelector('[data-ta-icons-reset]');if(modify)modify.textContent='从其他导入';if(reset)reset.textContent='恢复默认图标与名称';if(actions&&!actions.querySelector('[data-ta-icon-batch-album]'))actions.insertAdjacentHTML('afterbegin','<button type="button" data-ta-icon-batch-album>从相册批量设置</button>');const tip=sheet.querySelector('.ta-icon-swap-tip');if(tip)tip.textContent='依次点击两个 App 图标即可交换，保存更改后生效。';}
    if(!saveButton||saveButton.closest('.ta-appearance-save-footer'))return;
    const footer=document.createElement('footer');footer.className='ta-appearance-save-footer';saveButton.parentElement?.removeChild(saveButton);footer.appendChild(saveButton);sheet.appendChild(footer);
  });
  appearanceSaveObserver.observe(app,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-ta-reverse-run]')){reverseTakeoverKey='';if(reverseTakeoverPreparation){reverseTakeoverPreparation.release(false);reverseTakeoverPreparation=null;}}},true);
  document.addEventListener('click', event => {
    const button=event.target.closest?.('[data-ta-reverse-prefer]');
    if(!button||!app.classList.contains('is-open')||!reverseBusy||reverseLive?.stage!=='thinking')return;
    event.preventDefault();event.stopImmediatePropagation();const selected=button.dataset.taReversePrefer||'';reversePreferredApp=reversePreferredApp===selected?'':selected;
    app.querySelectorAll('[data-ta-reverse-prefer]').forEach(item=>item.classList.toggle('is-selected',item.dataset.taReversePrefer===reversePreferredApp));
    const hint=app.querySelector('.ta-reverse-user-phone footer span');if(hint)hint.textContent=reversePreferredApp?`已暗选“${reversePreferredApp}”，TA 将打开它…`:'点击一个 App 暗中指定；不点击则由 TA 随机选择…';
  },true);
})();
