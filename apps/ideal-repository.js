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
      <header class="ir-app-topbar"><button class="ir-close" type="button" data-ir-close aria-label="返回桌面">×</button></header>
      <aside class="ir-rail" aria-label="服务器">
        <button class="ir-rail-tool" type="button" data-ir-home aria-label="仓库首页"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 3a9 9 0 0 0-7.4 14.1L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/></svg></button>
        <button class="ir-rail-tool" type="button" data-ir-activity aria-label="最近动态"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v3c0 3-3 4-5 6 2 2 5 3 5 6v3H6v-3c0-3 3-4 5-6-2-2-5-3-5-6V3Z"/><path d="M9 6h6m-6 12h6"/></svg></button>
        <span class="ir-rail-line"></span>
        <button class="ir-server is-active" type="button" data-ir-home aria-label="理想机服务器"><img src="assets/icons/default-ios17/ideal.webp" alt=""></button>
      </aside>
      <aside class="ir-sidebar">
        <header class="ir-sidebar-header"><h1>理想机 <span>›</span></h1></header>
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
  const userName = () => {
    const user = window.IdealMachineAuth?.getUser?.();
    return String(user?.username || user?.name || user?.email?.split('@')[0] || '我的主页');
  };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const syncProfile = () => {
    const name = userName();
    root.querySelector('[data-ir-username]').textContent = name;
    root.querySelector('[data-ir-avatar]').textContent = name === '我的主页' ? '我' : name.slice(0, 1).toUpperCase();
  };
  const render = () => {
    syncProfile();
    root.classList.toggle('ir-show-detail', screen !== 'welcome');
    root.querySelectorAll('[data-ir-channel]').forEach(button => button.classList.toggle('is-selected', button.dataset.irChannel === screen));
    root.querySelector('[data-ir-profile]').classList.toggle('is-selected', screen === 'profile');
    const main = root.querySelector('[data-ir-main]');
    if (screen === 'welcome') {
      main.innerHTML = `<div class="ir-main-top"><span>理想机 / 总仓库</span><span>UI PREVIEW</span></div><div class="ir-hero"><div class="ir-hero-mark">✳</div><span class="ir-kicker">WELCOME TO THE ARCHIVE</span><h2>灵感在这里<br>有了自己的位置。</h2><p>美化、世界设定与角色故事，收进同一个仓库。先从左侧选一个频道看看。</p><div class="ir-hero-rule"></div><span class="ir-hero-foot">IDEAL MACHINE · 01 / 03</span></div><div class="ir-category-grid">${Object.entries(channels).map(([key, item], index) => `<button type="button" class="ir-category" data-ir-channel="${key}"><span class="ir-category-top">0${index + 1} / COLLECTION <span>↗</span></span><span class="ir-category-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.description}</small></button>`).join('')}</div>`;
    } else if (['members', 'events', 'notifications'].includes(screen)) {
      const title = { members: '社区成员', events: '社区活动', notifications: '通知' }[screen];
      main.innerHTML = `<div class="ir-main-top"><button type="button" data-ir-back class="ir-back">← <span>返回频道</span></button><span>${title}</span></div><div class="ir-content"><h2>${title}</h2><p class="ir-preview-note">${screen === 'notifications' ? '暂时没有新通知。' : '仓库上线后，这里会展示' + title + '。'}</p></div>`;
    } else if (screen === 'activity') {
      main.innerHTML = `<div class="ir-main-top"><button type="button" data-ir-back class="ir-back">← <span>返回频道</span></button><span>最近动态</span></div><div class="ir-content"><h2>最近动态</h2><p class="ir-preview-note">暂时没有动态。仓库上线后，可以在这里查看新的作品与互动。</p></div>`;
    } else if (screen === 'profile') {
      const name = escapeHTML(userName());
      main.innerHTML = `<div class="ir-main-top"><button type="button" data-ir-back class="ir-back">← <span>返回仓库</span></button><span>PERSONAL SPACE</span></div><div class="ir-content"><span class="ir-kicker">MY SPACE / 个人主页</span><div class="ir-profile-hero"><div class="ir-profile-big-avatar">${name.slice(0, 1)}</div><div><h2>${name}</h2><p>我的收藏与发布，将会留在这里。</p></div></div><div class="ir-profile-links"><button type="button" data-ir-legacy="beauty"><span>✦</span><span><strong>我的美化</strong><small>打开现有美化页面</small></span><span>↗</span></button><button type="button" data-ir-legacy="account"><span>◯</span><span><strong>账号设置</strong><small>打开现有账号页面</small></span><span>↗</span></button></div><p class="ir-preview-note">仓库发布与个人作品展示会在后续接入；当前为界面预览。</p></div>`;
    } else {
      const item = channels[screen];
      main.innerHTML = `<div class="ir-main-top"><button type="button" data-ir-back class="ir-back">← <span>返回频道</span></button><span>理想机 / ${item.name}</span></div><div class="ir-content"><span class="ir-kicker">IDEAL ARCHIVE / ${escapeHTML(item.name)}</span><div class="ir-channel-heading"><span class="ir-channel-symbol">${item.icon}</span><h2>${item.name}</h2><p>${item.description}</p></div><div class="ir-feed-toolbar"><div><strong>频道内容</strong><span>精选 · 最新</span></div><button type="button" class="ir-publish" data-ir-upload>＋ 上传作品</button></div><div class="ir-preview-card"><div class="ir-preview-art"><span>${item.icon}</span><small>IDEAL / ARCHIVE</small></div><div class="ir-preview-body"><span class="ir-badge">界面预览</span><h3>你的${item.name}，会在这里被看见。</h3><p>支持的文件格式：${item.types}。仓库上传与公开浏览功能尚未接入。</p><div class="ir-preview-bottom"><span>理想机仓库</span><span>01 · PREVIEW</span></div></div></div>${screen === 'beauty' ? '<button type="button" class="ir-existing-link" data-ir-legacy="beauty">进入已有的美化页面 <span>↗</span></button>' : ''}</div>`;
    }
  };
  const show = next => { screen = next; render(); };
  const open = () => { screen = 'welcome'; render(); root.classList.add('is-open'); };
  const close = () => root.classList.remove('is-open');
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
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
    if (button.hasAttribute('data-ir-upload')) window.alert('目前是仓库界面预览，上传功能尚未接入。');
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
  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-app-key="ideal"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !root.classList.contains('is-open')) return;
    if (screen === 'welcome') close(); else show('welcome');
  });
  window.addEventListener('ideal-machine-auth-changed', syncProfile);
  window.IdealMachineRepository = { open, close };
})();
