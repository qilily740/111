(() => {
  const storageKey = 'ideal-machine-image-api';
  const activityKey = 'ideal-machine-image-activity';
  const previousBuiltInNegativePrompt = '低清晰度，模糊，畸形手指，多余肢体，重复人物，文字，水印，logo';
  const defaults = {
    endpoint: '',
    key: '',
    model: '',
    availableModels: [],
    protocol: 'openai',
    chatSize: '1024x1024',
    momentSize: '1024x1024',
    quality: '',
    count: 1,
    positivePrompt: '',
    negativePrompt: '',
    autoChat: true,
    chatChance: 45,
    chatCooldownMinutes: 20,
    autoMoments: true,
    momentChance: 60
  };

  function readConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const config = { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
      if (config.negativePrompt === previousBuiltInNegativePrompt) config.negativePrompt = '';
      config.availableModels = Array.isArray(config.availableModels) ? config.availableModels : [];
      delete config.chatDailyLimit;
      delete config.stylePrompt;
      delete config.steps;
      delete config.cfgScale;
      delete config.seed;
      delete config.sampler;
      return config;
    } catch {
      return { ...defaults };
    }
  }

  function saveConfig(config) {
    const value = { ...defaults, ...config };
    delete value.chatDailyLimit;
    delete value.stylePrompt;
    delete value.steps;
    delete value.cfgScale;
    delete value.seed;
    delete value.sampler;
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
    return /\/images\/generations$/i.test(clean) ? clean : `${clean}/images/generations`;
  }

  function modelsEndpoint(endpoint) {
    const clean = String(endpoint || '').trim().replace(/\/$/, '').replace(/\/images\/generations$/i, '');
    return clean ? `${clean}/models` : '';
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
    if (config.protocol === 'extended') {
      const dimensions = imageSize(size);
      Object.assign(body, dimensions, {
        negative_prompt: negativePrompt
      });
      Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
    }
    const headers = { 'Content-Type': 'application/json' };
    if (config.key) headers.Authorization = `Bearer ${config.key}`;
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      let detail = '';
      try {
        const payload = await response.json();
        detail = payload?.error?.message || payload?.message || '';
      } catch {
        try { detail = await response.text(); } catch {}
      }
      throw new Error(detail ? `HTTP ${response.status}：${detail}` : `HTTP ${response.status}`);
    }
    const payload = await response.json();
    const sources = extractImages(payload);
    if (!sources.length) throw new Error('接口没有返回可识别的图片');
    const assets = await Promise.all(sources.map(storeImage));
    return { assetId: assets[0], assetIds: assets, prompt, revisedPrompt: payload?.data?.[0]?.revised_prompt || '' };
  }

  function canAutoGenerate(purpose) {
    const config = readConfig();
    const kind = purpose === 'moments' ? 'moments' : 'chat';
    if (kind === 'chat' && !config.autoChat) return false;
    if (kind === 'moments' && !config.autoMoments) return false;
    const chance = kind === 'chat' ? Number(config.chatChance) : Number(config.momentChance);
    if (Math.random() * 100 >= Math.max(0, Math.min(100, chance || 0))) return false;
    if (kind === 'moments') return true;
    const now = Date.now();
    const history = readActivity().chat;
    const latest = Math.max(0, ...history);
    return now - latest >= Math.max(0, Number(config.chatCooldownMinutes) || 0) * 60000;
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
      <div class="settings-image-grid settings-image-connection">
        <label class="is-wide">接口地址<input data-image-setting="endpoint" type="url" placeholder="https://api.example.com/v1"></label>
        <label>API Key<input data-image-setting="key" type="password" placeholder="仅保存在本机浏览器"></label>
        <label class="settings-image-model-field">生图模型<div class="settings-image-model-control"><input data-image-setting="model" data-image-model-input list="settingsImageModelOptions" type="text" placeholder="填写或拉取模型"><button data-image-model-fetch type="button">拉取模型</button></div><datalist id="settingsImageModelOptions"></datalist></label>
        <label>接口协议<select data-image-setting="protocol"><option value="openai">OpenAI 兼容</option><option value="extended">扩展参数兼容</option></select></label>
      </div>
      <div class="settings-image-block">
        <div class="settings-subhead"><b>聊天与朋友圈</b><small>分别使用适合场景的画幅</small></div>
        <div class="settings-image-grid">
          <label>聊天图片大小<select data-image-setting="chatSize"><option>1024x1024</option><option>1024x1536</option><option>1536x1024</option><option>512x512</option><option>256x256</option></select></label>
          <label>朋友圈图片大小<select data-image-setting="momentSize"><option>1024x1024</option><option>1024x1536</option><option>1536x1024</option><option>512x512</option><option>256x256</option></select></label>
          <label>质量<select data-image-setting="quality"><option value="">跟随接口默认</option><option value="standard">standard</option><option value="hd">hd</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="auto">auto</option></select></label>
          <label>每次生成<select data-image-setting="count"><option value="1">1 张</option><option value="2">2 张</option><option value="3">3 张</option><option value="4">4 张</option></select></label>
        </div>
        <div class="settings-image-auto-grid">
          <div class="settings-image-auto-card"><label class="settings-image-switch"><input data-image-setting="autoChat" type="checkbox"><span><b>聊天主动发图</b><small>由角色根据聊天内容判断；用户明确要求时一定发图</small></span></label><div><label>触发机会<input data-image-setting="chatChance" type="number" min="0" max="100" step="5"><i>%</i></label><label>冷却<input data-image-setting="chatCooldownMinutes" type="number" min="0" step="1"><i>分钟</i></label></div></div>
          <div class="settings-image-auto-card"><label class="settings-image-switch"><input data-image-setting="autoMoments" type="checkbox"><span><b>角色朋友圈配图</b><small>文案适合配图时自动生成</small></span></label><div><label>触发机会<input data-image-setting="momentChance" type="number" min="0" max="100" step="5"><i>%</i></label></div></div>
        </div>
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

  function renderSettings() {
    const config = readConfig();
    document.querySelectorAll('[data-image-setting]').forEach(field => {
      const key = field.dataset.imageSetting;
      if (field.type === 'checkbox') field.checked = Boolean(config[key]);
      else field.value = config[key] ?? '';
    });
    renderModelOptions(config.availableModels);
    setStatus(config.endpoint && config.model ? '已配置' : '未配置', config.endpoint && config.model ? 'ready' : '');
  }

  function renderModelOptions(models) {
    const list = document.querySelector('#settingsImageModelOptions');
    if (!list) return;
    list.innerHTML = (Array.isArray(models) ? models : []).map(model => `<option value="${escapeHtml(model)}"></option>`).join('');
  }

  function collectSettings() {
    const config = readConfig();
    document.querySelectorAll('[data-image-setting]').forEach(field => {
      const key = field.dataset.imageSetting;
      if (field.type === 'checkbox') config[key] = field.checked;
      else if (field.type === 'number') config[key] = Number(field.value);
      else config[key] = field.value.trim();
    });
    return config;
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
      if (config.key) headers.Authorization = `Bearer ${config.key}`;
      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
      const models = [...new Set(rows.map(item => typeof item === 'string' ? item : item?.id || item?.name).filter(Boolean))];
      if (!models.length) throw new Error('接口没有返回模型');
      const imagePattern = /image|dall|flux|sdxl|stable|recraft|seedream|imagen|qwen.*(?:image|img)|wan.*image/i;
      models.sort((a, b) => Number(imagePattern.test(b)) - Number(imagePattern.test(a)) || a.localeCompare(b));
      config.availableModels = models;
      if (!config.model) config.model = models.find(model => imagePattern.test(model)) || models[0];
      saveConfig(config);
      renderModelOptions(models);
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
      requestAnimationFrame(renderSettings);
      return;
    }
    if (event.target.closest('[data-image-model-fetch]')) {
      await fetchImageModels();
      return;
    }
    const saveButton = event.target.closest('[data-image-api-save]');
    if (!saveButton) return;
    const config = collectSettings();
    saveConfig(config);
    setStatus('已保存', 'ready');
  });

  renderSettings();
  window.IdealMachineImageAPI = { getConfig: readConfig, saveConfig, generate, resolveAsset, canAutoGenerate, recordAutoGenerate };
})();
