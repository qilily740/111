(() => {
  const folder = document.querySelector('[data-desktop-folder]');
  const shell = document.querySelector('[data-folder-app-shell]');
  const storageKey = 'ideal-machine-fanfic';
  const app = document.createElement('div');
  app.className = 'fanfic-app';
  app.setAttribute('aria-hidden', 'true');
  document.body.appendChild(app);

  let state = readState();
  let page = 'home';
  let activeId = '';
  let editingId = '';
  let busy = false;
  let styleNotice = '';
  let draft = blankDraft();

  function blankDraft() { return { title: '', background: '现代都市', backgroundDetail: '', characters: [], relationship: '初次相遇', plot: '一次意外的重逢', plotDetail: '', style: '自然细腻', styleContent: '', viewpoint: '第三人称', length: '短篇开篇', ending: '开放式', extra: '' }; }
  function normalizeStyle(item) { const content = typeof item === 'string' ? item.trim() : String(item?.content || '').trim(); const name = typeof item === 'string' ? content.slice(0, 30) || '未命名文风' : String(item?.name || '').trim() || content.slice(0, 30) || '未命名文风'; return { name, content }; }
  function readState() { try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); const styles = Array.isArray(value.styles) ? value.styles.map(normalizeStyle).filter((item, index, list) => list.findIndex(other => other.name === item.name) === index).slice(0, 40) : []; return { stories: Array.isArray(value.stories) ? value.stories.map(normalizeStory) : [], styles }; } catch { return { stories: [], styles: [] }; } }
  function normalizeStory(item) { return { ...item, settings: { ...blankDraft(), ...(item?.settings || {}) }, chapters: Array.isArray(item?.chapters) ? item.chapters : [] }; }
  function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function uid(prefix = 'story') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function now() { return new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function activeStory() { return state.stories.find(item => item.id === activeId); }

  function roleOptions() {
    const result = [];
    try { const chat = JSON.parse(localStorage.getItem('ideal-machine-chat') || '{}'); (chat.contacts || []).forEach(item => { if (item.id) result.push({ id: `contact:${item.id}`, name: item.nickname || item.name || '角色', type: 'character' }); }); } catch {}
    return result.filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);
  }
  function roleName(id) { return roleOptions().find(item => item.id === id)?.name || id; }
  function selectedRoles() { return draft.characters.map(item => `<span class="fanfic-character-chip">${esc(item.name)}<button data-fanfic-remove-role="${esc(item.id)}" type="button" aria-label="移除角色">×</button></span>`).join('') || '<em class="fanfic-empty-roles">还没有选择角色</em>'; }
  function characterPicker() { const chosen = new Set(draft.characters.map(item => item.id)); return `<select data-fanfic-character-picker aria-label="添加角色"><option value="">从角色资料中添加</option>${roleOptions().map(item => `<option value="${esc(item.id)}" ${chosen.has(item.id) ? 'disabled' : ''}>${esc(item.name)}</option>`).join('')}</select><button data-fanfic-custom-role type="button">＋ 自定义角色</button>`; }
  function optionList(options, selected) { return options.map(item => `<option value="${esc(item)}" ${selected === item ? 'selected' : ''}>${esc(item)}</option>`).join(''); }
  function styleOptions() { return [...new Set(['自然细腻', '轻松甜蜜', '克制暧昧', '强烈冲突', '悬疑压迫', '温柔治愈', ...(state.styles || []).map(item => item.name)])]; }
  function addStyleButton() { const titleCard = app.querySelector('.fanfic-title-card'); if (!titleCard || titleCard.querySelector('.fanfic-title-tools')) return; const saved = document.createElement('div'); saved.className = 'fanfic-saved-styles'; saved.innerHTML = state.styles?.length ? `<div><b>已保存的文风</b><small>点击名称即可重新使用</small></div><section>${state.styles.map((style, index) => `<button type="button" data-fanfic-select-style="${index}" class="${draft.style === style.name ? 'is-active' : ''}" title="${esc(style.content)}">${esc(style.name)}</button>`).join('')}</section>${styleNotice ? `<p>✓ ${esc(styleNotice)}</p>` : ''}` : '<div><b>还没有自定义文风</b><small>保存后会一直显示在这里</small></div>'; const tools = document.createElement('div'); tools.className = 'fanfic-title-tools'; tools.innerHTML = '<span>还想使用自己的文风？</span><button data-fanfic-add-style type="button">＋ 添加自定义文风</button>'; titleCard.prepend(tools); titleCard.prepend(saved); }
  function showStyleEditor() { const tools = app.querySelector('.fanfic-title-tools'); if (!tools || tools.querySelector('[data-fanfic-style-name-input]')) return; tools.classList.add('is-editing'); tools.innerHTML = '<label>文风名称<input data-fanfic-style-name-input type="text" maxlength="60" placeholder="例如：电影感悬疑"></label><label>文风具体内容<textarea data-fanfic-style-content-input rows="5" maxlength="1000" placeholder="详细描述节奏、语言、氛围、叙事方式、对话特点……"></textarea></label><div><button data-fanfic-save-style type="button">保存</button><button data-fanfic-cancel-style type="button">取消</button></div>'; tools.querySelector('[data-fanfic-style-name-input]')?.focus(); }
  function saveCustomStyle() { const nameInput = app.querySelector('[data-fanfic-style-name-input]'); const contentInput = app.querySelector('[data-fanfic-style-content-input]'); const name = nameInput?.value.trim(); const content = contentInput?.value.trim(); if (!name) { nameInput?.focus(); return; } if (!content) { contentInput?.focus(); return; } const style = { name: name.slice(0, 60), content: content.slice(0, 1000) }; state.styles = [...(state.styles || []).filter(item => item.name !== style.name), style].slice(-40); draft.style = style.name; draft.styleContent = style.content; styleNotice = `已保存并选中：${style.name}`; save(); render(); }
  function settingField(label, key, content) { return `<label class="fanfic-setting-field"><span>${label}</span>${content.replace('<FIELD>', `data-fanfic-setting="${key}"`)}</label>`; }

  function openApp() { state = readState(); page = 'home'; activeId = ''; editingId = ''; shell?.classList.remove('is-open'); shell?.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); app.classList.add('is-open'); app.setAttribute('aria-hidden', 'false'); render(); }
  function closeApp() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); }
  function backToFolder() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.add('is-open'); folder?.setAttribute('aria-hidden', 'false'); }

  function homePage() {
    const list = state.stories.slice().reverse().map(item => `<button class="fanfic-story-card" data-fanfic-open="${esc(item.id)}" type="button"><span class="fanfic-story-mark">${item.chapters.length ? '文' : '＋'}</span><span><b>${esc(item.title || item.settings.background)}</b><small>${esc(item.updatedAt || item.createdAt)} · ${item.chapters.length} 章 · ${esc(item.settings.background)}</small></span><i>›</i></button>`).join('');
    return `<section class="fanfic-page"><header class="fanfic-header"><button class="fanfic-header-back" data-fanfic-folder type="button" aria-label="返回文件夹">‹</button><div><span class="fanfic-kicker">STORY WORKSHOP</span><h1>同人文</h1><p>先决定故事的世界，再让它开始生长。</p></div><button class="fanfic-header-close" data-fanfic-close type="button" aria-label="关闭同人文">×</button></header><main class="fanfic-main"><section class="fanfic-hero"><div><span>CREATE YOUR STORY</span><h2>把喜欢的角色放进你选择的世界。</h2><p>背景、关系、主线和结局都由你决定，API 只负责按照设定写作。</p></div><button data-fanfic-new type="button"><i>＋</i><b>新建故事</b><small>自选全部设定</small></button></section><section class="fanfic-library"><div class="fanfic-section-head"><div><span>MY STORIES</span><h2>故事架</h2></div><b>${state.stories.length} 篇</b></div>${list || '<div class="fanfic-empty"><i>文</i><p>还没有故事<br>从选择一个背景开始。</p></div>'}</section></main></section>`;
  }

  function newPage() {
    const background = `<select <FIELD>>${optionList(['现代都市', '校园日常', '古代江湖', '架空宫廷', '末世生存', '科幻未来', '魔法世界', '娱乐圈'], draft.background)}</select>`;
    const relationship = `<select <FIELD>>${optionList(['初次相遇', '朋友以上', '欢喜冤家', '宿敌对手', '暗恋未明', '恋人日常', '师徒羁绊', '自定义关系'], draft.relationship)}</select>`;
    const plot = `<select <FIELD>>${optionList(['一次意外的重逢', '共同完成一件任务', '因为误会而分开', '秘密被意外发现', '雨夜留宿', '在陌生世界醒来', '自定义主线'], draft.plot)}</select>`;
    const style = `<select <FIELD>>${optionList(styleOptions(), draft.style)}</select>`;
    const viewpoint = `<select <FIELD>>${optionList(['第一人称', '第三人称', '双视角', '角色视角'], draft.viewpoint)}</select>`;
    const length = `<select <FIELD>>${optionList(['短篇开篇', '完整短篇', '连载第一章'], draft.length)}</select>`;
    const ending = `<select <FIELD>>${optionList(['开放式', '圆满结局', '遗憾结局', '多分支结局'], draft.ending)}</select>`;
    return `<section class="fanfic-page"><header class="fanfic-header"><button class="fanfic-header-back" data-fanfic-home type="button" aria-label="返回故事架">‹</button><div><span class="fanfic-kicker">STORY SETUP</span><h1>${editingId ? '编辑设定' : '新建故事'}</h1><p>所有选择都会保存到这篇故事里。</p></div><button class="fanfic-header-close" data-fanfic-close type="button" aria-label="关闭同人文">×</button></header><main class="fanfic-main"><section class="fanfic-setup-card"><div class="fanfic-setup-title"><span>01 · WORLD</span><h2>故事背景</h2><p>先选择故事发生的世界，也可以在下面补充你的版本。</p></div>${settingField('背景类型', 'background', background)}<label class="fanfic-setting-field"><span>背景补充</span><textarea data-fanfic-setting="backgroundDetail" placeholder="时代、地点、世界规则、氛围……">${esc(draft.backgroundDetail)}</textarea></label></section><section class="fanfic-setup-card"><div class="fanfic-setup-title"><span>02 · CAST</span><h2>出场角色</h2><p>可以选择已有角色，也可以临时添加一个新角色。</p></div><div class="fanfic-character-list">${selectedRoles()}</div><div class="fanfic-character-picker">${characterPicker()}</div></section><section class="fanfic-setup-card"><div class="fanfic-setup-title"><span>03 · STORY</span><h2>故事方向</h2></div>${settingField('人物关系', 'relationship', relationship)}${settingField('故事主线', 'plot', plot)}<label class="fanfic-setting-field"><span>主线补充</span><textarea data-fanfic-setting="plotDetail" placeholder="想发生的关键事件、冲突或名场面……">${esc(draft.plotDetail || '')}</textarea></label><div class="fanfic-setting-grid">${settingField('写作风格', 'style', style)}${settingField('叙事视角', 'viewpoint', viewpoint)}${settingField('故事长度', 'length', length)}${settingField('结局方向', 'ending', ending)}</div><label class="fanfic-setting-field"><span>额外要求</span><textarea data-fanfic-setting="extra" placeholder="例如：不要 OOC、保留角色口头禅、不要出现某种剧情……">${esc(draft.extra)}</textarea></label></section><section class="fanfic-setup-card fanfic-title-card"><label class="fanfic-setting-field"><span>故事标题（可选）</span><input data-fanfic-setting="title" value="${esc(draft.title)}" placeholder="留空让 API 帮你取名"></label></section><div class="fanfic-setup-actions"><button data-fanfic-save type="button">只保存设定</button><button class="fanfic-primary-action" data-fanfic-generate type="button" ${busy ? 'disabled' : ''}>${busy ? '生成中…' : '生成故事开篇'} <span>↑</span></button></div><p class="fanfic-local-note">故事设定、章节草稿和修改内容会保存在当前设备。</p></main></section>`;
  }

  function storySettings(story) { return `<div class="fanfic-setting-tags"><span>${esc(story.settings.background)}</span><span>${esc(story.settings.relationship)}</span><span>${esc(story.settings.style)}</span><span>${esc(story.settings.viewpoint)}</span></div><div class="fanfic-story-details"><p><b>背景补充</b>${esc(story.settings.backgroundDetail || '未补充')}</p><p><b>故事主线</b>${esc(story.settings.plot)}${story.settings.plotDetail ? ` · ${esc(story.settings.plotDetail)}` : ''}</p><p><b>文风具体内容</b>${esc(story.settings.styleContent || '使用名称对应的默认文风')}</p><p><b>结局方向</b>${esc(story.settings.ending)} · ${esc(story.settings.length)}</p>${story.settings.extra ? `<p><b>额外要求</b>${esc(story.settings.extra)}</p>` : ''}</div>`; }
  function chapterHtml(chapter, index) { return `<article class="fanfic-chapter"><div class="fanfic-chapter-head"><span>CHAPTER ${String(index + 1).padStart(2, '0')}</span><input data-fanfic-chapter-title="${esc(chapter.id)}" value="${esc(chapter.title || `第 ${index + 1} 章`)}" aria-label="章节标题"><small>${esc(chapter.updatedAt || chapter.createdAt || '')}</small></div><textarea data-fanfic-chapter-content="${esc(chapter.id)}" placeholder="写下这一章……">${esc(chapter.content || '')}</textarea><button data-fanfic-save-chapter="${esc(chapter.id)}" type="button">保存这一章</button></article>`; }
  function storyPage(story) { const chapters = story.chapters.map(chapterHtml).join(''); return `<section class="fanfic-page"><header class="fanfic-header"><button class="fanfic-header-back" data-fanfic-home type="button" aria-label="返回故事架">‹</button><div><span class="fanfic-kicker">YOUR STORY</span><h1>${esc(story.title || '未命名故事')}</h1><p>${esc(story.updatedAt || story.createdAt)} 更新 · ${story.chapters.length} 章</p></div><button class="fanfic-header-close" data-fanfic-close type="button" aria-label="关闭同人文">×</button></header><main class="fanfic-main"><section class="fanfic-story-settings"><div class="fanfic-story-settings-head"><div><span>STORY SETTINGS</span><h2>这篇故事的设定</h2></div><button data-fanfic-edit type="button">编辑设定</button></div><div class="fanfic-story-cast">${story.settings.characters.length ? story.settings.characters.map(item => `<span>${esc(item.name)}</span>`).join('') : '<em>未指定角色</em>'}</div>${storySettings(story)}</section><section class="fanfic-chapters"><div class="fanfic-section-head"><div><span>MANUSCRIPT</span><h2>章节草稿</h2></div><button data-fanfic-continue type="button" ${busy ? 'disabled' : ''}>${busy ? '续写中…' : 'API 续写下一章'}</button></div>${chapters || '<div class="fanfic-empty"><p>还没有章节，先点击下方生成开篇。</p></div>'}</section><button class="fanfic-add-chapter" data-fanfic-add-chapter type="button">＋ 添加空白章节</button></main></section>`; }
  function render() { const previousScrollTop = app.querySelector('.fanfic-page')?.scrollTop || 0; const story = activeStory(); app.innerHTML = page === 'home' ? homePage() : page === 'new' ? newPage() : story ? storyPage(story) : homePage(); if (page === 'new') addStyleButton(); const nextPage = app.querySelector('.fanfic-page'); if (nextPage) nextPage.scrollTop = previousScrollTop; }

  function collectDraft() { app.querySelectorAll('[data-fanfic-setting]').forEach(field => { draft[field.dataset.fanficSetting] = field.value; }); return draft; }
  function saveStory(withOpening = false, generated = {}) { collectDraft(); const settings = JSON.parse(JSON.stringify(draft)); const existing = editingId ? activeStory() : null; const story = existing || normalizeStory({ id: uid(), createdAt: now(), chapters: [] }); story.title = generated.title || settings.title || '未命名故事'; story.settings = settings; story.updatedAt = now(); if (generated.opening) story.chapters.push({ id: uid('chapter'), title: generated.chapterTitle || '第一章', content: generated.opening, createdAt: now(), updatedAt: now() }); if (!existing) state.stories.push(story); save(); activeId = story.id; editingId = ''; page = withOpening || existing ? 'story' : 'home'; render(); }

  async function generateOpening() {
    if (busy) return;
    collectDraft();
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('fanfic') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置同人文 API 模型。');
    busy = true; render();
    try {
      const prompt = `请根据以下完整设定创作同人文开篇。只返回合法 JSON，不要 Markdown，格式为：{"title":"故事标题","chapterTitle":"章节标题","opening":"正文"}。正文要有画面、人物行动和对话，不要解释创作过程，不要擅自改变背景、人物关系或叙事视角。\n背景：${draft.background}\n背景补充：${draft.backgroundDetail || '无'}\n角色：${draft.characters.map(item => item.name).join('、') || '未指定角色'}\n人物关系：${draft.relationship}\n故事主线：${draft.plot}\n主线补充：${draft.plotDetail || '无'}\n文风名称：${draft.style}\n文风具体内容：${draft.styleContent || '使用名称对应的默认文风'}\n叙事视角：${draft.viewpoint}\n故事长度：${draft.length}\n结局方向：${draft.ending}\n额外要求：${draft.extra || '无'}`;
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: .92, messages: [{ role: 'system', content: '你是严格遵循用户设定的同人文创作助手，只返回合法 JSON。' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const raw = String(payload.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim();
      let result; try { result = JSON.parse(raw); } catch { result = { title: draft.title, opening: raw }; }
      if (!result.opening) throw new Error('API 没有返回正文');
      saveStory(true, { title: String(result.title || draft.title || '未命名故事').trim(), chapterTitle: String(result.chapterTitle || '第一章').trim(), opening: String(result.opening).trim() });
    } catch (error) { window.alert(`同人文生成失败：${error.message}`); } finally { busy = false; if (app.classList.contains('is-open')) render(); }
  }

  async function continueStory() {
    const story = activeStory();
    if (!story || busy) return;
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('fanfic') || window.IdealMachineAPI?.getModel?.('chat');
    if (!config.endpoint || !config.key || !model) return window.alert('请先在设置中配置同人文 API 模型。');
    busy = true; render();
    try {
      const last = story.chapters.at(-1)?.content || '';
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: .9, messages: [{ role: 'system', content: '你是同人文续写助手，只返回合法 JSON。' }, { role: 'user', content: `沿用以下故事设定续写下一章，只返回：{"chapterTitle":"章节标题","content":"正文"}。保持角色性格、人物关系、叙事视角和文风，不要总结上一章。\n故事设定：${JSON.stringify(story.settings)}\n上一章：${last}` }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json(); const raw = String(payload.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim(); let result; try { result = JSON.parse(raw); } catch { result = { chapterTitle: `第 ${story.chapters.length + 1} 章`, content: raw }; }
      if (!result.content) throw new Error('API 没有返回正文');
      story.chapters.push({ id: uid('chapter'), title: result.chapterTitle || `第 ${story.chapters.length + 1} 章`, content: result.content, createdAt: now(), updatedAt: now() }); story.updatedAt = now(); save();
    } catch (error) { window.alert(`续写失败：${error.message}`); } finally { busy = false; render(); }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-folder-app="fanfic"]')) { openApp(); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-fanfic-close]')) { closeApp(); return; }
    if (event.target.closest('[data-fanfic-folder]')) { backToFolder(); return; }
    if (event.target.closest('[data-fanfic-new]')) { draft = blankDraft(); editingId = ''; styleNotice = ''; page = 'new'; render(); return; }
    if (event.target.closest('[data-fanfic-home]')) { page = 'home'; activeId = ''; editingId = ''; render(); return; }
    const opened = event.target.closest('[data-fanfic-open]');
    if (opened) { activeId = opened.dataset.fanficOpen; page = 'story'; render(); return; }
    if (event.target.closest('[data-fanfic-save]')) { saveStory(false); return; }
    if (event.target.closest('[data-fanfic-generate]')) { generateOpening(); return; }
    if (event.target.closest('[data-fanfic-edit]')) { const story = activeStory(); if (story) { draft = JSON.parse(JSON.stringify(story.settings)); editingId = story.id; styleNotice = ''; page = 'new'; render(); } return; }
    if (event.target.closest('[data-fanfic-continue]')) { continueStory(); return; }
    const addChapter = event.target.closest('[data-fanfic-add-chapter]');
    if (addChapter) { const story = activeStory(); if (story) { story.chapters.push({ id: uid('chapter'), title: `第 ${story.chapters.length + 1} 章`, content: '', createdAt: now(), updatedAt: now() }); story.updatedAt = now(); save(); render(); } return; }
    const saveChapter = event.target.closest('[data-fanfic-save-chapter]');
    if (saveChapter) { const story = activeStory(); const chapter = story?.chapters.find(item => item.id === saveChapter.dataset.fanficSaveChapter); if (chapter) { chapter.title = app.querySelector(`[data-fanfic-chapter-title="${CSS.escape(chapter.id)}"]`)?.value.trim() || chapter.title; chapter.content = app.querySelector(`[data-fanfic-chapter-content="${CSS.escape(chapter.id)}"]`)?.value || ''; chapter.updatedAt = now(); story.updatedAt = now(); save(); render(); } return; }
    const removeRole = event.target.closest('[data-fanfic-remove-role]');
    if (removeRole) { draft.characters = draft.characters.filter(item => item.id !== removeRole.dataset.fanficRemoveRole); render(); return; }
    if (event.target.closest('[data-fanfic-add-style]')) { showStyleEditor(); return; }
    if (event.target.closest('[data-fanfic-save-style]')) { saveCustomStyle(); return; }
    if (event.target.closest('[data-fanfic-cancel-style]')) { render(); return; }
    const savedStyle = event.target.closest('[data-fanfic-select-style]');
    if (savedStyle) { const style = state.styles?.[Number(savedStyle.dataset.fanficSelectStyle)]; if (style) { draft.style = style.name; draft.styleContent = style.content; styleNotice = `已选择：${style.name}`; render(); } return; }
    if (event.target.closest('[data-fanfic-custom-role]')) { const name = window.prompt('输入角色名称'); if (name?.trim()) { draft.characters.push({ id: uid('custom-role'), name: name.trim(), type: 'character' }); render(); } }
  });
  document.addEventListener('change', event => { if (!app.classList.contains('is-open')) return; if (event.target.matches('[data-fanfic-character-picker]')) { const item = roleOptions().find(role => role.id === event.target.value); if (item) draft.characters.push({ ...item }); render(); return; } if (event.target.matches('[data-fanfic-setting="style"]')) { const style = state.styles?.find(item => item.name === event.target.value); draft.style = event.target.value; draft.styleContent = style?.content || ''; styleNotice = style ? `已选择：${style.name}` : ''; render(); } });
  document.addEventListener('input', event => { if (event.target.matches('[data-fanfic-setting]')) draft[event.target.dataset.fanficSetting] = event.target.value; });
  document.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('[data-fanfic-style-name-input]')) { event.preventDefault(); saveCustomStyle(); return; } if (event.key === 'Escape' && app.classList.contains('is-open')) closeApp(); });
})();
