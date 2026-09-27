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
      this.backdropObserver = null;
      this.surfaceSelector = [
        '.chat-app', '.ta-app', '.forum-app', '.album-app', '.calendar-app',
        '.music-app', '.shopping-app', '.doubao-app', '.ifspace-app',
        '.settings-app', '.beauty-app', '.worldbook-app', '.memory-library-app',
        '.couple-app', '.fanfic-app', '.debate-app', '.magazine-app',
        '.folder-app-shell', '.desktop-folder-layer',
        '.chat-settings', '.chat-editor', '.chat-reading-modal', '.chat-user-home-page',
        '.chat-offline-modal', '.chat-video-call-modal', '.chat-wallet-modal',
        '.launcher-setup', '.beauty-modal', '.world-editor', '.edit-modal',
        '.desktop-widget-library', '.game-app', '.stock-game'
      ].join(',');
      this.start();
    }

    start() {
      this.root.classList.add('ideal-fullscreen-ready');
      this.body.classList.add('ideal-fullscreen-body');
      this.safeArea = this.readSafeArea();
      this.syncBackdrop();
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
      this.backdropObserver = new MutationObserver(() => this.syncBackdrop());
      this.backdropObserver.observe(this.body, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    getOrientation() {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    isIOSStandalone() {
      const ios = this.isIOSDevice();
      const standalone = navigator.standalone === true
        || window.matchMedia?.('(display-mode: standalone)').matches;
      return ios && standalone;
    }

    isIOSDevice() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    estimateIOSSafeArea() {
      const screenHeight = Math.max(window.screen?.height || 0, window.screen?.width || 0);
      if (screenHeight >= 900) return { top: 59, bottom: 34 };
      if (screenHeight >= 800) return { top: 47, bottom: 34 };
      if (screenHeight >= 700) return { top: 44, bottom: 20 };
      return { top: 20, bottom: 0 };
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
      let top = Number.parseFloat(computed.paddingTop) || 0;
      let bottom = Number.parseFloat(computed.paddingBottom) || 0;
      probe.remove();
      const viewportMeta = document.querySelector('meta[name="viewport"]')?.content || '';
      const usesViewportFitCover = /viewport-fit\s*=\s*cover/i.test(viewportMeta);
      if (!top && !bottom && (this.isIOSStandalone() || (this.isIOSDevice() && usesViewportFitCover))) {
        ({ top, bottom } = this.estimateIOSSafeArea());
      }
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
      this.root.style.setProperty('--ideal-edge-top', `${this.safeArea.top}px`);
      this.root.style.setProperty('--ideal-edge-bottom', `${this.safeArea.bottom}px`);
      this.root.classList.toggle('ideal-keyboard-open', viewport.keyboardOpen);
      this.body.classList.toggle('ideal-keyboard-open', viewport.keyboardOpen);
    }

    syncBackdrop() {
      const bodyStyle = getComputedStyle(this.body);
      this.root.style.backgroundColor = bodyStyle.backgroundColor || '#f4f4f2';
      this.root.style.backgroundImage = bodyStyle.backgroundImage || 'none';
      this.root.style.backgroundPosition = bodyStyle.backgroundPosition || 'center';
      this.root.style.backgroundSize = bodyStyle.backgroundSize || 'cover';
      this.root.style.backgroundRepeat = bodyStyle.backgroundRepeat || 'no-repeat';
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
