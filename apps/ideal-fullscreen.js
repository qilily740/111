(() => {
  'use strict';

  /**
   * Ideal 的页面视口适配层。
   *
   * 这层只同步运行时视口变量，不接管页面点击，也不改变各 App 自己的顶栏布局。
   */
  class IdealFullscreenController {
    constructor() {
      this.root = document.documentElement;
      this.body = document.body;
      this.frame = 0;
      this.stableHeight = 0;
      this.orientation = this.getOrientation();
      this.safeArea = { top: 0, bottom: 0 };
      this.surfaceSelector = [
        '.chat-app', '.ta-app', '.forum-app', '.album-app', '.calendar-app',
        '.music-app', '.shopping-app', '.doubao-app', '.ifspace-app',
        '.settings-app', '.beauty-app', '.worldbook-app', '.memory-library-app',
        '.couple-app', '.fanfic-app', '.debate-app', '.magazine-app',
        '.folder-app-shell', '.desktop-folder-layer'
      ].join(',');
      this.start();
    }

    start() {
      this.root.classList.add('ideal-fullscreen-ready');
      this.safeArea = this.readSafeArea();
      this.syncSurfaces();
      this.scheduleViewportSync();

      window.addEventListener('resize', () => this.scheduleViewportSync(), { passive: true });
      window.addEventListener('orientationchange', () => {
        this.stableHeight = 0;
        this.orientation = this.getOrientation();
        this.scheduleViewportSync();
      }, { passive: true });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => this.scheduleViewportSync(), { passive: true });
        window.visualViewport.addEventListener('scroll', () => this.scheduleViewportSync(), { passive: true });
      }

      this.observer = new MutationObserver(() => this.syncSurfaces());
      this.observer.observe(this.body, { childList: true });
    }

    getOrientation() {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    readSafeArea() {
      const probe = document.createElement('i');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = [
        'position:absolute', 'pointer-events:none', 'visibility:hidden',
        'inset:0 auto auto 0', 'width:0', 'height:0',
        'padding-top:env(safe-area-inset-top)',
        'padding-bottom:env(safe-area-inset-bottom)'
      ].join(';');
      this.body.appendChild(probe);
      const computed = getComputedStyle(probe);
      const top = Number.parseFloat(computed.paddingTop) || 0;
      const bottom = Number.parseFloat(computed.paddingBottom) || 0;
      probe.remove();
      return { top, bottom };
    }

    getViewport() {
      const visual = window.visualViewport;
      const layoutHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const visualHeight = Math.max(1, visual?.height || layoutHeight);
      const offsetTop = Math.max(0, visual?.offsetTop || 0);
      const visibleHeight = Math.max(1, Math.round(visualHeight + offsetTop));
      const keyboardOpen = layoutHeight - visibleHeight > 120;
      const orientation = this.getOrientation();

      if (orientation !== this.orientation) {
        this.orientation = orientation;
        this.stableHeight = 0;
      }
      if (!keyboardOpen) this.stableHeight = Math.max(this.stableHeight, layoutHeight, visibleHeight);

      return {
        visualHeight,
        viewportHeight: keyboardOpen ? visibleHeight : Math.max(1, this.stableHeight || layoutHeight),
        keyboardInset: Math.max(0, layoutHeight - visibleHeight),
        keyboardOpen
      };
    }

    scheduleViewportSync() {
      if (this.frame) return;
      this.frame = window.requestAnimationFrame(() => {
        this.frame = 0;
        this.syncViewport();
      });
    }

    syncViewport() {
      const viewport = this.getViewport();
      this.root.style.setProperty('--ideal-viewport-height', `${viewport.viewportHeight}px`);
      this.root.style.setProperty('--ideal-visual-height', `${viewport.visualHeight}px`);
      this.root.style.setProperty('--ideal-keyboard-inset', `${viewport.keyboardInset}px`);
      this.root.style.setProperty('--ideal-safe-top', `${this.safeArea.top}px`);
      this.root.style.setProperty('--ideal-safe-bottom', `${this.safeArea.bottom}px`);
      this.root.classList.toggle('ideal-keyboard-open', viewport.keyboardOpen);
      this.body.classList.toggle('ideal-keyboard-open', viewport.keyboardOpen);
    }

    syncSurfaces() {
      document.querySelectorAll(this.surfaceSelector).forEach(node => {
        node.classList.add('ideal-fullscreen-surface');
      });
    }
  }

  const controller = new IdealFullscreenController();
  window.IdealFullscreen = {
    refresh: () => controller.syncViewport(),
    refreshSurfaces: () => controller.syncSurfaces()
  };
})();
