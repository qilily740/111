(() => {
  const chatKey = 'ideal-machine-chat';
  const storageKey = 'ideal-machine-couple';
  const app = document.createElement('div');
  app.className = 'couple-app';
  app.innerHTML = '<div class="couple-page"></div><input class="couple-hidden-file" type="file" accept="image/*">';
  document.body.appendChild(app);
  let tab = 'today';
  let recordType = '';
  let openLetterId = '';
  let chapterOpen = false;
  let wishIndex = 0;
  let wishArchiveOpen = false;
  let wishSwipeLockUntil = 0;
  let archiveSelectedIndex = -1;
  let flowerRouletteOpen = false;
  let mysteryOpen = false;
  let mysteryCaseId = '';
  let mysteryClueId = '';
  let mysteryChoice = -1;
  let mysteryView = 'case';
  let mysteryFeedback = '';
  let mysteryDraft = '';
  let mysteryBusy = false;
  let mysteryRequest = 0;
  let mysteryGenerating = false;
  let mysteryGenerateError = '';
  let mysteryFreeDraft = '';
  let mysteryFreeBusy = false;
  let stockGameOpen = false;
  let stockGameState = null;
  let stockGameNotice = '';
  let stockGameNoticeTimer = 0;
  let gamesScrollLeft = 0;
  let flowerRouletteStarted = false;
  let flowerRouletteFirstActor = '';
  let flowerRouletteUserAction = '';
  let flowerRouletteCountdown = 0;
  let flowerRouletteCountdownTimer = 0;
  let flowerRouletteApiBusy = false;
  let flowerRouletteRoleChoice = '';
  let flowerRouletteRoleReply = '';
  let flowerRouletteTurn = '';
  let flowerRouletteFlowerSlot = -1;
  let flowerRouletteShots = 0;
  let flowerRouletteWinner = '';
  let flowerRouletteHistory = [];
  let flowerRouletteSession = 0;
  let flowerRouletteRoleRequest = 0;
  let flowerRouletteProbeUsed = false;
  let flowerRouletteError = '';
  let flowerRouletteEndingReply = '';
  let flowerRouletteEndingBusy = false;
  let flowerRouletteShot = null;
  let roleSelectionOpen = false;

  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const fetch = (input, init = {}) => {
    let next = init;
    try {
      const chat = readChat();
      const currentRole = chat.contacts.find(item => item.id === store.contactId) || {};
      const profileId = chat.chats?.[currentRole.id]?.profileId || '';
      const currentUser = chat.profiles.find(item => item.id === profileId) || {};
      const payload = JSON.parse(init.body);
      const system = payload.messages?.find(item => item.role === 'system');
      if (system && window.IdealMachineRoleUserContext) {
        system.content = `${window.IdealMachineRoleUserContext(currentRole, currentUser)}\n\n${system.content}`;
        next = { ...init, body:JSON.stringify(payload) };
      }
    } catch {}
    return window.IdealMachineFetch ? window.IdealMachineFetch(input, { ...next, idealScope:'couple' }) : window.fetch(input, next);
  };
  const readChat = () => { try { const value = JSON.parse(localStorage.getItem(chatKey) || '{}'); return { contacts: Array.isArray(value.contacts) ? value.contacts : [], profiles: Array.isArray(value.profiles) ? value.profiles : [], chats: value.chats || {} }; } catch { return { contacts: [], profiles: [], chats: {} }; } };
  const emptySpace = () => ({ memories:[], moods:{}, moodReply:'', wishes:[], wishReplies:{}, letters:[], letterReplies:{}, events:[], dates:[], dateIdeas:[], selectedDateIdea:-1, datePlaceConfirmed:false, dateSession:null, dateHistory:[], exchange:null, exchangeHistory:[], answers:{}, roleAnswers:{}, roleNotes:{}, mysteryCases:{}, mysteryRandomCases:{}, dailyQuestionDate:'', dailyQuestionText:'', interaction:'', interactionReply:'', checkins:{}, play:{ title:'', intro:'', prompt:'', turns:[], progress:'', createdAt:0 }, aiPlan:'', dailyMoment:null, presence:null, relationshipReview:null, relationshipReviewHistory:[] });
  const normalizeSpace = value => ({ ...emptySpace(), ...(value && typeof value === 'object' ? value : {}), memories:Array.isArray(value?.memories) ? value.memories : [], moods:value?.moods || {}, wishes:Array.isArray(value?.wishes) ? value.wishes : [], wishReplies:value?.wishReplies || {}, letters:Array.isArray(value?.letters) ? value.letters : [], letterReplies:value?.letterReplies || {}, events:Array.isArray(value?.events) ? value.events : [], dates:Array.isArray(value?.dates) ? value.dates : [], dateIdeas:Array.isArray(value?.dateIdeas) ? value.dateIdeas.slice(0,3) : [], selectedDateIdea:Number.isInteger(value?.selectedDateIdea) ? value.selectedDateIdea : -1, datePlaceConfirmed:value?.datePlaceConfirmed === true, dateSession:value?.dateSession && typeof value.dateSession === 'object' ? value.dateSession : null, dateHistory:Array.isArray(value?.dateHistory) ? value.dateHistory : [], exchange:value?.exchange && typeof value.exchange === 'object' ? value.exchange : null, exchangeHistory:Array.isArray(value?.exchangeHistory) ? value.exchangeHistory.map(String).slice(-50) : [], answers:value?.answers || {}, roleAnswers:value?.roleAnswers || {}, roleNotes:value?.roleNotes || {}, mysteryCases:value?.mysteryCases && typeof value.mysteryCases === 'object' && !Array.isArray(value.mysteryCases) ? value.mysteryCases : {}, mysteryRandomCases:value?.mysteryRandomCases && typeof value.mysteryRandomCases === 'object' && !Array.isArray(value.mysteryRandomCases) ? value.mysteryRandomCases : {}, checkins:value?.checkins && typeof value.checkins === 'object' ? value.checkins : {}, play:value?.play && typeof value.play === 'object' ? { ...emptySpace().play, ...value.play, turns:Array.isArray(value.play.turns) ? value.play.turns : [] } : emptySpace().play, aiPlan:String(value?.aiPlan || ''), presence:value?.presence && typeof value.presence === 'object' ? value.presence : null, relationshipReview:value?.relationshipReview && typeof value.relationshipReview === 'object' ? value.relationshipReview : null, relationshipReviewHistory:Array.isArray(value?.relationshipReviewHistory) ? value.relationshipReviewHistory : [] });
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (value?.spaces && typeof value.spaces === 'object') return { version:2, contactId:value.contactId || '', spaces:Object.fromEntries(Object.entries(value.spaces).map(([id, space]) => [id, normalizeSpace(space)])) };
      const contactId = value?.contactId || readChat().contacts[0]?.id || '';
      const legacy = normalizeSpace(value);
      if (legacy.events.length) { const calendar = (() => { try { const rows = JSON.parse(localStorage.getItem('ideal-machine-calendar-events') || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; } })(); const known = new Set(calendar.map(item => item.id)); legacy.events.forEach(item => { if (!known.has(item.id)) calendar.push({ ...item, contactId:item.contactId || contactId, source:'couple' }); }); localStorage.setItem('ideal-machine-calendar-events', JSON.stringify(calendar)); }
      return { version:2, contactId, spaces:contactId ? { [contactId]:legacy } : {} };
    } catch { return { version:2, contactId:'', spaces:{} }; }
  };
  let store = read();
  let state = emptySpace();
  let eventSignature = '[]';
  let pendingMemory = null;
  let apiBusy = false;
  const readCalendar = () => { try { const value = JSON.parse(localStorage.getItem('ideal-machine-calendar-events') || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const activateRole = roleId => { store.contactId = roleId || ''; if (!roleId) { state = emptySpace(); eventSignature = '[]'; return; } store.spaces[roleId] = normalizeSpace(store.spaces[roleId]); state = store.spaces[roleId]; if (/第一步|第二步|第三步|步骤\s*[一二三123]/.test(state.aiPlan)) state.aiPlan = ''; if (state.dateIdeas.some(item => !item.place)) { state.dateIdeas = []; state.selectedDateIdea = -1; } if (state.relationshipReview && !state.relationshipReview.note) state.relationshipReview = null; state.events = readCalendar().filter(item => item.contactId === roleId || item.authorId === roleId || item.roleId === roleId); eventSignature = JSON.stringify(state.events); };
  const save = (syncEvents = false) => { if (store.contactId) store.spaces[store.contactId] = state; localStorage.setItem(storageKey, JSON.stringify(store)); const eventsChanged = syncEvents || JSON.stringify(state.events) !== eventSignature; if (eventsChanged && store.contactId) { const others = readCalendar().filter(item => item.contactId !== store.contactId && item.authorId !== store.contactId && item.roleId !== store.contactId); const own = state.events.map(item => ({ ...item, contactId:item.contactId || store.contactId, source:item.source || 'couple' })); localStorage.setItem('ideal-machine-calendar-events', JSON.stringify([...others, ...own])); eventSignature = JSON.stringify(state.events); window.IdealMachineRenderCalendar?.(); } };
  const chatData = () => readChat();
  const current = () => { const data = chatData(); const roles = data.contacts.filter(item => item && !item.isGroup); const role = roles.find(item => item.id === store.contactId) || roles[0]; const profileId = role ? data.chats[role.id]?.profileId : ''; const profile = data.profiles.find(item => item.id === profileId); if (role && store.contactId !== role.id) { activateRole(role.id); save(); } else if (role) activateRole(role.id); return { data, role, profile }; };
  const avatar = (item, fallback = '♡') => item?.avatar ? `<img src="${esc(item.avatar)}" alt="">` : `<span>${esc((item?.nickname || item?.name || fallback).slice(0, 1))}</span>`;
  const roleName = role => role?.nickname || role?.name || '角色';
  const profileName = profile => profile?.nickname || profile?.realName || profile?.name || '我';
  const date = () => new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' });
  const todayKey = () => { const now = new Date(); const month = String(now.getMonth() + 1).padStart(2, '0'); const day = String(now.getDate()).padStart(2, '0'); return `${now.getFullYear()}-${month}-${day}`; };
  const checkinSummary = () => { const today = todayKey(); const days = state.checkins || {}; let cursor = new Date(); let streak = 0; while (days[`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`]) { streak += 1; cursor.setDate(cursor.getDate() - 1); } return { today, checked:!!days[today], streak, total:Object.keys(days).length }; };
  const nextEvent = () => { const today = todayKey(); return state.events.map(item => ({ ...item, dateValue:String(item.date || '').slice(0, 10) })).filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.dateValue) && item.dateValue >= today).sort((a, b) => a.dateValue.localeCompare(b.dateValue))[0] || null; };
  const daysUntil = value => { if (!value) return 0; const target = new Date(`${value}T00:00:00`); const start = new Date(`${todayKey()}T00:00:00`); return Math.max(0, Math.round((target - start) / 86400000)); };
  const recentMoments = () => { const rows = []; state.memories.forEach((item, index) => rows.push({ kind:'回忆', title:item.title || '一段回忆', meta:item.date || '刚刚', action:'memories', stamp:item.createdAt || 0, index })); state.events.forEach((item, index) => rows.push({ kind:'日历', title:item.title || '一个纪念日', meta:item.date || '待定', action:'calendar', stamp:item.createdAt || Date.parse(item.date) || 0, index })); state.wishes.forEach((item, index) => rows.push({ kind:item.done ? '完成愿望' : '共同愿望', title:item.text || '一个愿望', meta:item.done ? '已完成' : '进行中', action:'wishes', stamp:item.createdAt || 0, index })); state.letters.forEach((item, index) => rows.push({ kind:'信箱', title:item.title || '一封信', meta:item.date || '刚刚', action:'mailbox', stamp:item.createdAt || 0, index })); return rows.sort((a, b) => (b.stamp - a.stamp) || (b.index - a.index)).slice(0, 4); };
  const localPlayCount = () => checkinSummary().total + state.memories.length + state.wishes.filter(item => item.done).length + Object.keys(state.answers || {}).length;
  const parseApiObject = raw => { const text = String(raw || '').replace(/```json|```/gi, '').trim(); try { return JSON.parse(text); } catch { const match = text.match(/\{[\s\S]*\}/); try { return match ? JSON.parse(match[0]) : null; } catch { return null; } } };
  const coupleContext = () => { const { role, profile } = current(); const chat = readChat().chats?.[role?.id] || {}; const recentChat = (Array.isArray(chat.messages) ? chat.messages : []).slice(-12).map(item => `${item.sender === 'user' || item.role === 'user' ? '用户' : roleName(role)}：${String(item.text || item.content || '').slice(0, 120)}`).join('\n'); return `角色：${roleName(role)}\n角色设定：${role?.details || role?.signature || '暂无'}\n用户：${profileName(profile)}\n用户设定：${profile?.persona || profile?.details || '暂无'}\n当前时间：${new Date().toLocaleString('zh-CN')}\n近期聊天：${recentChat || '暂无'}\n已有回忆：${state.memories.slice(0, 8).map(item => `${item.title}：${item.text}`).join('；') || '暂无'}\n正在商量或计划：${state.wishes.slice(0, 8).map(item => `${item.text}${item.done ? '（已完成）' : ''}`).join('；') || '暂无'}\n双方确认的约会：${state.dates.slice(0, 8).map(item => `${item.title}（${item.date}）`).join('；') || '暂无'}\n纪念日：${state.events.filter(item => item.kind !== 'date').slice(0, 8).map(item => `${item.title}（${item.date}）`).join('；') || '暂无'}\n近期心事：${state.letters.slice(0, 5).map(item => `${item.title}：${item.text}`).join('；') || '暂无'}`; };
  const requestCoupleAI = async (system, prompt, temperature = .9) => { const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) throw new Error('请先在设置中为情侣空间配置 API 模型。'); const { role } = current(); const identity = `身份要求：你现在就是角色“${roleName(role)}”本人。必须按照角色设定、说话方式、性格和与用户的关系回应，不要说自己是 AI、模型、系统或互动导演，也不要解释生成过程。`; const base = config.endpoint.replace(/\/$/, ''); const endpoint = /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`; let response; try { response = await fetch(endpoint, { method:'POST', timeout:180000, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature, messages:[{ role:'system', content:`${identity}\n\n${system}` }, { role:'user', content:prompt }] }) }); } catch (error) { if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw new Error('请求超时，请检查网络或 API 服务状态。'); if (/failed to fetch|networkerror|load failed/i.test(String(error?.message || ''))) throw new Error('无法连接 API。请检查接口地址、网络或服务端 CORS 设置。'); throw error; } if (!response.ok) { let detail = ''; try { detail = String((await response.json())?.error?.message || ''); } catch {} throw new Error(detail || `HTTP ${response.status}`); } const data = await response.json(); const text = String(data.choices?.[0]?.message?.content || '').trim(); if (!text) throw new Error('API 没有返回内容'); return text; };
  const questions = ['今天最想和对方一起做什么？', '最近哪一个瞬间让你想起对方？', '如果现在可以见面，你会先说什么？', '你们下一次约会想去哪里？'];

  function tabIcon(type) { const paths = { today:'<path d="M4.5 7.3h14M15.6 4.5l2.9 2.8-2.9 2.8M19.5 16.7h-14M8.4 13.9l-2.9 2.8 2.9 2.8"/><path d="m10.2 10.6 1.8 1.8 1.8-1.8"/>', dates:'<path d="M12 21s6.3-5.8 6.3-11.3a6.3 6.3 0 1 0-12.6 0C5.7 15.2 12 21 12 21Z"/><path d="M9.7 9.3h4.6M12 7v4.6"/>', games:'<path d="M7.5 9.2h9a3.8 3.8 0 0 1 3.65 4.85l-1.05 3.6a2.2 2.2 0 0 1-4.05.45L13.8 16h-3.6l-1.25 2.1a2.2 2.2 0 0 1-4.05-.45l-1.05-3.6A3.8 3.8 0 0 1 7.5 9.2Z"/><path d="M8 12v3M6.5 13.5h3M16 13h.01M18 15h.01"/>', secrets:'<path d="M12 3v3.8M7 7.2h10l1.8 2.5v10H5.2v-10Z"/><path d="M8.2 12h7.6M8.2 15.2h5"/><circle cx="12" cy="6.8" r="1.1"/>', us:'<circle cx="8" cy="8.2" r="2.5"/><circle cx="16" cy="8.2" r="2.5"/><path d="M3.8 19.2c.3-3.6 1.9-5.6 4.2-5.6 1.7 0 3 .9 4 2.6 1-1.7 2.3-2.6 4-2.6 2.3 0 3.9 2 4.2 5.6"/><path d="m10.4 14.3 1.6 1.6 1.6-1.6"/>' }; return `<svg class="couple-tab-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[type]}</svg>`; }
  function render() {
    const gamesRowBefore = app.querySelector('.couple-games-installed-row');
    if (gamesRowBefore) gamesScrollLeft = gamesRowBefore.scrollLeft;
    const mysteryScrollTop = app.querySelector('.couple-mystery')?.scrollTop || 0;
    const archive = app.querySelector('.couple-date-history .couple-archive-box');
    const archiveWasOpen = archive?.open;
    const archiveScroll = archive?.querySelector('.couple-archive-files')?.scrollLeft || 0;
    const wishArchive = app.querySelector('.couple-wish-archive-box');
    if (wishArchive) wishArchiveOpen = wishArchive.open;
    const wishArchiveScroll = wishArchive?.querySelector('.couple-wish-archive-files')?.scrollLeft || 0;
    const page = app.querySelector('.couple-page');
    if (roleSelectionOpen) {
      page.className = 'couple-page couple-page-role-entry';
      page.innerHTML = rolePicker(true);
      return;
    }
    const { role, profile } = current();
    page.className = `couple-page${tab === 'games' ? ' couple-page-games' : ''}`;
    const titles = { today:['OUR FREQUENCY','心动'], dates:['OUR NEXT TIME','约会'], games:['PLAY TOGETHER','游戏'], secrets:['JUST FOR YOU','心事'], us:['US, LATELY','我们'] };
    const [eyebrow, title] = titles[tab] || titles.today;
    page.innerHTML = `<header class="couple-header"><div><span>${eyebrow}</span><h1>${title}</h1></div><div class="couple-header-side"><button data-couple-close type="button">×</button></div></header><main class="couple-main">${tab === 'games' ? games(role, profile) : tab === 'dates' ? datesPage(role) : tab === 'secrets' ? secretsPage(role) : tab === 'us' ? usPage(role, profile) : todayPage(role, profile)}</main><nav class="couple-tabs couple-tabs-four couple-tabs-five"><button data-couple-tab="today" class="${tab === 'today' ? 'is-active' : ''}" type="button">${tabIcon('today')}<small>心动</small></button><button data-couple-tab="dates" class="${tab === 'dates' ? 'is-active' : ''}" type="button">${tabIcon('dates')}<small>约会</small></button><button data-couple-tab="games" class="${tab === 'games' ? 'is-active' : ''}" type="button">${tabIcon('games')}<small>游戏</small></button><button data-couple-tab="secrets" class="${tab === 'secrets' ? 'is-active' : ''}" type="button">${tabIcon('secrets')}<small>心事</small></button><button data-couple-tab="us" class="${tab === 'us' ? 'is-active' : ''}" type="button">${tabIcon('us')}<small>我们</small></button></nav>${recordOpenMarkup()}${letterOpenMarkup()}${mysteryOpen ? mysteryMarkup(role) : ''}${stockGameOpen ? stockGameMarkup() : ''}`;
    const gamesRowAfter = app.querySelector('.couple-games-installed-row');
    if (gamesRowAfter) requestAnimationFrame(() => { if (gamesRowAfter.isConnected) gamesRowAfter.scrollLeft = gamesScrollLeft; });
    app.querySelector('.couple-flower-roulette')?.remove();
    if (flowerRouletteOpen) app.insertAdjacentHTML('beforeend', flowerRouletteMarkup(role));
    const mysteryPage = app.querySelector('.couple-mystery');
    if (mysteryPage && mysteryScrollTop) requestAnimationFrame(() => { if (mysteryPage.isConnected) mysteryPage.scrollTop = mysteryScrollTop; });
    const history = app.querySelector('.couple-date-history');
    if (history) {
      const folders = [...history.querySelectorAll('.couple-date-folder')];
      const box = document.createElement('details');
      box.className = 'couple-archive-box';
      box.open = !!archiveWasOpen;
      archiveSelectedIndex = archiveSelectedIndex >= folders.length ? -1 : archiveSelectedIndex;
      box.innerHTML = `<summary><span class="couple-archive-object" aria-hidden="true"><i></i><i></i><i></i><b>♡</b></span><span class="couple-archive-caption"><b>约会收藏盒</b><small>${folders.length} 份约会 · 点击打开</small></span></summary><div class="couple-archive-inside"><small>一行五份 · 左右滑动挑选</small><div class="couple-archive-files"></div><div class="couple-archive-detail">${archiveSelectedIndex >= 0 ? dateTimelineDetail(state.dateHistory[archiveSelectedIndex]) : '<p>点击一个文件夹，查看里面的约会记录。</p>'}</div></div>`;
      const files = box.querySelector('.couple-archive-files');
      folders.forEach(folder => files.appendChild(folder));
      if (!folders.length) files.innerHTML = '<p class="couple-empty">完成的约会会收进这里。</p>';
      history.replaceChildren(box);
      files.scrollLeft = archiveScroll;
    }
    const wishFiles = app.querySelector('.couple-wish-archive-files');
    if (wishFiles) wishFiles.scrollLeft = wishArchiveScroll;
    bindWishDeck();
  }
  function bindWishDeck() {
    const deck = app.querySelector('[data-couple-wish-deck]');
    if (!deck || state.letters.length < 2) return;
    let startX = 0;
    let currentX = 0;
    let pointerId = null;
    let tracking = false;
    let dragging = false;
    const finish = event => {
      if (!tracking || event.pointerId !== pointerId) return;
      tracking = false;
      deck.classList.remove('is-dragging');
      if (!dragging) return;
      try { deck.releasePointerCapture(event.pointerId); } catch {}
      const delta = currentX - startX;
      const count = Math.min(5, state.letters.length);
      const direction = Math.abs(delta) >= 34 ? (delta < 0 ? 1 : -1) : 0;
      const nextIndex = Math.max(0, Math.min(count - 1, wishIndex + direction));
      wishSwipeLockUntil = Date.now() + 80;
      if (nextIndex === wishIndex) { deck.style.setProperty('--deck-drag','0px'); return; }
      deck.style.setProperty('--deck-drag',`${direction > 0 ? -145 : 145}px`);
      window.setTimeout(() => { wishIndex = nextIndex; render(); }, 190);
    };
    deck.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      tracking = true;
      dragging = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      currentX = startX;
      deck.style.setProperty('--deck-drag','0px');
    });
    deck.addEventListener('pointermove', event => {
      if (!tracking || event.pointerId !== pointerId) return;
      currentX = event.clientX;
      const delta = Math.max(-105, Math.min(105, currentX - startX));
      if (!dragging && Math.abs(delta) > 8) {
        dragging = true;
        deck.classList.add('is-dragging');
        try { deck.setPointerCapture(event.pointerId); } catch {}
      }
      if (!dragging) return;
      event.preventDefault();
      deck.style.setProperty('--deck-drag',`${delta}px`);
    });
    deck.addEventListener('pointerup', finish);
    deck.addEventListener('pointercancel', finish);
  }
  function connection(role, profile) { return `<section class="couple-connection"><button data-couple-role-picker type="button"><div class="couple-widget-row"><div class="couple-person"><figure>${avatar(profile, '我')}</figure><b>${esc(profileName(profile))}</b></div><div class="couple-heartline" aria-label="相爱"><svg viewBox="0 0 58 24" aria-hidden="true"><path d="M1 12h10l3-7 5 14 5-11 4 4h29"/></svg><i>♥</i></div><div class="couple-person"><figure>${avatar(role)}</figure><b>${esc(roleName(role))}</b></div></div></button></section>`; }
  function todayPage(role, profile) { const exchange = state.exchange; const itemVisual = (name,image) => image ? `<img src="${esc(image)}" alt="${esc(name)}" referrerpolicy="no-referrer">` : `<i>${esc((name || '物').slice(0,1))}</i>`; return `${connection(role, profile)}<p class="couple-nowtime">好物交换 · 只属于你们</p>${exchange ? `<section class="couple-exchange-board"><div class="couple-exchange-items"><article><small>${esc(profileName(profile))} 交出</small>${itemVisual(exchange.userItem,exchange.userImage)}<b>${esc(exchange.userItem)}</b></article><span><i>⇄</i><small>交换完成</small></span><article><small>${esc(roleName(role))} 交出</small>${itemVisual(exchange.roleItem,exchange.roleImage)}<b>${esc(exchange.roleItem)}</b></article></div><div class="couple-exchange-reason"><span>${esc(roleName(role))} 说</span><p>${esc(exchange.reason)}</p></div><div class="couple-exchange-feelings"><article><small>拿到之后</small><p>${esc(exchange.roleFeeling)}</p></article><article><small>第一次用时</small><p>${esc(exchange.userFeeling)}</p></article></div><blockquote>“${esc(exchange.message)}”</blockquote><button data-couple-exchange-again type="button">再交换一次</button></section>` : `<section class="couple-exchange-start"><div class="couple-exchange-mark">⇄</div><label>你想拿什么和 ${esc(roleName(role))} 交换？<input id="coupleExchangeItem" type="text" maxlength="30" placeholder="输入物品名字，例如：常用的钢笔"></label><button data-couple-exchange type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? `${esc(roleName(role))} 正在挑选…` : '开启交换'}</button></section>`}`; }
  function dateTimeline(item,index) { return `<button class="couple-date-folder ${index === archiveSelectedIndex ? 'is-selected' : ''}" data-couple-date-folder="${index}" type="button"><span>${String(index + 1).padStart(2,'0')}</span><b>${esc(item.place || '约会地点')}</b><small>${esc(item.date || '已保存')}</small></button>`; }
  function dateTimelineDetail(item) { if (!item) return ''; const moments = (Array.isArray(item.moments) ? item.moments : []).slice(0,4).map((moment,index) => typeof moment === 'string' ? { label:['出发','中途','后来','结束'][index] || `片段 ${index + 1}`, text:moment } : { label:String(moment?.label || moment?.time || ['出发','中途','后来','结束'][index] || `片段 ${index + 1}`), text:String(moment?.text || moment?.detail || '') }).filter(moment => moment.text); return `<header><span>${esc(item.date || '这次约会')}</span><h4>${esc(item.place || '约会地点')}</h4><p>${esc(item.activity || '一起度过')}${item.durationMinutes ? ` · 约 ${item.durationMinutes} 分钟` : ''}</p></header><div class="couple-date-timeline">${moments.map((moment,index) => `<div class="couple-date-timeline-node"><i>${String(index + 1).padStart(2,'0')}</i><div><small>${esc(moment.label)}</small><p>${esc(moment.text)}</p></div></div>`).join('')}</div>${item.summary ? `<footer><span>最后记下</span><p>${esc(item.summary)}</p></footer>` : ''}`; }
  function datesPage(role) { const ideas = state.dateIdeas || []; const selected = ideas[state.selectedDateIdea] || null; const session = state.dateSession; const remaining = session ? Math.max(0, session.endAt - Date.now()) : 0; const minutes = Math.ceil(remaining / 60000); const live = session ? `<section class="couple-date-live ${remaining ? '' : 'is-finished'}"><span>${remaining ? '约会进行中' : '约会时间到了'}</span><h2>${esc(session.place)}</h2><p>${esc(session.activity)}</p><div><strong>${remaining ? `${minutes} 分钟` : '等待总结'}</strong><small>${remaining ? '预计剩余' : `${esc(roleName(role))} 正在回想这次约会`}</small></div>${remaining ? '<i><b></b></i>' : `<button data-couple-date-finish type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? '正在整理…' : '结束并保存约会'}</button>`}</section>` : ''; const plan = selected && state.datePlaceConfirmed ? `<section class="couple-date-plan"><header><div><span>这个地点可以这样过</span><h2>${esc(selected.place)}</h2></div><small>选一段开始</small></header><div class="couple-date-activities">${(selected.activities || []).map((activity,index) => `<button data-couple-date-activity="${index}" type="button"><b>${esc(activity.name)}</b><small>约 ${Number(activity.durationMinutes) || 60} 分钟</small><span>${esc(activity.detail)}</span></button>`).join('')}</div></section>` : ''; const intro = selected && !state.datePlaceConfirmed ? `<section class="couple-date-place-intro"><span>地点介绍</span><h2>${esc(selected.place)}</h2><p>${esc(selected.intro || '这是一个适合你们按自己的节奏相处的地方。')}</p><button data-couple-date-confirm-place type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? `${esc(roleName(role))} 正在安排…` : '选择这个地点'}</button></section>` : ''; return `${live}<section class="couple-compact-actions"><button data-couple-date-talk type="button" ${apiBusy || session ? 'disabled' : ''}>${apiBusy ? `${esc(roleName(role))} 正在找地方…` : ideas.length ? '换一批地点' : '生成三个地点'}</button>${ideas.length ? '<small>先选地点，再看具体安排</small>' : ''}</section>${ideas.length ? `<section class="couple-date-options">${ideas.map((item,index) => `<button class="${index === state.selectedDateIdea ? 'is-selected' : ''}" data-couple-date-idea="${index}" type="button"><small>0${index + 1}</small><b>${esc(item.place)}</b></button>`).join('')}</section>` : ''}${intro}${plan}<section class="couple-date-history"><header><div><span>DATE JOURNAL</span><h3>保留的约会</h3></div><small>${state.dateHistory.length ? `${state.dateHistory.length} 次记录` : '完成后会留在这里'}</small></header>${state.dateHistory.length ? state.dateHistory.map(dateTimeline).join('') : '<p class="couple-empty">完成一次约会后，会按发生顺序留下几个片段。</p>'}</section>`; }
  function secretsPage(role) {
    const wishes = state.letters.slice(0, 5);
    const archived = state.letters.slice(5);
    wishIndex = Math.max(0, Math.min(wishIndex, wishes.length - 1));
    const hanging = wishes.length ? `<div class="couple-wish-rope"><i></i></div><div class="couple-hanging-wishes">${wishes.map((item, index) => {
      const offset = index - wishIndex;
      const depth = Math.abs(offset);
      return `<button class="couple-hanging-wish wish-tone-${index % 4} ${offset === 0 ? 'is-active' : ''}" style="--wish-x:${offset * 76}px;--wish-y:${depth * 8 + (index % 2) * 5}px;--wish-rotate:${offset * 3.2}deg;--wish-scale:${1 - depth * .04};--wish-opacity:${1 - depth * .11};--wish-z:${20 - depth};--wish-tilt:${[-2,1,-1,2][index % 4]}deg" data-couple-wish-index="${index}" data-couple-letter="${esc(item.id)}" data-couple-bless type="button"><span></span><small>${esc(item.date)}</small><b>${esc(item.title)}</b><p>${esc(item.text)}</p><i>${state.letterReplies?.[item.id] ? `${esc(roleName(role))} 已回应` : `${esc(roleName(role))} 正在读`}</i></button>`;
    }).join('')}</div><div class="couple-wish-dots">${wishes.map((_, index) => `<i class="${index === wishIndex ? 'is-active' : ''}"></i>`).join('')}</div>` : '<div class="couple-wish-empty"><i>结</i><p>第一枚祈愿，等你亲手挂上。</p></div>';
    const archive = archived.length ? `<details class="couple-archive-box couple-wish-archive-box" ${wishArchiveOpen ? 'open' : ''}><summary><span class="couple-archive-object" aria-hidden="true"><i></i><i></i><i></i><b>♡</b></span><span class="couple-archive-caption"><b>心事收纳盒</b><small>${archived.length} 枚祈愿 · 点击打开</small></span></summary><div class="couple-archive-inside"><small>左右滑动祈愿纸，点击查看</small><div class="couple-wish-archive-files">${archived.map((item, index) => `<button class="couple-wish-archive-paper wish-tone-${index % 4}" data-couple-letter="${esc(item.id)}" type="button"><small>${esc(item.date)}</small><b>${esc(item.title)}</b><span>${state.letterReplies?.[item.id] ? '已有回应' : '点击查看'} ›</span></button>`).join('')}</div></div></details>` : '';
    return `<section class="couple-compact-actions couple-wish-actions"><button data-couple-add-letter type="button">＋ 挂一枚祈愿</button><small>${wishes.length ? `${wishIndex + 1}/${wishes.length} · 左右滑动，点击查看` : '0/5'}</small></section><section class="couple-wish-wall couple-wish-deck" data-couple-wish-deck>${hanging}</section>${archive}`;
  }
  const reviewTime = stamp => stamp && Number.isFinite(new Date(stamp).getTime()) ? new Date(stamp).toLocaleString('zh-CN', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }) : '记录时间未保存';
  function reviewEvidence(role) {
    const chat = readChat().chats?.[role?.id] || {};
    const messages = (Array.isArray(chat.messages) ? chat.messages : []).map((item, sourceIndex) => ({ ...item, sourceIndex })).filter(item => {
      const text = String(item?.text || item?.content || '').trim();
      return item && item.role !== 'system' && !item.contextPrompt && text.length >= 12 && !/^(视频通话|语音通话|通话结束|视频通话已结束|语音通话已结束|\[图片\])$/.test(text);
    }).slice(-12);
    const chatMoments = messages.map((item, index) => {
      const previous = messages[index - 1]?.sourceIndex >= item.sourceIndex - 2 ? messages[index - 1] : null;
      const lines = previous ? [previous, item] : [item];
      const excerpt = lines.map(line => `${line.role === 'user' ? '你' : roleName(role)}说：“${String(line.text || line.content).trim().slice(0, 110)}”`).join('；');
      return { key:`chat:${item.id || index}`, kind:'聊天', excerpt };
    }).filter(item => item.excerpt.length >= 35).reverse().slice(0, 5);
    const memories = state.memories.slice(0, 5).filter(item => String(item.text || '').trim().length >= 18).map((item, index) => ({ key:`memory:${item.id || index}`, kind:'相处片段', excerpt:`你们记下「${item.title || '那次相处'}」：${String(item.text).trim().slice(0, 180)}` }));
    return [...chatMoments, ...memories];
  }
  function reviewContextMarkup(review) { if (!review?.source?.excerpt || !review.reason) return '<div class="couple-thought-reason">这条旧内容没有保存足够的相处细节和缘由。</div>'; return `<div class="couple-thought-reason"><b>那一刻 · ${esc(review.source.kind)}</b><p>${esc(review.source.excerpt)}</p><span>${esc(review.reason)}</span></div>`; }
  function timelineStamp(stamp, fallback = '') { const value = Number(stamp); if (!value || !Number.isFinite(new Date(value).getTime())) return `<time>${esc(fallback || '时间未记录')}</time>`; const when = new Date(value); return `<time datetime="${when.toISOString()}"><span>${when.getFullYear()}年${when.getMonth() + 1}月${when.getDate()}日</span><span>${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}</span></time>`; }
  function usPage(role, profile) {
    const review = state.relationshipReview;
    const note = review?.note || '';
    const saved = state.relationshipReviewHistory || [];
    const currentNote = note ? `<span>${esc(roleName(role))} 最近想说的</span><p>“${esc(note)}”</p>${reviewContextMarkup(review)}<small>${esc(reviewTime(review.createdAt))}</small><button class="couple-thought-keep" data-couple-keep-review type="button" ${review.saved ? 'disabled' : ''}>${review.saved ? '已保留 ✓' : '保留这句话'}</button>` : '';
    const pieces = [
      ...state.memories.map(item => ({ type:'memory', stamp:Number(item.createdAt) || 0, item })),
      ...saved.map(item => ({ type:'thought', stamp:Number(item.createdAt) || 0, item }))
    ].sort((first, second) => second.stamp - first.stamp);
    const pieceMarkup = pieces.map(({ type, item, stamp }) => {
      const marker = `<div class="couple-timeline-stamp"><i></i>${timelineStamp(stamp, item.date)}</div>`;
      return type === 'thought'
        ? `<article class="couple-timeline-entry is-role"><button class="couple-timeline-card" data-couple-piece="thought" data-couple-piece-id="${esc(item.id)}" type="button"><small>${esc(roleName(role))} · 心里话</small><div class="couple-timeline-card-title"><i>✦</i><b>一张留给你的纸</b></div><span>展开纸张 ›</span></button>${marker}</article>`
        : `<article class="couple-timeline-entry is-user"><button class="couple-timeline-card" data-couple-piece="memory" data-couple-piece-id="${esc(item.id)}" type="button"><small>你 · 记录</small><i>♡</i><b>${esc(item.title || String(item.text || '').slice(0, 14))}</b><span>展开纸张 ›</span></button>${marker}</article>`;
    }).join('');
    const pieceCount = pieces.length;
    return `${connection(role, profile)}<section class="couple-review couple-role-thought">${currentNote}<button data-couple-review type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? `${esc(roleName(role))} 正在想…` : note ? '再听听 Ta 的心里话' : '听听 Ta 最近想说的'}</button></section><section class="couple-memory-ribbon"><header><div><h3>留下的片段</h3><small>${pieceCount} 个瞬间 · 点卡片展开</small></div><button data-couple-add-memory type="button">＋ 记录</button></header>${pieceMarkup ? `<div class="couple-memory-timeline">${pieceMarkup}</div>` : '<p class="couple-empty">还没有留下片段。</p>'}</section>`;
  }
  let paperTexturePromise;
  function animateMemoryPaper(overlay) {
    overlay.classList.add('is-open');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sheet = overlay.querySelector('.couple-paper-sheet');
    const canvas = document.createElement('canvas');
    canvas.className = 'couple-paper-unfolding';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    overlay.classList.add('is-unfolding');
    overlay.append(canvas);
    paperTexturePromise ||= new Promise((resolve, reject) => {
      const texture = new Image();
      texture.onload = () => resolve(texture);
      let fallbackTried = false;
      texture.onerror = () => {
        if (!fallbackTried) {
          fallbackTried = true;
          texture.src = 'assets/ui/couple-paper/white-crumpled-sheet.png';
          return;
        }
        reject(new Error('纸张纹理加载失败'));
      };
      texture.src = 'assets/ui/couple-paper/white-crumpled-sheet.webp';
    });
    paperTexturePromise.then(texture => {
      if (!overlay.isConnected || overlay.classList.contains('is-closing')) return;
      const bounds = overlay.getBoundingClientRect();
      const rect = sheet.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      ctx.scale(ratio, ratio);
      const cx = rect.left - bounds.left + rect.width / 2;
      const cy = rect.top - bounds.top + rect.height / 2;
      const cols = 10, rows = 14;
      const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
      // Each patch keeps its own fold angle while the sheet opens from the centre.
      function point(x, y, progress) {
        const u = x / cols, v = y / rows;
        const radius = Math.max(Math.abs(u - .5), Math.abs(v - .5)) * 2;
        const open = smooth((progress - radius * .12) / (1 - radius * .12));
        const fold = 1 - open;
        const crease = Math.sin(x * 2.14 + y * .87) * Math.sin(y * 1.61 - x * .43);
        const z = crease * 36 * fold;
        const perspective = 850 / (850 - z);
        return {
          x:cx + ((u - .5) * rect.width * (.28 + .72 * open) + Math.sin(y * 1.8 + x) * 10 * fold) * perspective,
          y:cy + ((v - .5) * rect.height * (.24 + .76 * open) + Math.sin(x * 1.7 - y) * 12 * fold) * perspective,
          sx:u * texture.width, sy:v * texture.height, z
        };
      }
      function triangle(a, b, c, alpha, fold) {
        const determinant = (b.sx - a.sx) * (c.sy - a.sy) - (c.sx - a.sx) * (b.sy - a.sy);
        const m11 = ((b.x - a.x) * (c.sy - a.sy) - (c.x - a.x) * (b.sy - a.sy)) / determinant;
        const m12 = ((b.y - a.y) * (c.sy - a.sy) - (c.y - a.y) * (b.sy - a.sy)) / determinant;
        const m21 = ((c.x - a.x) * (b.sx - a.sx) - (b.x - a.x) * (c.sx - a.sx)) / determinant;
        const m22 = ((c.y - a.y) * (b.sx - a.sx) - (b.y - a.y) * (c.sx - a.sx)) / determinant;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
        ctx.clip(); ctx.globalAlpha = alpha;
        ctx.transform(m11, m12, m21, m22, a.x - m11 * a.sx - m21 * a.sy, a.y - m12 * a.sx - m22 * a.sy);
        ctx.drawImage(texture, 0, 0);
        ctx.fillStyle = `rgba(25,28,32,${Math.min(.19, Math.abs(a.z - c.z) / 170) * fold})`;
        ctx.fillRect(0, 0, texture.width, texture.height);
        ctx.restore();
      }
      const started = performance.now();
      const ball = overlay.querySelector('.couple-paper-ball');
      function frame(now) {
        if (!overlay.isConnected || overlay.classList.contains('is-closing')) return;
        const elapsed = now - started;
        const progress = Math.min(1, Math.max(0, (elapsed - 200) / 1350));
        const handover = smooth((elapsed - 220) / 300);
        ball.style.opacity = String(1 - handover);
        ball.style.transform = `rotate(${-5 + handover * 5}deg) scale(${1 + handover * .08})`;
        ctx.clearRect(0, 0, bounds.width, bounds.height);
        const grid = Array.from({ length:rows + 1 }, (_, y) => Array.from({ length:cols + 1 }, (_, x) => point(x, y, progress)));
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const a = grid[y][x], b = grid[y][x + 1], c = grid[y + 1][x + 1], d = grid[y + 1][x];
          triangle(a, b, c, handover, 1 - progress);
          triangle(a, c, d, handover, 1 - progress);
        }
        if (progress < 1) requestAnimationFrame(frame);
        else {
          overlay.classList.remove('is-unfolding');
          canvas.classList.add('is-finished');
          window.setTimeout(() => canvas.remove(), 180);
        }
      }
      requestAnimationFrame(frame);
    }).catch(() => { paperTexturePromise = null; overlay.classList.remove('is-unfolding'); canvas.remove(); });
  }
  function memoryPaperMarkup(type, item) {
    const { role } = current();
    const thought = type === 'thought';
    const title = thought ? `${roleName(role)} 想说的话` : item.title || '你留下的片段';
    const content = thought ? `“${esc(item.note)}”` : esc(item.text);
    const evidence = thought ? reviewContextMarkup(item) : '';
    const image = !thought && item.image ? `<img src="${esc(item.image)}" alt="记录的照片">` : '';
    return `<div class="couple-paper-overlay" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button class="couple-paper-backdrop" data-couple-paper-close type="button" aria-label="关闭纸张"></button><div class="couple-paper-ball" aria-hidden="true"></div><section class="couple-paper-sheet"><button class="couple-paper-close" data-couple-paper-close type="button" aria-label="关闭纸张">×</button><small>${thought ? esc(roleName(role)) : '你'} · ${esc(reviewTime(item.createdAt))}</small><h2>${esc(title)}</h2>${image}<p class="couple-paper-words">${content}</p>${evidence}</section></div>`;
  }
  function home(role, profile) {
    const upcoming = nextEvent();
    const recent = recentMoments();
    const moment = state.dailyMoment;
    const recentMarkup = recent.slice(0, 3).map(item => `<button class="couple-recent-item" data-couple-tab="${item.action}" type="button"><i>${esc(item.kind.slice(0, 1))}</i><span><b>${esc(item.title)}</b><small>${esc(item.meta)}</small></span><em>›</em></button>`).join('') || '<p class="couple-empty">你们的故事会从这里慢慢留下来。</p>';
    return `<section class="couple-love-hero"><div class="couple-love-date">${esc(date())}</div><button class="couple-love-pair" data-couple-role-picker type="button"><div>${avatar(role)}</div><span><i></i></span><div>${avatar(profile, 'U')}</div></button><p>${esc(roleName(role))} 与 ${esc(profileName(profile))}</p><h2>${moment?.headline ? esc(moment.headline) : '把普通的一天，过成只有你们知道的章节。'}</h2></section><section class="couple-moment-card ${moment ? 'has-moment' : ''}"><div class="couple-moment-label"><span>今日心动事件</span><small>${moment ? esc(moment.kind || '只属于你们') : '等待开启'}</small></div>${moment ? `<h3>${esc(moment.title)}</h3><p>${esc(moment.scene)}</p><blockquote>${esc(moment.message)}</blockquote><button data-couple-tab="wishes" type="button">进入这一章 <b>↗</b></button><button class="couple-moment-reroll" data-couple-moment type="button" ${apiBusy ? 'disabled' : ''}>换一个相遇</button>` : `<h3>${apiBusy ? `${esc(roleName(role))} 正在准备…` : '今天会发生什么？'}</h3><p>故事会结合你们的人设、现实时间、共同回忆与未完成的约定现场展开，每次都不一样。</p><button data-couple-moment type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? '请稍等' : '开启今天的相遇'} <b>↗</b></button>`}</section><section class="couple-love-actions"><button data-couple-add-memory type="button"><i>＋</i><span><b>留住此刻</b><small>写进你们的故事</small></span></button><button data-couple-add-letter type="button"><i>⌁</i><span><b>写给 Ta</b><small>一封只属于彼此的信</small></span></button><button data-couple-tab="calendar" type="button"><i>○</i><span><b>${upcoming ? esc(upcoming.title) : '约定下一次'}</b><small>${upcoming ? `${daysUntil(upcoming.dateValue)} 天后` : '留一个值得期待的日子'}</small></span></button></section><section class="couple-recent-section"><div class="couple-section-head"><div><span>OUR STORY</span><h2>最近的我们</h2></div><button data-couple-tab="memories" type="button">全部 ›</button></div><div class="couple-recent-list">${recentMarkup}</div></section>`;
  }
  function legacyHome(role, profile) {
    const checkin = checkinSummary();
    const upcoming = nextEvent();
    const recent = recentMoments();
    const play = state.play?.title ? state.play : null;
    const stats = [
      ['回忆', state.memories.length, '记录'],
      ['愿望', state.wishes.filter(item => !item.done).length, '待完成'],
      ['纪念日', state.events.length, '个日子'],
      ['连续陪伴', checkin.streak, '天']
    ];
    const recentMarkup = recent.length ? recent.map(item => `<button class="couple-recent-item" data-couple-tab="${item.action}" type="button"><i>${esc(item.kind.slice(0, 1))}</i><span><b>${esc(item.title)}</b><small>${esc(item.kind)} · ${esc(item.meta)}</small></span><em>›</em></button>`).join('') : '<p class="couple-empty">从今天开始，记录第一件只属于你们的事。</p>';
    return `<section class="couple-dashboard-hero"><div class="couple-dashboard-avatars"><div class="couple-hero-avatar">${avatar(role)}</div><span>＋</span><div class="couple-hero-avatar">${avatar(profile, 'U')}</div></div><div class="couple-dashboard-copy"><span>TOGETHER, TODAY</span><h2>${esc(roleName(role))} <i>×</i> ${esc(profileName(profile))}</h2><p>${profile ? '这里记录你们今天的心情、计划和小小进展。' : '去聊天设置绑定用户设定，让这个空间更像你们。'}</p></div><button class="couple-ghost-action" data-couple-role-picker type="button">更换角色</button></section><section class="couple-today-card"><div class="couple-card-kicker"><span>今日陪伴</span><small>${esc(date())}</small></div><div class="couple-checkin-row"><div><strong>${checkin.checked ? '今天已经见面啦' : '和对方报个到'}</strong><p>${checkin.checked ? `你们已经连续陪伴 ${checkin.streak} 天` : '留下一次签到，让这段关系持续有回应'}</p></div><button class="couple-checkin ${checkin.checked ? 'is-checked' : ''}" data-couple-checkin type="button">${checkin.checked ? '已签到' : '今日签到'}</button></div><div class="couple-today-line"><span>AI 共同互动</span><button data-couple-tab="wishes" type="button">${play ? '继续这局互动' : '让 AI 设计一局'} <b>›</b></button><p>${play ? esc(play.prompt) : '根据你们的故事实时生成，不使用固定题库。'}</p></div></section><section class="couple-stat-grid">${stats.map(item => `<div><strong>${item[1]}</strong><span>${esc(item[0])}</span><small>${esc(item[2])}</small></div>`).join('')}</section><section class="couple-quick-section"><div class="couple-section-head"><div><span>AI TOGETHER</span><h2>现在一起做点什么</h2></div><small>内容由 API 实时生成</small></div><div class="couple-quick-grid"><button data-couple-tab="wishes" type="button"><i>✦</i><span><b>AI 互动工作台</b><small>${play ? esc(play.title) : '生成一局专属互动'}</small></span></button><button data-couple-ai-plan type="button"><i>↗</i><span><b>AI 约会导演</b><small>${state.aiPlan ? '查看刚生成的计划' : '为你们生成下一次计划'}</small></span></button><button data-couple-add-memory type="button"><i>＋</i><span><b>记录一段回忆</b><small>给 AI 更多真实素材</small></span></button><button data-couple-add-letter type="button"><i>⌁</i><span><b>写给未来的我们</b><small>让角色参与时间胶囊</small></span></button></div></section><section class="couple-next-card"><div><span>NEXT TOGETHER</span><h2>${upcoming ? esc(upcoming.title) : '还没有下一个约定'}</h2><p>${upcoming ? `${esc(upcoming.dateValue)} · ${daysUntil(upcoming.dateValue) === 0 ? '就是今天' : `${daysUntil(upcoming.dateValue)} 天后见`}` : '添加一个纪念日或见面计划，让主页有一个期待。'}</p></div><button data-couple-tab="calendar" type="button">${upcoming ? '查看日历' : '添加计划'} <b>›</b></button></section><section class="couple-recent-section"><div class="couple-section-head"><div><span>RECENT MOMENTS</span><h2>最近发生</h2></div><button data-couple-tab="memories" type="button">全部记录 ›</button></div><div class="couple-recent-list">${recentMarkup}</div></section><section class="couple-question-teaser"><span>AI RELATIONSHIP LAB</span><h2>让 AI 记住你们真正发生过的事</h2><p>${state.aiPlan ? '约会计划已经生成，可以继续到一起玩页面查看。' : '回忆、聊天设定和计划都会成为下一次互动的素材。'}</p><button data-couple-tab="wishes" type="button">进入工作台 <b>›</b></button></section>`;
  }
  function moodPage(role) { const choices = ['开心', '平静', '想念', '有点累', '期待见面']; return `<p class="couple-subhint">选择一种心情，${esc(roleName(role))} 会通过 API 回应你。</p><div class="couple-choice-list">${choices.map(item => `<button class="couple-choice ${state.moods.user === item ? 'is-selected' : ''}" data-couple-mood="${esc(item)}" type="button" ${apiBusy ? 'disabled' : ''}><span>${esc(item)}</span><i>${state.moods.user === item ? '✓' : '○'}</i></button>`).join('')}</div>${apiBusy ? '<p class="couple-api-status">角色正在回应…</p>' : ''}${state.moodReply ? `<div class="couple-response"><span>${esc(roleName(role))}</span><p>${esc(state.moodReply)}</p></div>` : ''}`; }
  function interactionPage(role) { const choices = ['想你了', '抱抱我', '晚安', '亲亲', '陪我一会儿']; return `<p class="couple-subhint">选一个互动，${esc(roleName(role))} 会通过 API 回应你。</p><div class="couple-choice-list">${choices.map(item => `<button class="couple-choice ${state.interaction === item ? 'is-selected' : ''}" data-couple-interaction="${esc(item)}" type="button" ${apiBusy ? 'disabled' : ''}><span>${esc(item)}</span><i>${state.interaction === item ? '✓' : '○'}</i></button>`).join('')}</div>${apiBusy ? '<p class="couple-api-status">角色正在回应…</p>' : ''}${state.interactionReply ? `<div class="couple-response"><span>${esc(roleName(role))}</span><p>${esc(state.interactionReply)}</p></div>` : ''}`; }
  function roleNote(type) { return state.roleNotes?.[type] ? `<div class="couple-response"><span>角色回应</span><p>${esc(state.roleNotes[type])}</p></div>` : ''; }
  function calendar() { return `<p class="couple-subhint">把纪念日同步到日历 App，也可以让角色替你添加。</p><div class="couple-action-row"><button class="couple-primary" data-couple-add-event type="button">用户添加</button><button class="couple-secondary" data-couple-role-add-event type="button">角色添加</button></div><div class="couple-list">${state.events.length ? state.events.map(item => `<article class="couple-list-card"><div><b>${esc(item.title)}</b><small>${esc(item.date)} · ${item.author === 'role' ? '角色添加' : '用户添加'}</small></div><button data-couple-delete-event="${esc(item.id)}" type="button">×</button></article>`).join('') : '<p class="couple-empty">还没有纪念日记录。</p>'}</div>`; }
  function memories() { return `<p class="couple-subhint">保存一起经历过的片段。</p><button class="couple-primary" data-couple-add-memory type="button">记录一段回忆</button><div class="couple-memory-list">${state.memories.length ? state.memories.map(item => `<article class="couple-memory-card">${item.image ? `<img src="${esc(item.image)}" alt="">` : ''}<div><b>${esc(item.title)}</b><small>${esc(item.date)}</small><p>${esc(item.text)}</p></div></article>`).join('') : '<p class="couple-empty">还没有回忆，记录你们的第一段故事吧。</p>'}</div><button class="couple-secondary" data-couple-role-response="memories" type="button">让角色看看回忆</button>${roleNote('memories')}`; }
  function wishes() { return `<p class="couple-subhint">把想一起完成的事情放在这里，完成时会留下角色的回应。</p><button class="couple-primary" data-couple-add-wish type="button">添加共同愿望</button><div class="couple-list">${state.wishes.length ? state.wishes.map(item => `<div class="couple-wish-wrap"><button class="couple-wish ${item.done ? 'is-done' : ''}" data-couple-toggle-wish="${esc(item.id)}" type="button"><i>${item.done ? '✓' : '○'}</i><span>${esc(item.text)}<small>${item.done ? '已完成' : '想去完成'}</small></span></button>${state.wishReplies?.[item.id] ? `<div class="couple-wish-reply"><b>角色</b><p>${esc(state.wishReplies[item.id])}</p></div>` : ''}</div>`).join('') : '<p class="couple-empty">还没有共同愿望。</p>'}</div>`; }
  const legacyMysteryCases = [
    { id:'rouge', number:'壹', title:'一只绣鞋，两位夜客', source:'《聊斋志异·胭脂》', url:'https://liaozhai.5000yan.com/20337.html', tag:'情爱 · 命案', intro:'胭脂暗恋鄂生。一个夜晚，父亲被害，现场留下的绣鞋却把嫌疑引向她的心上人。鞋是谁拿走的？真正的凶手又是谁？', question:'谁是真正杀害胭脂父亲的人？', options:['被胭脂爱慕的鄂生','冒名夜访的宿介','拿走绣鞋的毛大'], answer:2, hint:'绣鞋落入谁手中之后，第二次冒名夜访才成为可能？', truth:'宿介先冒充鄂生夜访胭脂，慌乱间遗落绣鞋。毛大拾到鞋，又借此冒名潜入，最终杀害胭脂父亲。鄂生和宿介因前后两次夜访受到牵连；关键是辨明两次来人的身份。', clues:[['心事','胭脂倾心鄂生，却没有与他私定终身。爱慕不能直接证明鄂生夜里到过她家。'],['第一次夜访','宿介得知胭脂心事后，冒充鄂生夜访；受惊离开时，绣鞋落在外面。'],['遗失的鞋','毛大发现绣鞋，知道可以拿它作为接近胭脂的凭据。'],['第二次夜访','后来又有人借鄂生之名出现。两次冒名若被当成同一人，案情便会错乱。']] },
    { id:'gengniang', number:'贰', title:'江上同舟的陌生人', source:'《聊斋志异·庚娘》', url:'https://www.shidianguji.com/zh/book/XYXLZZY/chapter/1l6394asqi148', tag:'女性 · 复仇', intro:'乱世渡江，一名男子热心邀庚娘一家同舟。上船后，金家人相继遇害。庚娘表面顺从，暗中等待机会。最初的危险究竟从哪里来？', question:'谁与王十八串通，使同舟变成陷阱？', options:['操船的舟人','庚娘身边的女子','金家的旧仆'], answer:0, hint:'受害者在江上，谁掌握船的行止？', truth:'王十八觊觎庚娘，与舟人合谋，在船上害死金家人。庚娘隐忍脱身，随后设法为家人复仇。案卷重点在同舟邀约与舟人的配合，而非把庚娘的顺从误认成自愿。', clues:[['主动邀约','王十八在路上表现得异常殷勤，坚持与庚娘一家同行。'],['江心孤舟','船离开岸边后，乘客无处可逃，操船者掌握停靠与去向。'],['突发杀机','金家男子在船上遭害，事情发生得太顺利，难以只靠一名乘客完成。'],['庚娘隐忍','庚娘暂时不揭穿对方，是为了活下来并寻找反击的机会。']] },
    { id:'paintedskin', number:'叁', title:'书斋里的美人皮', source:'《聊斋志异·画皮》', url:'https://book.yidiantime.com/mingzhu/liaozhai/1420157027', tag:'志怪 · 惊悚', intro:'王生收留一名自称逃难的女子，将她藏在书斋。道士警告他遇见了邪物。门窗紧闭的书斋里，究竟藏着怎样的真相？', question:'女子真实的模样是什么？', options:['受人追赶的普通女子','披着画皮的恶鬼','懂得幻术的道士'], answer:1, hint:'注意道士的警告，也注意她独处时对那张“皮”做了什么。', truth:'王生窥见恶鬼在皮上作画，随后披上画皮，变成女子模样。道士的警告并非空穴来风。这个故事出自志怪小说，案中的超自然设定属于原作世界。', clues:[['逃难说辞','女子说自己受虐而逃，但始终不愿让外人知道她藏在书斋。'],['道士警告','道士见到王生后，提醒他身上有邪气，要警惕所收留的人。'],['紧锁的门','女子独处时把书斋关得很严，王生只能从隐蔽处窥探。'],['桌上的皮','王生看见狰狞之物在一张人皮上描画，随后把它披在身上。']] }
  ];
  const legacyMysteryPuzzles = {
    rouge:{ extra:[['王氏传话','胭脂的心事经王氏传到宿介耳中。鄂生本人并不知道有人会借他的名义夜访。'],['物证流转','绣鞋先在宿介离开时遗失，后落入毛大手中；发现绣鞋的人与遗失绣鞋的人不是同一个。']], contradiction:{ prompt:'哪两条线索能证明夜访者不止一人？', pairs:[[1,2],[0,4],[3,5]], answer:0, explain:'第一次夜访遗失绣鞋的人是宿介；后来拿着鞋的人是毛大。' }, order:{ prompt:'把关键经过按先后排对：', options:['胭脂倾心鄂生 → 宿介冒名遗鞋 → 毛大拾鞋 → 再次冒名与命案','宿介冒名遗鞋 → 胭脂倾心鄂生 → 毛大拾鞋 → 命案','毛大拾鞋 → 宿介冒名遗鞋 → 命案'], answer:0, hint:'先要有人遗失绣鞋，才会有另一个人拾到它。' } },
    gengniang:{ extra:[['船上的分工','王十八负责接近金家，舟人则能控制行船与停靠。两人的机会并不相同。'],['事后举止','庚娘暂时顺从，保留了接近仇人的机会；这一举动不能反推她参与了谋害。']], contradiction:{ prompt:'哪两条线索最能反驳“王十八独自作案”？', pairs:[[0,3],[1,4],[2,5]], answer:1, explain:'江心孤舟使舟人的配合成为关键；船上的分工说明王十八负责诱引、舟人掌控行船。' }, order:{ prompt:'把陷阱形成的经过排对：', options:['王十八邀约 → 同舟离岸 → 舟人配合杀机 → 庚娘隐忍伺机','同舟离岸 → 庚娘隐忍 → 王十八邀约 → 舟人配合','舟人配合 → 庚娘隐忍 → 王十八邀约'], answer:0, hint:'先有主动邀约，再有离岸后的控制。' } },
    paintedskin:{ extra:[['窥见真容','王生窥见狰狞之物描画人皮，并把画好的皮披回身上。'],['表象与实证','女子的自述只能说明她希望王生相信什么；亲眼所见的画皮才是决定性证据。']], contradiction:{ prompt:'哪两条线索最直接推翻“她只是逃难女子”的说法？', pairs:[[0,2],[1,3],[4,5]], answer:2, explain:'亲眼窥见画皮，再与女子的自述对照，才能辨明表象与真身。' }, order:{ prompt:'把王生发现真相的经过排对：', options:['收留女子 → 道士警告 → 窥探书斋 → 看见画皮','道士警告 → 看见画皮 → 收留女子','窥探书斋 → 收留女子 → 道士警告'], answer:0, hint:'王生先收留对方，后来才起疑窥探。' } }
  };
  function mysteryClues(caseFile) { return [...caseFile.clues, ...legacyMysteryPuzzles[caseFile.id].extra]; }
  function mysteryProgress(id) { const progress = state.mysteryCases?.[id]; return progress && typeof progress === 'object' ? progress : { viewed:[], solved:false, attempts:0 }; }
  function mysteryMarkup(role) {
    const person = esc(roleName(role));
    const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId);
    const header = `<header class="couple-mystery-header"><button data-mystery-back type="button" ${caseFile ? '' : 'hidden'} aria-label="返回案件列表">‹</button><div><small>ARCHIVE OF SECRETS</small><b>古籍悬案</b></div><button data-mystery-close type="button" aria-label="关闭游戏">×</button></header>`;
    if (!caseFile) return `<section class="couple-mystery" role="dialog" aria-modal="true" aria-label="古籍悬案">${header}<main class="couple-mystery-main"><div class="couple-mystery-section-title"><b>待查案卷</b><small>${mysteryCases.filter(item => mysteryProgress(item.id).solved).length} / ${mysteryCases.length} 已破 · 左右滑动</small></div><div class="couple-mystery-case-list">${mysteryCases.map(item => { const progress = mysteryProgress(item.id); return `<button class="couple-mystery-case-card" data-mystery-case="${item.id}" type="button"><span class="couple-mystery-scroll-art" aria-hidden="true"><img src="assets/ui/game-covers/ancient-case-scroll-v1.webp" onerror="this.onerror=null;this.src='assets/ui/game-covers/ancient-case-scroll-v1.png'" alt="古代卷轴" draggable="false"><span class="couple-mystery-scroll-writing"><small>案 ${item.number} · ${esc(item.tag)}</small><b>${esc(item.title)}</b><i>${esc(item.source)}</i><em>${progress.solved ? '已破案 ✓' : progress.investigated?.length ? '继续查案' : '展开案卷'} →</em></span></span><span class="couple-mystery-closed-label"><small>案 ${item.number}</small><b>${esc(item.title)}</b><em>${progress.solved ? '已破案 ✓' : progress.investigated?.length ? '继续查案' : '点击展开'}</em></span></button>`; }).join('')}</div></main></section>`;
    const progress = mysteryProgress(caseFile.id);
    const clues = mysteryClues(caseFile);
    const viewed = Array.isArray(progress.viewed) ? progress.viewed : [];
    const selectedClue = clues.find((_, index) => String(index) === mysteryClueId);
    const puzzle = legacyMysteryPuzzles[caseFile.id];
    const ready = viewed.length >= clues.length;
    const discussion = Array.isArray(progress.discussion) ? progress.discussion.slice(-5) : [];
    const optionButtons = (items, action, selected, disabled = false) => `<div class="couple-mystery-options">${items.map((item,index) => `<button data-mystery-${action}="${index}" class="${selected === index ? 'is-selected' : ''}" type="button" ${disabled ? 'disabled' : ''}>${esc(item)}</button>`).join('')}</div>`;
    const intro = !progress.introRead ? `<div class="couple-mystery-preface"><small>案 ${caseFile.number} · 前情提要</small><h2>${esc(caseFile.title)}</h2><p>${esc(caseFile.intro)}</p><button data-mystery-begin type="button">开始调查 →</button></div>` : '';
    const clueSection = progress.introRead ? `<div class="couple-mystery-section-title"><b>调查取证</b><small>已阅 ${viewed.length}/${clues.length}</small></div><div class="couple-mystery-clues">${clues.map(([name], index) => `<button data-mystery-clue="${index}" class="${viewed.includes(index) ? 'is-viewed' : ''} ${mysteryClueId === String(index) ? 'is-selected' : ''}" type="button"><i>0${index + 1}</i><b>${esc(name)}</b><span>${viewed.includes(index) ? '已阅' : '未阅'}</span></button>`).join('')}</div>${selectedClue ? `<div class="couple-mystery-clue-detail"><small>线索 ${Number(mysteryClueId) + 1}</small><h3>${esc(selectedClue[0])}</h3><p>${esc(selectedClue[1])}</p></div>` : ''}` : '';
    const discuss = progress.introRead ? `<div class="couple-mystery-discuss"><div class="couple-mystery-section-title"><b>与 ${person} 讨论</b><small>只讨论已读线索</small></div>${discussion.map(item => `<p class="couple-mystery-dialogue ${item.who === 'user' ? 'is-user' : ''}"><b>${item.who === 'user' ? '你' : person}</b>${esc(item.text)}</p>`).join('')}<div class="couple-mystery-compose"><input data-mystery-input type="text" maxlength="160" placeholder="说说你的怀疑或问 TA 一句…" value="${esc(mysteryDraft)}"><button data-mystery-talk type="button" ${mysteryBusy ? 'disabled' : ''}>${mysteryBusy ? '思考中…' : '发送'}</button></div>${mysteryFeedback && mysteryFeedback.startsWith('讨论') ? `<p class="couple-mystery-feedback">${esc(mysteryFeedback)}</p>` : ''}</div>` : '';
    const contradiction = ready ? `<div class="couple-mystery-section-title"><b>第一步 · 指出矛盾</b><small>${progress.contradictionDone ? '已完成 ✓' : '选出关键证据'}</small></div><div class="couple-mystery-question"><h3>${esc(puzzle.contradiction.prompt)}</h3>${progress.contradictionDone ? `<p>${esc(puzzle.contradiction.explain)}</p>` : optionButtons(puzzle.contradiction.pairs.map(pair => pair.map(i => clues[i][0]).join(' ＋ ')), 'contradiction', mysteryChoice)}</div>` : '';
    const order = progress.contradictionDone ? `<div class="couple-mystery-section-title"><b>第二步 · 还原经过</b><small>${progress.orderDone ? '已完成 ✓' : '按先后排序'}</small></div><div class="couple-mystery-question"><h3>${esc(puzzle.order.prompt)}</h3>${progress.orderDone ? '<p>事件顺序已确认。</p>' : optionButtons(puzzle.order.options, 'order', mysteryChoice)}</div>` : '';
    const finalQuestion = progress.orderDone ? `<div class="couple-mystery-section-title"><b>第三步 · 提交真相</b><small>${progress.solved ? '已破案 ✓' : '最后判断'}</small></div><div class="couple-mystery-question"><h3>${esc(caseFile.question)}</h3>${progress.solved ? `<div class="couple-mystery-truth"><b>真相大白</b><p>${esc(caseFile.truth)}</p><a href="${esc(caseFile.url)}" target="_blank" rel="noopener noreferrer">阅读原典：${esc(caseFile.source)} ↗</a></div>` : `${optionButtons(caseFile.options, 'answer', mysteryChoice)}<button class="couple-mystery-submit" data-mystery-submit type="button" ${mysteryChoice >= 0 ? '' : 'disabled'}>提交最终推理</button>`}</div>` : '';
    return `<section class="couple-mystery" role="dialog" aria-modal="true" aria-label="${esc(caseFile.title)}">${header}<main class="couple-mystery-main">${intro}${clueSection}${discuss}${contradiction}${order}${finalQuestion}${mysteryFeedback && !mysteryFeedback.startsWith('讨论') ? `<p class="couple-mystery-feedback" role="status">${esc(mysteryFeedback)}</p>` : ''}<p class="couple-mystery-source">据 ${esc(caseFile.source)} 改编；线索为游戏化整理。</p></main></section>`;
  }
  async function mysteryTalk() {
    const caseFile = mysteryCases.find(item => item.id === mysteryCaseId);
    const input = app.querySelector('[data-mystery-input]');
    const message = String(input?.value || '').trim().slice(0, 160);
    if (!caseFile || !message || mysteryBusy) return;
    const roleId = store.contactId;
    const requestId = ++mysteryRequest;
    const progress = mysteryProgress(caseFile.id);
    progress.discussion = Array.isArray(progress.discussion) ? progress.discussion : [];
    progress.discussion.push({ who:'user', text:message });
    progress.discussion = progress.discussion.slice(-12);
    state.mysteryCases[caseFile.id] = progress;
    mysteryDraft = ''; mysteryBusy = true; mysteryFeedback = ''; save(); render();
    const clues = mysteryClues(caseFile);
    const seen = (progress.viewed || []).filter(i => Number.isInteger(i) && clues[i]).map(i => `${clues[i][0]}：${clues[i][1]}`).join('\n');
    try {
      const reply = await requestCoupleAI(`你正与用户一起玩古籍悬案。案件：${caseFile.title}。前情：${caseFile.intro}\n玩家已读线索：\n${seen || '暂无'}\n已完成的阶段：${progress.contradictionDone ? '指出矛盾；' : ''}${progress.orderDone ? '还原经过；' : ''}${progress.solved ? '已破案' : '尚未破案'}。只依据前情与已读线索，以角色自身的语气回应玩家，1—3句。可以提出一个具体疑点或反问。禁止透露未读线索、标准答案、真凶和后续剧情；不确定时明确说只是猜测。`, `玩家说：${message}`, .65);
      if (requestId !== mysteryRequest || !mysteryOpen || store.contactId !== roleId || mysteryCaseId !== caseFile.id) return;
      const latest = mysteryProgress(caseFile.id);
      latest.discussion ||= [];
      latest.discussion.push({ who:'role', text:reply.slice(0, 280) });
      latest.discussion = latest.discussion.slice(-12);
      state.mysteryCases[caseFile.id] = latest; save();
    } catch (error) {
      if (requestId === mysteryRequest && store.contactId === roleId) mysteryFeedback = `讨论暂时失败：${error.message}`;
    } finally { if (requestId === mysteryRequest) { mysteryBusy = false; render(); } }
  }
  const stockDesserts = [
    { id:'rose-millefeuille', name:'玫瑰覆盆子千层', image:'assets/ui/game-items/stock-sort/stock-sort-item-01-rose-millefeuille.webp' },
    { id:'lychee-vanilla', name:'荔枝香草冰淇淋杯', image:'assets/ui/game-items/stock-sort/stock-sort-item-02-lychee-vanilla.webp' },
    { id:'matcha-pistachio', name:'抹茶开心果蛋糕', image:'assets/ui/game-items/stock-sort/stock-sort-item-03-matcha-pistachio.webp' },
    { id:'chocolate-hazelnut', name:'巧克力榛果慕斯', image:'assets/ui/game-items/stock-sort/stock-sort-item-04-chocolate-hazelnut.webp' },
    { id:'lemon-choux', name:'柠檬泡芙', image:'assets/ui/game-items/stock-sort/stock-sort-item-05-lemon-choux.webp' },
    { id:'blueberry-jelly', name:'蓝莓果冻蛋糕', image:'assets/ui/game-items/stock-sort/stock-sort-item-06-blueberry-jelly.webp' },
    { id:'purple-berry', name:'紫莓马卡龙千层', image:'assets/ui/game-items/stock-sort/stock-sort-item-07-purple-berry.webp' },
    { id:'cookies-cream', name:'奥利奥奶油蛋糕', image:'assets/ui/game-items/stock-sort/stock-sort-item-08-cookies-cream.webp' }
  ];
  const stockShuffle = list => { const next = list.slice(); for (let index = next.length - 1; index > 0; index -= 1) { const target = Math.floor(Math.random() * (index + 1)); [next[index], next[target]] = [next[target], next[index]]; } return next; };
  const stockDessert = id => stockDesserts.find(item => item.id === id) || stockDesserts[0];
  function stockMakeOrder() {
    const count = 2 + Math.floor(Math.random() * 3);
    return stockShuffle(stockDesserts).slice(0, count).map(item => ({ type:item.id, need:1 + Math.floor(Math.random() * 3), got:0 }));
  }
  function stockMakeGame() {
    return { batch:0, orders:Array.from({ length:3 }, stockMakeOrder), shelves:stockShuffle(stockDesserts).map(item => item.id), basket:{}, done:false, transitioning:false };
  }
  function stockCurrentOrder() { return stockGameState?.orders?.[stockGameState.batch] || null; }
  function stockOrderLine(type) { return stockCurrentOrder()?.find(item => item.type === type) || null; }
  function stockMissingTypes(game = stockGameState) { const order = game?.orders?.[game.batch] || []; return order.filter(item => item.got < item.need && !game.shelves.includes(item.type)).map(item => item.type); }
  function stockRefillAvailable(game = stockGameState) { return !!game && !game.done && !game.transitioning && (game.shelves.some(item => !item) || stockMissingTypes(game).length > 0); }
  function stockNotice(message) {
    stockGameNotice = message;
    if (stockGameNoticeTimer) window.clearTimeout(stockGameNoticeTimer);
    stockGameNoticeTimer = window.setTimeout(() => { stockGameNotice = ''; render(); }, 1500);
    render();
  }
  function stockRefill() {
    const game = stockGameState;
    if (!game || game.done || game.transitioning) return;
    const empty = game.shelves.map((item, index) => item ? -1 : index).filter(index => index >= 0);
    const missing = [...new Set(stockMissingTypes(game))];
    if (!empty.length && !missing.length) { stockNotice('货架已满，当前订单需要的甜品都在货架上'); return; }
    const replacement = empty.slice();
    const candidateSlots = stockShuffle(game.shelves.map((item, index) => index).filter(index => !replacement.includes(index) && !missing.includes(game.shelves[index])));
    while (replacement.length < missing.length && candidateSlots.length) replacement.push(candidateSlots.shift());
    const choices = [...missing, ...stockShuffle(stockDesserts.filter(item => !missing.includes(item.id))).map(item => item.id)];
    replacement.forEach((slot, index) => { game.shelves[slot] = choices[index % choices.length]; });
    stockNotice(`补货完成，新增 ${replacement.length} 份甜品`);
  }
  function stockCollect(slotIndex) {
    const game = stockGameState;
    const type = game?.shelves?.[slotIndex];
    if (!game || game.done || game.transitioning || !type) return;
    const line = stockOrderLine(type);
    if (!line) { stockNotice('这批订单暂时不需要这款甜品'); return; }
    if (line.got >= line.need) { stockNotice('这款甜品已经拿够了'); return; }
    game.shelves[slotIndex] = null;
    line.got += 1;
    game.basket[type] = (game.basket[type] || 0) + 1;
    if (stockCurrentOrder().every(item => item.got >= item.need)) {
      game.transitioning = true;
      render();
      window.setTimeout(() => {
        if (!stockGameState || stockGameState !== game) return;
        game.transitioning = false;
        game.basket = {};
        if (game.batch >= game.orders.length - 1) game.done = true;
        else game.batch += 1;
        render();
      }, 700);
      return;
    }
    render();
  }
  function stockGameMarkup() {
    const game = stockGameState;
    const progress = game ? (game.done ? '全部完成' : `第 ${game.batch + 1} / 3 批`) : 'READY';
    const header = `<header><button data-stock-close type="button" aria-label="返回">‹</button><div><small>STOCK SORT</small><b>分类理货</b></div><div class="stock-game-progress">${progress}</div><button data-stock-close type="button" aria-label="关闭">×</button></header>`;
    const scene = `<img class="stock-game-scene" src="assets/ui/game-covers/stock-sort-shelf-v1.webp" onerror="this.onerror=null;this.src='assets/ui/game-covers/stock-sort-cover-v1.webp'" alt="甜品店货架场景">`;
    if (!game) return `<section class="stock-game" role="dialog" aria-modal="true" aria-label="分类理货"><div class="stock-game-backdrop" aria-hidden="true"></div>${header}<div class="stock-game-stage">${scene}<div class="stock-start-panel"><small>甜品柜已经准备好了</small><b>开始今天的理货</b><p>完成 3 批订单，把需要的甜品放进餐盘。</p><button data-stock-start type="button">开始游戏</button></div></div></section>`;
    const order = stockCurrentOrder() || [];
    const basketItems = Object.entries(game.basket).map(([type, count]) => { const item = stockDessert(type); return `<div class="stock-tray-item"><img src="${item.image}" alt=""><b>×${count}</b></div>`; }).join('');
    const orderItems = order.map(item => { const dessert = stockDessert(item.type); return `<div class="stock-order-item ${item.got >= item.need ? 'is-done' : ''}"><img src="${dessert.image}" alt=""><div><b>${esc(dessert.name)}</b><small>${item.got}/${item.need}</small></div></div>`; }).join('');
    const shelves = game.shelves.map((type, index) => { if (!type) return `<span class="stock-slot stock-slot-${index + 1} is-empty" aria-hidden="true"></span>`; const item = stockDessert(type); const line = order.find(entry => entry.type === type); const remaining = line ? Math.max(0, line.need - line.got) : 0; return `<button class="stock-slot stock-slot-${index + 1}" data-stock-item="${index}" type="button" aria-label="拿取${esc(item.name)}${remaining ? `，还需要${remaining}份` : '，本批暂不需要'}"><img src="${item.image}" alt="">${remaining ? `<span class="stock-slot-badge">×${remaining}</span>` : ''}</button>`; }).join('');
    return `<section class="stock-game" role="dialog" aria-modal="true" aria-label="分类理货"><div class="stock-game-backdrop" aria-hidden="true"></div>${header}<div class="stock-game-stage">${scene}<section class="stock-order-panel"><div class="stock-order-heading"><small>${game.done ? 'ALL ORDERS READY' : 'TODAY’S ORDER'}</small><b>${game.done ? '今日订单全部完成' : '请按订单取货'}</b></div><div class="stock-order-items">${orderItems}</div></section><div class="stock-shelf-items">${shelves}</div><section class="stock-tray" aria-label="餐盘"><div class="stock-tray-label"><small>TRAY</small><b>${game.done ? '完成' : '已取甜品'}</b></div><div class="stock-tray-items">${basketItems || '<span class="stock-tray-empty">点击货架上的甜品放入餐盘</span>'}</div><button class="stock-refill" data-stock-refill type="button" ${stockRefillAvailable(game) ? '' : 'disabled'}><span>补货</span><small>随机补款</small></button></section>${stockGameNotice ? `<p class="stock-game-notice" role="status">${esc(stockGameNotice)}</p>` : ''}${game.transitioning ? '<div class="stock-game-toast">订单完成，准备下一批…</div>' : ''}${game.done ? '<div class="stock-game-finish"><small>THREE ORDERS COMPLETE</small><b>今天的甜品都整理好了</b><button data-stock-restart type="button">再来一局</button></div>' : ''}</div></section>`;
  }
  const mysteryCaseConfig = {
    rouge:{ subtitle:'绣鞋、误认与两次夜访', characters:[['胭脂','卞氏之女，心事被邻妇窥见'],['鄂生','被误认的秀才，案发后被拘'],['宿介','与王氏相识，曾在夜里出现'],['毛大','巷中游荡者，曾多次接近王氏']], initialFacts:['卞氏夜里受伤，翌日不治。','墙下找到一只绣鞋，众人认作胭脂之物。','有人声称看见鄂生在卞家附近出现。'], investigations:[{id:'r_scene',title:'复查卞氏伤口',content:'仵作确认创口来自正面冲撞，卞氏临死前曾抓住来人的衣袖。伤口形状只能证明争斗发生过，不能证明来人身份。',requirements:[],obtainedClues:['r_wound'],unlockInvestigations:['r_wang']},{id:'r_shoe',title:'检查墙下绣鞋',content:'鞋底沾着墙根湿泥，鞋内没有胭脂的脚印。鞋是被人强行扯下后带走的，后来才落在命案现场。',requirements:[],obtainedClues:['r_shoe'],unlockInvestigations:['r_night']},{id:'r_wang',title:'询问王氏',content:'王氏承认曾拿鄂生打趣胭脂，也承认宿介听过这段话。她坚持说自己没有见过宿介当夜出门。',requirements:['r_shoe'],obtainedClues:['r_wang'],unlockInvestigations:['r_reask']},{id:'r_night',title:'核对夜间目击',content:'邻人只看见一个白衣身影翻墙，却没有看清脸。时间记录显示，白衣身影出现前后，巷口曾有两次脚步声。',requirements:['r_shoe'],obtainedClues:['r_night'],unlockInvestigations:['r_reask']},{id:'r_reask',title:'再次询问王氏与宿介',content:'两人的说法在绣鞋何时丢失一事上对不上：宿介说离开时鞋还在袖中，王氏却说他进门时已经空手。',requirements:['r_wang','r_night'],obtainedClues:['r_flow','r_contradiction'],unlockInvestigations:[]}], clues:{r_wound:{type:'物证',name:'异常创口',description:'死者胸口有正面冲撞留下的伤口，曾抓住来人衣袖。',source:'仵作复验',doubt:'伤口能证明争斗，不能证明凶手身份。'},r_shoe:{type:'物证',name:'墙下绣鞋',description:'鞋底有墙根湿泥，鞋内没有胭脂的脚印，像是被人扯下后带走。',source:'命案现场',doubt:'鞋属于谁，和谁最后拿过它，并不是一回事。'},r_wang:{type:'证词',name:'王氏传话',description:'胭脂的心事经王氏传到宿介耳中；鄂生本人并不知道有人会借他的名义夜访。',source:'王氏口供',doubt:'王氏对宿介当夜行踪仍有隐瞒。'},r_night:{type:'时间',name:'两次脚步声',description:'邻人只看见白衣身影，巷口却留下两次前后相接的脚步声。',source:'邻人补述',doubt:'目击者把两个夜客当成了一个人。'},r_flow:{type:'物证',name:'绣鞋流转',description:'绣鞋先在一次夜访后遗失，后来才被另一人捡走并利用。',source:'交叉询问',doubt:'物证经过两个人的手。'},r_contradiction:{type:'证词',name:'鞋子时间矛盾',description:'宿介和王氏关于绣鞋何时离手的说法无法同时成立。',source:'再次询问',doubt:'矛盾指向一次被刻意掩盖的冒名。'}}, reasoningQuestions:[{id:'r_q1',label:'证词矛盾',prompt:'哪组线索最能证明夜访者不止一人？',options:['绣鞋流转 ＋ 两次脚步声','异常创口 ＋ 王氏传话','墙下绣鞋 ＋ 异常创口'],answer:0,hint:'要证明身份错位，先看物证经过谁的手，再看时间是否容得下两个人。',explain:'绣鞋在一次夜访后遗失，巷口又留下两次脚步声，说明众人把两名夜客误认成了同一个人。'},{id:'r_q2',label:'经过还原',prompt:'哪一条经过最符合目前证据？',options:['宿介冒名遗鞋 → 毛大拾鞋 → 毛大再次冒名','毛大先拾鞋 → 宿介冒名遗鞋 → 鄂生入夜','鄂生夜访 → 宿介拾鞋 → 毛大制造伤口'],answer:0,hint:'先有遗失，才会出现后来捡到并利用绣鞋的人。',explain:'两次夜访和绣鞋流转必须按先后排列，不能把后来拿鞋的人倒置到前面。'},{id:'r_q3',label:'断案',prompt:'真正应对命案负责的人是谁？',options:['鄂生，因胭脂倾心于他','宿介，因他最先冒名夜访','毛大，因他利用绣鞋再次冒名并引发命案'],answer:2,hint:'别只看谁被看见；看谁拥有绣鞋，又利用了这件物证。',explain:'鄂生只是被借名，宿介是前一场冒名者；真正把绣鞋变成接近卞家的工具并引发命案的是毛大。'}],truthData:{culprit:'毛大',method:'拾取宿介遗失的绣鞋后再次冒名接近卞家，争斗中杀死卞氏。',turn:'众人把两次夜访拼成了一次，鄂生因此成为替罪者。'},ending:'真正的凶手不是最先被喊出名字的人，而是藏在物证流转里的第二个夜客。',archiveText:'绣鞋入卷，误认得解；两次夜访，终于各归其名。'},
    gengniang:{ subtitle:'同舟、沉尸与借来的身份', characters:[['庚娘','金家新妇，冷静而隐忍'],['王十八','自称愿意护送金家的陌生人'],['舟人','掌握行船、停靠与江上进退'],['唐氏','被困在另一重身份中的女子']], initialFacts:['金家一家随王十八登船渡江。','船到芦苇深处后，金家人相继失踪。','庚娘后来也被认为已经死去，但江上仍有人见过相似身影。'], investigations:[{id:'g_boat',title:'查阅渡船记录',content:'船并非临时雇来，王十八提前与舟人谈过价，目的地也改过一次。',requirements:[],obtainedClues:['g_boat'],unlockInvestigations:['g_wang']},{id:'g_wang',title:'询问王十八同行者',content:'同行者承认王十八一路都在观察庚娘，却把这解释成热心照看。没有人能说明他为何坚持夜间停船。',requirements:['g_boat'],obtainedClues:['g_wang'],unlockInvestigations:['g_river']},{id:'g_river',title:'重画江上路线',content:'停船处远离渡口，四周只有芦苇和浅滩。舟人若不配合，王十八无法让一家人同时离开船舱。',requirements:['g_boat'],obtainedClues:['g_river'],unlockInvestigations:['g_reask']},{id:'g_reask',title:'重新询问幸存者',content:'幸存者说王十八先邀请金家父子出舱，舟人随后用篙阻拦求救声。两人的动作并非偶然重合。',requirements:['g_wang','g_river'],obtainedClues:['g_team','g_contradiction'],unlockInvestigations:[]}], clues:{g_boat:{type:'记录',name:'改过的渡船记录',description:'王十八提前约船，目的地在出发前被改向芦苇深处。',source:'船行记录',doubt:'临时改向是谁决定的？'},g_wang:{type:'证词',name:'过度殷勤',description:'王十八一路观察庚娘，却把夜间停船解释成照料众人。',source:'同行者口供',doubt:'热心说法解释不了停船时机。'},g_river:{type:'时间',name:'芦苇深处的停泊点',description:'停船处远离渡口，舟人掌握唯一的退路。',source:'路线复原',doubt:'一个乘客无法独立控制船与所有求救声。'},g_team:{type:'证词',name:'篙声与求救声',description:'王十八邀人出舱后，舟人用篙阻断求救，动作先后紧密相接。',source:'幸存者补述',doubt:'两人对彼此的配合避而不谈。'},g_contradiction:{type:'异常现象',name:'被借来的身份',description:'江上出现过与庚娘相似的女子，死亡信息与身份信息互相冲突。',source:'尹家记录',doubt:'有人利用了“庚娘已死”的消息。'}}, reasoningQuestions:[{id:'g_q1',label:'矛盾',prompt:'哪组证据最能反驳“王十八独自作案”？',options:['改过的渡船记录 ＋ 芦苇深处的停泊点','过度殷勤 ＋ 被借来的身份','篙声与求救声 ＋ 过度殷勤'],answer:0,hint:'先确认谁能决定船的方向和停靠，再判断谁有能力完成陷阱。',explain:'王十八能诱引金家上船，却不能独自控制船行与求救声；改向记录和停泊点指向舟人的配合。'},{id:'g_q2',label:'经过还原',prompt:'哪条顺序最符合陷阱形成的过程？',options:['王十八提前约船改向 → 夜间停在芦苇深处 → 邀金家出舱 → 舟人阻断求救','舟人先阻断求救 → 王十八才改目的地 → 庚娘登船','庚娘先逃生 → 王十八邀约 → 舟人临时加入'],answer:0,hint:'陷阱要先准备好地点，才会在船上发生。',explain:'改向与停泊是预谋的准备，王十八负责把人带入，舟人负责让他们无法求救。'},{id:'g_q3',label:'断案',prompt:'这场江上陷阱的主要责任应归于谁？',options:['庚娘，因为她隐瞒了真实计划','王十八与舟人，因为两人共同制造了陷阱','唐氏，因为她后来借用了庚娘的身份'],answer:1,hint:'区分受害者的隐忍、事后的身份混乱，以及最初制造陷阱的人。',explain:'庚娘的顺从是求生，唐氏的身份出现在事后；王十八和舟人共同完成了诱引与封锁。'}],truthData:{culprit:'王十八与舟人',method:'以护送为名改向偏僻水域，王十八诱出金家人，舟人配合阻断求救。',turn:'庚娘并未死在最初传闻里，后来出现的身份混乱遮住了她的复仇。'},ending:'江面看似只有一条船，真正把人困住的却是两个人的默契。',archiveText:'同舟非同心，芦苇深处留下的不是风声，而是合谋。'},
    paintedskin:{ subtitle:'画皮、窥见与无法解释的死', characters:[['王生','收留女子的书生，先相信自己的眼睛'],['神秘女子','自称逃难而来，避开所有追问'],['道士','只凭气色判断出不祥之物'],['王妻','在异常发生后承担了最后的选择']], initialFacts:['王生收留一名自称逃难的女子。','女子被安排在书斋，拒绝让人靠近。','道士看见王生后只说他身上有邪气，没有说明原因。','书斋外发生异常死亡，但无人能证明女子是否离开过房间。'], investigations:[{id:'p_study',title:'查书斋门窗记录',content:'门窗没有撬痕，夜里却有一次从内侧落闩、再从内侧开启的记录。房间没有留下普通人的脚印。',requirements:[],obtainedClues:['p_study'],unlockInvestigations:['p_woman']},{id:'p_priest',title:'追问道士警告',content:'道士坚持说邪气附着在王生身边，但拒绝替他指认女子，只说“先看她不愿让你看见的东西”。',requirements:[],obtainedClues:['p_warning'],unlockInvestigations:['p_woman']},{id:'p_woman',title:'核对女子的说辞',content:'女子说自己一直在逃亡，却说不出上一处住处的名字；她反复要求王生不要在夜里进入书斋。',requirements:['p_warning'],obtainedClues:['p_behavior'],unlockInvestigations:['p_skin']},{id:'p_skin',title:'复原书斋内所见',content:'王生从门缝看见一团狰狞之物在一张人皮上描画。那张皮被披上后，外形与女子完全相同。',requirements:['p_study','p_behavior'],obtainedClues:['p_skin','p_contradiction'],unlockInvestigations:[]}], clues:{p_study:{type:'记录',name:'从内侧落闩',description:'书斋门窗没有外力痕迹，夜里却经历一次从内侧落闩再开启。',source:'门窗检查',doubt:'房里的人为何不愿留下脚印？'},p_warning:{type:'民俗',name:'道士的邪气警告',description:'道士只判断邪气附着在王生身边，拒绝直接告诉他女子身份。',source:'道士口述',doubt:'警告是经验，还是证据？'},p_behavior:{type:'证词',name:'说不出的住处',description:'女子自称逃亡，却无法说出上一处住处；她坚持王生夜里不要靠近书斋。',source:'交叉询问',doubt:'她隐藏的是身份，还是某种仪式？'},p_skin:{type:'异常现象',name:'人皮上的画',description:'王生从门缝窥见狰狞之物在一张人皮上描画，披上后即变成女子模样。',source:'王生自述',doubt:'这是幻觉、伪装，还是确有鬼魅？'},p_contradiction:{type:'异常现象',name:'真假无法同时成立',description:'女子的普通逃难说法，与书斋内的人皮和异常门闩无法同时成立。',source:'案卷合并记录',doubt:'仍需判断异常现象是否能被常理解释。'}}, reasoningQuestions:[{id:'p_q1',label:'矛盾',prompt:'哪组证据最能动摇女子“只是逃难者”的说法？',options:['道士的邪气警告 ＋ 说不出的住处','从内侧落闩 ＋ 道士的邪气警告','说不出的住处 ＋ 人皮上的画'],answer:2,hint:'把自述和亲眼所见放在一起，找出无法同时成立的两件事。',explain:'说不出的住处只是可疑，真正让普通逃难说法崩溃的是它与人皮上的画同时出现。'},{id:'p_q2',label:'真假判断',prompt:'目前最稳妥的结论是什么？',options:['女子一定是普通人，只是王生受惊','女子的身份被某种伪装遮住，异常现象尚需解释','道士一出现就足以证明女子是鬼'],answer:1,hint:'道士的判断不能替代证据；把可见的异常和结论分开。',explain:'在看见人皮之前，玩家只能确认身份伪装与异常现象，不能仅凭道士一句话完成断案。'},{id:'p_q3',label:'断案',prompt:'书斋里真正发生了什么？',options:['女子借夜色换装，王生误把伪装看成鬼魅','恶鬼以人皮伪装成女子，利用收留接近王生','道士施术制造幻觉，女子其实从未进入书斋'],answer:1,hint:'回到门窗、行为和人皮三条证据，选择能同时解释它们的结论。',explain:'人皮、伪装和邪气共同指向志怪世界中的恶鬼；故事仍以文字证据让玩家自己完成确认。'}],truthData:{culprit:'披着人皮的恶鬼',method:'以逃难女子的外貌进入书斋，夜里在皮上作画并借此伪装。',turn:'王生一开始把“像人”当成“是人”，直到看到皮与人形可以被分开。'},ending:'最可怕的不是看见鬼，而是看见鬼之后仍想用常理替它解释。',archiveText:'画皮入卷，真假暂分；书斋一灯，照见人形之外。'}
  };
  const mysteryCases = legacyMysteryCases.map(item => { const config = mysteryCaseConfig[item.id]; return { ...item, ...config, cover:'assets/ui/game-covers/ancient-case-scroll-v1.webp', clues:config.clues, playerKnownData:{ intro:config.intro, characters:config.characters, initialFacts:config.initialFacts }, unlockConditions:Object.fromEntries(config.investigations.map(investigation => [investigation.id, investigation.requirements])) }; });
  const mysteryCaseList = () => [...mysteryCases, ...Object.values(state.mysteryRandomCases || {}).map(record => record?.blueprint).filter(item => item && item.id)];
  const mysteryBlueprintSystem = `本次请求是案件蓝图生成任务，优先遵守本段要求，不要以恋人口吻回答，也不要解释生成过程。你是一名中国古代志怪悬案设计师。请设计一个原创、可调查、可推理的纯文字古风案件，气质参考《聊斋志异》与古代公案，但不得复制任何现成篇章。先确定唯一固定真相，再反向设计表象、人物、证词、谎言、时间线、线索、调查和推理。案件不能只靠“死人找凶手”，可包含失踪、假死、冒名、骗局、复仇、婚嫁纠葛、古物、鬼神传闻或真假志怪。生成后真相不得改变；后续聊天只能围绕玩家已知内容，不能泄露隐藏事实。`;
  const mysteryBlueprintPrompt = `只输出严格 JSON，不要 Markdown 代码块，不要解释。JSON 必须包含：id,title,subtitle,caseType,supernaturalType,difficulty,intro,initialFacts,characters,truth,timeline,clues,investigations,reasoningQuestions,truthNarrative,archiveText。要求：至少 3 名重要人物；characters 每项有 id,name,identity,publicInfo,secret,knowledge,attitude,isLying；truth 有 summary,culprit,motive,method,fullTimeline,supernaturalTruth；至少 6 条 clues，每条有 id,name,category,description,source,importance,relatedClues；至少 5 个 investigations，每项有 id,title,requirements,result,obtainedClues,unlockInvestigations；至少 3 个 reasoningQuestions，每项有 id,label,prompt,options,answerIndex,hint,explanation。至少两条干扰线索，一处可由线索推出的证词矛盾，至少两层调查推进，一个核心认知变化。调查结果不能凭空添加真相之外的新关键事实。标题像古代篇名，如《纸人》《夜叩门》《借面》，不要出现“某县连环杀人案”等现代网文标题。${mysteryCaseList().length ? `本空间已有案件：${mysteryCaseList().map(item => item.title).join('、')}，不要重复。` : ''}`;
  const mysteryArray = value => Array.isArray(value) ? value : value == null || value === '' ? [] : String(value).split(/[\n,，;；、]/).map(item => item.trim()).filter(Boolean);
  const repairMysteryBlueprint = value => {
    const candidate = value && typeof value === 'object' ? value : {};
    candidate.initialFacts = mysteryArray(candidate.initialFacts).map(String);
    candidate.characters = (Array.isArray(candidate.characters) ? candidate.characters : candidate.characters && typeof candidate.characters === 'object' ? Object.entries(candidate.characters).map(([id, item]) => ({ id, ...(item && typeof item === 'object' ? item : { name:String(item) }) })) : []).map((item, index) => ({ ...(item && typeof item === 'object' ? item : {}), id:String(item?.id || `character-${index + 1}`), name:String(item?.name || '无名人物'), identity:String(item?.identity || item?.publicInfo || '案中人物'), publicInfo:String(item?.publicInfo || item?.identity || '案中人物'), knowledge:mysteryArray(item?.knowledge), secret:String(item?.secret || ''), attitude:String(item?.attitude || ''), isLying:item?.isLying === true }));
    const toObjectArray = (value, fallbackPrefix) => Array.isArray(value) ? value : value && typeof value === 'object' ? Object.entries(value).map(([id, item]) => ({ id, ...(item && typeof item === 'object' ? item : { name:String(item) }) })) : [];
    candidate.clues = toObjectArray(candidate.clues, 'clue').map((item, index) => ({ ...(item && typeof item === 'object' ? item : {}), id:String(item?.id || `clue-${index + 1}`), name:String(item?.name || `线索 ${index + 1}`), category:String(item?.category || item?.type || '物证'), description:String(item?.description || item?.detail || '调查所得信息。'), source:String(item?.source || '调查所得'), importance:String(item?.importance || '仍需与其他线索互证。'), relatedClues:mysteryArray(item?.relatedClues).map(String) }));
    candidate.investigations = toObjectArray(candidate.investigations, 'investigation').map((item, index) => ({ ...(item && typeof item === 'object' ? item : {}), id:String(item?.id || `investigation-${index + 1}`), title:String(item?.title || `调查 ${index + 1}`), requirements:mysteryArray(item?.requirements).map(String), result:String(item?.result || item?.content || '调查后暂未发现足以定案的新信息。'), obtainedClues:mysteryArray(item?.obtainedClues).map(String), unlockInvestigations:mysteryArray(item?.unlockInvestigations).map(String) }));
    const ensureUniqueIds = items => { const used = new Set(); items.forEach(item => { const original = item.id; let id = original; let suffix = 2; while (used.has(id)) id = `${original}-${suffix++}`; item.id = id; used.add(id); }); return items; };
    ensureUniqueIds(candidate.clues); ensureUniqueIds(candidate.investigations);
    const clueIds = new Set(candidate.clues.map(item => item.id)); const investigationIds = new Set(candidate.investigations.map(item => item.id));
    candidate.investigations.forEach(item => { item.requirements = item.requirements.filter(id => clueIds.has(id)); item.obtainedClues = item.obtainedClues.filter(id => clueIds.has(id)); item.unlockInvestigations = item.unlockInvestigations.filter(id => investigationIds.has(id)); });
    if (candidate.investigations.length && !candidate.investigations.some(item => item.requirements.length === 0)) candidate.investigations[0].requirements = [];
    candidate.reasoningQuestions = toObjectArray(candidate.reasoningQuestions, 'question').map((item, index) => ({ ...(item && typeof item === 'object' ? item : {}), id:String(item?.id || `question-${index + 1}`), label:String(item?.label || `推理 ${index + 1}`), prompt:String(item?.prompt || '哪一项判断最符合目前证据？'), options:mysteryArray(item?.options).map(String), answerIndex:Number.isInteger(Number(item?.answerIndex ?? item?.answer)) ? Number(item?.answerIndex ?? item?.answer) : 0, hint:String(item?.hint || '回到目前已经获得的线索核对。'), explanation:String(item?.explanation || item?.explain || '这项判断与已获得线索一致。') }));
    const questionIds = new Set(); candidate.reasoningQuestions.forEach(item => { const original = item.id; let id = original; let suffix = 2; while (questionIds.has(id)) id = `${original}-${suffix++}`; item.id = id; questionIds.add(id); });
    candidate.truth = candidate.truth && typeof candidate.truth === 'object' ? candidate.truth : {};
    candidate.truth.fullTimeline = mysteryArray(candidate.truth.fullTimeline).map(String);
    return candidate;
  };
  const validateMysteryBlueprint = value => {
    const chars = value?.characters; const clues = value?.clues; const investigations = value?.investigations; const questions = value?.reasoningQuestions;
    const title = String(value?.title || '').trim();
    const forbiddenTitle = /连环杀人案|神秘古宅|案件|悬疑小说|推理游戏|AI|县城/.test(title);
    const duplicateTitle = mysteryCaseList().some(item => String(item.title || '').trim() === title);
    const clueIds = new Set(Array.isArray(clues) ? clues.map(item => String(item?.id || '')) : []);
    const investigationIds = new Set(Array.isArray(investigations) ? investigations.map(item => String(item?.id || '')) : []);
    const validInvestigations = Array.isArray(investigations) && investigations.every(item => item?.id && item?.title && Array.isArray(item.requirements) && Array.isArray(item.obtainedClues) && item.requirements.every(id => clueIds.has(String(id))) && item.obtainedClues.every(id => clueIds.has(String(id))) && (!item.unlockInvestigations || (Array.isArray(item.unlockInvestigations) && item.unlockInvestigations.every(id => investigationIds.has(String(id))))));
    const reachableClues = new Set(); const reachableInvestigations = new Set(); const safeInvestigations = Array.isArray(investigations) ? investigations : [];
    for (let pass = 0; pass < safeInvestigations.length + 1; pass += 1) safeInvestigations.forEach(item => { if (!Array.isArray(item?.requirements) || !Array.isArray(item?.obtainedClues)) return; if (!reachableInvestigations.has(String(item.id)) && item.requirements.every(id => reachableClues.has(String(id)))) { reachableInvestigations.add(String(item.id)); item.obtainedClues.forEach(id => reachableClues.add(String(id))); } });
    return !!(value && typeof value === 'object' && title && !forbiddenTitle && !duplicateTitle && title.length <= 24 && String(value.intro || '').trim() && Array.isArray(chars) && chars.length >= 3 && chars.every(item => item?.id && item?.name) && Array.isArray(value.initialFacts) && value.initialFacts.length >= 3 && value.truth && typeof value.truth === 'object' && String(value.truth.summary || '').trim() && String(value.truth.culprit || '').trim() && String(value.truth.motive || '').trim() && String(value.truth.method || '').trim() && Array.isArray(value.truth.fullTimeline) && value.truth.fullTimeline.length >= 3 && Array.isArray(clues) && clues.length >= 6 && clueIds.size === clues.length && clues.every(item => item?.id && item?.name && item?.description) && Array.isArray(investigations) && investigations.length >= 5 && new Set(investigations.map(item => String(item?.id || ''))).size === investigations.length && validInvestigations && reachableInvestigations.size >= 1 && Array.isArray(questions) && questions.length >= 3 && questions.length <= 6 && new Set(questions.map(item => String(item?.id || ''))).size === questions.length && questions.every(item => item?.id && Array.isArray(item.options) && item.options.length >= 2 && Number.isInteger(Number(item.answerIndex)) && Number(item.answerIndex) >= 0 && Number(item.answerIndex) < item.options.length));
  };
  const normalizeRandomBlueprint = raw => {
    const baseId = String(raw.id || uid('random-case')).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff_-]/g, '-').slice(0, 48) || uid('random-case');
    let id = `random-${baseId}`;
    if (state.mysteryRandomCases?.[id]) id = `${id}-${Date.now().toString(36).slice(-5)}`;
    const characters = (Array.isArray(raw.characters) ? raw.characters : []).map(item => [String(item.name || '无名人物'), String(item.identity || item.publicInfo || '案中人物')]);
    const clueItems = (Array.isArray(raw.clues) ? raw.clues : []).map((item,index) => ({ id:String(item.id || `clue-${index + 1}`), type:String(item.category || '物证'), name:String(item.name || `线索 ${index + 1}`), description:String(item.description || ''), source:String(item.source || '调查所得'), doubt:String(item.importance || '仍需与其他线索互证。'), relatedClues:Array.isArray(item.relatedClues) ? item.relatedClues.map(String) : [] }));
    const clues = Object.fromEntries(clueItems.map(item => [item.id, item]));
    const clueIds = new Set(clueItems.map(item => item.id));
    const investigations = (Array.isArray(raw.investigations) ? raw.investigations : []).map((item,index) => ({ id:String(item.id || `investigation-${index + 1}`), title:String(item.title || `调查 ${index + 1}`), content:String(item.result || '调查后暂未发现足以定案的新信息。'), requirements:Array.isArray(item.requirements) ? item.requirements.map(String).filter(id => clueIds.has(id)) : [], obtainedClues:Array.isArray(item.obtainedClues) ? item.obtainedClues.map(String).filter(id => clueIds.has(id)) : [], unlockInvestigations:Array.isArray(item.unlockInvestigations) ? item.unlockInvestigations.map(String) : [] }));
    const reasoningQuestions = (Array.isArray(raw.reasoningQuestions) ? raw.reasoningQuestions : []).slice(0,6).map((item,index) => ({ id:String(item.id || `question-${index + 1}`), label:String(item.label || `推理 ${index + 1}`), prompt:String(item.prompt || '哪一项判断最符合目前证据？'), options:item.options.map(String), answer:Number.isInteger(Number(item.answerIndex)) ? Number(item.answerIndex) : 0, hint:String(item.hint || '回到目前已经获得的线索核对。'), explain:String(item.explanation || '这项判断与已获得线索一致。') }));
    const truth = raw.truth || {};
    return { id, random:true, number:'新', title:String(raw.title), subtitle:String(raw.subtitle || raw.caseType || '无名卷新案'), source:'《无名卷》·原创蓝图', url:'', tag:`${String(raw.caseType || '志怪悬案')} · ${String(raw.difficulty || '中')}`, intro:String(raw.intro), initialFacts:raw.initialFacts.map(String), characters, investigations, clues, reasoningQuestions, truthData:{ summary:String(truth.summary || ''), culprit:String(truth.culprit || ''), motive:String(truth.motive || ''), method:String(truth.method || ''), fullTimeline:Array.isArray(truth.fullTimeline) ? truth.fullTimeline.map(String) : [], supernaturalTruth:String(truth.supernaturalTruth || '') }, truth:String(truth.summary || ''), ending:String(raw.truthNarrative || truth.summary || '案卷中的细节终于彼此照应。'), archiveText:String(raw.archiveText || '此卷已结。'), timeline:Array.isArray(raw.timeline) ? raw.timeline : [], supernaturalType:String(raw.supernaturalType || ''), playerKnownData:{ intro:String(raw.intro), initialFacts:raw.initialFacts.map(String), characters }, unlockConditions:Object.fromEntries(investigations.map(item => [item.id,item.requirements])) };
  };
  async function generateMysteryCase() {
    if (mysteryGenerating) return;
    mysteryGenerating = true; mysteryGenerateError = ''; render();
    try {
      let raw = null; let lastError = null;
      for (let attempt = 0; attempt < 2 && !raw; attempt += 1) {
        try {
          const text = String(await requestCoupleAI(mysteryBlueprintSystem, mysteryBlueprintPrompt + (attempt ? '\n上一次返回未通过校验，请只返回完整 JSON。' : ''), .85)).replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
          const candidate = repairMysteryBlueprint(JSON.parse(text));
          if (!validateMysteryBlueprint(candidate)) throw new Error('案卷格式不完整');
          raw = candidate;
        } catch (error) { lastError = error; }
      }
      if (!raw) throw new Error(lastError?.message || '案卷格式不完整，请重新启封。');
      const blueprint = normalizeRandomBlueprint(raw);
      state.mysteryRandomCases ||= {};
      state.mysteryRandomCases[blueprint.id] = { blueprint, sourceBlueprint:raw, playerKnownData:{ intro:String(raw.intro), initialFacts:raw.initialFacts, characters:raw.characters }, truthData:raw.truth, createdAt:Date.now() };
      state.mysteryCases[blueprint.id] = { activeView:'case', status:'investigating', investigated:[], clueIds:[], viewed:[], discussion:[], reasoning:{}, attempts:[], solved:false, archived:false };
      save(); mysteryCaseId = blueprint.id; mysteryView = 'case'; mysteryGenerating = false; render();
    } catch (error) { mysteryGenerating = false; const message = String(error?.message || ''); mysteryGenerateError = /not a function|Unexpected token|JSON|格式不完整/i.test(message) ? '案卷格式未能成卷，请重新启封。' : (message || '案卷启封失败，请重试。'); render(); }
  }
  async function mysteryFreeInvestigate() {
    const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId); const input = app.querySelector('[data-mystery-free-input]'); const action = String(input?.value || '').trim().slice(0,160); if (!caseFile || !action || mysteryFreeBusy) return;
    const progress = mysteryProgress(caseFile.id); const known = progress.clueIds.map(id => caseFile.clues[id]).filter(Boolean).map(clue => `${clue.name}：${clue.description}`).join('\n'); const available = caseFile.investigations.filter(item => !progress.investigated.includes(item.id) && item.requirements.every(id => progress.clueIds.includes(id))).map(item => `${item.id}：${item.title}`).join('\n');
    mysteryFreeBusy = true; mysteryFreeDraft = ''; render();
    try {
      const rawText = String(await requestCoupleAI(`你是古籍悬案的调查裁判。只依据玩家已知资料判断这次文字调查，不能读取或推测案件 truthData。不得创造蓝图中不存在的新关键证据。若玩家行动无法对应当前已解锁调查，返回 none 或 blocked。若能对应，只能返回对应 investigationId，并让程序使用该调查节点已有的 result 与 obtainedClues。严格只输出 JSON：{"assessment":"matched|none|blocked","investigationId":"已有调查 id 或空","reply":"给玩家的调查结果，1—3句，不得揭露未解锁事实"}。当前案情：${caseFile.intro}\n已知线索：${known || '暂无'}\n当前可调查：${available || '暂无'}`, `玩家想调查：${action}`, .35));
      const result = JSON.parse(rawText.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()); const investigation = caseFile.investigations.find(item => item.id === result.investigationId); const latest = mysteryProgress(caseFile.id); latest.freeInvestigations ||= [];
      if (result.assessment === 'matched' && investigation && !latest.investigated.includes(investigation.id) && investigation.requirements.every(id => latest.clueIds.includes(id))) { latest.investigated.push(investigation.id); latest.unlockedInvestigations = [...new Set([...(latest.unlockedInvestigations || []), investigation.id, ...(investigation.unlockInvestigations || [])])]; investigation.obtainedClues.forEach(id => { if (!latest.clueIds.includes(id)) latest.clueIds.push(id); }); latest.freeInvestigations.push({ action, result:String(result.reply || investigation.content), matched:investigation.id, at:Date.now() }); mysteryFeedback = String(result.reply || investigation.content); } else { latest.freeInvestigations.push({ action, result:String(result.reply || '仔细检查后，并未发现值得注意之处。'), matched:'', at:Date.now() }); mysteryFeedback = String(result.reply || '仔细检查后，并未发现值得注意之处。'); }
      state.mysteryCases[caseFile.id] = latest; save();
    } catch (error) { mysteryFeedback = `这次调查没有形成可靠记录：${error.message}`; } finally { mysteryFreeBusy = false; render(); }
  }
  function mysteryClues(caseFile) { return Object.entries(caseFile.clues).map(([id, clue]) => ({ id, ...clue })); }
  function mysteryProgress(id) {
    const raw = state.mysteryCases?.[id] && typeof state.mysteryCases[id] === 'object' ? state.mysteryCases[id] : {};
    const status = raw.status === 'archived' || raw.archived ? 'archived' : raw.solved || raw.status === 'solved' ? 'solved' : 'investigating';
    const investigated = Array.isArray(raw.investigated) ? raw.investigated : [];
    const fixedCase = typeof mysteryCases !== 'undefined' ? mysteryCases.find(item => item.id === id) : null;
    const migratedClues = !Array.isArray(raw.clueIds) && fixedCase && Array.isArray(raw.viewed) ? Object.keys(fixedCase.clues).filter((_, index) => raw.viewed.includes(index)) : [];
    return { status, activeView:'case', introRead:false, investigated, unlockedInvestigations:Array.isArray(raw.unlockedInvestigations) ? raw.unlockedInvestigations : investigated.slice(), clueIds:[], viewed:[], discussion:[], reasoning:{}, attempts:[], solved:false, archived:false, ...raw, status, activeView:['case','investigate','clues','discuss','reason'].includes(raw.activeView) ? raw.activeView : 'case', investigated, unlockedInvestigations:Array.isArray(raw.unlockedInvestigations) ? raw.unlockedInvestigations : investigated.slice(), clueIds:Array.isArray(raw.clueIds) ? raw.clueIds : migratedClues, viewed:Array.isArray(raw.viewed) ? raw.viewed : [], discussion:Array.isArray(raw.discussion) ? raw.discussion : [], reasoning:raw.reasoning && typeof raw.reasoning === 'object' ? raw.reasoning : {}, attempts:Array.isArray(raw.attempts) ? raw.attempts : [] };
  }
  const mysteryRequirementsText = (caseFile, investigation) => investigation.requirements.map(id => caseFile.clues[id]?.name || id).join('、');
  const mysteryRelatedMarkup = (caseFile, clue, acquired) => { const related = (clue.relatedClues || []).map(id => caseFile.clues[id]).filter(item => item && acquired.has(item.id)); return related.length ? `<div class="couple-mystery-related">关联线索：${related.map(item => esc(item.name)).join('、')}</div>` : ''; };
  function mysteryCaseNav(view) { return `<nav class="couple-mystery-nav" aria-label="案卷页面">${[['case','案情'],['investigate','调查'],['clues','线索'],['discuss','商议'],['reason','断案']].map(([id,label]) => `<button data-mystery-view="${id}" class="${view === id ? 'is-active' : ''}" type="button">${label}</button>`).join('')}</nav>`; }
  function mysteryDiscussionMarkup(role, caseFile, progress) {
    const name = esc(roleName(role));
    return `<div class="couple-mystery-discuss"><div class="couple-mystery-section-title"><b>与 ${name} 商议</b><small>只讨论已经获得的线索</small></div><p class="couple-mystery-talk-note">角色会根据当前案情和你已经查到的内容回应，不会直接替你揭晓真相。</p>${progress.discussion.slice(-8).map(item => `<p class="couple-mystery-dialogue ${item.who === 'user' ? 'is-user' : ''}"><b>${item.who === 'user' ? '你' : name}</b>${esc(item.text)}</p>`).join('')}<div class="couple-mystery-compose"><input data-mystery-input type="text" maxlength="160" placeholder="说说你的怀疑，或问 TA 下一步查什么…" value="${esc(mysteryDraft)}"><button data-mystery-talk type="button" ${mysteryBusy ? 'disabled' : ''}>${mysteryBusy ? '思考中…' : '发送'}</button></div></div>`;
  }
  function mysteryMarkup(role) {
    const person = esc(roleName(role));
    const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId);
    const header = `<header class="couple-mystery-header"><button data-mystery-back type="button" ${caseFile ? '' : 'hidden'} aria-label="返回案件列表">‹</button><div><small>ARCHIVE OF SECRETS</small><b>古籍悬案</b></div><button data-mystery-close type="button" aria-label="关闭游戏">×</button></header>`;
    if (!caseFile) return `<section class="couple-mystery" role="dialog" aria-modal="true" aria-label="古籍悬案">${header}<main class="couple-mystery-main"><div class="couple-mystery-section-title"><b>案卷簿</b><small>${mysteryCaseList().filter(item => mysteryProgress(item.id).solved).length} / ${mysteryCaseList().length} 已结</small></div><div class="couple-mystery-case-list">${mysteryCaseList().map(item => { const progress = mysteryProgress(item.id); const status = progress.archived || progress.solved ? '已结' : progress.investigated?.length ? '调查中' : '未启'; return `<button class="couple-mystery-case-card" data-mystery-case="${esc(item.id)}" type="button"><span class="couple-mystery-case-index">卷 ${esc(item.number || '新')}</span><span class="couple-mystery-case-copy"><small>${esc(item.tag || item.caseType || '志怪悬案')} · ${esc(item.source || '无名卷')}</small><b>${esc(item.title)}</b><p>${esc(item.intro || item.subtitle || '一卷待阅的古风悬案。')}</p><em>${status}</em></span><span class="couple-mystery-case-arrow" aria-hidden="true">›</span></button>`; }).join('')}<button class="couple-mystery-new-case" data-mystery-generate type="button"><span class="couple-mystery-case-index">＋</span><span><b>启封无名卷</b><small>${mysteryGenerating ? '旧卷无名，墨迹未干……' : '让 API 写下一桩原创志怪悬案'}</small></span><span class="couple-mystery-case-arrow" aria-hidden="true">›</span></button></div>${mysteryGenerateError ? `<p class="couple-mystery-feedback"><span>${esc(mysteryGenerateError)}</span><button class="couple-mystery-retry" data-mystery-generate-retry type="button">重试</button></p>` : ''}</main></section>`;
    const progress = mysteryProgress(caseFile.id);
    const clues = mysteryClues(caseFile);
    const acquired = new Set(progress.clueIds);
    const activeView = ['case','investigate','clues','discuss','reason'].includes(mysteryView) ? mysteryView : 'case';
    const available = caseFile.investigations.filter(item => !progress.investigated.includes(item.id) && item.requirements.every(id => acquired.has(id)));
    const locked = caseFile.investigations.filter(item => !progress.investigated.includes(item.id) && !available.includes(item));
    const currentReason = caseFile.reasoningQuestions.findIndex(item => !Object.prototype.hasOwnProperty.call(progress.reasoning, item.id));
    const completedReason = currentReason < 0;
    const casePage = `<section class="couple-mystery-case-summary"><small>案 ${caseFile.number} · ${esc(caseFile.subtitle)}</small><h2>${esc(caseFile.title)}</h2><p>${esc(caseFile.intro)}</p><div class="couple-mystery-summary-grid"><div><b>涉案人物</b>${caseFile.characters.map(([n,d]) => `<span><strong>${esc(n)}</strong>${esc(d)}</span>`).join('')}</div><div><b>已知事实</b>${caseFile.initialFacts.map(f => `<span>· ${esc(f)}</span>`).join('')}</div></div><button data-mystery-start-investigate type="button">开始调查 →</button></section>`;
    const investigatePage = `<div class="couple-mystery-section-title"><b>可调查事项</b><small>完成 ${progress.investigated.length}/${caseFile.investigations.length}</small></div><div class="couple-mystery-investigations">${available.map(item => `<button data-mystery-investigation="${esc(item.id)}" type="button"><i>待查</i><b>${esc(item.title)}</b><small>调查后获得新内容 →</small></button>`).join('')}${locked.map(item => `<button class="is-locked" type="button" disabled><i>未解锁</i><b>${esc(item.title)}</b><small>需要：${esc(mysteryRequirementsText(caseFile,item))}</small></button>`).join('')}${progress.investigated.length === caseFile.investigations.length ? '<p class="couple-empty">当前调查项目已经查完，可以进入断案。</p>' : ''}</div><div class="couple-mystery-investigation-history">${progress.investigated.map(id => { const item=caseFile.investigations.find(x=>x.id===id); return item ? `<article><small>已完成调查</small><b>${esc(item.title)}</b><p>${esc(item.content)}</p><em>获得：${item.obtainedClues.map(cid=>esc(caseFile.clues[cid]?.name || cid)).join('、')}</em></article>` : ''; }).join('')}${(progress.freeInvestigations || []).map(item => `<article><small>自由调查 · ${esc(item.action)}</small><p>${esc(item.result)}</p></article>`).join('')}</div><div class="couple-mystery-free-investigate"><small>自由调查</small><p>可以用文字提出你想查的内容。只有蓝图中存在且当前条件允许的调查，才会形成新线索。</p><div><input data-mystery-free-input type="text" maxlength="160" placeholder="例如：检查窗框，重新询问更夫…" value="${esc(mysteryFreeDraft)}"><button data-mystery-free-investigate type="button" ${mysteryFreeBusy ? 'disabled' : ''}>${mysteryFreeBusy ? '查验中…' : '查验'}</button></div></div>`;
    const cluePage = `<div class="couple-mystery-section-title"><b>已获得线索</b><small>${acquired.size}/${clues.length}</small></div><div class="couple-mystery-clue-grid">${clues.filter(clue=>acquired.has(clue.id)).map(clue => `<article><small>${esc(clue.type)} · ${esc(clue.source)}</small><h3>${esc(clue.name)}</h3><p>${esc(clue.description)}</p><em>疑点：${esc(clue.doubt)}</em>${mysteryRelatedMarkup(caseFile,clue,acquired)}</article>`).join('') || '<p class="couple-empty">先去调查，案卷不会把答案提前交给你。</p>'}</div>${acquired.has('r_shoe') && acquired.has('r_night') ? '<div class="couple-mystery-relation">绣鞋与两次脚步声已经形成关联：两条信息无法简单拼成一个夜客。</div>' : ''}${acquired.has('g_boat') && acquired.has('g_river') ? '<div class="couple-mystery-relation">改过的航线与停泊点互相印证：有人提前准备了陷阱。</div>' : ''}${acquired.has('p_behavior') && acquired.has('p_skin') ? '<div class="couple-mystery-relation">女子的自述与人皮上的画无法同时成立。</div>' : ''}`;
    const discussPage = mysteryDiscussionMarkup(role, caseFile, progress);
    const archiveSource = caseFile.url ? `<a href="${esc(caseFile.url)}" target="_blank" rel="noopener noreferrer">阅读原典：${esc(caseFile.source)} ↗</a>` : `<span>本案为 API 生成的原创无名卷。</span>`;
    let reasonPage = `<div class="couple-mystery-section-title"><b>断案</b><small>${completedReason ? '全部成立' : `第 ${currentReason + 1}/${caseFile.reasoningQuestions.length} 问`}</small></div>`;
    if (!progress.investigated.length || progress.investigated.length < caseFile.investigations.length) reasonPage += '<div class="couple-mystery-locked-message">还需要更多调查和线索，才能开始完整断案。</div>';
    else if (progress.solved) { const truth = caseFile.truthData || {}; const timeline = Array.isArray(truth.fullTimeline) && truth.fullTimeline.length ? `<div class="couple-mystery-truth-block"><small>真实经过</small><ol>${truth.fullTimeline.map(item => `<li>${esc(item)}</li>`).join('')}</ol></div>` : ''; reasonPage += `<div class="couple-mystery-truth"><b>真相篇 · 案卷已归档</b><div class="couple-mystery-truth-block"><small>案件表象</small><p>${esc(caseFile.intro)}</p></div><div class="couple-mystery-truth-block"><small>关键疑点</small><p>${esc(truth.summary || caseFile.ending)}</p></div>${timeline}<div class="couple-mystery-truth-block"><small>志怪真相</small><p>${esc(truth.supernaturalTruth || truth.method || caseFile.ending)}</p><p>${esc(truth.turn || '')}</p></div><div class="couple-mystery-truth-block"><small>结案判词</small><p>${esc(caseFile.archiveText)}</p></div>${archiveSource}</div>`; }
    else if (completedReason) reasonPage += '<div class="couple-mystery-locked-message">你的推理链已经完成，可以回到调查页复核线索，或重新提交最终断案。</div>';
    else { const q=caseFile.reasoningQuestions[currentReason]; reasonPage += `<div class="couple-mystery-question"><small>${esc(q.label)}</small><h3>${esc(q.prompt)}</h3><div class="couple-mystery-options">${q.options.map((option,index)=>`<button data-mystery-reason="${index}" type="button" class="${progress.reasoning[q.id] === index ? 'is-selected' : ''}">${esc(option)}</button>`).join('')}</div><button data-mystery-reason-submit type="button" class="couple-mystery-submit" ${mysteryChoice < 0 ? 'disabled' : ''}>确认这一层推理</button></div>`; }
    const body = activeView === 'case' ? casePage : activeView === 'investigate' ? investigatePage : activeView === 'clues' ? cluePage : activeView === 'discuss' ? discussPage : reasonPage;
    return `<section class="couple-mystery" role="dialog" aria-modal="true" aria-label="${esc(caseFile.title)}">${header}<div class="couple-mystery-layout"><aside class="couple-mystery-sidebar"><div class="couple-mystery-sidebar-title"><small>卷 ${esc(caseFile.number || '新')}</small><b>${esc(caseFile.title)}</b><span>${esc(caseFile.subtitle || caseFile.tag || '')}</span></div>${mysteryCaseNav(activeView)}<div class="couple-mystery-sidebar-progress"><small>调查进度</small><b>${progress.investigated.length} / ${caseFile.investigations.length}</b><span>${progress.solved ? '此卷已结' : progress.clueIds.length ? '线索已入卷' : '尚未开卷'}</span></div></aside><main class="couple-mystery-main">${body}${mysteryFeedback ? `<p class="couple-mystery-feedback" role="status">${esc(mysteryFeedback)}</p>` : ''}<p class="couple-mystery-source">据 ${esc(caseFile.source)} 改编；游戏正文为重新组织的悬案版本。</p></main></div></section>`;
  }
  async function mysteryTalk() {
    const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId); const { role } = current(); const input = app.querySelector('[data-mystery-input]'); const message = String(input?.value || '').trim().slice(0,160); if (!caseFile || !message || mysteryBusy) return;
    const roleId=store.contactId; const requestId=++mysteryRequest; const progress=mysteryProgress(caseFile.id); progress.discussion.push({who:'user',text:message}); progress.discussion=progress.discussion.slice(-12); state.mysteryCases[caseFile.id]=progress; mysteryDraft=''; mysteryBusy=true; save(); render();
    const clues=mysteryClues(caseFile); const known=progress.clueIds.map(id=>caseFile.clues[id]).filter(Boolean).map(c=>`${c.name}：${c.description}（疑点：${c.doubt}）`).join('\n'); const investigations=progress.investigated.map(id=>caseFile.investigations.find(x=>x.id===id)?.title).filter(Boolean).join('、'); const available=caseFile.investigations.filter(item=>!progress.investigated.includes(item.id)&&item.requirements.every(id=>progress.clueIds.includes(id))).map(item=>item.title).join('、');
    const recentDiscussion = progress.discussion.slice(-8).map(item => `${item.who === 'user' ? '玩家' : roleName(role)}：${item.text}`).join('\n');
    const freeHistory = (progress.freeInvestigations || []).slice(-4).map(item => `${item.action}：${item.result}`).join('\n');
    const reasoning = Object.keys(progress.reasoning || {}).join('、') || '尚未提交';
    try { const reply=await requestCoupleAI(`你正在与用户合作调查《${caseFile.title}》。你是用户选择的角色本人，保持角色人设。案件真相保存在 truthData 中，禁止在用户未完成调查与断案前主动透露真凶、完整作案经过、最终反转或未获得的线索。只能使用本次提供的 playerKnownData：案件引子、涉案人物、已知事实、已获得线索、已完成调查、当前可调查内容、断案阶段。玩家直接问“凶手是谁”时，要求他先核对矛盾并给出下一步调查建议。可以提出怀疑、反问和温和提示，但不能替玩家下结论。回复 1—3 句，自然像探案搭档。\n案件引子：${caseFile.intro}\n人物：${caseFile.characters.map(x=>x[0]).join('、')}\n已知事实：${caseFile.initialFacts.join('；')}\n已获得线索：${known||'暂无'}\n已完成调查：${investigations||'暂无'}\n当前可调查：${available||'暂无'}\n自由调查记录：${freeHistory||'暂无'}\n已完成的推理层：${reasoning}\n最近讨论：${recentDiscussion||'暂无'}\n当前阶段：${mysteryView}`,`玩家说：${message}`,.65); if(requestId!==mysteryRequest||!mysteryOpen||store.contactId!==roleId||mysteryCaseId!==caseFile.id)return; const latest=mysteryProgress(caseFile.id); latest.discussion.push({who:'role',text:reply.slice(0,280)}); latest.discussion=latest.discussion.slice(-12); state.mysteryCases[caseFile.id]=latest; save(); } catch(error){ if(requestId===mysteryRequest)mysteryFeedback=`求助失败：${error.message}`; } finally { if(requestId===mysteryRequest){ mysteryBusy=false; render(); } }
  }
  function games(role, profile) {
    const categories = [['🏁', '竞速'], ['🧩', '益智解谜'], ['♠', '娱乐场'], ['☀', '云游戏'], ['🎯', '策略']];
    const chips = categories.map(([icon, label], index) => `<button class="couple-games-chip" type="button" disabled><i class="couple-games-chip-icon chip-icon-${index + 1}" aria-hidden="true"></i><span>${label}</span></button>`).join('');
    const installed = [
      '<article class="couple-games-installed-card is-filled"><img class="couple-games-installed-cover" src="assets/ui/game-covers/flower-roulette-cover-photo-v2.webp" onerror="this.onerror=null;this.src=\'assets/ui/game-covers/flower-roulette-cover-photo-v2.png\'" alt="花朵轮盘游戏封面"><div class="couple-games-installed-copy"><i>双人心理博弈</i><b>花朵轮盘</b><span>谁被鲜花打中，谁就输</span><button data-flower-roulette-open type="button">打开</button></div></article>',
      '<article class="couple-games-installed-card is-filled couple-mystery-cover"><div class="couple-mystery-cover-art"><img src="assets/ui/game-covers/ancient-mystery-cover-v2.webp" onerror="this.onerror=null;this.src=\'assets/ui/game-covers/ancient-mystery-cover-v2.png\'" alt="古籍悬案游戏封面"></div><div class="couple-games-installed-copy"><i>和 TA 一起读案推理</i><b>古籍悬案</b><span>翻开案卷，找出真相</span><button data-mystery-open type="button">打开</button></div></article>',
      '<article class="couple-games-installed-card is-filled stock-cover"><img class="couple-games-installed-cover" src="assets/ui/game-covers/stock-sort-cover-v1.webp" onerror="this.onerror=null;this.src=\'assets/ui/game-covers/stock-sort-cover-v1.png\'" alt="分类理货游戏封面"><div class="couple-games-installed-copy"><i>轻巧分类益智</i><b>分类理货</b><span>整理货堆，完成今日订单</span><button data-stock-open type="button">打开</button></div></article>'
    ].join('');
    const rows = Array.from({ length: 4 }, () => '<article class="couple-games-row" aria-label="未安装游戏待定"><i class="couple-games-row-icon"></i><div><b></b><span></span></div><div class="couple-games-row-action"><button type="button" aria-label="获取">获取</button><small>App 内购买</small></div></article>').join('');
    return `<section class="couple-games-shell"><div class="couple-games-category-row">${chips}</div><section class="couple-games-installed-row" aria-label="已安装游戏">${installed}</section><section class="couple-games-list-slot"><header><div><h2>近期佳作</h2><span>向左滑动查看更多</span></div><button type="button" disabled>查看全部</button></header>${rows}</section></section>`;
  }
  function resetFlowerRouletteRound() {
    if (flowerRouletteCountdownTimer) window.clearInterval(flowerRouletteCountdownTimer);
    flowerRouletteCountdownTimer = 0;
    flowerRouletteSession += 1;
    flowerRouletteRoleRequest += 1;
    flowerRouletteStarted = false;
    flowerRouletteFirstActor = flowerRouletteTurn = flowerRouletteUserAction = flowerRouletteRoleChoice = flowerRouletteRoleReply = flowerRouletteWinner = flowerRouletteError = flowerRouletteEndingReply = '';
    flowerRouletteCountdown = flowerRouletteShots = 0;
    flowerRouletteFlowerSlot = -1;
    flowerRouletteHistory = [];
    flowerRouletteShot = null;
    flowerRouletteApiBusy = flowerRouletteProbeUsed = flowerRouletteEndingBusy = false;
  }
  const flowerRouletteRoleName = () => current().role?.name || roleName(current().role);
  async function generateFlowerRouletteEnding() {
    if (!flowerRouletteWinner || flowerRouletteEndingBusy) return;
    const session = flowerRouletteSession;
    const roleWon = flowerRouletteWinner === 'role';
    flowerRouletteEndingBusy = true;
    render();
    try {
      const raw = await requestCoupleAI('花朵轮盘已经结束。你就是坐在用户对面的角色本人。请根据你的人设，对刚才的胜负直接说一句自然的口语反应；不要解释规则，不要叙述动作，不要自称 AI。只返回 JSON：{"reply":"你的话"}。', `结果：${roleWon ? '你开出的鲜花弹击中了用户，你赢了' : '用户开出的鲜花弹击中了你，你输了'}。已开 ${flowerRouletteShots} 枪。请对用户说一句话。`);
      if (session !== flowerRouletteSession) return;
      const reply = String(parseApiObject(raw)?.reply || raw).trim();
      flowerRouletteEndingReply = reply.slice(0, 120) || (roleWon ? '这局是我赢了。' : '好吧，这局你赢了。');
    } catch {
      if (session !== flowerRouletteSession) return;
      flowerRouletteEndingReply = roleWon ? '这局是我赢了。' : '好吧，这局你赢了。';
    } finally {
      if (session === flowerRouletteSession) { flowerRouletteEndingBusy = false; render(); }
    }
  }
  function startFlowerRouletteGame() {
    if (flowerRouletteStarted) return;
    resetFlowerRouletteRound();
    flowerRouletteStarted = true;
    flowerRouletteFlowerSlot = Math.floor(Math.random() * 6);
    flowerRouletteFirstActor = Math.random() < .5 ? 'user' : 'role';
    flowerRouletteTurn = flowerRouletteFirstActor;
    render();
    if (flowerRouletteTurn === 'user') startFlowerRouletteUserTurn();
    else chooseFlowerRouletteRole();
  }
  function startFlowerRouletteUserTurn() {
    if (!flowerRouletteOpen || flowerRouletteWinner) return;
    flowerRouletteTurn = 'user';
    flowerRouletteUserAction = '';
    flowerRouletteProbeUsed = false;
    flowerRouletteCountdown = 10;
    flowerRouletteCountdownTimer = window.setInterval(() => {
      flowerRouletteCountdown -= 1;
      if (flowerRouletteCountdown <= 0) chooseFlowerRouletteAction('hold', true);
      else render();
    }, 1000);
    render();
  }
  function applyFlowerRouletteAction(actor, action, timedOut = false) {
    const name = actor === 'user' ? '你' : flowerRouletteRoleName();
    if (action === 'shoot') {
      const flower = flowerRouletteShots === flowerRouletteFlowerSlot;
      flowerRouletteShot = { actor, flower, at:Date.now(), variety:Math.floor(Math.random() * 4) };
      flowerRouletteShots += 1;
      flowerRouletteHistory.push(`${name}开枪：${flower ? '鲜花弹' : '空弹'}`);
      flowerRouletteRoleReply = `${name}开枪，${flower ? '鲜花击中了对方。' : '是空弹。'}`;
      if (flower) flowerRouletteWinner = actor;
    } else {
      flowerRouletteHistory.push(`${name}放下枪${timedOut ? '（超时）' : ''}`);
      flowerRouletteRoleReply = timedOut ? `时间到了，${name}放下了枪。` : `${name}放下了枪。`;
    }
    flowerRouletteTurn = flowerRouletteWinner ? '' : actor === 'user' ? 'role' : 'user';
    render();
    if (flowerRouletteWinner) generateFlowerRouletteEnding();
  }
  function chooseFlowerRouletteAction(action, timedOut = false) {
    if (!flowerRouletteStarted || flowerRouletteTurn !== 'user' || flowerRouletteWinner || (!flowerRouletteCountdown && !timedOut) || !['shoot','hold'].includes(action)) return;
    if (flowerRouletteCountdownTimer) window.clearInterval(flowerRouletteCountdownTimer);
    flowerRouletteCountdownTimer = flowerRouletteCountdown = 0;
    flowerRouletteUserAction = action;
    flowerRouletteProbeUsed = false;
    applyFlowerRouletteAction('user', action, timedOut);
    if (!flowerRouletteWinner) chooseFlowerRouletteRole();
  }
  function testFlowerRouletteRole() {
    if (!flowerRouletteStarted || flowerRouletteTurn !== 'role' || !flowerRouletteUserAction || !flowerRouletteApiBusy || flowerRouletteProbeUsed || flowerRouletteWinner) return;
    flowerRouletteProbeUsed = true;
    chooseFlowerRouletteRole(true);
  }
  async function chooseFlowerRouletteRole(probed = false) {
    if (!flowerRouletteOpen || !flowerRouletteStarted || flowerRouletteTurn !== 'role' || flowerRouletteWinner || (flowerRouletteApiBusy && !probed)) return;
    if (flowerRouletteCountdownTimer) window.clearInterval(flowerRouletteCountdownTimer);
    flowerRouletteApiBusy = true;
    flowerRouletteError = '';
    const session = flowerRouletteSession;
    const request = ++flowerRouletteRoleRequest;
    flowerRouletteCountdown = 10;
    flowerRouletteCountdownTimer = window.setInterval(() => {
      if (session !== flowerRouletteSession || request !== flowerRouletteRoleRequest || flowerRouletteTurn !== 'role') { window.clearInterval(flowerRouletteCountdownTimer); flowerRouletteCountdownTimer=0; return; }
      flowerRouletteCountdown -= 1;
      if (flowerRouletteCountdown > 0) { render(); return; }
      window.clearInterval(flowerRouletteCountdownTimer); flowerRouletteCountdownTimer=0;
      flowerRouletteRoleRequest += 1; flowerRouletteApiBusy=false;
      const fallback=flowerRouletteShots >= 4 || Math.random() < .68 ? 'shoot' : 'hold';
      flowerRouletteRoleChoice=fallback; applyFlowerRouletteAction('role',fallback,true);
      flowerRouletteRoleReply=`${flowerRouletteRoleName()}在最后一秒作出了决定。 ${flowerRouletteRoleReply}`;
      if (!flowerRouletteWinner) startFlowerRouletteUserTurn();
    },1000);
    render();
    try {
      const raw = await requestCoupleAI('你正在和用户玩花朵轮盘。每次轮到你，只能选择朝对方开枪或放下枪交出行动权。枪共有六个弹位，一发鲜花弹，五发空弹；开枪消耗一个弹位，鲜花弹击中对方则开枪者获胜。根据角色性格、可见的已消耗弹位和历史行动做决定；你不知道鲜花弹具体在哪一格。只返回 JSON：{"choice":"shoot 或 hold","reply":"一句自然反应"}。', `已开 ${flowerRouletteShots} 枪，剩余 ${6 - flowerRouletteShots} 发。先手：${flowerRouletteFirstActor === 'user' ? '用户' : '你'}。历史：${flowerRouletteHistory.slice(-10).join('；') || '尚未行动'}。${probed ? '用户刚才试探了你，请把这次试探考虑进判断。' : ''}现在轮到你选择。`);
      if (session !== flowerRouletteSession || request !== flowerRouletteRoleRequest) return;
      const item = parseApiObject(raw);
      if (!['shoot','hold'].includes(item?.choice)) throw new Error('角色没有返回有效选择');
      if (flowerRouletteCountdownTimer) window.clearInterval(flowerRouletteCountdownTimer);
      flowerRouletteCountdownTimer=flowerRouletteCountdown=0;
      flowerRouletteRoleChoice = item.choice;
      applyFlowerRouletteAction('role', item.choice);
      if (item.reply) flowerRouletteRoleReply = `${String(item.reply).slice(0, 80)} ${flowerRouletteRoleReply}`;
      if (!flowerRouletteWinner) startFlowerRouletteUserTurn();
    } catch (error) {
      if (session !== flowerRouletteSession || request !== flowerRouletteRoleRequest) return;
      if (flowerRouletteCountdownTimer) window.clearInterval(flowerRouletteCountdownTimer);
      flowerRouletteCountdownTimer=flowerRouletteCountdown=0;
      const fallback=flowerRouletteShots >= 4 || Math.random() < .68 ? 'shoot' : 'hold';
      flowerRouletteRoleChoice=fallback; applyFlowerRouletteAction('role',fallback);
      flowerRouletteRoleReply=`${flowerRouletteRoleName()}很快作出了决定。 ${flowerRouletteRoleReply}`;
      if (!flowerRouletteWinner) startFlowerRouletteUserTurn();
    } finally {
      if (session === flowerRouletteSession && request === flowerRouletteRoleRequest) { flowerRouletteApiBusy = false; render(); }
    }
  }
  function flowerRouletteControlsMarkup() {
    if (!flowerRouletteStarted) return `<div class="couple-flower-controls couple-flower-controls-start"><button class="couple-flower-start" data-flower-start type="button">开始</button></div>`;
    const name = flowerRouletteRoleName();
    const status = flowerRouletteWinner ? (flowerRouletteWinner === 'user' ? `你赢了，鲜花击中了${name}` : `${name}赢了，鲜花击中了你`) : flowerRouletteTurn === 'user' ? '轮到你' : flowerRouletteApiBusy ? `${name}正在思考…` : `轮到${name}`;
    return `<div class="couple-flower-controls"><div class="couple-flower-round-status"><span>${esc(status)}</span><small>先手：${flowerRouletteFirstActor === 'user' ? '你' : esc(name)} · 剩余 ${6 - flowerRouletteShots} 发</small>${flowerRouletteCountdown ? `<b>倒计时 ${flowerRouletteCountdown}s</b>` : ''}${flowerRouletteRoleReply ? `<p>${esc(flowerRouletteRoleReply)}</p>` : ''}${flowerRouletteWinner && flowerRouletteEndingBusy ? `<p>${esc(name)}正在回应…</p>` : ''}${flowerRouletteEndingReply ? `<p>${esc(name)}：${esc(flowerRouletteEndingReply)}</p>` : ''}${flowerRouletteError ? `<p>${esc(flowerRouletteError)}</p>` : ''}</div>${flowerRouletteWinner ? '<button class="couple-flower-start" data-flower-restart type="button">再玩一局</button>' : `<div class="couple-flower-action-buttons"><button data-flower-action="shoot" type="button" ${flowerRouletteTurn !== 'user' || !flowerRouletteCountdown ? 'disabled' : ''}>开枪</button><button data-flower-action="hold" type="button" ${flowerRouletteTurn !== 'user' || !flowerRouletteCountdown ? 'disabled' : ''}>放下枪</button><button class="is-probe" data-flower-probe type="button" ${flowerRouletteTurn !== 'role' || !flowerRouletteUserAction || !flowerRouletteApiBusy || flowerRouletteProbeUsed ? 'disabled' : ''}>试探${esc(name)}</button></div>${flowerRouletteError ? `<button class="couple-flower-retry" data-flower-retry type="button">重试${esc(name)}的选择</button>` : ''}`}</div>`;
  }
  function flowerRouletteMarkup(role) { return `<section class="couple-flower-roulette" role="dialog" aria-modal="true" aria-label="花朵轮盘"><header class="couple-flower-roulette-header"><h1>花朵轮盘</h1><button class="couple-flower-roulette-close" data-flower-roulette-close type="button" aria-label="关闭花朵轮盘">×</button></header><main class="couple-flower-table-scene"><div class="couple-flower-opponent" aria-label="对面的${esc(role?.name || roleName(role))}"><div class="couple-flower-opponent-avatar">${avatar(role, role?.name || '角色')}</div></div>${flowerRouletteGunMarkup()}${flowerRouletteControlsMarkup()}</main></section>`; }
  function flowerRouletteGunMarkup() {
    const assetVersion = '20260924-webp-1';
    const shot = flowerRouletteShot;
    const elapsed = shot ? Date.now() - shot.at : 2000;
    const firing = elapsed < 1600;
    const actor = firing ? shot.actor : flowerRouletteTurn || shot?.actor || 'user';
    const flowerShot = firing && shot.flower;
    const gunImage = actor === 'role'
      ? (flowerShot ? 'gun-bouquet-front-cutout.webp' : 'gun-front-cutout.webp')
      : (flowerShot ? 'gun-bouquet-diagonal-cutout.webp' : 'gun-diagonal-cutout.webp');
    const gunFallback = gunImage.replace('.webp', '.png');
    return `<div class="flower-gun-stage is-${actor} ${flowerShot ? 'is-flower-shot' : ''}" aria-label="共用鲜花枪，枪口朝向${actor === 'user' ? esc(flowerRouletteRoleName()) : '你'}"><div class="flower-gun ${firing ? 'is-firing' : ''}" style="--shot-delay:-${elapsed}ms"><img src="assets/flower-roulette/${gunImage}?v=${assetVersion}" onerror="this.onerror=null;this.src='assets/flower-roulette/${gunFallback}?v=${assetVersion}'" alt="鲜花轮盘左轮枪" draggable="false"></div></div>${firing && !shot.flower ? `<div class="flower-shot-effect is-${shot.actor} is-empty" style="--shot-delay:-${elapsed}ms" aria-hidden="true"><span>咔哒</span></div>` : ''}`;
  }
  function legacyGamesV3() {
    const { role } = current();
    const play = state.play?.title ? state.play : null;
    const turns = play?.turns || [];
    return `<section class="couple-ai-intro"><span>TA'S PRIVATE SPACE</span><h2>不是选一个答案，而是和 Ta 一起把故事走下去。</h2><p>Ta 会按照角色身份、性格、你们的回忆和共同计划现场展开互动。你可以用自己的话参与，Ta 会根据每一回合继续回应。</p></section>${play ? `<section class="couple-live-play"><div class="couple-live-head"><div><span>TA'S LIVE SESSION</span><h2>${esc(play.title)}</h2></div><small>${esc(play.progress || '进行中')}</small></div><p class="couple-live-intro">${esc(play.intro)}</p><div class="couple-play-thread">${turns.map(item => `<div class="couple-play-bubble ${item.speaker === 'user' ? 'is-user' : ''}"><span>${item.speaker === 'user' ? '你' : esc(roleName(role))}</span><p>${esc(item.text)}</p></div>`).join('')}</div><div class="couple-live-prompt"><span>现在轮到你</span><p>${esc(play.prompt)}</p><textarea id="couplePlayInput" placeholder="用你自己的话告诉 Ta…" ${apiBusy ? 'disabled' : ''}></textarea><button class="couple-play-send" data-couple-play-send type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? 'Ta 正在回应…' : '发送给 Ta'}</button></div><button class="couple-play-reset" data-couple-play-start type="button" ${apiBusy ? 'disabled' : ''}>重新让 Ta 设计一局</button></section>` : `<section class="couple-ai-start"><div class="couple-ai-orbit"><i>Ta</i></div><h2>让 Ta 为你们现场设计一局</h2><p>可以是共同创作、关系推理、回忆探险、远程约会或角色小剧场，具体内容会根据 Ta 的身份和你们的资料生成。</p><button data-couple-play-start type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? 'Ta 正在准备互动…' : '让 Ta 开始互动'}</button></section>`}<section class="couple-ai-plan-card"><div><span>TA'S DATE PLAN</span><h2>让 Ta 设计下一次相处</h2></div>${state.aiPlan ? `<p class="couple-ai-plan-result">${esc(state.aiPlan)}</p>` : '<p>Ta 会读取你们的回忆、计划和角色性格，写一份只适合你们的约会或线上相处方案。</p>'}<button data-couple-ai-plan type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? 'Ta 正在准备…' : state.aiPlan ? '再让 Ta 设计一份' : '让 Ta 生成专属计划'} <b>↗</b></button></section><button class="couple-play-record" data-couple-add-memory type="button">把这次和 Ta 的互动记录成回忆</button>`;
  }
  function legacyGamesV2() {
    const { role } = current();
    const play = state.play?.title ? state.play : null;
    const turns = play?.turns || [];
    return `<section class="couple-ai-intro"><span>AI RELATIONSHIP LAB</span><h2>不是选一个答案，而是一起把故事走下去。</h2><p>互动内容会读取你们的角色设定、回忆和共同计划，由 API 现场生成。你可以用自己的话参与，角色会根据每一回合继续推进。</p></section>${play ? `<section class="couple-live-play"><div class="couple-live-head"><div><span>LIVE SESSION</span><h2>${esc(play.title)}</h2></div><small>${esc(play.progress || '进行中')}</small></div><p class="couple-live-intro">${esc(play.intro)}</p><div class="couple-play-thread">${turns.map(item => `<div class="couple-play-bubble ${item.speaker === 'user' ? 'is-user' : ''}"><span>${item.speaker === 'user' ? '你' : esc(roleName(role))}</span><p>${esc(item.text)}</p></div>`).join('')}</div><div class="couple-live-prompt"><span>现在轮到你</span><p>${esc(play.prompt)}</p><textarea id="couplePlayInput" placeholder="用你自己的话告诉 TA…" ${apiBusy ? 'disabled' : ''}></textarea><button class="couple-play-send" data-couple-play-send type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? '角色正在回应…' : '发送给 TA'}</button></div><button class="couple-play-reset" data-couple-play-start type="button" ${apiBusy ? 'disabled' : ''}>重新生成一局</button></section>` : `<section class="couple-ai-start"><div class="couple-ai-orbit"><i>AI</i></div><h2>让 AI 为你们现场设计一局</h2><p>可以是共同创作、关系推理、回忆探险、远程约会或角色小剧场，具体内容由你们的资料决定，不使用固定题库。</p><button data-couple-play-start type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? '正在生成专属互动…' : '开始一局互动'}</button></section>`}<section class="couple-ai-plan-card"><div><span>AI DATE DIRECTOR</span><h2>让 AI 设计下一次相处</h2></div>${state.aiPlan ? `<p class="couple-ai-plan-result">${esc(state.aiPlan)}</p>` : '<p>读取你们的回忆、计划和角色性格，生成一份不是模板的约会或线上相处方案。</p>'}<button data-couple-ai-plan type="button" ${apiBusy ? 'disabled' : ''}>${apiBusy ? '正在生成…' : state.aiPlan ? '重新生成计划' : '生成专属计划'} <b>↗</b></button></section><button class="couple-play-record" data-couple-add-memory type="button">把这次互动记录成回忆</button>`;
  }
  function legacyGames() {
    const challenge = dailyChallenge();
    const pickedMemory = state.memories.find(item => item.id === state.pickedMemoryId);
    const plans = state.wishes.slice(0, 5);
    return `<section class="couple-play-intro"><span>PLAY TOGETHER</span><h2>今天不做选择题，做一件小事。</h2><p>这里的玩法不依赖 API。你们完成过的每一次签到、记录和计划，都会变成共同进度。</p></section><section class="couple-challenge-card ${challenge.done ? 'is-done' : ''}"><div class="couple-challenge-top"><span>DAILY CHALLENGE</span><small>${challenge.done ? '今日已完成' : '今天的共同任务'}</small></div><h2>${esc(challenge.title)}</h2><p>${esc(challenge.desc)}</p><button class="couple-challenge-button" data-couple-challenge-done type="button">${challenge.done ? '已完成 ✓' : '完成今日挑战'}</button></section><section class="couple-play-grid"><article class="couple-play-card"><span>DATE DRAW</span><h3>约会抽签</h3><p>${state.dateIdea ? esc(state.dateIdea) : '不知道下次见面做什么？抽一张。'}</p><button data-couple-date-draw type="button">${state.dateIdea ? '再抽一张' : '开始抽签'} <b>↗</b></button></article><article class="couple-play-card"><span>MEMORY BOX</span><h3>回忆盲盒</h3><p>${pickedMemory ? `“${esc(pickedMemory.title)}”` : state.memories.length ? '随机打开一段你们的过去' : '先记录一段回忆再来抽取'}</p><button data-couple-memory-draw type="button" ${state.memories.length ? '' : 'disabled'}>${pickedMemory ? '再开一段' : '打开盲盒'} <b>↗</b></button></article></section><section class="couple-progress-card"><div><span>YOUR LITTLE STORY</span><h3>共同进度</h3></div><div class="couple-progress-number"><strong>${localPlayCount()}</strong><small>件小事</small></div><p>把平常的日子留下来，关系就不会只有“想做什么”的问答，而会有真正发生过的证据。</p><div class="couple-progress-bar"><i style="width:${Math.min(100, localPlayCount() * 7 + 8)}%"></i></div></section><section class="couple-play-plans"><div class="couple-section-head"><div><span>SHARED PLANS</span><h2>共同计划</h2></div><button data-couple-add-wish type="button">＋ 新计划</button></div>${plans.length ? `<div class="couple-plan-list">${plans.map(item => `<button class="couple-plan-item ${item.done ? 'is-done' : ''}" data-couple-toggle-wish="${esc(item.id)}" type="button"><i>${item.done ? '✓' : '○'}</i><span><b>${esc(item.text)}</b><small>${item.done ? '已完成 · 点击可恢复' : '点击标记完成'}</small></span></button>`).join('')}</div>` : '<p class="couple-empty">还没有计划。先写一个你们真的想一起完成的事情。</p>'}</section><button class="couple-play-api" data-couple-role-response="wishes" type="button">想听听角色怎么回应？</button>`;
  }
  function mailbox() { return `<p class="couple-subhint">写一封给未来的信，每封信都可以收到独立回信。</p><button class="couple-primary" data-couple-add-letter type="button">写一封信</button><div class="couple-list">${state.letters.length ? state.letters.map(item => `<button class="couple-letter" data-couple-letter="${esc(item.id)}" type="button"><b>${esc(item.title)}</b><small>${esc(item.date)}</small><p>${esc(item.text)}</p>${state.letterReplies?.[item.id] ? '<em>已有回信 · 点击查看</em>' : '<em>点击查看信件</em>'}</button>`).join('') : '<p class="couple-empty">信箱还是空的。</p>'}</div>`; }
  function dailyQuestion() { const today = new Date().toISOString().slice(0, 10); if (state.dailyQuestionDate !== today || !state.dailyQuestionText) { let seed = 0; [...today].forEach(char => { seed = (seed * 31 + char.charCodeAt(0)) % 997; }); state.dailyQuestionDate = today; state.dailyQuestionText = questions[seed % questions.length]; save(); } return state.dailyQuestionText; }
  function questionsPage(role, profile) { const question = dailyQuestion(); const answer = state.answers[question] || ''; const roleAnswer = state.roleAnswers?.[question] || ''; return `<article class="couple-question"><h3>${esc(question)}</h3><textarea id="coupleAnswer" placeholder="写下你的答案…">${esc(answer)}</textarea><button class="couple-primary" data-couple-save-answer type="button">保存回答</button>${roleAnswer ? `<div class="couple-answer-thread"><div><span>${esc(profileName(profile))}</span><p>${esc(answer)}</p></div><div><span>${esc(roleName(role))}</span><p>${esc(roleAnswer)}</p></div></div>` : ''}</article>`; }
  function rolePicker(isEntry = false) { const data = chatData(); const roleCards = data.contacts.filter(item => item && !item.isGroup).map(item => `<button class="couple-role ${item.id === store.contactId ? 'is-selected' : ''}" data-couple-role="${esc(item.id)}" type="button"><div class="couple-role-avatar">${avatar(item)}</div><span><b>${esc(roleName(item))}</b><small>${data.chats[item.id]?.profileId ? '已绑定用户设定' : '尚未绑定用户设定'}</small></span><i>${item.id === store.contactId ? '✓' : '›'}</i></button>`).join(''); return `<div class="couple-role-sheet ${isEntry ? 'is-entry' : ''}"><div class="couple-role-backdrop" data-couple-role-close></div><section><header><div><h2>${isEntry ? '进入情侣空间' : '选择角色'}</h2>${isEntry ? '<p class="couple-role-entry-hint">先选择要和哪位角色一起进入，之后空间里的内容都会属于你们。</p>' : ''}</div><button data-couple-role-close type="button">×</button></header><div>${roleCards || '<p class="couple-empty">还没有角色，请先在聊天 App 中添加角色。</p>'}</div></section></div>`; }
  function recordOpenMarkup() { if (!recordType) return ''; const labels = { event:['添加纪念日','纪念日名称','日期'], date:['记录约会','约会安排','约会日期'], memory:['记录回忆','回忆标题','回忆内容'], wish:['添加共同愿望','愿望内容','备注（可选）'], letter:['挂一枚祈愿','给愿望一个名字','想对 Ta 说的话'] }; const [title, first, second] = labels[recordType]; const dateInput = ['event','date'].includes(recordType) ? '<input id="coupleRecordSecond" type="date">' : `<textarea id="coupleRecordSecond" placeholder="请输入${second}"></textarea>`; return `<div class="couple-record-sheet ${recordType === 'letter' ? 'is-wish-record' : ''}"><div class="couple-record-backdrop" data-couple-record-close></div><section><header><h2>${title}</h2><button data-couple-record-close type="button">×</button></header><label>${first}<input id="coupleRecordFirst" type="text" placeholder="请输入${first}"></label><label>${second}${dateInput}</label><footer><button data-couple-record-close type="button">取消</button><button data-couple-record-save type="button">${recordType === 'letter' ? '系上祈愿' : '保存'}</button></footer></section></div>`; }
  function letterOpenMarkup() { if (!openLetterId) return ''; const item = state.letters.find(entry => entry.id === openLetterId); if (!item) return ''; const reply = state.letterReplies?.[item.id] || ''; const { role } = current(); return `<div class="couple-letter-sheet couple-wish-sheet"><div class="couple-letter-backdrop" data-couple-letter-close></div><section><header><div><span>OUR LITTLE WISH</span><h2>${esc(item.title)}</h2></div><button data-couple-letter-close type="button">×</button></header><small class="couple-letter-date">${esc(item.date)}</small><p class="couple-letter-content">${esc(item.text)}</p>${reply ? `<div class="couple-letter-reply"><span>${esc(roleName(role))} 接住了这句话</span><p>${esc(reply)}</p></div>` : `<p class="couple-letter-waiting">${esc(roleName(role))} 正在读这枚祈愿。</p>`}<footer><button data-couple-letter-reply type="button">${reply ? '再听听 Ta 的话' : '现在回应'}</button></footer></section></div>`; }
  function openPrompt(type) {
    if (type === 'event') { const title = window.prompt('纪念日名称'); if (!title?.trim()) return; const when = window.prompt('日期（例如 2026-08-22）', new Date().toISOString().slice(0, 10)); state.events.unshift({ id: uid('event'), title: title.trim(), date: when?.trim() || date(), createdAt:Date.now(), contactId:store.contactId }); save(true); render(); return; }
    if (type === 'wish') { const text = window.prompt('想和对方一起完成什么？'); if (text?.trim()) { state.wishes.unshift({ id: uid('wish'), text: text.trim(), done: false, createdAt:Date.now() }); save(); render(); } return; }
    if (type === 'letter') { const title = window.prompt('给这封信取个名字', '写给未来的我们'); if (!title?.trim()) return; const text = window.prompt('写下想说的话'); if (text?.trim()) { state.letters.unshift({ id: uid('letter'), title: title.trim(), text: text.trim(), date: date(), createdAt:Date.now() }); save(); render(); } return; }
    if (type === 'memory') { const title = window.prompt('回忆标题'); if (!title?.trim()) return; const text = window.prompt('写下这段回忆'); if (!text?.trim()) return; pendingMemory = { title: title.trim(), text: text.trim() }; if (window.confirm('要为这段回忆添加一张照片吗？')) app.querySelector('.couple-hidden-file').click(); else finishMemory(''); }
  }
  function finishMemory(image) { if (!pendingMemory) return; state.memories.unshift({ id: uid('memory'), ...pendingMemory, image: image || '', date: date(), createdAt:Date.now() }); pendingMemory = null; save(); render(); }
  async function startCouplePlay() { const { role } = current(); apiBusy = true; render(); try { const raw = await requestCoupleAI(`你是情侣空间里的互动导演，同时要自然扮演角色“${roleName(role)}”。不要给用户固定选项，不要只说一句安慰话。请根据双方资料设计一局可以连续进行的、需要用户用文字或真实行动参与的互动。输出 JSON：{"title":"互动名称","intro":"开场说明","prompt":"现在请用户做的第一步","progress":"进度提示"}。内容要具体、生活化、有一点惊喜，不要涉及危险、金钱或隐私。\n\n${coupleContext()}`, `请为我们现在开启一局新的互动。不要重复普通的“今天心情如何”“想对我说什么”，让它像一个只为这段关系设计的小剧场、任务或共同创作。`); const item = parseApiObject(raw) || {}; state.play = { title:String(item.title || '你们的专属互动'), intro:String(item.intro || raw), prompt:String(item.prompt || '请用文字告诉我，你准备怎么开始？'), progress:String(item.progress || '第一回合'), turns:[], createdAt:Date.now() }; save(); } catch (error) { window.alert(`开启互动失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateDailyMoment() { const { role } = current(); apiBusy = true; render(); try { const raw = await requestCoupleAI(`你要以“${roleName(role)}”的身份，为情侣空间创造一个只能在当前页面中完成的“心动频道”。严禁设计见面、散步、吃饭、拍照、打电话、出门、购买物品或任何现实行动；用户只需要在页面里输入文字就能完整参与。玩法也不能只是普通提问。请从延迟揭晓、双方秘密交换、平行回答、关系推理、记忆细节猜测、共同续写、立场互换、匿名心声中选择或创造一种，并设计明确的揭晓机制与连续回合。角色必须真实参与、有自己的答案和判断，不能只主持。贴合人设和已有关系资料，但不得捏造已经发生过的经历。只输出 JSON：{"kind":"2至6字的频道类型","title":"有吸引力的频道名，12字内","scene":"玩法机制和悬念，40至90字","message":"角色发起频道时亲口说的话，15至50字","roleStatus":"角色此刻状态，10字内","userStatus":"对用户状态的保守描述，10字内","play":{"title":"频道名","intro":"玩法开场和揭晓规则","prompt":"用户现在只需用文字回答的第一步","progress":"第一回合"}}。\n\n${coupleContext()}`, `请生成一种近期没有出现过的双人频道。它必须在线上闭环完成，并且后续至少还能自然推进两个回合。`); const item = parseApiObject(raw); if (!item?.title || !item?.play) throw new Error('返回内容不完整'); state.dailyMoment = { kind:String(item.kind || '双人频道'), title:String(item.title), scene:String(item.scene || ''), message:String(item.message || ''), createdAt:Date.now() }; state.presence = { roleStatus:String(item.roleStatus || '频道已连接'), userStatus:String(item.userStatus || '正在这里'), updatedAt:Date.now() }; state.play = { title:String(item.play.title || item.title), intro:String(item.play.intro || item.scene || ''), prompt:String(item.play.prompt || '只用文字告诉我你的答案。'), progress:String(item.play.progress || '第一回合'), turns:[], createdAt:Date.now() }; chapterOpen = false; save(); } catch (error) { window.alert(`接通频道失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function searchItemImage(queries) {
    const list = (Array.isArray(queries) ? queries : [queries]).map(value => String(value || '').trim()).filter(Boolean).slice(0,3);
    const request = async url => { const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 15000); try { const response = await window.fetch(url, { signal:controller.signal, mode:'cors', credentials:'omit' }); return response.ok ? await response.json() : null; } finally { window.clearTimeout(timer); } };
    const tokens = [...new Set(list.flatMap(query => query.toLowerCase().match(/[a-z0-9]{3,}|[\u4e00-\u9fff]{2,}/g) || []).filter(token => !['photo','photograph','object','product','item','with','the'].includes(token)))];
    const candidates = [];
    for (const query of list) {
      try {
        const openverse = new URL('https://api.openverse.org/v1/images/');
        openverse.search = new URLSearchParams({ q:`"${query}"`, page_size:'12', mature:'false' });
        const data = await request(openverse.href);
        (data?.results || []).forEach((item,index) => { if (item.thumbnail || item.url) candidates.push({ url:String(item.thumbnail || item.url), label:`${item.title || ''} ${(item.tags || []).map(tag => tag.name || '').join(' ')}`.toLowerCase(), rank:index }); });
      } catch {}
      try {
        const commons = new URL('https://commons.wikimedia.org/w/api.php');
        commons.search = new URLSearchParams({ action:'query', format:'json', origin:'*', generator:'search', gsrnamespace:'6', gsrlimit:'12', gsrsearch:`intitle:"${query}" filetype:bitmap`, prop:'imageinfo', iiprop:'url', iiurlwidth:'500' });
        const data = await request(commons.href);
        Object.values(data?.query?.pages || {}).forEach((page,index) => { const info = page.imageinfo?.[0]; if (info?.thumburl || info?.url) candidates.push({ url:String(info.thumburl || info.url), label:String(page.title || '').toLowerCase(), rank:index }); });
      } catch {}
    }
    const scored = candidates.map(candidate => ({ ...candidate, score:tokens.reduce((score,token) => score + (candidate.label.includes(token) ? 3 : 0),0) - candidate.rank * .04 })).sort((a,b) => b.score - a.score);
    return scored[0]?.score >= 2.5 ? scored[0].url : '';
  }
  async function generateItemExchange() { const input = app.querySelector('#coupleExchangeItem'); const userItem = input?.value.trim(); const { role } = current(); if (!userItem) return window.alert('请先输入想交换的物品名字。'); apiBusy = true; render(); try { const usedItems = [...(state.exchangeHistory || []), state.exchange?.roleItem].filter(Boolean); const canned = /仿佛|仿若|宛如|如同|像是|似乎|不仅|而且|总体来说|使用后|体验感|让人|令人|感受到|感受到了|充满了|一份|一丝|一抹|温暖|治愈|意义|承载|见证|陪伴|心意|珍藏|岁月|时光|故事|气息|味道变得|不由得|忍不住嘴角|拉近了距离/; let item = null; for (let attempt = 0; attempt < 3; attempt += 1) { const raw = await requestCoupleAI(`你就是恋人“${roleName(role)}”，正在与用户进行好物交换。根据角色身份、习惯、审美和随身物品挑一件角色确实可能拥有、愿意交给用户的具体物品。不能选择抽象事物、金钱或同类物品。过去已经交换过的角色物品是：${usedItems.join('、') || '暂无'}。本次角色物品必须与这些物品全部不同，也不能只是换颜色、品牌或近义名称。roleFeeling 和 userFeeling 只能写可观察的具体事实：手做了什么、物品摸起来或闻起来怎样、哪里方便或不顺手、角色当场说了什么。必须使用日常口语和短句。禁止任何比喻、拟人、排比、象征、抒情和感情升华；禁止写成测评、总结或纪念文案。禁用词与句式：仿佛、仿若、宛如、如同、像是、似乎、不仅……而且、总体来说、使用后、体验感、让人、令人、感受到、充满了、一份、一丝、一抹、温暖、治愈、意义、承载、见证、陪伴、心意、珍藏、岁月、时光、故事、气息、不由得、忍不住嘴角、拉近了距离。为双方物品各提供 3 个由具体物品类别组成的英文图片检索词，从精确到宽泛；检索词必须描述物品本身，禁止人物、场景、氛围和动作。只输出 JSON：{"roleItem":"角色物品名","userImageQueries":["精确英文物品名","英文同义物品名","英文物品类别"],"roleImageQueries":["精确英文物品名","英文同义物品名","英文物品类别"],"reason":"角色口语化说明为什么拿它交换，15至45字","roleFeeling":"角色拿到用户物品后的具体动作和一句口语反应","userFeeling":"用户第一次用角色物品时的具体动作与直接结果","message":"角色交换时说的一句话"}。\n\n${coupleContext()}`, `用户拿来的是：“${userItem}”。挑选一件从未交换过的物品。感受只写当场发生的事，不准比喻或升华。${attempt ? '上一次结果有重复物品或套话，请换物品并彻底重写。' : ''}`); const candidate = parseApiObject(raw); if (!candidate?.roleItem || !candidate?.roleFeeling || !candidate?.userFeeling) throw new Error('API 返回的交换内容不完整'); const normalized = String(candidate.roleItem).replace(/[\s·的]/g,'').toLowerCase(); const repeated = usedItems.some(name => { const old = String(name).replace(/[\s·的]/g,'').toLowerCase(); return old === normalized || old.includes(normalized) || normalized.includes(old); }); const formulaic = canned.test(`${candidate.roleFeeling} ${candidate.userFeeling}`); if (!repeated && !formulaic) { item = candidate; break; } } if (!item) throw new Error('角色连续生成了重复物品或套话，请再试一次'); const userQueries = Array.isArray(item.userImageQueries) ? item.userImageQueries : [item.userImageQuery,userItem]; const roleQueries = Array.isArray(item.roleImageQueries) ? item.roleImageQueries : [item.roleImageQuery,item.roleItem]; const [userImage,roleImage] = await Promise.all([searchItemImage(userQueries),searchItemImage(roleQueries)]); state.exchangeHistory = [...(state.exchangeHistory || []), String(item.roleItem)].slice(-50); state.exchange = { userItem, userImage, roleItem:String(item.roleItem), roleImage, reason:String(item.reason || '看到它时就觉得该给你。'), roleFeeling:String(item.roleFeeling), userFeeling:String(item.userFeeling), message:String(item.message || '交换成立。'), createdAt:Date.now() }; save(); } catch (error) { window.alert(`好物交换失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function finishDateSession() { const session = state.dateSession; const { role } = current(); if (!session || Date.now() < session.endAt) return; apiBusy = true; render(); try { const raw = await requestCoupleAI(`你就是恋人“${roleName(role)}”。一次约会刚刚结束。请根据地点、玩法、双方人设和关系，按发生顺序生成 3 个关键小情节，再用一句话收尾。不要写流水账、步骤或完美偶像剧；可以有停顿、意外、意见不同和很细小的亲密感。不得捏造重大关系进展。每个情节必须有简短节点名，内容写具体发生的事，不要抽象抒情。只输出 JSON：{"moments":[{"label":"出发","text":"情节一"},{"label":"中途","text":"情节二"},{"label":"结束","text":"情节三"}],"summary":"一句自然收尾"}。\n\n${coupleContext()}`, `约会地点：${session.place}\n选择玩法：${session.activity}\n玩法说明：${session.detail}\n预计时长：${session.durationMinutes} 分钟。`); const item = parseApiObject(raw); if (!Array.isArray(item?.moments)) throw new Error('约会总结返回不完整'); const moments = item.moments.slice(0,4).map((moment,index) => typeof moment === 'string' ? { label:['出发','中途','后来','结束'][index] || `片段 ${index + 1}`, text:String(moment) } : { label:String(moment?.label || moment?.time || ['出发','中途','后来','结束'][index] || `片段 ${index + 1}`), text:String(moment?.text || moment?.detail || '') }).filter(moment => moment.text); state.dateHistory.unshift({ ...session, date:new Date(session.startAt).toLocaleDateString('zh-CN'), moments, summary:String(item.summary || moments.map(moment => moment.text).join('；')), finishedAt:Date.now() }); state.dateSession = null; save(); } catch (error) { window.alert(`约会总结失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateRelationshipReview() {
    const { role, profile } = current();
    const evidence = reviewEvidence(role);
    if (!evidence.length) return window.alert('还没有可引用的聊天或相处片段。先聊几句或记录一段回忆，再来听 Ta 想说什么。');
    const source = evidence.find(item => item.key !== state.relationshipReview?.source?.key) || evidence[0];
    apiBusy = true; render();
    try {
      const raw = await requestCoupleAI(`你就是恋人“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}。用户设定：${profile?.persona || profile?.details || '暂无'}。请只根据下面提供的真实相处片段，写最近想亲口告诉用户的心里话，以及为什么这一刻让你想说它。note 是 45—100 字的第一人称心里话；reason 是 25—60 字的第一人称缘由，必须点出记录中实际出现的一句话或一个动作，再说清楚它触发了什么感受。绝不能添加记录里没有的事件、地点、时间、动作、对话或关系进展；不要把“视频通话”“聊天记录”这种栏目名称当成具体瞬间；不要写报告。只输出 JSON：{"note":"心里话","reason":"那句真实的话或动作为什么让你想说"}。\n\n唯一可引用的真实片段：${source.excerpt}`, '想到上面这个确实发生的瞬间，你此刻为什么想对我说那句话？');
      const item = parseApiObject(raw);
      if (!item?.note || !item?.reason) throw new Error('没有返回具体缘由，请重试');
      state.relationshipReview = { id:uid('thought'), note:String(item.note).trim(), reason:String(item.reason).trim(), source, createdAt:Date.now(), saved:false };
      save();
    } catch (error) { window.alert(`读取心里话失败：${error.message}`); }
    finally { apiBusy = false; render(); }
  }
  async function continueCouplePlay() { const input = app.querySelector('#couplePlayInput')?.value.trim(); if (!input || !state.play?.title) return; const { role } = current(); const history = Array.isArray(state.play.turns) ? state.play.turns.slice(-8) : []; apiBusy = true; render(); try { const raw = await requestCoupleAI(`你正在和用户进行情侣空间里的“心动频道”，并以角色“${roleName(role)}”本人参与。根据用户输入推进原本的机制，适时给出角色自己的答案、判断或揭晓内容，不要只评价用户。所有后续必须仅靠页面文字完成，严禁要求见面、出门、拍照、通话、购买或执行现实任务。每回合回复 2—4 句并给出下一步文字提示。只输出 JSON：{"reply":"角色本回合的实际参与和回应","nextPrompt":"下一步只需文字完成的提示","progress":"当前回合或揭晓阶段"}。\n\n${coupleContext()}`, `频道名称：${state.play.title}\n频道规则：${state.play.intro}\n上一条提示：${state.play.prompt}\n历史回合：${JSON.stringify(history)}\n用户刚刚说：${input}`); const item = parseApiObject(raw) || {}; state.play.turns.push({ speaker:'user', text:input, at:Date.now() }, { speaker:'role', text:String(item.reply || raw), at:Date.now() }); state.play.prompt = String(item.nextPrompt || '继续用文字告诉我你的答案。'); state.play.progress = String(item.progress || `第 ${Math.ceil(state.play.turns.length / 2) + 1} 回合`); save(); } catch (error) { window.alert(`频道回应失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateCouplePlan() { const { role } = current(); apiBusy = true; render(); try { const raw = await requestCoupleAI(`你就是恋人“${roleName(role)}”。请只为你们下一次约会提出三个不同的地点。地点必须符合角色设定与双方关系，地点名要直接、短、像现实中会说的地名，例如“市立美术馆”“植物园”“旧书市场”，前面禁止添加安静、浪漫、治愈、小众、适合约会等形容词。每个地点写一段具体介绍，说明这里有什么、你们能怎样相处，不要写成宣传文案。此轮不要生成玩法、步骤、安排或时间。只输出 JSON：{"ideas":[{"place":"直接地点名","intro":"地点介绍，40至80字"},{"place":"直接地点名","intro":"地点介绍，40至80字"},{"place":"直接地点名","intro":"地点介绍，40至80字"}]}。\n\n${coupleContext()}`, '给出三个直接的地点名。'); const item = parseApiObject(raw); if (!Array.isArray(item?.ideas) || item.ideas.length < 3) throw new Error('没有返回三个完整地点'); state.dateIdeas = item.ideas.slice(0,3).map(idea => ({ place:String(idea.place || '').replace(/^(安静的|浪漫的|治愈的|小众的|温馨的|适合约会的)/,'').trim() || '约会地点', intro:String(idea.intro || ''), activities:[] })); state.selectedDateIdea = -1; state.datePlaceConfirmed = false; state.aiPlan = ''; save(); } catch (error) { window.alert(`生成约会地点失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateDateActivities() { const selected = state.dateIdeas?.[state.selectedDateIdea]; const { role } = current(); if (!selected) return; apiBusy = true; render(); try { const raw = await requestCoupleAI(`你就是恋人“${roleName(role)}”。用户已经选定了约会地点“${selected.place}”。现在只为这个地点安排三种具体、可选择的约会玩法。玩法必须真的能在这个地点完成，体现角色身份、习惯和你们的关系；不要重复地点介绍，不要写成“第一步、第二步、第三步”，每项都要像一个自然的选择。每项提供 1—180 分钟预计时长。只输出 JSON：{"activities":[{"name":"玩法名","detail":"具体怎么度过，30至70字","durationMinutes":数字},{"name":"玩法名","detail":"具体怎么度过，30至70字","durationMinutes":数字},{"name":"玩法名","detail":"具体怎么度过，30至70字","durationMinutes":数字}]}。\n\n${coupleContext()}`, `已选地点：${selected.place}\n地点介绍：${selected.intro}\n请给出三个互不重复的具体选择。`); const item = parseApiObject(raw); if (!Array.isArray(item?.activities) || item.activities.length < 3) throw new Error('没有返回完整的具体安排'); selected.activities = item.activities.slice(0,3).map(activity => ({ name:String(activity.name || '一起逛逛'), detail:String(activity.detail || ''), durationMinutes:Math.max(1,Math.min(180,Number(activity.durationMinutes) || 60)) })); state.datePlaceConfirmed = true; save(); } catch (error) { window.alert(`生成具体安排失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateRoleEvent() { const { role, profile } = current(); const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) return window.alert('请先在设置中为情侣空间配置 API 模型。'); apiBusy = true; render(); try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.8, messages:[{ role:'system', content:`你正在扮演角色“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}\n用户设定：${profile?.persona || '暂无'}` }, { role:'user', content:'请为你们的情侣空间主动想一个值得记录的纪念日。只返回 JSON：{"title":"纪念日名称","date":"YYYY-MM-DD"}。日期必须是有效日期。' }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim(); const item = JSON.parse(raw); if (!item.title || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) throw new Error('API 返回的日期格式不正确'); state.events.unshift({ id: uid('event'), title: item.title, date: item.date, createdAt:Date.now(), author: 'role', authorId: role?.id || '' }); save(); } catch (error) { window.alert(`角色添加纪念日失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateWishResponse(stage, wish) { const { role, profile } = current(); const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) return window.alert('请先在设置中为情侣空间配置 API 模型。'); apiBusy = true; render(); const prompt = stage === 'created' ? `用户刚刚添加了一个共同愿望：“${wish.text}”。请以角色身份回应这份愿望，表现出真实态度或具体计划，回复 1—2 句。` : `用户刚刚完成了共同愿望：“${wish.text}”。请以角色身份写一句有纪念感的回应，回复 1—2 句。`; try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.85, messages:[{ role:'system', content:`你正在扮演角色“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}\n用户设定：${profile?.persona || '暂无'}\n不要解释自己是 AI。` }, { role:'user', content:prompt }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const text = String(data.choices?.[0]?.message?.content || '').replace(/^['“”"\s]+|['“”"\s]+$/g, '').trim(); if (!text) throw new Error('API 没有返回内容'); state.wishReplies ||= {}; state.wishReplies[wish.id] = text; save(); } catch (error) { window.alert(`角色回应愿望失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateLetterReply(letterId = openLetterId) { const letter = state.letters.find(item => item.id === letterId); const { role, profile } = current(); if (!letter) return; const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) return window.alert('请先在设置中为情侣空间配置 API 模型。'); apiBusy = true; render(); try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.85, messages:[{ role:'system', content:`你正在扮演角色“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}\n用户设定：${profile?.persona || '暂无'}\n不要解释自己是 AI。` }, { role:'user', content:`用户刚刚在情侣空间给你留了一句话。标题：${letter.title}\n内容：${letter.text}\n请像恋人看到留言后一样直接、自然地回应，必须针对具体内容，不要写成正式书信，控制在 1—3 句。` }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const text = String(data.choices?.[0]?.message?.content || '').replace(/^['“”"\s]+|['“”"\s]+$/g, '').trim(); if (!text) throw new Error('API 没有返回内容'); state.letterReplies ||= {}; state.letterReplies[letter.id] = text; save(); } catch (error) { window.alert(`角色回应失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generateRoleResponse(type, choice) { const { role, profile } = current(); const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) { window.alert('请先在设置中为情侣空间配置 API 模型。'); return; } apiBusy = true; render(); const prompt = type === 'mood' ? `用户刚刚选择了今日心情：“${choice}”。请以角色“${roleName(role)}”的身份自然回应用户，结合角色设定和用户设定，回复 1—2 句，不要解释自己是 AI。` : `用户刚刚对你发起了“${choice}”互动。请以角色“${roleName(role)}”的身份自然回应，结合角色设定和用户设定，回复 1—2 句，不要解释自己是 AI。`; try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.85, messages:[{ role:'system', content:`你正在扮演角色“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}\n用户设定：${profile?.persona || profile?.details || '暂无'}` }, { role:'user', content:prompt }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const text = String(data.choices?.[0]?.message?.content || '').replace(/^['“”"\s]+|['“”"\s]+$/g, '').trim(); if (!text) throw new Error('API 没有返回内容'); if (type === 'mood') state.moodReply = text; else state.interactionReply = text; save(); } catch (error) { window.alert(`角色回应失败：${error.message}`); } finally { apiBusy = false; render(); } }
  async function generatePageResponse(type) { const { role, profile } = current(); const config = window.IdealMachineAPI?.getConfig?.(); const model = window.IdealMachineAPI?.getModel?.('couple'); if (!config?.endpoint || !config.key || !model) return window.alert('请先在设置中为情侣空间配置 API 模型。'); const content = type === 'calendar' ? state.events.map(item => `${item.title}（${item.date}）`).join('、') || '还没有纪念日' : type === 'memories' ? state.memories.map(item => item.title).join('、') || '还没有回忆' : type === 'wishes' ? state.wishes.map(item => item.text).join('、') || '还没有共同愿望' : state.letters.map(item => item.text).join('、') || '还没有信件'; apiBusy = true; render(); try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.85, messages:[{ role:'system', content:`你正在扮演角色“${roleName(role)}”。角色设定：${role?.details || role?.signature || '暂无'}\n用户设定：${profile?.persona || profile?.details || '暂无'}` }, { role:'user', content:`这是情侣空间的${type === 'calendar' ? '共同日历' : type === 'memories' ? '回忆相册' : type === 'wishes' ? '共同愿望' : '情侣信箱'}内容：${content}\n请以角色身份自然回应 1—2 句，不要解释自己是 AI。` }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const text = String(data.choices?.[0]?.message?.content || '').replace(/^['“”"\s]+|['“”"\s]+$/g, '').trim(); if (!text) throw new Error('API 没有返回内容'); state.roleNotes[type] = text; save(); } catch (error) { window.alert(`角色回应失败：${error.message}`); } finally { apiBusy = false; render(); } }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="qinglvkongjian"]')) { store = read(); state = emptySpace(); roleSelectionOpen = true; app.classList.add('is-open'); tab = 'today'; chapterOpen = false; flowerRouletteOpen = false; mysteryOpen = false; mysteryCaseId = ''; mysteryView = 'case'; resetFlowerRouletteRound(); render(); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-mystery-open]')) { mysteryOpen = true; mysteryCaseId = ''; mysteryView = 'case'; mysteryClueId = ''; mysteryChoice = -1; mysteryFeedback = ''; mysteryGenerateError = ''; mysteryFreeDraft = ''; render(); return; }
    if (event.target.closest('[data-mystery-close]')) { mysteryOpen = false; mysteryCaseId = ''; mysteryRequest += 1; mysteryBusy = false; render(); return; }
    if (event.target.closest('[data-mystery-back]')) { mysteryCaseId = ''; mysteryView = 'case'; mysteryClueId = ''; mysteryChoice = -1; mysteryFeedback = ''; mysteryRequest += 1; mysteryBusy = false; render(); return; }
    if (event.target.closest('[data-mystery-generate],[data-mystery-generate-retry]')) { generateMysteryCase(); return; }
    const pickedCase = event.target.closest('[data-mystery-case]'); if (pickedCase) {
      const list = pickedCase.closest('.couple-mystery-case-list');
      if (!list || list.classList.contains('is-opening')) return;
      const selectedRoleId = store.contactId;
      list.classList.add('is-opening');
      pickedCase.classList.add('is-unrolling');
      pickedCase.setAttribute('aria-busy', 'true');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => pickedCase.isConnected && pickedCase.scrollIntoView({ behavior:reducedMotion ? 'instant' : 'smooth', block:'nearest', inline:'center' }), 250);
      window.setTimeout(() => {
        if (!mysteryOpen || !pickedCase.isConnected || store.contactId !== selectedRoleId) return;
        mysteryCaseId = pickedCase.dataset.mysteryCase; mysteryView = mysteryProgress(mysteryCaseId).activeView || 'case'; mysteryClueId = ''; mysteryChoice = -1; mysteryFeedback = ''; render();
      }, reducedMotion ? 0 : 260);
      return;
    }
    const mysteryViewButton = event.target.closest('[data-mystery-view]'); if (mysteryViewButton) { mysteryView = mysteryViewButton.dataset.mysteryView; const activeCase = mysteryCaseList().find(item => item.id === mysteryCaseId); if (activeCase) { const progress = mysteryProgress(activeCase.id); progress.activeView = mysteryView; state.mysteryCases[activeCase.id] = progress; save(); } mysteryChoice = -1; mysteryFeedback = ''; render(); return; }
    if (event.target.closest('[data-mystery-start-investigate]')) { const activeCase = mysteryCaseList().find(item => item.id === mysteryCaseId); if (activeCase) { const progress = mysteryProgress(activeCase.id); progress.introRead = true; progress.activeView = 'investigate'; state.mysteryCases[activeCase.id] = progress; save(); } mysteryView = 'investigate'; mysteryFeedback = ''; render(); return; }
    const investigationButton = event.target.closest('[data-mystery-investigation]'); if (investigationButton) { const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId); const investigation = caseFile?.investigations.find(item => item.id === investigationButton.dataset.mysteryInvestigation); if (!caseFile || !investigation) return; const progress = mysteryProgress(caseFile.id); if (progress.investigated.includes(investigation.id) || !investigation.requirements.every(id => progress.clueIds.includes(id))) return; progress.investigated.push(investigation.id); progress.unlockedInvestigations = [...new Set([...(progress.unlockedInvestigations || []), investigation.id, ...(investigation.unlockInvestigations || [])])]; investigation.obtainedClues.forEach(id => { if (!progress.clueIds.includes(id)) progress.clueIds.push(id); }); state.mysteryCases[caseFile.id] = progress; mysteryFeedback = `已完成调查：${investigation.title}`; save(); render(); return; }
    if (event.target.closest('[data-mystery-free-investigate]')) { mysteryFreeInvestigate(); return; }
    const reasonButton = event.target.closest('[data-mystery-reason]'); if (reasonButton) { mysteryChoice = Number(reasonButton.dataset.mysteryReason); mysteryFeedback = ''; render(); return; }
    if (event.target.closest('[data-mystery-reason-submit]')) { const caseFile = mysteryCaseList().find(item => item.id === mysteryCaseId); const progress = caseFile ? mysteryProgress(caseFile.id) : null; const index = caseFile ? caseFile.reasoningQuestions.findIndex(item => !Object.prototype.hasOwnProperty.call(progress.reasoning, item.id)) : -1; const question = index >= 0 ? caseFile.reasoningQuestions[index] : null; if (!caseFile || !progress || !question || mysteryChoice < 0) return; progress.attempts.push({ question:question.id, answer:mysteryChoice, at:Date.now() }); if (mysteryChoice === question.answer) { progress.reasoning[question.id] = mysteryChoice; mysteryChoice = -1; mysteryFeedback = index === caseFile.reasoningQuestions.length - 1 ? '' : '这一层推理成立，继续往下还原。'; if (index === caseFile.reasoningQuestions.length - 1) { progress.solved = true; progress.archived = true; progress.status = 'archived'; } } else mysteryFeedback = `案中尚有疑点：${question.hint}`; state.mysteryCases[caseFile.id] = progress; save(); render(); return; }
    const pickedClue = event.target.closest('[data-mystery-clue]'); if (pickedClue) { const caseFile = mysteryCases.find(item => item.id === mysteryCaseId); const index = Number(pickedClue.dataset.mysteryClue); if (!caseFile || !Number.isInteger(index) || index < 0 || index >= mysteryClues(caseFile).length) return; mysteryClueId = String(index); const progress = mysteryProgress(caseFile.id); progress.viewed = Array.isArray(progress.viewed) ? progress.viewed : []; if (!progress.viewed.includes(index)) progress.viewed.push(index); state.mysteryCases[caseFile.id] = progress; save(); render(); return; }
    const mysteryInput = event.target.closest('[data-mystery-input]'); if (mysteryInput) return;
    if (event.target.closest('[data-mystery-talk]')) { mysteryTalk(); return; }
    const puzzleChoice = event.target.closest('[data-mystery-contradiction],[data-mystery-order],[data-mystery-answer]');
    if (puzzleChoice) { const caseFile = mysteryCases.find(item => item.id === mysteryCaseId); if (!caseFile) return; const progress = mysteryProgress(caseFile.id); const puzzle = legacyMysteryPuzzles[caseFile.id]; const index = Number(puzzleChoice.dataset.mysteryContradiction ?? puzzleChoice.dataset.mysteryOrder ?? puzzleChoice.dataset.mysteryAnswer); if (!Number.isInteger(index)) return; if (puzzleChoice.hasAttribute('data-mystery-contradiction')) { if (progress.viewed?.length < mysteryClues(caseFile).length || progress.contradictionDone) return; if (index === puzzle.contradiction.answer) { progress.contradictionDone = true; mysteryChoice = -1; mysteryFeedback = ''; } else mysteryFeedback = '这两条证据还不足以证明关键矛盾，再核对人物和时间。'; } else if (puzzleChoice.hasAttribute('data-mystery-order')) { if (!progress.contradictionDone || progress.orderDone) return; if (index === puzzle.order.answer) { progress.orderDone = true; mysteryChoice = -1; mysteryFeedback = ''; } else mysteryFeedback = puzzle.order.hint; } else { if (!progress.orderDone) return; mysteryChoice = index; mysteryFeedback = ''; } state.mysteryCases[caseFile.id] = progress; save(); render(); return; }
    if (event.target.closest('[data-mystery-submit]')) { const caseFile = mysteryCases.find(item => item.id === mysteryCaseId); if (!caseFile || mysteryChoice < 0 || !mysteryProgress(caseFile.id).orderDone) return; const progress = mysteryProgress(caseFile.id); progress.attempts = (Number(progress.attempts) || 0) + 1; if (mysteryChoice === caseFile.answer) { progress.solved = true; mysteryFeedback = ''; } else mysteryFeedback = `还差一步：${caseFile.hint}`; state.mysteryCases[caseFile.id] = progress; save(); render(); return; }
    if (event.target.closest('[data-stock-open]')) { stockGameState = null; stockGameNotice = ''; stockGameOpen = true; render(); return; }
    if (event.target.closest('[data-stock-close]')) { stockGameOpen = false; stockGameState = null; stockGameNotice = ''; render(); return; }
    if (event.target.closest('[data-stock-start]')) { stockGameState = stockMakeGame(); stockGameNotice = ''; render(); return; }
    if (event.target.closest('[data-stock-restart]')) { stockGameState = stockMakeGame(); stockGameNotice = ''; render(); return; }
    if (event.target.closest('[data-stock-refill]')) { stockRefill(); return; }
    const stockItem = event.target.closest('[data-stock-item]'); if (stockItem) { stockCollect(Number(stockItem.dataset.stockItem)); return; }
    if (event.target.closest('[data-flower-roulette-open]')) { flowerRouletteOpen = true; resetFlowerRouletteRound(); render(); return; }
    if (event.target.closest('[data-flower-roulette-close]')) { flowerRouletteOpen = false; resetFlowerRouletteRound(); render(); return; }
    if (event.target.closest('[data-flower-start]')) { startFlowerRouletteGame(); return; }
    if (event.target.closest('[data-flower-restart]')) { resetFlowerRouletteRound(); startFlowerRouletteGame(); return; }
    if (event.target.closest('[data-flower-retry]')) { chooseFlowerRouletteRole(); return; }
    const flowerAction = event.target.closest('[data-flower-action]'); if (flowerAction) { chooseFlowerRouletteAction(flowerAction.dataset.flowerAction); return; }
    if (event.target.closest('[data-flower-probe]')) { testFlowerRouletteRole(); return; }
    if (event.target.closest('[data-couple-close]')) { flowerRouletteOpen = false; mysteryOpen = false; stockGameOpen = false; stockGameState = null; stockGameNotice = ''; resetFlowerRouletteRound(); app.classList.remove('is-open'); return; }
    if (event.target.closest('[data-couple-paper-close]')) { const paper = app.querySelector('.couple-paper-overlay'); if (paper) { paper.classList.add('is-closing'); window.setTimeout(() => paper.remove(), 280); } return; }
    const pieceCard = event.target.closest('[data-couple-piece]'); if (pieceCard) { const type = pieceCard.dataset.couplePiece; const id = pieceCard.dataset.couplePieceId; const item = type === 'thought' ? state.relationshipReviewHistory?.find(entry => entry.id === id) : state.memories.find(entry => entry.id === id); if (!item) return; app.querySelector('.couple-paper-overlay')?.remove(); app.querySelector('.couple-page').insertAdjacentHTML('beforeend', memoryPaperMarkup(type, item)); const overlay = app.querySelector('.couple-paper-overlay'); requestAnimationFrame(() => { if (overlay?.isConnected) animateMemoryPaper(overlay); }); return; }
    if (event.target.closest('[data-couple-home]')) { tab = 'today'; render(); return; }
    const tabButton = event.target.closest('[data-couple-tab]'); if (tabButton) { tab = tabButton.dataset.coupleTab === 'wishes' ? 'games' : tabButton.dataset.coupleTab; render(); return; }
    if (event.target.closest('[data-couple-role-picker]')) { app.querySelector('.couple-page').insertAdjacentHTML('beforeend', rolePicker()); return; }
    const role = event.target.closest('[data-couple-role]'); if (role) { activateRole(role.dataset.coupleRole); save(); roleSelectionOpen = false; mysteryOpen = false; mysteryCaseId = ''; app.querySelector('.couple-role-sheet')?.remove(); render(); return; }
    if (event.target.closest('[data-couple-role-close]')) { if (roleSelectionOpen) { roleSelectionOpen = false; app.classList.remove('is-open'); } else app.querySelector('.couple-role-sheet')?.remove(); return; }
    if (event.target.closest('.couple-wish-archive-box summary')) { wishArchiveOpen = !wishArchiveOpen; return; }
    if (event.target.closest('[data-couple-letter-close]')) { openLetterId = ''; render(); return; }
    const letter = event.target.closest('[data-couple-letter]'); if (letter) { if (Date.now() < wishSwipeLockUntil) return; const pickedIndex = Number(letter.dataset.coupleWishIndex); if (Number.isInteger(pickedIndex) && pickedIndex !== wishIndex) { wishIndex = pickedIndex; render(); return; } const letterId = letter.dataset.coupleLetter; if (letter.matches('[data-couple-bless]')) { letter.classList.remove('is-blessing'); void letter.offsetWidth; letter.classList.add('is-blessing'); for (let index = 0; index < 7; index += 1) { const spark = document.createElement('em'); spark.className = 'couple-bless-spark'; spark.style.setProperty('--spark-x', `${(index - 3) * 13}px`); spark.style.setProperty('--spark-delay', `${index * 35}ms`); letter.appendChild(spark); } window.setTimeout(() => { openLetterId = letterId; render(); }, 260); } else { openLetterId = letterId; render(); } return; }
    if (event.target.closest('[data-couple-letter-reply]')) { generateLetterReply(); return; }
    const archiveFolder = event.target.closest('[data-couple-date-folder]'); if (archiveFolder) { archiveSelectedIndex = Number(archiveFolder.dataset.coupleDateFolder); render(); return; }
    const action = event.target.closest('[data-couple-action]'); if (action) { tab = action.dataset.coupleAction === 'mood' ? 'mood' : 'interaction'; render(); return; }
    const mood = event.target.closest('[data-couple-mood]'); if (mood) { state.moods.user = mood.dataset.coupleMood; save(); generateRoleResponse('mood', state.moods.user); return; }
    const interaction = event.target.closest('[data-couple-interaction]'); if (interaction) { state.interaction = interaction.dataset.coupleInteraction; save(); generateRoleResponse('interaction', state.interaction); return; }
    const checkin = event.target.closest('[data-couple-checkin]'); if (checkin) { const key = todayKey(); state.checkins ||= {}; if (!state.checkins[key]) { state.checkins[key] = { at:Date.now() }; save(); render(); } return; }
    if (event.target.closest('[data-couple-moment]')) { generateDailyMoment(); return; }
    if (event.target.closest('[data-couple-exchange]')) { generateItemExchange(); return; }
    if (event.target.closest('[data-couple-exchange-again]')) { state.exchange = null; save(); render(); return; }
    if (event.target.closest('[data-couple-open-chapter]')) { chapterOpen = true; render(); requestAnimationFrame(() => app.querySelector('.couple-day-stream')?.scrollIntoView({ behavior:'smooth', block:'start' })); return; }
    if (event.target.closest('[data-couple-date-talk]')) { generateCouplePlan(); return; }
    const dateIdea = event.target.closest('[data-couple-date-idea]'); if (dateIdea) { const nextIndex = Number(dateIdea.dataset.coupleDateIdea); if (nextIndex !== state.selectedDateIdea) state.datePlaceConfirmed = false; state.selectedDateIdea = nextIndex; save(); render(); return; }
    if (event.target.closest('[data-couple-date-confirm-place]')) { generateDateActivities(); return; }
    const dateActivity = event.target.closest('[data-couple-date-activity]'); if (dateActivity) { const place = state.dateIdeas?.[state.selectedDateIdea]; const activity = place?.activities?.[Number(dateActivity.dataset.coupleDateActivity)]; if (!place || !activity) return; const startAt = Date.now(); state.dateSession = { place:place.place, activity:activity.name, detail:activity.detail, durationMinutes:activity.durationMinutes, startAt, endAt:startAt + activity.durationMinutes * 60000 }; state.dateIdeas = []; state.selectedDateIdea = -1; save(); render(); return; }
    if (event.target.closest('[data-couple-date-finish]')) { finishDateSession(); return; }
    if (event.target.closest('[data-couple-date-save]')) { const item = state.dateIdeas?.[state.selectedDateIdea]; const when = app.querySelector('#coupleDateIdeaDate')?.value; if (!item) return; if (!/^\d{4}-\d{2}-\d{2}$/.test(when || '')) return window.alert('请选择约会日期。'); const dateId = uid('date'); const savedDate = { id:dateId, title:item.title, detail:item.detail, date:when, author:'role', kind:'date', createdAt:Date.now(), contactId:current().role?.id || '' }; state.dates.unshift(savedDate); state.events.unshift(savedDate); state.dateIdeas = []; state.selectedDateIdea = -1; save(true); render(); return; }
    if (event.target.closest('[data-couple-keep-review]')) { const review = state.relationshipReview; if (review?.note && !review.saved) { review.saved = true; review.id ||= uid('thought'); state.relationshipReviewHistory ||= []; state.relationshipReviewHistory.unshift({ ...review }); save(); render(); } return; }
    if (event.target.closest('[data-couple-review]')) { generateRelationshipReview(); return; }
    if (event.target.closest('[data-couple-play-start]')) { startCouplePlay(); return; }
    if (event.target.closest('[data-couple-play-send]')) { continueCouplePlay(); return; }
    const planButton = event.target.closest('[data-couple-ai-plan]'); if (planButton) { if (!planButton.closest('.couple-ai-plan-card')) { tab = 'wishes'; render(); return; } generateCouplePlan(); return; }
    const roleResponse = event.target.closest('[data-couple-role-response]'); if (roleResponse) { generatePageResponse(roleResponse.dataset.coupleRoleResponse); return; }
    if (event.target.closest('[data-couple-role-add-event]')) { generateRoleEvent(); return; }
    if (event.target.closest('[data-couple-add-event]')) { recordType = 'event'; render(); return; }
    if (event.target.closest('[data-couple-add-date]')) { recordType = 'date'; render(); return; }
    if (event.target.closest('[data-couple-add-memory]')) { recordType = 'memory'; render(); return; }
    if (event.target.closest('[data-couple-add-wish]')) { recordType = 'wish'; render(); return; }
    if (event.target.closest('[data-couple-add-letter]')) { recordType = 'letter'; render(); return; }
    if (event.target.closest('[data-couple-record-close]')) { recordType = ''; render(); return; }
    if (event.target.closest('[data-couple-record-save]')) { const first = app.querySelector('#coupleRecordFirst')?.value.trim(); const second = app.querySelector('#coupleRecordSecond')?.value.trim(); if (!first || !second) return window.alert('请填写完整内容。'); const savingEvent = ['event','date'].includes(recordType); let newLetterId = ''; if (recordType === 'event') state.events.unshift({ id: uid('event'), title: first, date: second, author: 'user', createdAt:Date.now(), contactId: current().role?.id || '' }); if (recordType === 'date') { const dateId = uid('date'); const dateItem = { id:dateId, title:first, date:second, author:'user', kind:'date', createdAt:Date.now(), contactId:current().role?.id || '' }; state.dates.unshift(dateItem); state.events.unshift(dateItem); } if (recordType === 'memory') state.memories.unshift({ id: uid('memory'), title: first, text: second, image: '', date: date(), createdAt:Date.now() }); if (recordType === 'wish') state.wishes.unshift({ id: uid('wish'), text: first, note: second, done: false, createdAt:Date.now() }); if (recordType === 'letter') { newLetterId = uid('letter'); state.letters.unshift({ id:newLetterId, title:first, text:second, date:date(), createdAt:Date.now() }); } recordType = ''; save(savingEvent); render(); if (newLetterId) generateLetterReply(newLetterId); return; }
    const wish = event.target.closest('[data-couple-toggle-wish]'); if (wish) { const item = state.wishes.find(entry => entry.id === wish.dataset.coupleToggleWish); if (item) { item.done = !item.done; save(); render(); } return; }
    const delEvent = event.target.closest('[data-couple-delete-event]'); if (delEvent) { state.events = state.events.filter(item => item.id !== delEvent.dataset.coupleDeleteEvent); save(true); render(); return; }
    if (event.target.closest('[data-couple-save-answer]')) { const question = dailyQuestion(); const value = app.querySelector('#coupleAnswer')?.value.trim(); if (value) { state.answers[question] = value; state.roleAnswers ||= {}; state.roleAnswers[question] = `我看到你的回答了。${value.length > 12 ? '你的想法我会好好记住。' : '我也这样想。'} 下次我们一起去实现，好吗？`; save(); render(); } return; }
  });
  app.querySelector('.couple-hidden-file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return finishMemory(''); const read = window.IdealMachineReadImage ? window.IdealMachineReadImage(file, 900, .72) : new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); read.then(value => finishMemory(value)); event.target.value = ''; });
  app.addEventListener('input', event => { if (event.target.matches('[data-mystery-input]')) mysteryDraft = event.target.value; if (event.target.matches('[data-mystery-free-input]')) mysteryFreeDraft = event.target.value; });
  app.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('[data-mystery-input]')) { event.preventDefault(); mysteryTalk(); } if (event.key === 'Enter' && event.target.matches('[data-mystery-free-input]')) { event.preventDefault(); mysteryFreeInvestigate(); } });
  window.setInterval(() => { if (!app.classList.contains('is-open') || tab !== 'dates' || !state.dateSession || apiBusy) return; if (Date.now() >= state.dateSession.endAt) finishDateSession(); else render(); }, 30000);
  window.addEventListener('ideal-machine-role-deleted', event => { const roleId = event.detail?.roleId; if (!roleId) return; delete store.spaces[roleId]; if (store.contactId === roleId) store.contactId = ''; if (app.classList.contains('is-open')) render(); });
  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.qinglvkongjian = { name: '情侣空间' };
})();
