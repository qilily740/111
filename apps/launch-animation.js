(() => {
  // 开屏动画只服务于“添加到主屏幕”的独立窗口，不影响普通浏览器预览。
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (!isStandalone) return;

  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('ideal-machine-beauty') || '{}') || {}; } catch {}
  if (settings.launchAnimationEnabled === false) return;

  const style = document.createElement('style');
  style.textContent = `
    .ideal-launch-screen { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; overflow:hidden; background:#fff; color:#111; }
    .ideal-launch-screen.is-finishing { pointer-events:none; }
    .ideal-launch-mark { position:relative; display:grid; place-items:center; width:116px; height:150px; }
    .ideal-launch-star { display:block; width:54px; height:54px; transform-origin:50% 62%; animation:ideal-launch-star 2.25s cubic-bezier(.45,.04,.25,1) infinite; }
    .ideal-launch-star path { fill:#fff; stroke:#111; stroke-width:5; stroke-linejoin:round; }
    .ideal-launch-small-star { position:absolute; display:block; width:13px; height:13px; opacity:0; animation:ideal-launch-small-star 2.8s ease-in-out infinite; }
    .ideal-launch-small-star::before,.ideal-launch-small-star::after { position:absolute; inset:5px 0; border-radius:99px; background:#111; content:''; }
    .ideal-launch-small-star::after { transform:rotate(90deg); }
    .ideal-launch-small-star.one { top:16px; left:8px; animation-delay:.22s; }
    .ideal-launch-small-star.two { top:31px; right:2px; width:9px; height:9px; animation-delay:.78s; }
    .ideal-launch-small-star.three { right:14px; bottom:40px; width:12px; height:12px; animation-delay:1.18s; }
    .ideal-launch-progress { position:absolute; right:0; bottom:0; left:0; height:3px; overflow:hidden; border-radius:99px; background:#e7e7e7; }
    .ideal-launch-progress i { display:block; width:0; height:100%; border-radius:inherit; background:#111; animation:ideal-launch-progress 3.9s cubic-bezier(.2,.7,.2,1) forwards; }
    @keyframes ideal-launch-star {
      0%,100% { transform:translate3d(0,0,0) rotate(-4deg) scale(1); }
      12% { transform:translate3d(-1px,-2px,0) rotate(-7deg) scale(.98,1.03); }
      25% { transform:translate3d(1px,1px,0) rotate(3deg) scale(1.02,.97); }
      38% { transform:translate3d(-1px,-5px,0) rotate(-2deg) scale(.98,1.04); }
      52% { transform:translate3d(1px,0,0) rotate(6deg) scale(1.03,.96); }
      68% { transform:translate3d(0,-3px,0) rotate(-2deg) scale(.99,1.02); }
      84% { transform:translate3d(0,0,0) rotate(2deg) scale(1); }
    }
    @keyframes ideal-launch-small-star {
      0%,100% { opacity:0; transform:scale(.55) rotate(0); }
      24%,70% { opacity:.82; transform:scale(1) rotate(45deg); }
      86% { opacity:0; transform:scale(.7) rotate(90deg); }
    }
    @keyframes ideal-launch-progress { to { width:100%; } }
    @media (prefers-reduced-motion:reduce) {
      .ideal-launch-star,.ideal-launch-small-star,.ideal-launch-progress i { animation:none; }
      .ideal-launch-progress i { width:100%; }
    }
  `;
  document.head.appendChild(style);

  const screen = document.createElement('div');
  screen.className = 'ideal-launch-screen';
  screen.setAttribute('role', 'status');
  screen.setAttribute('aria-label', '正在进入理想机');
  screen.innerHTML = `
    <div class="ideal-launch-mark" aria-hidden="true">
      <span class="ideal-launch-small-star one"></span>
      <span class="ideal-launch-small-star two"></span>
      <span class="ideal-launch-small-star three"></span>
      <svg class="ideal-launch-star" viewBox="0 0 100 100">
        <path d="M50 8 L60.8 38.1 L91.8 39.1 L67.3 57.8 L76.2 87.7 L50 70 L23.8 87.7 L32.7 57.8 L8.2 39.1 L39.2 38.1 Z"></path>
      </svg>
      <div class="ideal-launch-progress"><i></i></div>
    </div>`;
  document.body.appendChild(screen);

  const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 80 : 4050;
  window.setTimeout(() => {
    screen.classList.add('is-finishing');
    screen.remove();
    style.remove();
  }, duration);
})();
