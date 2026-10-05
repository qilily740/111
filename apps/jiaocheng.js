(() => {
  const app = document.createElement('div');
  app.className = 'tutorial-app';
  app.setAttribute('aria-hidden', 'true');
  app.innerHTML = `
    <div class="tutorial-page">
      <header class="settings-header">
        <div>
          <span class="settings-kicker">IDEAL MACHINE GUIDE</span>
          <h1>教程</h1>
          <p>从这里开始，逐步了解理想机里的每一个 App。</p>
        </div>
        <button class="settings-close" data-tutorial-close type="button" aria-label="关闭教程">×</button>
      </header>
      <main class="tutorial-main">
        <div class="tutorial-list" data-tutorial-list></div>
      </main>
    </div>`;
  document.body.appendChild(app);

  const entries = [
    ['shezhi', '设置', 'shezhi.webp', '管理账号、接口和理想机数据'],
    ['meihua', '美化', 'meihua.webp', '调整桌面、图标与视觉样式'],
    ['ideal', 'Ideal', 'ideal.webp', '理想机设置与核心功能入口'],
    ['liaotian', '聊天', 'liaotian.webp', '角色聊天、群聊与消息互动'],
    ['shijieshu', '世界书', 'shijieshu.webp', '整理世界观和可复用设定'],
    ['yinyue', '音乐', 'yinyue.webp', '播放音乐与管理歌曲'],
    ['jiyiku', '记忆库', 'jiyiku.webp', '保存和管理重要记忆'],
    ['luntan', '论坛', 'luntan.webp', '浏览、发布和互动论坛内容'],
    ['ta', 'Ta', 'ta.webp', '查看角色手机与角色视角内容'],
    ['qinglvkongjian', '情侣空间', 'qinglvkongjian.webp', '记录双方关系与共同空间'],
    ['bookapp', '图书', 'tushu.webp', '阅读、书架与阅读记录'],
    ['xiangce', '相册', 'xiangce.webp', '管理图片并提供图片选择入口'],
    ['doubao', '豆包', 'doubao.webp', '使用 AI 对话与辅助功能'],
    ['gouwu', '购物', 'gouwu.webp', '浏览商品、购物与订单'],
    ['ifshikong', 'if 时空', 'ifshikong.webp', '创建故事世界与角色互动'],
    ['rili', '日历', 'rili.webp', '记录日期、事件与角色安排'],
    ['debate', '辩论', 'debate.webp', '创建辩题并进行角色辩论'],
    ['fanfic', '同人文', 'fanfic.webp', '创作和阅读同人故事'],
    ['magazine', '杂志社', 'magazine.webp', '制作属于自己的杂志内容']
  ];
  const expanded = new Set();
  let pinFrame = 0;

  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const iconPath = file => `assets/icons/default-ios17/${file}?v=20261003-tutorial-1`;
  const settingsGuide = `
    <span>操作流程</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>配置 API</b><p>具体配置方法请自行查找相关教程。</p></div>
    </div>
    `;
  const beautyGuide = `
    <span>操作流程</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>App 图标与名称（默认内置图标）</b><p>更换方法：点击 ＋ → 从相册 / 其他（二选一） → 保存更改</p></div>
    </div>
    `;
  const idealGuide = `
    <span>操作流程</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>页面切换</b><p>Ideal → 右下角圆形按钮 → 切换美化 / 账号页面</p></div>
      <div class="tutorial-guide-item"><b>使用美化</b><p>美化 → 选择分类 → 点击美化 → 应用 / 编辑 / 删除</p></div>
      <div class="tutorial-guide-item"><b>导入美化</b><p>美化 → 导入美化 → 输入美化码或选择 JSON → 开始导入</p></div>
      <div class="tutorial-guide-item"><b>管理账号</b><p>账号 → 登录或注册 / 查看状态 / 退出账号</p></div>
    </div>
    `;
  const chatGuide = `
    <span>操作流程</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>设置用户面具</b><p>聊天 → 我的 → 用户面具 → 新建设定 → 填写内容 → 保存</p></div>
      <div class="tutorial-guide-item"><b>添加角色</b><p>聊天 → 联系人 → 添加角色 → 选择 TXT 或 DOCX 文件 → 导入</p></div>
      <div class="tutorial-guide-item"><b>导入酒馆角色卡</b><p>聊天 → 联系人 → 导入酒馆角色卡 → 输入 PIN 解锁 → 选择角色卡 → 导入</p></div>
      <div class="tutorial-guide-item"><b>设置朋友圈分组</b><p>聊天 → 联系人 → 分组 → 新建或选择分组 → 添加角色</p></div>
      <div class="tutorial-guide-item"><b>绑定用户面具</b><p>聊天 → 打开具体聊天 → 右上角“…” → 聊天设置 → 绑定用户 → 选择用户面具 → 保存</p></div>
    </div>
    <p class="tutorial-guide-note">联系人页面的分组用于管理朋友圈中的角色；具体聊天使用哪个用户面具，需要进入该聊天页面的聊天设置进行绑定。</p>
    `;

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
          ${key === 'shezhi' ? settingsGuide : key === 'meihua' ? beautyGuide : key === 'ideal' ? idealGuide : key === 'liaotian' ? chatGuide : '<span>COMING SOON</span><p>这个 App 的教程内容会在后续逐步补充。</p>'}
        </div>
      </article>`;
    }).join('');
    schedulePinnedHeader();
  }

  function syncPinnedHeader() {
    pinFrame = 0;
    const main = app.querySelector('.tutorial-main');
    const item = app.querySelector('.tutorial-item.is-open');
    if (!main || !item) return;
    const head = item.querySelector('.tutorial-item-head');
    const mainRect = main.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const pinTop = mainRect.top + 10;
    const shouldPin = itemRect.top <= pinTop;
    item.classList.toggle('is-pinned', shouldPin);
    if (!shouldPin || !head) {
      item.style.removeProperty('--tutorial-pin-top');
      item.style.removeProperty('--tutorial-pin-left');
      item.style.removeProperty('--tutorial-pin-width');
      return;
    }
    item.style.setProperty('--tutorial-pin-top', `${pinTop}px`);
    item.style.setProperty('--tutorial-pin-left', `${itemRect.left}px`);
    item.style.setProperty('--tutorial-pin-width', `${itemRect.width}px`);
  }

  function schedulePinnedHeader() {
    if (pinFrame) return;
    pinFrame = requestAnimationFrame(syncPinnedHeader);
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
    if (expanded.has(key)) expanded.delete(key);
    else { expanded.clear(); expanded.add(key); }
    render();
    const nextToggle = [...app.querySelectorAll('[data-tutorial-toggle]')].find(item => item.dataset.tutorialToggle === key);
    nextToggle?.focus({ preventScroll:true });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && app.classList.contains('is-open')) closeApp();
  });

  app.querySelector('.tutorial-main')?.addEventListener('scroll', schedulePinnedHeader, { passive:true });
  window.addEventListener('resize', schedulePinnedHeader);

  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.jiaocheng = { name: '教程', open: openApp };
})();
