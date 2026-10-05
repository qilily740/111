(() => {
  const storageKey = 'ideal-machine-image-api';
  const activityKey = 'ideal-machine-image-activity';
  const previousBuiltInNegativePrompt = '低清晰度，模糊，畸形手指，多余肢体，重复人物，文字，水印，logo';
  const defaults = {
    endpoint: '',
    key: '',
    model: '',
    availableModels: [],
    selectedModels: [],
    profiles: [],
    activeProfileId: '',
    protocol: 'openai',
    chatSize: '1024x1024',
    momentSize: '1024x1024',
    quality: '',
    count: 1,
    positivePrompt: '',
    negativePrompt: ''
  };

  function readConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const config = { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
      if (config.negativePrompt === previousBuiltInNegativePrompt) config.negativePrompt = '';
      config.availableModels = Array.isArray(config.availableModels) ? config.availableModels : [];
      config.selectedModels = Array.isArray(config.selectedModels) ? config.selectedModels : (config.model ? [config.model] : []);
      config.profiles = Array.isArray(config.profiles) ? config.profiles : [];
      config.profiles = config.profiles.map(profile => ({
        ...profile,
        availableModels: Array.isArray(profile.availableModels) ? profile.availableModels : [],
        selectedModels: Array.isArray(profile.selectedModels) ? profile.selectedModels : (profile.model ? [profile.model] : [])
      }));
      if (!config.profiles.length && config.endpoint) {
        const id = `image-profile-${Date.now()}`;
        config.profiles = [{ id, name: config.endpoint, endpoint: config.endpoint, key: config.key, model: config.model, availableModels: config.availableModels, selectedModels: config.selectedModels, protocol: config.protocol, chatSize: config.chatSize, momentSize: config.momentSize, quality: config.quality, count: config.count, positivePrompt: config.positivePrompt, negativePrompt: config.negativePrompt }];
        config.activeProfileId = id;
      }
      config.activeProfileId = config.profiles.some(profile => profile.id === config.activeProfileId) ? config.activeProfileId : (config.profiles[0]?.id || '');
      delete config.chatDailyLimit;
      delete config.stylePrompt;
      delete config.steps;
      delete config.cfgScale;
      delete config.seed;
      delete config.sampler;
      delete config.autoChat;
      delete config.chatChance;
      delete config.chatCooldownMinutes;
      delete config.autoMoments;
      delete config.momentChance;
      return config;
    } catch {
      return { ...defaults };
    }
  }

  function saveConfig(config) {
    const value = { ...defaults, ...config };
    value.profiles = Array.isArray(value.profiles) ? value.profiles : [];
    delete value.chatDailyLimit;
    delete value.stylePrompt;
    delete value.steps;
    delete value.cfgScale;
    delete value.seed;
    delete value.sampler;
    delete value.autoChat;
    delete value.chatChance;
    delete value.chatCooldownMinutes;
    delete value.autoMoments;
    delete value.momentChance;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  function readActivity() {
    try {
      const saved = JSON.parse(localStorage.getItem(activityKey) || '{}');
      return { chat: Array.isArray(saved.chat) ? saved.chat : [], moments: Array.isArray(saved.moments) ? saved.moments : [] };
    } catch {
      return { chat: [], moments: [] };
    }
  }

  function imageEndpoint(endpoint) {
    const clean = String(endpoint || '').trim().replace(/\/$/, '');
    if (!clean) return '';
    if (/\/chat\/completions$/i.test(clean)) return clean.replace(/\/chat\/completions$/i, '/images/generations');
    return /\/images\/generations$/i.test(clean) ? clean : `${clean}/images/generations`;
  }

  function modelsEndpoint(endpoint) {
    const clean = String(endpoint || '').trim().replace(/\/$/, '')
      .replace(/\/(?:chat\/completions|images\/(?:generations|edits))$/i, '');
    if (!clean) return '';
    return /\/models$/i.test(clean) ? clean : `${clean}/models`;
  }

  async function imageModelsError(response) {
    let detail = '';
    try {
      const text = await response.text();
      if (text) {
        try {
          const payload = JSON.parse(text);
          const error = payload?.error;
          detail = typeof error === 'string' ? error : error?.message || payload?.message || payload?.detail || payload?.msg || '';
        } catch {
          detail = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    } catch {}
    detail = String(detail).replace(/Bearer\s+\S+/gi, 'Bearer [已隐藏]').replace(/(api[_ -]?key|token)\s*[:=]\s*\S+/gi, '$1=[已隐藏]').slice(0, 240);
    if (response.status === 401) {
      return `HTTP 401：生图服务拒绝了 API Key${detail ? `（${detail}）` : ''}。请确认填写的是该生图服务的有效 Key，且有读取模型列表权限。`;
    }
    if (response.status === 403) {
      return `HTTP 403：生图 Key 无权读取模型列表${detail ? `（${detail}）` : ''}。请检查 Key 权限或服务商要求。`;
    }
    return `HTTP ${response.status}${detail ? `：${detail}` : ''}`;
  }

  function imageSize(value) {
    const match = String(value || '').match(/^(\d+)x(\d+)$/i);
    return match ? { width: Number(match[1]), height: Number(match[2]) } : {};
  }

  function normalizeImage(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(data:image\/|https?:\/\/|blob:)/i.test(raw)) return raw;
    return `data:image/png;base64,${raw.replace(/^data:image\/[^;]+;base64,/i, '')}`;
  }

  function extractImages(payload) {
    const pools = [];
    if (Array.isArray(payload?.data)) pools.push(...payload.data);
    if (Array.isArray(payload?.images)) pools.push(...payload.images);
    if (Array.isArray(payload?.output)) pools.push(...payload.output);
    if (payload?.image) pools.push(payload.image);
    const values = pools.map(item => {
      if (typeof item === 'string') return item;
      return item?.b64_json || item?.base64 || item?.b64 || item?.url || item?.image || item?.data || '';
    }).map(normalizeImage).filter(Boolean);
    return [...new Set(values)];
  }

  function combinedPrompt(prompt, config) {
    return [config.positivePrompt, prompt].map(item => String(item || '').trim()).filter(Boolean).join('\n');
  }

  async function storeImage(value) {
    return window.IdealMachinePutImage ? window.IdealMachinePutImage(value) : value;
  }

  async function generate(options = {}) {
    const config = { ...readConfig(), ...(options.config || {}) };
    const endpoint = imageEndpoint(config.endpoint);
    if (!endpoint) throw new Error('请先填写生图接口地址');
    if (!config.model) throw new Error('请先填写生图模型');
    const purpose = options.purpose === 'moments' ? 'moments' : 'chat';
    const size = options.size || (purpose === 'moments' ? config.momentSize : config.chatSize);
    let prompt = combinedPrompt(options.prompt, config);
    const negativePrompt = [config.negativePrompt, options.negativePrompt].map(item => String(item || '').trim()).filter(Boolean).join('，');
    if (!prompt) throw new Error('缺少生图提示词');
    if (negativePrompt && config.protocol === 'openai') prompt += `\n画面中避免出现：${negativePrompt}`;
    const count = Math.max(1, Math.min(4, Number(options.count || config.count) || 1));
    const body = { model: config.model, prompt, n: count, size };
    if (config.quality) body.quality = config.quality;
    // Wanwan 的 OpenAI 兼容链路优先让服务直接返回 base64，减少依赖
    // 图片 CDN 的跨域读取；只在服务明确不支持此字段时降级重试。
    const canRequestBase64 = config.protocol !== 'extended';
    if (canRequestBase64) body.response_format = 'b64_json';
    if (config.protocol === 'extended') {
      const dimensions = imageSize(size);
      Object.assign(body, dimensions, {
        negative_prompt: negativePrompt
      });
      Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
    }
    const headers = { 'Content-Type': 'application/json' };
    if (config.key) headers.Authorization = `Bearer ${config.key}`;
    const requestOptions = { idealScope:purpose === 'chat' ? 'chat-image-generation' : 'image', idealPurpose:purpose === 'chat' ? '聊天 App－生成聊天图片' : '生图 App－生成图片', method:'POST', headers, body:'' };
    let response;
    let payload;
    let retriedWithoutResponseFormat = false;
    while (true) {
      requestOptions.body = JSON.stringify(body);
      try {
        response = await fetch(endpoint, requestOptions);
      } catch (error) {
        if (error instanceof TypeError || error?.message === 'Failed to fetch') {
          const localFileHint = location.protocol === 'file:'
            ? ' 当前页面是 file:// 本地文件，请改用 HTTPS/localhost 地址打开。'
            : '';
          throw new Error(`生图请求没有收到接口响应，可能是跨域（CORS/OPTIONS）或网络连接失败。${localFileHint}请确认生图服务允许当前页面来源的 POST、Authorization 和 Content-Type。`, { cause:error });
        }
        throw error;
      }
      let responseText = '';
      try { responseText = await response.clone().text(); } catch {}
      try { payload = responseText ? JSON.parse(responseText) : null; } catch { payload = null; }
      const providerMessage = String(payload?.error?.message || payload?.error || payload?.message || payload?.detail || responseText || '');
      const rejectsResponseFormat = canRequestBase64 && !retriedWithoutResponseFormat && !response.ok
        && /response[_ -]?format|unsupported.{0,30}(?:parameter|field)|unknown.{0,20}(?:parameter|field)|不支持.{0,12}(?:参数|字段)/i.test(providerMessage);
      if (rejectsResponseFormat) {
        delete body.response_format;
        retriedWithoutResponseFormat = true;
        continue;
      }
      if (!response.ok) {
        const detail = providerMessage.replace(/Bearer\s+\S+/gi, 'Bearer [已隐藏]').slice(0, 400);
        throw new Error(detail ? `HTTP ${response.status}：${detail}` : `HTTP ${response.status}`);
      }
      break;
    }
    const sources = extractImages(payload);
    if (!sources.length) throw new Error('接口已响应，但没有返回可识别的图片（支持 data[].b64_json、base64 或 url 格式）');
    const assets = await Promise.all(sources.map(storeImage));
    return { assetId: assets[0], assetIds: assets, prompt, revisedPrompt: payload?.data?.[0]?.revised_prompt || '' };
  }

  function canAutoGenerate() {
    const config = readConfig();
    return Boolean(config.endpoint && config.model);
  }

  function recordAutoGenerate(purpose) {
    const activity = readActivity();
    const kind = purpose === 'moments' ? 'moments' : 'chat';
    const cutoff = Date.now() - 7 * 86400000;
    activity[kind] = activity[kind].filter(stamp => stamp > cutoff);
    activity[kind].push(Date.now());
    localStorage.setItem(activityKey, JSON.stringify(activity));
  }

  async function resolveAsset(value) {
    return window.IdealMachineGetImage ? window.IdealMachineGetImage(value) : value;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  const settingsMain = document.querySelector('.settings-main');
  const apiSection = document.querySelector('.settings-api-section');
  if (settingsMain && apiSection && !document.querySelector('.settings-image-api-section')) {
    const section = document.createElement('section');
    section.className = 'settings-section settings-image-api-section';
    section.innerHTML = `
      <div class="settings-section-head">
        <div><span class="settings-eyebrow">VISUAL ENGINE</span><h2>生图 API</h2><p>用于聊天角色主动发图和角色朋友圈配图，配置独立于文字模型。</p></div>
        <span class="settings-status" data-image-api-status>未配置</span>
      </div>
      <div class="settings-profile-bar settings-image-profile-bar"><div class="settings-profile-picker"><button class="settings-profile-trigger" data-image-profile-toggle type="button"><span id="settingsImageProfileCurrent">选择已保存的生图配置</span><i>⌄</i></button><div class="settings-profile-menu" id="settingsImageProfileMenu" hidden></div></div><button data-image-new-profile type="button">＋ 新配置</button></div>
      <div class="settings-image-grid settings-image-connection">
        <label class="is-wide">接口地址<input data-image-setting="endpoint" type="url" placeholder="https://api.example.com/v1"></label>
        <label>API Key<input data-image-setting="key" type="password" placeholder="仅保存在本机浏览器"></label>
        <label class="settings-image-model-field">生图模型<div class="settings-image-model-control"><input data-image-setting="model" data-image-model-input list="settingsImageModelOptions" type="text" placeholder="填写或拉取模型"><button data-image-model-fetch type="button">拉取模型</button></div><datalist id="settingsImageModelOptions"></datalist></label>
        <label>接口协议<select data-image-setting="protocol"><option value="openai">OpenAI 兼容</option><option value="extended">扩展参数兼容</option></select></label>
      </div>
      <div class="settings-image-retain"><div class="settings-subhead"><b>保留模型</b><small data-image-retained-count>拉取模型后勾选</small></div><div class="settings-image-retained-list" data-image-retained-list><div class="settings-empty">尚未拉取模型</div></div></div>
      <div class="settings-image-block">
        <div class="settings-subhead"><b>聊天与朋友圈</b><small>分别使用适合场景的画幅</small></div>
        <div class="settings-image-grid">
          <label>聊天图片大小<select data-image-setting="chatSize"><option>1024x1024</option><option>1024x1536</option><option>1536x1024</option><option>512x512</option><option>256x256</option></select></label>
          <label>朋友圈图片大小<select data-image-setting="momentSize"><option>1024x1024</option><option>1024x1536</option><option>1536x1024</option><option>512x512</option><option>256x256</option></select></label>
          <label>质量<select data-image-setting="quality"><option value="">跟随接口默认</option><option value="standard">standard</option><option value="hd">hd</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="auto">auto</option></select></label>
          <label>每次生成<select data-image-setting="count"><option value="1">1 张</option><option value="2">2 张</option><option value="3">3 张</option><option value="4">4 张</option></select></label>
        </div>
        <p class="settings-image-behavior-note">生图 API 配置成功后，聊天角色会根据聊天内容自行判断是否发图，不会每轮生成；生成角色动态时可在本次操作中选择是否配图。AI 图片不会自动保存到相册，可在图片查看页保存到本地或重新生成。</p>
      </div>
      <div class="settings-image-block">
        <div class="settings-subhead"><b>自定义提示词</b><small>默认全部关闭，不添加任何预置内容</small></div>
        <div class="settings-image-prompts">
          <label>固定正向提示词<textarea data-image-setting="positivePrompt" placeholder="每张图都需要包含的画面要求"></textarea></label>
          <label>固定负向提示词<textarea data-image-setting="negativePrompt" placeholder="不希望画面出现的内容"></textarea></label>
        </div>
      </div>
      <div class="settings-image-actions"><button class="is-primary" data-image-api-save type="button">保存生图设置</button></div>`;
    apiSection.insertAdjacentElement('afterend', section);
  }

  function setStatus(message, state = '') {
    const element = document.querySelector('[data-image-api-status]');
    if (!element) return;
    element.textContent = message;
    element.dataset.state = state;
  }

  let imageProfileMenuOpen = false;
  let imageEditingProfileId = null;

  function imageProfileValues(config) {
    const keys = ['endpoint', 'key', 'model', 'availableModels', 'selectedModels', 'protocol', 'chatSize', 'momentSize', 'quality', 'count', 'positivePrompt', 'negativePrompt'];
    return keys.reduce((result, key) => { result[key] = config[key]; return result; }, {});
  }

  function renderImageProfiles(config) {
    const active = config.profiles.find(profile => profile.id === config.activeProfileId);
    const current = document.querySelector('#settingsImageProfileCurrent');
    const menu = document.querySelector('#settingsImageProfileMenu');
    if (current) {
      current.textContent = active ? `${active.name} · ${active.endpoint}` : (config.profiles.length ? '选择已保存的生图配置' : '暂无已保存的生图配置');
      current.title = active ? active.endpoint || '' : '';
    }
    if (menu) {
      menu.innerHTML = config.profiles.length ? config.profiles.map(profile => `<div class="settings-profile-item-row"><button class="settings-profile-item ${profile.id === config.activeProfileId ? 'is-active' : ''}" data-image-profile-select="${escapeHtml(profile.id)}" type="button"><span><b>${escapeHtml(profile.name)}</b><small>${escapeHtml(profile.endpoint)}</small></span></button><button class="settings-profile-delete" data-image-profile-delete="${escapeHtml(profile.id)}" type="button" aria-label="删除 ${escapeHtml(profile.name)}">删除</button></div>`).join('') : '<div class="settings-profile-empty">暂无已保存的生图配置</div>';
      menu.hidden = !imageProfileMenuOpen;
    }
  }

  function renderSettings() {
    const config = readConfig();
    if (imageEditingProfileId === null) imageEditingProfileId = config.activeProfileId;
    if (imageEditingProfileId && !config.profiles.some(profile => profile.id === imageEditingProfileId)) imageEditingProfileId = config.activeProfileId;
    config.activeProfileId = imageEditingProfileId;
    renderImageProfiles(config);
    document.querySelectorAll('[data-image-setting]').forEach(field => {
      const key = field.dataset.imageSetting;
      if (field.type === 'checkbox') field.checked = Boolean(config[key]);
      else field.value = config[key] ?? '';
    });
    renderModelOptions(config.availableModels, config.selectedModels);
    renderRetainedImageModels(config.availableModels, config.selectedModels);
    setStatus(config.endpoint && config.model ? '已配置' : '未配置', config.endpoint && config.model ? 'ready' : '');
  }

  function renderModelOptions(models, selectedModels = []) {
    const list = document.querySelector('#settingsImageModelOptions');
    if (!list) return;
    const retained = Array.isArray(selectedModels) ? selectedModels : (Array.isArray(models) ? models : []);
    list.innerHTML = retained.map(model => `<option value="${escapeHtml(model)}"></option>`).join('');
  }

  function renderRetainedImageModels(models, selectedModels = []) {
    const list = document.querySelector('[data-image-retained-list]');
    const count = document.querySelector('[data-image-retained-count]');
    if (!list) return;
    const available = Array.isArray(models) ? models : [];
    const retained = new Set(Array.isArray(selectedModels) ? selectedModels : []);
    if (count) count.textContent = available.length ? `已保留 ${retained.size} / ${available.length} 个` : '拉取模型后勾选';
    list.innerHTML = available.length ? available.map(model => `<label class="settings-image-retained-option"><input type="checkbox" data-image-retain-model="${escapeHtml(model)}" ${retained.has(model) ? 'checked' : ''}><span>${escapeHtml(model)}</span></label>`).join('') : '<div class="settings-empty">尚未拉取模型</div>';
  }

  function collectSettings() {
    const config = readConfig();
    document.querySelectorAll('[data-image-setting]').forEach(field => {
      const key = field.dataset.imageSetting;
      if (field.type === 'checkbox') config[key] = field.checked;
      else if (field.type === 'number') config[key] = Number(field.value);
      else config[key] = field.value.trim();
    });
    if (imageEditingProfileId !== null) config.activeProfileId = imageEditingProfileId;
    return config;
  }

  function saveImageProfile(showStatus = true) {
    const config = collectSettings();
    config.selectedModels = Array.isArray(config.selectedModels) ? config.selectedModels : [];
    if (config.model && !config.selectedModels.includes(config.model)) config.selectedModels.push(config.model);
    if (!config.endpoint || !config.model) return setStatus('请填写生图接口地址和模型', 'error');
    const profiles = Array.isArray(config.profiles) ? [...config.profiles] : [];
    const id = config.activeProfileId || `image-profile-${Date.now()}`;
    const previous = profiles.find(profile => profile.id === id);
    const profile = { id, name: previous?.name || config.endpoint, ...imageProfileValues(config) };
    const index = profiles.findIndex(item => item.id === id);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    config.profiles = profiles;
    config.activeProfileId = id;
    imageEditingProfileId = id;
    saveConfig(config);
    imageProfileMenuOpen = false;
    renderSettings();
    if (showStatus) setStatus('已保存生图配置', 'ready');
    return true;
  }

  function switchImageProfile(id) {
    const config = readConfig();
    const profile = config.profiles.find(item => item.id === id);
    imageProfileMenuOpen = false;
    if (!profile) return renderSettings();
    imageEditingProfileId = profile.id;
    saveConfig({ ...config, ...imageProfileValues(profile), activeProfileId: profile.id, profiles: config.profiles });
    renderSettings();
    setStatus(`已切换：${profile.name}`, 'ready');
  }

  function deleteImageProfile(id) {
    const config = readConfig();
    const profile = config.profiles.find(item => item.id === id);
    if (!profile || !window.confirm(`确定删除生图配置“${profile.name}”吗？`)) return;
    const profiles = config.profiles.filter(item => item.id !== id);
    const wasActive = config.activeProfileId === id;
    const draft = collectSettings();
    if (wasActive) {
      const next = profiles[0];
      imageEditingProfileId = next?.id || '';
      if (next) Object.assign(config, imageProfileValues(next), { activeProfileId: next.id });
      else Object.assign(config, imageProfileValues(defaults), { activeProfileId: '' });
    }
    config.profiles = profiles;
    imageProfileMenuOpen = false;
    saveConfig(config);
    renderSettings();
    if (!wasActive) {
      document.querySelectorAll('[data-image-setting]').forEach(field => {
        const key = field.dataset.imageSetting;
        if (field.type === 'checkbox') field.checked = Boolean(draft[key]);
        else field.value = draft[key] ?? '';
      });
    }
    setStatus(wasActive ? (profiles.length ? `已切换：${profiles[0].name}` : '已删除生图配置') : `已删除：${profile.name}`, 'ready');
  }

  async function fetchImageModels() {
    const config = collectSettings();
    const endpoint = modelsEndpoint(config.endpoint);
    const button = document.querySelector('[data-image-model-fetch]');
    if (!endpoint) return setStatus('请先填写生图接口地址', 'error');
    button.disabled = true;
    button.textContent = '拉取中…';
    setStatus('正在拉取模型', 'busy');
    try {
      const headers = {};
      const usesGoogleApiKey = /generativelanguage\.googleapis\.com/i.test(endpoint);
      if (config.key) headers[usesGoogleApiKey ? 'x-goog-api-key' : 'Authorization'] = usesGoogleApiKey ? config.key : `Bearer ${config.key}`;
      const response = await fetch(endpoint, { idealScope:'image', idealPurpose:'生图 App－下载生成结果', idealUseDefaultKey:false, headers });
      if (!response.ok) throw new Error(await imageModelsError(response));
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
      const models = [...new Set(rows.map(item => {
        const model = typeof item === 'string' ? item : item?.id || item?.name;
        return String(model || '').replace(/^models\//, '');
      }).filter(Boolean))];
      if (!models.length) throw new Error('接口没有返回模型');
      const imagePattern = /image|dall|flux|sdxl|stable|recraft|seedream|imagen|qwen.*(?:image|img)|wan.*image/i;
      models.sort((a, b) => Number(imagePattern.test(b)) - Number(imagePattern.test(a)) || a.localeCompare(b));
      config.availableModels = models;
      config.selectedModels = config.selectedModels.filter(model => models.includes(model));
      if (!config.selectedModels.length) config.selectedModels = [models.find(model => imagePattern.test(model)) || models[0]];
      if (!config.model || !config.selectedModels.includes(config.model)) config.model = config.selectedModels[0];
      const activeIndex = config.profiles.findIndex(profile => profile.id === config.activeProfileId);
      if (activeIndex >= 0) config.profiles[activeIndex] = { ...config.profiles[activeIndex], ...imageProfileValues(config) };
      saveConfig(config);
      renderModelOptions(models, config.selectedModels);
      renderRetainedImageModels(models, config.selectedModels);
      const input = document.querySelector('[data-image-model-input]');
      if (input) input.value = config.model;
      setStatus(`已拉取 ${models.length} 个模型`, 'ready');
    } catch (error) {
      setStatus(`模型拉取失败：${error.message}`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = '拉取模型';
    }
  }

  document.addEventListener('click', async event => {
    if (event.target.closest('[data-app-key="shezhi"]')) {
      imageEditingProfileId = null;
      requestAnimationFrame(renderSettings);
      return;
    }
    const toggle = event.target.closest?.('[data-image-profile-toggle]');
    if (toggle) {
      imageProfileMenuOpen = !imageProfileMenuOpen;
      const menu = document.querySelector('#settingsImageProfileMenu');
      if (menu) menu.hidden = !imageProfileMenuOpen;
      return;
    }
    const remove = event.target.closest?.('[data-image-profile-delete]');
    if (remove) {
      event.preventDefault();
      event.stopImmediatePropagation();
      deleteImageProfile(remove.dataset.imageProfileDelete);
      return;
    }
    const select = event.target.closest?.('[data-image-profile-select]');
    if (select) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switchImageProfile(select.dataset.imageProfileSelect);
      return;
    }
    if (event.target.closest('[data-image-new-profile]')) {
      imageEditingProfileId = '';
      imageProfileMenuOpen = false;
      document.querySelectorAll('[data-image-setting]').forEach(field => {
        const key = field.dataset.imageSetting;
        if (field.type === 'checkbox') field.checked = Boolean(defaults[key]);
        else field.value = defaults[key] ?? '';
      });
      const current = document.querySelector('#settingsImageProfileCurrent');
      if (current) { current.textContent = '新建生图配置'; current.title = ''; }
      const menu = document.querySelector('#settingsImageProfileMenu');
      if (menu) menu.hidden = true;
      renderModelOptions([], []);
      renderRetainedImageModels([], []);
      setStatus('请输入新的生图配置');
      return;
    }
    if (event.target.closest('[data-image-model-fetch]')) {
      await fetchImageModels();
      return;
    }
    const saveButton = event.target.closest('[data-image-api-save]');
    if (!saveButton) return;
    saveImageProfile(true);
  });

  document.addEventListener('change', event => {
    const checkbox = event.target.closest?.('[data-image-retain-model]');
    if (!checkbox) return;
    const config = collectSettings();
    config.selectedModels = [...document.querySelectorAll('[data-image-retain-model]:checked')].map(item => item.dataset.imageRetainModel);
    if (!config.selectedModels.includes(config.model)) config.model = config.selectedModels[0] || '';
    const activeIndex = config.profiles.findIndex(profile => profile.id === config.activeProfileId);
    if (activeIndex >= 0) config.profiles[activeIndex] = { ...config.profiles[activeIndex], ...imageProfileValues(config) };
    saveConfig(config);
    const input = document.querySelector('[data-image-model-input]');
    if (input) input.value = config.model;
    renderModelOptions(config.availableModels, config.selectedModels);
    const count = document.querySelector('[data-image-retained-count]');
    if (count) count.textContent = `已保留 ${config.selectedModels.length} / ${config.availableModels.length} 个`;
    setStatus(`已保留 ${config.selectedModels.length} 个模型`, 'ready');
  });

  renderSettings();
  window.IdealMachineImageAPI = { getConfig: readConfig, saveConfig, generate, resolveAsset, canAutoGenerate, recordAutoGenerate };
})();
