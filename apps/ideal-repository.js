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
        <button class="ir-rail-tool" type="button" data-ir-home aria-label="仓库首页"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 3a9 9 0 0 0-7.4 14.1L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/></svg></button>
        <button class="ir-rail-tool" type="button" data-ir-activity aria-label="最近动态"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v3c0 3-3 4-5 6 2 2 5 3 5 6v3H6v-3c0-3 3-4 5-6-2-2-5-3-5-6V3Z"/><path d="M9 6h6m-6 12h6"/></svg></button>
        <span class="ir-rail-line"></span>
        <button class="ir-server is-active" type="button" data-ir-home aria-label="理想机服务器"><img src="assets/icons/default-ios17/ideal.webp" alt=""></button>
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
  let profileStatus = '';
  let profileOrigin = false;
  let avatarUrl = '';
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
  const imageUrls = new Set();
  const avatarStorageKey = () => `ideal-repository-avatar-v1:${window.IdealMachineAuth?.getUser?.()?.id || 'guest'}`;
  const apiBase = () => String(window.IdealMachineConfig?.repositoryApiBase || '').replace(/\/+$/, '');
  const apiError = { UNAUTHORIZED:'请先登录理想机账号', AUTH_SERVICE_UNAVAILABLE:'账号服务暂时不可用', INVALID_POST:'请填写标题并检查字数', BEAUTY_CODE_OR_FILE_REQUIRED:'美化帖需要美化码或文件', FILE_REQUIRED:'世界书和角色卡必须上传文件', IMPORTABLE_FILE_REQUIRED:'请上传可导入的主文件，图片可以作为附加预览', CODE_NOT_ALLOWED:'这个频道只能上传文件', INVALID_BEAUTY_CODE:'请输入已有的 IDEAL- 美化码', INVALID_AVATAR:'请选择不超过 512 KB 的 PNG、JPEG 或 WebP 头像', LIKE_REQUIRED:'请先点赞，再保存文件或美化码', FORBIDDEN:'你只能删除自己发布的帖子', TOO_MANY_FILES:'每篇帖子最多上传 3 个文件', INVALID_FILE_TYPE_OR_SIZE:'文件格式不支持，或单个文件超过 8 MB', REQUEST_TOO_LARGE:'附件总大小超过限制', POST_RATE_LIMIT:'发布太频繁，请稍后再试' };
  async function requestApi(path, options = {}) {
    if (!apiBase()) throw new Error('仓库后端尚未部署或配置。请先设置 repositoryApiBase。');
    const token = window.IdealMachineAuth?.getToken?.();
    if (!token) throw new Error('请先登录理想机账号。');
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${apiBase()}${path}`, { ...options, headers, credentials:'omit', cache:'no-store' });
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
    if (!apiBase()) { savedPosts = []; profileStatus = '仓库服务尚未配置，暂时无法同步收藏。'; render(); return; }
    profileStatus = '正在加载收藏…'; render();
    try {
      const result = await requestApi('/api/me/saved');
      if (screen !== 'profile') return;
      savedPosts = result.posts || []; profileStatus = ''; render();
    } catch (error) { if (screen === 'profile') { profileStatus = error.message; render(); } }
  }
  function loadAvatar() {
    try { avatarUrl = localStorage.getItem(avatarStorageKey()) || ''; } catch { avatarUrl = ''; }
    syncProfile();
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
    imageUrls.forEach(url => URL.revokeObjectURL(url)); imageUrls.clear();
  }
  async function hydrateImages() {
    if (!apiBase()) return;
    for (const image of root.querySelectorAll('[data-ir-image], [data-ir-post-avatar]')) {
      const id = image.dataset.irImage || image.dataset.irPostAvatar;
      const path = image.dataset.irImage ? `/api/attachments/${encodeURIComponent(id)}` : `/api/posts/${encodeURIComponent(id)}/avatar`;
      try {
        const response = await requestApi(path, { raw:true });
        if (!image.isConnected) continue;
        const url = URL.createObjectURL(await response.blob());
        imageUrls.add(url); image.src = url;
      } catch {}
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
    return String(user?.username || user?.name || user?.email?.split('@')[0] || '我的主页');
  };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const syncProfile = () => {
    const name = userName();
    root.querySelector('[data-ir-username]').textContent = name;
    root.querySelectorAll('[data-ir-avatar], [data-ir-big-avatar]').forEach(node => {
      node.textContent = avatarUrl ? '' : name === '我的主页' ? '我' : name.slice(0, 1).toUpperCase();
      if (avatarUrl) { const image = document.createElement('img'); image.src = avatarUrl; image.alt = ''; node.appendChild(image); }
    });
  };
  const render = () => {
    syncProfile();
    root.classList.toggle('ir-forum-mode', Boolean(channels[screen]));
    root.classList.toggle('ir-profile-mode', screen === 'profile');
    root.classList.toggle('ir-show-detail', screen !== 'welcome');
    root.querySelectorAll('[data-ir-channel]').forEach(button => button.classList.toggle('is-selected', button.dataset.irChannel === screen));
    root.querySelector('[data-ir-profile]').classList.toggle('is-selected', screen === 'profile');
    const main = root.querySelector('[data-ir-main]');
    if (screen === 'welcome') {
      main.innerHTML = `<div class="ir-hero"><div class="ir-hero-mark">✳</div><span class="ir-kicker">WELCOME TO THE ARCHIVE</span><h2>灵感在这里<br>有了自己的位置。</h2><p>美化、世界设定与角色故事，收进同一个仓库。先从左侧选一个频道看看。</p><div class="ir-hero-rule"></div><span class="ir-hero-foot">IDEAL MACHINE · 01 / 03</span></div><div class="ir-category-grid">${Object.entries(channels).map(([key, item], index) => `<button type="button" class="ir-category" data-ir-channel="${key}"><span class="ir-category-top">0${index + 1} / COLLECTION <span>↗</span></span><span class="ir-category-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.description}</small></button>`).join('')}</div>`;
    } else if (['members', 'events', 'notifications'].includes(screen)) {
      const title = { members: '社区成员', events: '社区活动', notifications: '通知' }[screen];
      main.innerHTML = `<div class="ir-content"><h2>${title}</h2><p class="ir-preview-note">${screen === 'notifications' ? '暂时没有新通知。' : '仓库上线后，这里会展示' + title + '。'}</p></div>`;
    } else if (screen === 'activity') {
      main.innerHTML = `<div class="ir-content"><h2>最近动态</h2><p class="ir-preview-note">暂时没有动态。仓库上线后，可以在这里查看新的作品与互动。</p></div>`;
    } else if (screen === 'profile') {
      const name = escapeHTML(userName());
      main.innerHTML = `<div class="ir-profile-page"><header class="ir-profile-header"><button type="button" data-ir-profile-back aria-label="返回仓库">←</button><strong>个人主页</strong><button type="button" data-ir-close aria-label="返回桌面">×</button></header><div class="ir-profile-content"><div class="ir-profile-hero"><label class="ir-profile-avatar-picker"><span class="ir-profile-big-avatar" data-ir-big-avatar></span><span>更换头像</span><input type="file" data-ir-avatar-input accept="image/png,image/jpeg,image/webp" hidden></label><div><h2>${name}</h2><p>收藏的作品都在这里，点开可以回到原帖。</p></div></div><div class="ir-profile-links"><button type="button" data-ir-legacy="beauty"><span>✦</span><span><strong>我的美化</strong><small>查看已导入的美化</small></span><span>↗</span></button><button type="button" data-ir-legacy="account"><span>◯</span><span><strong>账号设置</strong><small>管理理想机账号</small></span><span>↗</span></button></div><div class="ir-saved-groups">${Object.entries(channels).map(([key, channel]) => `<section class="ir-saved-group"><h3>${channel.icon} 保存的${channel.name}</h3>${savedPosts.filter(post => post.channel === key).map(post => `<button type="button" class="ir-saved-item" data-ir-saved-post="${post.id}" data-ir-saved-channel="${key}"><span><strong>${escapeHTML(post.title)}</strong><small>${escapeHTML(post.authorName)} · ${timeText(post.createdAt)}</small></span><b>查看原帖 ↗</b></button>`).join('') || '<p>还没有保存的帖子。</p>'}</section>`).join('')}</div>${profileStatus ? `<p class="ir-profile-status">${escapeHTML(profileStatus)}</p>` : ''}</div></div>`;
      syncProfile();
    } else {
      clearImages();
      main.innerHTML = renderRemoteForum() + (uploadOpen ? uploadForm() : '');
      if (apiBase()) hydrateImages();
    }
  };
  const show = next => {
    screen = next; activePost = null; postQuery = ''; postTag = ''; listScroll = 0; uploadOpen = false;
    profileOrigin = false;
    remotePosts = []; remoteDetail = null; remoteStatus = '';
    ++requestSerial; render();
    if (channels[screen]) loadPosts();
    if (screen === 'profile') loadProfile();
  };
  const open = () => { show('welcome'); root.classList.add('is-open'); syncViewport(); loadAvatar(); };
  const close = () => {
    if (root.contains(document.activeElement)) document.activeElement.blur();
    root.classList.remove('is-open');
    root.style.removeProperty('height'); root.style.removeProperty('top');
  };
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
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
    if (button.hasAttribute('data-ir-activity')) return show('activity');
    if (button.hasAttribute('data-ir-members')) return show('members');
    if (button.hasAttribute('data-ir-events')) return show('events');
    if (button.hasAttribute('data-ir-notifications')) return show('notifications');
    if (button.hasAttribute('data-ir-back')) return show('welcome');
    if (button.hasAttribute('data-ir-profile')) return show('profile');
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
    if (!event.target.matches('[data-ir-filter]')) return;
    if (event.isComposing) return;
    postQuery = event.target.value;
    if (apiBase()) { clearTimeout(searchTimer); searchTimer = setTimeout(loadPosts, 300); return; }
    render();
    root.querySelector('[data-ir-filter]').focus();
  });
  root.addEventListener('compositionend', event => {
    if (!event.target.matches('[data-ir-filter]')) return;
    postQuery = event.target.value;
    if (apiBase()) { clearTimeout(searchTimer); searchTimer = setTimeout(loadPosts, 300); return; }
    render();
    root.querySelector('[data-ir-filter]').focus();
  });
  root.addEventListener('change', event => {
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
  const syncViewport = () => {
    const viewport = window.visualViewport;
    if (!viewport || !root.classList.contains('is-open')) return;
    root.style.height = `${viewport.height}px`;
    root.style.top = `${viewport.offsetTop}px`;
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
    if (activePost) { activePost = null; render(); }
    else if (screen === 'welcome') close(); else show('welcome');
  });
  window.addEventListener('ideal-machine-auth-changed', () => {
    savedPosts = [];
    avatarUrl = '';
    syncProfile();
    if (screen === 'profile') loadProfile();
    loadAvatar();
  });
  window.IdealMachineRepository = { open, close };
})();
