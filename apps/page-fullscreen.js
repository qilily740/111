(() => {
  const pageDefinitions = [
    { root: '.chat-app', headers: '.chat-header' },
    { root: '.chat-settings', headers: '.chat-settings-page > header' },
    { root: '.ta-app', headers: '.ta-phone-head, .ta-role-app-header, .ta-reverse-app > header' },
    { root: '.forum-app', headers: '.forum-header' },
    { root: '.album-app', headers: '.album-header' },
    { root: '.calendar-app', headers: '.calendar-app-header' },
    { root: '.memory-library-app', headers: '.memory-header, .memory-subheader' },
    { root: '.music-app', headers: '.music-header' },
    { root: '.doubao-app', headers: '.doubao-header' },
    { root: '.shopping-app', headers: '.shopping-header' },
    { root: '.ifspace-app', headers: '.ifspace-header, .ifspace-create > header, .ifspace-detail > header' },
    { root: '.couple-app', headers: '.couple-header, .couple-mystery-header' },
    { root: '.worldbook-app', headers: '.worldbook-header' },
    { root: '.settings-app', headers: '.settings-header' },
    { root: '.beauty-modal', headers: '.beauty-head' },
    { root: '.debate-app', headers: '.debate-header' },
    { root: '.fanfic-app', headers: '.fanfic-header' },
    { root: '.magazine-app', headers: '.magazine-header' }
  ];

  const icon = type => type === 'exit'
    ? '<path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="m8 8 8 8M16 8l-8 8"/>'
    : '<path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>';

  function isVisible(element) {
    if (!element || element.closest('[aria-hidden="true"]')) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  function headerFor(root, selector) {
    const headers = [...root.querySelectorAll(selector)];
    return headers.find(isVisible) || headers[0] || null;
  }

  function buttonMarkup() {
    return `<button class="ideal-page-fullscreen-toggle" data-page-fullscreen type="button" aria-label="进入全屏" title="进入全屏"><svg viewBox="0 0 24 24" aria-hidden="true">${icon('enter')}</svg></button>`;
  }

  function activeNativeRoot() {
    return document.fullscreenElement?.closest?.('[data-page-fullscreen-root]') || document.fullscreenElement || null;
  }

  function setFallbackState(root, active) {
    root.classList.toggle('ideal-page-fullscreen-fallback', active);
    root.dataset.pageFullscreenActive = active ? 'true' : 'false';
  }

  function updateButton(root, active) {
    const button = root.querySelector(':scope > [data-page-fullscreen], header [data-page-fullscreen]');
    if (!button) return;
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon(active ? 'exit' : 'enter')}</svg>`;
    button.setAttribute('aria-label', active ? '退出全屏' : '进入全屏');
    button.title = active ? '退出全屏' : '进入全屏';
  }

  function syncStates() {
    const nativeRoot = activeNativeRoot();
    pageDefinitions.forEach(definition => {
      document.querySelectorAll(definition.root).forEach(root => {
        const active = root === nativeRoot || root.classList.contains('ideal-page-fullscreen-fallback');
        updateButton(root, active);
      });
    });
  }

  async function toggle(root) {
    if (!root) return;
    const nativeRoot = activeNativeRoot();
    if (nativeRoot === root) {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      return;
    }
    if (document.fullscreenElement) await document.exitFullscreen?.();
    if (root.requestFullscreen) {
      try {
        await root.requestFullscreen({ navigationUI: 'hide' });
        return;
      } catch {}
    }
    setFallbackState(root, !root.classList.contains('ideal-page-fullscreen-fallback'));
    syncStates();
  }

  function positionButton(header, button) {
    if (!header || !button) return;
    if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
    const headerRect = header.getBoundingClientRect();
    const rightSideButtons = [...header.querySelectorAll('button:not([data-page-fullscreen])')]
      .map(item => item.getBoundingClientRect())
      .filter(rect => rect.width && rect.left > headerRect.left + headerRect.width * .48);
    const leftEdge = rightSideButtons.length ? Math.min(...rightSideButtons.map(rect => rect.left)) : headerRect.right;
    const rightGap = Math.max(10, headerRect.right - leftEdge + 9);
    button.style.right = `${rightGap}px`;
  }

  function ensureButton(root, header) {
    if (!root || !header || !isVisible(header)) return;
    root.dataset.pageFullscreenRoot = 'true';
    let button = header.querySelector(':scope > [data-page-fullscreen]');
    if (!button) {
      header.insertAdjacentHTML('beforeend', buttonMarkup());
      button = header.querySelector(':scope > [data-page-fullscreen]');
    }
    positionButton(header, button);
    updateButton(root, root === activeNativeRoot() || root.classList.contains('ideal-page-fullscreen-fallback'));
  }

  function scan() {
    pageDefinitions.forEach(definition => {
      document.querySelectorAll(definition.root).forEach(root => {
        const header = headerFor(root, definition.headers);
        ensureButton(root, header);
      });
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-page-fullscreen]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const root = button.closest('[data-page-fullscreen-root]') || button.closest('.chat-app, .chat-settings, .ta-app, .forum-app, .album-app, .calendar-app, .memory-library-app, .music-app, .doubao-app, .shopping-app, .ifspace-app, .couple-app, .worldbook-app, .settings-app, .beauty-modal, .debate-app, .fanfic-app, .magazine-app');
    toggle(root).catch(() => {});
  }, true);

  document.addEventListener('fullscreenchange', syncStates);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const fallback = document.querySelector('.ideal-page-fullscreen-fallback');
    if (fallback) {
      setFallbackState(fallback, false);
      syncStates();
    }
  });
  window.addEventListener('resize', scan, { passive: true });
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-hidden', 'hidden']
  });
  scan();
})();
