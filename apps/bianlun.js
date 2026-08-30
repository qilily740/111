(() => {
  const folder = document.querySelector('[data-desktop-folder]');
  const shell = document.querySelector('[data-folder-app-shell]');
  const storageKey = 'ideal-machine-debates';
  const rounds = ['立论', '质询', '反驳', '总结'];
  const app = document.createElement('div');
  app.className = 'debate-app';
  app.setAttribute('aria-hidden', 'true');
  document.body.appendChild(app);

  let state = readState();
  let page = 'home';
  let activeId = '';
  let busy = false;
  let composerSide = 'affirmative';
  let draft = { topic: '', affirmative: [], negative: [] };

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { debates: Array.isArray(value.debates) ? value.debates.map(normalizeDebate) : [] };
    } catch { return { debates: [] }; }
  }
  function normalizeParticipant(value) { if (!value) return null; if (typeof value === 'string') return { id: uid('legacy'), name: value, type: 'user' }; return { id: value.id || uid('participant'), name: value.name || '未命名参与者', type: value.type || 'user' }; }
  function participantList(value) { const values = Array.isArray(value) ? value : value ? [value] : []; return values.map(normalizeParticipant).filter(Boolean); }
  function normalizeDebate(item) { const sides = item?.sides || {}; return { ...item, sides: { affirmative: participantList(sides.affirmative), negative: participantList(sides.negative) }, openSides: { affirmative: item?.openSides?.affirmative !== false, negative: item?.openSides?.negative !== false }, turns: Array.isArray(item?.turns) ? item.turns : [], currentRound: Number(item?.currentRound || 0) }; }
  function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function uid(prefix = 'debate') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function now() { return new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function sideLabel(side) { return side === 'affirmative' ? '正方' : '反方'; }
  function sideClass(side) { return side === 'affirmative' ? 'is-affirmative' : 'is-negative'; }
  function activeDebate() { return state.debates.find(item => item.id === activeId); }

  function participants() {
    const result = [{ id: 'self', name: '我', type: 'user' }];
    try {
      const chat = JSON.parse(localStorage.getItem('ideal-machine-chat') || '{}');
      (chat.profiles || []).forEach(item => { if (item.id) result.push({ id: `profile:${item.id}`, name: item.nickname || item.realName || '用户', type: 'user' }); });
      (chat.contacts || []).forEach(item => { if (item.id) result.push({ id: `contact:${item.id}`, name: item.nickname || item.name || '角色', type: 'character' }); });
    } catch {}
    return result.filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);
  }
  function participantName(id) { return participants().find(item => item.id === id)?.name || '未命名参与者'; }
  function nameFor(participant) { return participant?.name || '开放席位'; }
  function participantOptions(selected, other) { const selectedIds = new Set(selected || []); const otherIds = new Set(other || []); return `<option value="">选择用户或角色添加</option>${participants().map(item => `<option value="${esc(item.id)}" ${selectedIds.has(item.id) || otherIds.has(item.id) ? 'disabled' : ''}>${esc(item.name)}${item.type === 'character' ? ' · 角色' : ''}</option>`).join('')}`; }

  function openApp() { state = readState(); page = 'home'; activeId = ''; shell?.classList.remove('is-open'); shell?.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); app.classList.add('is-open'); app.setAttribute('aria-hidden', 'false'); render(); }
  function closeApp() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); }
  function backToFolder() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.add('is-open'); folder?.setAttribute('aria-hidden', 'false'); }

  function homePage() {
    const list = state.debates.slice().reverse().map(item => `<button class="debate-history-card" data-debate-open="${esc(item.id)}" type="button"><span class="debate-history-mark">${item.status === '已结束' ? '✓' : 'VS'}</span><span><b>${esc(item.topic)}</b><small>${esc(item.updatedAt || item.createdAt)} · ${item.turns.length} 条发言 · 正方 ${item.sides.affirmative.length} 人 / 反方 ${item.sides.negative.length} 人</small></span><i>›</i></button>`).join('');
    return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-folder type="button" aria-label="返回文件夹">‹</button><div><span class="debate-kicker">ARGUMENT ROOM</span><h1>辩论</h1><p>让观点交锋，也让过程被留下。</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-hero"><div><span>今日开一局</span><h2>随机生成一个辩题，开始你的观点交锋。</h2><p>可以自己加入正方或反方，也可以把角色安排到两边。</p></div><button data-debate-new type="button"><i>＋</i><b>新建辩论</b><small>API 随机出题</small></button></section><section class="debate-history"><div class="debate-section-head"><div><span>DEBATE LOG</span><h2>辩论记录</h2></div><b>${state.debates.length} 场</b></div>${list || '<div class="debate-empty"><i>VS</i><p>还没有辩论记录<br>创建一场，让第一个观点留下来。</p></div>'}</section></main></section>`;
  }

  function draftPeople(side) { const ids = draft[side]; return ids.length ? ids.map(id => `<span class="debate-person-chip">${esc(participantName(id))}<button data-debate-remove-draft="${side}" data-debate-remove-id="${esc(id)}" type="button" aria-label="移除参与者">×</button></span>`).join('') : '<em class="debate-no-people">还没有安排参与者</em>'; }
  function sideDraftCard(side) { const label = sideLabel(side); const other = side === 'affirmative' ? draft.negative : draft.affirmative; return `<article class="debate-draft-side ${sideClass(side)}"><div class="debate-side-heading"><span>${label}</span><small>${draft[side].length} 人 · 可继续加入</small></div><div class="debate-side-people">${draftPeople(side)}</div><div class="debate-add-row"><select data-debate-add="${side}" aria-label="添加${label}参与者">${participantOptions(draft[side], other)}</select><button data-debate-join-draft="${side}" type="button">我加入</button></div><small class="debate-open-hint">创建后仍可让其他用户加入${label}</small></article>`; }
  function newPage() { return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-home type="button" aria-label="返回辩论记录">‹</button><div><span class="debate-kicker">NEW ROOM</span><h1>新建辩论</h1><p>一方可以有多名参与者，也可以先留出开放席位。</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-topic-card"><div class="debate-card-eyebrow"><span>TOPIC GENERATOR</span><b>API 出题</b></div><h2>${draft.topic ? esc(draft.topic) : '还没有辩题'}</h2><textarea data-debate-topic placeholder="也可以自己修改辩题…">${esc(draft.topic)}</textarea><button class="debate-generate-button" data-debate-generate type="button" ${busy ? 'disabled' : ''}>${busy ? '生成中…' : '⌁ 随机生成辩题'}</button></section><section class="debate-arrange-card"><div class="debate-section-head"><div><span>PARTICIPANTS</span><h2>安排双方</h2></div><small>每方可添加多人</small></div><div class="debate-draft-sides">${sideDraftCard('affirmative')}${sideDraftCard('negative')}</div></section><button class="debate-start-button" data-debate-start type="button">创建辩论房间 <span>›</span></button><p class="debate-local-note">本机创建的房间和完整发言记录会保存在当前设备。</p></main></section>`; }

  function roomPeople(side, debate) { const people = debate.sides[side] || []; return people.length ? people.map(item => `<span class="debate-room-person">${esc(nameFor(item))}</span>`).join('') : '<em class="debate-no-people">还没有人加入</em>'; }
  function participantCard(side, debate) { const label = sideLabel(side); return `<div class="debate-room-side ${sideClass(side)}"><div class="debate-room-side-head"><span>${label}</span><small>${debate.sides[side].length} 人</small></div><div class="debate-room-people">${roomPeople(side, debate)}</div><button data-debate-join="${side}" type="button">＋ 加入${label}</button></div>`; }
  function speakerOptions(debate, side) { const people = debate.sides[side] || []; return people.length ? people.map((item, index) => `<option value="${esc(item.id)}" ${index === 0 ? 'selected' : ''}>${esc(nameFor(item))}</option>`).join('') : '<option value="">先加入发言人</option>'; }

  function roomPage(debate) {
    const turns = debate.turns.map((item, index) => `<article class="debate-turn ${sideClass(item.side)}"><div class="debate-turn-meta"><span>${esc(sideLabel(item.side))}</span><b>${esc(item.author)}</b><small>${esc(item.round)} · ${esc(item.time)} · #${index + 1}</small></div><p>${esc(item.text)}</p></article>`).join('');
    const currentRound = debate.currentRound || 0;
    return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-home type="button" aria-label="返回辩论记录">‹</button><div><span class="debate-kicker">DEBATE ROOM</span><h1>辩论进行中</h1><p>${esc(debate.createdAt)} 开始 · ${debate.turns.length} 条发言</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-room-topic"><span>辩题</span><h2>${esc(debate.topic)}</h2><div class="debate-room-sides">${participantCard('affirmative', debate)}${participantCard('negative', debate)}</div></section><nav class="debate-rounds" aria-label="辩论回合">${rounds.map((round, index) => `<button class="${index === currentRound ? 'is-active' : ''} ${index < currentRound ? 'is-done' : ''}" data-debate-round="${index}" type="button"><i>${index + 1}</i><span>${round}</span></button>`).join('')}</nav><section class="debate-transcript"><div class="debate-section-head"><div><span>TRANSCRIPT</span><h2>完整过程</h2></div><small>自动保存</small></div>${turns || '<div class="debate-transcript-empty">选择一方并记录第一句立论，完整过程会出现在这里。</div>'}</section><form class="debate-composer" data-debate-form><div class="debate-composer-head"><b>记录发言</b><span>每次提交都会立即保存</span></div><div class="debate-composer-selects"><label>阵营<select data-debate-turn-side><option value="affirmative" ${composerSide === 'affirmative' ? 'selected' : ''}>正方</option><option value="negative" ${composerSide === 'negative' ? 'selected' : ''}>反方</option></select></label><label>发言人<select data-debate-turn-speaker>${speakerOptions(debate, composerSide)}</select></label><label>回合<select data-debate-turn-round>${rounds.map((round, index) => `<option value="${index}" ${index === currentRound ? 'selected' : ''}>${round}</option>`).join('')}</select></label></div><textarea data-debate-turn-text maxlength="3000" placeholder="写下这一方的观点、问题或回应…"></textarea><button class="debate-record-button" type="submit">保存这次发言 <span>↑</span></button></form></main></section>`;
  }

  function render() { const debate = activeDebate(); app.innerHTML = page === 'home' ? homePage() : page === 'new' ? newPage() : debate ? roomPage(debate) : homePage(); }

  async function generateTopic() {
    if (busy) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('debate') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置辩论 API 模型。');
    busy = true; render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: 1.05, messages: [{ role: 'system', content: '你是辩论题目设计师，只返回合法 JSON，不要 Markdown。' }, { role: 'user', content: '随机生成一个适合两方辩论的中文辩题。要求：具体、具有现实讨论空间、不能依赖最新新闻，不要带明显正确答案。只返回：{"topic":"辩题内容"}' }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const raw = String(payload.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim();
      let result;
      try { result = JSON.parse(raw); } catch { result = { topic: raw.replace(/^['“”"]|['“”"]$/g, '') }; }
      if (!result.topic) throw new Error('API 没有返回辩题');
      draft.topic = String(result.topic).trim();
    } catch (error) { window.alert(`辩题生成失败：${error.message}`); } finally { busy = false; render(); }
  }

  function startDebate() {
    const topic = app.querySelector('[data-debate-topic]')?.value.trim() || draft.topic.trim();
    if (!topic) return window.alert('请先生成或填写一个辩题。');
    const all = participants();
    const findPeople = side => draft[side].map(id => all.find(item => item.id === id)).filter(Boolean).map(item => ({ ...item }));
    const debate = normalizeDebate({ id: uid(), topic, createdAt: now(), updatedAt: now(), status: '进行中', currentRound: 0, openSides: { affirmative: true, negative: true }, sides: { affirmative: findPeople('affirmative'), negative: findPeople('negative') }, turns: [] });
    if (debate.sides.affirmative.some(first => debate.sides.negative.some(second => first.id === second.id))) return window.alert('同一个参与者不能同时安排到正方和反方。');
    state.debates.push(debate); save(); activeId = debate.id; page = 'room'; composerSide = 'affirmative'; render();
  }

  function joinSide(side) { const debate = activeDebate(); if (!debate) return; const name = window.prompt(`输入加入${sideLabel(side)}时显示的名字`, '我'); if (!name?.trim()) return; debate.sides[side].push({ id: uid('joiner'), name: name.trim(), type: 'user' }); debate.updatedAt = now(); save(); render(); }
  function recordTurn(event) { event.preventDefault(); const debate = activeDebate(); if (!debate) return; const side = app.querySelector('[data-debate-turn-side]')?.value || composerSide; const speakerId = app.querySelector('[data-debate-turn-speaker]')?.value; const text = app.querySelector('[data-debate-turn-text]')?.value.trim(); const round = Number(app.querySelector('[data-debate-turn-round]')?.value || debate.currentRound || 0); if (!text) return window.alert('请先写下这次发言。'); if (!debate.sides[side].length) { joinSide(side); return; } const speaker = debate.sides[side].find(item => item.id === speakerId) || debate.sides[side][0]; debate.turns.push({ id: uid('turn'), side, roundIndex: round, round: rounds[round], author: nameFor(speaker), text, time: now() }); debate.currentRound = Math.min(rounds.length - 1, round + 1); debate.updatedAt = now(); save(); render(); }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-folder-app="debate"]')) { openApp(); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-debate-close]')) { closeApp(); return; }
    if (event.target.closest('[data-debate-folder]')) { backToFolder(); return; }
    if (event.target.closest('[data-debate-new]')) { draft = { topic: '', affirmative: [], negative: [] }; page = 'new'; render(); return; }
    if (event.target.closest('[data-debate-home]')) { page = 'home'; activeId = ''; render(); return; }
    const open = event.target.closest('[data-debate-open]');
    if (open) { activeId = open.dataset.debateOpen; page = 'room'; composerSide = 'affirmative'; render(); return; }
    if (event.target.closest('[data-debate-generate]')) { generateTopic(); return; }
    if (event.target.closest('[data-debate-start]')) { startDebate(); return; }
    const joinDraft = event.target.closest('[data-debate-join-draft]');
    if (joinDraft) { const side = joinDraft.dataset.debateJoinDraft; if (!draft[side].includes('self')) draft[side].push('self'); render(); return; }
    const removeDraft = event.target.closest('[data-debate-remove-draft]');
    if (removeDraft) { const side = removeDraft.dataset.debateRemoveDraft; draft[side] = draft[side].filter(id => id !== removeDraft.dataset.debateRemoveId); render(); return; }
    const join = event.target.closest('[data-debate-join]');
    if (join) { joinSide(join.dataset.debateJoin); return; }
    const round = event.target.closest('[data-debate-round]');
    if (round) { const debate = activeDebate(); if (debate) { debate.currentRound = Number(round.dataset.debateRound); save(); render(); } }
  });
  document.addEventListener('change', event => { if (!app.classList.contains('is-open')) return; if (event.target.matches('[data-debate-add]')) { const side = event.target.dataset.debateAdd; if (event.target.value && !draft[side].includes(event.target.value)) draft[side].push(event.target.value); render(); return; } if (event.target.matches('[data-debate-turn-side]')) { composerSide = event.target.value; render(); } });
  document.addEventListener('input', event => { if (event.target.matches('[data-debate-topic]')) draft.topic = event.target.value; });
  document.addEventListener('submit', event => { if (event.target.matches('[data-debate-form]')) recordTurn(event); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && app.classList.contains('is-open')) closeApp(); });
})();
