(() => {
  const app = document.createElement('div');
  app.className = 'tutorial-app';
  app.setAttribute('aria-hidden', 'true');
  app.innerHTML = `
    <div class="tutorial-page">
      <header class="tutorial-header">
        <button class="tutorial-back" data-tutorial-close type="button" aria-label="返回桌面">‹</button>
        <div>
          <span class="tutorial-kicker">IDEAL MACHINE GUIDE</span>
          <h1>教程</h1>
          <p>从这里开始，逐步了解理想机里的每一个 App。</p>
        </div>
        <button class="tutorial-close" data-tutorial-close type="button" aria-label="关闭教程">×</button>
      </header>
      <main class="tutorial-main">
        <section class="tutorial-intro">
          <span>APP GUIDE</span>
          <h2>选择一个 App 开始了解</h2>
          <p>教程会按 App 分开整理。点击条目展开，后续会逐步补充使用方法和功能说明。</p>
        </section>
        <div class="tutorial-list" data-tutorial-list></div>
      </main>
    </div>`;
  document.body.appendChild(app);

  const entries = [
    ['liaotian', '聊天', 'liaotian.webp', '角色聊天、群聊与消息互动'],
    ['ta', 'Ta', 'ta.webp', '查看角色手机与角色视角内容'],
    ['luntan', '论坛', 'luntan.webp', '浏览、发布和互动论坛内容'],
    ['bookapp', '图书', 'tushu.webp', '阅读、书架与阅读记录'],
    ['ideal', 'Ideal', 'ideal.webp', '理想机设置与核心功能入口'],
    ['xiangce', '相册', 'xiangce.webp', '管理图片并提供图片选择入口'],
    ['rili', '日历', 'rili.webp', '记录日期、事件与角色安排'],
    ['jiyiku', '记忆库', 'jiyiku.webp', '保存和管理重要记忆'],
    ['yinyue', '音乐', 'yinyue.webp', '播放音乐与管理歌曲'],
    ['doubao', '豆包', 'doubao.webp', '使用 AI 对话与辅助功能'],
    ['gouwu', '购物', 'gouwu.webp', '浏览商品、购物与订单'],
    ['ifshikong', 'if 时空', 'ifshikong.webp', '创建故事世界与角色互动'],
    ['shezhi', '设置', 'shezhi.webp', '管理账号、接口和理想机数据'],
    ['meihua', '美化', 'meihua.webp', '调整桌面、图标与视觉样式'],
    ['shijieshu', '世界书', 'shijieshu.webp', '整理世界观和可复用设定'],
    ['qinglvkongjian', '情侣空间', 'qinglvkongjian.webp', '记录双方关系与共同空间'],
    ['debate', '辩论', 'debate.webp', '创建辩题并进行角色辩论'],
    ['fanfic', '同人文', 'fanfic.webp', '创作和阅读同人故事'],
    ['magazine', '杂志社', 'magazine.webp', '制作属于自己的杂志内容']
  ];
  const expanded = new Set();

  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const iconPath = file => `assets/icons/default-ios17/${file}?v=20261003-tutorial-1`;

  function render() {
    const list = app.querySelector('[data-tutorial-list]');
    if (!list) return;
    list.innerHTML = entries.map(([key, name, file, summary], index) => {
      const isOpen = expanded.has(key);
      return `<article class="tutorial-item${isOpen ? ' is-open' : ''}">
        <button class="tutorial-item-head" data-tutorial-toggle="${esc(key)}" type="button" aria-expanded="${isOpen}" aria-controls="tutorial-detail-${index}">
          <span class="tutorial-item-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="tutorial-item-icon"><img src="${iconPath(file)}" alt=""></span>
          <span class="tutorial-item-copy"><b>${esc(name)}</b><small>${esc(summary)}</small></span>
          <i aria-hidden="true">${isOpen ? '−' : '+'}</i>
        </button>
        <div class="tutorial-item-detail" id="tutorial-detail-${index}"${isOpen ? '' : ' hidden'}>
          <span>COMING SOON</span>
          <p>这个 App 的教程内容会在后续逐步补充。</p>
        </div>
      </article>`;
    }).join('');
  }

  function openApp() {
    app.classList.add('is-open');
    app.setAttribute('aria-hidden', 'false');
    render();
    requestAnimationFrame(() => app.querySelector('[data-tutorial-close]')?.focus());
  }

  function closeApp() {
    app.classList.remove('is-open');
    app.setAttribute('aria-hidden', 'true');
    document.querySelector('[data-app-key="jiaocheng"]')?.focus();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="jiaocheng"]')) { openApp(); return; }
    const close = event.target.closest('[data-tutorial-close]');
    if (close) { closeApp(); return; }
    const toggle = event.target.closest('[data-tutorial-toggle]');
    if (!toggle || !app.contains(toggle)) return;
    const key = toggle.dataset.tutorialToggle;
    if (expanded.has(key)) expanded.delete(key); else expanded.add(key);
    render();
    [...app.querySelectorAll('[data-tutorial-toggle]')].find(item => item.dataset.tutorialToggle === key)?.focus();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && app.classList.contains('is-open')) closeApp();
  });

  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.jiaocheng = { name: '教程', open: openApp };
})();
