(() => {
  const chatKey = 'ideal-machine-chat';
  const storageKey = 'ideal-machine-ta';
  const calendarDaysKey = 'ideal-machine-ta-calendar-days';
  const app = document.createElement('div'); app.className = 'ta-app'; document.body.appendChild(app);
  const apps = [['liaotian','聊天','chat','#8bb8f1'],['luntan','论坛','forum','#f1a66f'],['rili','日历','calendar','#ee9b9b'],['qinglvkongjian','情侣空间','couple','#dc91b7'],['yinyue','音乐','music','#9e9ae9'],['doubao','豆包','doubao','#8ec8c2'],['gouwu','购物','shop','#e5b27d']];
  let state = readState(); let activeApp = ''; let activeChatTarget = ''; let activeDetail = null; let activeCalendarDate = localDateKey(new Date()); let npcBusy = false; let refreshing = false; let refreshPickerOpen = false; let selectedRefreshApps = new Set(); let doubaoHistoryOpen = false; let selectedDoubaoHistory = -1;
  function readState() { try { return { roleId: JSON.parse(localStorage.getItem(storageKey) || '{}').roleId || '' }; } catch { return { roleId: '' }; } }
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
  const fetch = (input, init = {}) => window.IdealMachineFetch ? window.IdealMachineFetch(input, { ...init, idealScope:'ta', timeout:init.timeout || 120000 }) : window.fetch(input, init);
  // 关闭或离开 Ta 只隐藏页面，不取消正在进行的刷新；结果完成后仍会写入本地数据。
  function roles() { const data = read(chatKey, {}); return Array.isArray(data.contacts) ? data.contacts : []; }
  function role() { return roles().find(item => item.id === state.roleId) || roles()[0]; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function avatar(item) { return item?.avatar ? `<img src="${esc(item.avatar)}" alt="">` : esc((item?.nickname || item?.name || 'Ta').slice(0, 1)); }
  function icon(type) { const paths = { chat:'<path d="M8 10h32v22H19l-9 7v-7H8z"/><path d="M15 17h18M15 23h12"/>', forum:'<path d="M9 11h30v21H19l-8 6v-6H9z"/><path d="M16 18h16M16 24h10"/>', calendar:'<rect x="10" y="11" width="28" height="27" rx="4"/><path d="M16 8v7M32 8v7M10 19h28M17 26h.01M24 26h.01M31 26h.01M17 32h.01M24 32h.01"/>', couple:'<path d="M24 38S8 28 8 17a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-14 21-14 21z"/>', music:'<path d="M31 10v22M31 10l9-2v21M31 32c0 4-4 7-8 7s-7-2-7-5 3-6 7-6 8 1 8 4zM40 29c0 4-4 7-8 7"/>', doubao:'<path d="M10 27c0-10 7-17 16-17s12 5 12 13c0 9-7 16-17 16H10z"/><path d="M18 23h.01M30 23h.01M18 30c3 3 7 3 10 0"/>', shop:'<path d="M10 20h28v19H10zM8 20l3-9h26l3 9M16 20v4M24 20v4M32 20v4M16 39V29h16v10"/>' }; return `<svg viewBox="0 0 48 48" aria-hidden="true">${paths[type] || ''}</svg>`; }
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
  function doubaoActionIcon(type) { const paths = { copy:'<rect x="14" y="12" width="18" height="22" rx="3"/><path d="M20 12V9h14a3 3 0 0 1 3 3v18h-5"', voice:'<path d="M24 9a6 6 0 0 0-6 6v10a6 6 0 0 0 12 0V15a6 6 0 0 0-6-6zM12 23a12 12 0 0 0 24 0M24 35v6M19 41h10"', like:'<path d="M20 39H12a3 3 0 0 1-3-3V23a3 3 0 0 1 3-3h8l5-10c1-2 5-1 5 2l-1 8h7c3 0 4 3 3 5l-4 11a4 4 0 0 1-4 3h-11z"', dislike:'<path d="M20 9H12a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h8l5 10c1 2 5 1 5-2l-1-8h7c3 0 4-3 3-5l-4-11a4 4 0 0 0-4-3h-11z"', share:'<path d="m12 27 23-16-4 11 8 4-23 12 5-10z"', retry:'<path d="M36 19a13 13 0 1 0 1 11M36 19v9h-9"' }; return `<svg viewBox="0 0 48 48" aria-hidden="true">${paths[type] || ''}</svg>`; }
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
      if (key === 'shopping' && /^(?:SHOPPING|SHOP|购物|商品)$/.test(label)) { const [price, title, status, ...purpose] = parts; if (title) rows.push({ price, title, status, text:purpose.join('｜') }); }
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
  // 单 App 刷新优先使用稳定的逐行协议，同时兼容旧版 JSON 返回。
  async function refreshSelectedApp(owner, key) {
    if (key === 'chat') return refreshRoleChats(owner);
    if (refreshing) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('ta') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置 AI 接口。');
    const chat = read(chatKey, {}); const current = chat.chats?.[owner.id] || {};
    const profile = (chat.profiles || []).find(item => item.id === current.profileId); const book = worldbook(owner);
    const labels = { calendar:'今天的日程安排', music:'最近听的音乐和收藏', doubao:'正在使用豆包的聊天记录', shopping:'最近浏览、购买或想买的东西' };
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
      shopping:'不要返回 JSON。每行严格使用“SHOPPING｜价格｜商品完整名称｜订单状态｜角色买它的具体用途”。一次生成 5—8 件不同商品，价格写成“¥39.90”，订单状态使用待发货、运输中、已签收或想买；商品要像淘宝订单中的真实商品名称，并符合角色近期生活。'
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
    return `<section class="ta-order-list"><header><small>RECENT ORDERS</small><h2>最近订单</h2><p>点击商品可以查看角色买来做什么。</p></header>${rows.map((item, index) => { const price = String(item.price || '价格未知'); return `<article><div class="ta-order-shop"><b>理想生活选物</b><span>${esc(item.status || '已签收')}</span></div><button type="button" data-ta-detail="shopping" data-ta-detail-index="${index}"><i>${icon('shop')}</i><span><b>${esc(item.title || item.name || '未命名商品')}</b><small>${esc(item.status || '查看订单详情')}</small></span><strong>${esc(/^[¥￥]/.test(price) || !/^\d/.test(price) ? price : `¥${price}`)}</strong><em>›</em></button></article>`; }).join('')}</section>`;
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
    return roleShopping(owner);
  }
  function roleApp(owner) {
    const meta = apps.find(item => item[0] === activeApp) || apps[0];
    if (activeApp === 'liaotian' && activeChatTarget) return roleConversation(owner, activeChatTarget);
    if (activeApp === 'doubao') return roleDoubao(owner, snapshot(owner));
    const pageRefreshKey = { rili:'calendar', yinyue:'music', gouwu:'shopping' }[activeApp];
    const refreshButton = activeApp === 'liaotian'
      ? `<button class="ta-app-header-refresh ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-chat-refresh aria-label="刷新聊天" ${refreshing ? 'disabled' : ''}>↻</button>`
      : pageRefreshKey ? `<button class="ta-app-header-refresh ${refreshing ? 'is-refreshing' : ''}" type="button" data-ta-page-refresh="${pageRefreshKey}" aria-label="刷新${meta[1]}" ${refreshing ? 'disabled' : ''}>↻</button>` : '';
    return `<section class="ta-role-app-page"><header class="ta-role-app-header"><button type="button" data-ta-home>‹</button><div><small>${esc(owner.nickname || owner.name)} 的手机</small><h1>${meta[1]}</h1></div>${refreshButton}</header><main class="ta-role-app-main"><div class="ta-role-perspective"><span>ROLE VIEW</span><b>正在查看 ${esc(owner.nickname || owner.name)} 的${meta[1]}</b><small>这是角色手机中的内容，不是用户视角</small></div>${roleContent(activeApp, owner)}</main>${roleDetailSheet(owner)}</section>`;
  }
  function refreshPicker() { const options = [['chat','聊天','同步用户消息并生成 NPC 对话','chat'],['calendar','日历','角色今天的行程安排','calendar'],['music','音乐','角色最近听歌与收藏','music'],['doubao','豆包','角色和豆包的聊天记录','doubao'],['shopping','购物','角色的购物记录','shop']]; const allSelected = selectedRefreshApps.size === options.length; return `<div class="ta-refresh-sheet"><div class="ta-refresh-backdrop" data-ta-refresh-close></div><section><header><div><small>REFRESH ROLE PHONE</small><h2>刷新哪些 App？</h2></div><button type="button" data-ta-refresh-close>×</button></header><button class="ta-refresh-select-all" type="button" data-ta-refresh-all><i class="${allSelected ? 'is-checked' : ''}">${allSelected ? '✓' : ''}</i><span>全选</span></button><main>${options.map(([key,name,description,iconName]) => `<button class="${selectedRefreshApps.has(key) ? 'is-selected' : ''}" type="button" data-ta-refresh-app="${key}"><i>${icon(iconName)}</i><span><b>${name}</b><small>${description}</small></span><em>${selectedRefreshApps.has(key) ? '✓' : ''}</em></button>`).join('')}</main><button class="ta-refresh-submit" type="button" data-ta-refresh-submit ${selectedRefreshApps.size ? '' : 'disabled'}>刷新选中的 ${selectedRefreshApps.size || ''} 个 App</button></section></div>`; }
  function syncRefreshPicker() { const sheet = app.querySelector('.ta-refresh-sheet'); if (!sheet) return; const keys = ['chat','calendar','music','doubao','shopping']; const allSelected = selectedRefreshApps.size === keys.length; const allIcon = sheet.querySelector('[data-ta-refresh-all] i'); if (allIcon) { allIcon.classList.toggle('is-checked', allSelected); allIcon.textContent = allSelected ? '✓' : ''; } sheet.querySelectorAll('[data-ta-refresh-app]').forEach(button => { const selected = selectedRefreshApps.has(button.dataset.taRefreshApp); button.classList.toggle('is-selected', selected); const mark = button.querySelector('em'); if (mark) mark.textContent = selected ? '✓' : ''; }); const submit = sheet.querySelector('[data-ta-refresh-submit]'); if (submit) { submit.disabled = !selectedRefreshApps.size; submit.textContent = `刷新选中的 ${selectedRefreshApps.size || ''} 个 App`; } }
  function render() { const list = roles(); const owner = role(); if (owner && owner.id !== state.roleId) { state.roleId = owner.id; saveState(); } app.innerHTML = owner && activeApp ? roleApp(owner) : `<section class="ta-phone-page"><div class="ta-wallpaper"></div><div class="ta-phone-head"><button type="button" data-ta-role-picker><i>${avatar(owner)}</i><span><b>${esc(owner?.nickname || owner?.name || 'Ta 的手机')}</b><small>${owner ? '角色手机' : '还没有角色'}</small></span><em>⌄</em></button><div class="ta-head-actions"><button type="button" data-ta-refresh ${refreshing ? 'disabled' : ''} aria-label="刷新角色手机">${refreshing ? '…' : '↻'}</button><button type="button" class="ta-close" data-ta-close>×</button></div></div><main class="ta-phone-main">${owner ? `<div class="ta-welcome"><span>TA'S PHONE</span><h1>${esc(owner.nickname || owner.name)} 的手机</h1><p>${esc(owner.signature || owner.identity || '这里收纳着角色的日常。')}</p></div><div class="ta-app-grid">${apps.map(([key, name, iconName, color]) => `<button class="ta-app-icon" data-ta-role-app="${key}" type="button"><i style="--ta-icon-color:${color}">${icon(iconName)}</i><span>${name}</span></button>`).join('')}</div>` : `<div class="ta-no-role"><i>⌁</i><h2>还没有角色手机</h2><p>先在聊天 App 中创建一个角色，再来查看 Ta 的手机。</p></div>`}</main></section>${app.classList.contains('is-role-picker') ? rolePicker(list) : ''}${refreshPickerOpen ? refreshPicker() : ''}`; }
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
  document.addEventListener('click', event => { if (event.target.closest('[data-app-key="ta"]')) { state = readState(); activeApp = ''; activeChatTarget = ''; activeDetail = null; activeCalendarDate = localDateKey(new Date()); refreshPickerOpen = false; selectedRefreshApps.clear(); doubaoHistoryOpen = false; selectedDoubaoHistory = -1; render(); app.classList.add('is-open'); return; } if (!app.classList.contains('is-open')) return; if (event.target.closest('[data-ta-detail-close]')) { activeDetail = null; render(); return; } const detail = event.target.closest('[data-ta-detail]'); if (detail) { activeDetail = { type:detail.dataset.taDetail, index:Number(detail.dataset.taDetailIndex) }; render(); return; } if (event.target.closest('[data-ta-refresh-close]')) { refreshPickerOpen = false; selectedRefreshApps.clear(); render(); return; } if (event.target.closest('[data-ta-refresh-all]')) { const keys = ['chat','calendar','music','doubao','shopping']; if (selectedRefreshApps.size === keys.length) selectedRefreshApps.clear(); else keys.forEach(key => selectedRefreshApps.add(key)); syncRefreshPicker(); return; } const refreshChoice = event.target.closest('[data-ta-refresh-app]'); if (refreshChoice) { const key = refreshChoice.dataset.taRefreshApp; selectedRefreshApps.has(key) ? selectedRefreshApps.delete(key) : selectedRefreshApps.add(key); syncRefreshPicker(); return; } if (event.target.closest('[data-ta-refresh-submit]')) { const owner = role(); const keys = [...selectedRefreshApps]; if (owner && keys.length) refreshSelectedApps(owner, keys); return; } if (event.target.closest('[data-ta-close]')) { app.classList.remove('is-open'); app.classList.remove('is-role-picker'); activeDetail = null; return; } if (event.target.closest('[data-ta-role-picker]')) { app.classList.add('is-role-picker'); render(); return; } if (event.target.closest('[data-ta-role-close]')) { app.classList.remove('is-role-picker'); render(); return; } const selected = event.target.closest('[data-ta-role]'); if (selected) { state.roleId = selected.dataset.taRole; activeDetail = null; activeCalendarDate = localDateKey(new Date()); saveState(); app.classList.remove('is-role-picker'); render(); return; } if (event.target.closest('[data-ta-refresh]')) { if (!role()) return; selectedRefreshApps.clear(); refreshPickerOpen = true; render(); return; } const calendarNav = event.target.closest('[data-ta-calendar-nav]'); if (calendarNav) { activeCalendarDate = shiftDateKey(activeCalendarDate, Number(calendarNav.dataset.taCalendarNav)); render(); return; } const pageRefresh = event.target.closest('[data-ta-page-refresh]'); if (pageRefresh) { const owner = role(); if (owner) { if (pageRefresh.dataset.taPageRefresh === 'calendar' && activeCalendarDate !== localDateKey(new Date())) { window.alert('只能刷新今天的日程；上一天和下一天用于查看已经保存的记录。'); return; } activeDetail = null; refreshSelectedApp(owner, pageRefresh.dataset.taPageRefresh); } return; } if (event.target.closest('[data-ta-chat-refresh]')) { const owner = role(); if (owner) refreshRoleChats(owner); return; } if (event.target.closest('[data-ta-chat-list]')) { activeChatTarget = ''; render(); return; } if (event.target.closest('[data-ta-home]')) { activeApp = ''; activeChatTarget = ''; activeDetail = null; render(); return; } if (event.target.closest('[data-ta-analyze-npc]')) { const owner = role(); if (owner) analyzeNpcs(owner); return; } const chatEntry = event.target.closest('[data-ta-role-chat]'); if (chatEntry) { activeChatTarget = chatEntry.dataset.taRoleChat; render(); return; } const launch = event.target.closest('[data-ta-role-app]'); if (launch) { activeApp = launch.dataset.taRoleApp; activeDetail = null; if (activeApp === 'rili') activeCalendarDate = localDateKey(new Date()); return render(); } });
  window.IdealMachineApps = window.IdealMachineApps || {}; window.IdealMachineApps.ta = { name: 'Ta' };
})();
