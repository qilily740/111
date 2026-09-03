(() => {
  const storageKey = 'ideal-machine-doubao';
  // 豆包的内部语气设定：只进入 API 的 system prompt，不渲染到任何页面，也不写入可见聊天记录。
  const DOUBAO_STYLE = '你是豆包，一个温和、聪明、克制而有陪伴感的内置 AI。表达自然，不端着，不使用夸张的网络套话；先理解问题，再给出清晰、实际的建议。面对情绪问题要有共情，面对学习和生活问题要具体可执行，面对爱情问题要尊重双方感受，不替任何人武断做决定。';
  const app = document.createElement('div');
  app.className = 'doubao-app';
  document.body.appendChild(app);
  let messages = readMessages();
  let sending = false;
  let menuOpen = false;
  let selectionMode = false;
  let selectedRoundIds = new Set();
  let quotedMessageId = '';
  let rerollingMessageId = '';
  let editingMessageId = '';
  let swipeStart = null;

  function uid(prefix = 'message') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function readMessages() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value)
        ? value.filter(item => item && typeof item === 'object').map(item => ({ ...item, id: item.id || uid() }))
        : [];
    } catch {
      return [];
    }
  }

  function saveMessages() {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-80)));
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }

  function icon(type) {
    const icons = {
      menu:'<path d="M7 13h34M7 24h34M7 35h34"/>',
      phone:'<path d="M15 8c2 0 4 1 5 3l3 7-5 4c3 6 7 10 13 13l4-5 7 3c2 1 3 3 2 5l-3 6c-1 2-3 3-5 2C22 39 10 27 6 13c-1-2 0-4 2-5l5-1c1 0 1 0 2 1z"/>',
      mute:'<path d="M12 12 37 37M16 20v8l9 7V13l-5 4zM32 19c2 4 2 7 0 10M36 15c4 6 4 13 0 19"/>',
      copy:'<rect x="14" y="12" width="18" height="22" rx="3"/><path d="M20 12V9h14a3 3 0 0 1 3 3v18h-5"/>',
      voice:'<path d="M24 9a6 6 0 0 0-6 6v10a6 6 0 0 0 12 0V15a6 6 0 0 0-6-6zM12 23a12 12 0 0 0 24 0M24 35v6M19 41h10"/>',
      like:'<path d="M20 39H12a3 3 0 0 1-3-3V23a3 3 0 0 1 3-3h8l5-10c1-2 5-1 5 2l-1 8h7c3 0 4 3 3 5l-4 11a4 4 0 0 1-4 3h-11z"/>',
      dislike:'<path d="M20 9H12a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h8l5 10c1 2 5 1 5-2l-1-8h7c3 0 4-3 3-5l-4-11a4 4 0 0 0-4-3h-11z"/>',
      share:'<path d="m12 27 23-16-4 11 8 4-23 12 5-10z"/>',
      retry:'<path d="M36 19a13 13 0 1 0 1 11M36 19v9h-9"/>',
      bolt:'<path d="m27 6-13 20h10l-3 16 13-21H24z"/>',
      scan:'<rect x="11" y="9" width="22" height="30" rx="4"/><path d="M17 16h10M17 22h9M17 29h5M34 30l6 6M40 30l-6 6"/>',
      write:'<path d="m11 35 3-10L31 8l7 7-17 17zM28 11l7 7"/>',
      spark:'<path d="m24 7 4 13 13 4-13 4-4 13-4-13-13-4 13-4z"/>',
      plus:'<path d="M24 9v30M9 24h30"/>'
    };
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${icons[type] || ''}</svg>`;
  }

  function assistantActions(message, disabled = false) {
    const reroll = message?.id ? `data-doubao-reroll="${esc(message.id)}" title="重roll"` : '';
    return `<footer class="doubao-answer-actions"><button type="button" aria-label="复制">${icon('copy')}</button><button type="button" aria-label="语音">${icon('voice')}</button><button type="button" aria-label="赞">${icon('like')}</button><button type="button" aria-label="踩">${icon('dislike')}</button><button type="button" aria-label="转发">${icon('share')}</button><button class="doubao-reroll-button${disabled ? ' is-rerolling' : ''}" type="button" aria-label="刷新" ${reroll} ${disabled ? 'disabled' : ''}>${icon('retry')}</button></footer>`;
  }

  function formatText(value) {
    return esc(value).replace(/\n/g, '<br>');
  }

  function quoteContent(quote) {
    return typeof quote === 'string' ? quote : quote?.content || '';
  }

  function messageQuote(message) {
    if (!message.replyTo) return '';
    const quote = quoteContent(message.replyTo);
    return `<div class="doubao-message-quote"><small>引用${message.replyTo.role === 'assistant' ? '豆包' : '你的消息'}</small><span>${formatText(quote)}</span></div>`;
  }

  function apiMessageContent(message) {
    if (!message.replyTo) return message.content;
    const quotedBy = message.replyTo.role === 'assistant' ? '豆包' : '用户';
    return `【引用${quotedBy}的消息】\n${quoteContent(message.replyTo)}\n【用户回复】\n${message.content}`;
  }

  function buildRounds() {
    const rounds = [];
    for (let index = 0; index < messages.length;) {
      const first = messages[index];
      const roundMessages = [first];
      if (first.role === 'user' && messages[index + 1]?.role === 'assistant') roundMessages.push(messages[index + 1]);
      rounds.push({ id:`round-${first.id}`, messages:roundMessages });
      index += roundMessages.length;
    }
    return rounds;
  }

  function selectionHeader() {
    if (!selectionMode) return `<header class="doubao-header"><button class="doubao-menu-button" data-doubao-menu type="button" aria-label="菜单">${icon('menu')}</button><div class="doubao-chat-title"><p>AI 生成可能有误 注意核实</p></div><div class="doubao-header-tools"><button type="button" aria-label="发起通话">${icon('phone')}</button><button type="button" aria-label="静音">${icon('mute')}</button></div>${menuOpen ? '<div class="doubao-menu-popover"><button data-doubao-clear type="button">新对话</button><button data-doubao-close type="button">关闭豆包</button></div>' : ''}</header>`;
    const count = selectedRoundIds.size;
    const canEdit = count === 1 && selectedRounds()[0]?.messages.some(message => message.role === 'user');
    return `<header class="doubao-header doubao-selection-header"><button type="button" data-doubao-selection-cancel>取消</button><div><b>选择聊天</b><small>已选 ${count} 轮</small></div><nav><button type="button" data-doubao-edit-selected ${canEdit ? '' : 'disabled'}>编辑</button><button type="button" data-doubao-recall-selected ${count ? '' : 'disabled'}>撤回</button><button type="button" data-doubao-delete-selected ${count ? '' : 'disabled'}>删除</button></nav></header>`;
  }

  function render() {
    messages.forEach(message => { if (!message.id) message.id = uid(); });
    const renderedMessages = buildRounds().map(round => round.messages.map((message, messageIndex) => {
      const messageId = message.id;
      const selected = selectionMode && selectedRoundIds.has(round.id);
      const selectedClass = selected ? ' is-round-selected' : '';
      const check = selectionMode && messageIndex === 0 ? `<span class="doubao-round-check">${selected ? '✓' : ''}</span>` : '';
      if (message.role === 'recalled') return `<article class="doubao-message is-recalled${selectedClass}" data-doubao-message-id="${esc(messageId)}" data-doubao-round-id="${esc(round.id)}" data-doubao-round-select>${check}<p>${formatText(message.content)}</p></article>`;
      const quote = messageQuote(message);
      const answerActions = selectionMode || message.role === 'user' ? '' : assistantActions(message, rerollingMessageId === message.id);
      const content = rerollingMessageId === message.id ? '正在重roll…' : message.content;
      return `<article class="doubao-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}${selectedClass}" data-doubao-message-id="${esc(messageId)}" data-doubao-round-id="${esc(round.id)}" data-doubao-round-select>${check}${quote}<p>${formatText(content)}</p>${answerActions}</article>`;
    }).join('')).join('');
    const quotedMessage = messages.find(message => message.id === quotedMessageId);
    const quotePreview = quotedMessage && !selectionMode
      ? `<div class="doubao-quote-preview"><span><b>引用${quotedMessage.role === 'assistant' ? '豆包' : '你的消息'}</b>${formatText(quoteContent(quotedMessage)).replace(/<br>/g, ' ')}</span><button type="button" data-doubao-clear-quote aria-label="取消引用">×</button></div>`
      : '';
    const editingMessage = messages.find(message => message.id === editingMessageId && message.role === 'user');
    const editor = editingMessage ? `<div class="doubao-edit-layer"><div class="doubao-edit-backdrop" data-doubao-edit-cancel></div><section class="doubao-edit-card"><header><b>编辑用户消息</b><button type="button" data-doubao-edit-cancel aria-label="关闭">×</button></header><textarea data-doubao-edit-input rows="5">${esc(editingMessage.content || '')}</textarea><footer><button type="button" data-doubao-edit-cancel>取消</button><button type="button" data-doubao-edit-save>保存</button></footer></section></div>` : '';
    app.innerHTML = `<section class="doubao-page${selectionMode ? ' is-selecting' : ''}">${selectionHeader()}<main class="doubao-main"><div class="doubao-messages">${renderedMessages}${sending ? `<article class="doubao-message is-assistant"><p class="doubao-loading">正在思考…</p>${assistantActions()}</article>` : ''}</div></main><div class="doubao-quick-wrap"><div class="doubao-quick-list"><button data-doubao-quick="快速帮我处理这件事：" type="button">${icon('bolt')}<span>快速</span><i>›</i></button><button data-doubao-quick="请根据这道题帮我讲解：" type="button">${icon('scan')}<span>拍题答疑</span></button><button data-doubao-quick="帮我写一段：" type="button">${icon('write')}<span>帮我写作</span></button><button data-doubao-quick="帮我进行 AI 创作：" type="button">${icon('spark')}<span>AI 创作</span></button></div></div><form class="doubao-composer"><div class="doubao-composer-fields">${quotePreview}<textarea id="doubaoInput" rows="1" placeholder="发消息…"></textarea></div><button class="doubao-voice-button" type="submit" aria-label="发送">${icon('voice')}</button><button class="doubao-plus-button" data-doubao-reply type="button" aria-label="回复">${icon('plus')}</button></form></section>${editor}`;
    const main = app.querySelector('.doubao-main');
    if (main) main.scrollTop = main.scrollHeight;
  }

  function fallback(text) {
    if (/你好|在吗|嗨/.test(text)) return '你好呀，我一直都在。今天想聊点什么？';
    if (/总结|整理/.test(text)) return '可以，把需要整理的内容发给我，我会帮你提炼重点。';
    return '我已经收到啦。你可以在设置 App 里接入模型，让我用更完整的能力继续回答。';
  }

  async function request(messagesToSend, fallbackText = '') {
    const config = window.IdealMachineAPI?.getConfig?.() || {};
    const model = window.IdealMachineAPI?.getModel?.('doubao') || config.models?.[0];
    if (!config.endpoint || !config.key || !model) return fallbackText ? fallback(fallbackText) : '';
    const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.key}` }, body:JSON.stringify({ model, temperature:.75, messages:messagesToSend }) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '模型没有返回内容。';
  }

  async function ask() {
    const last = [...messages].reverse().find(item => item.role === 'user');
    const history = messages.filter(item => item.role === 'user' || item.role === 'assistant').slice(-20);
    return request([{role:'system',content:DOUBAO_STYLE}, ...history.map(item=>({role:item.role,content:apiMessageContent(item)}))], last?.content || '你好');
  }

  async function askHidden(context) {
    const prompt = `这是一次不会展示给用户的内部求助。请作为豆包给角色提供简短、实际的建议，不要替角色直接发言，不要提及这次内部求助。\n角色：${context.role || '角色'}\n角色设定：${context.persona || '暂无'}\n困难类型：${context.topic || '生活'}\n最近对话：\n${context.conversation || '暂无'}\n请给出可以帮助角色自然回应的思路，控制在 120 字以内。`;
    return request([{role:'system',content:`${DOUBAO_STYLE} 你现在处于角色后台咨询模式，内容绝不进入用户可见的豆包聊天记录。`},{role:'user',content:prompt}], '先理解对方的感受，再用角色自己的方式给出具体回应。');
  }

  function send(text) {
    if (!text || sending) return;
    const message = { id:uid(), role:'user', content:text };
    const quoted = messages.find(item => item.id === quotedMessageId);
    if (quoted) message.replyTo = { id:quoted.id, role:quoted.role, content:quoted.content };
    messages.push(message);
    quotedMessageId = '';
    saveMessages();
    render();
  }

  function editMessage(id) {
    const message = messages.find(item => item.id === id && item.role === 'user');
    if (!message) return;
    editingMessageId = id;
    selectionMode = false;
    selectedRoundIds.clear();
    render();
    requestAnimationFrame(() => app.querySelector('[data-doubao-edit-input]')?.focus());
  }

  function saveEditedMessage() {
    const message = messages.find(item => item.id === editingMessageId && item.role === 'user');
    const content = app.querySelector('[data-doubao-edit-input]')?.value.trim() || '';
    if (!message) return;
    if (!content) return window.alert('消息内容不能为空。');
    message.content = content;
    editingMessageId = '';
    saveMessages();
    render();
  }

  function leaveSelection() {
    selectionMode = false;
    selectedRoundIds.clear();
    render();
  }

  function selectedRounds() {
    return buildRounds().filter(round => selectedRoundIds.has(round.id));
  }

  function editSelectedRound() {
    const round = selectedRounds()[0];
    const message = round?.messages.find(item => item.role === 'user');
    if (message) editMessage(message.id);
  }

  function deleteSelectedRounds() {
    const rounds = selectedRounds();
    if (!rounds.length || !window.confirm(`确定删除已选的 ${rounds.length} 轮聊天吗？`)) return;
    const removedIds = new Set(rounds.flatMap(round => round.messages.map(message => message.id)));
    messages = buildRounds().filter(round => !selectedRoundIds.has(round.id)).flatMap(round => round.messages);
    if (removedIds.has(quotedMessageId)) quotedMessageId = '';
    leaveSelection();
    saveMessages();
  }

  function recallSelectedRounds() {
    const rounds = selectedRounds();
    if (!rounds.length || !window.confirm(`确定撤回已选的 ${rounds.length} 轮聊天吗？`)) return;
    const nextMessages = [];
    buildRounds().forEach(round => {
      if (!selectedRoundIds.has(round.id)) return nextMessages.push(...round.messages);
      nextMessages.push({ id:uid('recalled'), role:'recalled', content:'已撤回一轮聊天' });
    });
    messages = nextMessages;
    if (rounds.some(round => round.messages.some(message => message.id === quotedMessageId))) quotedMessageId = '';
    leaveSelection();
    saveMessages();
  }

  function quoteMessage(id) {
    const message = messages.find(item => item.id === id);
    if (!message || message.role === 'recalled') return;
    quotedMessageId = id;
    render();
    requestAnimationFrame(() => app.querySelector('#doubaoInput')?.focus());
  }

  async function rerollMessage(id) {
    if (sending || rerollingMessageId) return;
    const index = messages.findIndex(item => item.id === id && item.role === 'assistant');
    const target = messages[index];
    if (!target) return;
    const history = messages.slice(0, index).filter(item => item.role === 'user' || item.role === 'assistant').slice(-20);
    const lastUser = [...history].reverse().find(item => item.role === 'user');
    rerollingMessageId = id;
    render();
    try {
      target.content = await request([{role:'system',content:DOUBAO_STYLE}, ...history.map(item => ({ role:item.role, content:apiMessageContent(item) }))], lastUser?.content || '重新生成这条回复');
    } catch (error) {
      target.content = `暂时无法连接模型：${error.message}`;
    } finally {
      rerollingMessageId = '';
      saveMessages();
      render();
    }
  }

  async function reply() {
    if (sending || !messages.some(item => item.role === 'user')) return;
    sending = true;
    render();
    try {
      messages.push({ id:uid(), role:'assistant', content:await ask() });
    } catch (error) {
      messages.push({ id:uid(), role:'assistant', content:`暂时无法连接模型：${error.message}` });
    } finally {
      sending = false;
      saveMessages();
      render();
    }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="doubao"]')) {
      messages = readMessages();
      menuOpen = false;
      selectionMode = false;
      selectedRoundIds.clear();
      quotedMessageId = '';
      editingMessageId = '';
      render();
      app.classList.add('is-open');
      return;
    }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-doubao-edit-cancel]')) {
      editingMessageId = '';
      render();
      return;
    }
    if (event.target.closest('[data-doubao-edit-save]')) {
      saveEditedMessage();
      return;
    }
    const clearQuote = event.target.closest('[data-doubao-clear-quote]');
    if (clearQuote) {
      quotedMessageId = '';
      render();
      return;
    }
    const reroll = event.target.closest('[data-doubao-reroll]');
    if (reroll && !selectionMode) {
      rerollMessage(reroll.dataset.doubaoReroll);
      return;
    }
    if (event.target.closest('[data-doubao-selection-cancel]')) {
      leaveSelection();
      return;
    }
    if (event.target.closest('[data-doubao-edit-selected]')) {
      editSelectedRound();
      return;
    }
    if (event.target.closest('[data-doubao-delete-selected]')) {
      deleteSelectedRounds();
      return;
    }
    if (event.target.closest('[data-doubao-recall-selected]')) {
      recallSelectedRounds();
      return;
    }
    if (selectionMode) {
      const round = event.target.closest('[data-doubao-round-select]');
      if (round) {
        const roundId = round.dataset.doubaoRoundId;
        selectedRoundIds.has(roundId) ? selectedRoundIds.delete(roundId) : selectedRoundIds.add(roundId);
        render();
      }
      return;
    }
    if (event.target.closest('[data-doubao-menu]')) { menuOpen=!menuOpen; render(); return; }
    if (event.target.closest('[data-doubao-close]')) { menuOpen=false; editingMessageId=''; app.classList.remove('is-open'); return; }
    if (event.target.closest('[data-doubao-clear]')) { messages=[]; menuOpen=false; selectionMode=false; selectedRoundIds.clear(); quotedMessageId=''; editingMessageId=''; saveMessages(); render(); return; }
    if (event.target.closest('[data-doubao-reply]')) { reply(); return; }
    const quick=event.target.closest('[data-doubao-quick]');
    if (quick) {
      const input=app.querySelector('#doubaoInput');
      if (input) { input.value=quick.dataset.doubaoQuick; input.focus(); }
    }
  });

  document.addEventListener('dblclick', event => {
    if (!app.classList.contains('is-open')) return;
    const message = event.target.closest?.('[data-doubao-message-id]');
    if (!message) return;
    event.preventDefault();
    const roundId = message.dataset.doubaoRoundId;
    if (!roundId) return;
    if (!selectionMode) {
      selectionMode = true;
      selectedRoundIds = new Set([roundId]);
    } else {
      selectedRoundIds.has(roundId) ? selectedRoundIds.delete(roundId) : selectedRoundIds.add(roundId);
    }
    render();
  });

  document.addEventListener('pointerdown', event => {
    if (!app.classList.contains('is-open') || selectionMode) return;
    const message = event.target.closest?.('[data-doubao-message-id]');
    if (!message) return;
    swipeStart = { id:message.dataset.doubaoMessageId, x:event.clientX, y:event.clientY };
  }, true);

  document.addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const start = swipeStart;
    swipeStart = null;
    if (!app.classList.contains('is-open')) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dx < 58 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    event.preventDefault();
    quoteMessage(start.id);
  }, true);

  document.addEventListener('pointercancel', () => { swipeStart = null; }, true);
  document.addEventListener('submit', event => { if (!app.classList.contains('is-open') || !event.target.matches('.doubao-composer')) return; event.preventDefault(); const input=app.querySelector('#doubaoInput'); const value=input?.value.trim(); if(value){input.value='';send(value);} });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && app.classList.contains('is-open') && editingMessageId) {
      editingMessageId = '';
      render();
      return;
    }
    if (event.key === 'Escape' && app.classList.contains('is-open') && (selectionMode || quotedMessageId)) {
      selectionMode = false;
      selectedRoundIds.clear();
      quotedMessageId = '';
      render();
      return;
    }
    if (!app.classList.contains('is-open') || event.target.id !== 'doubaoInput' || event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.target.form?.requestSubmit();
  });
  window.IdealMachineDoubao = { askHidden };
  window.IdealMachineApps=window.IdealMachineApps||{};
  window.IdealMachineApps.doubao={name:'豆包'};
})();
