(() => {
  const TOKEN_KEY = 'ideal-machine-account-token-v1';
  const config = () => window.IdealMachineConfig || {};
  const authBase = () => String(config().authApiBase || '').replace(/\/+$/, '');
  let token = '';
  let user = null;
  let registrationTicket = '';
  let emailVerificationTicket = '';
  let verifiedEmail = '';
  let registrationStep = 'email';
  let mode = 'choose';
  let busy = false;

  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch {}
  let restoringSession = Boolean(token);

  function requestHeaders(headers) {
    const next = new Headers(headers || {});
    if (token && !next.has('Authorization')) next.set('Authorization', `Bearer ${token}`);
    return next;
  }

  async function api(path, options = {}) {
    const response = await fetch(`${authBase()}${path}`, {
      ...options,
      headers: requestHeaders(options.headers),
      credentials: 'omit',
      cache: 'no-store'
    });
    let payload = {};
    try { payload = await response.clone().json(); } catch {}
    if (!response.ok) {
      const error = new Error(payload.error || `HTTP_${response.status}`);
      error.code = payload.error || `HTTP_${response.status}`;
      error.status = response.status;
      throw error;
    }
    return { response, payload };
  }

  function setToken(value) {
    token = String(value || '');
    try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch {}
    window.IdealMachineAuthToken = token;
  }

  function ensureRoot() {
    let root = document.getElementById('idealAuthRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'idealAuthRoot';
      root.className = 'ideal-auth-root';
      root.innerHTML = '<main class="ideal-auth-card" role="dialog" aria-modal="true" aria-labelledby="idealAuthTitle"><div class="ideal-auth-mark">理想机</div><h1 id="idealAuthTitle">账号认证</h1><p class="ideal-auth-intro">请选择注册新账号或登录已有账号。</p><div class="ideal-auth-progress" hidden></div><div class="ideal-auth-notice" role="status" aria-live="polite" hidden></div><div class="ideal-auth-actions"><div class="ideal-auth-choice"><button type="button" data-mode="register-verify">注册新账号</button><button type="button" data-mode="login">登录已有账号</button></div><button type="button" class="ideal-auth-discord" data-action="discord" hidden>使用 Discord 验证</button></div><form class="ideal-auth-form" novalidate></form><nav class="ideal-auth-switch" aria-label="账号操作"></nav><div class="ideal-auth-footer"><span>忘记账号或密码请联系管理员</span><button type="button" data-action="logout" hidden>退出登录</button></div></main>';
      document.body.append(root);
      root.addEventListener('click', handleClick);
      root.addEventListener('submit', handleSubmit);
    }
    return root;
  }

  function message(text, type = 'error') {
    const box = ensureRoot().querySelector('.ideal-auth-notice');
    box.hidden = !text;
    box.dataset.type = type;
    box.textContent = text || '';
  }

  function friendlyError(error) {
    const errors = {
      DISCORD_NOT_CONFIGURED: '管理员尚未配置 Discord 验证。',
      not_in_guild: '你的 Discord 账号尚未加入指定服务器。',
      required_role_missing: '你的 Discord 账号没有所需身份组。',
      discord_check_failed: '暂时无法核验 Discord 资格，请稍后再试。',
      discord_already_registered: '这个 Discord 账号已经绑定其他理想机账号。',
      REGISTRATION_TICKET_INVALID: '注册凭证已失效，请重新验证 Discord。',
      EMAIL_CODE_INVALID: '邮箱验证码不正确。',
      EMAIL_CODE_EXPIRED: '邮箱验证码已过期，请重新发送。',
      EMAIL_VERIFICATION_TICKET_INVALID: '邮箱验证已失效，请重新验证。',
      USERNAME_OR_EMAIL_TAKEN: '用户名或邮箱已被使用。',
      USERNAME_INVALID: '用户名需为 3–32 位字母、数字、点、下划线或短横线。',
      PASSWORD_INVALID: '密码至少 8 位，且两次输入必须一致。',
      QQ_EMAIL_REQUIRED: '请填写 QQ 邮箱（@qq.com）。',
      RATE_LIMITED: '操作太频繁，请稍后再试。',
      EMAIL_SENDER_NOT_CONFIGURED: '需要先配置 QQ 邮箱 SMTP 授权码，才能发送验证码。',
      AUTH_SERVICE_UNAVAILABLE: '认证服务暂时不可用，请稍后重试。',
      DISCORD_CHECK_FAILED: '暂时无法核验 Discord 资格，请稍后再试。',
      DISCORD_ACCESS_REVOKED: 'Discord 服务器资格已失效，账号暂时无法使用。',
      INVALID_CREDENTIALS: '用户名或密码不正确。'
    };
    return errors[error?.code] || '操作失败，请检查信息后重试。';
  }

  function render() {
    const root = ensureRoot();
    const form = root.querySelector('form');
    const discord = root.querySelector('[data-action="discord"]');
    const choice = root.querySelector('.ideal-auth-choice');
    const actions = root.querySelector('.ideal-auth-actions');
    const switcher = root.querySelector('.ideal-auth-switch');
    const logout = root.querySelector('[data-action="logout"]');
    const progress = root.querySelector('.ideal-auth-progress');
    const loggedIn = Boolean(user);
    root.querySelector('.ideal-auth-footer').hidden = loggedIn || mode !== 'login';
    root.classList.toggle('is-hidden', loggedIn);
    root.classList.toggle('is-restoring', restoringSession && !loggedIn);
    document.documentElement.classList.toggle('ideal-auth-locked', !loggedIn);
    discord.hidden = loggedIn || mode !== 'verify';
    choice.hidden = loggedIn || mode !== 'choose';
    actions.hidden = loggedIn || (mode !== 'choose' && mode !== 'verify');
    switcher.hidden = loggedIn;
    logout.hidden = !loggedIn;
    if (loggedIn) {
      root.querySelector('#idealAuthTitle').textContent = '已登录';
      root.querySelector('.ideal-auth-intro').textContent = `${user.username || user.email} · Discord 资格已核验`;
      form.hidden = true;
      return;
    }
    root.querySelector('#idealAuthTitle').textContent = mode === 'register'
      ? registrationStep === 'email' ? '验证 QQ 邮箱' : '创建账号'
      : mode === 'login' ? '账号登录' : mode === 'verify' ? '注册资格验证' : '欢迎使用理想机';
    root.querySelector('.ideal-auth-intro').textContent = mode === 'register'
      ? registrationStep === 'email'
        ? '社区资格已通过。验证 QQ 邮箱后即可设置账号。'
        : '邮箱已验证。设置账号和密码完成注册。'
      : mode === 'login'
        ? '输入账号和密码继续使用理想机。'
        : mode === 'verify'
          ? '注册前先确认 Discord 账号属于指定社区并拥有指定身份组。'
          : '请选择注册新账号或登录已有账号。';
    progress.hidden = mode !== 'register';
    progress.textContent = registrationStep === 'email'
      ? '✓ Discord 已通过  ·  验证 QQ 邮箱'
      : '✓ Discord 已通过  ·  ✓ QQ 邮箱已验证';
    switcher.innerHTML = mode === 'choose'
      ? ''
      : mode === 'register'
        ? `${registrationStep === 'account' ? '<button type="button" data-action="change-email">更换 QQ 邮箱</button>' : ''}<button type="button" data-mode="login">已有账号？登录</button>`
        : '<button type="button" data-mode="choose">返回上一步</button>';
    switcher.hidden = loggedIn || mode === 'choose';
    const priorValues = form.dataset.mode === mode
      ? Object.fromEntries([...form.elements].filter(input => input.name).map(input => [input.name, input.value]))
      : {};
    form.hidden = mode === 'choose' || mode === 'verify';
    form.innerHTML = mode === 'register'
      ? registrationStep === 'email' ? emailForm() : accountForm()
      : loginForm();
    form.dataset.mode = mode;
    for (const [name, value] of Object.entries(priorValues)) {
      const input = form.elements.namedItem(name);
      if (input && 'value' in input) input.value = value;
    }
    root.querySelectorAll('button').forEach(button => { button.disabled = busy; });
    form.querySelectorAll('input').forEach(input => { input.disabled = busy; });
  }

  function loginForm() {
    return '<label>用户名<input name="username" autocomplete="username" minlength="3" maxlength="32" required></label><label>密码<input name="password" type="password" autocomplete="current-password" required></label><button class="ideal-auth-submit" type="submit">登录</button>';
  }

  function emailForm() {
    return '<label>QQ 邮箱<div class="ideal-auth-inline"><input name="email" type="email" autocomplete="email" placeholder="name@qq.com" required><button type="button" data-action="send-code">发送验证码</button></div></label><label>邮箱验证码<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="输入 6 位验证码" required></label><button type="button" class="ideal-auth-submit" data-action="verify-email">确认验证码并继续</button>';
  }

  function accountForm() {
    return '<label>账号<input name="username" autocomplete="username" minlength="3" maxlength="32" required></label><label>密码（至少 8 位）<input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label>确认密码<input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><button class="ideal-auth-submit" type="submit">创建账号</button>';
  }

  function formValues() {
    return Object.fromEntries(new FormData(ensureRoot().querySelector('form')).entries());
  }

  async function run(action) {
    if (busy) return;
    busy = true;
    ensureRoot().querySelectorAll('button').forEach(control => { control.disabled = true; });
    message('正在处理…', 'info');
    try { await action(); }
    catch (error) { message(friendlyError(error)); }
    finally { busy = false; render(); }
  }

  async function handleClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode) {
      mode = button.dataset.mode === 'register-verify' ? 'verify' : button.dataset.mode;
      if (mode === 'verify') {
        registrationTicket = '';
        emailVerificationTicket = '';
        verifiedEmail = '';
        registrationStep = 'email';
      }
      message('');
      render();
      return;
    }
    if (button.dataset.action === 'change-email') {
      emailVerificationTicket = '';
      verifiedEmail = '';
      registrationStep = 'email';
      message('');
      render();
      return;
    }
    if (button.dataset.action === 'discord') {
      if (!authBase()) return message('认证服务地址尚未配置。');
      // OAuth always returns to the configured Ideal Machine site. Local VS Code
      // previews may start the flow, but they are never OAuth redirect targets.
      location.assign(`${authBase()}/auth/discord/start`);
    }
    if (button.dataset.action === 'logout') await run(async () => {
      try { await api('/api/auth/sign-out', { method: 'POST' }); } catch {}
      setToken(''); user = null; message('已退出登录。', 'info'); render();
    });
    if (button.dataset.action === 'send-code') await run(async () => {
      const email = String(formValues().email || '').trim().toLowerCase();
      await api('/auth/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registrationTicket, email }) });
      message('验证码已发送，请查看 QQ 邮箱。', 'success');
    });
    if (button.dataset.action === 'verify-email') await run(async () => {
      const values = formValues();
      const email = String(values.email || '').trim().toLowerCase();
      const { payload } = await api('/auth/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registrationTicket, email, code: String(values.code || '').trim() }) });
      emailVerificationTicket = payload.emailVerificationTicket;
      verifiedEmail = email;
      registrationStep = 'account';
      message('邮箱验证成功。', 'success');
    });
  }

  async function handleSubmit(event) {
    if (event.target !== ensureRoot().querySelector('form')) return;
    event.preventDefault();
    if (mode === 'register' && registrationStep !== 'account') return;
    await run(async () => {
      const values = formValues();
      if (mode === 'login') {
        const { response, payload } = await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: values.username, password: values.password }) });
        const issuedToken = response.headers.get('set-auth-token');
        if (!issuedToken) throw Object.assign(new Error('missing token'), { code: 'AUTH_SERVICE_UNAVAILABLE' });
        setToken(issuedToken);
        user = payload?.user || null;
      } else {
        if (!registrationTicket || !emailVerificationTicket) throw Object.assign(new Error('registration incomplete'), { code: 'EMAIL_VERIFICATION_TICKET_INVALID' });
        const { response } = await api('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registrationTicket, emailVerificationTicket, email: verifiedEmail, username: values.username, password: values.password, passwordConfirmation: values.passwordConfirmation }) });
        const issuedToken = response.headers.get('set-auth-token');
        if (!issuedToken) throw Object.assign(new Error('missing token'), { code: 'AUTH_SERVICE_UNAVAILABLE' });
        setToken(issuedToken);
        const status = await api('/auth/session');
        user = status.payload.user;
      }
      message('登录成功。', 'success');
      render();
    });
  }

  async function restoreSession() {
    if (!token) return;
    try {
      const { payload } = await api('/auth/session');
      user = payload.user;
    } catch (error) {
      if (error.status === 401 || error.status === 403) setToken('');
      message(friendlyError(error));
    } finally {
      restoringSession = false;
      render();
    }
  }

  function acceptOAuthResult() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('auth')) return;
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    const result = params.get('auth');
    if (result === 'register') {
      registrationTicket = params.get('ticket') || '';
      emailVerificationTicket = '';
      verifiedEmail = '';
      registrationStep = 'email';
      if (registrationTicket) {
        mode = 'register';
        message('Discord 指定社区身份组验证通过。', 'success');
      } else {
        mode = 'verify';
        message('没有收到有效的 Discord 验证凭证，请重新验证。');
      }
    } else {
      mode = 'verify';
      const reason = params.get('reason') || 'discord_check_failed';
      message(friendlyError({ code: reason }));
    }
  }

  window.IdealMachineAuth = {
    getToken: () => token,
    getUser: () => user,
    isAuthenticated: () => Boolean(user),
    logout: () => { setToken(''); user = null; render(); },
    refresh: restoreSession,
    handleAuthorizationFailure(code) {
      setToken('');
      user = null;
      render();
      const messageText = code === 'DISCORD_ACCESS_REVOKED' || code.startsWith('DISCORD_')
        ? 'Discord 服务器身份组资格已失效，请恢复资格后重新登录。'
        : '登录状态已失效，请重新登录。';
      message(messageText);
    }
  };
  window.IdealMachineAuthToken = token;
  acceptOAuthResult();
  ensureRoot();
  render();
  restoreSession();
})();
