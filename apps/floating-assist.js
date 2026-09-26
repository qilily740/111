(() => {
  const settingsKey = 'ideal-machine-floating-assist-v1';
  const errorsKey = 'ideal-machine-system-errors-v1';
  const callsKey = 'ideal-machine-api-calls-v1';
  const appCatalog = {
    liaotian:['聊天','assets/icons/default-ios17/liaotian.webp'], ta:['Ta','assets/icons/default-ios17/ta.webp'],
    luntan:['论坛','assets/icons/default-ios17/luntan.webp'], xiangce:['相册','assets/icons/default-ios17/xiangce.webp'],
    rili:['日历','assets/icons/default-ios17/rili.webp'], jiyiku:['记忆库','assets/icons/default-ios17/jiyiku.webp'],
    yinyue:['音乐','assets/icons/default-ios17/yinyue.webp'], doubao:['豆包','assets/icons/default-ios17/doubao.webp'],
    gouwu:['购物','assets/icons/default-ios17/gouwu.webp'], ifshikong:['if时空','assets/icons/default-ios17/ifshikong.webp'],
    qinglvkongjian:['情侣空间','assets/icons/default-ios17/qinglvkongjian.webp'], shijieshu:['世界书','assets/icons/default-ios17/shijieshu.webp'],
    shezhi:['设置','assets/icons/default-ios17/shezhi.webp'], debate:['辩论','assets/icons/default-ios17/debate.webp'],
    fanfic:['同人文','assets/icons/default-ios17/fanfic.webp'], magazine:['杂志社','assets/icons/default-ios17/magazine.webp']
  };
  const defaults = { enabled:true, idleOpacity:.18, size:60, mode:'pill', apps:['liaotian','ta','jiyiku','shezhi'], side:'right', y:.56 };
  const readJson = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } };
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const readSettings = () => {
    const stored = readJson(settingsKey, {});
    const next = { ...defaults, ...stored };
    // 将旧版的默认 48px 迁移到新的默认 60px；迁移后用户仍可自行输入其他尺寸。
    if (stored.size === 48 && stored.sizeMigration !== '60px-v1') {
      next.size = 60;
      next.sizeMigration = '60px-v1';
      writeJson(settingsKey, next);
    }
    return next;
  };
  function assignedModel(scope = '') {
    try {
      const api = readSettings().api || {};
      const profile = (api.profiles || []).find(item => item.id === api.activeProfileId) || {};
      const assignments = { ...(api.assignments || {}), ...(profile.assignments || {}) };
      return cleanText(assignments[scope] || api.selected?.[0] || profile.selected?.[0] || api.models?.[0] || profile.models?.[0] || api.availableModels?.[0] || '');
    } catch { return ''; }
  }
  const cleanText = value => String(value ?? '').replace(/Bearer\s+[^\s]+/gi, 'Bearer ••••').replace(/sk-[\w-]+/gi, '••••').slice(0, 600);
  const escapeHtml = value => cleanText(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const timeText = stamp => new Date(stamp).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });
  const dateTimeText = stamp => { const date = new Date(stamp); return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
  let settings = readSettings();
  let errors = Array.isArray(readJson(errorsKey, [])) ? readJson(errorsKey, []).slice(0, 50) : [];
  // 清理旧版曾记录的自身实现错误；当前版本已把设置面板刷新函数放到统一作用域。
  const staleSettingsErrors = errors.filter(item => /renderSettingsPanels is not defined/i.test(String(item?.message || '')));
  if (staleSettingsErrors.length) {
    errors = errors.filter(item => !/renderSettingsPanels is not defined/i.test(String(item?.message || '')));
    writeJson(errorsKey, errors);
  }
  let calls = Array.isArray(readJson(callsKey, [])) ? readJson(callsKey, []).slice(0, 100) : [];
  calls = calls.map(item => ({
    ...item,
    purpose: /^forum(?:-|$)/.test(String(item?.scope || '')) ? callPurpose(String(item?.scope || 'forum'), '', {}) : item?.purpose,
    model: item?.model || ((item?.isModelCall || /^(?:chat(?:-|$)|debate$|ta$|ifshikong$|couple$|shopping$|magazine-background$|worldbook$|vector$)/.test(String(item?.scope || ''))) ? (() => { try { return cleanText(window.IdealMachineAPI?.getModel?.(item.scope) || window.IdealMachineAPI?.getModel?.('chat') || assignedModel(item.scope) || ''); } catch { return assignedModel(item.scope); } })() : ''),
    isModelCall: typeof item?.isModelCall === 'boolean'
      ? item.isModelCall
      : /^(?:chat(?:-|$)|debate$|ta$|ifshikong$|couple$|shopping$|magazine-background$|worldbook$|vector$)/.test(String(item?.scope || ''))
        && !/^chat-music/.test(String(item?.scope || ''))
  }));
  let activeCalls = 0;
  let currentView = 'main';
  let floatingSettingsSection = null;
  let settingsPanelView = 'api';

  // 调用面板只记录真正的 API/模型请求；图片、脚本、样式和本地资源读取不属于 API 调用。
  function shouldTrackRequest(scope, rawUrl, init, purpose, isModelCall, endpointPath) {
    const url = String(rawUrl || '');
    const path = String(endpointPath || '');
    let accept = '';
    try { accept = new Headers(init?.headers || {}).get('accept') || ''; } catch {}
    if (/^(?:data:|blob:|idb:)/i.test(url)) return false;
    if (/image\//i.test(accept)) return false;
    // 设置中的“拉取模型”只是读取供应商可用模型列表，不是一次模型调用，
    // 不应占用调用面板的记录和进行中计数。
    if (!isModelCall && /\/(?:models)(?:[/?]|$)/i.test(path)) return false;
    if (/(?:读取|加载|导入|下载).*(?:图片|图像|封面|头像|壁纸|贴纸|资源)|下载生成结果/.test(String(purpose || ''))) return false;
    if (!isModelCall && /\.(?:png|jpe?g|gif|webp|svg|ico|css|js|mjs|woff2?|ttf)(?:[?#]|$)/i.test(path)) return false;
    const knownApiEndpoint = /\/(?:chat\/completions|embeddings|responses|models|config|subscribe|activation\/verify|images)(?:[/?]|$)/i.test(path)
      || /(?:archive\.org\/metadata|api\.audius\.co\/v1\/)/i.test(url);
    if (!isModelCall && !knownApiEndpoint && /(?:^|\/)(?:assets?|static|images?|avatars?|wallpapers?|stickers?|covers?|icons?)(?:\/|$)/i.test(path)) return false;
    return Boolean(isModelCall || init?.idealPurpose || scope !== 'shared' || knownApiEndpoint);
  }

  calls = calls.filter(item => item?.purpose !== '设置 App－读取 API 模型列表' && !/(?:读取|加载|导入|下载).*(?:图片|图像|封面|头像|壁纸|贴纸|资源)|下载生成结果/.test(String(item?.purpose || '')));
  writeJson(callsKey, calls);

  function callPurpose(scope, rawUrl = '', init = {}) {
    const explicitPurpose = cleanText(init?.idealPurpose || '');
    if (explicitPurpose) return explicitPurpose;
    const body = String(init?.body || '');
    const match = (...patterns) => patterns.some(pattern => pattern.test(body));
    if (scope === 'shared') {
      if (/\/activation\/verify/.test(rawUrl)) return '系统 App－验证功能激活码';
      if (/\/embeddings(?:\?|$)/.test(rawUrl)) return match(/连接测试|测试向量/) ? '设置 App－测试向量模型连接' : '记忆库 App－生成记忆语义向量';
      if (/\/models(?:\?|$)/.test(rawUrl)) return '设置 App－读取 API 模型列表';
      if (/\/config(?:\?|$)/.test(rawUrl)) return '设置 App－读取系统通知配置';
      if (/\/subscribe(?:\?|$)/.test(rawUrl)) return '设置 App－订阅系统通知';
      if (/archive\.org\/metadata/.test(rawUrl)) return '音乐 App－读取公共音乐目录';
      if (/api\.audius\.co\/v1\/search/.test(rawUrl)) return '音乐 App－搜索 Audius 歌曲';
      if (match(/同人文开篇|创作同人文开篇/)) return '同人文 App－创作故事开篇';
      if (match(/续写下一章|沿用以下故事设定续写/)) return '同人文 App－续写下一章';
      if (match(/重新创作下面这篇同人文|章节重写/)) return '同人文 App－重新生成章节';
      if (match(/记忆压缩|核心记忆|长期记忆/)) return '记忆库 App－整理聊天摘要与核心记忆';
      if (match(/平行时空|本时空生成预设/)) return 'if 时空 App－生成时空故事回复';
      if (match(/角色日程生成器|CALENDAR｜/)) return 'Ta App－生成角色日程';
      if (match(/顶号功能|Takeover Sender|takeoverMessages/)) return 'Ta App－生成角色顶号消息';
      if (match(/查手机|查岗|SECRET CHECK/)) return 'Ta App－生成角色查手机剧情';
      if (match(/豆包/)) return '豆包 App－生成聊天回复';
      if (/^data:|^blob:|^idb:image:/.test(rawUrl)) return '相册 App－读取本地图片';
      if (/\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(rawUrl)) return '相册 App－导入网络图片';
    }
    const labels = {
      chat:'聊天 App－生成角色回复、心声与音乐选择',
      'chat-background':'聊天 App－后台生成角色回复',
      'chat-moments-background':'聊天 App－后台生成朋友圈互动',
      'chat-thought':'聊天 App－单独补生成或重写角色心声',
      'chat-translation':'聊天 App－翻译角色原文',
      'chat-offline':'聊天 App－生成线下见面回复',
      'chat-video-call':'聊天 App－生成视频通话回复',
      'chat-video-call-summary':'聊天 App－整理视频通话总结',
      'chat-image-generation':'聊天 App－生成聊天图片',
      'chat-music':'聊天 App－搜索并核验角色要分享的歌曲',
      'chat-music-play':'聊天 App－获取已分享歌曲的播放地址',
      debate:'辩论 App－生成辩论内容', ta:'Ta App－生成角色手机内容',
      shopping:'购物 App－生成商品或陪逛内容', couple:'情侣空间 App－生成互动内容',
      ifshikong:'if 时空 App－生成平行时空内容',
      image:'生图 App－生成图片', album:'相册 App－处理图片',
      vector:'记忆库 App－生成语义向量', 'magazine-background':'杂志社 App－生成杂志内容', worldbook:'世界书 App－AI 分析世界书',
      notifications:'设置 App－连接通知服务',
      forum:'论坛 App－生成论坛内容',
      'forum-interaction':'论坛 App－生成论坛帖子互动',
      'forum-discover':'论坛 App－生成发现页推荐'
    };
    if (scope === 'music') {
      if (/\/song\//.test(rawUrl)) return '音乐 App－获取歌曲播放地址';
      if (/\/search/.test(rawUrl)) return '音乐 App－搜索歌曲';
      if (/\/lyric/.test(rawUrl)) return '音乐 App－同步歌词';
      if (/\/user\/sync/.test(rawUrl)) return '音乐 App－同步网易云账号与歌单';
      if (/\/auth\/qr/.test(rawUrl)) return '音乐 App－网易云扫码登录';
      if (/\/auth\/logout/.test(rawUrl)) return '音乐 App－退出网易云账号';
      return '音乐 App－连接音乐服务';
    }
    if (scope === 'notifications') return /\/subscribe(?:\?|$)/.test(rawUrl) ? '设置 App－订阅系统通知' : '设置 App－读取系统通知配置';
    if (scope === 'chat') {
      if (/一起看书|阅读面板/.test(body)) return '聊天 App－生成一起看书讨论回复';
      if (/群聊|群成员|多人对话/.test(body)) return '聊天 App－生成群聊角色回复';
      return labels.chat;
    }
    if (scope === 'shopping') {
      if (match(/即时外卖平台的搜索结果生成器/)) return '购物 App－搜索外卖';
      if (match(/即时外卖平台的推荐策划/)) return '购物 App－随机推荐外卖';
      if (match(/购物搜索商品生成器/)) return '购物 App－搜索商品';
      if (match(/随机推荐策划/)) return '购物 App－随机推荐商品';
      if (match(/购物推荐商品策划/)) return '购物 App－按角色喜好推荐商品';
      if (match(/以角色身份送礼/)) return '购物 App－生成角色赠礼留言';
    }
    if (scope === 'ta') {
      if (match(/角色日程生成器|CALENDAR｜/)) return 'Ta App－生成角色日程';
      if (match(/顶号功能|Takeover Sender|takeoverMessages/)) return 'Ta App－生成角色顶号消息';
      if (match(/查手机|查岗|SECRET CHECK/)) return 'Ta App－生成角色查手机剧情';
      if (match(/手机内容|手机页面|应用内容/)) return 'Ta App－生成角色手机内容';
    }
    if (scope === 'couple') {
      if (match(/情书|信件/)) return '情侣空间 App－生成情书内容';
      if (match(/愿望|心愿/)) return '情侣空间 App－生成心愿互动';
      if (match(/纪念日/)) return '情侣空间 App－生成纪念日互动';
      return '情侣空间 App－生成情侣互动回复';
    }
    if (scope === 'debate') {
      if (match(/辩题|随机题目/)) return '辩论 App－生成辩题';
      if (match(/裁判|判定|胜负/)) return '辩论 App－生成裁判结果';
      return '辩论 App－生成本轮辩论发言';
    }
    if (scope === 'ifshikong') return match(/创建|开篇|世界前提/) ? 'if 时空 App－创建平行时空' : 'if 时空 App－生成时空故事回复';
    return labels[scope] || `${scope || '系统'}－调用服务`;
  }

  function usageParts(usage = {}) {
    const inputTokens = Number(usage?.prompt_tokens ?? usage?.input_tokens ?? usage?.promptTokens ?? 0) || 0;
    const outputTokens = Number(usage?.completion_tokens ?? usage?.output_tokens ?? usage?.completionTokens ?? 0) || 0;
    const totalTokens = Number(usage?.total_tokens ?? usage?.totalTokens ?? 0) || (inputTokens + outputTokens);
    return { inputTokens, outputTokens, totalTokens };
  }

  const httpReason = status => ({
    400:'请求内容或参数格式不符合接口要求',
    401:'API 密钥无效、已过期，或没有完成身份验证',
    403:'当前 API 密钥或账号没有访问该模型/功能的权限',
    404:'接口地址、模型名称或请求的资源不存在',
    408:'接口等待请求超时',
    409:'请求与服务端当前状态冲突',
    413:'发送的正文、图片或上下文超过接口大小限制',
    422:'请求格式正确，但参数内容无法被接口处理',
    429:'请求过于频繁、并发过高，或账号额度/余额已经用完',
    500:'API 服务内部发生错误',
    502:'API 网关没有收到上游模型服务的有效响应',
    503:'API 服务暂时不可用，可能正在维护、过载或上游模型离线',
    504:'API 网关等待上游模型响应超时'
  }[Number(status)] || 'API 返回了失败状态');

  function responseErrorText(payload) {
    if (payload == null) return '';
    if (typeof payload === 'string') return payload.trim();
    const error = payload.error;
    const candidates = [
      typeof error === 'string' ? error : '', error?.message, error?.detail, error?.error,
      payload.message, payload.detail, payload.reason, payload.error_description
    ];
    const message = candidates.find(value => typeof value === 'string' && value.trim());
    const metadata = [error?.type || payload.type, error?.code || payload.code].filter(Boolean).map(String);
    return [message, metadata.length ? `类型/代码：${metadata.join(' / ')}` : ''].filter(Boolean).join('\n');
  }

  async function readResponseError(response) {
    try {
      const text = (await response.clone().text()).trim();
      if (!text) return '';
      try { return responseErrorText(JSON.parse(text)); }
      catch { return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
    } catch { return ''; }
  }

  function addError(reason, source = '系统', extra = {}) {
    const message = cleanText(reason?.message || reason || '未知错误');
    if (!message || /AbortError|页面已关闭/i.test(message)) return;
    const item = { id:`error-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, time:Date.now(), source:cleanText(source), message, detail:cleanText(reason?.stack || extra.detail || '') };
    if (errors[0]?.message === item.message && Date.now() - errors[0].time < 10000) { errors[0].count = (errors[0].count || 1) + 1; errors[0].time = item.time; }
    else errors.unshift(item);
    errors = errors.slice(0, 50); writeJson(errorsKey, errors); updateBadge(); renderSettingsPanels();
  }

  async function copyError(errorId, button) {
    const item = errors.find(entry => entry.id === errorId);
    if (!item) return;
    const detailLines = String(item.detail || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const reasonLines = detailLines.filter(line => !/^(?:服务|模型|请求\s*ID)[:：]/i.test(line) && !/^(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?$/i.test(line));
    const providerReason = reasonLines.join('\n').replace(/^接口返回[:：]\s*/i, '').trim();
    const text = [String(item.message || '').trim(), providerReason].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).join('\n');
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0';
        document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
      }
      if (button) { button.textContent = '已复制'; setTimeout(() => { if (button.isConnected) button.textContent = '复制'; }, 1200); }
    } catch { if (button) button.textContent = '复制失败'; }
  }

  window.addEventListener('error', event => addError(event.error || event.message, event.filename?.split('/').pop() || '页面脚本'));
  window.addEventListener('unhandledrejection', event => addError(event.reason, '异步任务'));

  const originalRequest = window.IdealMachineFetch;
  if (typeof originalRequest === 'function' && !originalRequest.__floatingTracked) {
    const trackedRequest = async function(input, init = {}) {
      const started = Date.now();
      const scope = String(init.idealScope || 'shared');
      const rawUrl = String(input?.url || input || '');
      const purpose = callPurpose(scope, rawUrl, init);
      let model = '';
      try { model = cleanText(JSON.parse(String(init?.body || '{}'))?.model || ''); } catch {}
      const endpointLooksLikeModel = /\/(?:chat\/completions|embeddings|responses)(?:\?|$)/i.test(rawUrl);
      const isModelCall = Boolean(model || endpointLooksLikeModel);
      if (isModelCall && !model) {
        try { model = cleanText(window.IdealMachineAPI?.getModel?.(scope) || window.IdealMachineAPI?.getModel?.('chat') || assignedModel(scope) || ''); } catch { model = assignedModel(scope); }
      }
      let host = 'API';
      let endpointPath = '';
      try { host = new URL(rawUrl, location.href).host || '本机'; } catch {}
      try { endpointPath = new URL(rawUrl, location.href).pathname || ''; } catch {}
      if (!shouldTrackRequest(scope, rawUrl, init, purpose, isModelCall, endpointPath)) return originalRequest(input, init);
      activeCalls += 1; updateBadge();
      try {
        const response = await originalRequest(input, init);
        const call = { id:`call-${started}-${Math.random().toString(36).slice(2,7)}`, time:started, scope, purpose, model, isModelCall, host, status:response.status, ok:response.ok, duration:Date.now()-started, tokens:0, inputTokens:0, outputTokens:0 };
        calls.unshift(call); calls = calls.slice(0, 100); writeJson(callsKey, calls); renderSettingsPanels();
        if (!response.ok) {
          const providerReason = await readResponseError(response);
          const summary = `HTTP ${response.status}：${httpReason(response.status)}`;
          const requestId = response.headers.get('x-request-id') || response.headers.get('request-id') || response.headers.get('cf-ray') || '';
          const detail = [
            `接口返回：${providerReason || '没有提供更具体的错误正文'}`,
            `服务：${host}${endpointPath}`,
            model ? `模型：${model}` : '',
            requestId ? `请求 ID：${requestId}` : ''
          ].filter(Boolean).join('\n');
          addError(summary, purpose, { detail });
        }
        try { response.clone().json().then(data => { const usage = usageParts(data?.usage || data?.data?.usage || {}); if (usage.totalTokens || usage.inputTokens || usage.outputTokens) { call.tokens = usage.totalTokens; call.inputTokens = usage.inputTokens; call.outputTokens = usage.outputTokens; writeJson(callsKey, calls); renderSettingsPanels(); renderPanel(); } }).catch(() => {}); } catch {}
        return response;
      } catch (error) {
        const aborted = error?.name === 'AbortError';
        calls.unshift({ id:`call-${started}-${Math.random().toString(36).slice(2,7)}`, time:started, scope, purpose, model, isModelCall, host, status:0, ok:false, duration:Date.now()-started, aborted, tokens:0, inputTokens:0, outputTokens:0 });
        calls = calls.slice(0, 100); writeJson(callsKey, calls); renderSettingsPanels();
        if (!aborted) addError(error, purpose, { detail:host });
        throw error;
      } finally { activeCalls = Math.max(0, activeCalls - 1); updateBadge(); renderPanel(); }
    };
    trackedRequest.__floatingTracked = true;
    window.IdealMachineFetch = trackedRequest;
  }

  const root = document.createElement('div');
  root.className = 'ideal-floating-assist';
  root.innerHTML = `<section class="ideal-assist-panel" data-assist-panel aria-hidden="true"></section><button class="ideal-assist-orb" data-assist-orb type="button" aria-label="打开悬浮工具"><span class="ideal-assist-orb-inner" aria-hidden="true"></span><img data-assist-orb-image alt=""><i data-assist-badge></i></button>`;
  document.body.appendChild(root);
  const orb = root.querySelector('[data-assist-orb]');
  const panel = root.querySelector('[data-assist-panel]');
  let orbImageToken = 0;
  let orbPreviewToken = 0;

  async function resolveOrbImage(source) {
    let resolved = String(source || '').trim();
    if (resolved.startsWith('idb:image:') && window.IdealMachineGetImage) resolved = String(await window.IdealMachineGetImage(resolved).catch(() => '') || '');
    return resolved;
  }

  async function applyOrbImage(source) {
    const token = ++orbImageToken;
    const image = root.querySelector('[data-assist-orb-image]');
    const resolved = await resolveOrbImage(source);
    if (token !== orbImageToken || !image) return;
    image.src = resolved;
    root.classList.toggle('has-custom-orb', Boolean(resolved));
  }

  async function syncOrbPreview(source) {
    const token = ++orbPreviewToken;
    const preview = floatingSettingsSection?.querySelector('[data-floating-orb-preview]');
    const label = floatingSettingsSection?.querySelector('[data-floating-orb-preview-label]');
    if (!preview || !label) return;
    const resolved = await resolveOrbImage(source);
    if (token !== orbPreviewToken) return;
    preview.src = resolved;
    preview.hidden = !resolved;
    label.textContent = resolved ? '自定义样式' : '默认样式';
  }

  function saveOrbImage(source) {
    const value = String(source || '').trim();
    settings = { ...readSettings(), orbImage:value };
    writeJson(settingsKey, settings);
    applySettings();
  }

  function applySettings() {
    settings = readSettings();
    root.hidden = !settings.enabled;
    const edge = ['left','right','top','bottom'].includes(settings.side) ? settings.side : 'right';
    const horizontalSide = edge === 'top' || edge === 'bottom' ? (Number(settings.x ?? .9) < .5 ? 'left' : 'right') : edge;
    root.dataset.side = horizontalSide;
    root.dataset.edge = edge;
    root.dataset.mode = ['pill','grid','rail'].includes(settings.mode) ? settings.mode : 'pill';
    root.style.setProperty('--assist-idle-opacity', String(Math.max(.08, Math.min(.8, Number(settings.idleOpacity) || .18))));
    root.style.setProperty('--assist-size', `${Math.max(40, Math.min(62, Number(settings.size) || 60))}px`);
    applyOrbImage(settings.orbImage);
    positionOrb(); renderPanel(); updateBadge();
  }
  function positionOrb() {
    const size = Math.max(40, Math.min(62, Number(settings.size) || 60));
    const top = Math.max(12, Math.min(innerHeight - size - 12, Number(settings.y || .56) * innerHeight));
    const side = settings.side === 'left' || settings.side === 'top' ? 'left' : 'right';
    const x = Math.max(7, Math.min(innerWidth - size - 7, Number(settings.x ?? (side === 'left' ? .1 : .9)) * innerWidth));
    root.style.setProperty('--assist-x', `${x}px`);
    root.style.setProperty('--assist-y', `${top}px`);
  }
  function updateBadge() {
    const badge = root.querySelector('[data-assist-badge]');
    if (!badge) return;
    badge.className = activeCalls ? 'is-api' : errors.length ? 'is-error' : '';
    badge.textContent = activeCalls ? String(Math.min(9, activeCalls)) : errors.length ? String(Math.min(9, errors.length)) : '';
  }
  function appButton(key) {
    const item = appCatalog[key]; if (!item) return '';
    return `<button class="ideal-assist-app" data-assist-app="${key}" type="button"><span class="ideal-assist-app-icon"><img src="${item[1]}" alt=""></span><span>${escapeHtml(item[0])}</span></button>`;
  }
  function mainPanel() {
    const selected = (Array.isArray(settings.apps) ? settings.apps : defaults.apps).filter(key => appCatalog[key]).slice(0, 8);
    return `<header><b><span>快捷</span><span>工具</span></b><button data-assist-close type="button">×</button></header><div class="ideal-assist-apps">${selected.map(appButton).join('')}</div><div class="ideal-assist-tools"><button data-assist-view="errors" type="button"><i class="is-error">!</i><span>报错</span><b>${errors.length || '正常'}</b></button><button data-assist-view="api" type="button"><i class="is-api">↗</i><span>API</span><b>${activeCalls ? `${activeCalls} 调用中` : calls.length ? '查看' : '暂无'}</b></button></div>`;
  }
  function errorsPanel() {
    return `<header><button data-assist-view="main" type="button">‹</button><b>最近报错</b><button data-assist-clear="errors" type="button">清空</button></header><div class="ideal-assist-list">${errors.length ? errors.slice(0,5).map(item => `<details><summary><i>!</i><span><b>${escapeHtml(item.source)}</b><small>${timeText(item.time)}${item.count > 1 ? ` · ${item.count} 次` : ''}</small></span></summary><p>${escapeHtml(item.message)}</p>${item.detail ? `<code>${escapeHtml(item.detail)}</code>` : ''}<button class="ideal-assist-copy-error" data-assist-copy-error="${escapeHtml(item.id)}" type="button">复制</button></details>`).join('') : '<div class="ideal-assist-empty">最近运行正常<br><small>还没有捕获到报错</small></div>'}</div>`;
  }
  function apiPanel() {
    const recent = calls.slice(0,5), success = calls.filter(item => item.ok).length, failed = calls.filter(item => !item.ok && !item.aborted).length;
    return `<header><button data-assist-view="main" type="button">‹</button><b>API 调用</b><button data-assist-clear="api" type="button">清空</button></header><div class="ideal-assist-api-summary"><span><b>${activeCalls}</b><small>调用中</small></span><span><b>${success}</b><small>成功</small></span><span><b>${failed}</b><small>失败</small></span></div><div class="ideal-assist-list">${recent.length ? recent.map(item => { const modelText = item.model || (item.isModelCall ? '历史记录未保存' : '非模型调用'); const hasUsage = Boolean(item.inputTokens || item.outputTokens || item.tokens); const tokenText = hasUsage ? `输入 ${item.inputTokens || 0} · 输出 ${item.outputTokens || 0} · 合计 ${item.tokens || (item.inputTokens || 0) + (item.outputTokens || 0)} tokens` : item.isModelCall ? '输入 未返回 · 输出 未返回 · 合计 未返回' : ''; const statusText = item.ok ? '成功' : Number(item.status) > 0 ? String(item.status) : (item.aborted ? '取消' : '网络错误'); return `<article><i class="${item.ok ? 'is-ok' : item.aborted ? 'is-muted' : 'is-bad'}"></i><span><b>${escapeHtml(dateTimeText(item.time))}　${escapeHtml(item.purpose || callPurpose(item.scope, ''))}</b><small class="ideal-assist-call-meta">${escapeHtml(modelText)}<br>耗时 ${item.duration}ms${tokenText ? `<br>${escapeHtml(tokenText)}` : ''}</small></span><time>${escapeHtml(statusText)}</time></article>`; }).join('') : '<div class="ideal-assist-empty">暂无调用记录</div>'}</div>`;
  }
  function renderPanel() {
    if (!panel || panel.getAttribute('aria-hidden') === 'true') return;
    panel.innerHTML = currentView === 'errors' ? errorsPanel() : currentView === 'api' ? apiPanel() : mainPanel();
    if (typeof renderSettingsPanels === 'function') renderSettingsPanels();
  }
  function openPanel(view = 'main') { currentView = view; panel.setAttribute('aria-hidden','false'); root.classList.add('is-open'); renderPanel(); }
  function closePanel() { panel.setAttribute('aria-hidden','true'); root.classList.remove('is-open'); currentView = 'main'; }
  function dismissPanel() {
    if (currentView !== 'main') { currentView = 'main'; renderPanel(); return; }
    closePanel();
  }
  function closeOpenApps() {
    const appClosers = [
      ['.chat-app','[data-chat-close]'], ['.ta-app','[data-ta-close]'], ['.forum-app','[data-forum-close]'],
      ['.album-app','[data-album-close]'], ['.calendar-app','[data-calendar-close]'], ['.memory-library-app','[data-memory-close]'],
      ['.music-app','[data-music-close]'], ['.doubao-app','[data-doubao-close]'], ['.shopping-app','[data-shop-close]'],
      ['.ifspace-app','[data-if-close]'], ['.couple-app','[data-couple-close]'], ['.worldbook-app','[data-world-close]'],
      ['.settings-app','[data-settings-close]'], ['.beauty-app','[data-beauty-close]'], ['.debate-app','[data-debate-close]'],
      ['.fanfic-app','[data-fanfic-close]'], ['.magazine-app','[data-magazine-close]']
    ];
    appClosers.forEach(([appSelector, closeSelector]) => {
      const openApp = document.querySelector(`${appSelector}.is-open`);
      if (!openApp) return;
      const closeButton = openApp.querySelector(closeSelector);
      if (closeButton) closeButton.click();
      else { openApp.classList.remove('is-open'); openApp.setAttribute('aria-hidden', 'true'); }
    });
    document.querySelector('.folder-app-shell.is-open [data-folder-app-close]')?.click();
    document.querySelector('.desktop-folder-layer.is-open [data-folder-close]')?.click();
  }

  function renderSettingsPanels() {
    if (!floatingSettingsSection) return;
    const tabs = floatingSettingsSection.querySelector('[data-floating-settings-tabs]');
    const host = floatingSettingsSection.querySelector('[data-floating-settings-panel]');
    tabs?.querySelectorAll('[data-floating-settings-view]').forEach(button => button.classList.toggle('is-active', button.dataset.floatingSettingsView === settingsPanelView));
    if (!host) return;
    if (settingsPanelView === 'errors') {
      const recent = errors.slice(0, 5);
      host.innerHTML = `<header><b>最近报错</b><span><small>${errors.length} 条记录</small><button data-assist-clear="errors" type="button">清空</button></span></header>${recent.length ? `<div class="settings-floating-panel-list">${recent.map(item => `<details><summary><b>${escapeHtml(item.source || '系统')} · ${escapeHtml(timeText(item.time))}</b><small>${escapeHtml(item.message)}${item.count > 1 ? ` · ${item.count} 次` : ''}</small></summary><p>${escapeHtml(item.message)}</p>${item.detail ? `<code>${escapeHtml(item.detail)}</code>` : ''}<button class="ideal-assist-copy-error" data-assist-copy-error="${escapeHtml(item.id)}" type="button">复制</button></details>`).join('')}</div>` : '<div class="settings-floating-panel-empty">最近运行正常</div>'}`;
      return;
    }
    const recent = calls.slice(0, 5);
    host.innerHTML = `<header><b>API 调用</b><small>${calls.length} 条记录</small></header>${recent.length ? `<div class="settings-floating-panel-list">${recent.map(item => {
      const modelText = item.model || (item.isModelCall ? '历史记录未保存' : '非模型调用');
      const usage = item.inputTokens || item.outputTokens || item.tokens
        ? `输入 ${item.inputTokens || 0} · 输出 ${item.outputTokens || 0} · 合计 ${item.tokens || (item.inputTokens || 0) + (item.outputTokens || 0)} tokens`
        : item.isModelCall ? '输入 未返回 · 输出 未返回 · 合计 未返回' : '';
      const status = item.ok ? '成功' : Number(item.status) > 0 ? String(item.status) : item.aborted ? '取消' : '网络错误';
      return `<article><b>${escapeHtml(dateTimeText(item.time))}　${escapeHtml(item.purpose || callPurpose(item.scope, ''))}</b><small>${escapeHtml(modelText)} · ${item.duration}ms${usage ? ` · ${escapeHtml(usage)}` : ''}</small><em>${escapeHtml(status)}</em></article>`;
    }).join('')}</div>` : '<div class="settings-floating-panel-empty">暂无 API 调用记录</div>'}`;
  }

  let drag = null;
  let snapTimer = 0;
  orb.addEventListener('pointerdown', event => {
    clearTimeout(snapTimer);
    root.classList.remove('is-snapping');
    const rect = orb.getBoundingClientRect();
    // 拖动时圆球跟随手指；松手时吸附到最近的屏幕边缘。
    orb.style.left = `${rect.left}px`;
    orb.style.top = `${rect.top}px`;
    orb.style.right = 'auto';
    orb.style.bottom = 'auto';
    drag = { id:event.pointerId, x:event.clientX, y:event.clientY, offsetX:event.clientX-rect.left, offsetY:event.clientY-rect.top, moved:false };
    orb.setPointerCapture(event.pointerId);
    root.classList.add('is-active');
  });
  orb.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX-drag.x,event.clientY-drag.y) > 5) drag.moved = true;
    if (drag.moved) {
      const size = orb.offsetWidth;
      const x = Math.max(7, Math.min(innerWidth-size-7, event.clientX-drag.offsetX));
      const y = Math.max(12, Math.min(innerHeight-size-12, event.clientY-drag.offsetY));
      orb.style.left = `${x}px`;
      orb.style.right = 'auto';
      root.style.setProperty('--assist-y', `${y}px`);
      settings.y = y / innerHeight;
    }
  });
  orb.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const finishedDrag = drag; const moved = finishedDrag.moved; drag = null;
    if (moved) {
      const size = orb.offsetWidth;
      const x = Math.max(7, Math.min(innerWidth-size-7, event.clientX-finishedDrag.offsetX));
      const y = Math.max(7, Math.min(innerHeight-size-7, event.clientY-finishedDrag.offsetY));
      const distances = { left:x, right:innerWidth-size-x, top:y, bottom:innerHeight-size-y };
      settings.side = Object.keys(distances).reduce((nearest, edge) => distances[edge] < distances[nearest] ? edge : nearest, 'left');
      settings.x = x / innerWidth;
      settings.y = y / innerHeight;
      const targetX = settings.side === 'left' ? 7 : settings.side === 'right' ? innerWidth-size-7 : x;
      const targetY = settings.side === 'top' ? 7 : settings.side === 'bottom' ? innerHeight-size-7 : y;
      root.classList.remove('is-active');
      root.classList.add('is-snapping');
      orb.style.left = `${x}px`;
      orb.style.top = `${y}px`;
      orb.style.right = 'auto';
      orb.style.bottom = 'auto';
      requestAnimationFrame(() => { orb.style.left = `${targetX}px`; orb.style.top = `${targetY}px`; });
      writeJson(settingsKey, settings);
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        root.classList.remove('is-snapping');
        orb.style.left = '';
        orb.style.top = '';
        orb.style.right = '';
        orb.style.bottom = '';
        applySettings();
      }, 300);
    }
    else {
      root.classList.remove('is-active');
      orb.style.left = '';
      orb.style.top = '';
      orb.style.right = '';
      orb.style.bottom = '';
      positionOrb();
      root.classList.contains('is-open') ? dismissPanel() : openPanel();
    }
  });
  orb.addEventListener('pointercancel', event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    root.classList.remove('is-active');
    root.classList.remove('is-snapping');
    clearTimeout(snapTimer);
    orb.style.left = '';
    orb.style.top = '';
    orb.style.right = '';
    orb.style.bottom = '';
    positionOrb();
  });
  panel.addEventListener('click', event => {
    const copyErrorButton = event.target.closest('[data-assist-copy-error]');
    if (copyErrorButton) { copyError(copyErrorButton.dataset.assistCopyError, copyErrorButton); return; }
    const app = event.target.closest('[data-assist-app]');
    if (app) { const appKey = app.dataset.assistApp; closePanel(); closeOpenApps(); document.querySelector(`[data-app-key="${CSS.escape(appKey)}"]`)?.click(); return; }
    const view = event.target.closest('[data-assist-view]'); if (view) { currentView = view.dataset.assistView; renderPanel(); return; }
    if (event.target.closest('[data-assist-close]')) { closePanel(); return; }
    const clear = event.target.closest('[data-assist-clear]');
    if (clear?.dataset.assistClear === 'errors') { errors = []; writeJson(errorsKey, errors); updateBadge(); renderSettingsPanels(); renderPanel(); }
    if (clear?.dataset.assistClear === 'api') { calls = []; writeJson(callsKey, calls); renderSettingsPanels(); renderPanel(); }
  });
  document.addEventListener('pointerdown', event => { if (root.classList.contains('is-open') && !root.contains(event.target)) dismissPanel(); }, true);
  window.addEventListener('resize', positionOrb);

  function installSettingsSection() {
    const settingsApp = document.querySelector('.settings-app');
    const anchor = settingsApp?.querySelector('.settings-notification-section, .settings-storage-section');
    if (!settingsApp || !anchor || settingsApp.querySelector('.settings-floating-section')) return;
    anchor.insertAdjacentHTML('beforebegin', `<section class="settings-section settings-floating-section"><div class="settings-section-head"><div><span class="settings-eyebrow">QUICK ACCESS</span><h2>全局悬浮按键</h2><p>在理想机所有页面显示快捷入口、报错与 API 状态。</p></div><span class="settings-status" data-floating-status>已开启</span></div><div class="settings-notification-row"><div><b>显示悬浮按键</b><small>关闭后可随时回到这里重新开启</small></div><label class="settings-notification-switch"><input type="checkbox" data-floating-enabled><i></i></label></div><div class="settings-floating-config" data-floating-config><div class="settings-floating-controls"><label class="settings-floating-mode"><span>面板样式</span><select data-floating-mode><option value="pill">胶囊面板</option><option value="grid">网格面板</option><option value="rail">侧边栏</option></select></label><div class="settings-floating-number-row"><label><span>静止透明度</span><span class="settings-floating-number"><input data-floating-opacity type="number" inputmode="numeric" min="8" max="70" step="1"><i>%</i></span></label><label><span>按键大小</span><span class="settings-floating-number"><input data-floating-size type="number" inputmode="numeric" min="40" max="62" step="1"><i>px</i></span></label></div></div><div class="settings-floating-apps"><b>快捷 App</b><small>最多选择 8 个</small><div>${Object.entries(appCatalog).map(([key,item]) => `<label><input type="checkbox" value="${key}" data-floating-app><span class="settings-floating-app-icon"><img src="${item[1]}" alt=""></span><span>${escapeHtml(item[0])}</span></label>`).join('')}</div></div></div><div class="settings-floating-disabled-panels" data-floating-disabled-panels><div class="settings-floating-panel-tabs" data-floating-settings-tabs><button type="button" data-floating-settings-view="api">API 调用</button><button type="button" data-floating-settings-view="errors">最近报错</button></div><div class="settings-floating-panel-host" data-floating-settings-panel></div></div></section>`);
    const floatingSection = settingsApp.querySelector('.settings-floating-section');
    floatingSettingsSection = floatingSection;
    floatingSection.querySelector('.settings-notification-row')?.insertAdjacentHTML('afterend', `<div class="settings-floating-orb-style"><b>悬浮球样式</b><small>可使用本地图片、图片 URL 或理想机相册中的图片。</small><div class="settings-floating-orb-preview"><img data-floating-orb-preview alt="悬浮球预览"><span data-floating-orb-preview-label>默认样式</span></div><div class="settings-floating-orb-actions"><label>本地图片<input type="file" accept="image/*" data-floating-orb-local></label><button type="button" data-floating-orb-url-open>图片 URL</button><button type="button" data-floating-orb-album>相册 App</button><button type="button" data-floating-orb-reset>恢复默认样式</button></div><div class="settings-floating-orb-url" data-floating-orb-url-panel hidden><input type="url" data-floating-orb-url placeholder="粘贴图片 URL"><button type="button" data-floating-orb-url-save>应用</button></div></div>`);
    const floatingHeader = floatingSection.querySelector('.settings-section-head');
    floatingSection.classList.add('settings-collapsible');
    floatingSection.id = 'settings-floating-section';
    floatingHeader.classList.add('settings-collapse-toggle');
    floatingHeader.dataset.settingsCollapse = 'floating';
    floatingHeader.dataset.settingsCollapseReady = 'true';
    floatingHeader.setAttribute('role', 'button');
    floatingHeader.setAttribute('tabindex', '0');
    floatingHeader.setAttribute('aria-expanded', 'false');
    floatingHeader.setAttribute('aria-controls', floatingSection.id);
    const sync = () => {
      settings = readSettings();
      floatingSection.classList.toggle('is-disabled', settings.enabled === false);
      settingsApp.querySelector('[data-floating-enabled]').checked = settings.enabled !== false;
      settingsApp.querySelector('[data-floating-mode]').value = settings.mode;
      settingsApp.querySelector('[data-floating-opacity]').value = Math.round(settings.idleOpacity*100);
      settingsApp.querySelector('[data-floating-size]').value = settings.size;
      settingsApp.querySelector('[data-floating-status]').textContent = settings.enabled === false ? '已关闭' : '已开启';
      settingsApp.querySelectorAll('[data-floating-app]').forEach(input => input.checked = settings.apps.includes(input.value));
      settingsApp.querySelector('[data-floating-orb-url]').value = /^https?:\/\//i.test(String(settings.orbImage || '')) ? settings.orbImage : '';
      syncOrbPreview(settings.orbImage);
      renderSettingsPanels();
    };
    const saveFromControls = event => {
      if (!event.target.closest('.settings-floating-section')) return;
      const chosen = [...settingsApp.querySelectorAll('[data-floating-app]:checked')].map(input => input.value).slice(0,8);
      const opacity = Math.max(8, Math.min(70, Number(settingsApp.querySelector('[data-floating-opacity]').value) || 18));
      const size = Math.max(40, Math.min(62, Number(settingsApp.querySelector('[data-floating-size]').value) || 60));
      settings = { ...readSettings(), enabled:settingsApp.querySelector('[data-floating-enabled]').checked, mode:settingsApp.querySelector('[data-floating-mode]').value, idleOpacity:opacity/100, size, apps:chosen };
      writeJson(settingsKey, settings); sync(); applySettings();
    };
    settingsApp.addEventListener('change', event => {
      if (event.target.matches('[data-floating-app]') && settingsApp.querySelectorAll('[data-floating-app]:checked').length > 8) event.target.checked = false;
      saveFromControls(event);
    });
    settingsApp.addEventListener('click', event => {
      const panelView = event.target.closest('[data-floating-settings-view]');
      if (panelView) { settingsPanelView = panelView.dataset.floatingSettingsView === 'errors' ? 'errors' : 'api'; renderSettingsPanels(); return; }
      if (event.target.closest('[data-floating-orb-url-open]')) { const panel = settingsApp.querySelector('[data-floating-orb-url-panel]'); if (panel) panel.hidden = !panel.hidden; return; }
      if (event.target.closest('[data-floating-orb-url-save]')) {
        const value = settingsApp.querySelector('[data-floating-orb-url]')?.value.trim() || '';
        if (!/^(?:https?:\/\/|data:image\/)/i.test(value)) return window.alert('请输入有效的图片 URL。');
        if (/^https?:\/\//i.test(value)) window.IdealMachineAlbum?.archiveUrl?.(value, '悬浮球图标');
        saveOrbImage(value); return;
      }
      if (event.target.closest('[data-floating-orb-album]')) {
        if (!window.IdealMachineAlbum?.pick) return window.alert('理想机相册 App 还没有准备好。');
        window.IdealMachineAlbum.pick(value => { if (value) saveOrbImage(value); }); return;
      }
      if (event.target.closest('[data-floating-orb-reset]')) { saveOrbImage(''); return; }
      const copyButton = event.target.closest('[data-assist-copy-error]');
      if (copyButton) copyError(copyButton.dataset.assistCopyError, copyButton);
      const clearButton = event.target.closest('[data-assist-clear="errors"]');
      if (clearButton) { errors = []; writeJson(errorsKey, errors); updateBadge(); renderSettingsPanels(); renderPanel(); }
    });
    settingsApp.addEventListener('change', event => {
      const input = event.target.closest('[data-floating-orb-local]');
      const file = input?.files?.[0];
      if (!file) return;
      const read = window.IdealMachineReadImage
        ? window.IdealMachineReadImage(file, 512, .82)
        : new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(''); reader.readAsDataURL(file); });
      read.then(value => { if (value) saveOrbImage(String(value)); else window.alert('这张图片无法读取，请换一张图片再试。'); });
      input.value = '';
    });
    document.addEventListener('click', event => { if (event.target.closest('[data-app-key="shezhi"]')) setTimeout(sync); });
    sync();
  }
  installSettingsSection();
  applySettings();
  window.IdealMachineFloatingAssist = { addError, open:view => openPanel(view), settings:readSettings };
})();
