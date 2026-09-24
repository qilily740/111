(() => {
  const folder = document.querySelector('[data-desktop-folder]');
  const shell = document.querySelector('[data-folder-app-shell]');
  const storageKey = 'ideal-machine-debates';
  const rounds = ['立论', '质询', '反驳', '总结'];
  const app = document.createElement('div');
  app.className = 'debate-app';
  app.setAttribute('aria-hidden', 'true');
  document.body.appendChild(app);
  window.IdealMachineWallpaperTone?.watch?.(app);

  let state = readState();
  let openedFromCreativeFolder = false;
  let page = 'home';
  let activeId = '';
  let busy = false;
  let turnBusy = false;
  let fullTurnBusy = false;
  let manageRecords = false;
  let selectedDebateIds = new Set();
  let composerSide = 'affirmative';
  let draft = { topic: '', affirmative: [], negative: [] };
  let rolePickerSide = '';
  let renderedView = '';
  let savedScrollTop = 0;

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { debates: Array.isArray(value.debates) ? value.debates.map(normalizeDebate) : [] };
    } catch { return { debates: [] }; }
  }
  function normalizeParticipant(value) {
    if (!value) return null;
    if (typeof value === 'string') return { id: 'self', name: '我', type: 'user' };
    const type = value.type || 'user';
    if (type === 'user') return { id: 'self', name: '我', type: 'user' };
    return {
      id: value.id || uid('participant'),
      name: value.name || '未命名参与者',
      avatar: value.avatar || '',
      type,
      identity: value.identity || '',
      gender: value.gender || '',
      details: value.details || '',
      signature: value.signature || '',
      personality: value.personality || '',
      voiceStyle: value.voiceStyle || ''
    };
  }
  function participantList(value) { const values = Array.isArray(value) ? value : value ? [value] : []; const seen = new Set(); return values.map(normalizeParticipant).filter(item => { if (!item || seen.has(item.id)) return false; seen.add(item.id); return true; }); }
  function normalizeDebate(item) { const sides = item?.sides || {}; let affirmative = participantList(sides.affirmative).slice(0, 4); let negative = participantList(sides.negative).slice(0, 4); if (affirmative.some(item => item.id === 'self')) negative = negative.filter(item => item.id !== 'self'); else if (negative.some(item => item.id === 'self')) affirmative = affirmative.filter(item => item.id !== 'self'); return { ...item, sides: { affirmative, negative }, openSides: { affirmative: item?.openSides?.affirmative !== false, negative: item?.openSides?.negative !== false }, turns: Array.isArray(item?.turns) ? item.turns : [], currentRound: Number(item?.currentRound || 0), winner: ['affirmative', 'negative', 'draw'].includes(item?.winner) ? item.winner : '', winnerReason: String(item?.winnerReason || ''), aiGenerating: false }; }
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
      (chat.contacts || []).filter(item => item && !item.isGroup).forEach(item => {
        if (item.id) result.push({
          id: `contact:${item.id}`,
          name: item.nickname || item.name || '角色',
          avatar: item.avatar || '',
          type: 'character',
          identity: item.identity || '',
          gender: item.gender || '',
          details: item.details || '',
          signature: item.signature || '',
          personality: item.personality || '',
          voiceStyle: item.voiceStyle || ''
        });
      });
    } catch {}
    return result.filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);
  }
  function participantName(id) { return participants().find(item => item.id === id)?.name || '未命名参与者'; }
  function participantById(id) { return participants().find(item => item.id === id) || { id, name: participantName(id), type: id === 'self' ? 'user' : 'character' }; }
  function participantAvatar(participant) { return participant?.avatar ? `<img src="${esc(participant.avatar)}" alt="">` : esc((participant?.name || '我').slice(0, 1)); }
  function nameFor(participant) { return participant?.name || '开放席位'; }
  function debateParticipantSnapshot(participant) {
    const value = participant || {};
    return {
      id:value.id || uid('participant'), name:value.name || '未命名参与者', type:value.type || 'user',
      identity:String(value.identity || '').slice(0, 240), gender:String(value.gender || '').slice(0, 80),
      details:String(value.details || '').slice(0, 5000), signature:String(value.signature || '').slice(0, 1200),
      personality:String(value.personality || '').slice(0, 3000), voiceStyle:String(value.voiceStyle || '').slice(0, 1200)
    };
  }
  function liveParticipant(participant) {
    if (!participant || participant.type === 'user') return participant;
    const current = participants().find(item => item.id === participant.id);
    return current ? { ...current, ...participant, details: participant.details || current.details, signature: participant.signature || current.signature, identity: participant.identity || current.identity, personality: participant.personality || current.personality, voiceStyle: participant.voiceStyle || current.voiceStyle } : participant;
  }
  function participantProfileText(participant) {
    const person = liveParticipant(participant) || {};
    const details = person.details || person.personality || person.signature || '暂无详细人设，请保持自然、克制并与身份一致';
    return `姓名：${nameFor(person)}\n身份：${person.identity || '未注明'}\n性别：${person.gender || '未注明'}\n人设与经历：${details}\n说话方式：${person.voiceStyle || person.signature || '根据上述人设形成独特语气，避免与其他发言人同口吻'}`;
  }
  function speakerRoleLabel(debate, side, speaker) {
    const numerals = ['一', '二', '三', '四'];
    const index = (debate?.sides?.[side] || []).findIndex(item => item.id === speaker?.id);
    return `${sideLabel(side)}${numerals[Math.max(0, index)] || '一'}辩`;
  }
  function cleanDebateSpeech(text, roleLabel, speakerName) {
    let result = String(text || '').trim();
    const name = String(speakerName || '').trim();
    if (!name) return result;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(我(?:是|叫)|本人(?:是|叫)|作为)\\s*[“"「『]?${escapedName}[”"」』]?`, 'g');
    return result.replace(pattern, (match, prefix) => prefix === '作为' ? `作为${roleLabel}` : `我是${roleLabel}`);
  }

  function openApp(fromCreativeFolder = false) { openedFromCreativeFolder = Boolean(fromCreativeFolder); if (!fullTurnBusy) state = readState(); if (page === 'room' && !activeDebate()) { page = 'home'; activeId = ''; } shell?.classList.remove('is-open'); shell?.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); app.classList.add('is-open'); app.setAttribute('aria-hidden', 'false'); render(true); }
  function closeApp() { savedScrollTop = app.querySelector('.debate-page')?.scrollTop ?? savedScrollTop; app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); }
  function backToFolder() { savedScrollTop = app.querySelector('.debate-page')?.scrollTop ?? savedScrollTop; app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); if (openedFromCreativeFolder) { folder?.classList.add('is-open'); folder?.setAttribute('aria-hidden', 'false'); } else { folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); } }

  function homePage() {
    const records = state.debates.slice().reverse();
    const selectedCount = records.filter(item => selectedDebateIds.has(item.id)).length;
    const list = records.map(item => manageRecords
      ? `<label class="debate-history-card is-managing ${selectedDebateIds.has(item.id) ? 'is-selected' : ''}"><input type="checkbox" data-debate-select="${esc(item.id)}" ${selectedDebateIds.has(item.id) ? 'checked' : ''}><span class="debate-history-mark">${item.status === '已结束' ? '✓' : 'VS'}</span><span><b>${esc(item.topic)}</b><small>${esc(item.updatedAt || item.createdAt)} · ${item.turns.length} 条发言 · 正方 ${item.sides.affirmative.length} 人 / 反方 ${item.sides.negative.length} 人</small></span></label>`
      : `<button class="debate-history-card" data-debate-open="${esc(item.id)}" type="button"><span class="debate-history-mark">${item.status === '已结束' ? '✓' : 'VS'}</span><span><b>${esc(item.topic)}</b><small>${esc(item.updatedAt || item.createdAt)} · ${item.turns.length} 条发言 · 正方 ${item.sides.affirmative.length} 人 / 反方 ${item.sides.negative.length} 人</small></span><i>›</i></button>`).join('');
    const manageActions = manageRecords
      ? `<div class="debate-history-manage-actions"><button data-debate-manage-cancel type="button">完成</button><button data-debate-select-all type="button">${selectedCount === records.length && records.length ? '取消全选' : '全选'}</button><button data-debate-delete-selected type="button" ${selectedCount ? '' : 'disabled'}>删除${selectedCount ? `（${selectedCount}）` : ''}</button></div>`
      : `<button class="debate-history-manage-button" data-debate-manage type="button">管理</button>`;
    return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-folder type="button" aria-label="返回文件夹">‹</button><div><span class="debate-kicker">ARGUMENT ROOM</span><h1>辩论</h1><p>让观点交锋，也让过程被留下。</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-hero"><div><span>今日开一局</span><h2>随机生成一个辩题，开始你的观点交锋。</h2><p>可以自己加入正方或反方，也可以把角色安排到两边。</p></div><button data-debate-new type="button"><i>＋</i><b>新建辩论</b><small>API 随机出题</small></button></section><section class="debate-history"><div class="debate-section-head"><div><span>DEBATE LOG</span><h2>辩论记录</h2></div><div class="debate-history-tools"><b>${state.debates.length} 场</b>${manageActions}</div></div>${list || '<div class="debate-empty"><i>VS</i><p>还没有辩论记录<br>创建一场，让第一个观点留下来。</p></div>'}</section></main></section>`;
  }

  function draftPeople(side) { const ids = draft[side]; return ids.length ? ids.map(id => { const person = participantById(id); return `<button class="debate-person-avatar ${person.type === 'user' ? 'is-user' : ''}" data-debate-remove-draft="${side}" data-debate-remove-id="${esc(id)}" type="button" title="${esc(person.name)}" aria-label="移除${esc(person.name)}">${participantAvatar(person)}</button>`; }).join('') : '<em class="debate-no-people">还没有安排参与者</em>'; }
  function roleOptionsForSide(side) { const selected = new Set(draft[side].filter(id => id !== 'self')); const other = side === 'affirmative' ? draft.negative : draft.affirmative; const usedByOther = new Set(other.filter(id => id !== 'self')); const roles = participants().filter(item => item.type === 'character'); return roles.length ? roles.map(item => { const locked = usedByOther.has(item.id); return `<button class="debate-role-avatar-option ${selected.has(item.id) ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}" data-debate-role-option="${esc(item.id)}" type="button" title="${esc(item.name)}" aria-label="${esc(item.name)}" aria-pressed="${selected.has(item.id)}" ${locked ? 'disabled' : ''}><span>${participantAvatar(item)}</span><i>✓</i></button>`; }).join('') : '<p class="debate-role-picker-empty">暂无可选角色</p>'; }
  function rolePickerPanel() { if (!rolePickerSide) return ''; const side = rolePickerSide; const label = sideLabel(side); const selectedCount = draft[side].filter(id => id !== 'self').length; return `<div class="debate-role-picker-layer" data-debate-role-picker-layer><button class="debate-role-picker-backdrop" data-debate-role-picker-close type="button" aria-label="关闭角色选择"></button><section class="debate-role-picker" role="dialog" aria-label="选择${label}角色"><header><div><span>${label}</span><b>选择角色</b></div><button type="button" data-debate-role-picker-close aria-label="关闭">×</button></header><div class="debate-role-avatar-grid">${roleOptionsForSide(side)}</div><footer><small>已选 ${selectedCount} / 4</small><button type="button" data-debate-role-picker-done>完成</button></footer></section></div>`; }
  function sideDraftCard(side) { const label = sideLabel(side); const other = side === 'affirmative' ? draft.negative : draft.affirmative; const hasSelf = draft[side].includes('self'); const userInOther = other.includes('self'); const full = draft[side].length >= 4; return `<article class="debate-draft-side ${sideClass(side)}"><div class="debate-side-heading"><span>${label}</span><small>${draft[side].length} / 4 人</small></div><div class="debate-side-people">${draftPeople(side)}</div><div class="debate-add-row"><button class="debate-role-picker-button" data-debate-open-role-picker="${side}" type="button" ${full ? 'disabled' : ''}>选择角色 <span>＋</span></button><button data-debate-join-draft="${side}" type="button" ${full || hasSelf || userInOther ? 'disabled' : ''}>${hasSelf ? '已加入' : '我加入'}</button></div><small class="debate-open-hint">角色可多选，用户只能加入一方</small></article>`; }
  function newPage() { return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-home type="button" aria-label="返回辩论记录">‹</button><div><span class="debate-kicker">NEW ROOM</span><h1>新建辩论</h1><p>正方、反方各固定 4 人。</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-topic-card"><div class="debate-card-eyebrow"><span>TOPIC GENERATOR</span><b>API 出题</b></div><h2>${draft.topic ? esc(draft.topic) : '还没有辩题'}</h2><textarea data-debate-topic placeholder="也可以自己修改辩题…">${esc(draft.topic)}</textarea><button class="debate-generate-button" data-debate-generate type="button" ${busy ? 'disabled' : ''}>${busy ? '生成中…' : '⌁ 随机生成辩题'}</button></section><section class="debate-arrange-card"><div class="debate-section-head"><div><span>PARTICIPANTS</span><h2>安排双方</h2></div><small>每方固定 4 人</small></div><div class="debate-draft-sides">${sideDraftCard('affirmative')}${sideDraftCard('negative')}</div></section><button class="debate-start-button" data-debate-start type="button">创建辩论房间 <span>›</span></button><p class="debate-local-note">本机创建的房间和完整发言记录会保存在当前设备。</p></main>${rolePickerPanel()}</section>`; }

  function roomPeople(side, debate) { const people = debate.sides[side] || []; return people.length ? people.map(item => `<span class="debate-room-person">${esc(nameFor(item))}</span>`).join('') : '<em class="debate-no-people">还没有人加入</em>'; }
  function participantCard(side, debate) { const label = sideLabel(side); const full = debate.sides[side].length >= 4; return `<div class="debate-room-side ${sideClass(side)}"><div class="debate-room-side-head"><span>${label}</span><small>${debate.sides[side].length} / 4 人</small></div><div class="debate-room-people">${roomPeople(side, debate)}</div><button data-debate-join="${side}" type="button" ${full ? 'disabled' : ''}>${full ? '这一方已满' : `＋ 加入${label}`}</button></div>`; }
  function speakerOptions(debate, side) { const people = debate.sides[side] || []; return people.length ? people.map((item, index) => `<option value="${esc(item.id)}" ${index === 0 ? 'selected' : ''}>${esc(nameFor(item))}</option>`).join('') : '<option value="">先加入发言人</option>'; }

  function roomPage(debate) {
    const turns = debate.turns.map((item, index) => `<article class="debate-turn ${sideClass(item.side)}"><div class="debate-turn-meta"><span>${esc(sideLabel(item.side))}</span><b>${esc(item.author)}</b><small>${esc(item.round)} · ${esc(item.time)} · #${index + 1}</small></div><p>${esc(item.text)}</p></article>`).join('');
    const currentRound = debate.currentRound || 0;
    const result = debate.winner ? `<section class="debate-result ${sideClass(debate.winner === 'draw' ? 'affirmative' : debate.winner)}"><span>辩论结果</span><h3>${debate.winner === 'draw' ? '平局' : `${sideLabel(debate.winner)}获胜`}</h3>${debate.winnerReason ? `<p>${esc(debate.winnerReason)}</p>` : ''}</section>` : '';
    return `<section class="debate-page"><header class="debate-header"><button class="debate-header-back" data-debate-home type="button" aria-label="返回辩论记录">‹</button><div><span class="debate-kicker">DEBATE ROOM</span><h1>${debate.aiGenerating ? 'API 辩论进行中' : debate.winner ? '辩论已结束' : '辩论进行中'}</h1><p>${esc(debate.createdAt)} 开始 · ${debate.turns.length} 条发言</p></div><button class="debate-header-close" data-debate-close type="button" aria-label="关闭辩论">×</button></header><main class="debate-main"><section class="debate-room-topic"><span>辩题</span><h2>${esc(debate.topic)}</h2><div class="debate-room-sides">${participantCard('affirmative', debate)}${participantCard('negative', debate)}</div></section>${result}<nav class="debate-rounds" aria-label="辩论回合">${rounds.map((round, index) => `<button class="${index === currentRound ? 'is-active' : ''} ${index < currentRound ? 'is-done' : ''}" data-debate-round="${index}" type="button"><i>${index + 1}</i><span>${round}</span></button>`).join('')}</nav><section class="debate-transcript"><div class="debate-section-head"><div><span>TRANSCRIPT</span><h2>完整过程</h2></div><small>自动保存</small></div>${turns || '<div class="debate-transcript-empty">选择一方并记录第一句立论，完整过程会出现在这里。</div>'}</section><form class="debate-composer" data-debate-form><div class="debate-composer-head"><b>记录发言</b><span>可以手动写，也可以让 API 先生成草稿</span></div><div class="debate-composer-selects"><label>阵营<select data-debate-turn-side><option value="affirmative" ${composerSide === 'affirmative' ? 'selected' : ''}>正方</option><option value="negative" ${composerSide === 'negative' ? 'selected' : ''}>反方</option></select></label><label>发言人<select data-debate-turn-speaker>${speakerOptions(debate, composerSide)}</select></label><label>回合<select data-debate-turn-round>${rounds.map((round, index) => `<option value="${index}" ${index === currentRound ? 'selected' : ''}>${round}</option>`).join('')}</select></label></div><textarea data-debate-turn-text maxlength="3000" placeholder="写下这一方的观点、问题或回应…"></textarea><div class="debate-composer-actions"><button class="debate-generate-turn-button" type="button" data-debate-generate-full ${fullTurnBusy || debate.turns.length || debate.aiGenerating ? 'disabled' : ''}>${fullTurnBusy || debate.aiGenerating ? '完整生成中…' : debate.turns.length ? '已有发言' : '⌁ API 完整辩论'}</button><button class="debate-generate-turn-button" type="button" data-debate-generate-turn ${turnBusy || fullTurnBusy || debate.aiGenerating ? 'disabled' : ''}>${turnBusy ? '生成中…' : '⌁ API 生成发言'}</button><button class="debate-record-button" type="submit" ${debate.aiGenerating ? 'disabled' : ''}>保存这次发言 <span>↑</span></button></div></form></main></section>`;
  }

  function render(restoreSavedScroll = false) { const debate = activeDebate(); const view = `${page}:${activeId}`; const sameView = renderedView === view; const scrollTop = sameView ? (restoreSavedScroll || !app.classList.contains('is-open') ? savedScrollTop : app.querySelector('.debate-page')?.scrollTop ?? savedScrollTop) : 0; app.innerHTML = page === 'home' ? homePage() : page === 'new' ? newPage() : debate ? roomPage(debate) : homePage(); renderedView = view; savedScrollTop = scrollTop; const pageElement = app.querySelector('.debate-page'); if (pageElement) pageElement.scrollTop = scrollTop; }

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

  async function generateTurn() {
    if (turnBusy) return;
    const debate = activeDebate();
    if (!debate) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('debate') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置辩论 API 模型。');
    const side = app.querySelector('[data-debate-turn-side]')?.value || composerSide;
    const speakerId = app.querySelector('[data-debate-turn-speaker]')?.value || '';
    const round = Number(app.querySelector('[data-debate-turn-round]')?.value || debate.currentRound || 0);
    const speaker = (debate.sides[side] || []).find(item => item.id === speakerId) || (debate.sides[side] || [])[0];
    if (!speaker) return window.alert('请先为这一方加入发言人。');
    const roleLabel = speakerRoleLabel(debate, side, speaker);
    const transcript = debate.turns.length ? debate.turns.map(item => `${sideLabel(item.side)}·${item.round}·${item.author}：${item.text}`).join('\n') : '暂无已记录发言。';
    const sides = ['affirmative', 'negative'].map(key => `${sideLabel(key)}：\n${(debate.sides[key] || []).map(person => `- ${participantProfileText(person).replace(/\n/g, '；')}`).join('\n') || '暂无'}`).join('\n');
    const speakerProfile = participantProfileText(speaker);
    turnBusy = true; render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.82, messages:[
        { role:'system', content:'你是中文辩论发言生成器。只输出发言正文，不要标题、角色名、阶段说明、Markdown 或解释。必须围绕辩题，准确回应已有发言，并符合当前阵营立场。先读取当前发言人的人设、身份和说话方式，再组织观点；不同发言人必须有明显不同的措辞、句式、论证角度和情绪表达，不能所有人都像同一个标准辩手。发言人自称时只能说“正方一辩”“正方二辩”“反方一辩”等辩位，不得说“我是某某姓名”、不得说“我叫某某”，也不要把角色姓名写进发言正文。立论要提出清晰主张和理由；质询要提出具体问题或回答问题；反驳要针对对方观点；总结要归纳己方论证。不要捏造未提供的事实。' },
        { role:'user', content:`辩题：${debate.topic}\n当前阶段：${rounds[round]}\n发言阵营：${sideLabel(side)}\n当前发言辩位：${roleLabel}\n\n当前发言人完整人设（仅用于理解，不要在正文自报名）：\n${speakerProfile}\n\n双方安排与人设：\n${sides}\n\n已有完整记录：\n${transcript}\n\n请生成这一位发言人的一段中文发言，长度约 150—350 字。` }
      ] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const text = cleanDebateSpeech(String(payload.choices?.[0]?.message?.content || '').replace(/^```(?:text|markdown)?\s*|\s*```$/gi, '').trim(), roleLabel, nameFor(speaker));
      if (!text) throw new Error('API 没有返回发言内容');
      turnBusy = false;
      render();
      const sideSelect = app.querySelector('[data-debate-turn-side]');
      const speakerSelect = app.querySelector('[data-debate-turn-speaker]');
      const roundSelect = app.querySelector('[data-debate-turn-round]');
      if (sideSelect) sideSelect.value = side;
      if (speakerSelect) speakerSelect.value = speaker.id;
      if (roundSelect) roundSelect.value = String(round);
      const input = app.querySelector('[data-debate-turn-text]');
      if (input) { input.value = text; input.focus(); }
    } catch (error) { turnBusy = false; window.alert(`发言生成失败：${error.message}`); render(); }
  }

  async function generateFullDebate() {
    if (fullTurnBusy) return;
    const debate = activeDebate();
    if (!debate || debate.turns.length) return window.alert('这场辩论已经有发言，请使用“API 生成发言”继续。');
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('debate') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置辩论 API 模型。');
    const slots = rounds.flatMap((round, roundIndex) => ['affirmative', 'negative'].map(side => {
      const people = debate.sides[side] || [];
      return { roundIndex, side, speaker: people[roundIndex % Math.max(1, people.length)] || people[0] };
    }));
    if (slots.some(item => !item.speaker)) return window.alert('正方和反方都需要至少一位发言人。');
    const schedule = slots.map((item, index) => `${index + 1}. 第${item.roundIndex + 1}阶段「${rounds[item.roundIndex]}」· ${speakerRoleLabel(debate, item.side, item.speaker)}（内部对应：${nameFor(item.speaker)}）`).join('\n');
    const configText = ['affirmative', 'negative'].map(side => `${sideLabel(side)}：\n${(debate.sides[side] || []).map(person => `- ${participantProfileText(person)}`).join('\n\n') || '暂无'}`).join('\n\n');
    fullTurnBusy = true;
    debate.aiGenerating = true;
    save();
    render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.82, messages:[
        { role:'system', content:'你是中文辩论主持与记录员。按给定顺序生成完整四阶段辩论，每个阶段先正方后反方。只返回合法 JSON 数组，不要 Markdown 或解释。每项格式为 {"index":1,"text":"发言正文"}。每段 150—350 字，必须围绕辩题、回应前文并符合该方立场。每一段都要先对应到固定顺序里的具体辩位，严格使用其身份、人设和说话方式；不同发言人要有可辨认的语言差异，不能让八段发言像同一个人写的。正文中如需自称，只能使用“正方一辩/二辩/三辩/四辩”或“反方一辩/二辩/三辩/四辩”，严禁使用角色姓名自称或出现“我是某某姓名”“我叫某某”。不要把人设当成虚构事实的许可，也不要捏造未提供的事实。立论提出主张，质询提出或回答具体问题，反驳针对对方论点，总结归纳己方论证。' },
        { role:'user', content:`辩题：${debate.topic}\n双方及每位发言人的人设：\n${configText}\n\n固定发言顺序（括号内姓名仅供内部对应，不能写进正文）：\n${schedule}\n\n请严格按 1 到 ${slots.length} 返回完整发言数组。` }
      ] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const raw = String(payload.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
      const parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw);
      if (!Array.isArray(parsed)) throw new Error('API 返回格式不正确');
      const generated = slots.map((slot, index) => cleanDebateSpeech(String(parsed.find(item => Number(item?.index) === index + 1)?.text || parsed[index]?.text || '').trim(), speakerRoleLabel(debate, slot.side, slot.speaker), nameFor(slot.speaker)));
      if (generated.some(text => !text)) throw new Error('API 没有返回完整的辩论过程');
      generated.forEach((text, index) => { const slot = slots[index]; debate.turns.push({ id:uid('turn'), side:slot.side, roundIndex:slot.roundIndex, round:rounds[slot.roundIndex], author:nameFor(slot.speaker), text, time:now() }); });
      debate.currentRound = rounds.length - 1;
      const transcript = debate.turns.map(item => `${sideLabel(item.side)}·${item.round}·${item.author}：${item.text}`).join('\n');
      try {
        const judgeResponse = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.2, messages:[
          { role:'system', content:'你是中文辩论裁判。根据辩题和完整发言，判断正方、反方或平局。只返回合法 JSON，不要 Markdown 或解释，格式为 {"winner":"affirmative或negative或draw","reason":"不超过 100 字的判断理由"}。不要因为立场偏好判定，只比较论点回应、论据质量和总结完整度。' },
          { role:'user', content:`辩题：${debate.topic}\n\n完整发言：\n${transcript}` }
        ] }) });
        if (judgeResponse.ok) {
          const judgePayload = await judgeResponse.json();
          const judgeRaw = String(judgePayload.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
          const judge = JSON.parse(judgeRaw.match(/\{[\s\S]*\}/)?.[0] || judgeRaw);
          if (['affirmative', 'negative', 'draw'].includes(judge.winner)) { debate.winner = judge.winner; debate.winnerReason = String(judge.reason || '').slice(0, 240); }
        }
      } catch {}
      if (!debate.winner) { debate.winner = 'draw'; debate.winnerReason = '未能完成自动判定，请根据完整过程自行比较双方论证。'; }
      debate.status = '已结束';
      debate.aiGenerating = false;
      debate.updatedAt = now();
      save();
      fullTurnBusy = false;
      render();
    } catch (error) { fullTurnBusy = false; debate.aiGenerating = false; save(); window.alert(`完整辩论生成失败：${error.message}`); render(); }
  }

  async function judgeFinishedDebate(debate) {
    if (!debate || debate.winner || debate.aiGenerating) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('debate') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return;
    const transcript = debate.turns.map(item => `${sideLabel(item.side)}·${item.round}·${item.author}：${item.text}`).join('\n');
    fullTurnBusy = true; debate.aiGenerating = true; save(); render();
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.2, messages:[
        { role:'system', content:'你是中文辩论裁判。只返回合法 JSON，不要 Markdown 或解释，格式为 {"winner":"affirmative或negative或draw","reason":"不超过 100 字的判断理由"}。只比较双方论点回应、论据质量和总结完整度。' },
        { role:'user', content:`辩题：${debate.topic}\n\n完整发言：\n${transcript}` }
      ] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const raw = String(payload.choices?.[0]?.message?.content || '').replace(/```json?|```/gi, '').trim();
      const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      debate.winner = ['affirmative', 'negative', 'draw'].includes(result.winner) ? result.winner : 'draw';
      debate.winnerReason = String(result.reason || '').slice(0, 240) || '根据双方完整发言进行综合判断。';
      debate.status = '已结束';
    } catch { debate.winner = 'draw'; debate.winnerReason = '自动判定失败，请根据完整过程自行比较双方论证。'; }
    fullTurnBusy = false; debate.aiGenerating = false; debate.updatedAt = now(); save(); render();
  }

  function startDebate() {
    const topic = app.querySelector('[data-debate-topic]')?.value.trim() || draft.topic.trim();
    if (!topic) return window.alert('请先生成或填写一个辩题。');
    if (draft.affirmative.length !== 4 || draft.negative.length !== 4) return window.alert('请先为正方和反方各安排 4 人。');
    const all = participants();
    const findPeople = side => draft[side].map(id => all.find(item => item.id === id)).filter(Boolean).map(debateParticipantSnapshot);
    const debate = normalizeDebate({ id: uid(), topic, createdAt: now(), updatedAt: now(), status: '进行中', currentRound: 0, openSides: { affirmative: true, negative: true }, sides: { affirmative: findPeople('affirmative'), negative: findPeople('negative') }, turns: [] });
    if (debate.sides.affirmative.some(first => debate.sides.negative.some(second => first.id === second.id))) return window.alert('同一个参与者不能同时安排到正方和反方。');
    state.debates.push(debate); save(); activeId = debate.id; page = 'room'; composerSide = 'affirmative'; render();
  }

  function joinSide(side) { const debate = activeDebate(); if (!debate) return; const other = side === 'affirmative' ? 'negative' : 'affirmative'; if (debate.sides[side].length >= 4) return window.alert('这一方已经有 4 人。'); if (debate.sides[side].some(item => item.type === 'user')) return window.alert('用户已经加入这一方。'); if (debate.sides[other].some(item => item.type === 'user')) return window.alert('用户只能加入一方。'); debate.sides[side].push({ id: 'self', name: '我', type: 'user' }); debate.updatedAt = now(); save(); render(); }
  function recordTurn(event) { event.preventDefault(); const debate = activeDebate(); if (!debate) return; const side = app.querySelector('[data-debate-turn-side]')?.value || composerSide; const speakerId = app.querySelector('[data-debate-turn-speaker]')?.value; const text = app.querySelector('[data-debate-turn-text]')?.value.trim(); const round = Number(app.querySelector('[data-debate-turn-round]')?.value || debate.currentRound || 0); if (!text) return window.alert('请先写下这次发言。'); if (!debate.sides[side].length) { joinSide(side); return; } const speaker = debate.sides[side].find(item => item.id === speakerId) || debate.sides[side][0]; debate.turns.push({ id: uid('turn'), side, roundIndex: round, round: rounds[round], author: nameFor(speaker), text, time: now() }); debate.currentRound = Math.min(rounds.length - 1, round + 1); debate.updatedAt = now(); save(); render(); if (debate.turns.length >= rounds.length * 2) judgeFinishedDebate(debate); }

  document.addEventListener('click', event => {
    const launcher = event.target.closest('[data-folder-app="debate"]');
    if (launcher) { openApp(Boolean(launcher.closest('[data-desktop-folder]'))); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-debate-close]')) { closeApp(); return; }
    if (event.target.closest('[data-debate-folder]')) { backToFolder(); return; }
    if (event.target.closest('[data-debate-new]')) { draft = { topic: '', affirmative: [], negative: [] }; rolePickerSide = ''; manageRecords = false; selectedDebateIds.clear(); page = 'new'; render(); return; }
    if (event.target.closest('[data-debate-home]')) { rolePickerSide = ''; manageRecords = false; selectedDebateIds.clear(); page = 'home'; activeId = ''; render(); return; }
    if (event.target.closest('[data-debate-manage]')) { manageRecords = true; selectedDebateIds.clear(); render(); return; }
    if (event.target.closest('[data-debate-manage-cancel]')) { manageRecords = false; selectedDebateIds.clear(); render(); return; }
    if (event.target.closest('[data-debate-select-all]')) { const ids = state.debates.map(item => item.id); if (ids.length && ids.every(id => selectedDebateIds.has(id))) selectedDebateIds.clear(); else selectedDebateIds = new Set(ids); render(); return; }
    if (event.target.closest('[data-debate-delete-selected]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const ids = new Set([...selectedDebateIds].filter(id => state.debates.some(item => item.id === id)));
      if (!ids.size) return;
      if (!window.confirm(`确定删除选中的 ${ids.size} 条辩论记录吗？完整发言也会一并删除。`)) return;
      state.debates = state.debates.filter(item => !ids.has(item.id));
      selectedDebateIds.clear();
      if (!state.debates.length) manageRecords = false;
      save();
      render();
      return;
    }
    const open = event.target.closest('[data-debate-open]');
    if (open && !manageRecords) { manageRecords = false; selectedDebateIds.clear(); activeId = open.dataset.debateOpen; page = 'room'; composerSide = 'affirmative'; render(); return; }
    if (event.target.closest('[data-debate-generate]')) { generateTopic(); return; }
    if (event.target.closest('[data-debate-generate-full]')) { generateFullDebate(); return; }
    if (event.target.closest('[data-debate-generate-turn]')) { generateTurn(); return; }
    if (event.target.closest('[data-debate-start]')) { startDebate(); return; }
    if (event.target.closest('[data-debate-role-picker-close]') || event.target.closest('[data-debate-role-picker-done]')) { rolePickerSide = ''; render(); return; }
    const openRolePicker = event.target.closest('[data-debate-open-role-picker]');
    if (openRolePicker) { if (draft[openRolePicker.dataset.debateOpenRolePicker].length < 4) { rolePickerSide = openRolePicker.dataset.debateOpenRolePicker; render(); } return; }
    const roleOption = event.target.closest('[data-debate-role-option]');
    if (roleOption) { const side = rolePickerSide; const id = roleOption.dataset.debateRoleOption; const other = side === 'affirmative' ? draft.negative : draft.affirmative; if (!side || !id || other.includes(id)) return; if (draft[side].includes(id)) draft[side] = draft[side].filter(item => item !== id); else if (draft[side].length < 4) draft[side].push(id); render(); return; }
    const joinDraft = event.target.closest('[data-debate-join-draft]');
    if (joinDraft) { const side = joinDraft.dataset.debateJoinDraft; const other = side === 'affirmative' ? 'negative' : 'affirmative'; if (draft[side].length >= 4) return window.alert('这一方已经有 4 人。'); if (draft[other].includes('self')) return window.alert('用户只能加入一方。'); if (!draft[side].includes('self')) draft[side].push('self'); render(); return; }
    const removeDraft = event.target.closest('[data-debate-remove-draft]');
    if (removeDraft) { const side = removeDraft.dataset.debateRemoveDraft; draft[side] = draft[side].filter(id => id !== removeDraft.dataset.debateRemoveId); render(); return; }
    const join = event.target.closest('[data-debate-join]');
    if (join) { joinSide(join.dataset.debateJoin); return; }
    const round = event.target.closest('[data-debate-round]');
    if (round) { const debate = activeDebate(); if (debate) { debate.currentRound = Number(round.dataset.debateRound); save(); render(); } }
  });
  document.addEventListener('change', event => { if (!app.classList.contains('is-open')) return; if (event.target.matches('[data-debate-turn-side]')) { composerSide = event.target.value; render(); } });
  document.addEventListener('input', event => { if (event.target.matches('[data-debate-topic]')) draft.topic = event.target.value; });
  document.addEventListener('submit', event => { if (event.target.matches('[data-debate-form]')) recordTurn(event); });
  document.addEventListener('change', event => {
    if (!app.classList.contains('is-open') || !event.target.matches('[data-debate-select]')) return;
    const id = event.target.dataset.debateSelect;
    if (event.target.checked) selectedDebateIds.add(id); else selectedDebateIds.delete(id);
    render();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && app.classList.contains('is-open')) closeApp(); });
})();
