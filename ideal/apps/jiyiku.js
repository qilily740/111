(() => {
  const storageKey = 'ideal-machine-memory-library';
  const chatKey = 'ideal-machine-chat';
  const app = document.createElement('div');
  app.className = 'memory-library-app';
  document.body.appendChild(app);

  let state = readState();
  let page = 'home';
  let activeRoleId = '';
  let activeEntryId = '';
  let filter = 'all';
  let query = '';
  let busy = false;
  let themePickerOpen = false;
  const themeKey = 'ideal-machine-memory-theme';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        ...value,
        version: 2,
        entries: Array.isArray(value.entries) ? value.entries : [],
        cores: value.cores && typeof value.cores === 'object' ? value.cores : {},
        roleMeta: value.roleMeta && typeof value.roleMeta === 'object' ? value.roleMeta : {}
      };
    } catch {
      return { version: 2, entries: [], cores: {}, roleMeta: {} };
    }
  }

  function save() {
    if (window.IdealMachineMemory?.saveLibrary) window.IdealMachineMemory.saveLibrary(state);
  }

  function readChat() {
    try {
      const value = JSON.parse(localStorage.getItem(chatKey) || '{}');
      return {
        contacts: Array.isArray(value.contacts) ? value.contacts : [],
        profiles: Array.isArray(value.profiles) ? value.profiles : [],
        chats: value.chats && typeof value.chats === 'object' ? value.chats : {}
      };
    } catch {
      return { contacts: [], profiles: [], chats: {} };
    }
  }

  function roleName(role) {
    return role?.nickname || role?.name || '未命名角色';
  }

  function avatar(role) {
    return role?.avatar ? `<img src="${esc(role.avatar)}" alt="">` : esc(roleName(role).slice(0, 1));
  }

  function dateText(value) {
    if (!value) return '刚刚';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('zh-CN', { year:'numeric', month:'short', day:'numeric' });
  }

  function icon(type) {
    const paths = {
      back:'<path d="M30 10 16 24l14 14"/>',
      refresh:'<path d="M38 18a15 15 0 1 0 1 12"/><path d="M38 8v10H28"/>',
      search:'<circle cx="21" cy="21" r="12"/><path d="m30 30 10 10"/>',
      chat:'<path d="M8 11h32v22H20l-10 7v-7H8Z"/><path d="M15 19h18M15 25h12"/>',
      offline:'<circle cx="24" cy="24" r="15"/><path d="M24 14v10l7 5"/>',
      spark:'<path d="m24 7 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z"/>'
    };
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${paths[type] || ''}</svg>`;
  }

  function themePanel() { return themePickerOpen ? `<div class="memory-theme-picker"><span>页面颜色</span><div><button type="button" data-memory-theme-choice="lavender" aria-label="薰衣草紫"></button><button type="button" data-memory-theme-choice="rose" aria-label="玫瑰粉"></button><button type="button" data-memory-theme-choice="sky" aria-label="天空蓝"></button><button type="button" data-memory-theme-choice="sage" aria-label="鼠尾草绿"></button><button type="button" data-memory-theme-choice="amber" aria-label="琥珀金"></button><button type="button" data-memory-theme-choice="white" aria-label="纯白"></button><button type="button" data-memory-theme-choice="black" aria-label="纯黑"></button></div></div>` : ''; }

  function applyTheme() { app.dataset.memoryTheme = localStorage.getItem(themeKey) || 'lavender'; }

  function syncSourceMemories() {
    window.IdealMachineMemory?.syncLegacySources?.(readChat());
    state = readState();
  }

  function roleEntries(roleId) {
    const profileId = readChat().chats?.[roleId]?.profileId || '';
    return state.entries.filter(item => item.roleId === roleId && (!profileId || !item.profileId || item.profileId === profileId)).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  function roleCore(roleId) {
    const profileId = readChat().chats?.[roleId]?.profileId || '';
    const key = window.IdealMachineMemory?.scopeKey?.(roleId, profileId) || (profileId ? `${roleId}::${profileId}` : roleId);
    return state.cores?.[key] || state.cores?.[roleId];
  }

  function filteredEntries(roleId) {
    return roleEntries(roleId).filter(item => {
      if (filter !== 'all' && item.type !== filter) return false;
      const text = `${item.title} ${item.summary} ${(item.keywords || []).join(' ')}`.toLowerCase();
      return !query || text.includes(query.toLowerCase());
    });
  }

  function entryCard(item) {
    return `<button class="memory-entry" type="button" data-memory-entry="${esc(item.id)}"><i class="is-${item.type}">${icon(item.type === 'offline' ? 'offline' : 'chat')}</i><span><small>${item.type === 'offline' ? '线下记忆' : '聊天记忆'} · ${dateText(item.createdAt)}</small><b>${esc(item.title || '未命名记忆')}</b><p>${esc(item.summary)}</p><em>${esc(item.importance || '日常')}</em></span></button>`;
  }

  function home() {
    const data = readChat();
    const offlineCount = state.entries.filter(item => item.type === 'offline').length;
    const chatCount = state.entries.filter(item => item.type === 'chat').length;
    const coreCount = Object.values(state.cores || {}).filter(item => item?.content).length;
    return `<section class="memory-page"><header class="memory-header"><div><span>MEMORY ARCHIVE</span><h1>记忆库</h1><p>把聊过的、见过的，都好好记住。</p></div><button type="button" data-memory-theme-toggle>◐</button><button type="button" data-memory-close>×</button></header>${themePanel()}<main class="memory-main"><section class="memory-hero"><div><small>共保存</small><b>${state.entries.length}</b><span>段记忆</span></div><dl><div><dt>${chatCount}</dt><dd>长期</dd></div><div><dt>${coreCount}</dt><dd>核心</dd></div><div><dt>${offlineCount}</dt><dd>线下</dd></div></dl><button type="button" data-memory-refresh ${busy ? 'disabled' : ''}>${icon('refresh')}<span>${busy ? '正在整理…' : '整理新记忆'}</span></button></section><div class="memory-section-head"><div><span>按角色查看</span><small>${data.contacts.length} 位角色</small></div></div><section class="memory-role-list">${data.contacts.length ? data.contacts.map(role => { const entries = roleEntries(role.id); const hasCore = Boolean(roleCore(role.id)?.content); return `<button type="button" data-memory-role="${esc(role.id)}"><i>${avatar(role)}</i><span><b>${esc(roleName(role))}</b><small>${entries.length ? `${entries.length} 段记忆${hasCore ? ' · 已建立核心' : ''} · ${esc(entries[0].title)}` : '还没有整理过记忆'}</small></span><em>›</em></button>`; }).join('') : '<div class="memory-empty"><i>✦</i><p>请先在聊天 App 中添加角色。</p></div>'}</section></main></section>`;
  }

  function rolePage() {
    const data = readChat();
    const role = data.contacts.find(item => item.id === activeRoleId);
    const entries = filteredEntries(activeRoleId);
    const core = roleCore(activeRoleId);
    const coreMarkup = core?.content ? `<section class="memory-core-card"><header><span>CORE MEMORY</span><b>核心记忆 · 第 ${Number(core.version || 1)} 版</b></header><p>${esc(core.content)}</p><small>更新于 ${dateText(core.updatedAt)} · 每次聊天都会全量注入当前版本</small></section>` : `<section class="memory-core-card is-empty"><header><span>CORE MEMORY</span><b>核心记忆尚未建立</b></header><p>长期记忆达到聊天设置中的更新频率后，会自动整理成稳定的关系档案。</p></section>`;
    return `<section class="memory-page"><header class="memory-subheader"><button type="button" data-memory-home>${icon('back')}</button><div><span>PERSONAL ARCHIVE</span><h1>${esc(roleName(role))}的记忆</h1></div><button type="button" data-memory-theme-toggle>◐</button><button type="button" data-memory-refresh ${busy ? 'disabled' : ''}>${icon('refresh')}</button></header>${themePanel()}<main class="memory-main memory-role-page"><section class="memory-role-hero"><i>${avatar(role)}</i><div><b>${esc(roleName(role))}</b><p>${roleEntries(activeRoleId).length} 段共同记忆</p></div></section>${coreMarkup}<label class="memory-search">${icon('search')}<input data-memory-search value="${esc(query)}" placeholder="搜索记忆内容…"></label><nav class="memory-filters"><button class="${filter === 'all' ? 'is-active' : ''}" data-memory-filter="all" type="button">全部</button><button class="${filter === 'chat' ? 'is-active' : ''}" data-memory-filter="chat" type="button">长期聊天</button><button class="${filter === 'offline' ? 'is-active' : ''}" data-memory-filter="offline" type="button">线下</button></nav><section class="memory-timeline">${entries.length ? entries.map(entryCard).join('') : '<div class="memory-empty"><i>✦</i><p>这里还没有符合条件的记忆。</p></div>'}</section></main></section>`;
  }

  function detailPage() {
    const item = state.entries.find(entry => entry.id === activeEntryId);
    if (!item) return rolePage();
    return `<section class="memory-page"><header class="memory-subheader"><button type="button" data-memory-role-back>${icon('back')}</button><div><span>${item.type === 'offline' ? 'OFFLINE MEMORY' : 'CHAT MEMORY'}</span><h1>记忆详情</h1></div><button type="button" data-memory-theme-toggle>◐</button><span></span></header>${themePanel()}<main class="memory-main memory-detail"><div class="memory-detail-symbol is-${item.type}">${icon(item.type === 'offline' ? 'offline' : 'spark')}</div><small>${dateText(item.createdAt)} · ${esc(item.roleName || '')}</small><h2>${esc(item.title)}</h2><p>${esc(item.summary)}</p>${item.emotion ? `<section><span>情绪脉络</span><p>${esc(item.emotion)}</p></section>` : ''}${item.keywords?.length ? `<div class="memory-tags">${item.keywords.map(word => `<i>${esc(word)}</i>`).join('')}</div>` : ''}<button class="memory-delete" type="button" data-memory-delete="${esc(item.id)}">删除这段记忆</button></main></section>`;
  }

  function render() {
    app.innerHTML = page === 'detail' ? detailPage() : page === 'role' ? rolePage() : home();
    applyTheme();
  }

  async function refreshMemories() {
    if (busy) return;
    syncSourceMemories();
    if (!window.IdealMachineMemory) return window.alert('记忆系统尚未加载，请刷新页面后再试。');
    busy = true;
    render();
    try {
      const result = await window.IdealMachineMemory.processAllChats({ maxBatches: 20 });
      state = readState();
      syncSourceMemories();
      if (result.errors.length) window.alert(`部分记忆整理失败：\n${result.errors.join('\n')}`);
      else if (result.created) window.alert(`已整理 ${result.created} 条长期记忆${result.coreUpdated ? `，更新 ${result.coreUpdated} 份核心记忆` : ''}。`);
      else window.alert('还没有达到各聊天设置中的总结轮数。');
    } catch (error) {
      window.alert(`整理记忆时遇到问题：${error.message}`);
    } finally {
      busy = false;
      state = readState();
      render();
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="jiyiku"]')) {
      state = readState(); syncSourceMemories(); page = 'home'; activeRoleId = ''; activeEntryId = ''; filter = 'all'; query = ''; render(); app.classList.add('is-open'); return;
    }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-memory-close]')) { app.classList.remove('is-open'); return; }
    if (event.target.closest('[data-memory-theme-choice]')) { localStorage.setItem(themeKey, event.target.closest('[data-memory-theme-choice]').dataset.memoryThemeChoice); themePickerOpen = false; render(); return; }
    if (event.target.closest('[data-memory-theme-toggle]')) { themePickerOpen = !themePickerOpen; render(); return; }
    if (event.target.closest('[data-memory-home]')) { page = 'home'; activeRoleId = ''; query = ''; filter = 'all'; render(); return; }
    if (event.target.closest('[data-memory-role-back]')) { page = 'role'; activeEntryId = ''; render(); return; }
    if (event.target.closest('[data-memory-refresh]')) { refreshMemories(); return; }
    const role = event.target.closest('[data-memory-role]');
    if (role) { activeRoleId = role.dataset.memoryRole; page = 'role'; query = ''; filter = 'all'; render(); return; }
    const entry = event.target.closest('[data-memory-entry]');
    if (entry) { activeEntryId = entry.dataset.memoryEntry; page = 'detail'; render(); return; }
    const filterButton = event.target.closest('[data-memory-filter]');
    if (filterButton) { filter = filterButton.dataset.memoryFilter; render(); return; }
    const deleted = event.target.closest('[data-memory-delete]');
    if (deleted && window.confirm('确定删除这段记忆吗？')) { const item = state.entries.find(entry => entry.id === deleted.dataset.memoryDelete); const data = readChat(); const role = data.contacts.find(entry => entry.id === item?.roleId); const chat = data.chats?.[item?.roleId]; const profile = data.profiles.find(entry => entry.id === (item?.profileId || chat?.profileId)); if (window.IdealMachineMemory?.deleteEntry) window.IdealMachineMemory.deleteEntry(deleted.dataset.memoryDelete, { role, profile, chat }).finally(() => { state = readState(); render(); }); else { state.entries = state.entries.filter(entry => entry.id !== deleted.dataset.memoryDelete); save(); } page = 'role'; activeEntryId = ''; render(); }
  });

  document.addEventListener('input', event => {
    if (!app.classList.contains('is-open') || !event.target.matches('[data-memory-search]')) return;
    query = event.target.value;
    const position = event.target.selectionStart;
    render();
    const input = app.querySelector('[data-memory-search]');
    input?.focus();
    input?.setSelectionRange(position, position);
  });

  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.jiyiku = { name:'记忆库' };
  window.addEventListener('ideal-machine-memory-updated', () => {
    if (!app.classList.contains('is-open') || busy) return;
    state = readState();
    render();
  });
})();
