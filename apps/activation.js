(() => {
  const storageKey = 'ideal-machine-activation-v1';
  const feature = 'st_character_card_import';
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let state = read();
  let pending = null;

  function read() { try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; } }
  function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function randomChars(length) { const values = new Uint32Array(length); crypto.getRandomValues(values); return [...values].map(value => alphabet[value % alphabet.length]).join(''); }
  function deviceCode() { if (!/^IM-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){1,2}$/.test(state.deviceCode || '')) { const raw = randomChars(12); state.deviceCode = `IM-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`; save(); } return state.deviceCode; }
  // The verification endpoint is built into the app. Users receive the activation
  // website through the separate activation card or another official channel.
  function apiBase() { return 'https://ideal-machine-activation.ideal-machine.workers.dev'; }
  function isUnlocked() { return state.license?.feature === feature && state.license?.status === 'active'; }
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function portal() { let node = document.querySelector('#idealActivationPortal'); if (!node) { node = document.createElement('div'); node.id = 'idealActivationPortal'; document.body.appendChild(node); } return node; }
  function close(result = false) { portal().innerHTML = ''; portal().classList.remove('is-open'); if (pending) { pending(result); pending = null; } }
  function render(message = '') {
    const node = portal();
    node.classList.add('is-open');
    node.innerHTML = `<div class="ideal-activation-backdrop" data-activation-close></div><section class="ideal-activation-card" role="dialog" aria-modal="true" aria-labelledby="idealActivationTitle"><header><div><span>CHARACTER IMPORT</span><h2 id="idealActivationTitle">解锁酒馆角色卡</h2></div><button type="button" data-activation-close>×</button></header><main><p>导入 SillyTavern 角色卡前，需要先完成一次设备激活。</p><div class="ideal-activation-device"><small>你的设备码</small><b>${escapeHtml(deviceCode())}</b><button type="button" data-activation-copy>复制</button></div><p class="ideal-activation-help">请通过官方渠道获取激活码，然后填写到这里完成解锁。</p><label>激活码<input id="idealActivationCode" autocomplete="off" placeholder="粘贴激活码"></label>${message ? `<p class="ideal-activation-message">${escapeHtml(message)}</p>` : ''}</main><footer><button type="button" data-activation-close>取消</button><button class="is-primary" type="button" data-activation-submit>验证并解锁</button></footer></section>`;
  }
  async function verify() {
    const code = document.querySelector('#idealActivationCode')?.value.trim() || '';
    const base = apiBase();
    if (!base) { render('激活服务暂时不可用，请稍后重试。'); return; }
    if (!code) { render('请先填写激活码。'); return; }
    const button = portal().querySelector('[data-activation-submit]');
    if (button) { button.disabled = true; button.textContent = '验证中…'; }
    try {
      const response = await fetch(`${base}/activation/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceCode: deviceCode(), activationCode: code, feature }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '激活码无效');
      state.license = { ...data.license, feature, status: 'active' }; save(); close(true); window.dispatchEvent(new CustomEvent('ideal-machine-activation-changed', { detail: state.license })); window.alert('激活成功，现在可以导入酒馆角色卡了。');
      return true;
    } catch (error) { render(error.message || '激活失败，请检查设备码和激活码。'); return false; }
  }
  function ensureUnlocked() { if (isUnlocked()) return Promise.resolve(true); render(); return new Promise(resolve => { pending = resolve; }); }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-activation-close]')) { close(); return; }
    if (event.target.closest('[data-activation-copy]')) { const copied = navigator.clipboard?.writeText(deviceCode()); if (copied) copied.then(() => window.alert('设备码已复制。')).catch(() => window.alert(`设备码：${deviceCode()}`)); else window.alert(`设备码：${deviceCode()}`); return; }
    if (event.target.closest('[data-activation-submit]')) verify();
  });
  window.IdealMachineActivation = { feature, deviceCode, isUnlocked, ensureUnlocked, open: render, getLicense: () => state.license || null };
})();
