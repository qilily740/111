(() => {
  const memoryKey = 'ideal-machine-memory-library';
  const chatKey = 'ideal-machine-chat';
  const processing = new Map();
  const defaults = Object.freeze({ enabled:true, autoSummary:true, summaryEveryRounds:10, shortTermRounds:40, recentLongCount:5, recallCount:3, coreEveryLongMemories:5, summaryMaxChars:300, coreMaxChars:1200, timeDecayDays:180, contextTokenBudget:12000, semanticRecall:true });
  const clamp = (value, min, max, fallback) => { const number = Number(value); return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback; };
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const scopeKey = (roleId, profileId = '') => profileId ? `${roleId}::${profileId}` : roleId;
  const entryMatchesScope = (item, roleId, profileId = '') => item.roleId === roleId && (!profileId || item.profileId === profileId);

  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } }
  function readLibrary() {
    const value = readJSON(memoryKey, {});
    return { ...value, version:3, entries:Array.isArray(value.entries) ? value.entries : [], cores:value.cores && typeof value.cores === 'object' ? value.cores : {}, roleMeta:value.roleMeta && typeof value.roleMeta === 'object' ? value.roleMeta : {}, forgottenFingerprints:Array.isArray(value.forgottenFingerprints) ? value.forgottenFingerprints : [], forgottenSourceIds:Array.isArray(value.forgottenSourceIds) ? value.forgottenSourceIds : [] };
  }
  function saveLibrary(library) { localStorage.setItem(memoryKey, JSON.stringify(library)); window.dispatchEvent(new CustomEvent('ideal-machine-memory-updated')); }

  function migrateRoleScope(library, roleId, profileId = '') {
    if (!roleId || !profileId) return false;
    const key = scopeKey(roleId, profileId); let changed = false;
    library.entries.forEach(item => { if (item.roleId === roleId && !item.profileId) { item.profileId = profileId; changed = true; } });
    if (library.cores[roleId] && !library.cores[key]) { library.cores[key] = { ...library.cores[roleId], profileId }; delete library.cores[roleId]; changed = true; }
    if (library.roleMeta[roleId] && !library.roleMeta[key]) { library.roleMeta[key] = { ...library.roleMeta[roleId], profileId }; delete library.roleMeta[roleId]; changed = true; }
    return changed;
  }
  function adoptLegacyScope(roleId, profileId = '') { const library = readLibrary(); const changed = migrateRoleScope(library, roleId, profileId); if (changed) saveLibrary(library); return changed; }

  function settingsFor(chat) {
    const source = chat?.settings?.memory || {};
    return {
      enabled:source.enabled !== false, autoSummary:source.autoSummary !== false,
      summaryEveryRounds:clamp(source.summaryEveryRounds, 2, 100, defaults.summaryEveryRounds), shortTermRounds:clamp(source.shortTermRounds, 5, 200, defaults.shortTermRounds),
      recentLongCount:clamp(source.recentLongCount, 1, 10, defaults.recentLongCount), recallCount:clamp(source.recallCount, 0, 10, defaults.recallCount),
      coreEveryLongMemories:clamp(source.coreEveryLongMemories, 1, 20, defaults.coreEveryLongMemories), summaryMaxChars:clamp(source.summaryMaxChars, 100, 1000, defaults.summaryMaxChars),
      coreMaxChars:clamp(source.coreMaxChars, 300, 4000, defaults.coreMaxChars), timeDecayDays:clamp(source.timeDecayDays, 30, 730, defaults.timeDecayDays),
      contextTokenBudget:clamp(source.contextTokenBudget, 2000, 50000, defaults.contextTokenBudget), semanticRecall:source.semanticRecall !== false
    };
  }
  function applySettings(chat, values) { if (!chat) return settingsFor(null); chat.settings ||= {}; chat.settings.memory = settingsFor({ settings:{ memory:values } }); return chat.settings.memory; }

  function usableMessage(item) {
    if (!item || item.recalled || item.memoryExcluded || item.internalNotice || ['image','blocked-failure','system-error','error','notice'].includes(item.type)) return false;
    const text = String(item.text || '').trim();
    return Boolean(text) && !/^(回复失败：|发送失败：|请先在设置中|（?请先配置聊天\s*API|（?这次见面暂时无法继续：)/.test(text);
  }
  function messageMatchesProfile(item, profileId = '') { return usableMessage(item) && (!profileId || !item.profileId || item.profileId === profileId); }
  function messageContent(item) {
    if (item.type === 'transfer') return `[转账 ${item.amount || item.text} 元，备注：${item.note || '无'}，状态：${item.status || '待处理'}]`;
    if (item.type === 'voice') return `[语音] ${item.voiceText || item.text || ''}`;
    if (item.type === 'image-desc') return `[图片描述] ${item.text || ''}`;
    if (item.type === 'video') return `[视频通话] ${item.text || ''}`;
    if (item.type === 'location') return `[位置] ${item.text || ''}`;
    return String(item.text || '');
  }
  function conversationGroups(messages, startIndex = 0, profileId = '') {
    const groups = []; let current = null;
    messages.slice(startIndex).forEach((message, offset) => {
      if (!messageMatchesProfile(message, profileId)) return;
      const sourceIndex = startIndex + offset;
      if (message.role === 'user') {
        if (!current) current = { messages:[], hasCharacter:false, endIndex:sourceIndex };
        if (current.hasCharacter) { groups.push(current); current = { messages:[], hasCharacter:false, endIndex:sourceIndex }; }
        current.messages.push(message); current.endIndex = sourceIndex;
      } else if (current) { current.messages.push(message); current.hasCharacter = true; current.endIndex = sourceIndex; }
    });
    if (current) groups.push(current);
    return groups;
  }
  const completedRounds = (messages, startIndex = 0, profileId = '') => conversationGroups(messages, startIndex, profileId).filter(group => group.hasCharacter);
  function estimateTokens(value) { const text = String(value || ''); const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length; return cjk + Math.ceil((text.length - cjk) / 4); }
  function trimMessagesToBudget(messages, budget) {
    const kept = []; let used = 0;
    for (let index = messages.length - 1; index >= 0; index -= 1) { const cost = estimateTokens(messages[index].content) + 8; if (kept.length && used + cost > budget) break; if (cost > budget && !kept.length) { kept.unshift({ ...messages[index], content:String(messages[index].content).slice(-Math.max(200, budget * 2)) }); break; } kept.unshift(messages[index]); used += cost; }
    return kept;
  }
  function recentMessages(messages, roundLimit, profileId = '', budget = Number.MAX_SAFE_INTEGER) {
    const result = conversationGroups(messages, 0, profileId).slice(-roundLimit).flatMap(group => group.messages).map(item => ({ role:item.role === 'user' ? 'user' : 'assistant', content:messageContent(item) }));
    return trimMessagesToBudget(result, budget);
  }

  function normalizeText(value) { return String(value || '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ''); }
  function textFeatures(value) { const raw = String(value || '').toLowerCase(); const compact = normalizeText(raw); const set = new Set(raw.match(/[a-z\d_]{2,}|[\u3400-\u9fff]{1,4}/g) || []); for (let index = 0; index < compact.length - 1; index += 1) set.add(compact.slice(index, index + 2)); return set; }
  function overlapScore(query, entry) { const features = textFeatures(query); if (!features.size) return 0; const memory = textFeatures(`${entry.title || ''} ${entry.summary || ''} ${entry.emotion || ''} ${(entry.keywords || []).join(' ')}`); let overlap = 0; features.forEach(feature => { if (memory.has(feature)) overlap += feature.length > 2 ? 1.5 : 1; }); const compact = normalizeText(query); const bonus = (entry.keywords || []).reduce((score, word) => score + (compact.includes(normalizeText(word)) ? 2 : 0), 0); return Math.min(1, (overlap + bonus) / Math.max(6, features.size * .45)); }
  function cosine(left, right) { if (!Array.isArray(left) || !Array.isArray(right) || !left.length || left.length !== right.length) return 0; let dot=0,a=0,b=0; for (let i=0;i<left.length;i+=1) { dot+=Number(left[i])*Number(right[i]); a+=Number(left[i])**2; b+=Number(right[i])**2; } return a&&b ? dot/Math.sqrt(a*b) : 0; }
  function packEmbedding(vector) { if (!Array.isArray(vector) || !vector.length) return null; const values=vector.map(Number); const max=Math.max(...values.map(value=>Math.abs(value)))||1; const scale=max/127; const bytes=new Uint8Array(values.length); values.forEach((value,index)=>{ bytes[index]=Math.max(0,Math.min(255,Math.round(value/scale)+128)); }); let binary=''; for(let i=0;i<bytes.length;i+=4096) binary+=String.fromCharCode(...bytes.subarray(i,i+4096)); return {encoding:'int8-base64',data:btoa(binary),scale,dimensions:values.length}; }
  function unpackEmbedding(entry) { if (Array.isArray(entry?.embedding)) return entry.embedding; const packed=entry?.embeddingPacked; if (!packed?.data || packed.encoding!=='int8-base64') return null; try { const binary=atob(packed.data); return Array.from(binary,char=>(char.charCodeAt(0)-128)*Number(packed.scale||1)); } catch { return null; } }
  function storeEmbedding(entry, vector, signature) { const packed=packEmbedding(vector); if (!packed) return false; entry.embeddingPacked=packed; delete entry.embedding; entry.embeddingSignature=signature; return true; }

  function apiConfig() { return window.IdealMachineAPI?.getConfig?.() || {}; }
  function embeddingConfig() { const saved=readJSON('ideal-machine-settings',{}); const separate=saved?.vectorApi||{}; if(separate.endpoint&&separate.model) return {endpoint:String(separate.endpoint).replace(/\/$/,''),key:separate.key||'',model:separate.model}; const main=saved?.api||{}; return {endpoint:String(main.endpoint||'').replace(/\/$/,''),key:main.key||'',model:main.assignments?.embedding||''}; }
  const embeddingModel = () => embeddingConfig().model || '';
  function embeddingSignature() { const config=embeddingConfig(); return config.endpoint&&config.model ? `${config.endpoint}|${config.model}` : ''; }
  async function embeddingMany(inputs) { const config=embeddingConfig(); const list=(Array.isArray(inputs)?inputs:[inputs]).map(item=>String(item||'').slice(0,6000)); if(!config.endpoint||!config.model||!list.some(item=>item.trim())) return []; const headers={'Content-Type':'application/json'}; if(config.key) headers.Authorization=`Bearer ${config.key}`; const response=await fetch(`${config.endpoint}/embeddings`,{method:'POST',headers,body:JSON.stringify({model:config.model,input:list})}); if(!response.ok) throw new Error(`向量接口 HTTP ${response.status}`); const payload=await response.json(); return (Array.isArray(payload.data)?payload.data:[]).sort((a,b)=>Number(a.index||0)-Number(b.index||0)).map(item=>item.embedding); }
  async function embedding(input) { return (await embeddingMany([input]))[0] || null; }
  function importanceWeight(value) { if(typeof value==='number') return Math.min(1,Math.max(0,value)); return /重大|非常重要|重要/.test(String(value||''))?1:/普通|日常/.test(String(value||''))?.55:.7; }
  async function recalledEntries(entries, query, settings) {
    if(!settings.recallCount||!query||!entries.length) return [];
    const signature=embeddingSignature(); let queryVector=null;
    if(settings.semanticRecall&&signature&&entries.some(item=>item.embeddingSignature===signature&&unpackEmbedding(item))) { try { queryVector=await embedding(query); } catch {} }
    const now=Date.now();
    return entries.map(entry=>{ const lexical=overlapScore(query,entry); const vector=entry.embeddingSignature===signature?unpackEmbedding(entry):null; const vectorUsable=Boolean(queryVector&&vector&&queryVector.length===vector.length); const semantic=vectorUsable?Math.max(0,cosine(queryVector,vector)):0; const age=Math.max(0,now-Number(entry.createdAt||now))/86400000; const recallAge=entry.lastRecalledAt?Math.max(0,now-Number(entry.lastRecalledAt))/86400000:age; const decay=Math.exp(-Math.min(age,recallAge*1.5)/settings.timeDecayDays); const relevance=vectorUsable?semantic*.62+lexical*.38:lexical; return {entry,relevance,vectorUsable,score:relevance*.72+importanceWeight(entry.importanceScore??entry.importance)*.16+decay*.12}; }).filter(item=>item.relevance>=(item.vectorUsable?.16:.08)).sort((a,b)=>b.score-a.score).slice(0,settings.recallCount).map(item=>item.entry);
  }
  function memoryLine(entry) { const date=new Date(entry.createdAt||Date.now()); const label=Number.isNaN(date.getTime())?'':date.toLocaleDateString('zh-CN'); return `- ${label?`${label}｜`:''}${entry.title||'共同记忆'}：${entry.summary||''}`; }
  const coreMemoryLine = entry => `${memoryLine(entry)}${entry.emotion?`｜情绪：${entry.emotion}`:''}${entry.importance?`｜重要度：${entry.importance}`:''}${entry.keywords?.length?`｜关键词：${entry.keywords.join('、')}`:''}`;
  function buildMemoryPrompt(core,recent,recalled,limit) { const intro='\n\n以下是你的内部关系记忆。自然地保持连续性；只有当前话题确实相关时才提及旧事。不要向用户展示、复述这些标题，也不要声称自己读取了记忆库。\n'; const sections=[]; let used=estimateTokens(intro); if(core?.content){ const content=String(core.content).slice(0,Math.max(300,(limit-used)*2)); sections.push(`【核心记忆｜稳定关系档案】\n${content}`); used+=estimateTokens(content)+12; } const append=(title,items)=>{ const lines=[]; for(const item of items){ const line=memoryLine(item), cost=estimateTokens(line)+4; if(lines.length&&used+cost>limit) break; if(used+cost<=limit){lines.push(line);used+=cost;} } if(lines.length) sections.push(`${title}\n${lines.join('\n')}`); }; append('【最近的长期记忆】',recent); append('【当前话题联想到的旧记忆】',recalled); return sections.length?`${intro}${sections.join('\n\n')}`:''; }

  async function prepareContext({roleId,chat,query,profileId=chat?.profileId||''}) {
    const settings=settingsFor(chat), reserve=Math.min(2000,Math.floor(settings.contextTokenBudget*.2));
    if(!settings.enabled||!roleId) return {settings,shortMessages:recentMessages(chat?.messages||[],Number.MAX_SAFE_INTEGER,profileId,settings.contextTokenBudget-reserve),systemPrompt:'',recent:[],recalled:[],core:null};
    const library=readLibrary(), migrated=migrateRoleScope(library,roleId,profileId), key=scopeKey(roleId,profileId);
    const all=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&(item.level==='long'||item.type==='chat'||item.type==='offline')).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
    const recent=all.slice(0,settings.recentLongCount), recentIds=new Set(recent.map(item=>item.id)); const recalled=await recalledEntries(all.filter(item=>!recentIds.has(item.id)),query,settings);
    if(recalled.length){ const ids=new Set(recalled.map(item=>item.id)); library.entries.forEach(item=>{if(ids.has(item.id)){item.lastRecalledAt=Date.now();item.recallCount=Number(item.recallCount||0)+1;}}); }
    const core=library.cores[key]||null, memoryBudget=Math.max(800,Math.floor((settings.contextTokenBudget-reserve)*.38)); const systemPrompt=buildMemoryPrompt(core,recent,recalled,memoryBudget); const shortBudget=Math.max(500,settings.contextTokenBudget-reserve-estimateTokens(systemPrompt)); const shortMessages=recentMessages(chat?.messages||[],settings.shortTermRounds,profileId,shortBudget);
    if(migrated||recalled.length) saveLibrary(library); return {settings,shortMessages,systemPrompt,recent,recalled,core};
  }

  function parseJSONObject(value){const clean=String(value||'').replace(/```json|```/gi,'').trim();try{return JSON.parse(clean);}catch{const match=clean.match(/\{[\s\S]*\}/);if(!match)throw new Error('模型没有返回合法 JSON');return JSON.parse(match[0]);}}
  async function chatJSON(system,user,temperature=.35){const config=apiConfig(),model=window.IdealMachineAPI?.getModel?.('memory')||window.IdealMachineAPI?.getModel?.('chat');if(!config.endpoint||!model)throw new Error('请先在设置中配置记忆库模型');const headers={'Content-Type':'application/json'};if(config.key)headers.Authorization=`Bearer ${config.key}`;const response=await fetch(`${config.endpoint.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers,body:JSON.stringify({model,temperature,messages:[{role:'system',content:system},{role:'user',content:user}]})});if(!response.ok)throw new Error(`记忆接口 HTTP ${response.status}`);const payload=await response.json();return parseJSONObject(payload.choices?.[0]?.message?.content);}
  const transcript=(rounds,roleName)=>rounds.flatMap(round=>round.messages).map(item=>`${item.role==='user'?'用户':roleName}：${messageContent(item)}`).join('\n');
  async function summarizeBatch({roleId,profileId='',role,profile,rounds,settings,library}) {
    const sourceIds=rounds.flatMap(round=>round.messages.map(item=>item.id)).filter(Boolean), fingerprint=`${scopeKey(roleId,profileId)}|${sourceIds.join('|')}`;
    if(library.forgottenFingerprints.includes(fingerprint)||library.entries.some(item=>entryMatchesScope(item,roleId,profileId)&&item.fingerprint===fingerprint)) return null;
    const roleName=role?.nickname||role?.name||'角色'; const memory=await chatJSON(`你是关系长期记忆整理器。只提取聊天里确实发生、以后可能影响互动的事实、事件、偏好、承诺和情绪变化。忽略寒暄、系统提示、接口错误与重复内容，不得编造。只返回 JSON：{"title":"不超过20字","summary":"不超过${settings.summaryMaxChars}字","emotion":"情绪与关系变化","keywords":["3至8个关键词"],"importance":"日常或重要","importanceScore":0到1}。`,`角色：${roleName}\n角色设定：${role?.details||role?.signature||'暂无'}\n用户设定：${profile?.persona||'暂无'}\n聊天记录：\n${transcript(rounds,roleName)}`);
    const entry={id:uid('memory'),roleId,profileId,roleName,type:'chat',level:'long',fingerprint,sourceMessageIds:sourceIds,sourceRoundCount:rounds.length,title:String(memory.title||'聊天中的共同记忆').slice(0,30),summary:String(memory.summary||'').slice(0,settings.summaryMaxChars),emotion:String(memory.emotion||'').slice(0,Math.min(500,settings.summaryMaxChars)),keywords:Array.isArray(memory.keywords)?memory.keywords.map(String).slice(0,8):['聊天'],importance:memory.importance||(Number(memory.importanceScore)>=.75?'重要':'日常'),importanceScore:Math.min(1,Math.max(0,Number(memory.importanceScore)||.55)),createdAt:Date.now()};
    if(settings.semanticRecall&&embeddingSignature()){try{storeEmbedding(entry,await embedding(`${entry.title}\n${entry.summary}\n${entry.emotion}\n${entry.keywords.join(' ')}`),embeddingSignature());}catch{}}
    library.entries.unshift(entry); return entry;
  }
  async function updateCore({roleId,profileId='',role,profile,settings,library,force=false,rebuild=false}) {
    const key=scopeKey(roleId,profileId), entries=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&(item.level==='long'||item.type==='offline'||item.type==='chat')).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0)), meta=library.roleMeta[key]||=( {roleId,profileId} );
    if(!entries.length){delete library.cores[key];meta.coreEntryCount=0;meta.coreEntryIds=[];return false;}
    const ids=new Set(Array.isArray(meta.coreEntryIds)?meta.coreEntryIds:[]), pending=rebuild?entries:(ids.size?entries.filter(item=>!ids.has(item.id)):entries.slice(Math.min(Number(meta.coreEntryCount||0),entries.length)));
    if(!force&&pending.length<settings.coreEveryLongMemories)return false;if(!pending.length&&library.cores[key]?.content)return false;
    const oldCore=rebuild?'暂无，请完全根据下方现存记忆重新建立。':(library.cores[key]?.content||'暂无，这是第一次建立核心记忆。'), roleName=role?.nickname||role?.name||'角色';
    const result=await chatJSON(`你是核心记忆维护器。把旧核心与现存长期记忆合并、去重、纠错，重写为不超过${settings.coreMaxChars}字的稳定关系档案。优先保存稳定信息、重要事件、承诺、边界、关系阶段和情感变化。只能使用下方仍然存在的记忆，不得保留已删除内容。只返回 JSON：{"content":"核心记忆正文","changes":"本次更新说明"}。`,`角色：${roleName}\n角色设定：${role?.details||role?.signature||'暂无'}\n用户设定：${profile?.persona||'暂无'}\n旧核心记忆：\n${oldCore}\n\n${rebuild?'全部现存':'新增'}长期记忆：\n${pending.map(coreMemoryLine).join('\n')}`,.25);
    const previous=library.cores[key]||{};library.cores[key]={roleId,profileId,roleName,content:String(result.content||'').slice(0,settings.coreMaxChars),changes:String(result.changes||''),version:Number(previous.version||0)+1,memoryCount:entries.length,updatedAt:Date.now()};meta.coreEntryCount=entries.length;meta.coreEntryIds=entries.map(item=>item.id);return true;
  }
  async function backfillEmbeddings(roleId,profileId,settings,library){const signature=embeddingSignature();if(!settings.semanticRecall||!signature)return 0;const targets=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&(item.embeddingSignature!==signature||!unpackEmbedding(item))).slice(0,50);if(!targets.length)return 0;try{const vectors=await embeddingMany(targets.map(item=>`${item.title||''}\n${item.summary||''}\n${item.emotion||''}\n${(item.keywords||[]).join(' ')}`));let count=0;targets.forEach((item,index)=>{if(storeEmbedding(item,vectors[index],signature))count+=1;});return count;}catch{return 0;}}

  async function processAvailable(options={}) {
    const roleId=options.roleId, chat=options.chat||readJSON(chatKey,{}).chats?.[roleId], profileId=options.profileId??chat?.profileId??''; if(!roleId)return{created:0,coreUpdated:false,pendingRounds:0}; const key=scopeKey(roleId,profileId); if(processing.has(key))return processing.get(key);
    const task=(async()=>{const settings=settingsFor(chat);if(!chat||!settings.enabled||(!options.force&&!settings.autoSummary))return{created:0,coreUpdated:false,pendingRounds:0};const library=readLibrary();if(migrateRoleScope(library,roleId,profileId))saveLibrary(library);const meta=library.roleMeta[key]||=( {roleId,profileId} ),messages=Array.isArray(chat.messages)?chat.messages:[];let startIndex=0;if(meta.lastSummarizedMessageId){const found=messages.findIndex(item=>item.id===meta.lastSummarizedMessageId);if(found>=0)startIndex=found+1;else meta.lastSummarizedMessageId='';}const rounds=completedRounds(messages,startIndex,profileId),maxBatches=clamp(options.maxBatches,1,50,options.force?20:3);let created=0,consumed=0;while(rounds.length-consumed>=settings.summaryEveryRounds&&consumed/settings.summaryEveryRounds<maxBatches){const batch=rounds.slice(consumed,consumed+settings.summaryEveryRounds),entry=await summarizeBatch({...options,profileId,rounds:batch,settings,library});if(entry)created+=1;const last=batch.at(-1)?.messages.at(-1);if(last?.id)meta.lastSummarizedMessageId=last.id;meta.summarizedRounds=Number(meta.summarizedRounds||0)+batch.length;consumed+=batch.length;saveLibrary(library);}const hasEntries=library.entries.some(item=>entryMatchesScope(item,roleId,profileId));const coreUpdated=(created||options.force)&&hasEntries?await updateCore({...options,profileId,settings,library,force:Boolean(options.force)}):false;const embedded=options.force?await backfillEmbeddings(roleId,profileId,settings,library):0;if(coreUpdated||embedded)saveLibrary(library);return{created,coreUpdated,pendingRounds:Math.max(0,rounds.length-consumed)};})().finally(()=>processing.delete(key));processing.set(key,task);return task;
  }
  async function processAllChats(options={}){const data=readJSON(chatKey,{}),contacts=Array.isArray(data.contacts)?data.contacts:[],profiles=Array.isArray(data.profiles)?data.profiles:[];let created=0,coreUpdated=0;const errors=[];for(const role of contacts){const chat=data.chats?.[role.id],profile=profiles.find(item=>item.id===chat?.profileId);try{const result=await processAvailable({roleId:role.id,profileId:chat?.profileId||'',role,profile,chat,force:true,maxBatches:options.maxBatches||20});created+=result.created;coreUpdated+=result.coreUpdated?1:0;}catch(error){errors.push(`${role.nickname||role.name||'角色'}：${error.message}`);}}return{created,coreUpdated,errors};}

  function purgeCore(library,roleId,profileId){const key=scopeKey(roleId,profileId);delete library.cores[key];const meta=library.roleMeta[key]||=( {roleId,profileId} );meta.coreEntryIds=[];meta.coreEntryCount=0;}
  async function rebuildCoreAfterRemoval({library,roleId,profileId='',role,profile,chat}){if(!library.entries.some(item=>entryMatchesScope(item,roleId,profileId)))return false;try{const updated=await updateCore({roleId,profileId,role,profile,settings:settingsFor(chat),library,force:true,rebuild:true});saveLibrary(library);return updated;}catch{return false;}}
  async function invalidateMessages({roleId,profileId='',messageIds=[],chat,role,profile,resummarize=true}) {
    if(!roleId||!messageIds.length)return{removed:0,rebuilt:false};const library=readLibrary();migrateRoleScope(library,roleId,profileId);const ids=new Set(messageIds.filter(Boolean)),affected=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&item.type==='chat'&&(item.sourceMessageIds||[]).some(id=>ids.has(id))),cutoff=affected.length?Math.min(...affected.map(item=>Number(item.createdAt||0))):Infinity,removed=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&item.type==='chat'&&(!(item.sourceMessageIds||[]).length||Number(item.createdAt||0)>=cutoff)),removedIds=new Set(removed.map(item=>item.id));library.entries=library.entries.filter(item=>!removedIds.has(item.id));const key=scopeKey(roleId,profileId),remaining=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&item.type==='chat').sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0)),meta=library.roleMeta[key]||=( {roleId,profileId} );meta.lastSummarizedMessageId=remaining.at(-1)?.sourceMessageIds?.at(-1)||'';meta.summarizedRounds=remaining.reduce((sum,item)=>sum+Number(item.sourceRoundCount||0),0);purgeCore(library,roleId,profileId);saveLibrary(library);let rebuilt=await rebuildCoreAfterRemoval({library,roleId,profileId,role,profile,chat});if(resummarize&&chat){try{const result=await processAvailable({roleId,profileId,role,profile,chat,force:true,maxBatches:50});rebuilt=rebuilt||result.coreUpdated;}catch{}}return{removed:removed.length,rebuilt};
  }
  async function forgetConversation({roleId,profileId='',chat,role,profile}){if(!roleId)return{removed:0,rebuilt:false};const library=readLibrary();migrateRoleScope(library,roleId,profileId);const removed=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&item.type==='chat').length;library.entries=library.entries.filter(item=>!(entryMatchesScope(item,roleId,profileId)&&item.type==='chat'));const key=scopeKey(roleId,profileId),meta=library.roleMeta[key]||=( {roleId,profileId} );meta.lastSummarizedMessageId='';meta.summarizedRounds=0;purgeCore(library,roleId,profileId);saveLibrary(library);return{removed,rebuilt:await rebuildCoreAfterRemoval({library,roleId,profileId,role,profile,chat})};}
  function forgetRole(roleId){if(!roleId)return 0;const library=readLibrary(),before=library.entries.length;library.entries=library.entries.filter(item=>item.roleId!==roleId);Object.keys(library.cores).forEach(key=>{if(key===roleId||key.startsWith(`${roleId}::`))delete library.cores[key];});Object.keys(library.roleMeta).forEach(key=>{if(key===roleId||key.startsWith(`${roleId}::`))delete library.roleMeta[key];});saveLibrary(library);return before-library.entries.length;}
  function forgetProfile(profileId){if(!profileId)return 0;const library=readLibrary(),before=library.entries.length;library.entries=library.entries.filter(item=>item.profileId!==profileId);Object.keys(library.cores).forEach(key=>{if(key.endsWith(`::${profileId}`)||library.cores[key]?.profileId===profileId)delete library.cores[key];});Object.keys(library.roleMeta).forEach(key=>{if(key.endsWith(`::${profileId}`)||library.roleMeta[key]?.profileId===profileId)delete library.roleMeta[key];});saveLibrary(library);return before-library.entries.length;}
  function syncLegacySources(data=readJSON(chatKey,{})){
    const library=readLibrary(),contacts=Array.isArray(data.contacts)?data.contacts:[],chats=data.chats&&typeof data.chats==='object'?data.chats:{};let created=0;
    contacts.forEach(role=>{const chat=chats[role.id]||{},profileId=chat.profileId||'';(chat.offlineSessions||[]).forEach(session=>{if(!session?.ended||!session.summary)return;const sourceId=`offline:${role.id}:${session.id}`;if(library.entries.some(item=>item.sourceId===sourceId)||library.forgottenSourceIds.includes(sourceId))return;library.entries.unshift({id:uid('memory'),sourceId,roleId:role.id,profileId,roleName:role.nickname||role.name||'角色',type:'offline',level:'long',title:session.reason?`线下见面：${String(session.reason).slice(0,20)}`:'一次线下见面',summary:String(session.summary),emotion:session.mood||'见面后的情绪被保留下来',keywords:['线下见面'],importance:'重要',importanceScore:.82,createdAt:session.endedAt||Date.now()});created+=1;});const summary=typeof chat.memorySummary==='string'?chat.memorySummary:typeof chat.summary==='string'?chat.summary:'';if(summary.trim()){const sourceId=`legacy-chat:${role.id}:${summary.trim().slice(0,80)}`;if(!library.entries.some(item=>item.sourceId===sourceId)&&!library.forgottenSourceIds.includes(sourceId)){library.entries.push({id:uid('memory'),sourceId,roleId:role.id,profileId,roleName:role.nickname||role.name||'角色',type:'chat',level:'long',title:'聊天中的记忆',summary:summary.trim(),emotion:'',keywords:['聊天'],importance:'日常',createdAt:Date.now()});created+=1;}}});
    if(created)saveLibrary(library);return created;
  }
  async function deleteEntry(entryId,options={}){const library=readLibrary(),entry=library.entries.find(item=>item.id===entryId);if(!entry)return false;library.entries=library.entries.filter(item=>item.id!==entryId);if(entry.fingerprint&&!library.forgottenFingerprints.includes(entry.fingerprint))library.forgottenFingerprints.push(entry.fingerprint);if(entry.sourceId&&!library.forgottenSourceIds.includes(entry.sourceId))library.forgottenSourceIds.push(entry.sourceId);purgeCore(library,entry.roleId,entry.profileId||'');saveLibrary(library);await rebuildCoreAfterRemoval({library,roleId:entry.roleId,profileId:entry.profileId||'',...options});return true;}
  async function ingestOffline({roleId,profileId='',role,profile,chat,session}){if(!roleId||!session?.id||!session.ended||!session.summary)return null;const library=readLibrary();migrateRoleScope(library,roleId,profileId);const sourceId=`offline:${roleId}:${session.id}`,existing=library.entries.find(item=>item.sourceId===sourceId);if(existing||library.forgottenSourceIds.includes(sourceId))return existing||null;const settings=settingsFor(chat),entry={id:uid('memory'),sourceId,roleId,profileId,roleName:role?.nickname||role?.name||'角色',type:'offline',level:'long',title:session.reason?`线下见面：${String(session.reason).slice(0,20)}`:'一次线下见面',summary:String(session.summary).slice(0,settings.summaryMaxChars),emotion:String(session.mood||'见面后的情绪被保留下来').slice(0,300),keywords:['线下见面',session.place,session.reason].filter(Boolean).map(String).slice(0,8),importance:'重要',importanceScore:.82,createdAt:session.endedAt||Date.now()};if(settings.semanticRecall&&embeddingSignature()){try{storeEmbedding(entry,await embedding(`${entry.title}\n${entry.summary}\n${entry.emotion}`),embeddingSignature());}catch{}}library.entries.unshift(entry);try{await updateCore({roleId,profileId,role,profile,settings,library});}catch{}saveLibrary(library);return entry;}
  function stats(roleId,chat){const profileId=chat?.profileId||'',library=readLibrary();const migrated=migrateRoleScope(library,roleId,profileId);const key=scopeKey(roleId,profileId),meta=library.roleMeta[key]||{},entries=library.entries.filter(item=>entryMatchesScope(item,roleId,profileId)&&(item.level==='long'||item.type==='chat'||item.type==='offline')),settings=settingsFor(chat);let startIndex=0;if(meta.lastSummarizedMessageId){const found=(chat?.messages||[]).findIndex(item=>item.id===meta.lastSummarizedMessageId);if(found>=0)startIndex=found+1;}if(migrated)saveLibrary(library);return{longCount:entries.length,hasCore:Boolean(library.cores[key]?.content),pendingRounds:completedRounds(chat?.messages||[],startIndex,profileId).length,settings};}

  window.IdealMachineMemory={defaults,readLibrary,saveLibrary,settingsFor,applySettings,prepareContext,processAvailable,processAllChats,updateCore,stats,embeddingModel,embeddingConfig,invalidateMessages,forgetConversation,forgetRole,forgetProfile,deleteEntry,ingestOffline,syncLegacySources,scopeKey,adoptLegacyScope};
})();
