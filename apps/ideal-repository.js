(() => {
  if (window.IdealMachineRepository) return;

  const channels = {
    beauty: { name: '美化', icon: '✦', description: '让理想机变成你的样子', types: 'CSS · JSON · 图片' },
    world: { name: '世界书', icon: '◇', description: '收藏设定，打开另一个世界', types: 'TXT · JSON · DOCX' },
    character: { name: '角色卡', icon: '◈', description: '在这里遇见新的故事主角', types: 'PNG · TXT · DOCX' }
  };
  const root = document.createElement('section');
  root.className = 'ideal-repository';
  root.setAttribute('aria-label', '理想机仓库');
  root.innerHTML = `
    <div class="ir-shell">
      <aside class="ir-rail" aria-label="服务器">
        <button class="ir-rail-tool" type="button" data-ir-friends-open aria-label="好友"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 3a9 9 0 0 0-7.4 14.1L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/></svg></button>
        <button class="ir-rail-tool" type="button" data-ir-activity aria-label="最近动态"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v3c0 3-3 4-5 6 2 2 5 3 5 6v3H6v-3c0-3 3-4 5-6-2-2-5-3-5-6V3Z"/><path d="M9 6h6m-6 12h6"/></svg></button>
        <span class="ir-rail-line"></span>
        <button class="ir-server" type="button" data-ir-home aria-label="理想机服务器"><img src="assets/icons/default-ios17/ideal.webp" alt=""></button>
      </aside>
      <aside class="ir-sidebar">
        <header class="ir-sidebar-header"><h1>理想机 <span>›</span></h1><button class="ir-close" type="button" data-ir-close aria-label="返回桌面">×</button></header>
        <div class="ir-search-wrap">
          <label class="ir-search"><input type="search" data-ir-search aria-label="搜索频道" placeholder=" "><span class="ir-search-caption"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg><span>搜索</span></span></label>
          <button class="ir-search-tool" type="button" data-ir-members aria-label="社区成员"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="4" fill="currentColor" stroke="none"/><path d="M2 21v-3a7 7 0 0 1 14 0v3" fill="currentColor" stroke="none"/><path d="M18 9v9m-4.5-4.5h9"/></svg></button>
          <button class="ir-search-tool" type="button" data-ir-events aria-label="社区活动"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="17" rx="3" fill="currentColor" stroke="none"/><path d="M7 2v5m10-5v5"/><path d="M4 10h16" stroke="#f0f0f2"/><rect x="7" y="13" width="5" height="5" rx="1" fill="#f0f0f2" stroke="none"/></svg></button>
        </div>
        <nav class="ir-channel-nav" aria-label="仓库频道">
          <div class="ir-section-title">仓库频道 <span>03</span></div>
          <button type="button" class="ir-channel" data-ir-channel="beauty"><span class="ir-hash">#</span><span>美化</span><span class="ir-chevron">›</span></button>
          <button type="button" class="ir-channel" data-ir-channel="world"><span class="ir-hash">#</span><span>世界书</span><span class="ir-chevron">›</span></button>
          <button type="button" class="ir-channel" data-ir-channel="character"><span class="ir-hash">#</span><span>角色卡</span><span class="ir-chevron">›</span></button>
          <p class="ir-empty-search" hidden>没有找到这个频道</p>
          <div class="ir-sidebar-note"><span>✳</span><div><strong>关于理想机仓库</strong><small>一个装下故事与灵感的地方</small></div></div>
        </nav>
      </aside>
      <main class="ir-main" data-ir-main aria-live="polite"></main>
      <div class="ir-profile-entry"><button class="ir-profile-open" type="button" data-ir-profile><span class="ir-avatar" data-ir-avatar>我</span><span class="ir-profile-copy"><strong data-ir-username>我的主页</strong><small>查看个人主页</small></span></button><button class="ir-profile-arrow" type="button" data-ir-notifications aria-label="通知"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a2 2 0 0 0-2 2v.3A6 6 0 0 0 6 10v4l-2 3v1h16v-1l-2-3v-4a6 6 0 0 0-4-5.7V4a2 2 0 0 0-2-2Zm-3 18a3 3 0 0 0 6 0Z"/></svg></button></div>
    </div>`;
  document.body.appendChild(root);

  let screen = 'welcome';
  let activePost = null;
  let postQuery = '';
  let postTag = '';
  let oldestFirst = false;
  let listScroll = 0;
  let savedPosts = [];
  let personal = {};
  let profilePanel = '';
  let likedPosts = [];
  let likesMore = false;
  let likesStatus = '';
  let profileSerial = 0;
  let friendsTab = 'friends';
  let friendPanel = '';
  let friendSearchOpen = false;
  let friendData = { friends:[], incoming:[], outgoing:[] };
  let friendResults = [];
  let friendQuery = '';
  let friendStatus = '';
  let friendBusy = false;
  let friendSearchSerial = 0;
  let chatList = [];
  let chatFriend = null;
  let chatMessages = [];
  let chatDraft = '';
  let chatStatus = '';
  let chatBusy = false;
  let chatSending = false;
  let chatCanSend = true;
  let chatBlockedByMe = false;
  let chatReplyTo = null;
  let chatSwipeStart = null;
  let chatPollTimer = 0;
  let chatRequestSerial = 0;
  let profileOrigin = false;
  let avatarUrl = '';
  let coverUrl = '';
  let saveBusy = false;
  let remotePosts = [];
  let remoteHasMore = false;
  let remoteDetail = null;
  let remoteStatus = '';
  let uploadOpen = false;
  let uploadBusy = false;
  let uploadError = '';
  let requestSerial = 0;
  let searchTimer = 0;
  let profileViewportBaselineHeight = 0;
  let profileViewportBaselineWidth = 0;
  const imageUrls = new Set();
  const friendAvatarObjectUrls = new Map();
  const accountStorageId = () => { const user = window.IdealMachineAuth?.getUser?.(); return String(user?.id || user?.username || 'guest'); };
  const avatarStorageKey = () => `ideal-repository-avatar-v1:${accountStorageId()}`;
  const personalStorageKey = () => `ideal-repository-profile-v1:${accountStorageId()}`;
  const coverStorageKey = () => `ideal-repository-cover-v1:${accountStorageId()}`;
  function readLocalProfile() { try { const value = JSON.parse(localStorage.getItem(personalStorageKey()) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } }
  function writeLocalProfile(value) { localStorage.setItem(personalStorageKey(), JSON.stringify({ nickname:value.nickname || '', bio:value.bio || '', note:value.note || '' })); }
  const apiBase = () => String(window.IdealMachineConfig?.repositoryApiBase || '').replace(/\/+$/, '');
  const apiError = { INVALID_PROFILE:'资料格式不正确，请检查字数；账号与注册时间不可修改', UNAUTHORIZED:'请先登录理想机账号', AUTH_SERVICE_UNAVAILABLE:'账号服务暂时不可用', INVALID_POST:'请填写标题并检查字数', BEAUTY_CODE_OR_FILE_REQUIRED:'美化帖需要美化码或文件', FILE_REQUIRED:'世界书和角色卡必须上传文件', IMPORTABLE_FILE_REQUIRED:'请上传可导入的主文件，图片可以作为附加预览', CODE_NOT_ALLOWED:'这个频道只能上传文件', INVALID_BEAUTY_CODE:'请输入已有的 IDEAL- 美化码', INVALID_AVATAR:'请选择不超过 512 KB 的 PNG、JPEG 或 WebP 头像', STORAGE_UNAVAILABLE:'头像存储服务暂时不可用', LIKE_REQUIRED:'请先点赞，再保存文件或美化码', FORBIDDEN:'你只能删除自己发布的帖子', TOO_MANY_FILES:'每篇帖子最多上传 3 个文件', INVALID_FILE_TYPE_OR_SIZE:'文件格式不支持，或单个文件超过 8 MB', REQUEST_TOO_LARGE:'附件总大小超过限制', POST_RATE_LIMIT:'发布太频繁，请稍后再试', INVALID_ACCOUNT_QUERY:'请输入有效的 Ideal 账号（3 至 32 位）', ACCOUNT_NOT_FOUND:'没有找到这个账号', ALREADY_FRIENDS:'你们已经是好友了', REQUEST_ALREADY_SENT:'好友申请已经发送', REQUEST_RECEIVED:'对方已向你发送申请，请在申请列表中处理', ACCOUNT_SEARCH_UNAVAILABLE:'账号搜索暂时不可用，请稍后再试', FRIENDSHIP_REQUIRED:'只有已添加的好友之间可以私聊', INVALID_MESSAGE:'消息不能为空，且不能超过 2000 字', INVALID_REPLY:'引用的消息已不存在或不属于此会话', ACCOUNT_BLOCKED:'此会话已被屏蔽，暂时不能发送消息', CHAT_RATE_LIMIT:'发送太频繁，请稍后再试' };
  async function requestApi(path, options = {}) {
    if (!apiBase()) throw new Error('仓库后端尚未部署或配置。请先设置 repositoryApiBase。');
    const token = window.IdealMachineAuth?.getToken?.();
    if (!token) throw new Error('请先登录理想机账号。');
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${apiBase()}${path}`, { ...options, headers, credentials:'omit', cache:options.raw ? 'default' : 'no-store' });
    if (options.raw) {
      if (!response.ok) throw new Error(`文件读取失败（${response.status}）`);
      return response;
    }
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(apiError[payload.error] || payload.error || `请求失败（${response.status}）`);
    return payload;
  }
  async function loadPosts() {
    if (!channels[screen]) return;
    if (!apiBase()) { remotePosts = []; remoteStatus = '仓库服务尚未配置，暂无帖子。'; render(); return; }
    const channel = screen, serial = ++requestSerial;
    remoteStatus = '正在加载帖子…'; render();
    const params = new URLSearchParams({ channel, q:postQuery, tag:postTag, order:oldestFirst ? 'oldest' : 'newest' });
    try {
      const result = await requestApi(`/api/posts?${params}`);
      if (serial !== requestSerial || screen !== channel) return;
      remotePosts = result.posts || []; remoteHasMore = Boolean(result.hasMore); remoteStatus = ''; render();
    } catch (error) {
      if (serial !== requestSerial || screen !== channel) return;
      remoteStatus = error.message; render();
    }
  }
  async function loadMorePosts() {
    if (!remoteHasMore || !channels[screen]) return;
    const channel = screen, offset = remotePosts.length;
    const scroll = root.querySelector('[data-ir-post-list]');
    const scrollTop = scroll?.scrollTop || 0;
    const params = new URLSearchParams({ channel, q:postQuery, tag:postTag, order:oldestFirst ? 'oldest' : 'newest', offset:String(offset) });
    try {
      const result = await requestApi(`/api/posts?${params}`);
      if (screen !== channel || remotePosts.length !== offset) return;
      remotePosts.push(...(result.posts || [])); remoteHasMore = Boolean(result.hasMore); render();
      root.querySelector('[data-ir-post-list]').scrollTop = scrollTop;
    } catch (error) { window.alert(error.message); }
  }
  async function loadPost(id) {
    if (!apiBase()) return;
    const channel = screen, serial = ++requestSerial;
    remoteDetail = null; remoteStatus = '正在加载正文…'; render();
    try {
      const result = await requestApi(`/api/posts/${encodeURIComponent(id)}`);
      if (serial !== requestSerial || screen !== channel || activePost !== id) return;
      remoteDetail = result.post; remoteStatus = ''; render(); hydrateImages();
    } catch (error) {
      if (serial !== requestSerial || screen !== channel) return;
      remoteStatus = error.message; render();
    }
  }
  async function loadProfile() {
    const serial = ++profileSerial;
    personal = readLocalProfile();
    if (screen === 'profile') render();
    try {
      const result = await requestApi('/api/me/profile');
      if (serial !== profileSerial || !result.profile) return;
      const local = readLocalProfile();
      personal = {
        nickname:result.profile.nickname || local.nickname || '',
        bio:result.profile.bio ?? local.bio ?? '',
        note:result.profile.note ?? local.note ?? '',
        createdAt:result.profile.createdAt || ''
      };
      try { writeLocalProfile(personal); } catch {}
    } catch {
      // Keep the account-scoped local copy available when an older server has not
      // deployed the profile endpoint or profile migration yet.
    }
    if (screen === 'profile' && serial === profileSerial) render();
  }
  async function loadFriends() {
    friendStatus = ''; friendBusy = true; render();
    try { friendData = await requestApi('/api/me/friends'); }
    catch (error) { friendStatus = error.message; }
    finally { friendBusy = false; if (screen === 'friends') render(); }
  }
  async function loadChats(silent = false) {
    try {
      const result = await requestApi('/api/me/chats');
      const changed = JSON.stringify(chatList) !== JSON.stringify(result.chats || []);
      chatList = result.chats || [];
      if (changed && screen === 'friends' && friendPanel !== 'chat' && friendsTab === 'inbox') {
        const scroller = root.querySelector('.ir-chat-list'); const top = scroller?.scrollTop || 0;
        render(); root.querySelector('.ir-chat-list')?.scrollTo(0, top);
      }
    } catch (error) {
      if (!silent) chatStatus = error.message;
      if (!silent && screen === 'friends' && friendPanel !== 'chat' && friendsTab === 'inbox') render();
    }
  }
  function stopChatPolling() { clearInterval(chatPollTimer); chatPollTimer = 0; }
  function startChatPolling() {
    stopChatPolling();
    chatPollTimer = setInterval(() => {
      if (screen !== 'friends') return;
      if (friendPanel === 'chat' && !chatSending) loadChatMessages(true);
      else if (friendsTab === 'inbox' && friendPanel !== 'chat') loadChats(true);
    }, 8000);
  }
  async function loadChatMessages(silent = false) {
    if (!chatFriend || chatBusy) return;
    const friendId = chatFriend.userId || chatFriend.id;
    const serial = ++chatRequestSerial;
    if (!silent) { chatBusy = true; chatStatus = ''; render(); }
    try {
      const result = await requestApi(`/api/me/chats/${encodeURIComponent(friendId)}/messages`);
      if (serial !== chatRequestSerial || screen !== 'friends' || friendPanel !== 'chat' || (chatFriend.userId || chatFriend.id) !== friendId) return;
      const next = result.messages || [];
      const changed = JSON.stringify(chatMessages) !== JSON.stringify(next);
      const stateChanged = chatCanSend !== (result.canSend !== false) || chatBlockedByMe !== Boolean(result.blockedByMe);
      chatMessages = next;
      chatCanSend = result.canSend !== false;
      chatBlockedByMe = Boolean(result.blockedByMe);
      chatStatus = '';
      if (!silent) chatBusy = false;
      if (!silent || changed || stateChanged) {
        const scroll = root.querySelector('[data-ir-chat-scroll]');
        const nearBottom = silent && (!scroll || scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 48);
        updateChatMessageList(!silent || nearBottom);
        const input = root.querySelector('[data-ir-chat-input]');
        if (input) { input.disabled = !chatCanSend; input.placeholder = chatCanSend ? '发送消息…' : '此会话已屏蔽'; }
        const button = root.querySelector('.ir-chat-composer button[type="submit"]');
        if (button) button.disabled = chatSending || !chatDraft.trim() || !chatCanSend;
        root.querySelector('.ir-chat-status')?.remove();
      }
    } catch (error) {
      if (serial === chatRequestSerial) {
        chatStatus = error.message;
        if (!silent) {
          chatBusy = false;
          const status = root.querySelector('.ir-chat-status');
          if (status) status.textContent = chatStatus;
          else render();
        }
      }
    } finally { if (!silent && serial === chatRequestSerial) chatBusy = false; }
  }
  function openChat(friend) {
    if (!friend) return;
    stopChatPolling();
    chatFriend = friend; chatMessages = []; chatDraft = ''; chatStatus = ''; chatBusy = false; chatCanSend = true; chatBlockedByMe = false; chatReplyTo = null;
    ++chatRequestSerial;
    friendPanel = 'chat';
    render();
    void loadChatMessages();
    startChatPolling();
  }
  async function sendChatMessage(event) {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text || chatSending || !chatFriend) return;
    const friendId = chatFriend.userId || chatFriend.id;
    chatSending = true; chatStatus = '';
    const sendButton = root.querySelector('.ir-chat-composer button[type="submit"]');
    if (sendButton) { sendButton.disabled = true; sendButton.textContent = '…'; }
    try {
      const result = await requestApi(`/api/me/chats/${encodeURIComponent(friendId)}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text, ...(chatReplyTo ? {replyToId:chatReplyTo.id} : {})}) });
      if (screen !== 'friends' || friendPanel !== 'chat' || (chatFriend?.userId || chatFriend?.id) !== friendId) return;
      const sent = result.message;
      if (sent) chatMessages.push({ ...sent, replyBody:chatReplyTo?.body || '', replySenderId:chatReplyTo?.senderId || '', replyCreatedAt:chatReplyTo?.createdAt || null });
      chatDraft = ''; chatReplyTo = null;
      const input = root.querySelector('[data-ir-chat-input]');
      if (input) input.value = '';
      root.querySelector('.ir-chat-replying')?.remove();
      updateChatMessageList(true);
      await loadChats(true);
    } catch (error) {
      chatStatus = error.message;
      const status = root.querySelector('.ir-chat-status');
      if (status) status.textContent = chatStatus;
      else render();
    } finally {
      chatSending = false;
      const button = root.querySelector('.ir-chat-composer button[type="submit"]');
      if (button) { button.disabled = !chatDraft.trim() || !chatCanSend; button.textContent = '↑'; }
    }
  }
  async function searchFriends() {
    const query = friendQuery.trim();
    friendResults = [];
    if (query.length < 3) { friendStatus = query ? '请输入至少 3 位账号再搜索。' : ''; render(); return; }
    const serial = ++friendSearchSerial;
    friendStatus = '正在搜索账号…'; render();
    try {
      const result = await requestApi(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (serial !== friendSearchSerial || screen !== 'friends') return;
      friendResults = result.users || []; friendStatus = '';
    } catch (error) { if (serial === friendSearchSerial) friendStatus = error.message; }
    if (serial === friendSearchSerial && screen === 'friends') render();
  }
  const friendIdentity = item => { const id = item.userId || item.id; const initial = escapeHTML((item.nickname || item.username || '?').slice(0,1).toUpperCase()); const image = item.avatarUrl ? `<img data-ir-friend-avatar="${escapeHTML(id)}" alt="" loading="lazy">` : ''; return `<span class="ir-friend-avatar">${initial}${image}</span><span class="ir-friend-copy"><strong>${escapeHTML(item.nickname || item.username)}</strong><small>ID · ${escapeHTML(item.username)}</small></span>`; };
  const chatListIdentity = item => { const id = item.userId || item.id; const initial = escapeHTML((item.nickname || item.username || '?').slice(0,1).toUpperCase()); const image = item.avatarUrl ? `<img data-ir-friend-avatar="${escapeHTML(id)}" alt="" loading="lazy">` : ''; return `<span class="ir-friend-avatar">${initial}${image}</span><span class="ir-friend-copy"><strong>${escapeHTML(item.nickname || item.username)}</strong></span>`; };
  const chatTime = value => value ? new Date(value).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
  const chatDay = value => value ? new Date(value).toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}) : '';
  const messageSenderName = message => message.senderId === accountStorageId() ? (personal.nickname || userName()) : (chatFriend?.nickname || chatFriend?.username || '好友');
  function messageAvatar(message, className = 'ir-chat-message-avatar') {
    const mine = message.senderId === accountStorageId();
    const name = mine ? '您' : (chatFriend?.nickname || chatFriend?.username || '好友');
    const image = mine && avatarUrl ? `<img src="${escapeHTML(avatarUrl)}" alt="" loading="lazy">` : !mine && chatFriend?.avatarUrl ? `<img data-ir-friend-avatar="${escapeHTML(chatFriend.userId || chatFriend.id || '')}" alt="" loading="lazy">` : '';
    return `<span class="${className}">${escapeHTML(name.slice(0,1).toUpperCase())}${image}</span>`;
  }
  function chatDivider(message, previous) {
    if (!previous || Number(message.createdAt) - Number(previous.createdAt) >= 5 * 60 * 1000) return `<div class="ir-chat-divider"><span>${escapeHTML(chatDay(message.createdAt))} · ${escapeHTML(chatTime(message.createdAt))}</span></div>`;
    return '';
  }
  function chatMessageRows() {
    const rows = chatMessages.map((message,index) => {
      const previous = chatMessages[index - 1];
      const grouped = Boolean(!message.replyToId && previous && previous.senderId === message.senderId && Number(message.createdAt) - Number(previous.createdAt) <= 3 * 60 * 1000);
      const next = chatMessages[index + 1];
      const hasContinuation = Boolean(next && !next.replyToId && next.senderId === message.senderId && Number(next.createdAt) - Number(message.createdAt) <= 3 * 60 * 1000);
      const repliedMessage = message.replyToId ? chatMessages.find(item => item.id === message.replyToId) : null;
      const replySenderId = message.replySenderId || repliedMessage?.senderId || '';
      const replyBody = message.replyBody ?? repliedMessage?.body ?? '引用的消息已过期';
      const replySenderName = replySenderId === accountStorageId() ? (personal.nickname || userName()) : (chatFriend?.nickname || chatFriend?.username || '好友');
      const quoted = message.replyToId ? `<div class="ir-chat-quoted">${messageAvatar({senderId:replySenderId}, 'ir-chat-quoted-avatar')}<span class="ir-chat-quoted-copy"><strong>${escapeHTML(replySenderName)}</strong><span>${escapeHTML(replyBody)}</span></span></div>` : '';
      const classes = `ir-chat-message${grouped ? ' is-continuation' : ''}${hasContinuation ? ' has-continuation' : ''}${message.replyToId ? ' has-reply' : ''}`;
      return `${chatDivider(message,previous)}<article class="${classes}" data-ir-message-id="${escapeHTML(message.id)}">${grouped ? '' : messageAvatar(message)}${quoted}<div class="ir-chat-message-body">${grouped ? '' : `<div class="ir-chat-message-meta"><strong>${escapeHTML(messageSenderName(message))}</strong><time>${chatTime(message.createdAt)}</time></div>`}<p>${escapeHTML(message.body)}</p></div></article>`;
    }).join('');
    return rows;
  }
  function updateChatMessageList(scrollToBottom = false) {
    const messages = root.querySelector('[data-ir-chat-messages]');
    if (!messages) return;
    messages.innerHTML = chatMessages.length ? chatMessageRows() : '<p class="ir-chat-empty">发送第一条消息，开始和好友聊天。</p>';
    if (scrollToBottom) {
      const scroll = root.querySelector('[data-ir-chat-scroll]');
      if (scroll) {
        const setLatest = () => { scroll.scrollTop = scroll.scrollHeight; };
        setLatest();
        requestAnimationFrame(setLatest);
      }
    }
    if (apiBase()) hydrateImages();
  }
  function renderChat() {
    const friend = chatFriend || {};
    const id = friend.userId || friend.id || '';
    const initial = escapeHTML((friend.nickname || friend.username || '?').slice(0,1).toUpperCase());
    const avatar = `<span class="ir-chat-avatar">${initial}${friend.avatarUrl ? `<img data-ir-friend-avatar="${escapeHTML(id)}" alt="" loading="lazy">` : ''}</span>`;
    const profile = `<section class="ir-chat-profile">${avatar}<strong>${escapeHTML(friend.nickname || friend.username || '好友')}</strong><span>ID · ${escapeHTML(friend.username || '')}</span><div><button type="button" data-ir-chat-remove>删除好友</button><button type="button" data-ir-chat-block>${chatBlockedByMe ? '取消屏蔽' : '屏蔽'}</button></div></section>`;
    const reply = chatReplyTo ? `<div class="ir-chat-replying"><span>回复 ${escapeHTML(chatReplyTo.senderName)}：${escapeHTML(chatReplyTo.body.slice(0,80))}</span><button type="button" data-ir-chat-reply-cancel aria-label="取消引用">×</button></div>` : '';
    return `<div class="ir-friends-page ir-chat-page"><header class="ir-chat-header"><button type="button" data-ir-chat-back aria-label="返回会话列表">‹</button><span class="ir-chat-header-avatar">${initial}${friend.avatarUrl ? `<img data-ir-friend-avatar="${escapeHTML(id)}" alt="" loading="lazy">` : ''}</span><div><strong>${escapeHTML(friend.nickname || friend.username || '好友')}</strong></div><button class="ir-close ir-chat-close" type="button" data-ir-close aria-label="关闭">×</button></header><div class="ir-chat-scroll" data-ir-chat-scroll>${profile}<section class="ir-chat-messages" data-ir-chat-messages>${chatBusy ? '<p class="ir-chat-empty">正在加载聊天记录…</p>' : chatMessageRows() || '<p class="ir-chat-empty">发送第一条消息，开始和好友聊天。</p>'}</section>${chatStatus ? `<p class="ir-chat-status" role="status">${escapeHTML(chatStatus)}</p>` : ''}</div>${reply}<form class="ir-chat-composer"><button class="ir-chat-plus" type="button" aria-label="添加内容" disabled>＋</button><textarea data-ir-chat-input name="text" rows="1" maxlength="2000" placeholder="${chatCanSend ? '发送消息…' : '此会话已屏蔽'}" ${chatCanSend ? '' : 'disabled'}>${escapeHTML(chatDraft)}</textarea><button class="ir-chat-send" type="submit" aria-label="发送" ${chatSending || !chatDraft.trim() || !chatCanSend ? 'disabled' : ''}>${chatSending ? '…' : '↑'}</button></form><small class="ir-chat-retention">每条消息发送 7 天后自动删除</small></div>`;
  }
  function renderFriends() {
    if (friendPanel === 'chat') return renderChat();
    const tabs = [['inbox','私聊',chatList.length],['friends','我的好友',friendData.friends.length],['incoming','好友申请',friendData.incoming.length],['outgoing','已发送',friendData.outgoing.length]];
    const users = friendsTab === 'friends' ? friendData.friends : friendsTab === 'incoming' ? friendData.incoming : friendData.outgoing;
    const chatRows = chatList.map(item => { const sender = item.lastMessageSenderId === accountStorageId() ? '您' : (item.nickname || item.username || '好友'); const preview = item.lastMessage ? `${sender}：${item.lastMessage}` : ''; return `<button type="button" class="ir-chat-list-item" data-ir-open-chat="${escapeHTML(item.userId)}">${chatListIdentity(item)}<span class="ir-chat-preview">${escapeHTML(preview)}</span><time>${chatTime(item.lastMessageAt)}</time>${item.unreadCount ? `<b class="ir-chat-unread">${item.unreadCount > 99 ? '99+' : item.unreadCount}</b>` : ''}</button>`; }).join('');
    const list = friendsTab === 'inbox' ? chatRows : users.map(item => `<article class="ir-friend-item">${friendIdentity(item)}${friendsTab === 'incoming' ? `<button type="button" data-ir-friend-accept="${escapeHTML(item.id)}">接受</button><button type="button" class="is-muted" data-ir-friend-decline="${escapeHTML(item.id)}">拒绝</button>` : friendsTab === 'outgoing' ? `<button type="button" class="is-muted" data-ir-friend-decline="${escapeHTML(item.id)}">撤回</button>` : `<button type="button" data-ir-open-chat="${escapeHTML(item.userId)}">私聊</button><button type="button" class="is-muted" data-ir-friend-remove="${escapeHTML(item.id)}">移除</button>`}</article>`).join('');
    const resultList = friendResults.map(item => `<article class="ir-friend-item">${friendIdentity(item)}<button type="button" ${item.relation ? 'disabled' : ''} data-ir-friend-add="${escapeHTML(item.username)}">${item.relation === 'friend' ? '已添加' : item.relation === 'outgoing' ? '已申请' : item.relation === 'incoming' ? '待处理' : '添加好友'}</button></article>`).join('');
    const search = friendSearchOpen ? `<form class="ir-friends-search"><input name="account" type="search" maxlength="32" autocomplete="off" placeholder="输入 Ideal ID" value="${escapeHTML(friendQuery)}"><button type="submit">搜索</button></form>` : '';
    const empty = friendsTab === 'inbox' ? '<div class="ir-inbox-empty"><span aria-hidden="true">♡</span><strong>还没有私聊</strong><small>从“我的好友”选择一位好友，开始聊天。</small></div>' : `<div class="ir-friends-empty"><span>${friendsTab === 'friends' ? '♧' : '♡'}</span><strong>${friendsTab === 'friends' ? '还没有好友' : friendsTab === 'incoming' ? '暂时没有新的好友申请' : '还没有发出好友申请'}</strong><small>${friendsTab === 'friends' ? '搜索 Ideal 账号，添加你的第一位好友。' : '新的动态会显示在这里。'}</small></div>`;
    const listContent = friendBusy && friendsTab !== 'inbox' ? '<p class="ir-friends-empty">正在加载好友…</p>' : list || empty;
    return `<div class="ir-friends-page"><header class="ir-friends-heading ir-page-heading"><h1>消息</h1><button class="ir-close ir-page-close" type="button" data-ir-close aria-label="返回桌面">×</button></header><nav class="ir-message-toolbar" aria-label="消息操作"><button type="button" class="ir-message-icon" data-ir-search-toggle aria-label="搜索好友">${profileIcon('search')}</button><button type="button" class="ir-message-inbox" data-ir-friend-inbox aria-label="私信提醒"><span>${profileIcon('mail')}</span></button><button type="button" class="ir-message-add" data-ir-add-friend><span>${profileIcon('addPerson')}</span><b>添加好友</b></button><button type="button" class="ir-message-plus" data-ir-plus aria-label="添加好友">＋</button></nav>${search}${friendStatus ? `<p class="ir-friends-status" role="status">${escapeHTML(friendStatus)}</p>` : ''}${resultList ? `<section class="ir-friends-results"><h2>搜索结果</h2>${resultList}</section>` : friendQuery.length >= 3 && !friendStatus && !friendResults.length ? '<p class="ir-friends-empty">没有找到匹配的账号。</p>' : ''}<nav class="ir-friends-tabs" aria-label="好友分类">${tabs.map(([id,label,count]) => `<button type="button" data-ir-friend-tab="${id}" class="${friendsTab === id ? 'is-selected' : ''}">${label}<span>${count}</span></button>`).join('')}</nav><section class="ir-friends-list ${friendsTab === 'inbox' ? 'is-chat-list' : ''}">${chatStatus && friendsTab === 'inbox' ? `<p class="ir-friends-status" role="status">${escapeHTML(chatStatus)}</p>` : ''}${listContent}</section></div>`;
  }
  async function sendFriendRequest(username) {
    friendBusy = true; friendStatus = ''; render();
    let message = '';
    try { await requestApi('/api/me/friends/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({accountId:username}) }); message = '好友申请已发送。'; }
    catch (error) { message = error.message; }
    await loadFriends();
    if (friendQuery) await searchFriends();
    friendStatus = message;
    if (screen === 'friends') render();
  }
  async function handleFriendRequest(id, action) {
    friendBusy = true; friendStatus = ''; render();
    if (action === 'remove' && !window.confirm('确定移除这位好友吗？')) { friendBusy = false; render(); return; }
    let message = '';
    try {
      const path = action === 'remove' ? `/api/me/friends/${encodeURIComponent(id)}` : `/api/me/friends/requests/${encodeURIComponent(id)}/${action}`;
      await requestApi(path, { method:action === 'remove' ? 'DELETE' : 'POST' });
    } catch (error) { message = error.message; }
    await loadFriends();
    friendStatus = message;
    if (screen === 'friends') render();
  }
  async function loadLikes(more = false) {
    const serial = profileSerial;
    likesStatus = '正在加载…'; render();
    try {
      const result = await requestApi(`/api/me/likes?offset=${more ? likedPosts.length : 0}`);
      if (serial !== profileSerial || profilePanel !== 'likes') return;
      likedPosts = more ? [...likedPosts, ...(result.posts || [])] : result.posts || [];
      likesMore = Boolean(result.hasMore); likesStatus = '';
    } catch (error) { if (serial !== profileSerial) return; likesStatus = error.message; }
    if (screen === 'profile') render();
  }
  const profileIcon = name => {
    const paths = { search:'<circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/>', mail:'<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>', addPerson:'<circle cx="9" cy="8" r="4"/><path d="M2.5 21v-2a6.5 6.5 0 0 1 13 0v2M19 8v8m-4-4h8"/>', beauty:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 3 0 8 4-2 4 2V3"/>', likes:'<path d="M20.5 5.5a5 5 0 0 0-8.5 2 5 5 0 0 0-8.5-2C0 10 6 15 12 20c6-5 12-10 8.5-14.5Z"/>', settings:'<path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>', friends:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>', note:'<path d="M14 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7M7 8h8M7 12h5m6 3v6m-3-3h6"/>', date:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>' };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  };
  function profileMarkup() {
    const user = window.IdealMachineAuth?.getUser?.();
    const account = escapeHTML(user?.username || '未登录');
    const joined = personal.createdAt || user?.createdAt;
    const joinedNumber = typeof joined === 'number' ? (joined < 100000000000 ? joined * 1000 : joined) : null;
    const date = joined ? new Date(joinedNumber ?? joined) : null;
    const validDate = date && Number.isFinite(date.getTime()) && date.getFullYear() >= 2000 && date.getTime() <= Date.now() + 86400000;
    const joinedMarkup = validDate ? `<section class="ir-profile-joined"><h2>加入理想机</h2><p>${profileIcon('date')}${escapeHTML(date.toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' }))}</p></section>` : '';
    const header = `<header class="ir-profile-header"><button type="button" ${profilePanel ? 'data-ir-panel-back' : 'data-ir-profile-back'} aria-label="返回">←</button><strong>${profilePanel === 'likes' ? '点赞记录' : profilePanel === 'friends' ? '好友' : '个人资料'}</strong><button type="button" data-ir-close aria-label="返回桌面">×</button></header>`;
    let content;
    if (profilePanel === 'likes') {
      content = `<div class="ir-profile-content ir-profile-list"><span class="ir-profile-eyebrow">MY LIKES</span><h2>喜欢过的灵感</h2><p class="ir-profile-muted">每一次喜欢，都留在这里。</p>${likedPosts.map(post => `<button type="button" class="ir-saved-item" data-ir-saved-post="${escapeHTML(post.id)}" data-ir-saved-channel="${escapeHTML(post.channel)}"><span><strong>${escapeHTML(post.title)}</strong><small>${escapeHTML(channels[post.channel]?.name || '')} · ${escapeHTML(post.authorName)}</small></span><b>↗</b></button>`).join('')}${likesStatus ? `<p role="status">${escapeHTML(likesStatus)}</p><button type="button" data-ir-likes>重新加载</button>` : !likedPosts.length ? '<div class="ir-profile-empty">♡<p>还没有点赞记录</p><small>在仓库中喜欢的作品会出现在这里。</small></div>' : ''}${likesMore && !likesStatus ? '<button type="button" class="ir-load-more" data-ir-more-likes>加载更多</button>' : ''}</div>`;
    } else if (profilePanel === 'friends') {
      content = `<div class="ir-profile-content ir-profile-list"><span class="ir-profile-eyebrow">FRIENDS</span><h2>我的好友</h2><div class="ir-profile-empty">${profileIcon('friends')}<p>好友列表尚未开放</p><small>好友功能接入后，会在这里显示。</small></div></div>`;
    } else {
      content = `<button type="button" class="ir-profile-cover" data-ir-change-cover aria-label="更换个人背景图"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></svg></span><input type="file" data-ir-cover-input accept="image/png,image/jpeg,image/webp" hidden></button><div class="ir-profile-content"><div class="ir-profile-identity"><label class="ir-profile-avatar-picker" aria-label="更换头像"><span class="ir-profile-big-avatar" data-ir-big-avatar></span><input type="file" data-ir-avatar-input accept="image/png,image/jpeg,image/webp" hidden></label><span class="ir-profile-eyebrow">IDEAL / PERSONAL</span></div><h1 class="ir-profile-name">${escapeHTML(userName())}</h1><p class="ir-profile-account">ID · ${account}</p><button type="button" class="ir-profile-edit" data-ir-edit>编辑个人资料 <span>↗</span></button><section class="ir-profile-about"><h2>自我介绍</h2><p>${escapeHTML(personal.bio || '还没有写自我介绍。')}</p></section>${joinedMarkup}<div class="ir-profile-rows"><button type="button" data-ir-friends><span>${profileIcon('friends')}好友</span><b>›</b></button><button type="button" data-ir-note><span>${profileIcon('note')}备注 <small>仅对你可见</small></span><b>＋</b></button>${personal.note ? `<p class="ir-profile-note">${escapeHTML(personal.note)}</p>` : ''}</div></div>`;
    }
    return `<div class="ir-profile-page">${header}${content}<nav class="ir-profile-dock" aria-label="个人页面导航"><button type="button" data-ir-legacy="beauty">${profileIcon('beauty')}<span>保存的美化</span></button><button type="button" data-ir-likes aria-current="${profilePanel === 'likes' ? 'page' : 'false'}">${profileIcon('likes')}<span>点赞记录</span></button><button type="button" data-ir-legacy="account">${profileIcon('settings')}<span>设置</span></button></nav></div>`;
  }
  function editProfile(noteOnly = false) {
    const dialog = document.createElement('dialog');
    dialog.className = 'ir-profile-dialog';
    dialog.innerHTML = `<form><header><h2>${noteOnly ? '私人备注' : '编辑个人资料'}</h2><button type="button" aria-label="关闭">×</button></header>${noteOnly ? `<label>备注（仅对你可见）<textarea name="note" maxlength="2000" rows="6">${escapeHTML(personal.note || '')}</textarea></label>` : `<label>昵称<input name="nickname" required maxlength="32" value="${escapeHTML(personal.nickname || userName())}"></label><label>ID · 账号<input value="${escapeHTML(window.IdealMachineAuth?.getUser?.()?.username || '')}" readonly></label><small>账号是你的唯一 ID，创建后不可修改。</small><label>自我介绍<textarea name="bio" maxlength="1000" rows="5">${escapeHTML(personal.bio || '')}</textarea></label>`}<p role="alert"></p><footer><button type="submit">保存</button></footer></form>`;
    root.appendChild(dialog);
    dialog.querySelector('button[type=button]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { dialog.remove(); root.querySelector(noteOnly ? '[data-ir-note]' : '[data-ir-edit]')?.focus(); });
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if ('nickname' in data && !data.nickname.trim()) { dialog.querySelector('[role=alert]').textContent = '请填写昵称。'; return; }
      const save = dialog.querySelector('[type=submit]'); save.disabled = true; save.textContent = '保存中…';
      try {
        personal = { ...personal, ...data };
        writeLocalProfile(personal);
        dialog.close();
        render();
        requestApi('/api/me/profile', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) })
          .then(result => {
            if (result.profile) {
              personal = { ...personal, ...result.profile };
              try { writeLocalProfile(personal); } catch {}
              if (screen === 'profile') render();
            }
          }).catch(() => {});
      } catch {
        const error = dialog.querySelector('[role=alert]');
        error.textContent = '保存失败，请检查设备存储空间后重试。';
        save.disabled = false; save.textContent = '保存';
      }
    };
    dialog.showModal();
  }
  function loadAvatar() {
    try { avatarUrl = localStorage.getItem(avatarStorageKey()) || ''; } catch { avatarUrl = ''; }
    try { coverUrl = localStorage.getItem(coverStorageKey()) || ''; } catch { coverUrl = ''; }
    syncProfile();
  }
  async function uploadAvatarData(data) {
    const blob = await fetch(data).then(response => response.blob());
    const form = new FormData();
    form.set('avatar', new File([blob], 'profile-avatar.jpg', { type:blob.type || 'image/jpeg' }));
    return requestApi('/api/me/avatar', { method:'POST', body:form });
  }
  async function syncAvatarWithServer() {
    if (!apiBase() || !window.IdealMachineAuth?.getToken?.()) return;
    try {
      const { profile } = await requestApi('/api/me/profile');
      // Nicknames created before profile sync was deployed only lived in this
      // browser. Publish that existing value so other users can see it in search.
      const localProfile = readLocalProfile();
      personal = {
        ...personal,
        nickname:profile?.nickname || localProfile.nickname || personal.nickname || '',
        bio:profile?.bio ?? localProfile.bio ?? personal.bio ?? '',
        note:profile?.note ?? localProfile.note ?? personal.note ?? ''
      };
      try { writeLocalProfile(personal); } catch {}
      syncProfile();
      if (!profile?.nickname && typeof localProfile.nickname === 'string' && localProfile.nickname.trim()) {
        await requestApi('/api/me/profile', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ nickname:localProfile.nickname.trim() })
        });
      }
      if (profile?.avatarUrl && !avatarUrl) {
        const response = await requestApi(profile.avatarUrl, { raw:true });
        const reader = new FileReader();
        const blob = await response.blob();
        const data = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
        avatarUrl = String(data || '');
        try { localStorage.setItem(avatarStorageKey(), avatarUrl); } catch {}
        syncProfile();
      } else if (!profile?.avatarUrl && avatarUrl) await uploadAvatarData(avatarUrl);
    } catch {}
  }
  async function saveLocalAvatar(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('头像图片无法读取。')); image.src = url; });
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .78);
      localStorage.setItem(avatarStorageKey(), data);
      avatarUrl = data; syncProfile();
      if (apiBase() && window.IdealMachineAuth?.getToken?.()) {
        try { await uploadAvatarData(data); } catch (error) { throw new Error(`头像已保存在本机，但暂未同步给其他用户：${error.message}`); }
      }
    } finally { URL.revokeObjectURL(url); }
  }
  async function saveLocalCover(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('背景图片无法读取。')); image.src = url; });
      const ratio = Math.min(1, 1440 / image.naturalWidth, 640 / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .78);
      localStorage.setItem(coverStorageKey(), data);
      coverUrl = data;
      const cover = root.querySelector('[data-ir-change-cover]');
      if (cover) cover.style.backgroundImage = `url("${data}")`;
    } finally { URL.revokeObjectURL(url); }
  }
  async function attachmentFile(attachment) {
    const response = await requestApi(`/api/attachments/${encodeURIComponent(attachment.id)}`, { raw:true });
    return new File([await response.blob()], attachment.name, { type:attachment.type });
  }
  async function importBeauty(post) {
    const beauty = window.IdealMachineBeauty;
    if (!beauty?.library) throw new Error('美化功能尚未加载。');
    let assets = [];
    if (post.codeText) {
      const result = await beauty.api(`/api/beauty/codes/${encodeURIComponent(post.codeText)}`);
      const item = result.item || result.asset || result;
      assets.push({ ...item, code:post.codeText, source:'imported-code' });
    } else {
      const file = post.attachments.find(item => /\.(json|css)$/i.test(item.name));
      if (!file) throw new Error('这篇美化帖缺少可导入的美化码、JSON 或 CSS 文件；仍可单独下载附件。');
      const source = await attachmentFile(file);
      if (/\.json$/i.test(file.name)) {
        const parsed = JSON.parse(await source.text());
        assets = (Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [parsed]).map(item => ({ ...item, source:'json' }));
      } else {
        const sections = beauty.listSections();
        const choice = window.prompt(`请选择 CSS 要存入的位置：\n${sections.map((item, index) => `${index + 1}. ${item.appName} / ${item.name}`).join('\n')}`, '1');
        if (choice === null) throw new Error('已取消保存。');
        const section = sections[Number(choice) - 1];
        if (!section) throw new Error('请选择有效的美化位置。');
        assets = [{ name:post.title, author:post.authorName, appId:section.appId, sectionId:section.id, css:await source.text(), source:'json' }];
      }
    }
    if (!assets.length || assets.some(item => !beauty.find(item.appId, item.sectionId) || !String(item.css || '').trim())) throw new Error('美化文件缺少可识别的应用、位置或 CSS。');
    for (const item of assets) {
      if (beauty.library.list().some(saved => saved.repositoryPostId === post.id && saved.appId === item.appId && saved.sectionId === item.sectionId)) continue;
      beauty.library.add({ ...item, repositoryPostId:post.id, imported:true });
    }
    window.dispatchEvent(new CustomEvent('ideal-machine-beauty-imported'));
  }
  async function importPost(post) {
    if (post.channel === 'beauty') return importBeauty(post);
    const extensions = post.channel === 'world' ? /\.(txt|docx|json)$/i : /\.(png|json|txt|docx)$/i;
    const attachment = post.attachments.find(item => extensions.test(item.name));
    if (!attachment) throw new Error('这篇帖子没有可导入的文件；仍可单独下载附件。');
    const file = await attachmentFile(attachment);
    if (post.channel === 'world') {
      await window.IdealMachineEnsureAppLoaded?.('shijieshu');
      if (!window.IdealMachineWorldbooksImportFile) throw new Error('世界书应用加载失败。');
      return window.IdealMachineWorldbooksImportFile(file);
    }
    await window.IdealMachineEnsureAppLoaded?.('liaotian');
    if (!window.IdealMachineChat?.importRepositoryCharacterFile) throw new Error('聊天应用加载失败。');
    return window.IdealMachineChat.importRepositoryCharacterFile(file, post.id);
  }
  async function savePost() {
    const post = remoteDetail;
    if (!post || saveBusy) return;
    if (!post.saved && !post.liked) { window.alert('请先点赞，再保存文件或美化码。'); return; }
    saveBusy = true; render();
    try {
      if (!post.saved) await importPost(post);
      const result = await requestApi(`/api/posts/${encodeURIComponent(post.id)}/save`, { method:post.saved ? 'DELETE' : 'POST' });
      post.saved = result.saved;
      if (result.saved) savedPosts = [post, ...savedPosts.filter(item => item.id !== post.id)];
      else savedPosts = savedPosts.filter(item => item.id !== post.id);
      render();
    } catch (error) { window.alert(error.message); }
    finally { saveBusy = false; render(); }
  }
  async function deletePost() {
    const post = remoteDetail;
    if (!post?.mine || saveBusy) return;
    if (!window.confirm('确定删除这篇帖子及其附件吗？删除后无法恢复。')) return;
    saveBusy = true; render();
    try {
      await requestApi(`/api/posts/${encodeURIComponent(post.id)}`, { method:'DELETE' });
      remotePosts = remotePosts.filter(item => item.id !== post.id);
      savedPosts = savedPosts.filter(item => item.id !== post.id);
      if (profileOrigin) show('profile');
      else { activePost = null; remoteDetail = null; remoteStatus = ''; render(); }
    } catch (error) { window.alert(error.message); }
    finally { saveBusy = false; }
  }
  function clearImages() {
    remoteImageObserver?.disconnect();
    imageUrls.forEach(url => URL.revokeObjectURL(url)); imageUrls.clear();
  }
  async function loadRemoteImage(image) {
    if (!apiBase() || !image.isConnected || image.dataset.irLoading === '1' || image.dataset.irLoaded === '1') return;
    image.dataset.irLoading = '1';
    const id = image.dataset.irImage || image.dataset.irPostAvatar || image.dataset.irFriendAvatar;
    const cachedAvatar = image.dataset.irFriendAvatar ? friendAvatarObjectUrls.get(id) : null;
    if (cachedAvatar && cachedAvatar.expiresAt > Date.now()) {
      image.src = cachedAvatar.url; image.dataset.irLoaded = '1'; delete image.dataset.irLoading; return;
    }
    if (cachedAvatar) { friendAvatarObjectUrls.delete(id); URL.revokeObjectURL(cachedAvatar.url); }
    const path = image.dataset.irImage ? `/api/attachments/${encodeURIComponent(id)}` : image.dataset.irPostAvatar ? `/api/posts/${encodeURIComponent(id)}/avatar` : `/api/users/${encodeURIComponent(id)}/avatar`;
    try {
      const response = await requestApi(path, { raw:true });
      if (!image.isConnected) return;
      const url = URL.createObjectURL(await response.blob());
      if (image.dataset.irFriendAvatar) {
        friendAvatarObjectUrls.set(id, {url, expiresAt:Date.now() + 5 * 60 * 1000});
        while (friendAvatarObjectUrls.size > 100) {
          const [oldId, oldAvatar] = friendAvatarObjectUrls.entries().next().value;
          friendAvatarObjectUrls.delete(oldId); URL.revokeObjectURL(oldAvatar.url);
        }
      } else imageUrls.add(url);
      image.src = url; image.dataset.irLoaded = '1';
    } catch {} finally { delete image.dataset.irLoading; }
  }
  const remoteImageObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      remoteImageObserver.unobserve(entry.target);
      loadRemoteImage(entry.target);
    }
  }, { rootMargin:'160px' }) : null;
  function hydrateImages() {
    if (!apiBase()) return;
    for (const image of root.querySelectorAll('[data-ir-image], [data-ir-post-avatar], [data-ir-friend-avatar]')) {
      if (image.dataset.irLoading === '1' || image.dataset.irLoaded === '1') continue;
      if (remoteImageObserver) remoteImageObserver.observe(image);
      else loadRemoteImage(image);
    }
  }
  const timeText = value => value ? new Date(value).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
  const postAvatar = post => `<span class="ir-author-avatar">${post.authorAvatar ? `<img data-ir-post-avatar="${escapeHTML(post.id)}" alt="">` : escapeHTML((post.authorName || '理')[0])}</span>`;
  const remoteCover = post => {
    const image = post.attachments?.find(file => /^image\/(png|jpeg|webp)$/.test(file.type));
    return image ? `<div class="ir-remote-cover"><img data-ir-image="${image.id}" alt="${escapeHTML(image.name)}"></div>` : `<div class="ir-remote-cover ir-remote-cover-text"><span>IDEAL / ${channels[screen].name}</span><strong>${escapeHTML(post.title)}</strong></div>`;
  };
  const uploadForm = () => `<div class="ir-upload-mask"><form class="ir-upload-form"><header><h2>发布到 # ${channels[screen].name}</h2><button type="button" data-ir-upload-close aria-label="关闭发布窗口">×</button></header><label>标题<input name="title" maxlength="120" required placeholder="给作品起个名字"></label><label>介绍（选填）<textarea name="body" maxlength="30000" rows="5" placeholder="介绍作品、用法或设定…"></textarea></label>${screen === 'beauty' ? '<label>美化码（可与文件一起发布）<input name="codeText" maxlength="120" spellcheck="false" placeholder="例如 IDEAL-CHA-123456"></label>' : ''}<label>${screen === 'beauty' ? '美化文件（与美化码至少填一项）' : '上传文件（必填）'}<input name="files" type="file" multiple ${screen === 'beauty' ? '' : 'required'} accept="${screen === 'beauty' ? '.css,.js,.json,.txt,.png,.jpg,.jpeg,.webp' : '.docx,.txt,.json,.png,.jpg,.jpeg,.webp'}"></label><small>每帖最多 3 个文件，单个不超过 8 MB</small><label>标签（选填）<input name="tags" maxlength="130" placeholder="用逗号分隔，例如：浅色、日常"></label><p class="ir-upload-error" role="alert">${escapeHTML(uploadError)}</p><footer><button type="button" data-ir-upload-close>取消</button><button type="submit" ${uploadBusy ? 'disabled' : ''}>${uploadBusy ? '发布中…' : '发布帖子'}</button></footer></form></div>`;
  const renderRemoteForum = () => {
    const post = remoteDetail;
    const header = `<header class="ir-forum-header"><button type="button" data-ir-forum-back aria-label="返回">←</button><div><strong>${activePost && post ? escapeHTML(post.title) : '# ' + channels[screen].name + ' ›'}</strong></div><button type="button" data-ir-post-search aria-label="搜索帖子">${searchIcon}</button></header>`;
    if (activePost) {
      if (!post) return `${header}<div class="ir-forum-scroll"><p class="ir-reply-empty">${escapeHTML(remoteStatus)}</p></div>`;
      return `${header}<div class="ir-forum-scroll" data-ir-post-body><article class="ir-post-detail"><div class="ir-topic-icon">●</div><h2>${escapeHTML(post.title)}</h2><div class="ir-post-tags">${post.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div><div class="ir-post-author">${postAvatar(post)}<div><strong>${escapeHTML(post.authorName)}</strong><small>作者 · ${timeText(post.createdAt)}</small></div></div><div class="ir-post-prose">${post.body.split('\n\n').map(part => `<p>${escapeHTML(part)}</p>`).join('')}</div>${post.codeText ? `<div class="ir-beauty-code"><small>美化码</small><code>${escapeHTML(post.codeText)}</code><button type="button" data-ir-copy-code ${!post.liked ? 'disabled' : ''}>${post.liked ? '复制美化码' : '点赞后可复制'}</button></div>` : post.hasCode ? '<p class="ir-post-locked">点赞后可查看并保存美化码。</p>' : ''}${remoteCover(post)}${post.attachments.map(file => `<button type="button" class="ir-post-file" data-ir-download="${file.id}" ${!post.liked ? 'disabled' : ''}><span>▤</span><span><strong>${escapeHTML(file.name)}</strong><small>${Math.round(file.size / 1024)} KB · ${post.liked ? '点击下载' : '点赞后可下载'}</small></span></button>`).join('')}<div class="ir-post-actions"><button type="button" class="ir-post-save" data-ir-save ${saveBusy || (!post.liked && !post.saved) ? 'disabled' : ''}>${saveBusy ? '保存中…' : !post.liked && !post.saved ? '先点赞，再保存' : post.saved ? '✓ 已保存 · 点击取消' : post.channel === 'beauty' ? '＋ 保存到我的美化' : post.channel === 'world' ? '＋ 保存并导入世界书' : '＋ 保存并导入联系人'}</button><button type="button" class="ir-post-like" data-ir-like="${post.id}" aria-pressed="${post.liked}">${post.liked ? '♥ 已喜欢' : '♡ 喜欢'} · ${post.likeCount}</button>${post.mine ? '<button type="button" class="ir-post-delete" data-ir-delete-post>删除帖子</button>' : ''}</div></article></div>`;
    }
    const tags = [...new Set(remotePosts.flatMap(post => post.tags))];
    return `${header}<div class="ir-forum-tools"><button type="button" data-ir-sort>⇅ ${oldestFirst ? '最早发布' : '最新发布'}</button><label>◇ 标签<select data-ir-tag aria-label="筛选标签"><option value="">全部</option>${tags.map(tag => `<option ${tag === postTag ? 'selected' : ''}>${escapeHTML(tag)}</option>`).join('')}</select></label></div><label class="ir-post-search"><span>${searchIcon}</span><input type="search" data-ir-filter placeholder="搜索帖子" value="${escapeHTML(postQuery)}"></label><div class="ir-forum-scroll" data-ir-post-list><p class="ir-forum-hint">${escapeHTML(remoteStatus || '理想机仓库 · 来自大家的作品')}</p>${remotePosts.map(post => `<article class="ir-post-card"><button type="button" class="ir-post-open" data-ir-post="${post.id}"><div class="ir-post-meta">${postAvatar(post)}<strong>${escapeHTML(post.authorName)}</strong><span>${timeText(post.createdAt)}</span></div><h2>${escapeHTML(post.title)}</h2>${remoteCover(post)}<div class="ir-post-tags">${post.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div></button><footer><button type="button" data-ir-like="${post.id}" aria-pressed="${post.liked}">${post.liked ? '♥' : '♡'} ${post.likeCount}</button></footer></article>`).join('') || (remoteStatus ? '' : '<p class="ir-reply-empty">这里还没有帖子，发布第一篇吧。</p>')}${remoteHasMore ? '<button type="button" class="ir-load-more" data-ir-load-more>加载更多帖子</button>' : ''}</div><button class="ir-post-create" type="button" data-ir-upload aria-label="发布帖子">＋</button>`;
  };
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>';
  const userName = () => {
    const user = window.IdealMachineAuth?.getUser?.();
    return String(personal.nickname || user?.username || user?.name || user?.email?.split('@')[0] || '我的主页');
  };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const syncProfile = () => {
    const name = userName();
    root.querySelector('[data-ir-username]').textContent = name;
    const cover = root.querySelector('[data-ir-change-cover]');
    if (cover) cover.style.backgroundImage = coverUrl ? `url("${coverUrl}")` : '';
    root.querySelectorAll('[data-ir-avatar], [data-ir-big-avatar]').forEach(node => {
      node.textContent = avatarUrl ? '' : name === '我的主页' ? '我' : name.slice(0, 1).toUpperCase();
      if (avatarUrl) { const image = document.createElement('img'); image.src = avatarUrl; image.alt = ''; node.appendChild(image); }
    });
  };
  const render = () => {
    syncProfile();
    root.classList.toggle('ir-forum-mode', Boolean(channels[screen]));
    root.classList.toggle('ir-profile-mode', screen === 'profile');
    root.classList.toggle('ir-chat-mode', screen === 'friends' && friendPanel === 'chat');
    root.classList.toggle('ir-show-detail', screen !== 'welcome');
    root.querySelectorAll('[data-ir-channel]').forEach(button => button.classList.toggle('is-selected', button.dataset.irChannel === screen));
    root.querySelector('[data-ir-profile]').classList.toggle('is-selected', screen === 'profile');
    root.querySelector('[data-ir-friends-open]').classList.toggle('is-active', screen === 'friends');
    root.querySelector('[data-ir-home]').classList.toggle('is-active', screen !== 'friends');
    const main = root.querySelector('[data-ir-main]');
    if (screen === 'welcome') {
      main.innerHTML = `<div class="ir-hero"><div class="ir-hero-mark">✳</div><span class="ir-kicker">WELCOME TO THE ARCHIVE</span><h2>灵感在这里<br>有了自己的位置。</h2><p>美化、世界设定与角色故事，收进同一个仓库。先从左侧选一个频道看看。</p><div class="ir-hero-rule"></div><span class="ir-hero-foot">IDEAL MACHINE · 01 / 03</span></div><div class="ir-category-grid">${Object.entries(channels).map(([key, item], index) => `<button type="button" class="ir-category" data-ir-channel="${key}"><span class="ir-category-top">0${index + 1} / COLLECTION <span>↗</span></span><span class="ir-category-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.description}</small></button>`).join('')}</div>`;
    } else if (['members', 'events', 'notifications'].includes(screen)) {
      const title = { members: '社区成员', events: '社区活动', notifications: '通知' }[screen];
      main.innerHTML = `<div class="ir-content"><h2>${title}</h2><p class="ir-preview-note">${screen === 'notifications' ? '暂时没有新通知。' : '仓库上线后，这里会展示' + title + '。'}</p></div>`;
    } else if (screen === 'activity') {
      main.innerHTML = `<div class="ir-content"><header class="ir-page-heading ir-content-heading"><h2>最近动态</h2><button class="ir-close ir-page-close" type="button" data-ir-close aria-label="返回桌面">×</button></header><p class="ir-preview-note">暂时没有动态。仓库上线后，可以在这里查看新的作品与互动。</p></div>`;
    } else if (screen === 'friends') {
      clearImages();
      main.innerHTML = renderFriends();
      if (apiBase()) hydrateImages();
    } else if (screen === 'profile') {
      main.innerHTML = profileMarkup();
      syncProfile();
    } else {
      clearImages();
      main.innerHTML = renderRemoteForum() + (uploadOpen ? uploadForm() : '');
      if (apiBase()) hydrateImages();
    }
  };
  const show = next => {
    if (next !== 'friends') stopChatPolling();
    screen = next; activePost = null; postQuery = '';
    if (next !== 'friends') ++friendSearchSerial; postTag = ''; listScroll = 0; uploadOpen = false;
    profileOrigin = false;
    remotePosts = []; remoteDetail = null; remoteStatus = '';
    ++requestSerial; render();
    if (channels[screen]) loadPosts();
    if (screen === 'profile') { loadProfile().then(() => { if (profilePanel === 'likes') loadLikes(); }); }
    if (screen === 'friends') loadFriends();
  };
  const open = () => { personal = readLocalProfile(); show('welcome'); root.classList.add('is-open'); syncViewport(); loadAvatar(); syncAvatarWithServer(); };
  const close = () => {
    stopChatPolling();
    if (root.contains(document.activeElement)) document.activeElement.blur();
    root.classList.remove('is-open');
    root.style.removeProperty('height'); root.style.removeProperty('top'); root.style.removeProperty('--ir-profile-keyboard-offset');
  };
  root.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-ir-change-cover')) { root.querySelector('[data-ir-cover-input]')?.click(); return; }
    if (button.hasAttribute('data-ir-edit')) return editProfile();
    if (button.hasAttribute('data-ir-note')) return editProfile(true);
    if (button.hasAttribute('data-ir-friends')) { profilePanel = ''; friendsTab = 'friends'; friendQuery = ''; friendResults = []; friendStatus = ''; return show('friends'); }
    if (button.hasAttribute('data-ir-panel-back')) { profilePanel = ''; render(); return; }
    if (button.hasAttribute('data-ir-likes')) { profilePanel = 'likes'; likedPosts = []; loadLikes(); return; }
    if (button.hasAttribute('data-ir-more-likes')) { loadLikes(true); return; }
    if (button.hasAttribute('data-ir-upload-close')) { uploadOpen = false; uploadError = ''; render(); return; }
    if (button.hasAttribute('data-ir-copy-code')) {
      if (!remoteDetail?.liked) return;
      const code = remoteDetail?.codeText || '';
      if (!code) return;
      const copy = navigator.clipboard?.writeText?.(code);
      if (copy) copy.then(() => { button.textContent = '已复制美化码'; }).catch(() => window.prompt('复制美化码', code));
      else window.prompt('复制美化码', code);
      return;
    }
    if (button.hasAttribute('data-ir-load-more')) { loadMorePosts(); return; }
    if (button.hasAttribute('data-ir-delete-post')) { deletePost(); return; }
    if (button.hasAttribute('data-ir-save')) { savePost(); return; }
    if (button.hasAttribute('data-ir-profile-back')) { show('welcome'); return; }
    if (button.dataset.irSavedPost) {
      const channel = button.dataset.irSavedChannel;
      if (!channels[channel]) return;
      screen = channel; activePost = button.dataset.irSavedPost; profileOrigin = true;
      remoteDetail = null; render(); loadPost(activePost); return;
    }
    if (button.dataset.irDownload) {
      if (!remoteDetail?.liked) return;
      const id = button.dataset.irDownload;
      requestApi(`/api/attachments/${encodeURIComponent(id)}?download=1`, { raw:true }).then(async response => {
        const file = remoteDetail?.attachments.find(item => item.id === id);
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a'); link.href = url; link.download = file?.name || '附件'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }).catch(error => window.alert(error.message));
      return;
    }
    if (button.hasAttribute('data-ir-forum-back')) {
      if (uploadOpen) { uploadOpen = false; render(); return; }
      if (!activePost) return show('welcome');
      if (profileOrigin) return show('profile');
      activePost = null; remoteDetail = null; ++requestSerial; render();
      const list = root.querySelector('[data-ir-post-list]');
      if (list) list.scrollTop = listScroll;
      return;
    }
    if (button.dataset.irPost) {
      profileOrigin = false;
      listScroll = root.querySelector('[data-ir-post-list]')?.scrollTop || 0;
      activePost = button.dataset.irPost;
      loadPost(activePost);
      return;
    }
    if (button.dataset.irLike) {
      const id = button.dataset.irLike;
      if (apiBase()) {
        button.disabled = true;
        requestApi(`/api/posts/${encodeURIComponent(id)}/like`, { method:'POST' }).then(result => {
          const item = remotePosts.find(post => post.id === id);
          if (item) { item.liked = result.liked; item.likeCount = result.likeCount; }
          if (remoteDetail?.id === id) {
            remoteDetail.liked = result.liked; remoteDetail.likeCount = result.likeCount;
            if (result.liked) return loadPost(id);
            remoteDetail.codeText = '';
          }
          render();
        }).catch(error => { button.disabled = false; window.alert(error.message); });
        return;
      }
      window.alert('仓库服务尚未配置。');
      return;
    }
    if (button.hasAttribute('data-ir-sort')) { oldestFirst = !oldestFirst; loadPosts(); return; }
    if (button.hasAttribute('data-ir-post-search')) {
      if (activePost) { activePost = null; render(); }
      root.querySelector('[data-ir-filter]')?.focus(); return;
    }
    if (button.hasAttribute('data-ir-close')) return close();
    if (button.hasAttribute('data-ir-home')) return show('welcome');
    if (button.hasAttribute('data-ir-friends-open') || button.hasAttribute('data-ir-friends')) { profilePanel = ''; friendsTab = 'friends'; friendPanel = ''; friendSearchOpen = false; friendQuery = ''; friendResults = []; friendStatus = ''; return show('friends'); }
    if (button.hasAttribute('data-ir-inbox-back')) { friendPanel = ''; friendsTab = 'friends'; chatStatus = ''; stopChatPolling(); return render(); }
    if (button.hasAttribute('data-ir-chat-back')) { chatFriend = null; friendPanel = ''; friendsTab = 'inbox'; chatDraft = ''; render(); startChatPolling(); loadChats(); return; }
    if (button.hasAttribute('data-ir-chat-reply-cancel')) { chatReplyTo = null; render(); root.querySelector('[data-ir-chat-input]')?.focus(); return; }
    if (button.hasAttribute('data-ir-chat-remove')) {
      if (!chatFriend || !window.confirm(`确定删除好友「${chatFriend.nickname || chatFriend.username}」吗？`)) return;
      try {
        await requestApi(`/api/me/friends/${encodeURIComponent(chatFriend.id)}`, {method:'DELETE'});
        chatFriend = null; chatMessages = []; chatDraft = ''; chatReplyTo = null; friendPanel = ''; chatStatus = '';
        await Promise.all([loadFriends(),loadChats(true)]); render();
      } catch (error) { chatStatus = error.message; render(); }
      return;
    }
    if (button.hasAttribute('data-ir-chat-block')) {
      if (!chatFriend) return;
      const friendId = chatFriend.userId || chatFriend.id;
      const block = !chatBlockedByMe;
      if (block && !window.confirm(`屏蔽「${chatFriend.nickname || chatFriend.username}」后，双方将无法继续发送私聊消息。`)) return;
      button.disabled = true;
      try {
        await requestApi(`/api/me/blocks/${encodeURIComponent(friendId)}`, {method:block ? 'POST' : 'DELETE'});
        chatBlockedByMe = block; chatCanSend = !block; chatStatus = block ? '已屏蔽此好友。' : '已取消屏蔽。';
        await loadChats(true); render();
      } catch (error) { chatStatus = error.message; render(); }
      return;
    }
    if (button.hasAttribute('data-ir-friend-inbox')) { friendPanel = ''; friendsTab = 'inbox'; chatStatus = ''; render(); startChatPolling(); loadChats(); return; }
    if (button.dataset.irOpenChat) {
      const friend = [...friendData.friends, ...chatList].find(item => item.userId === button.dataset.irOpenChat);
      return openChat(friend);
    }
    if (button.hasAttribute('data-ir-search-toggle')) { friendSearchOpen = !friendSearchOpen; render(); if (friendSearchOpen) root.querySelector('.ir-friends-search input')?.focus(); return; }
    if (button.hasAttribute('data-ir-add-friend') || button.hasAttribute('data-ir-plus')) { friendPanel = ''; friendsTab = 'friends'; friendSearchOpen = true; render(); root.querySelector('.ir-friends-search input')?.focus(); return; }
    if (button.dataset.irFriendTab) {
      friendPanel = ''; friendsTab = button.dataset.irFriendTab; chatStatus = '';
      render();
      if (friendsTab === 'inbox') { startChatPolling(); loadChats(); }
      else stopChatPolling();
      return;
    }
    if (button.dataset.irFriendAdd) return sendFriendRequest(button.dataset.irFriendAdd);
    if (button.dataset.irFriendAccept) return handleFriendRequest(button.dataset.irFriendAccept, 'accept');
    if (button.dataset.irFriendDecline) return handleFriendRequest(button.dataset.irFriendDecline, friendsTab === 'outgoing' ? 'cancel' : 'decline');
    if (button.dataset.irFriendRemove) return handleFriendRequest(button.dataset.irFriendRemove, 'remove');
    if (button.hasAttribute('data-ir-activity')) return show('activity');
    if (button.hasAttribute('data-ir-members')) return show('members');
    if (button.hasAttribute('data-ir-events')) return show('events');
    if (button.hasAttribute('data-ir-notifications')) return show('notifications');
    if (button.hasAttribute('data-ir-back')) return show('welcome');
    if (button.hasAttribute('data-ir-profile')) { profilePanel = ''; return show('profile'); }
    if (button.dataset.irChannel) return show(button.dataset.irChannel);
    if (button.dataset.irLegacy) return window.IdealMachineOpenBeautyCenter?.(button.dataset.irLegacy);
    if (button.hasAttribute('data-ir-upload')) { uploadOpen = true; uploadError = ''; render(); }
  });
  root.querySelector('[data-ir-search]').addEventListener('input', event => {
    const query = event.target.value.trim().toLocaleLowerCase();
    let visible = 0;
    root.querySelectorAll('.ir-channel-nav [data-ir-channel]').forEach(button => {
      const matches = button.textContent.toLocaleLowerCase().includes(query);
      button.hidden = !matches;
      if (matches) visible++;
    });
    root.querySelector('.ir-empty-search').hidden = visible > 0;
  });
  root.addEventListener('input', event => {
    if (event.target.matches('[data-ir-chat-input]')) {
      chatDraft = event.target.value;
      const send = root.querySelector('.ir-chat-composer button[type="submit"]');
      if (send) send.disabled = chatSending || !chatDraft.trim() || !chatCanSend;
      return;
    }
    if (!event.target.matches('[data-ir-filter]')) return;
    if (event.isComposing) return;
    postQuery = event.target.value;
    if (apiBase()) { clearTimeout(searchTimer); searchTimer = setTimeout(loadPosts, 300); return; }
    render();
    root.querySelector('[data-ir-filter]').focus();
  });
  root.addEventListener('keydown', event => {
    if (!event.target.matches('[data-ir-chat-input]') || event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!chatSending && chatCanSend && chatDraft.trim()) root.querySelector('.ir-chat-composer')?.requestSubmit();
  });
  root.addEventListener('compositionend', event => {
    if (!event.target.matches('[data-ir-filter]')) return;
    postQuery = event.target.value;
    if (apiBase()) { clearTimeout(searchTimer); searchTimer = setTimeout(loadPosts, 300); return; }
    render();
    root.querySelector('[data-ir-filter]').focus();
  });
  root.addEventListener('change', event => {
    if (event.target.matches('[data-ir-cover-input]')) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) { window.alert('请选择不超过 8 MB 的 PNG、JPEG 或 WebP 背景图片。'); event.target.value = ''; return; }
      saveLocalCover(file).catch(error => window.alert(error.message));
      event.target.value = '';
      return;
    }
    if (event.target.matches('[data-ir-avatar-input]')) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) { window.alert('请选择不超过 2 MB 的 PNG、JPEG 或 WebP 图片。'); return; }
      saveLocalAvatar(file).catch(error => window.alert(error.message));
      return;
    }
    if (!event.target.matches('[data-ir-tag]')) return;
    postTag = event.target.value; loadPosts();
  });
  root.addEventListener('submit', async event => {
    if (event.target.matches('.ir-chat-composer')) { await sendChatMessage(event); return; }
    if (event.target.matches('.ir-friends-search')) { event.preventDefault(); friendQuery = String(new FormData(event.target).get('account') || '').trim(); searchFriends(); return; }
    if (event.target.matches('.ir-upload-form')) {
      event.preventDefault();
      if (uploadBusy) return;
      const form = event.target;
      const data = new FormData(form);
      data.set('channel', screen);
      if (avatarUrl) {
        try {
          const blob = await fetch(avatarUrl).then(response => response.blob());
          data.set('avatar', new File([blob], 'avatar.jpg', { type:'image/jpeg' }));
        } catch { uploadError = '头像快照读取失败，请重新选择头像。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      }
      for (const file of data.getAll('files')) if (!(file instanceof File) || !file.name) data.delete('files');
      const files = data.getAll('files');
      const code = String(data.get('codeText') || '').trim();
      if (screen === 'beauty' && !files.length && !code) { uploadError = '请填写美化码或上传美化文件。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      if (screen !== 'beauty' && !files.length) { uploadError = '请先上传文件。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      const importable = { beauty:/\.(css|json)$/i, world:/\.(txt|docx|json)$/i, character:/\.(png|txt|docx|json)$/i }[screen];
      if (!code && !files.some(file => importable.test(file.name))) { uploadError = '请上传可导入的主文件，图片可以作为附加预览。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      if (code && !/^IDEAL-[A-Z0-9-]{3,100}$/i.test(code)) { uploadError = '请输入已有的 IDEAL- 美化码。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      if (data.getAll('files').length > 3) { uploadError = '每篇帖子最多上传 3 个文件。'; form.querySelector('.ir-upload-error').textContent = uploadError; return; }
      uploadBusy = true;
      form.querySelector('button[type=submit]').disabled = true;
      form.querySelector('button[type=submit]').textContent = '发布中…';
      requestApi('/api/posts', { method:'POST', body:data }).then(async result => {
        uploadOpen = false; uploadError = ''; uploadBusy = false;
        await loadPosts(); activePost = result.id; await loadPost(result.id);
      }).catch(error => {
        uploadBusy = false; uploadError = error.message;
        form.querySelector('.ir-upload-error').textContent = uploadError;
        form.querySelector('button[type=submit]').disabled = false;
        form.querySelector('button[type=submit]').textContent = '发布帖子';
      });
      return;
    }
  });
  root.addEventListener('pointerdown', event => {
    const message = event.target.closest?.('[data-ir-message-id]');
    if (!message || event.button !== 0) return;
    chatSwipeStart = { id:message.dataset.irMessageId, x:event.clientX, y:event.clientY };
  });
  root.addEventListener('pointerup', event => {
    if (!chatSwipeStart) return;
    const start = chatSwipeStart; chatSwipeStart = null;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (dx < 64 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    const message = chatMessages.find(item => item.id === start.id);
    if (!message) return;
    chatReplyTo = {id:message.id,senderId:message.senderId,senderName:messageSenderName(message),body:message.body,createdAt:message.createdAt};
    const scrollTop = root.querySelector('[data-ir-chat-scroll]')?.scrollTop || 0;
    render();
    const scroll = root.querySelector('[data-ir-chat-scroll]');
    if (scroll) scroll.scrollTop = scrollTop;
    root.querySelector('[data-ir-chat-input]')?.focus();
  });
  root.addEventListener('pointercancel', () => { chatSwipeStart = null; });
  const syncViewport = () => {
    const viewport = window.visualViewport;
    if (!viewport || !root.classList.contains('is-open')) return;
    const width = window.innerWidth || document.documentElement.clientWidth;
    const visibleBottom = viewport.height + viewport.offsetTop;
    if (!profileViewportBaselineHeight || Math.abs(width - profileViewportBaselineWidth) > 40) {
      profileViewportBaselineHeight = Math.max(window.innerHeight || 0, visibleBottom);
      profileViewportBaselineWidth = width;
    } else if (visibleBottom > profileViewportBaselineHeight) profileViewportBaselineHeight = visibleBottom;
    const focusedEditable = root.contains(document.activeElement) && document.activeElement.matches('textarea,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="color"]):not([type="range"])');
    const keyboardHeight = Math.max(0, profileViewportBaselineHeight - visibleBottom);
    const keyboardOpen = focusedEditable && (document.body.classList.contains('ideal-keyboard-open') || keyboardHeight > 100);
    root.style.setProperty('--ir-profile-keyboard-offset', `${keyboardOpen ? keyboardHeight : 0}px`);
    root.style.height = `${viewport.height}px`;
    root.style.top = `${viewport.offsetTop}px`;
    if (keyboardOpen && root.classList.contains('ir-chat-mode')) {
      requestAnimationFrame(() => {
        const scroll = root.querySelector('[data-ir-chat-scroll]');
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
      });
    }
  };
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-app-key="ideal"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !root.classList.contains('is-open')) return;
    if (root.querySelector('dialog[open]')) return;
    if (screen === 'profile' && profilePanel) { profilePanel = ''; render(); }
    else if (activePost && profileOrigin) show('profile');
    else if (activePost) { activePost = null; render(); }
    else if (screen === 'welcome') close(); else show('welcome');
  });
  window.addEventListener('ideal-machine-auth-changed', () => {
    ++profileSerial; personal = {}; profilePanel = ''; likedPosts = []; friendData = { friends:[], incoming:[], outgoing:[] }; friendResults = [];
    stopChatPolling(); chatList = []; chatFriend = null; chatMessages = []; chatDraft = ''; chatStatus = ''; ++chatRequestSerial;
    friendAvatarObjectUrls.forEach(avatar => URL.revokeObjectURL(avatar.url)); friendAvatarObjectUrls.clear();
    root.querySelector('dialog')?.close();
    savedPosts = [];
    avatarUrl = '';
    syncProfile();
    if (screen === 'profile') { loadProfile().then(() => { if (profilePanel === 'likes') loadLikes(); }); }
    if (screen === 'friends') loadFriends();
    personal = readLocalProfile();
    loadAvatar();
    syncAvatarWithServer();
  });
  window.IdealMachineRepository = { open, close };
})();
