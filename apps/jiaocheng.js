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
      <div class="tutorial-guide-item"><b>添加好友</b><p>左侧第一个图标：添加好友并联机。</p></div>
      <div class="tutorial-guide-item"><b>理想机仓库</b><p>左侧第三个图标：打开理想机仓库。</p></div>
      <div class="tutorial-guide-item"><b>个人资料</b><p>点击底部用户栏，可编辑头像、昵称和背景图。资料页 Dock 有三个入口，按图标即可使用。</p></div>
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

  const worldbookGuide = `
    <span>世界书类型</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>全局世界书</b><p>适用于整个理想机的通用设定。</p></div>
      <div class="tutorial-guide-item"><b>局部世界书</b><p>分析一次会消耗 1 次 API，生成角色世界概括和相关 NPC。NPC 会关联到论坛和 Ta 的聊天联系人。</p></div>
      <div class="tutorial-guide-item"><b>论坛世界书</b><p>用于论坛相关的世界设定。</p></div>
    </div>`;
  const musicGuide = `
    <span>音乐与角色</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>网易云音乐</b><p>扫码登录后可同步歌单；没有会员时，部分歌曲可能无法播放。</p></div>
      <div class="tutorial-guide-item"><b>我的音乐</b><p>同步网易云歌单，也可以自己创建歌单。</p></div>
      <div class="tutorial-guide-item"><b>角色歌单</b><p>收藏角色分享的歌单或单曲，内容关联 Ta - 音乐。</p></div>
    </div>`;
  const taGuide = `
    <span>角色手机</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>手机内容</b><p>包含聊天、论坛、日历、情侣空间、音乐、豆包、购物、钱包、美化和反查手机。</p></div>
      <div class="tutorial-guide-item"><b>聊天与论坛</b><p>聊天包含角色、用户和相关 NPC；朋友圈也展示他们的动态。论坛内容与论坛 App 同步。</p></div>
      <div class="tutorial-guide-item"><b>日历与情侣空间</b><p>日历展示角色当天行程；行程变化后刷新会标出变化。情侣空间的大部分内容与情侣空间 App 同步。</p></div>
      <div class="tutorial-guide-item"><b>音乐、豆包与购物</b><p>音乐展示角色最近在听的歌、播放次数和感受；豆包会基于近期聊天与角色对话；购物展示角色的购物清单。</p></div>
      <div class="tutorial-guide-item"><b>反查手机（尚未完成）</b><p>功能还没做完。仅绑定同一用户的角色会出现在聊天中。可调整角色不被用户发现的概率（默认成功率 70%），也可手动干预发现。反查时会随机检查若干 App，也可指定 App；每检查 1 个 App 消耗 1 次 API。反查结束或角色被发现后，会跳到聊天互动，再消耗 1 次 API。</p></div>
    </div>`;
  const coupleGuide = `
    <span>一起生活</span>
    <div class="tutorial-guide">
      <div class="tutorial-guide-item"><b>心动</b><p>交换物品并写下使用感受，角色也会说明交换原因；物品支持接入生图 API 生成图片。</p></div>
      <div class="tutorial-guide-item"><b>约会</b><p>和角色安排约会。</p></div>
      <div class="tutorial-guide-item"><b>游戏</b><p>当前进度 4/7。游戏可单独接入 API，建议使用 Flash 这类模型；除分类理货外，其它小游戏会比较耗 API。</p></div>
      <div class="tutorial-guide-item"><b>心事（祈愿）</b><p>写下愿望后，角色会认真回复；也可以在 Ta - 情侣空间回复角色的祈愿。</p></div>
      <div class="tutorial-guide-item"><b>我们</b><p>角色会回顾近期聊天，写下自己的心里话。</p></div>
    </div>`;
  const bookGuide = `
    <span>一起阅读</span>
    <div class="tutorial-guide"><div class="tutorial-guide-item"><b>导入与共读</b><p>可以导入书籍，也可以导入同人文 App 的文章。选一位角色一起阅读，并围绕内容讨论。</p></div></div>`;
  const albumGuide = `
    <span>图片管理</span>
    <div class="tutorial-guide"><div class="tutorial-guide-item"><b>选择图片</b><p>壁纸、头像和小组件都可以从相册选图。建议先把图片导入相册，再到对应功能中选择。</p></div></div>
    <p class="tutorial-guide-note">请勿导入身份证、银行卡等会泄露隐私的图片。</p>`;
  const doubaoGuide = `
    <span>对话与记录</span>
    <div class="tutorial-guide"><div class="tutorial-guide-item"><b>保存并分享</b><p>和豆包聊天并保存记录；之后可以把聊天记录分享给角色，让角色接着了解和回应。</p></div></div>`;

  const guides = {
    shezhi: settingsGuide,
    meihua: beautyGuide,
    ideal: idealGuide,
    liaotian: chatGuide,
    shijieshu: worldbookGuide,
    yinyue: musicGuide,
    ta: taGuide,
    qinglvkongjian: coupleGuide,
    bookapp: bookGuide,
    xiangce: albumGuide,
    doubao: doubaoGuide
  };

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
          ${guides[key] || '<span>COMING SOON</span><p>这个 App 的教程内容会在后续逐步补充。</p>'}
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
