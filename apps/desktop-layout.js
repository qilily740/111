(() => {
  const storageKey = 'ideal-machine-desktop-layout-v2';
  const creativeAppsKey = 'ideal-machine-creative-folder-apps';
  const creativeRemovedAppsKey = 'ideal-machine-creative-folder-removed';
  const creativeFolderOrderKey = 'ideal-machine-creative-folder-order';
  const desktopColumns = 4;
  const desktop = document.querySelector('.desktop-scroll-wrap');
  let pages = [...document.querySelectorAll('.desktop-page')];
  const dock = document.querySelector('.dock-bar');
  const pageIndicator = document.querySelector('.page-indicator');
  if (!desktop || pages.length < 2 || !dock || !pageIndicator) return;

  const widgetDefinitions = [
    { id:'widget-profile', key:'profile', name:'个人卡片', description:'双方头像、昵称与签名', selector:'.profile-card', size:'wide', columns:4, rows:2 },
    { id:'widget-todo', key:'todo', name:'待办', description:'桌面待办清单', selector:'.todo-widget', size:'square', columns:2, rows:2 },
    { id:'widget-image', key:'image', name:'图片', description:'点击即可更换的单张图片', selector:'.image-widget', size:'square', columns:2, rows:2, defaultHidden:true },
    { id:'widget-countdown', key:'countdown', name:'周年倒计时', description:'距离下一次纪念日还有多少天', selector:'.countdown-widget', size:'square', columns:2, rows:2, defaultHidden:true },
    { id:'widget-elapsed', key:'elapsed', name:'累计天数', description:'从指定日期开始计算经过了多少天', selector:'.elapsed-days-widget', size:'square', columns:2, rows:2, defaultHidden:true },
    { id:'widget-shared', key:'shared', name:'共享卡片', description:'两张图片与一段共享文字', selector:'.shared-widget', size:'wide', columns:4, rows:2, defaultHidden:true },
    { id:'widget-chat', key:'chat', name:'聊天气泡', description:'两条可自定义的头像、气泡与时间', selector:'.chat-widget', size:'wide', columns:4, rows:2, defaultHidden:true },
    { id:'widget-now', key:'now', name:'正在听与天气', description:'头像、音乐文字、天气与三张图片', selector:'.now-playing-widget', size:'wide', columns:4, rows:2, defaultHidden:true },
    { id:'widget-mood', key:'mood', name:'头像心情卡片', description:'头像、四条磨砂文字与可爱颜文字', selector:'.mood-profile-widget', size:'wide', columns:4, rows:2, defaultHidden:true },
    { id:'widget-time-photo', key:'time-photo', name:'时间照片卡片', description:'当前时间、星期与四张照片', selector:'.time-photo-widget', size:'wide', columns:4, rows:2, defaultHidden:true },
    { id:'widget-search', key:'search', name:'搜索条', description:'桌面搜索入口', selector:'.search-wrap', size:'wide', columns:4, rows:1 },
    { id:'widget-photos', key:'photos', name:'三联照片', description:'三张竖版照片', selector:'.photo-group', size:'photos', columns:4, rows:2 },
    { id:'widget-calendar', key:'calendar', name:'日期日历', description:'日期、寄语与滚动日历', selector:'.date-calendar-card', size:'wide', columns:4, rows:1 }
  ];
  const defaultPages = [
    ['widget-profile','widget-todo','app-liaotian','app-ta','app-luntan','app-rili','app-jiyiku','app-xiaozhen','app-jia','app-creative-folder'],
    ['widget-search','widget-photos','app-yinyue','app-doubao','app-gouwu','app-ifshikong','widget-calendar']
  ];
  const defaultDock = ['app-shezhi','app-meihua','app-shijieshu','app-qinglvkongjian'];
  const itemMap = new Map();
  let state = readState();
  let editing = false;
  let drag = null;
  let folderDrag = null;
  let dockDrag = null;
  let tapCount = 0;
  let tapTimer = 0;
  let suppressClickUntil = 0;
  let edgeTurnAt = 0;

  while (pages.length < Math.max(2, state.pages.length)) {
    const page = document.createElement('section');
    page.className = `desktop-page page-${pages.length + 1}`;
    page.innerHTML = '<div class="bg-layer"></div>';
    desktop.appendChild(page);
    pages.push(page);
  }

  function createGrid(page, index) {
    const grid = document.createElement('div');
    grid.className = `desktop-layout-grid desktop-layout-grid-${index + 1}`;
    grid.dataset.desktopGrid = String(index);
    if (index === 0) page.insertBefore(grid, page.querySelector('.profile-card'));
    else if (index === 1) page.insertBefore(grid, page.querySelector('.photo-group'));
    else page.appendChild(grid);
    return grid;
  }
  let grids = pages.map(createGrid);
  const hiddenPool = document.createElement('div');
  hiddenPool.className = 'desktop-widget-pool';
  hiddenPool.hidden = true;
  document.body.appendChild(hiddenPool);

  function appSourceById(id) {
    const key = String(id || '').replace(/^app-/, '');
    return [...document.querySelectorAll('.app-item[data-app-key], .dock-item[data-app-key]')].find(item => item.dataset.appKey === key);
  }
  function readCreativeApps() { try { const value = JSON.parse(localStorage.getItem(creativeAppsKey) || '[]'); return Array.isArray(value) ? [...new Set(value.filter(id => String(id).startsWith('app-')))] : []; } catch { return []; } }
  function saveCreativeApps(ids) { localStorage.setItem(creativeAppsKey, JSON.stringify([...new Set(ids)])); }
  function readRemovedCreativeApps() { try { const value = JSON.parse(localStorage.getItem(creativeRemovedAppsKey) || '[]'); return Array.isArray(value) ? [...new Set(value.filter(id => ['app-debate','app-fanfic','app-magazine'].includes(id)))] : []; } catch { return []; } }
  function saveRemovedCreativeApps(ids) { localStorage.setItem(creativeRemovedAppsKey, JSON.stringify([...new Set(ids)])); }
  function refreshCreativeFolderIcon() {
    const icon = staticFolderTrigger?.querySelector('.desktop-folder-icon');
    if (!icon) return;
    const removed = new Set(readRemovedCreativeApps());
    [['app-debate', '.is-debate'], ['app-fanfic', '.is-fanfic'], ['app-magazine', '.is-magazine']].forEach(([id, selector]) => { if (removed.has(id)) icon.querySelector(`.folder-mini-app${selector}`)?.remove(); });
    icon.querySelectorAll('.generated-creative-mini').forEach(item => item.remove());
    readCreativeApps().slice(0, 6).forEach(id => {
      const source = appSourceById(id);
      const mini = document.createElement('i');
      mini.className = 'folder-mini-app generated-creative-mini';
      const sourceIcon = source?.querySelector('.app-icon, .dock-icon');
      if (sourceIcon) mini.innerHTML = sourceIcon.innerHTML;
      else mini.innerHTML = `<span>${escapeFolderText(id.replace(/^app-/, '').slice(0, 1))}</span>`;
      icon.appendChild(mini);
    });
  }
  function folderLauncher(folder) {
    const launcher = document.createElement('div');
    launcher.className = 'app-item desktop-created-folder';
    launcher.dataset.desktopItem = folder.id;
    launcher.dataset.desktopFolderId = folder.id;
    launcher.dataset.desktopFolderLauncher = 'true';
    launcher.dataset.desktopColumns = '1';
    launcher.dataset.desktopRows = '1';
    const mini = folder.apps.slice(0, 9).map(id => { const source = appSourceById(id); const name = source?.querySelector('.app-name, .dock-name')?.textContent?.trim() || 'A'; return `<i class="folder-mini-app"><span>${name.slice(0, 1)}</span></i>`; }).join('');
    launcher.innerHTML = `<div class="app-icon desktop-folder-icon">${mini}</div><div class="app-name">${folder.name}</div>`;
    return launcher;
  }
  state.folders.forEach(folder => {
    const pageIndex = Math.max(0, state.pages.findIndex(list => list.includes(folder.id)));
    pages[pageIndex]?.appendChild(folderLauncher(folder));
  });

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { pages:Array.isArray(value.pages) ? value.pages : [], dock:Array.isArray(value.dock) ? value.dock : [], dockPosition:value.dockPosition && typeof value.dockPosition === 'object' ? value.dockPosition : { x:0, y:0 }, hiddenWidgets:Array.isArray(value.hiddenWidgets) ? value.hiddenWidgets : [], widgetCopies:Array.isArray(value.widgetCopies) ? value.widgetCopies : [], folders:Array.isArray(value.folders) ? value.folders : [], positions:value.positions && typeof value.positions === 'object' ? value.positions : {}, pageOneTopSlots:value.pageOneTopSlots === true };
    } catch { return { pages:[], dock:[], dockPosition:{ x:0, y:0 }, hiddenWidgets:[], widgetCopies:[], folders:[], positions:{}, pageOneTopSlots:false }; }
  }
  function unique(values) { return [...new Set(values.filter(Boolean))]; }
  function itemSpan(item) { return { columns:Math.max(1, Math.min(desktopColumns, Number(item?.dataset.desktopColumns) || 1)), rows:Math.max(1, Number(item?.dataset.desktopRows) || 1) }; }
  function gridTrackHeights(grid, style = getComputedStyle(grid)) {
    const tracks = String(style.gridTemplateRows || '').match(/[\d.]+px/g) || [];
    return tracks.map(track => Number.parseFloat(track)).filter(height => Number.isFinite(height) && height > 0);
  }
  function validPosition(position, span) { const column = Number(position?.column); const row = Number(position?.row); return Number.isInteger(column) && Number.isInteger(row) && column >= 1 && row >= 1 && column + span.columns - 1 <= desktopColumns; }
  function occupiedCells(position, span) { const cells = []; for (let row = position.row; row < position.row + span.rows; row += 1) for (let column = position.column; column < position.column + span.columns; column += 1) cells.push(`${row}:${column}`); return cells; }
  function cellsAreFree(occupied, position, span) { return validPosition(position, span) && occupiedCells(position, span).every(cell => !occupied.has(cell)); }
  function occupy(occupied, position, span) { occupiedCells(position, span).forEach(cell => occupied.add(cell)); }
  function firstFreePosition(occupied, span, startIndex = 0, maxRows = Infinity) {
    for (let index = Math.max(0, startIndex); index < 400; index += 1) {
      const position = { column:(index % desktopColumns) + 1, row:Math.floor(index / desktopColumns) + 1 };
      if (position.row > maxRows) break;
      if (cellsAreFree(occupied, position, span)) return position;
    }
    return null;
  }
  function applyDesktopPosition(item, position) {
    if (!item || !position) return;
    const span = itemSpan(item);
    item.dataset.desktopColumn = String(position.column);
    item.dataset.desktopRow = String(position.row);
    item.style.gridColumn = `${position.column} / span ${span.columns}`;
    item.style.gridRow = `${position.row} / span ${span.rows}`;
  }
  function clearDesktopPosition(item) {
    if (!item) return;
    delete item.dataset.desktopColumn;
    delete item.dataset.desktopRow;
    item.style.removeProperty('grid-column');
    item.style.removeProperty('grid-row');
  }
  function itemPosition(item) { const column = Number(item?.dataset.desktopColumn); const row = Number(item?.dataset.desktopRow); return Number.isInteger(column) && Number.isInteger(row) ? { column, row } : null; }
  function gridOccupiedCells(grid, exceptItem = null) {
    const occupied = new Set();
    [...grid.children].forEach(item => {
      if (item === exceptItem || item.classList.contains('is-layout-source') || !item.dataset.desktopItem) return;
      const position = itemPosition(item);
      if (position) occupy(occupied, position, itemSpan(item));
    });
    return occupied;
  }
  function trailingPosition(grid, item) {
    const occupied = gridOccupiedCells(grid, item);
    let lastIndex = -1;
    occupied.forEach(cell => { const [row, column] = cell.split(':').map(Number); lastIndex = Math.max(lastIndex, (row - 1) * desktopColumns + column - 1); });
    return firstFreePosition(occupied, itemSpan(item), lastIndex + 1);
  }
  function appendAtTrailingPosition(item, grid, maxRows = Infinity) {
    if (!item || !grid) return;
    setAppContainerType(item, false);
    const position = firstFreePosition(gridOccupiedCells(grid, item), itemSpan(item), 0, maxRows);
    if (!position) return false;
    applyDesktopPosition(item, position);
    grid.appendChild(item);
    return true;
  }
  function placeRemovedApp(item, dropTarget = null) {
    if (!item) return;
    const destination = dropTarget?.grid?.matches('.desktop-layout-grid') ? dropTarget.grid : grids[currentPage()];
    if (!destination) return;
    setAppContainerType(item, false);
    const preferred = dropTarget?.position;
    const position = preferred && cellsAreFree(gridOccupiedCells(destination, item), preferred, itemSpan(item)) ? preferred : trailingPosition(destination, item);
    applyDesktopPosition(item, position);
    destination.appendChild(item);
    item.classList.remove('desktop-app-just-placed');
    requestAnimationFrame(() => {
      item.classList.add('desktop-app-just-placed');
      setTimeout(() => item.classList.remove('desktop-app-just-placed'), 320);
    });
  }
  function syncPageGridRowHeights() {
    grids.forEach(grid => {
      grid.style.removeProperty('grid-template-rows');
      grid.style.removeProperty('--desktop-grid-row');
      grid.querySelectorAll('.desktop-search-before-photos').forEach(item => item.classList.remove('desktop-search-before-photos'));
      grid.querySelectorAll('.desktop-calendar-compact').forEach(item => item.classList.remove('desktop-calendar-compact'));
      const items = [...grid.children].filter(item => item.dataset.desktopItem && itemPosition(item));
      const maxRow = items.reduce((maximum, item) => Math.max(maximum, itemPosition(item).row + itemSpan(item).rows - 1), 0);
      if (maxRow) {
        const rowGap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        const heights = Array(maxRow).fill(0);
        const spanningItems = [];
        items.forEach(item => {
          const position = itemPosition(item);
          const span = itemSpan(item);
          const height = Math.ceil(item.getBoundingClientRect().height);
          if (!height) return;
          if (span.rows === 1) heights[position.row - 1] = Math.max(heights[position.row - 1], height);
          else spanningItems.push({ position, span, height });
        });
        spanningItems.sort((a, b) => a.span.rows - b.span.rows).forEach(({ position, span, height }) => {
          const start = position.row - 1;
          const indexes = Array.from({ length:span.rows }, (_, offset) => start + offset);
          const requiredTracksHeight = Math.max(0, height - rowGap * (span.rows - 1));
          indexes.forEach(index => { heights[index] = Math.max(heights[index] || 0, 56); });
          const currentTracksHeight = indexes.reduce((sum, index) => sum + (heights[index] || 0), 0);
          const addition = Math.max(0, requiredTracksHeight - currentTracksHeight) / span.rows;
          indexes.forEach(index => { heights[index] += addition; });
        });
        grid.style.gridTemplateRows = heights.map(height => `${Math.ceil(height || 80)}px`).join(' ');
      }
      const photos = [...grid.children].find(item => item.dataset.desktopWidget === 'photos');
      const photoPosition = itemPosition(photos);
      const search = [...grid.children].find(item => item.dataset.desktopWidget === 'search');
      const searchPosition = itemPosition(search);
      if (search && searchPosition && photoPosition && photoPosition.row === searchPosition.row + itemSpan(search).rows) {
        search.classList.add('desktop-search-before-photos');
      }
      const calendar = [...grid.children].find(item => item.dataset.desktopWidget === 'calendar');
      if (calendar) calendar.classList.add('desktop-calendar-compact');
    });
  }
  function normalizePagePositions() {
    const normalized = {};
    state.pages.forEach((ids, pageIndex) => {
      const occupied = new Set();
      const pending = [];
      ids.forEach(id => {
        const item = itemMap.get(id); if (!item) return;
        const saved = state.positions?.[id];
        const position = saved && Number(saved.page) === pageIndex ? { column:Number(saved.column), row:Number(saved.row) } : null;
        const span = itemSpan(item);
        if (position && cellsAreFree(occupied, position, span)) { normalized[id] = { page:pageIndex, ...position }; occupy(occupied, position, span); }
        else pending.push(item);
      });
      pending.forEach(item => { const position = firstFreePosition(occupied, itemSpan(item)); normalized[item.dataset.desktopItem] = { page:pageIndex, ...position }; occupy(occupied, position, itemSpan(item)); });
    });
    state.positions = normalized;
  }
  function ensureFirstPageTopSlots() {
    if (state.pageOneTopSlots === true) return;
    (state.pages[0] || []).forEach(id => {
      const position = state.positions[id];
      if (!position || Number(position.page) !== 0) return;
      position.row = Math.max(1, Number(position.row) || 1) + 2;
    });
    state.pageOneTopSlots = true;
  }
  function saveState() {
    state.pages = grids.map(grid => [...grid.children].map(item => item.dataset.desktopItem).filter(Boolean));
    state.positions = {};
    grids.forEach((grid, page) => [...grid.children].forEach(item => { const id = item.dataset.desktopItem; const position = itemPosition(item); if (id && position) state.positions[id] = { page, ...position }; }));
    state.dock = [...dock.querySelectorAll(':scope > .dock-item')].map(item => item.dataset.desktopItem).filter(Boolean);
    state.dockPosition = dockPosition();
    state.hiddenWidgets = [...hiddenPool.children].map(item => item.dataset.desktopItem).filter(id => id && id.startsWith('widget-'));
    state.widgetCopies = (state.widgetCopies || []).filter(copyInfo => copyInfo?.id && itemMap.has(copyInfo.id));
    state.folders = Array.isArray(state.folders) ? state.folders : [];
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
  function setAppContainerType(item, inDock) {
    if (!item?.dataset.desktopApp) return;
    item.classList.toggle('dock-item', inDock);
    item.classList.toggle('app-item', !inDock);
    const icon = item.querySelector('.app-icon, .dock-icon');
    const name = item.querySelector('.app-name, .dock-name');
    if (icon) icon.className = icon.className.replace(inDock ? 'app-icon' : 'dock-icon', inDock ? 'dock-icon' : 'app-icon');
    if (name) name.className = name.className.replace(inDock ? 'app-name' : 'dock-name', inDock ? 'dock-name' : 'app-name');
  }
  function registerItems() {
    widgetDefinitions.forEach(definition => {
      const element = document.querySelector(definition.selector);
      if (!element) return;
      element.dataset.desktopItem = definition.id;
      element.dataset.desktopWidget = definition.key;
      element.dataset.desktopSize = definition.size;
      element.dataset.desktopColumns = String(definition.columns);
      element.dataset.desktopRows = String(definition.rows);
      itemMap.set(definition.id, element);
    });
    document.querySelectorAll('.desktop-page .app-item, .dock-bar > .dock-item').forEach(element => {
      const key = element.dataset.appKey;
      if (!key) return;
      const id = `app-${key}`;
      element.dataset.desktopItem = id;
      element.dataset.desktopApp = key;
      element.dataset.desktopColumns = '1';
      element.dataset.desktopRows = '1';
      itemMap.set(id, element);
    });
    document.querySelectorAll('.desktop-page .desktop-created-folder').forEach(element => itemMap.set(element.dataset.desktopItem, element));
    (state.widgetCopies || []).forEach(copyInfo => {
      const id = String(copyInfo?.id || '');
      const sourceId = String(copyInfo?.sourceId || '');
      const source = itemMap.get(sourceId) || itemMap.get(widgetDefinitions.find(definition => definition.key === sourceId)?.id);
      if (!id || !source || itemMap.has(id) || !id.startsWith('widget-copy-')) return;
      const copy = source.cloneNode(true);
      copy.dataset.desktopItem = id;
      copy.dataset.desktopWidgetSource = source.dataset.desktopWidgetSource || source.dataset.desktopItem;
      copy.classList.add('desktop-widget-copy-item');
      copy.querySelectorAll('.desktop-widget-remove, .desktop-widget-copy').forEach(control => control.remove());
      itemMap.set(id, copy);
    });
  }
  function cleanState() {
    const persistedItems = new Set([...(Array.isArray(state.pages) ? state.pages.flat() : []), ...(Array.isArray(state.dock) ? state.dock : []), ...(Array.isArray(state.hiddenWidgets) ? state.hiddenWidgets : [])]);
    const rawFolders = Array.isArray(state.folders) ? state.folders : [];
    const nestedCreativeApps = rawFolders.filter(folder => Array.isArray(folder.apps) && folder.apps.includes('app-creative-folder')).flatMap(folder => folder.apps.filter(id => id !== 'app-creative-folder'));
    if (nestedCreativeApps.length) saveCreativeApps([...readCreativeApps(), ...nestedCreativeApps]);
    const folders = rawFolders.filter(folder => !Array.isArray(folder.apps) || !folder.apps.includes('app-creative-folder')).map((folder, index) => ({ id:String(folder.id || `folder-${index}`), name:String(folder.name || '文件夹'), apps:unique(Array.isArray(folder.apps) ? folder.apps : []).filter(id => itemMap.has(id) && id.startsWith('app-')) })).filter(folder => folder.apps.length >= 2);
    const validFolderIds = new Set(folders.map(folder => folder.id));
    document.querySelectorAll('.desktop-created-folder').forEach(launcher => { if (!validFolderIds.has(launcher.dataset.desktopItem)) { launcher.remove(); itemMap.delete(launcher.dataset.desktopItem); } });
    const ids = new Set(itemMap.keys());
    const creativeMemberIds = new Set(readCreativeApps().filter(id => ids.has(id)));
    const folderMemberIds = new Set([...folders.flatMap(folder => folder.apps), ...creativeMemberIds]);
    const used = new Set();
    const clean = values => unique(values).filter(id => ids.has(id) && !folderMemberIds.has(id) && !used.has(id) && used.add(id));
    const resultPages = state.pages.length ? state.pages.map(clean) : defaultPages.map(clean);
    while (resultPages.length < pages.length) resultPages.push([]);
    const resultDock = state.dock.length ? clean(state.dock) : clean(defaultDock);
    const hidden = new Set(clean(state.hiddenWidgets).filter(id => id.startsWith('widget-')));
    widgetDefinitions.filter(definition => definition.defaultHidden && !persistedItems.has(definition.id)).forEach(definition => { hidden.add(definition.id); used.add(definition.id); });
    if (!resultPages.some(list => list.includes('widget-search')) && !hidden.has('widget-search') && ids.has('widget-search')) { resultPages[1].unshift('widget-search'); used.add('widget-search'); }
    itemMap.forEach((item, id) => {
      if (used.has(id) || hidden.has(id) || folderMemberIds.has(id)) return;
      const preferred = defaultPages.findIndex(list => list.includes(id));
      if (id.startsWith('app-')) { (resultPages[Math.max(0, preferred)] ||= []).push(id); used.add(id); }
      else { (resultPages[Math.max(0, preferred)] ||= []).push(id); used.add(id); }
    });
    const savedDockPosition = state.dockPosition && typeof state.dockPosition === 'object' ? state.dockPosition : {};
    const dockPosition = { x:Number.isFinite(Number(savedDockPosition.x)) ? Number(savedDockPosition.x) : 0, y:Number.isFinite(Number(savedDockPosition.y)) ? Number(savedDockPosition.y) : 0 };
    return { pages:resultPages.slice(0, pages.length), dock:resultDock, dockPosition, hiddenWidgets:[...hidden], widgetCopies:(state.widgetCopies || []).filter(copyInfo => copyInfo?.id && itemMap.has(copyInfo.id)), folders, positions:state.positions && typeof state.positions === 'object' ? state.positions : {}, pageOneTopSlots:state.pageOneTopSlots === true };
  }
  function applyLayout() {
    state = cleanState();
    normalizePagePositions();
    ensureFirstPageTopSlots();
    state.pages.forEach((ids, index) => ids.forEach(id => {
      const item = itemMap.get(id); if (!item) return;
      setAppContainerType(item, false);
      applyDesktopPosition(item, state.positions[id]);
      grids[index].appendChild(item);
    }));
    state.dock.forEach(id => {
      const item = itemMap.get(id); if (!item) return;
      setAppContainerType(item, true);
      clearDesktopPosition(item);
      dock.appendChild(item);
    });
    applyDockPosition(state.dockPosition);
    state.hiddenWidgets.forEach(id => itemMap.get(id) && hiddenPool.appendChild(itemMap.get(id)));
    state.folders.flatMap(folder => folder.apps).forEach(id => itemMap.get(id) && hiddenPool.appendChild(itemMap.get(id)));
    readCreativeApps().forEach(id => itemMap.get(id) && hiddenPool.appendChild(itemMap.get(id)));
    document.querySelector('.page1-middle')?.remove();
    document.querySelector('.page2-apps-grid')?.remove();
    syncPageGridRowHeights();
    recoverOverflowWidgets();
    syncPageGridRowHeights();
    saveState();
  }
  function widgetDefinitionFor(widget) {
    const sourceId = widget?.dataset.desktopWidgetSource || widget?.dataset.desktopItem;
    return widgetDefinitions.find(definition => definition.id === sourceId || definition.key === widget?.dataset.desktopWidget);
  }
  function ensureWidgetControlsFor(widget) {
    const definition = widgetDefinitionFor(widget);
    const id = widget?.dataset.desktopItem;
    if (!widget || !definition || !id) return;
    if (!widget.querySelector(':scope > .desktop-widget-remove')) {
      const button = document.createElement('button');
      button.className = 'desktop-widget-remove';
      button.type = 'button';
      button.dataset.desktopWidgetRemove = id;
      button.setAttribute('aria-label', `移除${definition.name}小组件`);
      button.textContent = '−';
      widget.appendChild(button);
    }
    if (!widget.querySelector(':scope > .desktop-widget-copy')) {
      const button = document.createElement('button');
      button.className = 'desktop-widget-copy';
      button.type = 'button';
      button.dataset.desktopWidgetCopy = id;
      button.setAttribute('aria-label', `复制${definition.name}小组件`);
      button.textContent = '＋';
      widget.appendChild(button);
    }
  }
  function ensureWidgetControls() { itemMap.forEach(widget => { if (widget.dataset.desktopWidget) ensureWidgetControlsFor(widget); }); }

  function visibleGridRows(grid) {
    const style = getComputedStyle(grid);
    const tracks = gridTrackHeights(grid, style);
    const autoRowHeight = parseFloat(style.gridAutoRows) || parseFloat(style.getPropertyValue('--desktop-grid-row')) || 80;
    const rowGap = parseFloat(style.rowGap) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const desktopRect = desktop.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const availableHeight = Math.max(1, desktopRect.bottom - gridRect.top - paddingTop - paddingBottom);
    let usedHeight = 0;
    let rows = 0;
    while (rows < 100) {
      const height = tracks[rows] || autoRowHeight;
      const nextHeight = height + (rows ? rowGap : 0);
      if (usedHeight + nextHeight > availableHeight + 1) break;
      usedHeight += nextHeight;
      rows += 1;
    }
    return Math.max(1, rows);
  }
  function freeWidgetPosition(grid, widget) { return firstFreePosition(gridOccupiedCells(grid), itemSpan(widget), 0, visibleGridRows(grid)); }
  function recoverOverflowWidgets() {
    const overflow = [];
    grids.forEach(grid => {
      const maxRows = visibleGridRows(grid);
      [...grid.children].forEach(item => {
        const position = itemPosition(item);
        if (item.dataset.desktopWidget && position && position.row + itemSpan(item).rows - 1 > maxRows) overflow.push(item);
      });
    });
    let destination = null;
    overflow.forEach(item => {
      if (!destination || !appendAtTrailingPosition(item, destination, visibleGridRows(destination))) {
        destination = createBlankPage();
        state.pages.push([]);
        appendAtTrailingPosition(item, destination, visibleGridRows(destination));
      }
    });
  }
  function duplicateWidget(id) {
    const source = itemMap.get(id);
    const definition = widgetDefinitionFor(source);
    if (!source || !definition) return;
    const sourceId = source.dataset.desktopWidgetSource || source.dataset.desktopItem;
    let copyId = `widget-copy-${sourceId}-${Date.now()}`;
    while (itemMap.has(copyId)) copyId += '-x';
    const copy = source.cloneNode(true);
    copy.removeAttribute('data-desktop-item');
    copy.removeAttribute('data-desktop-column');
    copy.removeAttribute('data-desktop-row');
    copy.style.removeProperty('grid-column');
    copy.style.removeProperty('grid-row');
    copy.dataset.desktopItem = copyId;
    copy.dataset.desktopWidgetSource = sourceId;
    copy.classList.add('desktop-widget-copy-item');
    copy.querySelectorAll('.desktop-widget-remove, .desktop-widget-copy').forEach(control => control.remove());
    itemMap.set(copyId, copy);
    state.widgetCopies = state.widgetCopies || [];
    state.widgetCopies.push({ id:copyId, sourceId });
    ensureWidgetControlsFor(copy);

    const currentGrid = grids[currentPage()];
    let destination = currentGrid;
    let position = freeWidgetPosition(currentGrid, copy);
    if (!position) {
      destination = grids[grids.length - 1];
      position = freeWidgetPosition(destination, copy);
      if (!position) {
        addPage();
        destination = grids[grids.length - 1];
        position = freeWidgetPosition(destination, copy) || { column:1, row:1 };
      }
      desktop.scrollTo({ left:(grids.length - 1) * desktop.clientWidth, behavior:'smooth' });
    }
    applyDesktopPosition(copy, position);
    destination.appendChild(copy);
    copy.classList.add('desktop-widget-just-placed');
    setTimeout(() => copy.classList.remove('desktop-widget-just-placed'), 320);
    syncPageGridRowHeights();
    saveState();
    window.IdealMachineApps?.meihua?.updateAutoContrast?.();
  }

  function actualWidgetMarkup(definition) {
    const source = itemMap.get(definition.id);
    if (!source) return '<div class="desktop-widget-real-stage desktop-widget-unavailable">暂时无法预览</div>';
    const clone = source.cloneNode(true);
    clone.removeAttribute('data-desktop-item');
    clone.classList.remove('is-layout-source', 'desktop-layout-ghost');
    clone.querySelectorAll('[data-desktop-item]').forEach(item => item.removeAttribute('data-desktop-item'));
    clone.querySelectorAll('[data-edit]').forEach(item => item.removeAttribute('data-edit'));
    clone.querySelectorAll('.desktop-widget-remove, .desktop-widget-copy').forEach(item => item.remove());
    clone.classList.add('desktop-widget-real-preview', `desktop-widget-real-preview-${definition.key}`);
    return `<div class="desktop-widget-real-stage desktop-widget-real-stage-${definition.key}">${clone.outerHTML}</div>`;
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'desktop-layout-toolbar';
  toolbar.setAttribute('aria-hidden', 'true');
  toolbar.innerHTML = '<button data-desktop-add-menu type="button" aria-label="添加页面或小组件">＋</button>';
  document.body.appendChild(toolbar);
  const library = document.createElement('div');
  library.className = 'desktop-widget-library';
  library.setAttribute('aria-hidden', 'true');
  document.body.appendChild(library);
  const addMenu = document.createElement('div');
  addMenu.className = 'desktop-add-menu';
  addMenu.setAttribute('aria-hidden', 'true');
  addMenu.innerHTML = '<button data-desktop-add-page type="button"><b>＋</b><span>增加页面</span><small>新建一个桌面页面</small></button><button data-desktop-open-widget-library type="button"><b>▦</b><span>小组件库</span><small>添加或移除小组件</small></button><button data-desktop-delete-page type="button"><b>−</b><span>删除此页</span><small data-desktop-delete-page-note>当前页没有 App 时可用</small></button><button data-desktop-layout-done type="button"><b>✓</b><span>完成</span><small>保存并退出编辑</small></button>';
  document.body.appendChild(addMenu);
  function renderLibrary() {
    const hidden = new Set([...hiddenPool.children].map(item => item.dataset.desktopItem));
    const renderItem = item => `<article class="desktop-widget-option is-real is-${item.size}">${actualWidgetMarkup(item)}<footer><div><b>${item.name}</b><small>${item.description}</small></div><button data-desktop-widget-add="${item.id}" type="button" ${hidden.has(item.id) ? '' : 'disabled'}>${hidden.has(item.id) ? '添加' : '已在桌面'}</button></footer></article>`;
    const actual = widgetDefinitions.map(renderItem).join('');
    library.innerHTML = `<button class="desktop-widget-library-backdrop" data-desktop-library-close type="button" aria-label="关闭小组件库"></button><section role="dialog" aria-modal="true" aria-labelledby="desktopWidgetLibraryTitle"><header><div><span>WIDGET GALLERY</span><h2 id="desktopWidgetLibraryTitle">小组件库</h2><p>只显示已经设计完成的小组件，预览与桌面实际样式一致。</p></div><button data-desktop-library-close type="button" aria-label="关闭">×</button></header><main><div class="desktop-widget-library-label"><b>现有小组件</b><small>真实样式</small></div><div class="desktop-widget-library-grid">${actual}</div></main></section>`;
  }
  function currentPageHasApps() { const grid = grids[currentPage()]; return Boolean(grid && [...grid.children].some(item => item.dataset.desktopApp || item.classList.contains('desktop-created-folder'))); }
  function updateDeletePageButton() {
    const button = addMenu.querySelector('[data-desktop-delete-page]');
    const note = addMenu.querySelector('[data-desktop-delete-page-note]');
    if (!button || !note) return;
    const hasApps = currentPageHasApps();
    const cannotDelete = pages.length <= 2 || hasApps;
    button.disabled = cannotDelete;
    note.textContent = pages.length <= 2 ? '至少保留两个页面' : hasApps ? '当前页有 App，不能删除' : '当前页没有 App，可删除';
  }
  function openAddMenu() { updateDeletePageButton(); addMenu.classList.add('is-open'); addMenu.setAttribute('aria-hidden', 'false'); }
  function closeAddMenu() { addMenu.classList.remove('is-open'); addMenu.setAttribute('aria-hidden', 'true'); }
  function openLibrary() { closeAddMenu(); renderLibrary(); library.classList.add('is-open'); library.setAttribute('aria-hidden', 'false'); }
  function closeLibrary() { library.classList.remove('is-open'); library.setAttribute('aria-hidden', 'true'); }
  function syncPageIndicator() {
    const current = currentPage();
    pageIndicator.replaceChildren(...pages.map((page, index) => { const dot = document.createElement('span'); dot.className = `dot${index === current ? ' active' : ''}`; return dot; }));
    desktop.dispatchEvent(new Event('scroll'));
  }
  function addPage() {
    const index = pages.length;
    createBlankPage();
    state.pages.push([]);
    saveState();
    closeAddMenu();
    syncPageIndicator();
    desktop.scrollTo({ left:index * desktop.clientWidth, behavior:'smooth' });
  }
  function normalizePageClasses() {
    pages.forEach((page, index) => {
      page.className = page.className.replace(/\bpage-\d+\b/g, `page-${index + 1}`);
      const grid = grids[index];
      if (!grid) return;
      grid.className = grid.className.replace(/\bdesktop-layout-grid-\d+\b/g, `desktop-layout-grid-${index + 1}`);
      grid.dataset.desktopGrid = String(index);
    });
  }
  function deleteCurrentPage() {
    const index = currentPage();
    const page = pages[index];
    const grid = grids[index];
    if (!page || !grid || pages.length <= 2 || currentPageHasApps()) return;
    [...grid.children].filter(item => item.dataset.desktopWidget).forEach(widget => hiddenPool.appendChild(widget));
    page.remove();
    pages.splice(index, 1);
    grids.splice(index, 1);
    normalizePageClasses();
    saveState();
    closeAddMenu();
    syncPageIndicator();
    desktop.scrollTo({ left:Math.min(index, pages.length - 1) * desktop.clientWidth, behavior:'smooth' });
  }
  function currentPage() { return Math.max(0, Math.min(pages.length - 1, Math.round(desktop.scrollLeft / Math.max(1, desktop.clientWidth)))); }
  desktop.addEventListener('scroll', () => { if (addMenu.classList.contains('is-open')) updateDeletePageButton(); }, { passive:true });
  function setEditing(value) {
    if (!value && editing) commitFolderName(createdFolderTitle?.textContent || '');
    editing = Boolean(value);
    document.body.classList.toggle('desktop-edit-mode', editing);
    toolbar.setAttribute('aria-hidden', String(!editing));
    syncFolderNameEditing();
    if (!editing) { closeLibrary(); closeAddMenu(); cleanupDrag(false); cleanupFolderDrag(false); cleanupDockDrag(false); createdFolderLayer?.classList.remove('desktop-folder-edit-mode'); }
  }
  function finishEditing() { saveState(); setEditing(false); }
  function enterEditing() { suppressClickUntil = Date.now() + 700; setEditing(true); navigator.vibrate?.(18); }
  const createdFolderLayer = document.querySelector('[data-desktop-folder]');
  const createdFolderGrid = createdFolderLayer?.querySelector('.desktop-folder-grid');
  const createdFolderTitle = createdFolderLayer?.querySelector('.desktop-folder-header h2');
  const originalFolderGridHTML = createdFolderGrid?.innerHTML || '';
  const staticFolderTrigger = document.querySelector('[data-folder-open]');
  const staticFolderTitle = createdFolderTitle?.textContent?.trim() || '创作';
  const staticFolderNameKey = 'ideal-machine-creative-folder-name';
  let openCreatedFolderId = '';
  let folderNameBeforeEdit = '';
  const savedStaticFolderName = localStorage.getItem(staticFolderNameKey)?.trim();
  if (savedStaticFolderName && staticFolderTrigger) {
    staticFolderTrigger.querySelector('.app-name')?.replaceChildren(savedStaticFolderName);
    if (!openCreatedFolderId && createdFolderTitle) createdFolderTitle.textContent = savedStaticFolderName;
  }
  const escapeFolderText = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  function openCreatedFolder(id) {
    const folder = state.folders.find(item => item.id === id);
    if (!folder || !createdFolderLayer || !createdFolderGrid) return;
    openCreatedFolderId = id;
    if (createdFolderTitle) createdFolderTitle.textContent = folder.name;
    createdFolderGrid.innerHTML = folder.apps.map(appId => {
      const source = appSourceById(appId);
      const name = source?.querySelector('.app-name, .dock-name')?.textContent?.trim() || 'App';
      const icon = source?.querySelector('.app-icon, .dock-icon');
      return `<button class="folder-app-item" data-created-folder-app="${escapeFolderText(appId)}" type="button"><i class="folder-app-icon generated-folder-icon" aria-hidden="true">${icon?.innerHTML || `<span>${escapeFolderText(name.slice(0, 1))}</span>`}</i><b class="folder-app-name">${escapeFolderText(name)}</b></button>`;
    }).join('');
    createdFolderLayer.classList.toggle('desktop-folder-edit-mode', editing);
    createdFolderLayer.classList.add('is-open');
    createdFolderLayer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { createdFolderGrid.querySelector('[data-created-folder-app]')?.focus(); window.dispatchEvent(new Event('ideal-machine-folder-open')); });
  }
  function createCreativeDesktopSource(appId, folderButton) {
    const key = String(appId || '').replace(/^app-/, '');
    if (!key || !folderButton) return null;
    const source = document.createElement('div');
    source.className = 'app-item';
    source.dataset.appKey = key;
    source.dataset.folderApp = key;
    source.dataset.desktopItem = appId;
    source.dataset.desktopApp = key;
    source.dataset.desktopColumns = '1';
    source.dataset.desktopRows = '1';
    const icon = document.createElement('div');
    icon.className = 'app-icon';
    icon.innerHTML = folderButton.querySelector('.folder-app-icon')?.innerHTML || `<span>${key.slice(0, 1)}</span>`;
    const name = document.createElement('div');
    name.className = 'app-name';
    name.textContent = folderButton.querySelector('.folder-app-name')?.textContent?.trim() || key;
    source.append(icon, name);
    itemMap.set(appId, source);
    return source;
  }
  function restoreRemovedCreativeApps() {
    const sourceGrid = grids[0];
    if (!sourceGrid) return;
    readRemovedCreativeApps().forEach(id => {
      const key = id.replace(/^app-/, '');
      if (document.querySelector(`.app-item[data-app-key="${key}"]`)) return;
      const folderButton = [...document.querySelectorAll('.desktop-folder-grid [data-folder-app]')].find(item => item.dataset.folderApp === key);
      if (!folderButton) return;
      const source = createCreativeDesktopSource(id, folderButton);
      sourceGrid.appendChild(source);
    });
  }
  function closeCreatedFolder() {
    if (!openCreatedFolderId || !createdFolderLayer) return false;
    openCreatedFolderId = '';
    createdFolderGrid.innerHTML = originalFolderGridHTML;
    if (createdFolderTitle) createdFolderTitle.textContent = localStorage.getItem(staticFolderNameKey)?.trim() || staticFolderTitle;
    createdFolderLayer.classList.remove('is-open');
    createdFolderLayer.classList.remove('desktop-folder-edit-mode');
    createdFolderLayer.setAttribute('aria-hidden', 'true');
    return true;
  }
  function closeOpenFolderLayer(fast = false) {
    if (!createdFolderLayer) return false;
    if (fast) createdFolderLayer.classList.add('is-fast-closing');
    const closed = openCreatedFolderId ? closeCreatedFolder() : (() => {
      createdFolderLayer.classList.remove('is-open', 'desktop-folder-edit-mode');
      createdFolderLayer.setAttribute('aria-hidden', 'true');
      if (!fast) staticFolderTrigger?.focus();
      return true;
    })();
    if (fast) requestAnimationFrame(() => requestAnimationFrame(() => createdFolderLayer.classList.remove('is-fast-closing')));
    return closed;
  }
  function currentFolderName() {
    return openCreatedFolderId ? state.folders.find(item => item.id === openCreatedFolderId)?.name || '文件夹' : staticFolderTrigger?.querySelector('.app-name')?.textContent?.trim() || staticFolderTitle;
  }
  function commitFolderName(value) {
    const current = currentFolderName();
    const next = String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 30);
    if (!next) { if (createdFolderTitle) createdFolderTitle.textContent = current; return; }
    if (next === current) return;
    if (openCreatedFolderId) {
      const folder = state.folders.find(item => item.id === openCreatedFolderId);
      if (!folder) return;
      folder.name = next;
      itemMap.get(folder.id)?.querySelector('.app-name')?.replaceChildren(folder.name);
      if (createdFolderTitle) createdFolderTitle.textContent = folder.name;
      saveState();
    } else {
      localStorage.setItem(staticFolderNameKey, next);
      staticFolderTrigger?.querySelector('.app-name')?.replaceChildren(next);
      if (createdFolderTitle) createdFolderTitle.textContent = next;
    }
  }
  function syncFolderNameEditing() {
    if (!createdFolderTitle) return;
    if (editing) {
      createdFolderTitle.setAttribute('contenteditable', 'true');
      createdFolderTitle.setAttribute('role', 'textbox');
      createdFolderTitle.setAttribute('spellcheck', 'false');
    } else {
      createdFolderTitle.removeAttribute('contenteditable');
      createdFolderTitle.removeAttribute('role');
      createdFolderTitle.removeAttribute('spellcheck');
    }
  }
  function createBlankPage() {
    const index = pages.length;
    const page = document.createElement('section');
    page.className = `desktop-page page-${index + 1}`;
    page.innerHTML = '<div class="bg-layer"></div>';
    desktop.appendChild(page);
    pages.push(page);
    grids.push(createGrid(page, index));
    return grids[grids.length - 1];
  }
  function beginFolderNameEdit() {
    if (!editing || !createdFolderTitle) return;
    folderNameBeforeEdit = currentFolderName();
    createdFolderTitle.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(createdFolderTitle);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  function createAppFolder(source, target) {
    if (!source?.dataset.desktopApp || !target?.dataset.desktopApp || target.matches('[data-folder-open]') || source === target) return false;
    const container = target.parentElement;
    if (!container?.matches('.desktop-layout-grid')) return false;
    const folder = { id:`folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name:'文件夹', apps:[target.dataset.desktopItem, source.dataset.desktopItem] };
    const launcher = folderLauncher(folder);
    const position = itemPosition(target) || itemPosition(drag.placeholder) || trailingPosition(container, launcher);
    drag.placeholder.remove();
    target.remove();
    hiddenPool.appendChild(source);
    hiddenPool.appendChild(target);
    applyDesktopPosition(launcher, position);
    container.appendChild(launcher);
    itemMap.set(folder.id, launcher);
    state.folders.push(folder);
    saveState();
    return true;
  }
  function refreshFolderLauncher(folder) {
    const oldLauncher = itemMap.get(folder.id);
    if (!oldLauncher) return;
    const launcher = folderLauncher(folder);
    const position = itemPosition(oldLauncher);
    oldLauncher.replaceWith(launcher);
    if (position) applyDesktopPosition(launcher, position);
    itemMap.set(folder.id, launcher);
  }
  function addAppToFolder(source, target) {
    if (!source?.dataset.desktopApp || !target?.dataset.desktopFolderId) return false;
    const folder = state.folders.find(item => item.id === target.dataset.desktopFolderId);
    if (!folder || folder.apps.includes(source.dataset.desktopItem)) return false;
    drag.placeholder.remove();
    folder.apps.push(source.dataset.desktopItem);
    source.remove();
    hiddenPool.appendChild(source);
    refreshFolderLauncher(folder);
    saveState();
    if (openCreatedFolderId === folder.id) openCreatedFolder(folder.id);
    return true;
  }
  function addAppToCreativeFolder(source, target) {
    if (!source?.dataset.desktopApp || !target?.matches('[data-folder-open]')) return false;
    const appId = source.dataset.desktopItem;
    if (!appId || readCreativeApps().includes(appId)) return false;
    drag.placeholder.remove();
    source.remove();
    hiddenPool.appendChild(source);
    saveCreativeApps([...readCreativeApps(), appId]);
    refreshCreativeFolderIcon();
    saveState();
    return true;
  }
  function removeAppFromFolder(folderId, appId, dropTarget = null) {
    const folder = state.folders.find(item => item.id === folderId);
    const source = itemMap.get(appId);
    if (!folder || !source) return;
    const launcher = itemMap.get(folder.id);
    const launcherPosition = itemPosition(launcher);
    closeOpenFolderLayer(true);
    folder.apps = folder.apps.filter(id => id !== appId);
    const destination = dropTarget?.grid?.matches('.desktop-layout-grid') ? dropTarget.grid : grids[currentPage()];
    if (folder.apps.length < 2) {
      const remaining = itemMap.get(folder.apps[0]);
      launcher?.remove();
      itemMap.delete(folder.id);
      state.folders = state.folders.filter(item => item.id !== folder.id);
      if (remaining) {
        setAppContainerType(remaining, false);
        applyDesktopPosition(remaining, launcherPosition || trailingPosition(destination, remaining));
        destination.appendChild(remaining);
      }
    } else {
      refreshFolderLauncher(folder);
    }
    placeRemovedApp(source, dropTarget);
    syncPageGridRowHeights();
    saveState();
  }
  function removeAppFromCreativeFolder(appId, button, dropTarget = null) {
    if (!editing || !appId) return;
    const builtin = ['app-debate','app-fanfic','app-magazine'].includes(appId);
    const ids = readCreativeApps();
    const removed = readRemovedCreativeApps();
    if (!builtin && !ids.includes(appId)) return;
    let source = appSourceById(appId);
    if (builtin && !source) {
      const folderButton = button.closest('.folder-app-item');
      source = createCreativeDesktopSource(appId, folderButton);
    }
    closeOpenFolderLayer(true);
    if (builtin) saveRemovedCreativeApps([...removed, appId]);
    else saveCreativeApps(ids.filter(id => id !== appId));
    if (source) placeRemovedApp(source, dropTarget);
    refreshCreativeFolderIcon();
    button.closest('.folder-app-item')?.remove();
    syncPageGridRowHeights();
    saveState();
  }
  function folderItemKey(item) { return item?.dataset.createdFolderApp || item?.dataset.folderApp || ''; }
  function saveFolderOrder(grid) {
    const order = [...grid.children].map(folderItemKey).filter(Boolean);
    if (openCreatedFolderId) {
      const folder = state.folders.find(item => item.id === openCreatedFolderId);
      if (!folder) return;
      folder.apps = order.filter(id => id.startsWith('app-'));
      refreshFolderLauncher(folder);
      saveState();
    } else {
      localStorage.setItem(creativeFolderOrderKey, JSON.stringify(order));
    }
  }
  function beginFolderDrag(item, event) {
    if (!editing || folderDrag || drag || event.button > 0) return;
    const grid = item.parentElement;
    if (!grid?.matches('.desktop-folder-grid')) return;
    const rect = item.getBoundingClientRect();
    const placeholder = document.createElement('div');
    placeholder.className = 'desktop-folder-layout-placeholder';
    placeholder.style.height = `${rect.height}px`;
    item.after(placeholder);
    const ghost = item.cloneNode(true);
    ghost.querySelectorAll('.folder-app-remove').forEach(button => button.remove());
    ghost.classList.add('desktop-folder-drag-ghost');
    Object.assign(ghost.style, { width:`${rect.width}px`, height:`${rect.height}px`, left:`${rect.left}px`, top:`${rect.top}px` });
    document.body.appendChild(ghost);
    item.classList.add('is-folder-layout-source');
    item.style.pointerEvents = 'none';
    folderDrag = { item, grid, placeholder, ghost, folderId:openCreatedFolderId, folderClosed:false, edgeReady:true, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, moved:false, offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top };
    event.preventDefault();
  }
  function moveFolderDrag(event) {
    if (!folderDrag || event.pointerId !== folderDrag.pointerId) return;
    if (Math.hypot(event.clientX - folderDrag.startX, event.clientY - folderDrag.startY) > 8 && !folderDrag.moved) {
      folderDrag.moved = true;
      folderDrag.ghost.classList.add('is-active');
      folderDrag.item.classList.add('is-folder-dragging');
    }
    folderDrag.ghost.style.left = `${event.clientX - folderDrag.offsetX}px`;
    folderDrag.ghost.style.top = `${event.clientY - folderDrag.offsetY}px`;
    const pointStack = document.elementsFromPoint(event.clientX, event.clientY);
    const insidePanel = pointStack.some(element => element.closest?.('.desktop-folder-panel'));
    if (folderDrag.moved && !insidePanel && !folderDrag.folderClosed) {
      folderDrag.folderClosed = true;
      closeOpenFolderLayer(true);
    }
    const atLeftEdge = event.clientX < 34;
    const atRightEdge = event.clientX > innerWidth - 34;
    if (!atLeftEdge && !atRightEdge) folderDrag.edgeReady = true;
    if (folderDrag.folderClosed && folderDrag.edgeReady && Date.now() - edgeTurnAt > 650) {
      const pageIndex = currentPage();
      if (atLeftEdge && pageIndex > 0) {
        desktop.scrollTo({ left:(pageIndex - 1) * desktop.clientWidth, behavior:'smooth' });
        folderDrag.edgeReady = false;
        edgeTurnAt = Date.now();
      } else if (atRightEdge && pageIndex < pages.length - 1) {
        desktop.scrollTo({ left:(pageIndex + 1) * desktop.clientWidth, behavior:'smooth' });
        folderDrag.edgeReady = false;
        edgeTurnAt = Date.now();
      }
    }
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const target = under?.closest('.folder-app-item');
    if (target && target.parentElement === folderDrag.grid && target !== folderDrag.item) {
      const rect = target.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2 || (event.clientY < rect.bottom && event.clientX < rect.left + rect.width / 2);
      folderDrag.grid.insertBefore(folderDrag.placeholder, before ? target : target.nextSibling);
      event.preventDefault();
    } else if (under?.closest('.desktop-folder-grid') === folderDrag.grid) {
      folderDrag.grid.appendChild(folderDrag.placeholder);
      event.preventDefault();
    }
  }
  function cleanupFolderDrag(commit, event) {
    if (!folderDrag) return;
    const current = folderDrag;
    const pointStack = event ? document.elementsFromPoint(event.clientX, event.clientY) : [];
    const returnLauncher = current.folderClosed ? pointStack.map(element => {
      if (current.folderId) {
        const launcher = element.closest?.('[data-desktop-folder-id]');
        return launcher?.dataset.desktopFolderId === current.folderId ? launcher : null;
      }
      return current.item.dataset.folderApp ? element.closest?.('[data-folder-open]') : null;
    }).find(Boolean) : null;
    const returningToFolder = Boolean(commit && current.moved && returnLauncher);
    const outsidePanel = Boolean(commit && current.moved && event && !returningToFolder && (current.folderClosed || !pointStack.some(element => element.closest?.('.desktop-folder-panel'))));
    const dropGrid = outsidePanel ? pointStack.find(element => element.matches?.('.desktop-layout-grid')) : null;
    const dropTarget = dropGrid ? { grid:dropGrid, position:gridPositionFromPoint(dropGrid, event.clientX, event.clientY, current.item) } : null;
    if (!outsidePanel && current.placeholder.parentNode) current.placeholder.parentNode.insertBefore(current.item, current.placeholder);
    current.item.classList.remove('is-folder-layout-source', 'is-folder-dragging');
    current.item.style.pointerEvents = '';
    current.placeholder.remove();
    current.ghost.remove();
    folderDrag = null;
    if (returningToFolder) {
      returnLauncher.classList.remove('desktop-folder-return-feedback');
      requestAnimationFrame(() => {
        returnLauncher.classList.add('desktop-folder-return-feedback');
        setTimeout(() => returnLauncher.classList.remove('desktop-folder-return-feedback'), 320);
      });
      suppressClickUntil = Date.now() + 450;
      return;
    }
    if (outsidePanel) {
      if (current.item.dataset.createdFolderApp && current.folderId) removeAppFromFolder(current.folderId, current.item.dataset.createdFolderApp, dropTarget);
      else if (current.item.dataset.folderApp) {
        const key = current.item.dataset.folderApp;
        const appId = key.startsWith('creative-extra:') ? key.slice('creative-extra:'.length) : `app-${key}`;
        removeAppFromCreativeFolder(appId, current.item, dropTarget);
      }
      suppressClickUntil = Date.now() + 450;
      return;
    }
    if (commit && current.moved) saveFolderOrder(current.grid);
    suppressClickUntil = current.moved ? Date.now() + 450 : 0;
  }
  createdFolderTitle?.addEventListener('click', event => {
    if (!editing) return;
    beginFolderNameEdit();
    event.stopPropagation();
  });
  createdFolderTitle?.addEventListener('blur', () => { if (editing) commitFolderName(createdFolderTitle.textContent); });
  createdFolderTitle?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); createdFolderTitle.blur(); }
    if (event.key === 'Escape') { event.preventDefault(); createdFolderTitle.textContent = folderNameBeforeEdit || currentFolderName(); createdFolderTitle.blur(); }
  });
  function placeholderFor(item) { const placeholder = document.createElement('div'); placeholder.className = 'desktop-layout-placeholder'; placeholder.dataset.desktopSize = item.dataset.desktopSize || ''; placeholder.dataset.desktopApp = item.dataset.desktopApp || ''; placeholder.dataset.desktopColumns = item.dataset.desktopColumns || '1'; placeholder.dataset.desktopRows = item.dataset.desktopRows || '1'; return placeholder; }
  function gridPositionFromPoint(grid, clientX, clientY, item) {
    const rect = grid.getBoundingClientRect();
    const style = getComputedStyle(grid);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const columnGap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;
    const tracks = gridTrackHeights(grid, style);
    const autoRowHeight = parseFloat(style.gridAutoRows) || parseFloat(style.getPropertyValue('--desktop-grid-row')) || 80;
    const contentWidth = Math.max(1, rect.width - paddingLeft - paddingRight);
    const columnWidth = Math.max(1, (contentWidth - columnGap * (desktopColumns - 1)) / desktopColumns);
    const span = itemSpan(item);
    const rawColumn = Math.floor(Math.max(0, clientX - rect.left - paddingLeft) / (columnWidth + columnGap)) + 1;
    const column = Math.max(1, Math.min(desktopColumns - span.columns + 1, rawColumn));
    const offsetY = Math.max(0, clientY - rect.top - paddingTop);
    let row = 1;
    let rowTop = 0;
    while (row < 400) {
      const rowHeight = tracks[row - 1] || autoRowHeight;
      if (offsetY < rowTop + rowHeight + rowGap / 2) break;
      rowTop += rowHeight + rowGap;
      row += 1;
    }
    return { column, row };
  }
  function positionIsAvailable(grid, item, position) { return cellsAreFree(gridOccupiedCells(grid, item), position, itemSpan(item)); }
  function beginDrag(item, event) {
    if (!editing || drag || event.button > 0) return;
    const rect = item.getBoundingClientRect();
    const placeholder = placeholderFor(item);
    placeholder.style.minHeight = `${rect.height}px`;
    const originalPosition = itemPosition(item);
    if (originalPosition) applyDesktopPosition(placeholder, originalPosition);
    item.parentNode.insertBefore(placeholder, item.nextSibling);
    const ghost = item.cloneNode(true);
    ghost.querySelectorAll('.desktop-widget-remove').forEach(button => button.remove());
    ghost.classList.add('desktop-layout-ghost');
    Object.assign(ghost.style, { width:`${rect.width}px`, height:`${rect.height}px`, left:`${rect.left}px`, top:`${rect.top}px` });
    document.body.appendChild(ghost);
    item.classList.add('is-layout-source');
    drag = { item, placeholder, ghost, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY, moved:false, edgeDirection:0, edgeTimer:0, offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top, originalContainer:item.parentElement, originalPosition, drop:null };
  }
  function allowedContainer(container, item) {
    if (!container) return false;
    if (item.dataset.desktopWidget) return container.matches('.desktop-layout-grid');
    if (container.matches('.dock-bar')) return item.classList.contains('dock-item') || container.querySelectorAll(':scope > .dock-item:not(.is-layout-source)').length < 4;
    return container.matches('.desktop-layout-grid');
  }
  function updateDragDestination(clientX, clientY, sourceEvent = null) {
    if (!drag) return;
    const under = document.elementFromPoint(clientX, clientY);
    const container = under?.closest('.desktop-layout-grid, .dock-bar');
    if (!allowedContainer(container, drag.item)) return;
    if (container.matches('.desktop-layout-grid')) {
      const position = gridPositionFromPoint(container, clientX, clientY, drag.item);
      const target = under?.closest('[data-desktop-item]');
      const canMerge = Boolean(drag.item.dataset.desktopApp && target && target !== drag.item && (target.dataset.desktopApp || target.dataset.desktopFolderId || target.matches('[data-folder-open]')));
      if (!canMerge && !positionIsAvailable(container, drag.item, position)) return;
      applyDesktopPosition(drag.placeholder, position);
      container.appendChild(drag.placeholder);
      drag.drop = { container, position };
      sourceEvent?.preventDefault();
      return;
    }
    clearDesktopPosition(drag.placeholder);
    const candidates = [...container.children].filter(item => item !== drag.item && item !== drag.placeholder && !item.classList.contains('is-layout-source'));
    const before = candidates.find(item => { const rect = item.getBoundingClientRect(); return clientY < rect.top + rect.height / 2 || (clientY < rect.bottom && clientX < rect.left + rect.width / 2); });
    container.insertBefore(drag.placeholder, before || null);
    drag.drop = { container, position:null };
    sourceEvent?.preventDefault();
  }
  function setDragEdgeDirection(direction) {
    if (!drag) return;
    if (drag.edgeDirection === direction && drag.edgeTimer) return;
    if (drag.edgeTimer) clearTimeout(drag.edgeTimer);
    drag.edgeTimer = 0;
    drag.edgeDirection = direction;
    if (!direction) return;
    drag.edgeTimer = setTimeout(() => {
      if (!drag || drag.edgeDirection !== direction) return;
      drag.edgeTimer = 0;
      const index = currentPage();
      const targetIndex = Math.max(0, Math.min(pages.length - 1, index + direction));
      if (targetIndex === index) { drag.edgeDirection = 0; return; }
      desktop.scrollTo({ left:targetIndex * desktop.clientWidth, behavior:'smooth' });
      edgeTurnAt = Date.now();
      setTimeout(() => {
        if (!drag || drag.edgeDirection !== direction) return;
        updateDragDestination(drag.lastX, drag.lastY);
        drag.edgeDirection = 0;
        setDragEdgeDirection(direction);
      }, 360);
    }, 260);
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8) drag.moved = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    const edgeDirection = event.clientX < 34 ? -1 : (event.clientX > innerWidth - 34 ? 1 : 0);
    setDragEdgeDirection(edgeDirection);
    updateDragDestination(event.clientX, event.clientY, event);
  }
  function cleanupDrag(commit, event) {
    if (!drag) return;
    if (drag.edgeTimer) clearTimeout(drag.edgeTimer);
    drag.edgeTimer = 0;
    drag.edgeDirection = 0;
    const under = event ? document.elementFromPoint(event.clientX, event.clientY) : null;
    const target = under?.closest('[data-desktop-item]');
    const creativeFolderAdded = commit && target && target !== drag.item && addAppToCreativeFolder(drag.item, target);
    const folderAdded = !creativeFolderAdded && commit && target && target !== drag.item && addAppToFolder(drag.item, target);
    const folderCreated = !creativeFolderAdded && !folderAdded && commit && target && target !== drag.item && createAppFolder(drag.item, target);
    if (!creativeFolderAdded && !folderAdded && !folderCreated && commit && drag.placeholder.parentNode) {
      const destination = drag.placeholder.parentNode;
      const inDock = destination.matches('.dock-bar');
      setAppContainerType(drag.item, inDock);
      if (inDock) {
        clearDesktopPosition(drag.item);
        destination.insertBefore(drag.item, drag.placeholder);
      } else {
        applyDesktopPosition(drag.item, itemPosition(drag.placeholder) || drag.originalPosition || trailingPosition(destination, drag.item));
        destination.appendChild(drag.item);
      }
      syncPageGridRowHeights();
      saveState();
    }
    const moved = drag.moved;
    drag.item.classList.remove('is-layout-source'); drag.placeholder.remove(); drag.ghost.remove(); drag = null; suppressClickUntil = moved ? Date.now() + 450 : 0;
  }
  function removeWidget(id) { const widget = itemMap.get(id); if (!widget) return; hiddenPool.appendChild(widget); syncPageGridRowHeights(); saveState(); }
  function addWidget(id) { const widget = itemMap.get(id); if (!widget) return; const libraryMain = library.querySelector('main'); const scrollTop = libraryMain?.scrollTop || 0; let destination = grids[grids.length - 1]; const placedOnLastPage = appendAtTrailingPosition(widget, destination, visibleGridRows(destination)); if (!placedOnLastPage) { addPage(); destination = grids[grids.length - 1]; appendAtTrailingPosition(widget, destination); desktop.scrollTo({ left:(grids.length - 1) * desktop.clientWidth, behavior:'smooth' }); } syncPageGridRowHeights(); saveState(); renderLibrary(); const nextLibraryMain = library.querySelector('main'); if (nextLibraryMain) nextLibraryMain.scrollTop = scrollTop; window.IdealMachineApps?.meihua?.updateAutoContrast?.(); }

  function dockPosition(value = state.dockPosition) {
    const y = Number(value?.y);
    return { x:0, y:Number.isFinite(y) ? y : 0 };
  }
  function applyDockPosition(value) {
    const position = dockPosition(value);
    state.dockPosition = position;
    const transform = position.x || position.y ? `translate3d(${position.x}px, ${position.y}px, 0)` : '';
    dock.style.transform = transform;
    pageIndicator.style.transform = transform;
  }
  function safeAreaInset(name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  }
  function dockGroupRect() {
    const dockRect = dock.getBoundingClientRect();
    const indicatorRect = pageIndicator.getBoundingClientRect();
    const left = Math.min(dockRect.left, indicatorRect.left);
    const top = Math.min(dockRect.top, indicatorRect.top);
    const right = Math.max(dockRect.right, indicatorRect.right);
    const bottom = Math.max(dockRect.bottom, indicatorRect.bottom);
    return { left, top, right, bottom, width:right - left, height:bottom - top };
  }
  function constrainedDockPosition(value) {
    const position = dockPosition(value);
    applyDockPosition(position);
    const rect = dockGroupRect();
    const sideGap = 8;
    const minLeft = sideGap;
    const maxLeft = Math.max(minLeft, innerWidth - rect.width - sideGap);
    const minTop = safeAreaInset('--safe-area-top') + sideGap;
    const maxTop = Math.max(minTop, innerHeight - rect.height - safeAreaInset('--safe-area-bottom') - sideGap);
    const left = Math.max(minLeft, Math.min(maxLeft, rect.left));
    const top = Math.max(minTop, Math.min(maxTop, rect.top));
    return { x:position.x + left - rect.left, y:position.y + top - rect.top };
  }
  function beginDockDrag(event) {
    if (!editing || dockDrag || drag || folderDrag || event.button > 0) return;
    const rect = dockGroupRect();
    const startPosition = dockPosition();
    dockDrag = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, startRect:rect, startPosition, moved:false };
    dock.classList.add('is-dock-dragging');
    pageIndicator.classList.add('is-dock-dragging');
    try { pageIndicator.setPointerCapture?.(event.pointerId); } catch {}
    navigator.vibrate?.(16);
    event.preventDefault();
  }
  function moveDockGesture(event) {
    if (!dockDrag || event.pointerId !== dockDrag.pointerId) return;
    const deltaX = event.clientX - dockDrag.startX;
    const deltaY = event.clientY - dockDrag.startY;
    if (Math.hypot(deltaX, deltaY) > 4) dockDrag.moved = true;
    const sideGap = 8;
    const minLeft = sideGap;
    const maxLeft = Math.max(minLeft, innerWidth - dockDrag.startRect.width - sideGap);
    const minTop = safeAreaInset('--safe-area-top') + sideGap;
    const maxTop = Math.max(minTop, innerHeight - dockDrag.startRect.height - safeAreaInset('--safe-area-bottom') - sideGap);
    const nextLeft = Math.max(minLeft, Math.min(maxLeft, dockDrag.startRect.left + deltaX));
    const nextTop = Math.max(minTop, Math.min(maxTop, dockDrag.startRect.top + deltaY));
    applyDockPosition({ x:0, y:dockDrag.startPosition.y + nextTop - dockDrag.startRect.top });
    event.preventDefault();
  }
  function cleanupDockDrag(commit) {
    if (!dockDrag) return;
    const moved = dockDrag.moved;
    const startPosition = dockDrag.startPosition;
    const pointerId = dockDrag.pointerId;
    dock.classList.remove('is-dock-dragging');
    pageIndicator.classList.remove('is-dock-dragging');
    dockDrag = null;
    try { if (pageIndicator.hasPointerCapture?.(pointerId)) pageIndicator.releasePointerCapture(pointerId); } catch {}
    if (commit) { applyDockPosition(constrainedDockPosition()); saveState(); window.IdealMachineApps?.meihua?.updateAutoContrast?.(); }
    else applyDockPosition(startPosition);
    suppressClickUntil = moved ? Date.now() + 450 : suppressClickUntil;
  }

  document.addEventListener('pointerdown', event => {
    if (event.target.closest('.desktop-layout-toolbar, .desktop-widget-library, .desktop-widget-remove, .desktop-widget-copy')) return;
    if (editing && event.target.closest('.page-indicator') === pageIndicator) { beginDockDrag(event); return; }
    const folderItem = event.target.closest('.folder-app-item[data-folder-app], .folder-app-item[data-created-folder-app]');
    if (editing && folderItem) { beginFolderDrag(folderItem, event); return; }
    const item = event.target.closest('[data-desktop-item]');
    if (editing && item) beginDrag(item, event);
  }, true);
  document.addEventListener('pointermove', event => { if (dockDrag) moveDockGesture(event); else if (folderDrag) moveFolderDrag(event); else if (drag) moveDrag(event); }, { capture:true, passive:false });
  document.addEventListener('pointerup', event => {
    if (dockDrag && event.pointerId === dockDrag.pointerId) { cleanupDockDrag(true); return; }
    if (folderDrag && event.pointerId === folderDrag.pointerId) {
      cleanupFolderDrag(true, event);
      return;
    }
    if (!drag || event.pointerId !== drag.pointerId) return;
    const clickedFolder = !drag.moved ? drag.item.closest('[data-folder-open], [data-desktop-folder-launcher]') : null;
    const createdFolderId = clickedFolder?.dataset.desktopFolderId || '';
    cleanupDrag(true, event);
    // 编辑状态下文件夹会先参与拖动判定，点击时直接使用原始文件夹对象打开，避免点击目标落到占位元素上。
    if (clickedFolder) requestAnimationFrame(() => {
      if (clickedFolder.matches('[data-folder-open]')) window.IdealMachineOpenCreativeFolder?.();
      else if (createdFolderId) openCreatedFolder(createdFolderId);
    });
  }, true);
  document.addEventListener('pointercancel', () => { cleanupDockDrag(false); cleanupFolderDrag(false); cleanupDrag(false); }, true);
  document.addEventListener('click', event => {
    const onDesktopBlank = event.target.closest('.desktop-page') && !event.target.closest('[data-desktop-item], input, button, a');
    if (!editing && onDesktopBlank) { tapCount += 1; clearTimeout(tapTimer); if (tapCount >= 3) { tapCount = 0; event.preventDefault(); event.stopImmediatePropagation(); enterEditing(); } else tapTimer = setTimeout(() => { tapCount = 0; }, 620); return; }
    if (addMenu.classList.contains('is-open') && !event.target.closest('.desktop-add-menu, [data-desktop-add-menu]')) closeAddMenu();
    if (editing && event.target.closest('[data-folder-app]')) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    const staticFolder = event.target.closest('[data-folder-open]');
    if (staticFolder) {
      if (editing && Date.now() >= suppressClickUntil) {
        window.IdealMachineOpenCreativeFolder?.();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    if (openCreatedFolderId) {
      const createdApp = event.target.closest('[data-created-folder-app]');
      if (createdApp) { if (editing) { event.preventDefault(); event.stopImmediatePropagation(); return; } const source = appSourceById(createdApp.dataset.createdFolderApp); closeCreatedFolder(); source?.click(); event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (event.target.closest('[data-folder-close]')) { closeCreatedFolder(); event.preventDefault(); event.stopImmediatePropagation(); return; }
    }
    const createdLauncher = event.target.closest('[data-desktop-folder-launcher]');
    if (createdLauncher && (!editing || Date.now() >= suppressClickUntil)) { openCreatedFolder(createdLauncher.dataset.desktopFolderId); event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.target.closest('[data-desktop-layout-done]')) { finishEditing(); return; }
    if (event.target.closest('[data-desktop-add-menu]')) { addMenu.classList.contains('is-open') ? closeAddMenu() : openAddMenu(); return; }
    if (event.target.closest('[data-desktop-add-page]')) { addPage(); return; }
    if (event.target.closest('[data-desktop-delete-page]')) { deleteCurrentPage(); return; }
    if (event.target.closest('[data-desktop-open-widget-library]')) { openLibrary(); return; }
    if (event.target.closest('[data-desktop-library-close]')) { closeLibrary(); return; }
    const remove = event.target.closest('[data-desktop-widget-remove]');
    if (remove) { removeWidget(remove.dataset.desktopWidgetRemove); event.preventDefault(); event.stopImmediatePropagation(); return; }
    const copy = event.target.closest('[data-desktop-widget-copy]');
    if (copy) { duplicateWidget(copy.dataset.desktopWidgetCopy); event.preventDefault(); event.stopImmediatePropagation(); return; }
    const add = event.target.closest('[data-desktop-widget-add]');
    if (add) { addWidget(add.dataset.desktopWidgetAdd); return; }
    if (editing && event.target.closest('[data-desktop-item]')) { event.preventDefault(); event.stopImmediatePropagation(); }
    if (Date.now() < suppressClickUntil && event.target.closest('[data-desktop-item]')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && openCreatedFolderId) closeCreatedFolder(); else if (event.key === 'Escape' && library.classList.contains('is-open')) closeLibrary(); else if (event.key === 'Escape' && editing) setEditing(false); });
  let gridResizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(gridResizeFrame);
    gridResizeFrame = requestAnimationFrame(() => { syncPageGridRowHeights(); applyDockPosition(constrainedDockPosition()); });
  });

  restoreRemovedCreativeApps();
  registerItems();
  applyLayout();
  refreshCreativeFolderIcon();
  ensureWidgetControls();
  syncPageIndicator();
  window.IdealMachineRenderCalendar?.();
  window.IdealMachineDesktopLayout = { enter:enterEditing, exit:() => setEditing(false), openWidgetLibrary:openLibrary };
})();
