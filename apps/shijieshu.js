(() => {
  const storageKey = 'ideal-machine-worldbooks';
  const analysisStorageKey = 'ideal-machine-worldbook-analyses';
  const chatStorageKey = 'ideal-machine-chat';
  const taNpcStorageKey = 'ideal-machine-ta-npcs';
  const categories = { global: '全局世界书', local: '局部世界书', forum: '论坛世界书' };
  const data = (() => { try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } })();
  Object.keys(categories).forEach(key => { if (!Array.isArray(data[key])) data[key] = []; });
  let activeCategory = 'global';
  let activeBookId = null;
  let editorTarget = null;
  let analysisBookId = null;
  let analysisText = '';
  let analysisBusy = false;
  let analysisOpen = false;
  let analysisResult = null;
  let selectedAnalysisNpc = '';
  let apiHint = '';

  const app = document.createElement('div');
  app.className = 'worldbook-app';
  app.innerHTML = `<div class="worldbook-page"><header class="worldbook-header"><div><div class="worldbook-kicker">KNOWLEDGE SYSTEM</div><h1>世界书</h1><p>将设定、关系与秩序，安静地收纳在一起。</p></div><button class="worldbook-close" data-world-close type="button">×</button></header><nav class="worldbook-tabs" aria-label="世界书分类">${Object.entries(categories).map(([key, label]) => `<button data-world-category="${key}" type="button">${label}</button>`).join('')}</nav><main class="worldbook-main"><section class="worldbook-books"><div class="worldbook-section-head"><div><span class="worldbook-eyebrow">LIBRARIES</span><h2 id="worldbookCategoryTitle"></h2></div><button class="worldbook-add-book" data-world-add-book type="button">＋ 新建</button></div><div class="worldbook-book-list" id="worldbookBookList"></div></section><section class="worldbook-entries"><div class="worldbook-section-head"><div><span class="worldbook-eyebrow">ENTRIES</span><h2 id="worldbookBookTitle">选择一本世界书</h2></div><div class="worldbook-entry-actions"><button class="worldbook-view-analysis" data-world-view-analysis type="button" hidden>查看世界</button><button class="worldbook-analyze" data-world-analyze type="button">AI 分析</button><button class="worldbook-add-entry" data-world-add-entry type="button">＋ 条目</button></div><small class="worldbook-api-hint" id="worldbookApiHint"></small></div><div class="worldbook-entry-list" id="worldbookEntryList"></div><section class="worldbook-analysis" id="worldbookAnalysis" hidden></section></section></main></div><section class="worldbook-analysis-page" id="worldbookAnalysisPage" aria-hidden="true"></section><div class="world-editor" id="worldEditor" aria-hidden="true"><div class="world-editor-backdrop" data-world-editor-close></div><section class="world-editor-sheet"><div class="world-editor-head"><div><span class="worldbook-eyebrow">EDIT</span><h2 id="worldEditorTitle">编辑世界书</h2></div><button type="button" data-world-editor-close>×</button></div><div id="worldEditorForm"></div><div class="world-editor-actions"><button type="button" class="world-editor-cancel" data-world-editor-close>取消</button><button type="button" class="world-editor-save" data-world-editor-save>保存</button></div></section></div>`;
  document.body.appendChild(app);
  const worldbookTabs = app.querySelector('.worldbook-tabs');
  const worldbookAddBook = app.querySelector('[data-world-add-book]');
  const worldbookLibraryHead = app.querySelector('.worldbook-books > .worldbook-section-head');
  if (worldbookTabs && worldbookAddBook && worldbookLibraryHead) worldbookLibraryHead.appendChild(worldbookAddBook);

  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(data));
  const books = () => data[activeCategory];
  const activeBook = () => books().find(book => book.id === activeBookId);
  function syncStoredWorldbooks() {
    try {
      const latest = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.keys(categories).forEach(key => { data[key] = Array.isArray(latest[key]) ? latest[key] : []; });
      if (activeBookId && !books().some(book => book.id === activeBookId)) activeBookId = null;
    } catch {}
  }

  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
  function boundRoles(bookId) {
    const chat = readJSON(chatStorageKey, {});
    return (Array.isArray(chat.contacts) ? chat.contacts : []).filter(contact => contact.worldbook === bookId);
  }
  function parseAnalysisJSON(value) {
    const clean = String(value || '').replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('API 没有返回完整的分析数据');
    const source = clean.slice(start, end + 1);
    try { return JSON.parse(source); } catch {}
    try { return JSON.parse(source.replace(/([{,]\s*)([A-Za-z_][\w-]*)\s*:/g, '$1"$2":').replace(/,\s*([}\]])/g, '$1')); }
    catch { throw new Error('API 返回的分析格式不正确，请重新分析'); }
  }
  function relationForRole(result, roleName, npcName) {
    return (Array.isArray(result?.relations) ? result.relations : []).find(item => {
      const source = String(item?.source || ''); const target = String(item?.target || '');
      return (source === roleName && target === npcName) || (source === npcName && target === roleName);
    });
  }
  function syncNpcContacts(book, result, roles) {
    const cache = readJSON(taNpcStorageKey, {});
    roles.forEach(role => {
      const previous = Array.isArray(cache[role.id]) ? cache[role.id] : [];
      const previousByName = new Map(previous.map(item => [String(item.name || '').trim(), item]));
      cache[role.id] = (Array.isArray(result.npcs) ? result.npcs : []).filter(npc => npc && npc.name && npc.name !== role.name && npc.name !== role.nickname).map(npc => {
        const old = previousByName.get(String(npc.name).trim()) || {};
        const link = relationForRole(result, role.name || role.nickname, npc.name) || relationForRole(result, role.nickname || role.name, npc.name);
        return { ...old, name:String(npc.name).trim(), identity:String(npc.identity || 'NPC').trim(), personality:String(npc.personality || '').trim(), motivation:String(npc.motivation || '').trim(), reason:String(link?.relation || npc.relationToRole || npc.reason || '').trim(), relationDescription:String(link?.description || '').trim(), fixed:true, sourceBookId:book.id, messages:Array.isArray(old.messages) ? old.messages : [] };
      });
    });
    localStorage.setItem(taNpcStorageKey, JSON.stringify(cache));
    window.dispatchEvent(new CustomEvent('ideal-ta-npcs-updated', { detail:{ bookId:book.id, roleIds:roles.map(role => role.id) } }));
  }
  function analysisChip(label, value) { return value ? `<span><small>${esc(label)}</small>${esc(value)}</span>` : ''; }
  function relationshipGraph(result, role) {
    const npcs = Array.isArray(result?.npcs) ? result.npcs : [];
    const relations = Array.isArray(result?.relations) ? result.relations : [];
    const roleNames = [role?.name, role?.nickname].filter(Boolean);
    const displayName = roleNames[0] || '核心角色';
    let links = relations.filter(item => roleNames.includes(item?.source) || roleNames.includes(item?.target)).map(item => ({
      name:roleNames.includes(item.source) ? item.target : item.source,
      relation:item.relation || '关联',
      strength:Math.max(0, Math.min(100, Number(item.strength) || 55))
    })).filter(item => item.name && !roleNames.includes(item.name));
    if (!links.length) links = npcs.map(npc => ({ name:npc.name, relation:npc.relationToRole || '关联', strength:55 })).filter(item => item.name);
    const unique = []; const seen = new Set();
    links.forEach(item => { if (!seen.has(item.name)) { seen.add(item.name); unique.push(item); } });
    if (!unique.length) return '';
    const centerX = 180; const centerY = 150;
    const positioned = unique.slice(0, 10).map((item, index, list) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index / list.length);
      const radius = 64 + (100 - item.strength) * .68;
      return { ...item, x:centerX + Math.cos(angle) * radius, y:centerY + Math.sin(angle) * radius };
    });
    const edges = positioned.map(item => `<line class="world-relation-edge" x1="${centerX}" y1="${centerY}" x2="${item.x.toFixed(1)}" y2="${item.y.toFixed(1)}" style="--edge-width:${(1 + item.strength / 65).toFixed(2)}"/>`).join('');
    const nodes = positioned.map(item => `<g class="world-relation-node" data-world-relation-npc="${esc(item.name)}" role="button" tabindex="0" transform="translate(${item.x.toFixed(1)} ${item.y.toFixed(1)})"><circle r="17"/><text y="2.5">${esc(String(item.name).slice(0, 4))}</text><title>查看${esc(item.name)}与角色的关系</title></g>`).join('');
    return `<figure class="world-analysis-graph"><svg viewBox="0 0 360 300" role="img" aria-label="${esc(displayName)}的 NPC 关系远近图"><g class="world-relation-rings"><circle cx="${centerX}" cy="${centerY}" r="64"/><circle cx="${centerX}" cy="${centerY}" r="98"/><circle cx="${centerX}" cy="${centerY}" r="132"/></g><g>${edges}</g><g class="world-relation-center" transform="translate(${centerX} ${centerY})"><circle r="22"/><text y="2.5">${esc(String(displayName).slice(0, 5))}</text></g>${nodes}</svg><figcaption><b>${esc(displayName)}</b><span>离角色越近，关系越亲近 · 点击 NPC 查看详情</span></figcaption></figure>`;
  }
  function relationshipDetailHtml(npcName) {
    const book = activeBook(); const roles = boundRoles(book?.id); const roleNames = roles.flatMap(role => [role.name, role.nickname]).filter(Boolean);
    const npc = (analysisResult?.npcs || []).find(item => item?.name === npcName) || {};
    const link = (analysisResult?.relations || []).find(item => (roleNames.includes(item?.source) && item?.target === npcName) || (roleNames.includes(item?.target) && item?.source === npcName)) || (analysisResult?.relations || []).find(item => item?.source === npcName || item?.target === npcName) || {};
    const favorability = Math.max(0, Math.min(100, Number(link.favorability ?? link.affection ?? link.strength) || 50));
    const roleName = roleNames[0] || (link.source === npcName ? link.target : link.source) || '角色';
    return `<div class="world-relation-detail"><button class="world-relation-detail-backdrop" type="button" data-world-relation-close aria-label="关闭"></button><section><header><i>${esc(String(npcName || '角').slice(0,1))}</i><div><small>${esc(npc.identity || 'NPC')}</small><h2>${esc(npcName)}</h2></div><button type="button" data-world-relation-close>×</button></header><dl><div><dt>与 ${esc(roleName)} 的关系</dt><dd>${esc(link.relation || npc.relationToRole || '关系尚未明确')}</dd></div><div><dt>好感度</dt><dd><b>${favorability}</b><span><i style="width:${favorability}%"></i></span></dd></div></dl><p>${esc(link.description || '世界书中没有更详细的关系说明。')}</p></section></div>`;
  }
  function showRelationshipDetail(npcName) { selectedAnalysisNpc = npcName; document.querySelector('.world-relation-detail')?.remove(); document.querySelector('#worldbookAnalysisPage')?.insertAdjacentHTML('beforeend', relationshipDetailHtml(npcName)); }
  function renderAnalysisPage() {
    const page = document.querySelector('#worldbookAnalysisPage');
    if (!page) return;
    page.classList.toggle('is-open', analysisOpen); page.setAttribute('aria-hidden', String(!analysisOpen));
    if (!analysisOpen) { page.innerHTML = ''; return; }
    const book = activeBook();
    if (analysisBusy) { page.innerHTML = `<header><button type="button" data-world-analysis-back>‹</button><div><small>WORLD DOSSIER</small><h1>${esc(book?.name || '世界分析')}</h1></div></header><main><div class="world-analysis-loading"><i></i><b>正在阅读整本世界书</b><p>梳理世界背景、NPC 与人物关系…</p></div></main>`; return; }
    if (!analysisResult || analysisResult.error) { page.innerHTML = `<header><button type="button" data-world-analysis-back>‹</button><div><small>WORLD DOSSIER</small><h1>${esc(book?.name || '世界分析')}</h1></div></header><main><div class="world-analysis-loading is-error"><b>分析没有完成</b><p>${esc(analysisResult?.error || '暂无分析结果')}</p><button type="button" data-world-analysis-refresh>重新分析</button></div></main>`; return; }
    const world = analysisResult.world || {};
    const roles = boundRoles(book?.id); const roleNames = roles.map(item => item.name || item.nickname).filter(Boolean);
    const relations = Array.isArray(analysisResult.relations) ? analysisResult.relations : [];
    const npcs = Array.isArray(analysisResult.npcs) ? analysisResult.npcs : [];
    const inferredRoleName = relations.flatMap(item => [item.source, item.target]).find(name => name && !npcs.some(npc => npc.name === name));
    const graphRoles = roles.length ? roles : [{ name:inferredRoleName || '核心角色' }];
    const relationGraphs = graphRoles.map(role => relationshipGraph(analysisResult, role)).join('');
    const rules = (Array.isArray(world.rules) ? world.rules : []).map(item => `<li>${esc(item)}</li>`).join('');
    const conflicts = (Array.isArray(analysisResult.conflicts) ? analysisResult.conflicts : []).map(item => `<li>${esc(item)}</li>`).join('');
    page.innerHTML = `<header><button type="button" data-world-analysis-back>‹</button><div><small>WORLD DOSSIER</small><h1>${esc(book?.name || world.title || '世界分析')}</h1><p>${roleNames.length ? `已同步到：${esc(roleNames.join('、'))} 的 TA 联系人` : '当前没有角色绑定这本世界书'}</p></div><button type="button" data-world-analysis-refresh aria-label="重新分析">↻</button></header><main><section class="world-analysis-hero"><span>WORLD BACKGROUND</span><h2>${esc(world.title || book?.name || '世界背景')}</h2><p>${esc(world.summary || '暂无世界背景摘要')}</p><div>${analysisChip('时代', world.era)}${analysisChip('地点', world.location)}${analysisChip('氛围', world.atmosphere)}</div></section>${rules ? `<section class="world-analysis-section"><header><span>WORLD RULES</span><h2>世界规则</h2></header><ul class="world-analysis-rules">${rules}</ul></section>` : ''}<section class="world-analysis-section"><header><span>RELATION NETWORK</span><h2>角色关系网</h2><p>${npcs.length} 位固定联系人 · 点击节点查看关系与好感</p></header><div class="world-analysis-graphs">${relationGraphs || '<p class="world-analysis-empty">没有识别到明确的人物关系。</p>'}</div></section>${conflicts ? `<section class="world-analysis-section"><header><span>OPEN QUESTIONS</span><h2>冲突与空白</h2></header><ul class="world-analysis-rules">${conflicts}</ul></section>` : ''}</main>${selectedAnalysisNpc ? relationshipDetailHtml(selectedAnalysisNpc) : ''}`;
  }

  function render() {
    document.querySelector('#worldbookCategoryTitle').textContent = categories[activeCategory];
    document.querySelectorAll('[data-world-category]').forEach(button => button.classList.toggle('is-active', button.dataset.worldCategory === activeCategory));
    const bookList = document.querySelector('#worldbookBookList');
    bookList.innerHTML = books().length ? books().map(book => `<div class="worldbook-book ${book.id === activeBookId ? 'is-active' : ''}" data-world-book="${book.id}" role="button" tabindex="0"><span class="worldbook-book-mark"></span><span class="worldbook-book-info"><b>${esc(book.name)}</b><small>${book.entries.length} 个条目</small></span><span class="worldbook-book-actions"><button class="worldbook-book-edit" data-world-edit-book="${book.id}" type="button">编辑</button><button class="worldbook-book-delete" data-world-delete-book="${book.id}" type="button">删除</button></span></div>`).join('') : '<div class="worldbook-empty">还没有世界书<br><small>从右上角新建一本开始</small></div>';
    const book = activeBook();
    document.querySelector('#worldbookBookTitle').textContent = book ? book.name : '选择一本世界书';
    document.querySelector('[data-world-add-entry]').disabled = !book;
    const analyzeButton = document.querySelector('[data-world-analyze]');
    analyzeButton.hidden = activeCategory !== 'local';
    analyzeButton.disabled = activeCategory !== 'local' || !book || analysisBusy;
    analyzeButton.textContent = analysisBusy ? '分析中…' : 'AI 分析';
    const viewAnalysisButton = document.querySelector('[data-world-view-analysis]');
    const savedAnalysis = book ? readJSON(analysisStorageKey, {})[book.id] : null;
    viewAnalysisButton.hidden = activeCategory !== 'local' || !book || !savedAnalysis;
    document.querySelector('#worldbookApiHint').textContent = activeCategory === 'local' ? apiHint : '';
    const entryList = document.querySelector('#worldbookEntryList');
    entryList.innerHTML = book ? (book.entries.length ? book.entries.map(entry => { const enabled = entry.enabled !== false; return `<article class="worldbook-entry ${enabled ? '' : 'is-disabled'}"><div class="worldbook-entry-copy"><h3>${esc(entry.name)}</h3><p>${esc(entry.content).replace(/\n/g, '<br>')}</p></div><div class="worldbook-entry-actions"><button class="worldbook-entry-toggle ${enabled ? 'is-on' : ''}" data-world-toggle-entry="${entry.id}" role="switch" aria-checked="${enabled}" type="button"><span class="worldbook-entry-toggle-track"><i></i></span><em>${enabled ? '读取' : '不读'}</em></button><button data-world-edit-entry="${entry.id}" type="button">编辑</button><button data-world-delete-entry="${entry.id}" type="button">删除</button></div></article>`; }).join('') : '<div class="worldbook-empty">这本世界书还没有条目<br><small>添加一个设定、人物或规则</small></div>') : '<div class="worldbook-empty">选择左侧世界书查看条目</div>';
    const analysis = document.querySelector('#worldbookAnalysis');
    analysis.hidden = true;
    analysis.innerHTML = '';
    renderAnalysisPage();
  }

  async function analyzeBook() {
    const book = activeBook();
    const config = window.IdealMachineAPI?.getConfig?.();
    const model = window.IdealMachineAPI?.getModel?.('worldbook');
    if (!book || activeCategory !== 'local') return;
    if (!config?.endpoint || !config.key || !model) { apiHint = '请在设置中接入并选择世界书 API 模型。'; render(); return; }
    apiHint = '';
    analysisBusy = true; analysisOpen = true; selectedAnalysisNpc = ''; analysisBookId = book.id; analysisResult = null; render();
    const roles = boundRoles(book.id);
    const entries = book.entries.filter(entry => entry.enabled !== false).map(entry => `【${entry.name}】\n${entry.content}`).join('\n\n');
    const roleContext = roles.length ? roles.map(role => `角色真实名字：${role.name || role.nickname}\n角色网名（仅作辅助）：${role.nickname || '未填写'}\n身份：${role.identity || '未填写'}\n设定：${role.details || role.signature || '未填写'}`).join('\n\n') : '当前没有角色绑定此世界书，请从世界书中识别核心角色。';
    const prompt = `请完整分析以下局部世界书，只能依据给出的内容，不得虚构未出现的重要人物或规则。返回完整 JSON，不要 Markdown 或解释：
{"world":{"title":"世界名称","summary":"完整的世界背景概括","era":"时代","location":"主要地点","atmosphere":"整体氛围","rules":["关键世界规则"]},"npcs":[{"name":"NPC姓名","identity":"身份","personality":"性格","motivation":"核心动机","relationToRole":"与角色的主要关系"}],"relations":[{"source":"人物A","target":"人物B","relation":"关系名称","description":"关系说明","strength":70,"favorability":65}],"conflicts":["设定冲突、空白或待确认信息"]}。
分析要求：
1. world 必须概括角色所处的时代、地点、社会环境、特殊规则和主要矛盾；
2. npcs 收录世界书中与绑定角色有实际关系的人物，不把绑定角色本人列入 NPC；
3. relations 必须覆盖每个 NPC 与绑定角色的关系，source 和 target 使用准确姓名；strength 是关系紧密程度，favorability 是 NPC 对角色的好感度，均为 0—100；
4. NPC 将固定同步到 TA 手机的聊天联系人，所以姓名必须稳定、去重，不得使用“路人、某人、未知”等占位名称；
5. 信息缺失时留空或写入 conflicts，不要自行补设定。

世界书名称：${book.name}
绑定角色：
${roleContext}

世界书全部启用条目：
${entries || '暂无启用条目'}`;
    try {
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: 0.18, max_tokens:3000, stream:false, messages: [{ role: 'system', content: '你是严谨的世界观档案分析器，只返回完整合法 JSON。' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const result = parseAnalysisJSON(payload.choices?.[0]?.message?.content || payload.output_text || '');
      result.world ||= {}; result.npcs = Array.isArray(result.npcs) ? result.npcs : []; result.relations = Array.isArray(result.relations) ? result.relations : []; result.conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
      analysisResult = result;
      const analyses = readJSON(analysisStorageKey, {}); analyses[book.id] = { ...result, analyzedAt:Date.now() }; localStorage.setItem(analysisStorageKey, JSON.stringify(analyses));
      syncNpcContacts(book, result, roles);
    } catch (error) { analysisResult = { error:`分析失败：${error.message}` }; }
    analysisBusy = false; render();
  }

  function openEditor(target, payload = {}) {
    editorTarget = target;
    const isEntry = target === 'entry';
    document.querySelector('#worldEditorTitle').textContent = isEntry ? (payload.id ? '编辑世界书条目' : '新增世界书条目') : (payload.id ? '编辑世界书' : '新增世界书');
    document.querySelector('#worldEditorForm').innerHTML = isEntry ? `<label class="world-editor-field">条目名称<input id="worldEntryName" maxlength="60" value="${esc(payload.name || '')}" placeholder="例如：城市的季节规律"></label><label class="world-editor-field">条目内容<textarea id="worldEntryContent" placeholder="写下这个条目的完整设定、规则或背景">${esc(payload.content || '')}</textarea></label>` : `<label class="world-editor-field">世界书名称<input id="worldName" maxlength="40" value="${esc(payload.name || '')}" placeholder="例如：角色关系设定"></label>`;
    document.querySelector('#worldEditor').classList.add('is-open');
    document.querySelector('#worldEditor').setAttribute('aria-hidden', 'false');
  }

  function closeEditor() { document.querySelector('#worldEditor').classList.remove('is-open'); document.querySelector('#worldEditor').setAttribute('aria-hidden', 'true'); editorTarget = null; }

  function saveEditor() {
    if (editorTarget === 'book') {
      const name = document.querySelector('#worldName').value.trim();
      if (!name) return;
      const existing = activeBook();
      if (existing) existing.name = name;
      else { const book = { id: uid('book'), name, entries: [] }; books().unshift(book); activeBookId = book.id; }
    } else if (editorTarget === 'entry') {
      const book = activeBook();
      if (!book) return;
      const name = document.querySelector('#worldEntryName').value.trim();
      const content = document.querySelector('#worldEntryContent').value.trim();
      if (!name || !content) return;
      const targetId = document.querySelector('#worldEditorForm').dataset.entryId;
      const existing = book.entries.find(entry => entry.id === targetId);
      if (existing) { existing.name = name; existing.content = content; }
      else book.entries.push({ id: uid('entry'), name, content, enabled: true });
    }
    save(); render(); closeEditor();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="shijieshu"]')) { syncStoredWorldbooks(); analysisOpen = false; selectedAnalysisNpc = ''; app.classList.add('is-open'); render(); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-world-relation-close]')) { selectedAnalysisNpc = ''; document.querySelector('.world-relation-detail')?.remove(); return; }
    const relationNpc = event.target.closest('[data-world-relation-npc]');
    if (relationNpc) { showRelationshipDetail(relationNpc.dataset.worldRelationNpc); return; }
    if (event.target.closest('[data-world-analysis-back]')) { analysisOpen = false; selectedAnalysisNpc = ''; render(); return; }
    if (event.target.closest('[data-world-analysis-refresh]')) { analyzeBook(); return; }
    if (event.target.closest('[data-world-close]')) { analysisOpen = false; app.classList.remove('is-open'); closeEditor(); return; }
    const category = event.target.closest('[data-world-category]');
    if (category) { activeCategory = category.dataset.worldCategory; activeBookId = null; apiHint = ''; render(); return; }
    const bookButton = event.target.closest('[data-world-book]');
    if (bookButton && !event.target.closest('[data-world-edit-book]') && !event.target.closest('[data-world-delete-book]')) { activeBookId = bookButton.dataset.worldBook; render(); return; }
    const editBook = event.target.closest('[data-world-edit-book]');
    if (editBook) { const book = books().find(item => item.id === editBook.dataset.worldEditBook); if (book) { activeBookId = book.id; openEditor('book', book); } return; }
    const deleteBook = event.target.closest('[data-world-delete-book]');
    if (deleteBook) {
      const index = books().findIndex(item => item.id === deleteBook.dataset.worldDeleteBook);
      if (index >= 0 && window.confirm('确定删除这本世界书吗？其中的所有条目也会被删除。')) {
        const deletedId = books()[index].id;
        books().splice(index, 1);
        if (activeBookId === deletedId) activeBookId = books()[0]?.id || null;
        save(); render();
      }
      return;
    }
    if (event.target.closest('[data-world-add-book]')) { activeBookId = null; openEditor('book'); return; }
    if (event.target.closest('[data-world-add-entry]')) { document.querySelector('#worldEditorForm').dataset.entryId = ''; openEditor('entry'); return; }
    if (event.target.closest('[data-world-view-analysis]')) { const cached = activeBookId ? readJSON(analysisStorageKey, {})[activeBookId] : null; if (cached) { analysisBookId = activeBookId; analysisResult = cached; analysisOpen = true; selectedAnalysisNpc = ''; render(); } return; }
    if (event.target.closest('[data-world-analyze]')) { analyzeBook(); return; }
    const toggleEntry = event.target.closest('[data-world-toggle-entry]');
    if (toggleEntry) { const entry = activeBook()?.entries.find(item => item.id === toggleEntry.dataset.worldToggleEntry); if (entry) { entry.enabled = entry.enabled === false; save(); render(); } return; }
    const editEntry = event.target.closest('[data-world-edit-entry]');
    if (editEntry) { const entry = activeBook()?.entries.find(item => item.id === editEntry.dataset.worldEditEntry); if (entry) { document.querySelector('#worldEditorForm').dataset.entryId = entry.id; openEditor('entry', entry); } }
    const deleteEntry = event.target.closest('[data-world-delete-entry]');
    if (deleteEntry) {
      const book = activeBook();
      const index = book?.entries.findIndex(item => item.id === deleteEntry.dataset.worldDeleteEntry) ?? -1;
      if (book && index >= 0 && window.confirm('确定删除这个世界书条目吗？')) {
        book.entries.splice(index, 1);
        save(); render();
      }
      return;
    }
    if (event.target.closest('[data-world-editor-close]')) closeEditor();
    if (event.target.closest('[data-world-editor-save]')) saveEditor();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && app.classList.contains('is-open')) { if (document.querySelector('#worldEditor').classList.contains('is-open')) closeEditor(); else if (analysisOpen) { analysisOpen = false; render(); } else app.classList.remove('is-open'); } });
  window.addEventListener('ideal-worldbooks-updated', () => { syncStoredWorldbooks(); if (app.classList.contains('is-open')) render(); });
})();
