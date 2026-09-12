(() => {
  const apps = window.IdealMachineApps = window.IdealMachineApps || {};
  const feedKey = 'ideal-machine-forum';
  const discoverKey = 'ideal-machine-forum-discover';
  const noticeKey = 'ideal-machine-forum-notices';
  const profileKey = 'ideal-machine-forum-profile';
  const settingsKey = 'ideal-machine-forum-settings';
  let activeTab = 'home';
  let refreshBusy = false;
  let interactionBusy = false;
  let discoverBusy = false;
  let discoverFilter = 'all';
  let discoverQuery = '';
  let commentTargetId = '';
  const app = document.createElement('div');
  app.className = 'forum-app';
  app.innerHTML = '<div class="forum-page"><header class="forum-header"><div class="forum-brand"><span>FORUM</span><h1>论坛</h1></div><div class="forum-header-actions"><button class="forum-refresh" type="button" data-forum-refresh aria-label="刷新论坛动态"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 18a15 15 0 0 0-26-4L8 18M10 30a15 15 0 0 0 26 4l4-4"/><path d="M8 11v7h7M40 37v-7h-7"/></svg></button><button type="button" data-forum-profile aria-label="论坛账号设置"></button><button type="button" data-forum-close aria-label="关闭论坛">×</button></div></header><main class="forum-main"><section class="forum-feed" data-forum-feed></section></main><nav class="forum-tabs" aria-label="论坛导航"><button class="is-active" type="button" data-forum-tab="home"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="m8 22 16-13 16 13v17H29V28h-10v11H8z"/></svg><small>首页</small></button><button type="button" data-forum-tab="search"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="11"/><path d="m30 30 10 10"/></svg><small>发现</small></button><button class="forum-tab-compose" type="button" data-forum-compose aria-label="发帖"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 10v28M10 24h28"/></svg></button><button type="button" data-forum-tab="notice"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 34h24l-3-5V20a9 9 0 0 0-18 0v9zM20 39h8"/></svg><small>通知</small></button><button type="button" data-forum-tab="profile"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="7"/><path d="M11 39c1-8 5-12 13-12s12 4 13 12"/></svg><small>我的</small></button></nav></div><div class="forum-compose-sheet" data-forum-compose-sheet aria-hidden="true"></div><div class="forum-profile-sheet" data-forum-profile-sheet aria-hidden="true"></div>';
  document.body.appendChild(app);
  const customFontStyle = document.createElement('style');
  customFontStyle.dataset.forumCustomFont = '';
  document.head.appendChild(customFontStyle);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const uid = prefix => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getProfile = () => { const value = read(profileKey, {}); return { nickname: value.nickname || '论坛用户', avatar: value.avatar || '', voiceStyle: value.voiceStyle || '', allowedRoles: Array.isArray(value.allowedRoles) ? value.allowedRoles : [] }; };
  const getPosts = () => { const value = read(feedKey, []); return Array.isArray(value) ? value : []; };
  const getNotices = () => { const value = read(noticeKey, []); return Array.isArray(value) ? value : []; };
  const addNotice = notice => { const list = getNotices(); list.unshift({ id: uid('forum-notice'), time: now(), read: false, ...notice }); save(noticeKey, list.slice(0, 100)); };
  const canDeletePost = post => post?.owner === getProfile().nickname && (post.ownerType === 'user' || !post.ownerType);
  const getRoles = () => { const value = read('ideal-machine-chat', {}); return Array.isArray(value.contacts) ? value.contacts : []; };
  const getBoundProfile = role => { const value = read('ideal-machine-chat', {}); const profileId = value.chats?.[role?.id]?.profileId || ''; return (Array.isArray(value.profiles) ? value.profiles : []).find(item => item.id === profileId) || {}; };
  const roleUserContext = role => window.IdealMachineRoleUserContext ? window.IdealMachineRoleUserContext(role || {}, getBoundProfile(role)) : `角色本人资料：${role?.details || role?.signature || '未填写（未知，不得推测）'}\n绑定用户资料：${getBoundProfile(role)?.persona || '未填写（未知，不得推测）'}`;
  const avatar = (source, name = '论') => source ? '<img src="' + esc(source) + '" alt="头像">' : '<span>' + esc(String(name).slice(0, 1)) + '</span>';
  const forumIcon = type => { const paths = { reply: '<path d="M9 11h30v19H20l-9 7v-7H9z"/><path d="M16 17h16M16 23h10"/>', repost: '<path d="M12 17h25l-5-5M36 31H11l5 5"/>', like: '<path d="M24 38S8 28 8 17a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-14 21-14 21z"/>', share: '<path d="m10 24 27-14-8 28-7-12zM10 24l12 2"/>' }; return '<svg class="forum-post-icon" viewBox="0 0 48 48" aria-hidden="true">' + (paths[type] || '') + '</svg>'; };
  function forumApi() {
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('forum') || window.IdealMachineAPI?.getModel?.('chat');
    const endpoint = String(config.endpoint || '').trim().replace(/\/+$/, '');
    const url = /\/chat\/completions$/i.test(endpoint) ? endpoint : endpoint + '/chat/completions';
    const headers = { 'Content-Type': 'application/json' };
    if (config.key) headers.Authorization = 'Bearer ' + config.key;
    return { config, model, endpoint, url, headers };
  }
  async function forumError(response) {
    const detail = await response.text().catch(() => '');
    let message = detail;
    try { const payload = JSON.parse(detail); message = payload.error?.message || payload.message || detail; } catch {}
    return `HTTP ${response.status}${message ? `：${String(message).slice(0, 180)}` : ''}`;
  }
  async function forumRequest(url, options, scope = 'forum') {
    const request = window.IdealMachineFetch || window.fetch.bind(window);
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { return await request(url, { ...options, idealScope:scope, timeout:120000 }); }
      catch (error) { lastError = error; if (error?.name === 'AbortError' || error?.name === 'TimeoutError' || attempt > 0) break; }
    }
    if (lastError?.name === 'TimeoutError') throw new Error('接口在 120 秒内没有响应');
    if (lastError?.name === 'AbortError') throw new Error('互动请求已取消');
    if (/failed to fetch|networkerror|load failed/i.test(String(lastError?.message || ''))) throw new Error('网络请求未能到达 API。请确认接口支持浏览器跨域访问（CORS），或稍后重试');
    throw lastError;
  }

  function defaultDiscoverTopics(posts) {
    const topics = [];
    if (posts.length) topics.push({ name: '正在发生', desc: '看看论坛里刚刚出现的新动态。' });
    if (getRoles().length) topics.push({ name: '角色动态', desc: '角色们最近在讨论什么？' });
    if (getForumBooks().length) topics.push({ name: '世界书现场', desc: '围绕论坛世界书展开的讨论。' });
    topics.push({ name: '今日热议', desc: '大家正在参与的热门话题。' }, { name: '随手记录', desc: '一些值得被看见的日常想法。' });
    return topics;
  }
  function getDiscoverState(posts) { const value = read(discoverKey, {}); return { topics: Array.isArray(value.topics) && value.topics.length ? value.topics : defaultDiscoverTopics(posts), generatedAt: value.generatedAt || '' }; }
  function renderDiscover(feed, posts) {
    const state = getDiscoverState(posts);
    const profile = getProfile();
    const roles = getRoles().filter(role => profile.allowedRoles.includes(role.id));
    const filtered = posts.filter(post => {
      const query = discoverQuery.trim().toLowerCase();
      if (query && !(String(post.text || '').toLowerCase().includes(query) || String(post.nickname || '').toLowerCase().includes(query))) return false;
      if (discoverFilter === 'role') return post.ownerType === 'character';
      if (discoverFilter === 'mine') return post.ownerType === 'user' && post.owner === profile.nickname;
      return true;
    }).slice().sort((a, b) => discoverFilter === 'hot' ? (Number(b.likes || 0) + Number(b.comments || 0) * 2 + Number(b.reposts || 0)) - (Number(a.likes || 0) + Number(a.comments || 0) * 2 + Number(a.reposts || 0)) : 0);
    const topics = state.topics.slice(0, 6).map(topic => '<button type="button" data-forum-discover-topic="' + esc(topic.name) + '"><b># ' + esc(topic.name) + '</b><small>' + esc(topic.desc || '') + '</small></button>').join('');
    const roleStrip = roles.length ? roles.slice(0, 8).map(role => '<div class="forum-discover-role"><span>' + avatar(role.avatar, role.nickname || role.name) + '</span><b>' + esc(role.nickname || role.name || '角色') + '</b></div>').join('') : '<small class="forum-discover-muted">在论坛账号设置里选择角色后，这里会显示角色动态。</small>';
    feed.innerHTML = '<div class="forum-discover-page"><div class="forum-search-box"><input value="' + esc(discoverQuery) + '" placeholder="搜索动态、角色或话题…" data-forum-search-input><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="11"/><path d="m30 30 10 10"/></svg></div><section class="forum-discover-section forum-discover-top"><div class="forum-discover-section-head"><div><span class="forum-kicker">TRENDING NOW</span><h2>热门话题</h2></div><button type="button" data-forum-discover-refresh ' + (discoverBusy ? 'disabled' : '') + '>' + (discoverBusy ? '生成中…' : 'AI 推荐') + '</button></div><div class="forum-discover-topics">' + topics + '</div></section><section class="forum-discover-section"><div class="forum-discover-section-head"><div><span class="forum-kicker">PEOPLE TO WATCH</span><h2>角色正在讨论</h2></div></div><div class="forum-discover-roles">' + roleStrip + '</div></section><div class="forum-discover-filters">' + [['all', '全部'], ['hot', '热门'], ['role', '角色'], ['mine', '我的']].map(item => '<button type="button" data-forum-discover-filter="' + item[0] + '" class="' + (discoverFilter === item[0] ? 'is-active' : '') + '">' + item[1] + '</button>').join('') + '</div><section class="forum-discover-feed"><div class="forum-discover-feed-title"><span class="forum-kicker">FOR YOU</span><h2>推荐动态</h2></div>' + (filtered.length ? filtered.map(postHtml).join('') : '<div class="forum-empty"><div>⌕</div><h2>没有找到动态</h2><p>换一个关键词，或者先生成一组推荐话题。</p></div>') + '</section></div>';
    resolveStoredAvatars();
  }
  function renderNotice(feed) {
    const notices = getNotices();
    const filter = renderNotice.filter || 'all';
    const filtered = notices.filter(item => filter === 'all' || item.type === filter);
    const unread = notices.filter(item => !item.read).length;
    const rows = filtered.length ? filtered.map(item => '<button class="forum-notice-item ' + (item.read ? '' : 'is-unread') + '" type="button" data-forum-notice-post="' + esc(item.postId || '') + '" data-forum-notice-id="' + esc(item.id) + '"><span class="forum-notice-avatar">' + avatar(item.avatar, item.actor || '论') + '</span><span class="forum-notice-copy"><b>' + esc(item.title || '论坛通知') + '</b><small>' + esc(item.text || '') + '</small><time>' + esc(item.time || '') + '</time></span><i>›</i></button>').join('') : '<div class="forum-empty forum-notice-empty"><div>♡</div><h2>暂时没有通知</h2><p>有人点赞、回复或参与互动时，你会在这里看到。</p></div>';
    feed.innerHTML = '<div class="forum-notice-page">' + (unread ? '<div class="forum-notice-tools"><button type="button" data-forum-notice-read-all>全部已读</button></div>' : '') + '<div class="forum-notice-filters">' + [['all', '全部'], ['reply', '回复'], ['role', '角色动态'], ['system', '系统']].map(item => '<button type="button" data-forum-notice-filter="' + item[0] + '" class="' + (filter === item[0] ? 'is-active' : '') + '">' + item[1] + '</button>').join('') + '</div><div class="forum-notice-list">' + rows + '</div></div>';
    resolveStoredAvatars();
  }
  renderNotice.filter = 'all';

  function render() {
    const current = getProfile();
    const feed = app.querySelector('[data-forum-feed]');
    const brand = app.querySelector('.forum-brand');
    const headerProfile = app.querySelector('.forum-header-actions > [data-forum-profile]');
    const headerCopy = activeTab === 'search' ? ['EXPLORE', '发现'] : activeTab === 'notice' ? ['NOTIFICATIONS', '通知'] : activeTab === 'profile' ? ['ACCOUNT', '我的'] : ['FORUM', '论坛'];
    brand.innerHTML = '<span>' + headerCopy[0] + '</span><h1>' + headerCopy[1] + '</h1>';
    headerProfile.style.display = activeTab === 'home' ? 'grid' : 'none';
    app.querySelector('[data-forum-refresh]').style.display = activeTab === 'home' ? 'grid' : 'none';
    app.querySelector('[data-forum-profile]').innerHTML = '<span class="forum-header-avatar">' + avatar(current.avatar, current.nickname) + '</span>';
    app.querySelector('[data-forum-tab="notice"]')?.classList.toggle('has-unread', getNotices().some(item => !item.read));
    const posts = getPosts();
    if (activeTab === 'profile') { renderMePage(feed); return; }
    if (activeTab === 'search') { renderDiscover(feed, posts); return; }
    if (activeTab === 'notice') { renderNotice(feed); return; }
    feed.innerHTML = posts.length ? posts.map(postHtml).join('') : '<div class="forum-empty"><div>◌</div><h2>还没有动态</h2><p>发布第一条帖子，开始你的论坛时间线。</p></div>';
    resolveStoredAvatars();
  }

  function resolveStoredAvatars() { if (!window.IdealMachineGetImage) return; app.querySelectorAll('img[src^="idb:image:"]').forEach(image => window.IdealMachineGetImage(image.getAttribute('src')).then(value => { if (value) image.src = value; })); }
  function getForumSettings() { const value = read(settingsKey, {}); const legacyFonts = value.fontSource ? [{ id: 'legacy-font', name: value.fontName || '已导入字体', source: value.fontSource }] : []; const fontPackages = Array.isArray(value.fontPackages) ? value.fontPackages.filter(item => item?.id && item?.source) : legacyFonts; return { worldbookId: value.worldbookId || '', fontFamily: value.fontFamily || 'system', fontSize: Number(value.fontSize || 13), fontPackages, fontId: value.fontId || fontPackages[0]?.id || '' }; }
  function getForumBooks() { const value = read('ideal-machine-worldbooks', {}); return Array.isArray(value.forum) ? value.forum : []; }
  function npcIsDeceased(npc) {
    const text = [npc?.status, npc?.lifeStatus, npc?.identity, npc?.description, npc?.personality, npc?.motivation, npc?.reason, npc?.relationDescription, npc?.background].filter(Boolean).join(' ');
    const alive = /(仍然?健在|还活着|仍活着|存活|在世|生存|未去世|没有去世|并未去世|尚未死亡)/i.test(text);
    return !alive && /(已故|已死|去世|逝世|死去|死亡|身亡|亡故|阵亡|牺牲|亡者|死者|故人|死于|遗体|葬礼)/i.test(text);
  }
  function npcPersona(npc) {
    return { identity:npc?.identity || '', personality:npc?.personality || '', motivation:npc?.motivation || '', reason:npc?.reason || npc?.relationToRole || '', relationDescription:npc?.relationDescription || '', description:npc?.description || npc?.background || '', status:npc?.status || npc?.lifeStatus || '' };
  }
  function getForumNpcs(worldbook, roles = []) {
    const found = new Map();
    const add = npc => {
      const name = String(npc?.name || '').trim();
      if (!name || npcIsDeceased(npc) || roles.some(role => [role.name, role.nickname].includes(name))) return;
      const key = name.toLowerCase();
      const previous = found.get(key) || {};
      found.set(key, { ...previous, ...npc, id:npc?.id || previous.id || `npc-${key}`, name, identity:npc?.identity || previous.identity || 'NPC', avatar:npc?.avatar || previous.avatar || '' });
    };
    const analysis = worldbook?.id ? read('ideal-machine-worldbook-analyses', {})[worldbook.id] : null;
    (Array.isArray(analysis?.npcs) ? analysis.npcs : []).forEach(add);
    const cache = read('ideal-machine-ta-npcs', {});
    roles.forEach(role => (Array.isArray(cache[role.id]) ? cache[role.id] : []).filter(npc => !worldbook?.id || !npc.sourceBookId || npc.sourceBookId === worldbook.id).forEach(add));
    getPosts().filter(post => post.ownerType === 'npc').forEach(post => add({ id:post.ownerId, name:post.nickname, avatar:post.avatar, identity:'论坛 NPC', ...(post.actorProfile || {}) }));
    return [...found.values()];
  }
  function applyForumSettings() { const settings = getForumSettings(); const selectedFont = settings.fontPackages.find(item => item.id === settings.fontId) || settings.fontPackages[0]; const customSource = String(selectedFont?.source || '').replace(/["\\\r\n]/g, value => '\\' + value); customFontStyle.textContent = settings.fontFamily === 'custom' && customSource ? `@font-face{font-family:"IdealForumCustom";src:url("${customSource}")}` : ''; const font = settings.fontFamily === 'custom' && customSource ? "'IdealForumCustom', -apple-system, sans-serif" : settings.fontFamily === 'serif' ? "Georgia, 'Songti SC', serif" : settings.fontFamily === 'mono' ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"; app.style.setProperty('--forum-font-family', font); app.style.setProperty('--forum-font-size', `${Math.max(11, Math.min(24, settings.fontSize))}px`); }
  function renderMePage(feed) {
    const current = getProfile();
    const settings = getForumSettings();
    const books = getForumBooks();
    const roleCount = current.allowedRoles.length;
    feed.innerHTML = '<div class="forum-me-page"><section class="forum-home-card"><div class="forum-home-card-avatar">' + avatar(current.avatar, current.nickname) + '</div><span class="forum-kicker">PROFILE</span><h2>' + esc(current.nickname) + '</h2><p>论坛用户 · ' + roleCount + ' 位角色可参与</p><div class="forum-home-card-details"><b>说话方式</b><small>' + esc(current.voiceStyle || '暂未设置论坛说话方式') + '</small></div></section><div class="forum-inline-settings"><section><span class="forum-kicker">CONTENT RULES</span><h2>论坛世界书</h2><select data-forum-worldbook><option value="">不使用论坛世界书</option>' + books.map(book => '<option value="' + esc(book.id) + '" ' + (book.id === settings.worldbookId ? 'selected' : '') + '>' + esc(book.name) + '</option>').join('') + '</select></section><section><span class="forum-kicker">READING</span><h2>论坛字体</h2><label>字体<select data-forum-font-family><option value="system" ' + (settings.fontFamily === 'system' ? 'selected' : '') + '>系统默认</option><option value="serif" ' + (settings.fontFamily === 'serif' ? 'selected' : '') + '>衬线字体</option><option value="mono" ' + (settings.fontFamily === 'mono' ? 'selected' : '') + '>等宽字体</option>' + (settings.fontPackages.length ? '<option value="custom" ' + (settings.fontFamily === 'custom' ? 'selected' : '') + '>自定义字体</option>' : '') + '</select></label><label>字号（px）<input type="number" min="11" max="24" step="1" value="' + settings.fontSize + '" data-forum-font-size></label><label class="forum-font-file"><span>导入字体文件</span><input type="file" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" data-forum-font-file><b>导入新字体</b></label><small class="forum-font-hint">支持 WOFF、WOFF2、TTF、OTF；已保存 ' + settings.fontPackages.length + ' 个字体包</small><label>已导入字体<select data-forum-font-package><option value="">选择字体包</option>' + settings.fontPackages.map(item => '<option value="' + esc(item.id) + '" ' + (item.id === settings.fontId ? 'selected' : '') + '>' + esc(item.name || '未命名字体') + '</option>').join('') + '</select></label><div class="forum-font-actions"><button type="button" data-forum-font-use ' + (settings.fontPackages.length ? '' : 'disabled') + '>' + (settings.fontFamily === 'custom' ? '正在使用导入字体' : '使用导入字体') + '</button><button type="button" data-forum-font-reset>恢复原始字体</button></div></section></div></div>';
    resolveStoredAvatars();
  }

  async function refreshForumPosts() {
    if (refreshBusy) return;
    const profile = getProfile();
    const roles = getRoles().filter(role => profile.allowedRoles.includes(role.id));
    const { endpoint, url, headers, model } = forumApi();
    if (!endpoint || !model) return window.alert('论坛还没有可用模型：请在设置中拉取模型并至少保留一个模型。');
    const worldbook = getForumBooks().find(book => book.id === getForumSettings().worldbookId);
    const npcs = getForumNpcs(worldbook, roles);
    if (!roles.length && !npcs.length && !worldbook) return window.alert('请先选择可参与论坛的角色，或选择一本论坛世界书。');
    const rules = worldbook?.entries?.filter(entry => entry.enabled !== false).map(entry => `【${entry.name}】\n${entry.content}`).join('\n\n') || '未选择论坛世界书。';
    const chatData = read('ideal-machine-chat', {});
    const roleContext = roles.map(role => {
      const messages = chatData.chats?.[role.id]?.messages || [];
      const recent = messages.slice(-12).map(message => `${message.role === 'user' ? '用户' : role.nickname || role.name}：${message.text || ''}`).join('\n');
      return `角色ID：${role.id}\n网名：${role.nickname || role.name || '角色'}\n真实姓名：${role.name || ''}\n最近聊天：\n${recent || '暂无聊天记录'}`;
    }).join('\n\n');
    const npcContext = npcs.map(npc => `NPC ID：${npc.id}\n姓名：${npc.name}\n身份：${npc.identity || 'NPC'}\n当前状态：${npc.status || npc.lifeStatus || '默认在世'}\n性格与说话方式：${npc.personality || '暂无'}\n动机：${npc.motivation || '暂无'}\n人物关系：${npc.reason || npc.relationToRole || npc.relationDescription || '暂无'}\n背景：${npc.description || npc.background || '暂无'}`).join('\n\n');
    const button = app.querySelector('[data-forum-refresh]');
    refreshBusy = true;
    button?.classList.add('is-loading');
    try {
      const response = await forumRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, temperature: .85, messages: [
          { role: 'system', content: '你是论坛内容调度器。请让提供的角色和 NPC 都自然参与论坛，每位角色各生成一条，另选 1—3 位当前仍在世的 NPC 各生成一条。每个人的发言必须严格符合其身份、性格、动机、关系、经历和说话方式，不能使用统一口吻。若 NPC 名单为空但世界书明确写有当前在世人物，可从世界书识别，actorId 留空；不得凭空创造人物。任何已经去世、死亡、阵亡、牺牲或只存在于回忆中的人物绝对不能发帖，也不能以账号、幽灵、转述等方式出现。严格只返回 JSON 数组，每项格式为 {"actorType":"role或npc","actorId":"对应ID","actorName":"姓名","isAlive":true,"text":"帖子正文"}。不要 Markdown，不要解释。' },
          { role: 'user', content: `论坛世界书规则：\n${rules}\n\n可参与角色：\n${roleContext || '无'}\n\n可参与 NPC：\n${npcContext || '无'}` }
        ] })
      });
      if (!response.ok) throw new Error(await forumError(response));
      const data = await response.json();
      const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
      let generated;
      try { generated = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw); } catch { generated = []; }
      if (!Array.isArray(generated)) generated = [];
      const list = getPosts();
      generated.forEach(item => {
        const actorType = item.actorType === 'npc' ? 'npc' : 'role';
        const actor = actorType === 'npc'
          ? npcs.find(entry => entry.id === item.actorId || entry.name === item.actorName)
          : roles.find(entry => entry.id === (item.actorId || item.roleId) || entry.name === item.actorName || entry.nickname === item.actorName);
        const text = String(item.text || '').trim();
        const resolvedActor = actor || (actorType === 'npc' && worldbook && item.actorName && item.isAlive === true ? { id:uid('forum-npc'), name:String(item.actorName).trim(), identity:'世界书 NPC', status:'在世' } : null);
        if (!resolvedActor || npcIsDeceased(resolvedActor) || !text) return;
        const nickname = resolvedActor.nickname || resolvedActor.name || (actorType === 'npc' ? 'NPC' : '角色');
        const post = { id: uid('forum-post'), nickname, handle: actorType, avatar: resolvedActor.avatar || '', voiceStyle: resolvedActor.forumVoiceStyle || '', actorProfile:actorType === 'npc' ? npcPersona(resolvedActor) : undefined, text, time: now(), likes: 0, comments: 0, reposts: 0, ownerType: actorType === 'npc' ? 'npc' : 'character', ownerId: resolvedActor.id };
        list.unshift(post);
        addNotice({ type: 'role', actor: post.nickname, avatar: post.avatar, title: post.nickname + '发布了新动态', text: post.text, postId: post.id });
      });
      if (!generated.length || !list.some(post => generated.some(item => post.text === String(item.text || '').trim()))) throw new Error('返回内容不是有效的帖子数组');
      save(feedKey, list);
      activeTab = 'home';
      render();
    } catch (error) {
      window.alert(`刷新论坛失败：${error.message || '未知错误'}`);
    } finally {
      refreshBusy = false;
      button?.classList.remove('is-loading');
    }
  }

  async function generateDiscoverRecommendations() {
    if (discoverBusy) return;
    const { endpoint, url, headers, model } = forumApi();
    if (!endpoint || !model) return window.alert('论坛还没有可用模型：请在设置中拉取模型并至少保留一个模型。');
    const posts = getPosts().slice(0, 24);
    const roleContext = getRoles().filter(role => getProfile().allowedRoles.includes(role.id)).map(role => `${role.nickname || role.name || '角色'}：${role.signature || '暂无角色设定'}`).join('\n');
    const postContext = posts.map(post => `${post.nickname || '用户'}：${post.text || ''}`).join('\n');
    const button = app.querySelector('[data-forum-discover-refresh]');
    discoverBusy = true;
    button?.classList.add('is-loading');
    try {
      const response = await forumRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, temperature: .75, messages: [
          { role: 'system', content: '你是论坛发现页编辑。根据论坛动态和角色资料，生成 5 个适合探索的中文热门话题。严格只返回 JSON 数组，每项格式为 {"name":"话题名","desc":"一句简短说明"}，不要 Markdown，不要解释。' },
          { role: 'user', content: `角色资料：\n${roleContext || '暂无'}\n\n最近动态：\n${postContext || '暂无动态'}` }
        ] })
      });
      if (!response.ok) throw new Error(await forumError(response));
      const data = await response.json();
      const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
      const topics = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw).filter(item => item?.name).slice(0, 8).map(item => ({ name: String(item.name).slice(0, 24), desc: String(item.desc || '').slice(0, 60) }));
      if (!topics.length) throw new Error('没有生成话题');
      save(discoverKey, { topics, generatedAt: now() });
      render();
    } catch (error) {
      window.alert(`生成发现内容失败：${error.message || '未知错误'}`);
    } finally {
      discoverBusy = false;
      button?.classList.remove('is-loading');
    }
  }

  async function generatePostInteraction(post) {
    if (interactionBusy) return;
    const profile = getProfile();
    const allowed = getRoles().filter(role => profile.allowedRoles.includes(role.id));
    const worldbook = getForumBooks().find(book => book.id === getForumSettings().worldbookId);
    const npcs = getForumNpcs(worldbook, allowed);
    const actors = [
      ...allowed.map(role => ({ ...role, actorType:'role', displayName:role.nickname || role.name || '角色' })),
      ...npcs.map(npc => ({ ...npc, actorType:'npc', displayName:npc.name || 'NPC' }))
    ];
    if (!actors.length) return window.alert('没有可互动的角色或 NPC，请先在论坛设置中选择角色或论坛世界书。');
    const { endpoint, url, headers, model } = forumApi();
    if (!endpoint || !model) return window.alert('论坛还没有可用模型：请在设置中拉取模型并至少保留一个模型。');
    const rules = (worldbook?.entries?.filter(entry => entry.enabled !== false).map(entry => `【${entry.name}】\n${entry.content}`).join('\n\n') || '未选择论坛世界书。').slice(-6000);
    const roster = actors.slice(0, 16).map(actor => `类型：${actor.actorType}\nID：${actor.id}\n姓名：${actor.displayName}\n${actor.actorType === 'role' ? roleUserContext(actor) : '【资料边界】这是 NPC；未提供的用户资料保持未知，不得推测。'}\n身份：${actor.identity || '暂无'}\n性格与说话方式：${String(actor.signature || actor.persona || actor.personality || '暂无').slice(0, 700)}\n动机与关系：${String(actor.motivation || actor.reason || actor.relationDescription || '暂无').slice(0, 500)}\n背景：${String(actor.description || actor.background || '暂无').slice(0, 500)}\n当前状态：${actor.status || actor.lifeStatus || '默认在世'}`).join('\n\n').slice(0, 10000);
    const existingReplies = Array.isArray(post.replies) ? post.replies : [];
    const replyContext = existingReplies.length ? existingReplies.slice(-20).map(reply => `评论ID：${reply.id}\n评论者：${reply.nickname || '用户'}\n内容：${String(reply.text || '').slice(0, 400)}`).join('\n\n') : '暂无评论';
    const button = [...app.querySelectorAll('[data-forum-post]')].find(entry => entry.dataset.forumPost === post.id)?.querySelector('[data-forum-interact]');
    interactionBusy = true;
    button?.classList.add('is-loading');
    try {
      const response = await forumRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, temperature: .9, messages: [
          { role: 'system', content: '你是论坛互动生成器。从名单中选择 1—3 位当前在世的角色或 NPC，对帖子或现有评论产生自然互动。角色和 NPC 都可以回复用户、角色或 NPC 的评论；存在合适评论时，优先生成至少一条评论间回复。每个角色开始生成反应前，必须先读取该角色本人资料，再读取该角色绑定用户资料；角色本人资料决定身份、性格和行为，绑定用户资料只用于理解对方。姓名、性别、生日和年龄只能使用明确填写的字段，缺失就保持未知，不得猜测或串用。每个人的互动必须严格符合自己的人设。禁止自己回复自己；已去世人物绝对不能互动。动作可以是 reply、like 或 both。targetId 填 post 表示回复帖子；回复某条评论必须填写该评论的真实 ID。严格只返回 JSON 数组，每项格式为 {"actorType":"role或npc","actorId":"ID","action":"reply、like或both","targetId":"post或评论ID","text":"评论内容；纯点赞时为空"}。不要 Markdown、解释或创造名单外人物。' },
          { role: 'user', content: `论坛世界书：\n${rules}\n\n目标帖子（作者：${post.nickname || '论坛用户'}）：\n${post.text}\n\n现有评论：\n${replyContext}\n\n可互动人物：\n${roster}` }
        ] })
      }, 'forum-interaction');
      if (!response.ok) throw new Error(await forumError(response));
      const data = await response.json();
      const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
      let results = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw);
      if (!Array.isArray(results)) results = [results];
      const list = getPosts();
      const target = list.find(item => item.id === post.id);
      if (!target) return;
      target.replies = Array.isArray(target.replies) ? target.replies : [];
      let interactions = 0;
      results.slice(0, 3).forEach(result => {
        const actor = actors.find(item => item.id === (result.actorId || result.roleId));
        if (!actor) return;
        const action = ['reply', 'like', 'both'].includes(result.action) ? result.action : 'reply';
        const text = String(result.text || '').trim();
        const requestedTarget = String(result.targetId || 'post');
        const parent = requestedTarget === 'post' ? null : target.replies.find(reply => reply.id === requestedTarget);
        if (!parent && target.ownerId && target.ownerId === actor.id) return;
        if (parent && (parent.ownerId === actor.id || parent.nickname === actor.displayName)) return;
        if ((action === 'reply' || action === 'both') && text) {
          target.replies.push({ id: uid('forum-reply'), nickname: actor.displayName, avatar: actor.avatar || '', text, time: now(), replyTo:parent?.id || '', replyToName:parent?.nickname || '', ownerType: actor.actorType === 'npc' ? 'npc' : 'character', ownerId: actor.id });
          target.comments = Number(target.comments || 0) + 1;
          interactions += 1;
          if (target.ownerType === 'user' && target.owner === getProfile().nickname) addNotice({ type:'reply', actor:actor.displayName, avatar:actor.avatar || '', title:`${actor.displayName}回复了你的动态`, text, postId:target.id });
        }
        if (action === 'like' || action === 'both') { target.likes = Number(target.likes || 0) + 1; interactions += 1; }
      });
      if (!interactions) throw new Error('API 没有返回有效互动');
      save(feedKey, list);
      render();
    } catch (error) {
      window.alert(`生成互动失败：${error.message || '未知错误'}`);
    } finally {
      interactionBusy = false;
      button?.classList.remove('is-loading');
    }
  }

  function postHtml(post) {
    const liked = post.liked === true;
    const replies = Array.isArray(post.replies) ? post.replies : [];
    const replyHtml = replies.length ? '<div class="forum-post-replies">' + replies.map(reply => '<article class="' + (reply.replyTo ? 'is-nested' : '') + '"><span class="forum-post-reply-avatar">' + avatar(reply.avatar, reply.nickname) + '</span><p><b>' + esc(reply.nickname || '角色') + '</b>' + (reply.replyToName ? '<small>回复 @' + esc(reply.replyToName) + '</small>' : '') + '<span>' + esc(reply.text || '') + '</span></p></article>').join('') + '</div>' : '';
    return '<article class="forum-post" data-forum-post="' + esc(post.id) + '"><div class="forum-post-avatar">' + avatar(post.avatar, post.nickname) + '</div><div class="forum-post-body"><header><div><b>' + esc(post.nickname || '论坛用户') + '</b><span>@' + esc(post.handle || 'user') + '</span></div><time>' + esc(post.time || '') + '</time></header><p class="forum-post-text">' + esc(post.text) + '</p>' + (post.voiceStyle ? '<small class="forum-post-style">发言方式：' + esc(post.voiceStyle) + '</small>' : '') + replyHtml + '<footer><button type="button" data-forum-comment aria-label="回复">' + forumIcon('reply') + '<span>' + Number(post.comments || 0) + '</span></button><button type="button" data-forum-repost aria-label="转发">' + forumIcon('repost') + '<span>' + Number(post.reposts || 0) + '</span></button><button class="' + (liked ? 'is-liked' : '') + '" type="button" data-forum-like aria-label="点赞">' + forumIcon('like') + '<span>' + Number(post.likes || 0) + '</span></button><button type="button" data-forum-interact aria-label="生成互动">' + forumIcon('share') + '</button><button type="button" data-forum-delete ' + (canDeletePost(post) ? '' : 'hidden') + '>删除</button></footer></div></article>';
  }

  function openCompose() {
    const sheet = app.querySelector('[data-forum-compose-sheet]');
    const current = getProfile();
    sheet.innerHTML = '<div class="forum-sheet-backdrop" data-forum-compose-close></div><section class="forum-compose-card"><header><div><span>NEW POST</span><h2>发布动态</h2></div><button type="button" data-forum-compose-close>×</button></header><div class="forum-compose-author"><div class="forum-post-avatar">' + avatar(current.avatar, current.nickname) + '</div><b>' + esc(current.nickname) + '</b></div><textarea data-forum-text maxlength="500" placeholder="分享此刻的想法…"></textarea><footer><small>最多 500 字</small><button type="button" data-forum-post-submit>发布</button></footer></section>';
    sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); resolveStoredAvatars();
  }
  function openComment(post) {
    const sheet = app.querySelector('[data-forum-compose-sheet]');
    const current = getProfile();
    commentTargetId = post.id;
    sheet.innerHTML = '<div class="forum-sheet-backdrop" data-forum-compose-close></div><section class="forum-compose-card"><header><div><span>NEW COMMENT</span><h2>发表评论</h2></div><button type="button" data-forum-compose-close>×</button></header><div class="forum-compose-author"><div class="forum-post-avatar">' + avatar(current.avatar, current.nickname) + '</div><div><b>' + esc(current.nickname) + '</b><small> 回复 ' + esc(post.nickname || '论坛用户') + '</small></div></div><textarea data-forum-comment-text maxlength="500" placeholder="写下你的评论…"></textarea><footer><small>最多 500 字</small><button type="button" data-forum-comment-submit>发表</button></footer></section>';
    sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); resolveStoredAvatars();
    requestAnimationFrame(() => sheet.querySelector('[data-forum-comment-text]')?.focus());
  }
  function closeCompose() { const sheet = app.querySelector('[data-forum-compose-sheet]'); sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true'); sheet.innerHTML = ''; commentTargetId = ''; }

  function openProfile() {
    const current = getProfile();
    const sheet = app.querySelector('[data-forum-profile-sheet]');
    const roles = getRoles();
    const roleOptions = roles.length ? roles.map(role => '<div class="forum-role-option"><span class="forum-role-avatar">' + avatar(role.avatar, role.nickname || role.name) + '</span><span><b>' + esc(role.nickname || role.name || '未命名角色') + '</b><small>' + esc(role.name || '') + '</small></span><button type="button" class="forum-role-toggle' + (current.allowedRoles.includes(role.id) ? ' is-selected' : '') + '" data-forum-role-toggle="' + esc(role.id) + '">' + (current.allowedRoles.includes(role.id) ? '已选择' : '选择') + '</button></div>').join('') : '<p class="forum-no-roles">聊天 App 里还没有角色，请先添加角色。</p>';
    sheet.innerHTML = '<div class="forum-sheet-backdrop" data-forum-profile-close></div><section class="forum-profile-card"><header><div><span>ACCOUNT</span><h2>论坛账号</h2></div><button type="button" data-forum-profile-close>×</button></header><label class="forum-avatar-choose" data-forum-avatar-trigger><div class="forum-profile-avatar-preview" data-forum-profile-preview>' + avatar(current.avatar, current.nickname) + '</div><span>点击头像更换</span><input type="file" accept="image/*" data-forum-avatar-file></label><label>论坛网名<input data-forum-nickname maxlength="30" value="' + esc(current.nickname) + '" placeholder="输入论坛网名"></label><label>论坛上的说话方式<textarea data-forum-voice-style maxlength="180" placeholder="例如：简短、冷静，偶尔使用句号。">' + esc(current.voiceStyle) + '</textarea></label><section class="forum-role-selector"><h3>允许参与论坛的角色</h3><p>读取角色聊天记录，并选择哪些角色可以参与论坛。</p><div>' + roleOptions + '</div></section><p class="forum-profile-note">这套账号资料会用于论坛的所有发帖和互动。</p><footer><button class="forum-profile-delete" type="button" data-forum-profile-delete>删除账号</button><button type="button" data-forum-profile-close>取消</button><button class="is-primary" type="button" data-forum-profile-save>保存账号</button></footer></section>';
    sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); resolveStoredAvatars();
  }
  function closeProfile() { const sheet = app.querySelector('[data-forum-profile-sheet]'); sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true'); sheet.innerHTML = ''; }
  function previewAvatar(value) { const preview = app.querySelector('[data-forum-profile-preview]'); if (preview && value) preview.innerHTML = avatar(value, app.querySelector('[data-forum-nickname]')?.value || '论'); }

  app.addEventListener('click', event => {
    if (event.target.closest('[data-forum-close]')) { app.classList.remove('is-open'); closeCompose(); closeProfile(); return; }
    if (event.target.closest('[data-forum-refresh]')) { refreshForumPosts(); return; }
    if (event.target.closest('[data-forum-compose]')) { openCompose(); return; }
    if (event.target.closest('[data-forum-profile]')) { openProfile(); return; }
    const tab = event.target.closest('[data-forum-tab]');
    if (tab) { activeTab = tab.dataset.forumTab; app.querySelectorAll('[data-forum-tab]').forEach(button => button.classList.toggle('is-active', button === tab)); render(); return; }
    if (event.target.closest('[data-forum-compose-close]')) { closeCompose(); return; }
    if (event.target.closest('[data-forum-profile-close]')) { closeProfile(); return; }
    const noticeFilter = event.target.closest('[data-forum-notice-filter]');
    if (noticeFilter) { renderNotice.filter = noticeFilter.dataset.forumNoticeFilter || 'all'; render(); return; }
    if (event.target.closest('[data-forum-notice-read-all]')) { save(noticeKey, getNotices().map(item => ({ ...item, read: true }))); render(); return; }
    const noticeItem = event.target.closest('[data-forum-notice-post]');
    if (noticeItem) {
      const notices = getNotices();
      const currentNotice = notices.find(item => item.id === noticeItem.dataset.forumNoticeId);
      if (currentNotice) { currentNotice.read = true; save(noticeKey, notices); }
      if (!noticeItem.dataset.forumNoticePost) { render(); return; }
      activeTab = 'home';
      render();
      requestAnimationFrame(() => {
        const target = [...app.querySelectorAll('[data-forum-post]')].find(item => item.dataset.forumPost === noticeItem.dataset.forumNoticePost);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.classList.add('is-notice-target');
        setTimeout(() => target?.classList.remove('is-notice-target'), 1300);
      });
      return;
    }
    if (event.target.closest('[data-forum-font-use]')) { const current = getForumSettings(); const fontId = app.querySelector('[data-forum-font-package]')?.value || current.fontId; if (!current.fontPackages.some(item => item.id === fontId)) return window.alert('请先选择一个已导入的字体包。'); save(settingsKey, { ...current, worldbookId: app.querySelector('[data-forum-worldbook]')?.value || current.worldbookId, fontFamily: 'custom', fontId, fontSize: Number(app.querySelector('[data-forum-font-size]')?.value || current.fontSize) }); applyForumSettings(); render(); return; }
    if (event.target.closest('[data-forum-font-reset]')) { const current = getForumSettings(); save(settingsKey, { ...current, worldbookId: app.querySelector('[data-forum-worldbook]')?.value || current.worldbookId, fontFamily: 'system', fontSize: 13 }); applyForumSettings(); render(); return; }
    if (event.target.closest('[data-forum-discover-refresh]')) { generateDiscoverRecommendations(); return; }
    const discoverFilterButton = event.target.closest('[data-forum-discover-filter]');
    if (discoverFilterButton) { discoverFilter = discoverFilterButton.dataset.forumDiscoverFilter || 'all'; render(); return; }
    const discoverTopic = event.target.closest('[data-forum-discover-topic]');
    if (discoverTopic) { discoverQuery = discoverTopic.dataset.forumDiscoverTopic || ''; render(); return; }
    const roleToggle = event.target.closest('[data-forum-role-toggle]');
    if (roleToggle) { roleToggle.classList.toggle('is-selected'); roleToggle.textContent = roleToggle.classList.contains('is-selected') ? '已选择' : '选择'; return; }
    const submit = event.target.closest('[data-forum-post-submit]');
    if (submit) { const text = app.querySelector('[data-forum-text]')?.value.trim(); if (!text) return; const current = getProfile(); const list = getPosts(); list.unshift({ id: uid('forum-post'), nickname: current.nickname, handle: 'user', avatar: current.avatar, voiceStyle: current.voiceStyle, text, time: now(), likes: 0, comments: 0, reposts: 0, owner: current.nickname, ownerType: 'user' }); save(feedKey, list); closeCompose(); render(); return; }
    if (event.target.closest('[data-forum-comment-submit]')) {
      const text = app.querySelector('[data-forum-comment-text]')?.value.trim();
      if (!text || !commentTargetId) return;
      const list = getPosts(); const item = list.find(entry => entry.id === commentTargetId);
      if (!item) { closeCompose(); return window.alert('这条帖子已经不存在。'); }
      const current = getProfile();
      item.replies = Array.isArray(item.replies) ? item.replies : [];
      item.replies.push({ id:uid('forum-reply'), nickname:current.nickname, avatar:current.avatar, text, time:now(), ownerType:'user', owner:current.nickname });
      item.comments = item.replies.length;
      save(feedKey, list); closeCompose(); render(); return;
    }
    const post = event.target.closest('[data-forum-post]'); if (!post) return;
    const list = getPosts(); const item = list.find(entry => entry.id === post.dataset.forumPost); if (!item) return;
    if (event.target.closest('[data-forum-like]')) { item.liked = !item.liked; item.likes = Math.max(0, Number(item.likes || 0) + (item.liked ? 1 : -1)); save(feedKey, list); render(); return; }
    if (event.target.closest('[data-forum-comment]')) { openComment(item); return; }
    if (event.target.closest('[data-forum-repost]')) { item.reposts = Number(item.reposts || 0) + 1; save(feedKey, list); render(); return; }
    if (event.target.closest('[data-forum-interact]')) { generatePostInteraction(item); return; }
    const canDelete = canDeletePost(item);
    if (event.target.closest('[data-forum-delete]')) { if (!canDelete) return window.alert('只能删除自己发布的动态。'); if (window.confirm('确定删除这条动态吗？')) { save(feedKey, list.filter(entry => entry.id !== item.id)); render(); } }
  });
  app.addEventListener('input', event => {
    const input = event.target.closest('[data-forum-search-input]');
    if (!input || activeTab !== 'search') return;
    discoverQuery = input.value;
    render();
    const nextInput = app.querySelector('[data-forum-search-input]');
    nextInput?.focus();
    nextInput?.setSelectionRange(discoverQuery.length, discoverQuery.length);
  });
  app.addEventListener('change', event => {
    const setting = event.target.closest('[data-forum-worldbook], [data-forum-font-family], [data-forum-font-size], [data-forum-font-package]');
    if (setting) {
      const current = getForumSettings();
      const next = {
        ...current,
        worldbookId: app.querySelector('[data-forum-worldbook]')?.value || '',
        fontFamily: app.querySelector('[data-forum-font-family]')?.value || 'system',
        fontId: app.querySelector('[data-forum-font-package]')?.value || current.fontId,
        fontSize: Number(app.querySelector('[data-forum-font-size]')?.value || current.fontSize)
      };
      save(settingsKey, next);
      if (!setting.matches('[data-forum-font-package]')) applyForumSettings();
      return;
    }
    const fontFile = event.target.closest('[data-forum-font-file]')?.files?.[0];
    if (fontFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const current = getForumSettings();
        const packageItem = { id: uid('forum-font'), name: fontFile.name, source: String(reader.result || '') };
        save(settingsKey, { ...current, worldbookId: app.querySelector('[data-forum-worldbook]')?.value || current.worldbookId, fontFamily: app.querySelector('[data-forum-font-family]')?.value || current.fontFamily, fontId: packageItem.id, fontSize: Number(app.querySelector('[data-forum-font-size]')?.value || current.fontSize), fontPackages: [...current.fontPackages, packageItem] });
        applyForumSettings();
        render();
      };
      reader.readAsDataURL(fontFile);
      return;
    }
    const file = event.target.closest('[data-forum-avatar-file]')?.files?.[0];
    if (!file) return;
    const readImage = window.IdealMachineReadImage ? window.IdealMachineReadImage(file, 500, .72) : new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); });
    readImage.then(value => previewAvatar(value));
  });
  app.addEventListener('click', event => { if (event.target.closest('[data-forum-profile-delete]')) { if (window.confirm('确定删除论坛账号设置吗？已发布的动态会保留。')) { localStorage.removeItem(profileKey); closeProfile(); render(); } return; } if (!event.target.closest('[data-forum-profile-save]')) return; const nickname = app.querySelector('[data-forum-nickname]')?.value.trim(); if (!nickname) return window.alert('请输入论坛网名。'); const file = app.querySelector('[data-forum-avatar-file]')?.files?.[0]; const voiceStyle = app.querySelector('[data-forum-voice-style]')?.value.trim() || ''; const allowedRoles = [...app.querySelectorAll('[data-forum-role-toggle].is-selected')].map(input => input.dataset.forumRoleToggle); const persist = value => { save(profileKey, { nickname, avatar: value, voiceStyle, allowedRoles }); closeProfile(); render(); }; const readAvatar = file ? (window.IdealMachineReadImage ? window.IdealMachineReadImage(file, 500, .72) : Promise.resolve('')) : Promise.resolve(getProfile().avatar); readAvatar.then(value => persist(value || getProfile().avatar)); });
  document.addEventListener('click', event => { if (!event.target.closest('[data-app-key="luntan"]')) return; app.classList.add('is-open'); render(); });
  apps.luntan = { name: '论坛' };
  applyForumSettings();
})();
