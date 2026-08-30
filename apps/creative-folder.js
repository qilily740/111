(() => {
  const folder = document.querySelector('[data-desktop-folder]');
  const shell = document.querySelector('[data-folder-app-shell]');
  const folderTrigger = document.querySelector('[data-folder-open]');
  const extraAppsKey = 'ideal-machine-creative-folder-apps';
  const removedAppsKey = 'ideal-machine-creative-folder-removed';
  const orderKey = 'ideal-machine-creative-folder-order';
  if (!folder || !shell || !folderTrigger) return;

  const apps = {
    debate: { name: '辩论', className: 'is-debate', mark: 'VS' },
    fanfic: { name: '同人文', className: 'is-fanfic', mark: '文' },
    magazine: { name: '杂志社', className: 'is-magazine', mark: 'M' }
  };

  function readExtraApps() {
    try {
      const value = JSON.parse(localStorage.getItem(extraAppsKey) || '[]');
      return Array.isArray(value) ? [...new Set(value.filter(id => String(id).startsWith('app-')))] : [];
    } catch { return []; }
  }

  function readOrder() {
    try {
      const value = JSON.parse(localStorage.getItem(orderKey) || '[]');
      return Array.isArray(value) ? value.map(String) : [];
    } catch { return []; }
  }

  function readRemovedApps() {
    try {
      const value = JSON.parse(localStorage.getItem(removedAppsKey) || '[]');
      return new Set(Array.isArray(value) ? value : []);
    } catch { return new Set(); }
  }

  function applySavedOrder(grid) {
    const buttons = [...grid.children].filter(item => item.matches('[data-folder-app]'));
    const byKey = new Map(buttons.map(item => [item.dataset.folderApp, item]));
    const placed = new Set();
    readOrder().forEach(key => {
      const button = byKey.get(key);
      if (button) { grid.appendChild(button); placed.add(button); }
    });
    buttons.forEach(button => { if (!placed.has(button)) grid.appendChild(button); });
  }

  function renderExtraApps() {
    const grid = folder.querySelector('.desktop-folder-grid');
    if (!grid) return;
    const removed = readRemovedApps();
    grid.querySelectorAll('[data-folder-app]').forEach(item => {
      if (removed.has(`app-${item.dataset.folderApp}`)) item.remove();
    });
    grid.querySelectorAll('[data-creative-extra]').forEach(item => item.remove());
    readExtraApps().slice(0, 6).forEach(id => {
      const key = id.replace(/^app-/, '');
      const source = [...document.querySelectorAll('.app-item[data-app-key], .dock-item[data-app-key]')].find(item => item.dataset.appKey === key);
      const name = source?.querySelector('.app-name, .dock-name')?.textContent?.trim() || key;
      const sourceIcon = source?.querySelector('.app-icon, .dock-icon');
      const button = document.createElement('button');
      button.className = 'folder-app-item';
      button.dataset.folderApp = `creative-extra:${id}`;
      button.dataset.creativeExtra = 'true';
      button.type = 'button';
      const icon = document.createElement('i');
      icon.className = 'folder-app-icon generated-folder-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (sourceIcon) icon.innerHTML = sourceIcon.innerHTML;
      else icon.innerHTML = `<span>${name.slice(0, 1)}</span>`;
      const label = document.createElement('b');
      label.className = 'folder-app-name';
      label.textContent = name;
      button.append(icon, label);
      grid.appendChild(button);
    });
    applySavedOrder(grid);
  }

  function openFolder() {
    renderExtraApps();
    shell.classList.remove('is-open');
    shell.setAttribute('aria-hidden', 'true');
    folder.classList.add('is-open');
    folder.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { folder.querySelector('[data-folder-app]')?.focus(); window.dispatchEvent(new Event('ideal-machine-folder-open')); });
  }

  function closeFolder() {
    folder.classList.remove('is-open');
    folder.setAttribute('aria-hidden', 'true');
    folderTrigger.focus();
  }

  function openApp(key) {
    if (key.startsWith('creative-extra:')) {
      const appId = key.slice('creative-extra:'.length);
      const appKey = appId.replace(/^app-/, '');
      const source = [...document.querySelectorAll('.app-item[data-app-key], .dock-item[data-app-key]')].find(item => item.dataset.appKey === appKey);
      closeFolder();
      source?.click();
      return;
    }
    const item = apps[key];
    if (!item) return;
    folder.classList.remove('is-open');
    folder.setAttribute('aria-hidden', 'true');
    shell.querySelector('#folderAppTitle').textContent = item.name;
    shell.querySelector('[data-folder-app-heading]').textContent = item.name;
    const hero = shell.querySelector('[data-folder-app-hero]');
    hero.className = `folder-app-icon ${item.className}`;
    hero.querySelector('span').textContent = item.mark;
    shell.classList.add('is-open');
    shell.setAttribute('aria-hidden', 'false');
    shell.querySelector('[data-folder-app-back]')?.focus();
  }

  function closeApp() {
    shell.classList.remove('is-open');
    shell.setAttribute('aria-hidden', 'true');
    folderTrigger.focus();
  }

  // 让桌面编辑器可以在编辑状态下直接打开这个文件夹。
  window.IdealMachineOpenCreativeFolder = openFolder;

  document.addEventListener('click', event => {
    if (event.target.closest('[data-folder-open]')) { openFolder(); return; }
    if (event.target.closest('[data-folder-close]')) { closeFolder(); return; }
    const appButton = event.target.closest('[data-folder-app]');
    if (appButton) { openApp(appButton.dataset.folderApp); return; }
    if (event.target.closest('[data-folder-app-back]')) { openFolder(); return; }
    if (event.target.closest('[data-folder-app-close]')) closeApp();
  });

  folderTrigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFolder(); }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (shell.classList.contains('is-open')) closeApp();
    else if (folder.classList.contains('is-open')) closeFolder();
  });
})();
