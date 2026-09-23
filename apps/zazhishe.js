(() => {
  const storageKey = 'ideal-machine-magazine';
  const folder = document.querySelector('[data-desktop-folder]');
  const shell = document.querySelector('[data-folder-app-shell]');
  const app = document.createElement('div');
  app.className = 'magazine-app';
  app.setAttribute('aria-hidden', 'true');
  document.body.appendChild(app);
  window.IdealMachineWallpaperTone?.watch?.(app);

  let state = readState();
  let openedFromCreativeFolder = false;
  let page = 'home';
  let activeId = '';
  let activeTab = 'plan';
  let activeInterviewRole = '';
  let busy = '';
  let previewIndex = 0;
  let previewTurnDirection = 1;
  let homeIssueIndex = 0;
  let homeSearchOpen = false;
  let homeSearchQuery = '';
  let homeScrollTop = 0;
  let homeIndexScrollLeft = 0;
  let magazineDockCollapsed = false;
  let magazineDockPosition = null;
  let magazineDockDrag = null;
  let suppressMagazineDockExpand = false;
  let newDraft = blankDraft();

  function blankDraft() { return { title: '', theme: '', edition: 'VOL. 01', direction: '人物与生活', participantIds: [] }; }
  function uid(prefix = 'mag') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function now() { return new Date().toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function chatRoles() { try { const chat = JSON.parse(localStorage.getItem('ideal-machine-chat') || '{}'); return (chat.contacts || []).filter(item => item && !item.isGroup).map(item => ({ id:item.id, name:item.name || item.nickname || '角色', nickname:item.nickname || '', realName:item.name || item.nickname || '', avatar:item.avatar || '', persona:item.details || item.signature || '', identity:item.identity || '', birthday:item.birthday || '', gender:item.gender || '', worldbook:item.worldbook || '' })).filter(item => item.id); } catch { return []; } }
  function roleFrom(issue, id) { const saved = issue?.participants?.find(item => item.id === id) || {}; const live = chatRoles().find(item => item.id === id) || {}; return { ...saved, ...live, name:live.name || saved.realName || saved.name || '角色', realName:live.realName || saved.realName || saved.name || '' }; }
  function avatarMarkup(role) { return role?.avatar ? `<img data-magazine-asset="${esc(role.avatar)}" alt="">` : esc((role?.name || '角').slice(0,1)); }
  function normalizeIssue(item) {
    return {
      id: item?.id || uid('issue'), title: item?.title || '未命名刊物', theme: item?.theme || '', edition: item?.edition || 'VOL. 01', direction: item?.direction || '人物与生活', status: item?.status || '编辑中', createdAt: item?.createdAt || now(), updatedAt: item?.updatedAt || now(), publishedAt: item?.publishedAt || '',
      participants: Array.isArray(item?.participants) ? item.participants.filter(participant => { try { const chat = JSON.parse(localStorage.getItem('ideal-machine-chat') || '{}'); const contact = (chat.contacts || []).find(entry => entry.id === participant?.id); return !contact?.isGroup; } catch { return true; } }) : [],
      sections: Array.isArray(item?.sections) ? item.sections : [],
      interviews: Array.isArray(item?.interviews) ? item.interviews.map(session => ({ ...session, turns:Array.isArray(session.turns) ? session.turns : [] })) : [],
      articles: Array.isArray(item?.articles) ? item.articles : [],
      cover: { kicker:'IDEAL MAGAZINE', headline:item?.title || '未命名刊物', subhead:item?.theme || '记录人物、关系与正在发生的生活', color:'#d7c8bd', ink:'#241f1c', image:'', ...(item?.cover || {}) }
    };
  }
  function readState() { try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return { issues:Array.isArray(value.issues) ? value.issues.map(normalizeIssue) : [] }; } catch { return { issues:[] }; } }
  function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function activeIssue() { return state.issues.find(item => item.id === activeId); }
  function sectionArticle(issue, sectionId) { return issue.articles.find(item => item.sectionId === sectionId); }

  function openApp(fromCreativeFolder = false) { openedFromCreativeFolder = Boolean(fromCreativeFolder); state = readState(); page = 'home'; activeId = ''; activeTab = 'plan'; homeIssueIndex = 0; homeSearchOpen = false; homeSearchQuery = ''; homeScrollTop = 0; homeIndexScrollLeft = 0; magazineDockCollapsed = false; shell?.classList.remove('is-open'); shell?.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); app.classList.add('is-open'); app.setAttribute('aria-hidden', 'false'); render(); }
  function closeApp() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); }
  function backFolder() { app.classList.remove('is-open'); app.setAttribute('aria-hidden', 'true'); if (openedFromCreativeFolder) { folder?.classList.add('is-open'); folder?.setAttribute('aria-hidden', 'false'); } else { folder?.classList.remove('is-open'); folder?.setAttribute('aria-hidden', 'true'); } }

  function header(kicker, title, subtitle, back = 'data-magazine-home') {
    return `<header class="magazine-header"><button ${back} class="magazine-round-button" type="button" aria-label="返回">‹</button><div><span>${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><button data-magazine-close class="magazine-round-button" type="button" aria-label="关闭杂志社">×</button></header>`;
  }
  function coverImage(issue, className = '') { return issue.cover.image ? `<img class="${className}" data-magazine-asset="${esc(issue.cover.image)}" alt="${esc(issue.title)}封面图片">` : ''; }
  function coverMarkup(issue, compact = false) {
    return `<div class="magazine-cover ${compact ? 'is-compact' : ''}" style="--mag-cover:${esc(issue.cover.color)};--mag-ink:${esc(issue.cover.ink)}">${coverImage(issue, 'magazine-cover-image')}<div class="magazine-cover-shade"></div><div class="magazine-cover-copy"><span>${esc(issue.cover.kicker)}</span><small>${esc(issue.edition)}</small><h2>${esc(issue.cover.headline || issue.title)}</h2><p>${esc(issue.cover.subhead || issue.theme)}</p></div></div>`;
  }

  function homeIcon(type) {
    const paths = {
      search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
      bell:'<path d="M7 17h10l-1.2-2.1V10a3.8 3.8 0 0 0-7.6 0v4.9z"/><path d="M10 20h4"/>',
      more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      close:'<path d="M6 6l12 12M18 6 6 18"/>',
      home:'<path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4z"/>',
      topics:'<path d="M4 5.5c3-.8 5.7-.3 8 1.5v13c-2.3-1.8-5-2.3-8-1.5zm16 0c-3-.8-5.7-.3-8 1.5v13c2.3-1.8 5-2.3 8-1.5z"/>',
      write:'<path d="M5 19c4-1 8-4 10-8l3-6 1 1-4 7c-2 3-5 5-9 6z"/><path d="m9 15 3 3"/>',
      drafts:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4.2 3.3-6.5 8-6.5s7.3 2.3 8 6.5"/>',
      publish:'<path d="M5 20h14"/><path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/>',
      arrow:'<path d="m9 5 7 7-7 7"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type] || ''}</svg>`;
  }
  function magazineDockMarkup() {
    if (magazineDockCollapsed) { const position = magazineDockPosition ? ` style="left:${magazineDockPosition.x}px;top:${magazineDockPosition.y}px;right:auto;bottom:auto"` : ''; return `<button class="magazine-dock-orb" data-magazine-dock-expand type="button" aria-label="展开导航栏"${position}>${homeIcon('more')}</button>`; }
    const selected = page === 'home' ? 'home' : page === 'preview' ? 'design' : activeTab;
    return `<nav class="magazine-home-dock" aria-label="杂志社导航"><button class="${selected === 'home' ? 'is-active' : ''}" data-magazine-home-nav="home" type="button">${homeIcon('home')}<span>首页</span></button><button class="${selected === 'plan' ? 'is-active' : ''}" data-magazine-home-jump="plan" type="button">${homeIcon('topics')}<span>选题</span></button><button class="${selected === 'interview' ? 'is-active' : ''}" data-magazine-home-jump="interview" type="button">${homeIcon('write')}<span>写作</span></button><button class="${selected === 'articles' ? 'is-active' : ''}" data-magazine-home-jump="articles" type="button">${homeIcon('drafts')}<span>稿件</span></button><button class="${selected === 'design' ? 'is-active' : ''}" data-magazine-home-jump="design" type="button">${homeIcon('publish')}<span>发布</span></button></nav>`;
  }
  function issueDateLabel(issue) {
    const raw = String(issue.publishedAt || issue.updatedAt || issue.createdAt || '');
    const match = raw.match(/(\d{1,2})[\/月-](\d{1,2})/);
    if (!match) return raw || '未记录日期';
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${months[Math.max(0, Math.min(11, Number(match[1]) - 1))]}. ${String(Number(match[2])).padStart(2, '0')}`;
  }
  function issueProgress(issue) {
    if (issue.status === '已发布') return 100;
    const sections = issue.sections.length;
    const articleRatio = sections ? Math.min(1, issue.articles.length / sections) : 0;
    const progress = (sections ? .25 : 0) + articleRatio * .35 + (issue.interviews.some(item => item.turns?.length) ? .15 : 0) + (issue.cover.image ? .25 : 0);
    return Math.max(0, Math.min(99, Math.round(progress * 100)));
  }
  function homeIssueStatus(issue) {
    if (issue.status === '已发布') return '已发布';
    if (issue.articles.length) return '编辑中';
    if (issue.sections.length) return '策划中';
    return '草稿';
  }
  function homeDeskCounts(issues) {
    return {
      interview:issues.reduce((sum, issue) => sum + issue.participants.filter(person => !issue.interviews.some(session => session.roleId === person.id && session.turns?.some(turn => turn.role === 'role'))).length, 0),
      writing:issues.reduce((sum, issue) => sum + issue.sections.filter(section => !sectionArticle(issue, section.id)).length, 0),
      review:issues.reduce((sum, issue) => sum + (issue.status === '已发布' ? 0 : issue.articles.length), 0),
      cover:issues.filter(issue => issue.status !== '已发布' && !issue.cover.image).length
    };
  }
  function syncMagazineHomeSearch() {
    if (page !== 'home') return;
    const query = homeSearchQuery.trim().toLocaleLowerCase();
    let visible = 0;
    app.querySelectorAll('[data-magazine-home-search-text]').forEach(card => { const match = !query || card.dataset.magazineHomeSearchText.includes(query); card.hidden = !match; if (match) visible += 1; });
    const empty = app.querySelector('[data-magazine-home-search-empty]');
    if (empty) empty.hidden = visible > 0 || !query;
  }
  function homePage() {
    const issues = state.issues.slice().reverse();
    homeIssueIndex = issues.length ? Math.max(0, Math.min(homeIssueIndex, issues.length - 1)) : 0;
    const issue = issues[homeIssueIndex] || null;
    const total = issues.length;
    const number = value => String(value).padStart(2, '0');
    const desk = homeDeskCounts(issues);
    const current = issue ? `<section class="magazine-home-current"><div class="magazine-home-section-title"><span>CURRENT ISSUE</span><i></i><div><button data-magazine-home-cycle="prev" type="button" aria-label="上一期">‹</button><b>${number(homeIssueIndex + 1)}</b><em>/</em><small>${number(total)}</small><button data-magazine-home-cycle="next" type="button" aria-label="下一期">›</button></div></div><div class="magazine-home-current-copy"><h2>${esc(issue.title)}</h2><strong>${esc(issue.edition)} <i>·</i> ${esc(issueDateLabel(issue))}</strong><p>${esc(issue.theme || issue.direction || '尚未填写本期主题。')}</p><div class="magazine-home-progress"><b>编辑进度</b><i><span style="width:${issueProgress(issue)}%"></span></i><strong>${issueProgress(issue)}%</strong></div><div class="magazine-home-metrics"><span><b>${number(issue.sections.length)}</b><small>选题</small></span><span><b>${number(issue.articles.length)}</b><small>稿件</small></span><span><b>${number(issue.status === '已发布' ? 0 : issue.articles.length)}</b><small>待审</small></span><span><b>${number(issue.cover.image ? 1 : 0)}</b><small>封面</small></span></div><button class="magazine-home-enter" data-magazine-open="${esc(issue.id)}" type="button">进入本期编辑 ${homeIcon('arrow')}</button></div><button class="magazine-home-cover-button" data-magazine-open="${esc(issue.id)}" type="button" aria-label="打开${esc(issue.title)}">${coverMarkup(issue, true)}</button></section>` : `<section class="magazine-home-empty"><span>CURRENT ISSUE</span><h2>还没有正在制作的刊物</h2><p>从一个主题开始，建立你的第一期杂志。</p><button data-magazine-new type="button">＋ 新建刊物</button></section>`;
    const query = homeSearchQuery.trim().toLocaleLowerCase();
    const cards = issues.map((item, index) => { const searchText = `${item.title} ${item.theme} ${item.edition} ${item.direction} ${item.status}`.toLocaleLowerCase(); const hidden = query && !searchText.includes(query); return `<button class="magazine-home-issue-card ${index === homeIssueIndex ? 'is-current' : ''}" data-magazine-home-select="${esc(item.id)}" data-magazine-home-search-text="${esc(searchText)}" type="button" ${hidden ? 'hidden' : ''}><span class="magazine-home-index-cover">${coverMarkup(item, true)}</span><b>${number(index + 1)}</b><strong>${esc(item.title)}</strong><small>${esc(issueDateLabel(item))}</small><em class="is-${item.status === '已发布' ? 'published' : 'editing'}">${homeIssueStatus(item)}</em></button>`; }).join('');
    const search = homeSearchOpen ? `<div class="magazine-home-search"><span>${homeIcon('search')}</span><input data-magazine-home-search-input value="${esc(homeSearchQuery)}" placeholder="搜索刊物" autocomplete="off"><button data-magazine-home-search-close type="button" aria-label="关闭搜索">×</button></div>` : '';
    return `<section class="magazine-page magazine-home-page"><header class="magazine-home-header"><div class="magazine-home-brand"><div><span>EDITORIAL<br>STUDIO</span><i></i><span>MAGAZINE<br>PEOPLE / STORY / WORLD</span></div><h1>杂志社</h1><p>采访角色，编辑稿件，<br>再把一期刊物真正做完。</p></div><div class="magazine-home-actions"><button data-magazine-home-search-toggle type="button" aria-label="搜索">${homeIcon('search')}</button><button data-magazine-close type="button" aria-label="关闭杂志社">${homeIcon('close')}</button></div><blockquote>「在文字的缝隙里，<br>看见另一个世界。」<span>—</span><small>WRITE<br>ANOTHER WORLD.</small></blockquote></header>${search}<main class="magazine-home-main">${magazineBackgroundBanner()}${current}<section class="magazine-home-desk" data-magazine-home-desk><div class="magazine-home-section-title"><span>EDITORIAL DESK</span><i></i><small>真实工作进度</small></div><div><button data-magazine-home-jump="interview" type="button"><b>${number(desk.interview)}</b><span>待采访</span><small>INTERVIEW</small></button><button data-magazine-home-jump="articles" type="button"><b>${number(desk.writing)}</b><span>写作中</span><small>WRITING</small></button><button data-magazine-home-jump="articles" type="button"><b>${number(desk.review)}</b><span>待审稿</span><small>REVIEW</small></button><button data-magazine-home-jump="design" type="button"><b>${number(desk.cover)}</b><span>等待封面</span><small>COVER</small></button></div></section><section class="magazine-home-index"><div class="magazine-home-section-title"><span>ISSUE INDEX</span><i></i><small>ALL →</small></div><div class="magazine-home-index-list">${cards}<button class="magazine-home-new-issue" data-magazine-new type="button"><i>＋</i><b>${number(total + 1)}</b><span>下一期</span><small>尚未命名</small></button></div><p data-magazine-home-search-empty ${query && !issues.some(item => `${item.title} ${item.theme} ${item.edition} ${item.direction} ${item.status}`.toLocaleLowerCase().includes(query)) ? '' : 'hidden'}>没有找到相关刊物。</p></section></main><nav class="magazine-home-dock"><button class="is-active" data-magazine-home-nav="home" type="button">${homeIcon('home')}<span>首页</span></button><button data-magazine-home-jump="plan" type="button">${homeIcon('topics')}<span>选题</span></button><button data-magazine-home-jump="interview" type="button">${homeIcon('write')}<span>写作</span></button><button data-magazine-home-jump="articles" type="button">${homeIcon('drafts')}<span>稿件</span></button><button data-magazine-home-jump="design" type="button">${homeIcon('publish')}<span>发布</span></button></nav></section>`;
  }

  function roleChoices(selectedIds = [], mode = 'new') {
    const selected = new Set(selectedIds);
    const roles = chatRoles();
    const attribute = mode === 'issue' ? 'data-magazine-issue-role' : 'data-magazine-new-role';
    return roles.length ? roles.map(role => `<label class="magazine-role-choice"><input ${attribute}="${esc(role.id)}" type="checkbox" ${selected.has(role.id) ? 'checked' : ''}><span class="magazine-role-avatar">${avatarMarkup(role)}</span><span><b>${esc(role.name)}</b><small>${esc(role.identity || role.nickname || '受访者')}</small></span></label>`).join('') : '<p class="magazine-no-roles">聊天 App 里还没有角色，可以先创建角色后再来采访。</p>';
  }
  function newPage() {
    return `<section class="magazine-page">${header('NEW PUBLICATION', '创办新刊', '确定这一期的主题和参与人物。')}<main class="magazine-main"><section class="magazine-form-card"><div class="magazine-number">01</div><div class="magazine-form-title"><span>PUBLICATION</span><h2>刊物设定</h2></div><label>刊物名称<input data-magazine-new-field="title" value="${esc(newDraft.title)}" placeholder="例如：未眠时刻"></label><label>本期主题<textarea data-magazine-new-field="theme" placeholder="这一期想记录、追问或讨论什么？">${esc(newDraft.theme)}</textarea></label><div class="magazine-form-grid"><label>刊号<input data-magazine-new-field="edition" value="${esc(newDraft.edition)}"></label><label>内容方向<select data-magazine-new-field="direction"><option ${newDraft.direction === '人物与生活' ? 'selected' : ''}>人物与生活</option><option ${newDraft.direction === '关系观察' ? 'selected' : ''}>关系观察</option><option ${newDraft.direction === '文化与潮流' ? 'selected' : ''}>文化与潮流</option><option ${newDraft.direction === '故事与世界' ? 'selected' : ''}>故事与世界</option><option ${newDraft.direction === '自由主题' ? 'selected' : ''}>自由主题</option></select></label></div></section><section class="magazine-form-card"><div class="magazine-number">02</div><div class="magazine-form-title"><span>CAST</span><h2>本期参与人物</h2><p>这些角色可以接受采访，也能成为稿件中的人物。</p></div><div class="magazine-role-grid">${roleChoices(newDraft.participantIds)}</div></section><button class="magazine-create-button" data-magazine-create type="button">建立本期编辑部 <span>›</span></button></main></section>`;
  }

  function studioNav() { return `<nav class="magazine-tabs"><button data-magazine-tab="plan" class="${activeTab === 'plan' ? 'is-active' : ''}" type="button"><i>01</i><span>策划</span></button><button data-magazine-tab="interview" class="${activeTab === 'interview' ? 'is-active' : ''}" type="button"><i>02</i><span>采访</span></button><button data-magazine-tab="articles" class="${activeTab === 'articles' ? 'is-active' : ''}" type="button"><i>03</i><span>稿件</span></button><button data-magazine-tab="design" class="${activeTab === 'design' ? 'is-active' : ''}" type="button"><i>04</i><span>封面</span></button></nav>`; }
  function studioGuide() {
    const steps = [{ id:'plan', number:'01', title:'策划', hint:'先定主题和栏目' }, { id:'interview', number:'02', title:'采访', hint:'向人物提出问题' }, { id:'articles', number:'03', title:'稿件', hint:'生成并修改初稿' }, { id:'design', number:'04', title:'封面', hint:'完成整刊发布' }];
    return `<section class="magazine-process-guide"><div class="magazine-process-copy"><span>HOW TO MAKE AN ISSUE</span><b>跟着四步，把一本杂志做出来</b><small>不用一次完成，内容会自动保存。</small></div><ol>${steps.map(step => `<li class="${activeTab === step.id ? 'is-active' : activeTab === 'plan' && step.id !== 'plan' && !activeIssue()?.sections.length ? 'is-next' : ''}"><button data-magazine-tab="${step.id}" type="button"><i>${step.number}</i><span><b>${step.title}</b><small>${step.hint}</small></span></button></li>`).join('')}</ol></section>`;
  }
  function studioPage(issue) { return `<section class="magazine-page">${header(issue.edition, issue.title, `${issue.status} · ${issue.participants.length} 位参与人物 · ${issue.articles.length} 篇稿件`)}<main class="magazine-main magazine-studio-main">${studioGuide()}${activeTab === 'plan' ? planPanel(issue) : activeTab === 'interview' ? interviewPanel(issue) : activeTab === 'articles' ? articlesPanel(issue) : designPanel(issue)}</main></section>`; }

  function participantChips(issue) { return issue.participants.length ? issue.participants.map(role => { const person = roleFrom(issue, role.id); return `<span>${esc(person.name)}</span>`; }).join('') : '<em>尚未选择人物</em>'; }
  function sectionCard(issue, section, index) {
    const article = sectionArticle(issue, section.id);
    return `<article class="magazine-section-card"><span>${String(index + 1).padStart(2,'0')}</span><div><select data-magazine-section-type="${esc(section.id)}"><option ${section.type === '封面故事' ? 'selected' : ''}>封面故事</option><option ${section.type === '人物采访' ? 'selected' : ''}>人物采访</option><option ${section.type === '专题文章' ? 'selected' : ''}>专题文章</option><option ${section.type === '图片故事' ? 'selected' : ''}>图片故事</option><option ${section.type === '短栏' ? 'selected' : ''}>短栏</option></select><input data-magazine-section-title="${esc(section.id)}" value="${esc(section.title)}" placeholder="栏目标题"><textarea data-magazine-section-pitch="${esc(section.id)}" placeholder="栏目角度与内容说明">${esc(section.pitch || '')}</textarea></div><aside><b>${article ? '已有稿件' : '待写作'}</b><button data-magazine-section-draft="${esc(section.id)}" type="button" ${busy ? 'disabled' : ''}>${article ? '重新生成' : '生成初稿'}</button><button data-magazine-section-delete="${esc(section.id)}" type="button">删除</button></aside></article>`;
  }
  function planPanel(issue) {
    return `<section class="magazine-panel"><div class="magazine-panel-head"><div><span>EDITORIAL PLAN</span><h2>本期策划案</h2><p>先把主题拆成可以采访和写作的栏目。</p></div><button data-magazine-generate-plan type="button" ${busy ? 'disabled' : ''}>${busy === 'plan' ? '策划中…' : 'API 生成选题'}</button></div><section class="magazine-overview"><label>刊物名称<input data-magazine-issue-field="title" value="${esc(issue.title)}"></label><label>本期主题<textarea data-magazine-issue-field="theme">${esc(issue.theme)}</textarea></label><div><label>刊号<input data-magazine-issue-field="edition" value="${esc(issue.edition)}"></label><label>内容方向<select data-magazine-issue-field="direction"><option ${issue.direction === '人物与生活' ? 'selected' : ''}>人物与生活</option><option ${issue.direction === '关系观察' ? 'selected' : ''}>关系观察</option><option ${issue.direction === '文化与潮流' ? 'selected' : ''}>文化与潮流</option><option ${issue.direction === '故事与世界' ? 'selected' : ''}>故事与世界</option><option ${issue.direction === '自由主题' ? 'selected' : ''}>自由主题</option></select></label></div><div class="magazine-participant-chips"><b>本期人物</b>${participantChips(issue)}</div><details class="magazine-participant-manager"><summary>管理本期人物</summary><div class="magazine-role-grid">${roleChoices(issue.participants.map(item => item.id), 'issue')}</div></details></section><div class="magazine-section-list">${issue.sections.map((section,index) => sectionCard(issue,section,index)).join('') || '<div class="magazine-empty-small">还没有栏目，可以手动添加或让 API 生成选题。</div>'}</div><button class="magazine-add-section" data-magazine-add-section type="button">＋ 添加一个栏目</button></section>`;
  }

  function ensureInterview(issue, roleId) { let session = issue.interviews.find(item => item.roleId === roleId); if (!session) { session = { id:uid('interview'), roleId, createdAt:now(), turns:[] }; issue.interviews.push(session); save(); } return session; }
  function interviewPanel(issue) {
    if (!activeInterviewRole && issue.participants[0]) activeInterviewRole = issue.participants[0].id;
    const session = activeInterviewRole ? ensureInterview(issue, activeInterviewRole) : null;
    const role = roleFrom(issue, activeInterviewRole);
    const roleTabs = issue.participants.map(item => `<button data-magazine-interview-role="${esc(item.id)}" class="${item.id === activeInterviewRole ? 'is-active' : ''}" type="button"><span>${avatarMarkup(item)}</span><b>${esc(item.name)}</b><small>${issue.interviews.find(session => session.roleId === item.id)?.turns.length || 0} 条记录</small></button>`).join('');
    const turns = session?.turns.map(turn => `<article class="magazine-interview-turn ${turn.role === 'editor' ? 'is-editor' : 'is-role'}"><span>${turn.role === 'editor' ? '主编' : esc(role?.name || '受访者')}</span><p>${esc(turn.text)}</p><small>${esc(turn.time)}</small></article>`).join('') || '';
    return `<section class="magazine-panel"><div class="magazine-panel-head"><div><span>INTERVIEW ROOM</span><h2>人物采访</h2><p>逐题追问，完整采访会一直保留。</p></div>${session?.turns.length ? '<button data-magazine-interview-to-article type="button">整理为稿件</button>' : ''}</div>${issue.participants.length ? `<div class="magazine-interview-layout"><aside class="magazine-interview-roles">${roleTabs}</aside><section class="magazine-interview-room"><header><span>${avatarMarkup(role)}</span><div><b>${esc(role?.name || '选择受访者')}</b><small>${esc(role?.persona || '等待开始采访')}</small></div></header><main>${turns || '<div class="magazine-interview-empty">从一个真正想知道的问题开始。角色会按照自己的设定回答，而不是替你写整篇文章。</div>'}</main><form data-magazine-interview-form><textarea data-magazine-question placeholder="向受访者提出问题…" ${busy ? 'disabled' : ''}></textarea><button type="submit" ${busy ? 'disabled' : ''}>${busy === 'interview' ? '回答中…' : '发送问题'}</button></form></section></div>` : '<div class="magazine-empty-small">这一期还没有参与角色，请回到策划页添加本期人物。</div>'}</section>`;
  }

  function articleEditor(article) {
    return `<article class="magazine-article-editor"><header><span>${esc(article.type || 'FEATURE')}</span><input data-magazine-article-title="${esc(article.id)}" value="${esc(article.title)}" placeholder="稿件标题"><button data-magazine-article-delete="${esc(article.id)}" type="button">删除</button></header><input class="magazine-article-deck" data-magazine-article-deck="${esc(article.id)}" value="${esc(article.deck || '')}" placeholder="导语或副标题"><textarea data-magazine-article-content="${esc(article.id)}" placeholder="在这里编辑正文…">${esc(article.content || '')}</textarea><footer><small>${esc(article.updatedAt || article.createdAt)} · ${article.content?.length || 0} 字</small><button data-magazine-article-save="${esc(article.id)}" type="button">保存稿件</button></footer></article>`;
  }
  function articlesPanel(issue) {
    const pending = issue.sections.filter(section => !sectionArticle(issue,section.id)).map(section => `<button data-magazine-section-draft="${esc(section.id)}" type="button"><span>${esc(section.type)}</span><b>${esc(section.title)}</b><small>生成这篇初稿 ›</small></button>`).join('');
    return `<section class="magazine-panel"><div class="magazine-panel-head"><div><span>MANUSCRIPTS</span><h2>稿件编辑室</h2><p>API 生成的内容只是初稿，所有文字都可以继续修改。</p></div><button data-magazine-add-article type="button">＋ 空白稿件</button></div>${pending ? `<div class="magazine-pending-drafts">${pending}</div>` : ''}<div class="magazine-article-list">${issue.articles.map(articleEditor).join('') || '<div class="magazine-empty-small">还没有稿件，可以从策划栏目生成，或添加一篇空白稿件。</div>'}</div></section>`;
  }

  function designPanel(issue) {
    const colors = [['#d7c8bd','#241f1c'],['#111111','#f5f1e8'],['#d9dfd7','#21312a'],['#d8c8d9','#392b3b'],['#c8d5df','#172b3b'],['#e5dfc5','#403819']];
    return `<section class="magazine-panel"><div class="magazine-panel-head"><div><span>ART DIRECTION</span><h2>封面与发布</h2><p>图片只负责视觉，刊名和标题由版式覆盖，不会生成乱码。</p></div><button data-magazine-preview type="button">整刊预览</button></div><div class="magazine-design-layout"><div class="magazine-cover-stage">${coverMarkup(issue)}</div><section class="magazine-cover-settings"><label>顶部刊名<input data-magazine-cover-field="kicker" value="${esc(issue.cover.kicker)}"></label><label>封面标题<input data-magazine-cover-field="headline" value="${esc(issue.cover.headline)}"></label><label>封面副标题<textarea data-magazine-cover-field="subhead">${esc(issue.cover.subhead)}</textarea></label><div class="magazine-color-row"><b>封面色调</b>${colors.map(([color,ink]) => `<button data-magazine-cover-color="${color}" data-magazine-cover-ink="${ink}" style="background:${color}" class="${issue.cover.color === color ? 'is-active' : ''}" type="button" aria-label="选择封面色调"></button>`).join('')}</div><div class="magazine-cover-actions"><label>上传封面<input data-magazine-cover-file type="file" accept="image/*"></label><button data-magazine-generate-cover type="button" ${busy ? 'disabled' : ''}>${busy === 'cover' ? '生成中…' : 'AI 生成封面摄影'}</button><button data-magazine-remove-cover type="button">移除图片</button></div></section></div><button class="magazine-publish-button" data-magazine-publish type="button">${issue.status === '已发布' ? '更新已发布刊物' : '发布这一期'} <span>↗</span></button></section>`;
  }

  function previewSheets(issue) {
    const toc = issue.articles.map((article,index) => `<li><span>${String(index + 1).padStart(2,'0')}</span><b>${esc(article.title)}</b><small>${esc(article.type || 'FEATURE')}</small></li>`).join('');
    const contents = `<section class="magazine-toc"><span>CONTENTS</span><h2>目录</h2><ol>${toc || '<li><b>还没有稿件</b></li>'}</ol></section>`;
    const pages = issue.articles.map((article,index) => `<article class="magazine-reading-page"><header><span>${esc(article.type || 'FEATURE')} · ${String(index + 1).padStart(2,'0')}</span><h2>${esc(article.title)}</h2><p>${esc(article.deck || '')}</p></header><div>${esc(article.content || '').replace(/\n/g,'<br>')}</div></article>`);
    return [`<div class="magazine-flip-cover">${coverMarkup(issue)}</div>`, contents, ...pages];
  }
  function previewPage(issue) {
    const sheets = previewSheets(issue);
    const index = Math.min(Math.max(previewIndex, 0), sheets.length - 1);
    const back = issue.status === '已发布' ? 'data-magazine-home' : 'data-magazine-studio';
    const subtitle = issue.status === '已发布' ? `已发布 · ${issue.publishedAt} · 只读阅读` : '预览中 · 返回后还可以继续编辑';
    return `<section class="magazine-page magazine-preview-page">${header('ISSUE READER', issue.title, subtitle, back)}<main class="magazine-reader magazine-flipbook-reader"><div class="magazine-flipbook"><div class="magazine-flipbook-page ${previewTurnDirection > 0 ? 'from-right' : 'from-left'}" data-magazine-flip-page>${sheets[index]}</div></div><div class="magazine-page-controls"><button data-magazine-page-turn="prev" type="button" ${index === 0 ? 'disabled' : ''} aria-label="上一页">‹</button><span>第 ${index + 1} / ${sheets.length} 页</span><button data-magazine-page-turn="next" type="button" ${index === sheets.length - 1 ? 'disabled' : ''} aria-label="下一页">›</button></div><small class="magazine-reader-tip">翻页阅读本期刊物</small></main></section>`;
  }

  function render() {
    const currentHome = app.querySelector('.magazine-home-page');
    if (currentHome) homeScrollTop = currentHome.scrollTop;
    const currentIndex = app.querySelector('.magazine-home-index-list');
    if (currentIndex) homeIndexScrollLeft = currentIndex.scrollLeft;
    const oldScrollHost = app.querySelector('.magazine-page') || app;
    const oldScroll = oldScrollHost.scrollTop || 0;
    const issue = activeIssue();
    if (page === 'studio' && issue?.status === '已发布') { page = 'preview'; previewIndex = 0; }
    app.innerHTML = page === 'home' ? homePage() : page === 'new' ? newPage() : page === 'preview' && issue ? previewPage(issue) : issue ? studioPage(issue) : homePage();
    const renderedDock = app.querySelector('.magazine-home-dock');
    if (renderedDock) renderedDock.outerHTML = magazineDockMarkup(); else app.insertAdjacentHTML('beforeend', magazineDockMarkup());
    const next = app.querySelector('.magazine-page'); const nextScroll = page === 'home' ? homeScrollTop : oldScroll; if (next && page !== 'preview') { next.scrollTop = nextScroll; requestAnimationFrame(() => { next.scrollTop = nextScroll; }); }
    const nextIndex = app.querySelector('.magazine-home-index-list'); if (nextIndex) { nextIndex.scrollLeft = homeIndexScrollLeft; requestAnimationFrame(() => { nextIndex.scrollLeft = homeIndexScrollLeft; }); }
    requestAnimationFrame(hydrateImages);
  }
  function hydrateImages() { app.querySelectorAll('[data-magazine-asset]').forEach(async image => { if (image.dataset.hydrated) return; image.dataset.hydrated = 'true'; const source = window.IdealMachineGetImage ? await window.IdealMachineGetImage(image.dataset.magazineAsset) : image.dataset.magazineAsset; if (source) image.src = source; }); }

  function createIssue() {
    app.querySelectorAll('[data-magazine-new-field]').forEach(field => { newDraft[field.dataset.magazineNewField] = field.value.trim(); });
    newDraft.participantIds = [...app.querySelectorAll('[data-magazine-new-role]:checked')].map(input => input.dataset.magazineNewRole);
    if (!newDraft.title) return window.alert('请填写刊物名称。');
    if (!newDraft.theme) return window.alert('请填写本期主题。');
    const roles = chatRoles();
    const participants = newDraft.participantIds.map(id => roles.find(role => role.id === id)).filter(Boolean).map(clone);
    const issue = normalizeIssue({ id:uid('issue'), title:newDraft.title, theme:newDraft.theme, edition:newDraft.edition || 'VOL. 01', direction:newDraft.direction, participants, sections:[{ id:uid('section'), type:'封面故事', title:newDraft.theme, pitch:'从本期主题出发，建立核心观察。' },{ id:uid('section'), type:'人物采访', title:participants[0] ? `与${participants[0].name}谈谈` : '人物谈话', pitch:'通过具体问题呈现人物的真实立场与生活细节。' }] });
    state.issues.push(issue); save(); activeId = issue.id; activeTab = 'plan'; activeInterviewRole = issue.participants[0]?.id || ''; page = 'studio'; render();
  }

  function textApi() { const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('magazine') || window.IdealMachineAPI?.getModel?.('fanfic') || window.IdealMachineAPI?.getModel?.('chat'); if (!config.endpoint || !model) throw new Error('请先在设置中为杂志社配置文字 API 模型'); return { ...config, model }; }
  async function complete(system, prompt, temperature = .8) { const config = textApi(); const headers = { 'Content-Type':'application/json' }; if (config.key) headers.Authorization = `Bearer ${config.key}`; const request = window.IdealMachineFetch || window.fetch.bind(window); const response = await request(`${config.endpoint.replace(/\/$/,'')}/chat/completions`, { idealScope:'magazine-background', timeout:120000, method:'POST', headers, body:JSON.stringify({ model:config.model, temperature, messages:[{ role:'system', content:system },{ role:'user', content:prompt }] }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const payload = await response.json(); return String(payload.choices?.[0]?.message?.content || '').trim(); }
  function parseJson(raw) { return JSON.parse(String(raw).replace(/```json|```/gi,'').trim()); }

  function magazineLiveRole(issue, id) {
    const saved = issue?.participants?.find(item => item.id === id) || {};
    const live = chatRoles().find(item => item.id === id) || {};
    return { ...saved, ...live, name: live.name || live.realName || saved.realName || saved.name || '角色', realName: live.realName || saved.realName || saved.name || '', persona: live.persona || saved.persona || '' };
  }
  function magazineRoleWorldbook(role) {
    try {
      const data = JSON.parse(localStorage.getItem('ideal-machine-worldbooks') || '{}');
      const book = (data.local || []).find(item => item.id === role?.worldbook);
      if (!book) return '未绑定局部世界书。';
      const entries = (book.entries || []).filter(entry => entry.enabled !== false && String(entry.content || '').trim());
      return entries.length ? `绑定局部世界书：${book.name}\n${entries.map(entry => `${entry.name}：${entry.content}`).join('\n')}` : `绑定局部世界书：${book.name}\n当前没有启用的世界书条目。`;
    } catch { return '未绑定局部世界书。'; }
  }
  function magazineEditorialContext(issue) {
    const people = (issue?.participants || []).map(item => magazineLiveRole(issue, item.id)).filter(item => item.id || item.name);
    const cast = people.length ? people.map(role => `【${role.name}】\n身份：${role.identity || '未填写'}\n生日：${role.birthday || '未填写'}\n性别：${role.gender || '未填写'}\n人物设定：${role.persona || '暂无人物设定'}\n${magazineRoleWorldbook(role)}`).join('\n\n') : '本期暂未选择受访人物。';
    return `【本期刊物】\n刊物名称：${issue?.title || '未命名刊物'}\n本期主题：${issue?.theme || '未填写'}\n内容方向：${issue?.direction || '自由主题'}\n\n【本期人物与世界观】\n${cast}`;
  }

  async function generatePlan() {
    const issue = activeIssue(); if (!issue || busy) return; busy = 'plan'; render();
    try { const raw = await complete('你是杂志编辑策划，只输出合法 JSON。', `为这期杂志规划 4 个彼此不同、可以真正采访和写作的栏目。只返回：{"sections":[{"type":"封面故事或人物采访或专题文章或图片故事或短栏","title":"栏目标题","pitch":"具体内容角度"}]}。\n刊物：${issue.title}\n主题：${issue.theme}\n方向：${issue.direction}\n参与人物：${issue.participants.map(item=>item.name).join('、') || '暂无'}`, .9); const result = parseJson(raw); const generated = Array.isArray(result.sections) ? result.sections : []; if (!generated.length) throw new Error('API 没有返回栏目'); issue.sections = generated.slice(0,6).map(item => ({ id:uid('section'), type:item.type || '专题文章', title:item.title || '未命名栏目', pitch:item.pitch || '' })); issue.updatedAt = now(); save(); } catch (error) { window.alert(`选题生成失败：${error.message}`); } finally { busy = ''; render(); }
  }

  async function askInterview(question) {
    const issue = activeIssue(); const role = roleFrom(issue,activeInterviewRole); if (!issue || !role || busy || !question) return;
    const session = ensureInterview(issue,role.id); session.turns.push({ id:uid('turn'), role:'editor', text:question, time:now() }); issue.updatedAt = now(); save(); busy = 'interview'; render();
    try { const history = session.turns.slice(-12).map(turn => `${turn.role === 'editor' ? '主编' : role.name}：${turn.text}`).join('\n'); const answer = await complete(`你正在接受一本杂志的正式采访。你必须作为“${role.name}”本人回答，保持人物设定，回答要具体、有个人立场和生活细节，不要提及AI或角色扮演。`, `人物设定：${role.persona || '暂无补充'}\n本期主题：${issue.theme}\n采访记录：\n${history}\n请只回答主编最后一个问题。`, .82); session.turns.push({ id:uid('turn'), role:'role', text:answer || '……', time:now() }); issue.updatedAt = now(); save(); } catch (error) { window.alert(`采访失败：${error.message}`); } finally { busy = ''; render(); }
  }

  async function generateArticle(sectionId, interviewRoleId = '') {
    const issue = activeIssue(); const section = issue?.sections.find(item => item.id === sectionId); if (!issue || !section || busy) return; busy = 'article'; render();
    try { const interviews = issue.interviews.filter(session => !interviewRoleId || session.roleId === interviewRoleId).map(session => { const role = roleFrom(issue,session.roleId); return `【${role?.name || '人物'}采访】\n${session.turns.map(turn => `${turn.role === 'editor' ? '主编' : role?.name || '受访者'}：${turn.text}`).join('\n')}`; }).join('\n\n'); const raw = await complete('你是杂志撰稿人与编辑，只输出合法 JSON。', `根据策划和真实采访记录写一篇可编辑的中文杂志初稿。不要捏造采访中没有出现的直接引语。只返回：{"title":"标题","deck":"导语","content":"正文"}。\n刊物主题：${issue.theme}\n栏目类型：${section.type}\n栏目标题：${section.title}\n内容角度：${section.pitch}\n采访记录：${interviews || '暂无采访，可写成观察性文章但不要虚构引语。'}`, .84); const result = parseJson(raw); let article = sectionArticle(issue,section.id); if (!article) { article = { id:uid('article'), sectionId:section.id, createdAt:now() }; issue.articles.push(article); } Object.assign(article,{ type:section.type, title:result.title || section.title, deck:result.deck || '', content:result.content || '', updatedAt:now() }); issue.updatedAt = now(); save(); activeTab = 'articles'; } catch (error) { window.alert(`稿件生成失败：${error.message}`); } finally { busy = ''; render(); }
  }

  function interviewToArticle() { const issue = activeIssue(); const session = issue?.interviews.find(item => item.roleId === activeInterviewRole); if (!issue || !session?.turns.length) return; let section = issue.sections.find(item => item.type === '人物采访' && !sectionArticle(issue,item.id)); if (!section) { const role = roleFrom(issue,activeInterviewRole); section = { id:uid('section'), type:'人物采访', title:`与${role?.name || '人物'}谈谈`, pitch:`围绕“${issue.theme}”整理本次采访。` }; issue.sections.push(section); save(); } generateArticle(section.id,activeInterviewRole); }
  function saveArticle(articleId) { const issue = activeIssue(); const article = issue?.articles.find(item=>item.id===articleId); if (!article) return; article.title = app.querySelector(`[data-magazine-article-title="${articleId}"]`)?.value.trim() || '未命名稿件'; article.deck = app.querySelector(`[data-magazine-article-deck="${articleId}"]`)?.value.trim() || ''; article.content = app.querySelector(`[data-magazine-article-content="${articleId}"]`)?.value || ''; article.updatedAt = now(); issue.updatedAt = now(); save(); render(); }

  async function generateCover() { const issue = activeIssue(); if (!issue || busy || !window.IdealMachineImageAPI?.generate) return; busy = 'cover'; render(); try { const people = issue.participants.map(item=>`${item.name}：${item.persona}`).join('\n'); const result = await window.IdealMachineImageAPI.generate({ purpose:'moments', count:1, prompt:`为一本人物杂志生成竖版封面摄影底图，不要生成任何文字、字母、数字、边框或排版。杂志主题：${issue.theme}。内容方向：${issue.direction}。${people ? `可能出现的人物设定：${people}` : '以主题相关的静物或环境为主体'}。构图需要为顶部刊名和下方大标题预留干净空间。` }); if (!result.assetId) throw new Error('没有返回图片'); issue.cover.image = result.assetId; issue.updatedAt = now(); save(); } catch (error) { console.warn('magazine_cover_generation_failed', error); } finally { busy=''; render(); } }
  async function uploadCover(file) { const issue = activeIssue(); if (!issue || !file) return; const data = window.IdealMachineReadImage ? await window.IdealMachineReadImage(file,1500,.8) : await new Promise(resolve => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.readAsDataURL(file); }); issue.cover.image = window.IdealMachinePutImage ? await window.IdealMachinePutImage(data) : data; issue.updatedAt=now(); save(); render(); }

  let batchProgress = 0;
  const magazineJobStorageKey = 'ideal-machine-magazine-background-job';
  function readMagazineJob() { try { const value = JSON.parse(localStorage.getItem(magazineJobStorageKey) || 'null'); return value && typeof value === 'object' ? value : null; } catch { return null; } }
  function writeMagazineJob(value) { if (value) localStorage.setItem(magazineJobStorageKey, JSON.stringify(value)); else localStorage.removeItem(magazineJobStorageKey); window.dispatchEvent(new CustomEvent('ideal-magazine-job-updated')); }
  function beginMagazineJob(type, issueId, label) { const job = { id:uid('mag-job'), type, issueId, label, status:'running', progress:0, startedAt:Date.now(), updatedAt:Date.now() }; writeMagazineJob(job); return job.id; }
  function updateMagazineJob(id, patch) { const job = readMagazineJob(); if (!job || job.id !== id) return; writeMagazineJob({ ...job, ...patch, updatedAt:Date.now() }); }
  function finishMagazineJob(id, status, message) { const job = readMagazineJob(); if (!job || job.id !== id) return; writeMagazineJob({ ...job, status, message, completedAt:Date.now(), updatedAt:Date.now() }); }
  function persistMagazineIssue(issue) { const latest = readState(); const copy = normalizeIssue(clone(issue)); const index = latest.issues.findIndex(item => item.id === copy.id); if (index >= 0 && latest.issues[index].status === '已发布') { state = latest; return latest.issues[index]; } if (index >= 0) latest.issues[index] = copy; else latest.issues.push(copy); state = latest; save(); return copy; }
  function magazineBackgroundBanner() {
    const job = readMagazineJob(); if (!job) return '';
    if (job.type === 'cover' && job.status === 'error') return '';
    const running = job.status === 'running'; const tone = running ? 'is-running' : job.status === 'error' ? 'is-error' : 'is-done';
    const progress = job.type === 'batch' && job.total ? ` · ${job.progress || 0}/${job.total}` : '';
    return `<section class="magazine-background-job ${tone}"><i>${running ? '✦' : job.status === 'error' ? '!' : '✓'}</i><div><b>${esc(running ? `${job.label || '后台生成中'}${progress}` : job.message || '后台生成已完成')}</b><small>${running ? '可以关闭杂志社，API 会继续运行；重新打开后可继续查看。' : '结果已经保存到本期刊物中。'}</small></div></section>`;
  }
  const randomMagazineTitles = ['未眠时刻', '人间侧写', '靠近一点', '日常之外', '回声现场', '在场的人', '慢慢发生', '未寄出的信'];
  const randomMagazineThemes = ['记录人如何在关系里成为自己', '从一顿饭、一段路和一次沉默里观察生活', '那些没有被认真问过的问题', '年轻人如何与不确定的日子相处', '亲密关系里被忽略的微小瞬间', '当我们谈论选择、离开与重新开始'];
  const randomMagazineDirections = ['人物与生活', '关系观察', '文化与潮流', '故事与世界', '自由主题'];
  function randomMagazineSetting() {
    const pick = list => list[Math.floor(Math.random() * list.length)];
    newDraft.title = pick(randomMagazineTitles);
    newDraft.theme = pick(randomMagazineThemes);
    newDraft.direction = pick(randomMagazineDirections);
    newDraft.edition = `VOL. ${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;
    render();
  }

  newPage = function() {
    return `<section class="magazine-page">${header('NEW PUBLICATION', '创办新刊', '先定下这一期的气质，也可以交给随机设定。')}<main class="magazine-main"><section class="magazine-form-card magazine-publication-card"><div class="magazine-form-title"><span>PUBLICATION</span><h2>刊物设定</h2><p>名称、主题和内容方向会成为整期杂志的编辑基调。</p></div><button class="magazine-random-button" data-magazine-randomize type="button">✦ 随机设定</button><label>刊物名称<input data-magazine-new-field="title" value="${esc(newDraft.title)}" placeholder="例如：未眠时刻"></label><label>本期主题<textarea data-magazine-new-field="theme" placeholder="这一期想记录、追问或讨论什么？">${esc(newDraft.theme)}</textarea></label><div class="magazine-form-grid"><label>刊号<input data-magazine-new-field="edition" value="${esc(newDraft.edition)}"></label><label>内容方向<select data-magazine-new-field="direction"><option ${newDraft.direction === '人物与生活' ? 'selected' : ''}>人物与生活</option><option ${newDraft.direction === '关系观察' ? 'selected' : ''}>关系观察</option><option ${newDraft.direction === '文化与潮流' ? 'selected' : ''}>文化与潮流</option><option ${newDraft.direction === '故事与世界' ? 'selected' : ''}>故事与世界</option><option ${newDraft.direction === '自由主题' ? 'selected' : ''}>自由主题</option></select></label></div></section><section class="magazine-form-card"><div class="magazine-number">02</div><div class="magazine-form-title"><span>CAST</span><h2>本期参与人物</h2><p>采访、写作和世界观读取都会以这里选择的人物为准。</p></div><div class="magazine-role-grid">${roleChoices(newDraft.participantIds)}</div></section><button class="magazine-create-button" data-magazine-create type="button">建立本期编辑部 <span>›</span></button></main></section>`;
  };

  planPanel = function(issue) {
    const batchLabel = busy === 'batch' ? `生成中 ${String(batchProgress).padStart(2, '0')} / ${Math.min(4, issue.sections.length || 4)}` : '一键生成 4 篇初稿';
    return `<section class="magazine-panel magazine-plan-panel"><div class="magazine-panel-head"><div><span>EDITORIAL PLAN</span><h2>本期策划案</h2><p>AI 会先读取本期人物设定与绑定世界书，再拆出可采访、可写作的栏目。</p></div><div class="magazine-panel-actions"><button class="magazine-ai-action" data-magazine-generate-plan type="button" ${busy ? 'disabled' : ''}><i>✦</i><span><b>${busy === 'plan' ? '正在策划…' : '让编辑部帮我策划'}</b><small>读取人设与世界观</small></span></button><button class="is-secondary magazine-batch-action" data-magazine-generate-all-drafts type="button" ${busy ? 'disabled' : ''}><i>▤</i><span><b>${batchLabel}</b><small>按 01—04 顺序完成</small></span></button></div></div><section class="magazine-overview"><label>刊物名称<input data-magazine-issue-field="title" value="${esc(issue.title)}"></label><label>本期主题<textarea data-magazine-issue-field="theme">${esc(issue.theme)}</textarea></label><div><label>刊号<input data-magazine-issue-field="edition" value="${esc(issue.edition)}"></label><label>内容方向<select data-magazine-issue-field="direction"><option ${issue.direction === '人物与生活' ? 'selected' : ''}>人物与生活</option><option ${issue.direction === '关系观察' ? 'selected' : ''}>关系观察</option><option ${issue.direction === '文化与潮流' ? 'selected' : ''}>文化与潮流</option><option ${issue.direction === '故事与世界' ? 'selected' : ''}>故事与世界</option><option ${issue.direction === '自由主题' ? 'selected' : ''}>自由主题</option></select></label></div><div class="magazine-participant-chips"><b>本期人物</b>${participantChips(issue)}</div><details class="magazine-participant-manager"><summary>管理本期人物</summary><div class="magazine-role-grid">${roleChoices(issue.participants.map(item => item.id), 'issue')}</div></details></section><div class="magazine-section-list">${issue.sections.map((section,index) => sectionCard(issue,section,index)).join('') || '<div class="magazine-empty-small">还没有栏目，可以手动添加、生成选题，或直接使用随机设定。</div>'}</div><button class="magazine-add-section" data-magazine-add-section type="button">＋ 添加一个栏目</button></section>`;
  };

  interviewPanel = function(issue) {
    if (!activeInterviewRole && issue.participants[0]) activeInterviewRole = issue.participants[0].id;
    const session = activeInterviewRole ? ensureInterview(issue, activeInterviewRole) : null;
    const role = magazineLiveRole(issue, activeInterviewRole);
    const roleTabs = issue.participants.map(item => { const person = magazineLiveRole(issue, item.id); return `<button data-magazine-interview-role="${esc(item.id)}" class="${item.id === activeInterviewRole ? 'is-active' : ''}" type="button"><span>${avatarMarkup(person)}</span><b>${esc(person.name)}</b><small>${issue.interviews.find(entry => entry.roleId === item.id)?.turns.length || 0} 条记录</small></button>`; }).join('');
    const turns = session?.turns.map(turn => { const editor = turn.role === 'editor'; return `<article class="magazine-interview-turn ${editor ? 'is-editor' : 'is-role'}"><div class="magazine-interview-turn-avatar">${editor ? 'M' : avatarMarkup(role)}</div><div class="magazine-interview-turn-body"><header><span>${editor ? '主编提问' : esc(role?.name || '受访者')}</span><small>${esc(turn.time)}</small></header><p>${esc(turn.text)}</p></div></article>`; }).join('') || '';
    return `<section class="magazine-panel magazine-interview-panel"><div class="magazine-interview-intro"><div><span>FIELD NOTES · ON RECORD</span><h2>采访现场</h2><p>把问题交给人物本人。每一次回答都会成为本期编辑部的真实素材。</p></div>${session?.turns.length ? '<button class="magazine-interview-article-button" data-magazine-interview-to-article type="button">整理为稿件 <span>↗</span></button>' : ''}</div>${issue.participants.length ? `<div class="magazine-interview-layout"><aside class="magazine-interview-roles"><div class="magazine-interview-roles-label"><span>CAST</span><b>选择受访者</b></div>${roleTabs}</aside><section class="magazine-interview-room"><header><div class="magazine-interview-room-avatar">${avatarMarkup(role)}</div><div><span>NOW INTERVIEWING</span><b>${esc(role?.name || '选择受访者')}</b><small>${esc(role?.persona || '这位人物还没有补充设定。')}</small></div><em>${session?.turns.length || 0} 条记录</em></header><main>${turns || '<div class="magazine-interview-empty"><i>?</i><b>从一个真正想知道的问题开始</b><p>不要替人物预设答案，也不要急着把回答写成文章。</p></div>'}</main><form class="magazine-interview-form" data-magazine-interview-form><div class="magazine-interview-input"><span>QUESTION</span><textarea data-magazine-question placeholder="向${esc(role?.name || '受访者')}提出一个具体的问题…" ${busy ? 'disabled' : ''}></textarea></div><button type="submit" ${busy ? 'disabled' : ''}><span>${busy === 'interview' ? '回答中…' : '发送问题'}</span><b>↗</b></button></form></section></div>` : '<div class="magazine-empty-small">这一期还没有参与角色，请回到策划页添加本期人物。</div>'}</section>`;
  };

  async function generateMagazineArticleDraft(issue, section, interviewRoleId = '') {
    const interviews = issue.interviews.filter(session => !interviewRoleId || session.roleId === interviewRoleId).map(session => {
      const role = magazineLiveRole(issue, session.roleId);
      return `【${role?.name || '人物'}采访】\n${session.turns.map(turn => `${turn.role === 'editor' ? '主编' : role?.name || '受访者'}：${turn.text}`).join('\n')}`;
    }).join('\n\n');
    const raw = await complete('你是资深中文杂志撰稿人与文字编辑。你必须尊重人物设定、世界观和采访事实，只输出合法 JSON，不要 Markdown。', `${magazineEditorialContext(issue)}\n\n【当前栏目】\n栏目类型：${section.type}\n栏目标题：${section.title}\n内容角度：${section.pitch || '围绕本期主题建立具体观察。'}\n\n【真实采访记录】\n${interviews || '暂无采访记录。此时只能写观察性或编辑说明，不得伪造人物说过的话。'}\n\n请写一篇可以继续人工修改的中文杂志初稿。文章要有明确视角、具体细节和自然节奏；人物采访稿只能使用记录中确实出现的内容，不得补写不存在的直接引语，不得让人物做出违背设定或世界规则的行为。只返回：{"title":"标题","deck":"导语","content":"正文"}。`, .84);
    const result = parseJson(raw);
    let article = sectionArticle(issue, section.id);
    if (!article) { article = { id:uid('article'), sectionId:section.id, createdAt:now() }; issue.articles.push(article); }
    Object.assign(article, { type:section.type, title:result.title || section.title, deck:result.deck || '', content:result.content || '', updatedAt:now() });
  }

  generatePlan = async function() {
    const issue = activeIssue(); if (!issue || busy) return; busy = 'plan'; const jobId = beginMagazineJob('plan', issue.id, '正在生成本期策划'); render();
    try {
      const raw = await complete('你是一本中文人物杂志的总编辑和选题策划。先理解人物设定与世界规则，再做有现场感、能真正写出来的选题。只输出合法 JSON。', `${magazineEditorialContext(issue)}\n\n请为本期规划恰好 4 个彼此不同的栏目，对应 01、02、03、04。栏目要能落到具体人物、具体场景或具体问题，不要写空泛的“介绍一下角色”。人物采访栏目必须适合真实追问，专题栏目必须有清晰观察角度。只返回：{"sections":[{"type":"封面故事或人物采访或专题文章或图片故事或短栏","title":"栏目标题","pitch":"具体内容角度、适合采访谁或观察什么"}]}。`, .9);
      const result = parseJson(raw); const generated = Array.isArray(result.sections) ? result.sections : []; if (!generated.length) throw new Error('API 没有返回栏目');
      issue.sections = generated.slice(0, 4).map(item => ({ id:uid('section'), type:item.type || '专题文章', title:item.title || '未命名栏目', pitch:item.pitch || '' })); issue.updatedAt = now(); persistMagazineIssue(issue); finishMagazineJob(jobId, 'done', '本期策划已生成');
    } catch (error) { finishMagazineJob(jobId, 'error', `选题生成失败：${error.message}`); window.alert(`选题生成失败：${error.message}`); } finally { busy = ''; render(); }
  };

  generateArticle = async function(sectionId, interviewRoleId = '', batch = false) {
    const isBatch = batch || busy === 'batch'; const storedJob = readMagazineJob(); const issue = activeIssue() || (isBatch ? state.issues.find(item => item.id === storedJob?.issueId) : null); const section = issue?.sections.find(item => item.id === sectionId); if (!issue || !section || (busy && !isBatch)) return;
    const jobId = !isBatch ? beginMagazineJob('article', issue.id, `正在生成「${section.title}」`) : storedJob?.id || '';
    if (!isBatch) { busy = 'article'; render(); }
    try { await generateMagazineArticleDraft(issue, section, interviewRoleId); issue.updatedAt = now(); persistMagazineIssue(issue); if (!isBatch) { finishMagazineJob(jobId, 'done', `「${section.title}」初稿已生成`); activeTab = 'articles'; } else updateMagazineJob(jobId, { progress:batchProgress }); } catch (error) { if (!isBatch) finishMagazineJob(jobId, 'error', `稿件生成失败：${error.message}`); window.alert(`稿件生成失败：${error.message}`); } finally { if (!isBatch) busy = ''; render(); }
  };

  async function generateAllDrafts() {
    let issue = activeIssue(); if (!issue || busy) return; const issueId = issue.id;
    if (!issue.sections.length) { await generatePlan(); issue = state.issues.find(item => item.id === issueId) || readState().issues.find(item => item.id === issueId); }
    const sections = issue?.sections.slice(0, 4) || []; if (!sections.length) return window.alert('请先生成或添加栏目。');
    busy = 'batch'; batchProgress = 0; const jobId = beginMagazineJob('batch', issue.id, '正在生成 01—04 栏目初稿'); updateMagazineJob(jobId, { total:sections.length }); render();
    for (const section of sections) { batchProgress += 1; updateMagazineJob(jobId, { progress:batchProgress, label:`正在生成 ${String(batchProgress).padStart(2, '0')} 号栏目初稿` }); render(); await generateArticle(section.id, '', true); }
    finishMagazineJob(jobId, 'done', `已生成 ${sections.length} 篇栏目初稿`); busy = ''; activeTab = 'articles'; batchProgress = 0; render();
  }

  generateCover = async function() {
    const issue = activeIssue(); if (!issue || busy || !window.IdealMachineImageAPI?.generate) return; busy = 'cover'; const jobId = beginMagazineJob('cover', issue.id, '正在生成封面摄影'); render();
    try { const result = await window.IdealMachineImageAPI.generate({ purpose:'moments', count:1, prompt:`为一本中文人物杂志生成竖版封面摄影底图。不要生成任何文字、字母、数字、边框、水印或社交软件界面，顶部刊名和下方大标题要预留干净空间。${magazineEditorialContext(issue)}\n请将人物气质、时代背景和世界规则转化为自然可信的摄影场景。` }); if (!result.assetId) throw new Error('没有返回图片'); issue.cover.image = result.assetId; issue.updatedAt = now(); persistMagazineIssue(issue); finishMagazineJob(jobId, 'done', '封面摄影已生成'); } catch (error) { console.warn('magazine_cover_generation_failed', error); writeMagazineJob(null); } finally { busy=''; render(); }
  };

  askInterview = async function(question) {
    const issue = activeIssue(); const role = magazineLiveRole(issue, activeInterviewRole); if (!issue || !role || busy || !question) return;
    const session = ensureInterview(issue, role.id); session.turns.push({ id:uid('turn'), role:'editor', text:question, time:now() }); issue.updatedAt = now(); persistMagazineIssue(issue); busy = 'interview'; const jobId = beginMagazineJob('interview', issue.id, `正在等待${role.name}回答`); render();
    try {
      const history = session.turns.slice(-16).map(turn => `${turn.role === 'editor' ? '主编' : role.name}：${turn.text}`).join('\n');
      const answer = await complete(`你是${role.name}本人，正在接受一本中文杂志的正式采访。严格按照人物设定、身份、经历、关系和世界规则回答。回答要像真实的人在现场说话，具体、有个人立场和生活细节，可以保留犹豫，但不要替主编写文章。不要提及 AI、提示词、世界书或角色扮演，不要代替其他人物发言。`, `${magazineEditorialContext(issue)}\n\n【当前受访者】\n${role.name}\n人物设定：${role.persona || '暂无人物设定'}\n\n【本次采访记录】\n${history}\n\n请只回答主编最后一个问题，不要加标题、说话人标签或解释。`, .82);
      session.turns.push({ id:uid('turn'), role:'role', text:answer || '……', time:now() }); issue.updatedAt = now(); persistMagazineIssue(issue); finishMagazineJob(jobId, 'done', `${role.name}的采访回答已保存`);
    } catch (error) { finishMagazineJob(jobId, 'error', `采访失败：${error.message}`); window.alert(`采访失败：${error.message}`); } finally { busy = ''; render(); }
  };

  document.addEventListener('click', event => {
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-magazine-dock-expand]')) { if (suppressMagazineDockExpand) { suppressMagazineDockExpand = false; return; } magazineDockCollapsed = false; render(); return; }
    if (event.target.closest('[data-magazine-randomize]')) { randomMagazineSetting(); return; }
    if (event.target.closest('[data-magazine-generate-all-drafts]')) { generateAllDrafts(); return; }
  });

  document.addEventListener('click', event => {
    const launcher = event.target.closest('[data-folder-app="magazine"]');
    if (launcher) { openApp(Boolean(launcher.closest('[data-desktop-folder]'))); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-magazine-close]')) { closeApp(); return; }
    if (event.target.closest('[data-magazine-folder]')) { backFolder(); return; }
    if (event.target.closest('[data-magazine-home-search-toggle]')) { homeSearchOpen = true; render(); requestAnimationFrame(() => app.querySelector('[data-magazine-home-search-input]')?.focus()); return; }
    if (event.target.closest('[data-magazine-home-search-close]')) { homeSearchOpen = false; homeSearchQuery = ''; render(); return; }
    const cycle = event.target.closest('[data-magazine-home-cycle]');
    if (cycle) { const total = state.issues.length; if (total) homeIssueIndex = (homeIssueIndex + (cycle.dataset.magazineHomeCycle === 'next' ? 1 : -1) + total) % total; render(); return; }
    const homeSelect = event.target.closest('[data-magazine-home-select]');
    if (homeSelect) { const issues = state.issues.slice().reverse(); const index = issues.findIndex(issue => issue.id === homeSelect.dataset.magazineHomeSelect); if (index >= 0) { homeIssueIndex = index; render(); } return; }
    const homeJump = event.target.closest('[data-magazine-home-jump]');
    if (homeJump) { const issue = activeIssue() || state.issues.slice().reverse()[homeIssueIndex]; if (!issue) { newDraft = blankDraft(); page = 'new'; render(); return; } activeId = issue.id; activeTab = homeJump.dataset.magazineHomeJump || 'plan'; activeInterviewRole = issue.participants[0]?.id || ''; page = issue.status === '已发布' ? 'preview' : 'studio'; render(); return; }
    if (event.target.closest('[data-magazine-home-nav="home"]')) { if (page !== 'home') { page='home'; activeId=''; render(); } else app.querySelector('.magazine-home-page')?.scrollTo({ top:0, behavior:'smooth' }); return; }
    if (event.target.closest('[data-magazine-new]')) { newDraft=blankDraft(); page='new'; render(); return; }
    if (event.target.closest('[data-magazine-home]')) { page='home'; activeId=''; render(); return; }
    if (event.target.closest('[data-magazine-studio]')) { page='studio'; render(); return; }
    const pageTurn=event.target.closest('[data-magazine-page-turn]'); if(pageTurn){const issue=activeIssue();if(!issue)return;const sheets=previewSheets(issue);const delta=pageTurn.dataset.magazinePageTurn==='next'?1:-1;previewTurnDirection=delta;previewIndex=Math.min(Math.max(previewIndex+delta,0),sheets.length-1);render();return;}
    if (event.target.closest('[data-magazine-create]')) { createIssue(); return; }
    const opened=event.target.closest('[data-magazine-open]'); if(opened){activeId=opened.dataset.magazineOpen;const issue=activeIssue();page=issue?.status==='已发布'?'preview':'studio';previewIndex=0;activeTab='plan';activeInterviewRole=issue?.participants[0]?.id||'';render();return;}
    const deleted=event.target.closest('[data-magazine-delete]'); if(deleted&&window.confirm('确定删除这期杂志和全部采访、稿件吗？')){state.issues=state.issues.filter(item=>item.id!==deleted.dataset.magazineDelete);save();render();return;}
    const tab=event.target.closest('[data-magazine-tab]'); if(tab){activeTab=tab.dataset.magazineTab;render();return;}
    if(event.target.closest('[data-magazine-generate-plan]')){generatePlan();return;}
    if(event.target.closest('[data-magazine-add-section]')){const issue=activeIssue();issue.sections.push({id:uid('section'),type:'专题文章',title:'新栏目',pitch:''});issue.updatedAt=now();save();render();return;}
    const sectionDelete=event.target.closest('[data-magazine-section-delete]');if(sectionDelete){const issue=activeIssue();issue.sections=issue.sections.filter(item=>item.id!==sectionDelete.dataset.magazineSectionDelete);save();render();return;}
    const draftButton=event.target.closest('[data-magazine-section-draft]');if(draftButton){generateArticle(draftButton.dataset.magazineSectionDraft);return;}
    const interviewRole=event.target.closest('[data-magazine-interview-role]');if(interviewRole){activeInterviewRole=interviewRole.dataset.magazineInterviewRole;render();return;}
    if(event.target.closest('[data-magazine-interview-to-article]')){interviewToArticle();return;}
    if(event.target.closest('[data-magazine-add-article]')){const issue=activeIssue();issue.articles.push({id:uid('article'),sectionId:'',type:'自由稿件',title:'未命名稿件',deck:'',content:'',createdAt:now(),updatedAt:now()});save();render();return;}
    const articleSave=event.target.closest('[data-magazine-article-save]');if(articleSave){saveArticle(articleSave.dataset.magazineArticleSave);return;}
    const articleDelete=event.target.closest('[data-magazine-article-delete]');if(articleDelete){const issue=activeIssue();issue.articles=issue.articles.filter(item=>item.id!==articleDelete.dataset.magazineArticleDelete);save();render();return;}
    const color=event.target.closest('[data-magazine-cover-color]');if(color){const issue=activeIssue();issue.cover.color=color.dataset.magazineCoverColor;issue.cover.ink=color.dataset.magazineCoverInk;save();render();return;}
    if(event.target.closest('[data-magazine-generate-cover]')){generateCover();return;}
    if(event.target.closest('[data-magazine-remove-cover]')){const issue=activeIssue();issue.cover.image='';save();render();return;}
    if(event.target.closest('[data-magazine-preview]')){previewIndex=0;page='preview';render();return;}
    if(event.target.closest('[data-magazine-publish]')){const issue=activeIssue();if(!issue||issue.status==='已发布')return;issue.status='已发布';issue.publishedAt=now();issue.updatedAt=now();save();previewIndex=0;page='preview';render();return;}
    if (!magazineDockCollapsed && app.contains(event.target) && !event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"],.magazine-home-dock')) { magazineDockCollapsed = true; render(); }
  });
  document.addEventListener('pointerdown', event => { const orb = event.target.closest?.('[data-magazine-dock-expand]'); if (!orb || !app.classList.contains('is-open')) return; const rect = orb.getBoundingClientRect(); magazineDockDrag = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top, moved:false }; orb.setPointerCapture?.(event.pointerId); });
  document.addEventListener('pointermove', event => { if (!magazineDockDrag || magazineDockDrag.pointerId !== event.pointerId) return; const distance = Math.hypot(event.clientX - magazineDockDrag.startX, event.clientY - magazineDockDrag.startY); if (distance > 3) magazineDockDrag.moved = true; if (!magazineDockDrag.moved) return; event.preventDefault(); const size = 54; const x = Math.max(8, Math.min(window.innerWidth - size - 8, event.clientX - magazineDockDrag.offsetX)); const y = Math.max(8, Math.min(window.innerHeight - size - 8, event.clientY - magazineDockDrag.offsetY)); magazineDockPosition = { x:Math.round(x), y:Math.round(y) }; const orb = app.querySelector('[data-magazine-dock-expand]'); if (orb) { orb.style.left = `${magazineDockPosition.x}px`; orb.style.top = `${magazineDockPosition.y}px`; orb.style.right = 'auto'; orb.style.bottom = 'auto'; } }, { passive:false });
  document.addEventListener('pointerup', event => { if (!magazineDockDrag || magazineDockDrag.pointerId !== event.pointerId) return; suppressMagazineDockExpand = magazineDockDrag.moved; magazineDockDrag = null; if (suppressMagazineDockExpand) window.setTimeout(() => { suppressMagazineDockExpand = false; }, 0); });
  document.addEventListener('pointercancel', () => { magazineDockDrag = null; suppressMagazineDockExpand = false; });
  document.addEventListener('input', event => { const input = event.target.closest?.('[data-magazine-home-search-input]'); if (!input || !app.contains(input)) return; homeSearchQuery = input.value; syncMagazineHomeSearch(); });
  document.addEventListener('submit',event=>{if(!event.target.matches('[data-magazine-interview-form]'))return;event.preventDefault();const question=app.querySelector('[data-magazine-question]')?.value.trim();if(question)askInterview(question);});
  document.addEventListener('input',event=>{if(!app.classList.contains('is-open'))return;if(event.target.matches('[data-magazine-new-field]'))newDraft[event.target.dataset.magazineNewField]=event.target.value;if(event.target.matches('[data-magazine-issue-field]')){const issue=activeIssue();issue[event.target.dataset.magazineIssueField]=event.target.value;issue.updatedAt=now();save();}if(event.target.matches('[data-magazine-cover-field]')){const issue=activeIssue();issue.cover[event.target.dataset.magazineCoverField]=event.target.value;issue.updatedAt=now();save();const cover=app.querySelector('.magazine-cover-stage .magazine-cover');if(cover){const copy=cover.querySelector('.magazine-cover-copy');if(copy){copy.querySelector('span').textContent=issue.cover.kicker;copy.querySelector('h2').textContent=issue.cover.headline;copy.querySelector('p').textContent=issue.cover.subhead;}}}});
  document.addEventListener('change',event=>{if(!app.classList.contains('is-open'))return;if(event.target.matches('[data-magazine-new-role]')){const id=event.target.dataset.magazineNewRole;newDraft.participantIds=event.target.checked?[...new Set([...newDraft.participantIds,id])]:newDraft.participantIds.filter(item=>item!==id);}const issue=activeIssue();if(event.target.matches('[data-magazine-issue-role]')&&issue){const ids=[...app.querySelectorAll('[data-magazine-issue-role]:checked')].map(input=>input.dataset.magazineIssueRole);const roles=chatRoles();issue.participants=ids.map(id=>roles.find(role=>role.id===id)).filter(Boolean).map(clone);if(!ids.includes(activeInterviewRole))activeInterviewRole=ids[0]||'';issue.updatedAt=now();save();app.querySelector('.magazine-participant-chips').innerHTML=`<b>本期人物</b>${participantChips(issue)}`;}if(event.target.matches('[data-magazine-section-type]')){issue.sections.find(item=>item.id===event.target.dataset.magazineSectionType).type=event.target.value;save();}if(event.target.matches('[data-magazine-section-title]')){issue.sections.find(item=>item.id===event.target.dataset.magazineSectionTitle).title=event.target.value;save();}if(event.target.matches('[data-magazine-section-pitch]')){issue.sections.find(item=>item.id===event.target.dataset.magazineSectionPitch).pitch=event.target.value;save();}if(event.target.matches('[data-magazine-cover-file]')&&event.target.files[0])uploadCover(event.target.files[0]);});
  document.addEventListener('input',event=>{if(!app.classList.contains('is-open')||activeIssue()?.status!=='已发布'||!event.target.closest('.magazine-page'))return;event.preventDefault();event.stopImmediatePropagation();},true);
  document.addEventListener('change',event=>{if(!app.classList.contains('is-open')||activeIssue()?.status!=='已发布'||!event.target.closest('.magazine-page'))return;event.preventDefault();event.stopImmediatePropagation();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&app.classList.contains('is-open'))closeApp();});
  window.IdealMachineApps=window.IdealMachineApps||{};window.IdealMachineApps.magazine={name:'杂志社'};
})();
