(() => {
  const key = 'ideal-machine-town';
  const chatKey = 'ideal-machine-chat';
  const app = document.createElement('div');
  app.className = 'town-app';
  document.body.appendChild(app);

  const places = [
    { id: 'clock', name: '四季钟楼', sub: '看看今天与未来的约定', target: 'rili', action: '打开日历', x: 50, y: 17, color: '#c98d70', roof: '#8f5d5b' },
    { id: 'shop', name: '橡果商店', sub: '商业街上总有新鲜东西', target: 'gouwu', action: '进入购物', x: 28, y: 29, color: '#e3ad68', roof: '#a95f4f' },
    { id: 'music', name: '风铃唱片店', sub: '木门后传来熟悉的旋律', target: 'yinyue', action: '打开音乐', x: 72, y: 29, color: '#9d8cb6', roof: '#67597e' },
    { id: 'library', name: '萤火图书馆', sub: '安静收藏走过的时光', target: 'jiyiku', action: '进入记忆库', x: 24, y: 54, color: '#83a693', roof: '#567766' },
    { id: 'plaza', name: '蒲公英广场', sub: '镇民们在这里交换新消息', target: 'luntan', action: '前往论坛', x: 50, y: 51, color: '#e7c777', roof: '#a87955' },
    { id: 'garden', name: '月芽植物园', sub: '散步时也许会遇见小惊喜', target: '', action: '', x: 82, y: 65, color: '#83b789', roof: '#4e8365' },
    { id: 'forest', name: '星芽林地', sub: '修好小桥后开放的采集区', target: '', action: '', x: 90, y: 17, color: '#79a56b', roof: '#416b4d', locked: true },
    { id: 'home', name: '你们的小家', sub: '灯一直为你们亮着', target: 'jia', action: '回到小家', x: 18, y: 76, color: '#e4a1a3', roof: '#9e5e6d' }
  ];

  const events = {
    clock: [
      '{role}在钟楼下停了一会儿，说今天的时间走得刚刚好。',
      '钟声响过，{user}和{role}约好下次也要一起经过这里。',
      '一片小小的铜色落叶落在钟盘影子里，被你们夹进了随身本。'
    ],
    shop: [
      '店主送给{user}和{role}一颗试吃的蜂蜜糖，甜味在路上留了很久。',
      '{role}在橱窗前挑了半天，最后记住了一件很适合{user}的小东西。',
      '商业街正在布置彩旗，你们顺手帮忙系好了最靠近屋檐的一面。'
    ],
    music: [
      '唱片转到副歌时，{role}轻轻跟着哼了两句。',
      '{user}和{role}在试听耳机里听见了一首适合黄昏散步的歌。',
      '店门口的风铃响了三次，老板说这代表今天会遇见好心情。'
    ],
    library: [
      '{role}从旧书里找到一张没有署名的花朵书签，把它递给了{user}。',
      '你们并排坐在窗边，谁也没有说话，却觉得这个下午很完整。',
      '管理员推荐了一本关于小镇传说的薄册子，里面夹着手绘地图。'
    ],
    plaza: [
      '广场上的鸽子忽然一起飞起，{user}和{role}同时抬头笑了。',
      '卖花的小摊送来一枝雏菊，{role}把它别在了{user}身边。',
      '镇民正在排练晚会，你们被邀请敲了一小段节拍。'
    ],
    garden: [
      '温室里开了一朵今天才有的淡粉色小花，{role}说它很像好梦。',
      '{user}在叶片背后发现一只睡着的瓢虫，你们小心地没有吵醒它。',
      '园丁送给你们两粒星星形状的种子，说要等到心情好的时候种下。'
    ],
    home: [
      '窗户里透出暖光，{role}说无论逛到哪里，回家的路都很好认。',
      '{user}和{role}在门口拍掉衣角的草屑，一起推开了家门。',
      '信箱里躺着一张没有落款的小卡片：欢迎回家。'
    ],
    forest: [
      '{role}在林地边发现一枚形状特别的松果，决定把它留给{user}。',
      '林间的风吹过树梢，{user}和{role}听见了像铃铛一样的声音。',
      '你们沿着新修好的小路走了一圈，发现这里比地图上大得多。'
    ]
  };

  const cropCatalog = [
    { id: 'turnip', name: '月白萝卜', seed: 'seed_turnip', seedName: '萝卜种子', seedPrice: 8, grow: 1, sell: 24, icon: '◈', season: '春' },
    { id: 'berry', name: '星星莓', seed: 'seed_berry', seedName: '莓果种子', seedPrice: 14, grow: 2, sell: 48, icon: '✦', season: '夏' },
    { id: 'pumpkin', name: '蜂蜜南瓜', seed: 'seed_pumpkin', seedName: '南瓜种子', seedPrice: 20, grow: 3, sell: 76, icon: '●', season: '秋' },
    { id: 'crystal', name: '雪铃花', seed: 'seed_crystal', seedName: '雪铃种子', seedPrice: 12, grow: 2, sell: 40, icon: '❋', season: '冬' }
  ];
  const fishCatalog = [
    { id: 'sunfish', name: '太阳鱼', price: 32, icon: '◒' },
    { id: 'rainbowfish', name: '彩虹鱼', price: 58, icon: '◈' },
    { id: 'moonfish', name: '月光鱼', price: 86, icon: '☾' }
  ];
  const gatherCatalog = [
    { id: 'flower', name: '野花', icon: '✿', reward: 1 },
    { id: 'wood', name: '软木枝', icon: '⌁', reward: 2 },
    { id: 'stone', name: '圆润石头', icon: '◆', reward: 2 },
    { id: 'insect', name: '彩翅小蝴蝶', icon: '◌', reward: 1 },
    { id: 'gift', name: '神秘小礼物', icon: '♡', reward: 1 }
  ];
  const npcCatalog = [
    { id: 'mayor', name: '莓果镇长', role: '管理小镇与公告板', icon: '♛' },
    { id: 'florist', name: '花房姐姐', role: '照看植物园与季节花朵', icon: '✿' },
    { id: 'angler', name: '河岸爷爷', role: '知道每一种鱼的习性', icon: '♧' }
  ];

  let state = load();
  let page = 'map';
  let activePlace = '';
  let picker = '';
  let giftPicker = '';
  let toast = '';
  let toastTimer = 0;
  let travelTimer = 0;
  let lastWindowMode = '';

  function read(name, fallback) { try { const value = JSON.parse(localStorage.getItem(name) || 'null'); return value ?? fallback; } catch { return fallback; } }
  function load() { try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return { profileId: value.profileId || '', roleId: value.roleId || '', towns: value.towns || {} }; } catch { return { profileId: '', roleId: '', towns: {} }; } }
  function save() { localStorage.setItem(key, JSON.stringify(state)); }
  function chat() { const value = read(chatKey, {}); return { profiles: Array.isArray(value.profiles) ? value.profiles : [], contacts: Array.isArray(value.contacts) ? value.contacts : [], chats: value.chats || {} }; }
  function ensureBinding() {
    const data = chat();
    if (!state.roleId || !data.contacts.some(item => item.id === state.roleId)) state.roleId = data.contacts[0]?.id || '';
    const linkedProfileId = state.roleId ? data.chats?.[state.roleId]?.profileId : '';
    if (linkedProfileId && data.profiles.some(item => item.id === linkedProfileId)) state.profileId = linkedProfileId;
    else if (!state.profileId || !data.profiles.some(item => item.id === state.profileId)) state.profileId = data.profiles[0]?.id || '';
  }
  function profile() { ensureBinding(); return chat().profiles.find(item => item.id === state.profileId) || null; }
  function role() { ensureBinding(); return chat().contacts.find(item => item.id === state.roleId) || null; }
  function personName(person, fallback) { return person?.nickname || person?.realName || person?.name || fallback; }
  function userName() { return personName(profile(), '我'); }
  function roleName() { return personName(role(), 'Ta'); }
  function pairKey() { return `${state.profileId || 'guest'}::${state.roleId || 'solo'}`; }
  function today() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function seasonInfo(date = new Date()) { const month = date.getMonth() + 1; if (month <= 2 || month === 12) return { name: '冬', icon: '❄', weather: ['晴朗', '飘雪', '晴朗'] }; if (month <= 5) return { name: '春', icon: '✿', weather: ['晴朗', '小雨', '多云'] }; if (month <= 8) return { name: '夏', icon: '☀', weather: ['晴朗', '阵雨', '晴朗'] }; return { name: '秋', icon: '❋', weather: ['晴朗', '多云', '小雨'] }; }
  function weatherForDate(date = new Date()) { const info = seasonInfo(date); const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(); return info.weather[seed % info.weather.length]; }
  function festivalForDate(date = new Date()) { const month = date.getMonth() + 1; const day = date.getDate(); const list = [{ month: 4, day: 15, name: '春日花会', icon: '✿', detail: '广场上挂满花环，大家交换一朵最喜欢的花。' }, { month: 7, day: 15, name: '夏日祭', icon: '☀', detail: '河边亮起彩灯，夜里会有一场小小的烟火。' }, { month: 10, day: 15, name: '金色收获节', icon: '❋', detail: '把今年最满意的作物带到广场，和镇民一起分享。' }, { month: 12, day: 24, name: '冬日灯会', icon: '✦', detail: '每家门口都点起暖灯，雪地里留下两个人的脚印。' }]; return list.find(item => item.month === month && item.day === day) || null; }
  function nextFestival(date = new Date()) { const list = [{ month: 4, day: 15, name: '春日花会', icon: '✿' }, { month: 7, day: 15, name: '夏日祭', icon: '☀' }, { month: 10, day: 15, name: '金色收获节', icon: '❋' }, { month: 12, day: 24, name: '冬日灯会', icon: '✦' }]; const now = new Date(date.getFullYear(), date.getMonth(), date.getDate()); return list.map(item => ({ ...item, date: new Date(date.getFullYear(), item.month - 1, item.day) })).concat(list.map(item => ({ ...item, date: new Date(date.getFullYear() + 1, item.month - 1, item.day) }))).filter(item => item.date >= now).sort((a, b) => a.date - b.date)[0]; }
  function dateDiff(from, to = today()) { return Math.max(0, Math.floor((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000)); }
  function taskSet() { return [{ id: 'gather', title: '把春风带回小镇', detail: '采集任意 2 份自然材料', type: 'gather', need: 2, reward: 36, icon: '✿' }, { id: 'fish', title: '河边的午后', detail: '钓到 1 条鱼', type: 'fish', need: 1, reward: 45, icon: '◒' }, { id: 'visit', title: '熟悉每条小路', detail: '拜访 2 个小镇地点', type: 'visit', need: 2, reward: 30, icon: '⌂' }, { id: 'gift', title: '给朋友带点心意', detail: '送出 1 份礼物', type: 'gift', need: 1, reward: 42, icon: '♡' }]; }
  function ensureSystems(data) {
    data.coins = Math.max(0, Number(data.coins ?? 120)); data.maxEnergy = 100; if (!data.energyScale) { const legacyEnergy = Number(data.energy ?? data.maxEnergy); data.energy = legacyEnergy <= 6 ? Math.round((legacyEnergy / 6) * data.maxEnergy) : legacyEnergy; data.energyScale = 1; } data.inventory ||= { seed_turnip: 2 }; data.collection ||= { fish: [], crops: [], gather: [], events: [], furniture: [] }; data.collection.fish ||= []; data.collection.crops ||= []; data.collection.gather ||= []; data.collection.events ||= []; data.collection.furniture ||= [];
    data.farm ||= { plots: [] }; data.farm.plots = Array.from({ length: 6 }, (_, index) => data.farm.plots[index] || null); data.npcs ||= {}; npcCatalog.forEach(item => { data.npcs[item.id] = Math.max(0, Number(data.npcs[item.id] || 0)); }); data.upgrades ||= { bridge: false, market: false }; data.stats ||= { gather: 0, fish: 0, harvest: 0, gift: 0, explore: 0 }; data.gatheredToday ||= {}; data.fishing ||= null;
    if (!Array.isArray(data.tasks) || !data.tasks.length) data.tasks = taskSet();
    if (!data.tasks.some(task => task.id === 'gift')) data.tasks.push(taskSet().find(task => task.id === 'gift'));
    if (data.day !== today()) { data.day = today(); data.energy = data.maxEnergy; data.visitedToday = {}; data.gatheredToday = {}; data.stats = { gather: 0, fish: 0, harvest: 0, gift: 0, explore: 0 }; data.tasks = taskSet(); data.fishing = null; }
    const homeState = read('ideal-machine-home', {}); const currentHome = homeState.homes?.[state.profileId || 'guest']; const furnitureIds = Array.isArray(currentHome?.owned) ? currentHome.owned.map(item => item.itemId || item.id).filter(Boolean) : []; data.collection.furniture = [...new Set(furnitureIds)]; data.weather = weatherForDate(); return data;
  }
  function town() {
    ensureBinding();
    state.towns[pairKey()] ||= { stamps: 0, visits: {}, position: 'home', journal: [], energy: 6, day: today(), visitedToday: {} };
    const data = ensureSystems(state.towns[pairKey()]);
    data.visits ||= {}; data.journal ||= []; data.visitedToday ||= {}; data.position ||= 'home';
    data.energy = Math.max(0, Math.min(data.maxEnergy, Number(data.energy ?? data.maxEnergy)));
    return data;
  }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function avatar(person, fallback) { const name = personName(person, fallback); return person?.avatar ? `<img src="${esc(person.avatar)}" alt="">` : `<span>${esc(name.slice(0, 1))}</span>`; }
  function place(id) { return places.find(item => item.id === id) || places[places.length - 1]; }
  function townHour(date = new Date()) { return date.getHours() + date.getMinutes() / 60; }
  function placeIsOpen(item, date = new Date()) { if (!item || item.id === 'home' || item.id === 'clock') return true; const hour = townHour(date); if (item.id === 'forest' || item.id === 'garden') return hour >= 6 && hour < 21; if (item.id === 'plaza') return hour >= 7 && hour < 22; return hour >= 8 && hour < 20; }
  function season() { return seasonInfo().name; }
  function clock() { return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
  function dateLabel() { const date = new Date(); return `第 1 年 · ${season()} · ${date.getDate()} 日`; }
  function interpolate(text) { return String(text).replaceAll('{user}', userName()).replaceAll('{role}', roleName()); }
  function itemName(id) { return cropCatalog.find(item => `seed_${item.id}` === id)?.seedName || cropCatalog.find(item => `crop_${item.id}` === id)?.name || fishCatalog.find(item => `fish_${item.id}` === id)?.name || gatherCatalog.find(item => item.id === id)?.name || ({ gift: '神秘小礼物', wood: '软木枝', stone: '圆润石头', flower: '野花' }[id] || id); }
  function addItem(data, id, amount = 1) { data.inventory[id] = Math.max(0, Number(data.inventory[id] || 0) + amount); }
  function takeItem(data, id, amount = 1) { if (Number(data.inventory[id] || 0) < amount) return false; data.inventory[id] -= amount; return true; }
  function spendEnergy(data, amount = 10) { if (data.energy < amount) { flash('今天的体力不够啦，明天会恢复。'); return false; } data.energy -= amount; return true; }
  function markCollection(data, group, id) { if (!data.collection[group].includes(id)) data.collection[group].push(id); }
  function updateTasks(data) { data.tasks.forEach(task => { task.progress = task.type === 'gather' ? Math.min(task.need, data.stats.gather) : task.type === 'fish' ? Math.min(task.need, data.stats.fish) : task.type === 'visit' ? Math.min(task.need, data.stats.explore) : task.type === 'gift' ? Math.min(task.need, data.stats.gift) : Math.min(task.need, data.stats.harvest); }); }
  function recordTownEvent(data, text, placeName = '小镇') { data.journal.unshift({ id: `town-${Date.now()}`, place: placeName, text: interpolate(text), date: `${season()} · ${new Date().getMonth() + 1}月${new Date().getDate()}日 ${clock()}` }); data.journal = data.journal.slice(0, 30); }
  function cropStatus(plot) { if (!plot) return { text: '空地', ready: false }; const crop = cropCatalog.find(item => item.id === plot.seed); const need = crop?.grow || 1; const grown = Math.min(need, dateDiff(plot.plantedOn)); const watered = (plot.wateredDays || []).length; const ready = grown >= need && watered >= need; const text = ready ? '可以收获啦' : grown >= need ? '还要浇水才能收获' : `成长 ${grown}/${need} 天`; return { crop, grown, watered, ready, text }; }
  function buySeed(id) { const data = town(); const crop = cropCatalog.find(item => item.id === id); if (!crop || data.coins < crop.seedPrice) return flash('芽币还不够，先去采集或完成公告任务吧。'); data.coins -= crop.seedPrice; addItem(data, crop.seed); save(); flash(`买到了 ${crop.seedName}。`); render(); }
  function plantSeed(id) { const data = town(); const crop = cropCatalog.find(item => item.id === id); const index = data.farm.plots.findIndex(plot => !plot); if (!crop || index < 0) return flash(index < 0 ? '六块小田都种满啦。' : '暂时没有这种种子。'); if (crop.season !== season()) return flash(`现在是${season()}季，${crop.name}要等到${crop.season}季才能种。`); if (!takeItem(data, crop.seed)) return flash(`还没有${crop.seedName}。`); data.farm.plots[index] = { seed: crop.id, plantedOn: today(), wateredDays: [] }; save(); flash(`${crop.name}已经种下啦，记得浇水。`); render(); }
  function waterPlot(index) { const data = town(); const plot = data.farm.plots[index]; if (!plot) return; if (data.energy < 1) return flash('今天的体力不够啦，明天会恢复。'); const energyCost = Math.min(1 + Math.floor(Math.random() * 3), data.energy); if (!spendEnergy(data, energyCost)) return; plot.wateredDays ||= []; if (!plot.wateredDays.includes(today())) plot.wateredDays.push(today()); save(); flash(`小苗喝饱水了，消耗了 ${energyCost} 点体力。`); render(); }
  function harvestPlot(index) { const data = town(); const plot = data.farm.plots[index]; const status = cropStatus(plot); if (!plot || !status.ready) return flash('这块田还没有成熟哦。'); addItem(data, `crop_${plot.seed}`, 1); markCollection(data, 'crops', plot.seed); data.stats.harvest += 1; data.farm.plots[index] = null; updateTasks(data); save(); flash(`收获了 ${status.crop.name}，可以在下方出售。`); render(); }
  function sellItem(id) { const data = town(); const crop = cropCatalog.find(item => `crop_${item.id}` === id); const fish = fishCatalog.find(item => `fish_${item.id}` === id); const value = crop?.sell || fish?.price || 0; if (!value || !takeItem(data, id)) return; data.coins += value; save(); flash(`出售成功，获得 ${value} 枚芽币。`); render(); }
  function gather(id) { const data = town(); const item = gatherCatalog.find(entry => entry.id === id); if (!item || data.gatheredToday[id]) return flash('这里今天已经采集过啦，明天再来看看吧。'); if (!spendEnergy(data, 12)) return; data.gatheredToday[id] = true; addItem(data, id, item.reward); data.stats.gather += item.reward; markCollection(data, 'gather', id); updateTasks(data); save(); flash(`采集到了 ${item.name} ×${item.reward}。`); render(); }
  function beginFishing() { const data = town(); if (data.fishing) return; if (!spendEnergy(data, 18)) return; data.fishing = { started: Date.now(), biteAt: Date.now() + 1100 + Math.floor(Math.random() * 1800), ready: false }; save(); render(); clearTimeout(fishingTimer); fishingTimer = setTimeout(() => { const current = town(); if (current.fishing) { current.fishing.ready = true; save(); render(); } }, data.fishing.biteAt - Date.now()); }
  function finishFishing() { const data = town(); if (!data.fishing) return; if (!data.fishing.ready) { data.fishing = null; save(); return flash('提竿早了一点，鱼游走啦。'); } const fish = fishCatalog[Math.floor(Math.random() * fishCatalog.length)]; addItem(data, `fish_${fish.id}`); markCollection(data, 'fish', fish.id); data.stats.fish += 1; data.fishing = null; updateTasks(data); save(); flash(`钓到了 ${fish.name}！`); render(); }
  function talkNpc(id) { const data = town(); const npc = npcCatalog.find(item => item.id === id); if (!npc) return; const level = Number(data.npcs[id] || 0); data.npcs[id] = Math.min(10, level + 1); const text = level >= 4 ? `${npc.name}终于想起了你们上次的约定，邀请{user}和{role}改天一起去看看小镇另一边的风景。` : `${npc.name}和{user}聊了会儿天，也向{role}问起了最近的散步。`; recordTownEvent(data, text, npc.name); save(); flash(`${npc.name}的好感度 +1${level >= 4 ? '，解锁了特别对话' : ''}。`); render(); }
  function giftEntries(data) { return Object.entries(data.inventory).filter(([, count]) => Number(count) > 0).map(([id, count]) => { const crop = cropCatalog.find(item => id === `crop_${item.id}`); const fish = fishCatalog.find(item => id === `fish_${item.id}`); const gather = gatherCatalog.find(item => item.id === id && ['flower', 'gift', 'insect'].includes(item.id)); const item = crop || fish || gather; return item ? { id, name: crop?.name || fish?.name || gather?.name, icon: crop?.icon || fish?.icon || gather?.icon, count } : null; }).filter(Boolean); }
  function giftNpc(id, giftId) { const data = town(); const npc = npcCatalog.find(item => item.id === id); const gift = giftEntries(data).find(item => item.id === giftId); if (!npc || !gift || !takeItem(data, giftId)) return flash('这个物品暂时不能作为礼物送出。'); giftPicker = ''; data.npcs[id] = Math.min(10, Number(data.npcs[id] || 0) + 2); data.stats.gift += 1; recordTownEvent(data, `${npc.name}收到{user}和{role}送来的${gift.name}，笑着说今天的风都变甜了。`, npc.name); updateTasks(data); save(); flash(`把${gift.name}送给了${npc.name}，好感度 +2。`); render(); }
  function completeTask(index) { const data = town(); const task = data.tasks[index]; updateTasks(data); if (!task || task.done || task.progress < task.need) return; task.done = true; data.coins += task.reward; data.npcs.mayor = Math.min(10, Number(data.npcs.mayor || 0) + 1); save(); flash(`公告任务完成，获得 ${task.reward} 枚芽币。`); render(); }
  function upgradeTown(id) { const data = town(); const costs = { bridge: { wood: 6, stone: 4, label: '修好通往星芽林地的小桥' }, market: { wood: 8, flower: 3, label: '扩建橡果商店' } }; const upgrade = costs[id]; if (!upgrade || data.upgrades[id]) return; if (Object.entries(upgrade).some(([key, value]) => key !== 'label' && Number(data.inventory[key] || 0) < value)) return flash('材料还不够，再去采集一些吧。'); Object.entries(upgrade).forEach(([key, value]) => { if (key !== 'label') takeItem(data, key, value); }); data.upgrades[id] = true; recordTownEvent(data, `${upgrade.label}完成了！{user}和{role}一起为小镇留下了新的足迹。`, '小镇工程'); save(); flash(`${upgrade.label}。`); render(); }
  let fishingTimer = 0;
  function lightForTime(date = new Date()) {
    const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600 + date.getMilliseconds() / 3600000;
    const daylightProgress = Math.max(0, Math.min(1, (hour - 5.5) / 14));
    const sunHeight = Math.max(0, Math.sin(daylightProgress * Math.PI));
    const stops = [
      { at: 0, rgb: [20, 28, 58], opacity: .72, brightness: .5, lamp: 1, stars: 1, sx: 1, sy: 4, shadow: .2, name: '深夜' },
      { at: 5, rgb: [52, 60, 90], opacity: .56, brightness: .62, lamp: .95, stars: .8, sx: 9, sy: 5, shadow: .23, name: '破晓前' },
      { at: 6.5, rgb: [245, 137, 91], opacity: .36, brightness: .86, lamp: .38, stars: 0, sx: 14, sy: 7, shadow: .48, name: '清晨' },
      { at: 8, rgb: [255, 218, 145], opacity: .15, brightness: 1.04, lamp: 0, stars: 0, sx: 10, sy: 8, shadow: .36, name: '早晨' },
      { at: 12, rgb: [255, 246, 205], opacity: .07, brightness: 1.12, lamp: 0, stars: 0, sx: 2, sy: 8, shadow: .29, name: '正午' },
      { at: 16.5, rgb: [255, 204, 126], opacity: .2, brightness: 1.02, lamp: 0, stars: 0, sx: -9, sy: 8, shadow: .48, name: '午后' },
      { at: 18.5, rgb: [218, 92, 76], opacity: .44, brightness: .78, lamp: .38, stars: .12, sx: -16, sy: 7, shadow: .58, name: '黄昏' },
      { at: 20, rgb: [58, 48, 88], opacity: .58, brightness: .6, lamp: .9, stars: .78, sx: -6, sy: 4, shadow: .3, name: '入夜' },
      { at: 22, rgb: [20, 28, 58], opacity: .72, brightness: .5, lamp: 1, stars: 1, sx: 1, sy: 4, shadow: .2, name: '深夜' },
      { at: 24, rgb: [20, 28, 58], opacity: .72, brightness: .5, lamp: 1, stars: 1, sx: 1, sy: 4, shadow: .2, name: '深夜' }
    ];
    const nextIndex = Math.max(1, stops.findIndex(stop => hour <= stop.at)); const from = stops[nextIndex - 1]; const to = stops[nextIndex]; const ratio = Math.max(0, Math.min(1, (hour - from.at) / Math.max(.01, to.at - from.at)));
    const mix = (a, b) => a + (b - a) * ratio; const rgb = from.rgb.map((value, index) => Math.round(mix(value, to.rgb[index])));
    return { rgb, opacity: mix(from.opacity, to.opacity), brightness: mix(from.brightness, to.brightness), lamp: mix(from.lamp, to.lamp), stars: mix(from.stars, to.stars), sx: mix(from.sx, to.sx), sy: mix(from.sy, to.sy), shadow: mix(from.shadow, to.shadow), sunProgress: daylightProgress, sunHeight, name: ratio < .5 ? from.name : to.name, isDark: mix(from.lamp, to.lamp) > .3, window: mix(from.lamp, to.lamp) > .3 ? '#ffd77b' : '#d7edb7' };
  }
  function cottageBuildingMarkup(item) {
    const art = {
      clock: `<ellipse cx="60" cy="94" rx="38" ry="5" fill="#b8c9a6" opacity=".45"/><g stroke="#715c58" stroke-width="2" stroke-linejoin="round"><path d="M36 91V35h48v56Z" fill="#ead9ca"/><path d="m30 36 30-31 30 31-8 3H38Z" fill="#6f718d"/><path d="M75 26V10h10v27" fill="#b47f73"/><path d="M43 91V72q17-15 34 0v19" fill="#9b7468"/><circle cx="60" cy="47" r="13" fill="#fffaf0"/><path d="M60 38v10l7 5" fill="none" stroke-linecap="round"/><path d="M44 60h10v10H44zm22 0h10v10H66z" fill="#c9dde0"/></g><path d="M34 61q-10 12-4 29M86 59q8 13 2 31" fill="none" stroke="#79966c" stroke-width="3" stroke-linecap="round"/><circle cx="31" cy="75" r="5" fill="#eab0b3"/><circle cx="88" cy="75" r="5" fill="#f0c37d"/>`,
      shop: `<ellipse cx="60" cy="93" rx="53" ry="5" fill="#c3b1bd" opacity=".34"/><g stroke="#765f55" stroke-width="2" stroke-linejoin="round"><path d="M11 91V31h98v60Z" fill="#e8d5bd"/><path d="M7 33h106v10H7Z" fill="#756b70"/><path d="M14 44h92v8H14Z" fill="#f5c6d1"/><path d="M14 52h92v9H14Z" fill="#fff0e2"/><path d="M14 61h92v30H14Z" fill="#f3e5d2"/><path d="M20 66h31v20H20Zm49 0h31v20H69Z" fill="#c5deda"/><path d="M20 66h31m-16 0v20m49-20h31m-16 0v20" fill="none"/><path d="M50 91V70q10-9 20 0v21" fill="#a67968"/><path d="M49 69h22v-7H49Z" fill="#dca1ae"/><path d="M31 31V16h18v15m23 0V16h18v15" fill="#ead5bd"/><path d="M32 20h16m24 0h16" stroke="#fff4e4"/></g><path d="M15 86q11-19 23 5m79-5q-12-19-24 5" fill="none" stroke="#78966d" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="75" r="5" fill="#e895a7"/><circle cx="97" cy="76" r="5" fill="#f0c17d"/><path d="M25 44v8m18-8v8m18-8v8m18-8v8m18-8v8" stroke="#d993a5" stroke-width="2"/>`,
      music: `<ellipse cx="60" cy="94" rx="52" ry="5" fill="#c9b6c3" opacity=".36"/><g stroke="#735f68" stroke-width="2" stroke-linejoin="round"><path d="M12 91V48h96v43Z" fill="#e3d3c4"/><path d="m6 50 10-17h88l10 17-7 7H13Z" fill="#746979"/><path d="m42 34 18-20 18 20v15H42Z" fill="#d8a8b9"/><path d="M21 55h78v36H21Z" fill="#e3bdca"/><path d="M19 61h82v8H19Z" fill="#fff0e2"/><path d="M26 69h19v16H26zm49 0h19v16H75z" fill="#dce9e6"/><path d="M22 68h76M29 68v23m62-23v23" fill="none" stroke="#fff6ec" stroke-width="3"/><path d="M50 91V72h20v19" fill="#fff6ec"/><path d="M45 91h30l7 6H38Z" fill="#c8a596"/><path d="M34 55v36m13-36v36m26-36v36m13-36v36" stroke="#f4dce4" stroke-width="1"/><circle cx="60" cy="27" r="5" fill="#f6d7a8"/></g>`,
      library: `<ellipse cx="60" cy="94" rx="52" ry="5" fill="#b8c9a6" opacity=".45"/><g stroke="#5e5350" stroke-width="2" stroke-linejoin="round"><path d="M12 91V38h96v53Z" fill="#f2e7d4"/><path d="m6 41 26-31 29 27 20-27 34 33-8 6-25-25-20 27-29-27-20 24Z" fill="#6b5f59"/><path d="M16 43h88M32 18v73M61 38v53M82 19v72M12 65h96" fill="none" stroke="#755f55" stroke-width="4"/><path d="m16 43 16 22 29-27 21 27 22-22" fill="none" stroke="#755f55" stroke-width="4"/><path d="M45 91V68h22v23" fill="#986d5c"/><path d="M20 49h18v12H20zm50 0h25v12H70zm10 21h16v13H80z" fill="#c9dcda"/></g><path d="M18 90q2-17 12-20 0 15 8 20m58 0q-2-16-12-20 0 14-8 20" fill="#7f9d70"/>`,
      plaza: `<ellipse cx="60" cy="94" rx="52" ry="5" fill="#b8c9a6" opacity=".45"/><g stroke="#71605a" stroke-width="2" stroke-linejoin="round"><path d="m8 50 52-35 52 35-8 8H16Z" fill="#708072"/><path d="M20 55h80v7H20Z" fill="#f0e5d2"/><path d="M25 60v27M45 60v27M75 60v27M95 60v27" stroke="#e8dcc7" stroke-width="6"/><path d="M14 87h92l9 7H5Z" fill="#b89a7e"/><path d="M43 38q17-15 34 0" fill="none"/><circle cx="60" cy="29" r="6" fill="#d9a6b2"/></g><path d="M28 64q6 10 12 0m40 0q6 10 12 0" fill="none" stroke="#849c72" stroke-width="3"/><circle cx="36" cy="75" r="4" fill="#e9a4af"/><circle cx="86" cy="75" r="4" fill="#e7bd78"/>`,
      garden: `<ellipse cx="60" cy="94" rx="52" ry="5" fill="#b8c9a6" opacity=".45"/><g stroke="#63786f" stroke-width="2" stroke-linejoin="round"><path d="M11 90V44L32 15h56l21 29v46Z" fill="#def0e9" fill-opacity=".82"/><path d="M32 15 11 44h98L88 15ZM60 15v75M21 44v46m21-46v46m36-46v46m21-46v46M12 64h96" fill="none"/><path d="M49 90V67h22v23" fill="#f3e7d2"/></g><path d="M20 90q2-25 15-29 0 20 9 29m32 0q1-25 14-30 0 21 10 30" fill="#7fa978"/><circle cx="29" cy="70" r="5" fill="#e8a3b0"/><circle cx="91" cy="69" r="5" fill="#eac178"/>`,
      forest: `<ellipse cx="60" cy="94" rx="53" ry="5" fill="#c3b1bd" opacity=".34"/><g stroke="#695955" stroke-width="2" stroke-linejoin="round"><path d="M10 91V48h100v43Z" fill="#d4a88f"/><path d="m5 50 17-22h76l17 22-7 7H12Z" fill="#706775"/><path d="M15 55h90v36H15Z" fill="#e2c3ac"/><path d="M15 64h90M15 75h90" fill="none" stroke="#ae7968" stroke-width="4"/><path d="M20 91V67m80-19v43" fill="none" stroke="#7b5e58" stroke-width="4"/><path d="M45 91V69q15-12 30 0v22" fill="#966f60"/><path d="M23 59h20v15H23zm54 0h20v15H77z" fill="#c9dfdc"/><path d="M18 48v43m84-43v43" fill="none"/><path d="M18 91h84l8 6H10Z" fill="#b78670"/></g><path d="M16 91V78h17v13m54 0V78h17v13" fill="#f1dccd"/><path d="M15 87q12-18 24 5m81-5q-12-18-24 5" fill="none" stroke="#78966d" stroke-width="4"/><circle cx="24" cy="77" r="5" fill="#e7a5ae"/><circle cx="97" cy="76" r="5" fill="#e6bd7b"/>`,
      home: `<ellipse cx="60" cy="94" rx="53" ry="5" fill="#c3b1bd" opacity=".34"/><g stroke="#705a55" stroke-width="2" stroke-linejoin="round"><path d="M10 91V45h100v46Z" fill="#ead6c8"/><path d="m4 47 19-19h74l19 19-7 7H11Z" fill="#786963"/><path d="m43 29 17-18 17 18v17H43Z" fill="#d8a8b9"/><path d="M17 53h86v38H17Z" fill="#f3e5d8"/><path d="M11 64h98v8H11Z" fill="#fff0e2"/><path d="M24 72h17v14H24zm55 0h17v14H79z" fill="#c9dcda"/><path d="M18 70h84M22 70v21m76-21v21" fill="none" stroke="#fffaf0" stroke-width="3"/><path d="M50 91V68h20v23" fill="#9e7265"/><path d="M17 91h86l9 6H8Z" fill="#c39a87"/><path d="M25 59v32m70-32v32" fill="none" stroke="#c79d8e"/><path d="M15 64q13-18 26 0m42 0q13-18 26 0" fill="none" stroke="#f6d6dc" stroke-width="3"/></g><path d="M13 86q10-18 24 5m70-5q-10-18-24 5" fill="none" stroke="#7e9c72" stroke-width="4"/><circle cx="21" cy="79" r="5" fill="#e9a3ae"/><circle cx="101" cy="78" r="5" fill="#e9bd7b"/>`
    }[item.id] || '';
    return `<span class="town-building town-building-${item.id} is-cottage is-american-cottage" data-architecture="american-cottage"><svg viewBox="0 0 120 100" aria-hidden="true">${art}</svg></span>`;
  }
  function placeButton(item) {
    const visits = Number(town().visits[item.id] || 0);
    const locked = item.locked && !town().upgrades.bridge;
    if (locked) return '';
    const closed = !locked && !placeIsOpen(item);
    return `<button class="town-place town-place-${item.id} ${locked ? 'is-locked' : ''} ${closed ? 'is-closed' : ''}" style="--x:${item.x}%;--y:${item.y}%" data-town-place="${item.id}" type="button" aria-label="${esc(item.name)}" ${locked ? 'disabled' : ''}>${cottageBuildingMarkup(item)}<b>${esc(locked ? '修桥后开放' : item.name)}</b>${locked ? '' : closed ? '<small>现在闭店休息</small>' : visits ? `<small>去过 ${visits} 次</small>` : ''}</button>`;
  }
  function travelers() {
    const current = townHour() >= 22 || townHour() < 6 ? place('home') : place(town().position);
    return `<div class="town-travelers" style="--x:${current.x}%;--y:${Math.min(89, current.y + 10)}%"><i>${avatar(profile(), '我')}</i><i>${avatar(role(), 'Ta')}</i></div>`;
  }
  function people() {
    return `<section class="town-people"><button data-town-pick="profile" type="button"><i>${avatar(profile(), '我')}</i><span><small>小镇居民</small><b>${esc(userName())}</b></span></button><em>＋</em><button data-town-pick="role" type="button"><i>${avatar(role(), 'Ta')}</i><span><small>同行角色</small><b>${esc(roleName())}</b></span></button></section>`;
  }
  function energyMeter(data, label = '体力') { const value = Math.max(0, Math.round(data.energy)); const max = data.maxEnergy || 100; return `<div class="town-energy-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><i style="width:${Math.min(100, (value / max) * 100)}%"></i></div><span>${label} ${value}/${max}</span>`; }
  function hud() {
    const data = town();
    const info = seasonInfo(); const festival = festivalForDate();
    return `<section class="town-hud"><div><small>CALENDAR</small><b>${dateLabel()}</b><span><i data-town-period>${lightForTime().name}</i> · <time data-town-time>${clock()}</time></span></div><div><small>${info.icon} ${info.name}季 · ${data.weather}</small><b class="town-coins">${data.coins} 芽币</b>${energyMeter(data, '今日体力')}</div><div><small>小镇印章</small><strong>${data.stamps}</strong></div></section>${festival ? `<button class="town-festival-banner" data-town-tool="festival" type="button"><i>${festival.icon}</i><span><b>今天是${festival.name}</b><small>${festival.detail}</small></span><em>参加 ›</em></button>` : ''}`;
  }
  function fairyMapBackdrop() {
    return `<svg class="town-fairy-map" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="townPinkGround" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe4ec"/><stop offset=".52" stop-color="#f7cbd9"/><stop offset="1" stop-color="#efb9d0"/></linearGradient><linearGradient id="townPinkHill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7bfd3"/><stop offset="1" stop-color="#e9a9c5"/></linearGradient><linearGradient id="townPinkRiver" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#cdbde9"/><stop offset=".5" stop-color="#e4cef1"/><stop offset="1" stop-color="#bbaee0"/></linearGradient><filter id="townMapSoft"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#a86f8f" flood-opacity=".18"/></filter></defs><rect width="1000" height="720" fill="url(#townPinkGround)"/><path d="M0 0h1000v158Q845 106 680 158T326 140Q145 98 0 166Z" fill="#f8d5e1"/><path d="M0 602q175-74 344-18t325-4q181-68 331-12v152H0Z" fill="url(#townPinkHill)"/><path d="M891-34C789 105 977 191 858 308S968 517 824 764" fill="none" stroke="#ad9bd6" stroke-width="126" stroke-linecap="round" opacity=".45"/><path d="M889-34C803 111 969 194 858 309S955 521 826 760" fill="none" stroke="url(#townPinkRiver)" stroke-width="91" stroke-linecap="round"/><path d="M889-34C812 118 960 197 854 310S944 525 826 760" fill="none" stroke="#fff2fb" stroke-width="12" stroke-linecap="round" opacity=".55"/><path d="M86 585C206 505 195 400 347 365s198-92 242-194" fill="none" stroke="#e8aac0" stroke-width="62" stroke-linecap="round" opacity=".46"/><path d="M91 582C209 501 199 400 351 370s192-90 235-190" fill="none" stroke="#fff0e2" stroke-width="39" stroke-linecap="round"/><path d="M329 369q193 80 442 36" fill="none" stroke="#e8aac0" stroke-width="55" stroke-linecap="round" opacity=".44"/><path d="M331 369q190 76 437 37" fill="none" stroke="#fff0e2" stroke-width="34" stroke-linecap="round"/><g class="town-pink-clouds" fill="#fff7fb" opacity=".72"><ellipse cx="142" cy="91" rx="78" ry="29"/><circle cx="108" cy="78" r="28"/><circle cx="158" cy="67" r="38"/><ellipse cx="676" cy="77" rx="71" ry="25"/><circle cx="648" cy="66" r="26"/><circle cx="697" cy="57" r="34"/></g><g class="town-fairy-trees" filter="url(#townMapSoft)"><g transform="translate(72 168)"><rect x="8" y="28" width="14" height="39" rx="7" fill="#b78292"/><circle cx="0" cy="8" r="34" fill="#e99fbd"/><circle cx="32" cy="15" r="31" fill="#f2b5cb"/><circle cx="16" cy="-9" r="28" fill="#f6c6d8"/></g><g transform="translate(745 112)"><rect x="8" y="29" width="14" height="38" rx="7" fill="#b27d91"/><circle cx="0" cy="10" r="33" fill="#e59abd"/><circle cx="30" cy="15" r="30" fill="#f1b5cf"/><circle cx="15" cy="-9" r="27" fill="#f8c9dc"/></g><g transform="translate(80 425)"><rect x="8" y="30" width="14" height="39" rx="7" fill="#b27f8f"/><circle cx="0" cy="10" r="35" fill="#e9a2bf"/><circle cx="32" cy="16" r="31" fill="#f4b9cf"/><circle cx="16" cy="-10" r="29" fill="#facddd"/></g><g transform="translate(675 603)"><rect x="9" y="31" width="14" height="40" rx="7" fill="#ad798c"/><circle cx="0" cy="10" r="37" fill="#e79bbb"/><circle cx="34" cy="17" r="32" fill="#f3b6cc"/><circle cx="17" cy="-10" r="30" fill="#f9cadd"/></g></g><g class="town-rose-bushes"><g transform="translate(208 618)"><ellipse cx="0" cy="0" rx="53" ry="26" fill="#d891ad"/><circle cx="-20" cy="-9" r="8" fill="#ffe3ed"/><circle cx="7" cy="4" r="7" fill="#f8bad0"/><circle cx="27" cy="-8" r="8" fill="#ffe9f0"/></g><g transform="translate(622 154)"><ellipse cx="0" cy="0" rx="44" ry="23" fill="#d890ae"/><circle cx="-16" cy="-7" r="7" fill="#ffe7ef"/><circle cx="8" cy="5" r="6" fill="#f8bdd1"/><circle cx="23" cy="-8" r="7" fill="#fff0f5"/></g></g><g class="town-fairy-mushrooms"><path d="M118 337q15-25 30 0Z" fill="#c487bf"/><rect x="130" y="337" width="8" height="18" rx="4" fill="#fff1ec"/><circle cx="128" cy="328" r="3" fill="#ffe8f2"/><path d="M742 559q17-28 34 0Z" fill="#d879a5"/><rect x="755" y="559" width="8" height="19" rx="4" fill="#fff1ec"/><circle cx="755" cy="550" r="3" fill="#ffe9f2"/></g><g class="town-fairy-flowers"><path d="m150 248 7-9 7 9-7 9Z" fill="#fff1f5"/><path d="m248 664 8-10 8 10-8 10Z" fill="#fff1f5"/><path d="m653 259 7-9 7 9-7 9Z" fill="#fff5dc"/><path d="m735 510 8-10 8 10-8 10Z" fill="#fff5dc"/></g><g class="town-fairy-sparkles" fill="#fff9ea"><path d="m224 131 6 14 14 6-14 6-6 14-6-14-14-6 14-6Z"/><path d="m604 282 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"/><path d="m460 525 6 14 14 6-14 6-6 14-6-14-14-6 14-6Z"/><circle cx="751" cy="329" r="6"/><circle cx="320" cy="245" r="5"/></g><g transform="translate(799 350) rotate(8)" filter="url(#townMapSoft)"><rect width="124" height="22" rx="11" fill="#9f718d"/><path d="M9 3v16m22-16v16m22-16v16m22-16v16m22-16v16" stroke="#f5bdd1" stroke-width="10"/></g><path d="M515 638c-26-30-73 5 0 58 73-53 26-88 0-58Z" fill="#e59bb9" opacity=".38"/></svg>`;
  }
  function naturalTreeDecor() {
    const tree = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 73Q8 52 4 34M3 50l-20-19M4 43l21-23M1 58l-28 3M3 55l27 7" fill="none" stroke="#8d705f" stroke-width="9" stroke-linecap="round"/><path d="M-38 24Q-48-4-21-14-9-40 17-24 44-30 47 0 67 17 42 35 21 47 2 34-23 48-38 24Z" fill="#a8bd8e"/><path d="M-31 16Q-39-3-18-8-8-29 13-18 32-23 38-1 50 12 32 25 15 35 1 25-19 35-31 16Z" fill="#c4d3a6"/><path d="M-22 9Q-24-7-8-10 2-23 15-12 29-14 30 3 37 14 22 20 8 27-1 19-15 25-22 9Z" fill="#dbe3bd"/><circle cx="-17" cy="3" r="5" fill="#f2bac7"/><circle cx="24" cy="8" r="5" fill="#f0c083"/><ellipse cx="2" cy="76" rx="34" ry="7" fill="#9fae87" opacity=".32"/></g>`;
    return `<svg class="town-natural-tree-layer" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${tree(70, 120, .86)}${tree(760, 88, .82)}${tree(76, 410, .92)}${tree(685, 585, .94)}${tree(290, 640, .72)}</svg>`;
  }
  function mapPage() {
    return `<main class="town-main"><header class="town-title"><div><span>MAPLE HOLLOW</span><h1>枫芽小镇</h1><p>和喜欢的人，一起把每条小路走熟。</p></div><button data-town-close type="button">×</button></header>${hud()}${people()}<section class="town-map-wrap"><div class="town-map">${fairyMapBackdrop()}${naturalTreeDecor()}<canvas class="town-light-canvas" data-town-light-canvas width="160" height="110" aria-hidden="true"></canvas><div class="town-light-layer" aria-hidden="true"><i class="town-light-tint"></i><span class="town-sun-rays"></span><span class="town-cloud-shadows"><b></b><b></b><b></b></span><span class="town-sun-patches"><b></b><b></b><b></b><b></b></span><span class="town-water-glint"><b></b><b></b><b></b></span><span class="town-stars"><b></b><b></b><b></b><b></b><b></b><b></b></span><span class="town-weather-particles"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></span><span class="town-lamp town-lamp-a"></span><span class="town-lamp town-lamp-b"></span><span class="town-lamp town-lamp-c"></span></div>${places.map(placeButton).join('')}${travelers()}<span class="town-map-tip">点击建筑，和Ta一起走过去</span></div></section><section class="town-today"><div><span>TODAY IN TOWN</span><h2>今天想去哪里？</h2></div><p>${town().journal[0] ? esc(town().journal[0].text) : '小镇的风正好，第一次散步会从你们的小家门口开始。'}</p><button data-town-tab="journal" type="button">查看旅行册 →</button></section></main>`;
  }
  function activityTop(title, sub) { const info = seasonInfo(); return `<header class="town-title town-subtitle"><button data-town-tool="map" type="button">‹</button><div><span>${info.icon} ${info.name}季 · ${town().weather}</span><h1>${title}</h1><p>${sub}</p></div><button data-town-close type="button">×</button></header>`; }
  function activityNav() { return `<nav class="town-activity-nav"><button class="${page === 'farm' ? 'is-active' : ''}" data-town-tool="farm" type="button">农场</button><button class="${page === 'river' ? 'is-active' : ''}" data-town-tool="river" type="button">钓鱼</button><button class="${page === 'gather' ? 'is-active' : ''}" data-town-tool="gather" type="button">采集</button><button class="${page === 'board' ? 'is-active' : ''}" data-town-tool="board" type="button">公告</button><button class="${page === 'social' ? 'is-active' : ''}" data-town-tool="social" type="button">镇民</button><button class="${page === 'upgrade' ? 'is-active' : ''}" data-town-tool="upgrade" type="button">建设</button><button class="${page === 'bag' ? 'is-active' : ''}" data-town-tool="bag" type="button">背包</button><button class="${page === 'book' ? 'is-active' : ''}" data-town-tool="book" type="button">图鉴</button></nav>`; }
  function farmPage() {
    const data = town(); const plots = data.farm.plots.map((plot, index) => { const status = cropStatus(plot); if (!plot) return `<article class="town-plot is-empty"><i>＋</i><b>空地</b><small>从下方选择种子种下</small></article>`; return `<article class="town-plot ${status.ready ? 'is-ready' : ''}"><i>${status.crop?.icon || '·'}</i><b>${esc(status.crop?.name || '作物')}</b><small>${status.text}</small>${status.ready ? `<button data-town-harvest="${index}" type="button">收获</button>` : `<button data-town-water="${index}" type="button">${plot.wateredDays?.includes(today()) ? '今日已浇水' : '浇水 · 体力 1–3'}</button>`}</article>`; }).join(''); const seeds = cropCatalog.map(crop => `<article class="town-seed"><i>${crop.icon}</i><span><b>${crop.name}</b><small>${crop.season}季 · ${crop.grow}天成熟 · 售价 ${crop.sell}</small></span><em>种子 ${data.inventory[crop.seed] || 0}</em><div class="town-seed-actions"><button data-town-buy-seed="${crop.id}" type="button">${crop.seedPrice}芽币购买</button><button data-town-plant="${crop.id}" type="button" ${!data.inventory[crop.seed] ? 'disabled' : ''}>种下</button></div></article>`).join(''); const produce = cropCatalog.filter(crop => data.inventory[`crop_${crop.id}`]).map(crop => `<button class="town-sell-row" data-town-sell="crop_${crop.id}" type="button"><span>${crop.icon} ${crop.name} ×${data.inventory[`crop_${crop.id}`]}</span><b>出售 +${crop.sell}</b></button>`).join(''); return `${activityTop('小农场', '种下当季作物，等它慢慢长大。')}${activityNav()}<section class="town-season-card"><span>${seasonInfo().icon}</span><div><b>${season()}季 · ${data.weather}</b><small>每天浇水，收获会更快到来</small></div><div class="town-season-energy">${energyMeter(data)}</div></section><section class="town-plot-grid">${plots}</section><section class="town-section-title"><span>SEED SHOP</span><b>选择种子</b></section><section class="town-seed-list">${seeds}</section>${produce ? `<section class="town-section-title"><span>HARVEST BIN</span><b>出售收获</b></section><section class="town-sell-list">${produce}</section>` : ''}`;
  }
  function riverPage() { const data = town(); const fishing = data.fishing; return `${activityTop('月光河岸', '听着水声，等一条鱼咬钩。')}${activityNav()}<section class="town-river-card"><div class="town-river-art"><i>≈</i><i>≈</i><i>≈</i><b>◒</b></div><h2>${fishing ? (fishing.ready ? '鱼上钩啦！' : '耐心等一等…') : '今天去钓鱼吗？'}</h2><p>${fishing ? (fishing.ready ? '马上按下提竿，把鱼带回家。' : '水面正在轻轻晃动，鱼可能随时出现。') : '每次钓鱼消耗 18 点体力，钓到的鱼可以出售或收入图鉴。'}</p>${fishing ? `<button class="town-primary-button" data-town-fish-catch type="button">${fishing.ready ? '提竿！' : '现在提竿'}</button>` : `<button class="town-primary-button" data-town-fish-start type="button">抛竿 · 体力 18</button>`}</section><section class="town-section-title"><span>FISH BOX</span><b>今日收获</b></section><section class="town-inventory-mini">${fishCatalog.map(fish => `<span>${fish.icon} ${fish.name} ×${data.inventory[`fish_${fish.id}`] || 0}</span>`).join('')}</section>`; }
  function gatherPage() { const data = town(); return `${activityTop('林间采集', '每天来看看，草丛里会长出新的小东西。')}${activityNav()}<section class="town-gather-grid">${gatherCatalog.map(item => `<button class="town-gather-card ${data.gatheredToday[item.id] ? 'is-done' : ''}" data-town-gather="${item.id}" type="button" ${data.gatheredToday[item.id] ? 'disabled' : ''}><i>${item.icon}</i><b>${item.name}</b><small>${data.gatheredToday[item.id] ? '今天已经找过了' : `发现 ×${item.reward} · 体力 12`}</small></button>`).join('')}</section><section class="town-gather-note">每天 00:00 会刷新采集点。花朵和神秘礼物也可以送给小镇居民。</section>`; }
  function boardPage() { const data = town(); updateTasks(data); return `${activityTop('小镇公告板', '镇民们把今天想做的事写在这里。')}${activityNav()}<section class="town-board-list">${data.tasks.map((task, index) => `<article class="town-task ${task.done ? 'is-done' : ''}"><i>${task.icon}</i><span><b>${esc(task.title)}</b><small>${esc(task.detail)} · ${task.progress || 0}/${task.need}</small><em><strong style="width:${Math.min(100, ((task.progress || 0) / task.need) * 100)}%"></strong></em></span><button data-town-task="${index}" type="button" ${task.done || (task.progress || 0) < task.need ? 'disabled' : ''}>${task.done ? '已完成' : `领取 +${task.reward}`}</button></article>`).join('')}</section><section class="town-special-card"><i>✦</i><span><b>专属小镇事件</b><small>结合你和${esc(roleName())}的设定，写下一段只属于你们的故事。</small></span><button data-town-special type="button">触发</button></section>`; }
  function socialPage() { const data = town(); return `${activityTop('小镇居民', '和大家聊聊天，慢慢成为熟悉的朋友。')}${activityNav()}<section class="town-npc-list">${npcCatalog.map(npc => { const level = data.npcs[npc.id] || 0; return `<article class="town-npc-card"><i>${npc.icon}</i><span><b>${npc.name}</b><small>${npc.role}</small><em>${'♥'.repeat(Math.min(5, Math.ceil(level / 2)))}${'♡'.repeat(Math.max(0, 5 - Math.ceil(level / 2)))} · 好感 ${level}/10${level >= 5 ? ' · 已解锁特别对话' : ''}</em></span><button data-town-talk="${npc.id}" type="button">聊天</button><button data-town-gift="${npc.id}" type="button">送礼</button></article>`; }).join('')}</section>`; }
  function bagPage() { const data = town(); const entries = Object.entries(data.inventory).filter(([, count]) => Number(count) > 0); return `${activityTop('随身背包', '采集、种田和钓鱼得到的东西都收在这里。')}${activityNav()}<section class="town-bag-grid">${entries.length ? entries.map(([id, count]) => `<article><i>${cropCatalog.find(item => id === `seed_${item.id}` || id === `crop_${item.id}`)?.icon || fishCatalog.find(item => id === `fish_${item.id}`)?.icon || gatherCatalog.find(item => item.id === id)?.icon || '◆'}</i><span><b>${esc(itemName(id))}</b><small>${id.startsWith('seed_') ? '种子' : '持有数量'}</small></span><strong>×${count}</strong></article>`).join('') : '<p class="town-empty">背包还是空的，去地图上走走吧。</p>'}</section>`; }
  function bookPage() { const data = town(); const group = (title, icon, list, found) => `<section class="town-book-group"><header><span>${icon}</span><b>${title}</b><small>${found.length}/${list.length}</small></header><div>${list.map(item => `<i class="${found.includes(item.id) ? 'is-found' : ''}">${found.includes(item.id) ? item.icon || '✦' : '?'}</i>`).join('')}</div></section>`; return `${activityTop('小镇图鉴', '把遇见过的作物、鱼、家具和故事都收藏起来。')}${activityNav()}${group('鱼类', '◒', fishCatalog, data.collection.fish)}${group('作物', '✿', cropCatalog, data.collection.crops)}${group('采集', '◇', gatherCatalog, data.collection.gather)}<section class="town-book-group"><header><span>⌂</span><b>家中家具</b><small>${data.collection.furniture.length} 件</small></header><p class="town-book-text">已从“家”同步收藏。继续布置小家，就能收集更多家具记录。</p></section><section class="town-book-group"><header><span>✦</span><b>特殊事件</b><small>${data.collection.events.length}</small></header><p class="town-book-text">${data.collection.events.length ? '你们的故事已经被小镇记住了。' : '参加节日或触发专属事件后，这里会出现记录。'}</p></section>`; }
  function upgradePage() { const data = town(); return `${activityTop('小镇建设', '用采集到的材料，让枫芽小镇慢慢长大。')}${activityNav()}<section class="town-upgrade-list"><article class="${data.upgrades.bridge ? 'is-done' : ''}"><i>⌁</i><span><b>修复星芽小桥</b><small>木材 6 · 石头 4 · 开放星芽林地</small></span><button data-town-upgrade="bridge" type="button" ${data.upgrades.bridge ? 'disabled' : ''}>${data.upgrades.bridge ? '已完成' : '修建'}</button></article><article class="${data.upgrades.market ? 'is-done' : ''}"><i>⌂</i><span><b>扩建橡果商店</b><small>木材 8 · 野花 3 · 解锁更多镇民委托</small></span><button data-town-upgrade="market" type="button" ${data.upgrades.market ? 'disabled' : ''}>${data.upgrades.market ? '已完成' : '修建'}</button></article></section><section class="town-materials">木材 ${data.inventory.wood || 0}　·　石头 ${data.inventory.stone || 0}　·　野花 ${data.inventory.flower || 0}</section>`; }
  function festivalPage() { const festival = festivalForDate(); const next = nextFestival(); const data = town(); return `${activityTop(festival ? festival.name : '节日与活动', festival ? festival.detail : '小镇会在特别的日子举办季节活动。')}${activityNav()}<section class="town-festival-card"><i>${festival?.icon || next?.icon || '✦'}</i><h2>${festival ? '今天正在举办！' : `下一场：${next.name}`}</h2><p>${festival ? '和镇民一起留下今日的节日记录吧。' : `日期：${next.month}月${next.day}日 · 到时候记得来广场。`}</p>${festival ? `<button class="town-primary-button" data-town-festival-join type="button" ${data.visitedToday.festival ? 'disabled' : ''}>${data.visitedToday.festival ? '已经参加过' : '参加节日'}</button>` : ''}</section>`; }
  function activityPage() { const views = { farm: farmPage, river: riverPage, gather: gatherPage, board: boardPage, social: socialPage, bag: bagPage, book: bookPage, upgrade: upgradePage, festival: festivalPage }; return views[page] ? views[page]() : farmPage(); }
  function joinFestival() { const data = town(); const festival = festivalForDate(); if (!festival || data.visitedToday.festival) return; data.visitedToday.festival = true; data.stamps += 1; data.collection.events.push(festival.name); recordTownEvent(data, `今天是${festival.name}，{user}和{role}在人群里找到了最适合一起看的位置。`, festival.name); save(); flash(`参加了${festival.name}，获得 1 枚小镇印章。`); render(); }
  function specialEvent() { const data = town(); const userIdentity = profile()?.identity || profile()?.persona || profile()?.description || '温柔又独特的心意'; const roleIdentity = role()?.identity || role()?.persona || role()?.description || '一个有自己故事的人'; const userFit = String(userIdentity).split(/[，,。；;\n]/)[0].slice(0, 12) || '温柔的心意'; const roleFit = String(roleIdentity).split(/[，,。；;\n]/)[0].slice(0, 14) || '一个有自己故事的人'; const lines = [`{role}把“${roleFit}”藏进了今天的散步路线，{user}用“${userFit}”读懂了终点的小小惊喜。`, '你们在广场长椅上聊到天色变软，连路边的风铃都像在替你们保守秘密。', '{user}和{role}发现，小镇最特别的地方不是地图，而是每次一起走过的路。']; const text = lines[data.collection.events.length % lines.length]; markCollection(data, 'events', `story-${data.collection.events.length + 1}`); recordTownEvent(data, text, '专属事件'); data.stats.explore += 1; updateTasks(data); save(); flash('专属事件已经写进旅行册。'); render(); }
  function journalPage() {
    const data = town();
    return `<main class="town-main town-journal"><header class="town-title town-subtitle"><button data-town-tab="map" type="button">‹</button><div><span>TOWN JOURNAL</span><h1>旅行册</h1><p>${esc(userName())}与${esc(roleName())}的小镇足迹</p></div><button data-town-close type="button">×</button></header><section class="town-stamp-card"><div><small>COLLECTED STAMPS</small><b>${data.stamps}</b><span>枚小镇印章</span></div><div class="town-stamp-grid">${places.map(item => `<i class="${data.visits[item.id] ? 'is-found' : ''}" title="${esc(item.name)}">${data.visits[item.id] ? '✦' : '?'}</i>`).join('')}</div></section><section class="town-place-progress"><header><span>PLACE GUIDE</span><b>${Object.keys(data.visits).filter(id => data.visits[id]).length} / ${places.length} 已发现</b></header>${places.map(item => `<button data-town-place="${item.id}" type="button"><i style="--dot:${item.color}"></i><span><b>${esc(item.name)}</b><small>${data.visits[item.id] ? `拜访过 ${data.visits[item.id]} 次` : '还没有留下足迹'}</small></span><em>›</em></button>`).join('')}</section><section class="town-journal-list"><header><span>WALKING NOTES</span><h2>最近发生</h2></header>${data.journal.length ? data.journal.map(entry => `<article><i>✦</i><span><small>${esc(entry.date)} · ${esc(entry.place)}</small><p>${esc(entry.text)}</p></span></article>`).join('') : '<div class="town-empty"><i>♧</i><p>还没有旅行记录。回到地图，选择一个地方散散步吧。</p></div>'}</section></main>`;
  }
  function placeSheet() {
    if (!activePlace) return '';
    const item = place(activePlace); const data = town(); const visited = Number(data.visits[item.id] || 0);
    const closed = !placeIsOpen(item); return `<div class="town-place-sheet"><div data-town-place-close></div><section><header><span>NOW ARRIVING</span><button data-town-place-close type="button">×</button></header><div class="town-place-scene town-place-scene-${item.id}">${cottageBuildingMarkup(item)}<i class="town-scene-grass"></i></div><small>${closed ? '现在闭店休息，白天再来吧' : visited ? `已经来过 ${visited} 次` : '第一次来到这里'}</small><h2>${esc(item.name)}</h2><p>${esc(item.sub)}</p><div class="town-place-actions"><button data-town-explore="${item.id}" type="button" ${data.energy < 10 || closed ? 'disabled' : ''}><b>${closed ? '闭店休息中' : '在附近逛逛'}</b><small>${closed ? '开放时间 08:00—20:00' : data.energy >= 10 ? '消耗 10 点体力' : '体力不足'}</small></button>${item.target ? `<button class="is-primary" data-town-target="${item.target}" type="button" ${closed ? 'disabled' : ''}><b>${esc(item.action)}</b><small>${closed ? '明天营业后再来' : '从小镇进入对应 App'}</small></button>` : ''}</div></section></div>`;
  }
  function pickerSheet() {
    if (!picker) return '';
    const data = chat(); const list = picker === 'profile' ? data.profiles : data.contacts;
    return `<div class="town-picker"><div data-town-picker-close></div><section><header><div><span>CHOOSE PARTNER</span><h2>选择${picker === 'profile' ? '小镇居民' : '同行角色'}</h2></div><button data-town-picker-close type="button">×</button></header>${list.length ? list.map(person => `<button data-town-select="${picker}" data-town-id="${esc(person.id)}" type="button"><i>${avatar(person, picker === 'profile' ? '我' : 'Ta')}</i><span><b>${esc(personName(person, '未命名'))}</b><small>${esc(person.identity || person.persona || '小镇同行者')}</small></span><em>${person.id === (picker === 'profile' ? state.profileId : state.roleId) ? '✓' : '›'}</em></button>`).join('') : '<p class="town-picker-empty">聊天 App 里还没有可以选择的资料。</p>'}</section></div>`;
  }
  function giftSheet() {
    if (!giftPicker) return '';
    const data = town(); const npc = npcCatalog.find(item => item.id === giftPicker); const entries = giftEntries(data);
    return `<div class="town-gift-picker"><div data-town-gift-close></div><section><header><div><span>CHOOSE A GIFT</span><h2>送给${esc(npc?.name || '镇民')}什么？</h2></div><button data-town-gift-close type="button">×</button></header>${entries.length ? `<div class="town-gift-list">${entries.map(item => `<button data-town-gift-select="${giftPicker}" data-town-gift-item="${item.id}" type="button"><i>${item.icon}</i><span><b>${esc(item.name)}</b><small>背包里有 ${item.count} 件</small></span><em>送出 ›</em></button>`).join('')}</div>` : '<p class="town-picker-empty">背包里还没有可以送出的礼物，先去采集或钓鱼吧。</p>'}</section></div>`;
  }
  function nav() {
    return `<nav class="town-nav"><button class="${page === 'map' ? 'is-active' : ''}" data-town-tab="map" type="button"><b>⌂</b><small>地图</small></button><button class="${page !== 'map' && page !== 'journal' ? 'is-active' : ''}" data-town-tool="farm" type="button"><b>✿</b><small>生活</small></button><button class="${page === 'journal' ? 'is-active' : ''}" data-town-tab="journal" type="button"><b>▤</b><small>旅行册</small></button></nav>`;
  }
  function drawMap() {
    const canvas = app.querySelector('[data-town-canvas]'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const width = canvas.width; const height = canvas.height; ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, width, height);
    const rect = (x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const poly = (points, fill) => { ctx.fillStyle = fill; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
    const palette = ['#96c273', '#a3ca79', '#8dbb6d', '#9ec977'];
    for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) rect(x, y, 4, 4, palette[(x / 4 + y / 4 * 2) % palette.length]);
    for (let y = 2; y < height; y += 12) for (let x = 3; x < width; x += 16) rect(x + (y % 8), y, 2, 2, '#79aa68');
    const riverRows = [{ y: 0, x: 139 }, { y: 20, x: 143 }, { y: 40, x: 137 }, { y: 60, x: 142 }, { y: 80, x: 136 }, { y: 110, x: 140 }];
    for (let y = 0; y < height; y += 2) { const next = riverRows.find((row, index) => y >= row.y && y <= (riverRows[index + 1]?.y ?? height)) || riverRows[riverRows.length - 1]; const previous = riverRows[Math.max(0, riverRows.indexOf(next) - 1)] || next; const ratio = next === previous ? 0 : (y - previous.y) / (next.y - previous.y); const x = Math.round(previous.x + (next.x - previous.x) * ratio); rect(x, y, 15, 2, '#70adbf'); rect(x + 2, y, 9, 1, '#a5d5ca'); rect(x + 12, y + 1, 3, 1, '#4f8eaa'); }
    const road = (x, y, w, h) => { rect(x, y, w, h, '#d4ae70'); for (let py = y + 2; py < y + h; py += 6) rect(x, py, w, 2, '#e9cc8a'); for (let px = x + 4; px < x + w; px += 12) rect(px, y, 2, h, '#bd925c'); };
    road(5, 57, 126, 9); road(77, 17, 10, 83); road(19, 78, 117, 8);
    rect(134, 41, 20, 8, '#754c38'); for (let x = 136; x < 153; x += 5) rect(x, 42, 3, 6, '#d3995c');
    rect(118, 86, 27, 12, '#b98254'); rect(120, 88, 23, 8, '#70aeb5'); rect(124, 90, 9, 2, '#a8dbca'); rect(137, 94, 5, 2, '#4e909b');
    rect(7, 92, 40, 13, '#9a633f'); for (let y = 95; y < 103; y += 4) for (let x = 10; x < 46; x += 8) { rect(x, y, 5, 5, '#c18b53'); rect(x + 1, y, 2, 3, '#6d994f'); }
    const tree = (x, y) => { rect(x - 5, y + 7, 10, 7, '#73503b'); rect(x - 10, y - 5, 20, 13, '#4c814d'); rect(x - 7, y - 10, 14, 7, '#67a65d'); rect(x - 5, y - 7, 6, 5, '#83bb6c'); rect(x + 5, y - 3, 5, 6, '#3f714a'); };
    [[13, 10], [123, 10], [9, 45], [61, 99], [153, 70], [113, 16], [31, 10]].forEach(([x, y]) => tree(x, y));
    const building = (item) => {
      const x = Math.round(item.x * 1.6); const y = Math.round(item.y * 1.1);
      const shadow = (w = 30) => rect(x - w / 2 + 4, y + 31, w, 4, '#688b5b');
      const roof = (fill, w = 42) => { rect(x - w / 2, y - 5, w, 10, fill); rect(x - w / 2 + 5, y - 10, w - 10, 5, fill); rect(x - w / 2 + 12, y - 14, w - 24, 4, fill); };
      const wall = (fill, w = 30, h = 24) => { rect(x - w / 2 + 3, y + 5, w, h, '#654b3d'); rect(x - w / 2 + 5, y + 5, w - 4, h - 2, fill); };
      const window = (px, py, fill = '#d7edb7') => { rect(x + px, y + py, 7, 7, '#5b5846'); rect(x + px + 2, y + py + 2, 3, 3, fill); };
      if (item.id === 'clock') {
        shadow(22); rect(x - 9, y - 35, 18, 67, '#65493d'); rect(x - 7, y - 33, 14, 63, '#a66d4e'); rect(x - 13, y - 39, 26, 7, '#6d4b43'); rect(x - 9, y - 44, 18, 5, '#8d5953'); rect(x - 6, y - 29, 12, 12, '#f2c96d'); rect(x - 4, y - 27, 8, 8, '#f8e09b'); rect(x - 1, y - 26, 2, 6, '#665443'); rect(x - 1, y - 22, 4, 2, '#665443'); rect(x - 15, y + 29, 30, 4, '#6d4b3d'); return;
      }
      if (item.id === 'shop') {
        shadow(38); wall('#d99a5c', 38, 23); rect(x - 22, y - 9, 44, 7, '#9a5c4c'); for (let px = x - 20; px < x + 20; px += 8) rect(px, y - 8, 4, 5, '#f2d27c'); rect(x - 16, y - 20, 32, 5, '#a7614d'); rect(x - 10, y - 26, 20, 5, '#c27656'); window(-14, 9, '#f4d98c'); window(7, 9, '#f4d98c'); rect(x - 3, y + 16, 7, 12, '#9b6048'); rect(x - 25, y + 19, 7, 7, '#ac754b'); rect(x - 24, y + 16, 5, 3, '#7da25a'); rect(x + 18, y + 20, 7, 6, '#b37b4b'); return;
      }
      if (item.id === 'music') {
        shadow(37); wall('#776c8f', 37, 24); roof('#574b73', 45); rect(x - 20, y + 1, 40, 3, '#443d60'); rect(x - 14, y + 10, 10, 10, '#4d435e'); rect(x - 12, y + 12, 6, 6, '#d3b5cc'); window(7, 10, '#b9d7c1'); rect(x - 4, y + 17, 8, 10, '#4b3e55'); rect(x + 11, y - 20, 10, 10, '#463c5e'); rect(x + 13, y - 18, 6, 6, '#d9a56d'); rect(x + 21, y - 13, 3, 9, '#463c5e'); rect(x + 17, y - 7, 7, 4, '#463c5e'); return;
      }
      if (item.id === 'library') {
        shadow(40); wall('#82a78e', 41, 27); roof('#527766', 48); rect(x - 21, y - 7, 42, 4, '#3f6759'); window(-16, 8, '#e3cb83'); window(-5, 8, '#e3cb83'); window(6, 8, '#e3cb83'); rect(x - 3, y + 17, 8, 13, '#73513f'); rect(x - 17, y + 20, 4, 7, '#d98d61'); rect(x - 12, y + 20, 4, 7, '#e7c175'); rect(x + 13, y + 20, 4, 7, '#b87756'); rect(x - 8, y - 20, 4, 13, '#6d5041'); rect(x - 4, y - 24, 8, 17, '#7f5b45'); rect(x, y - 20, 4, 13, '#b78555'); return;
      }
      if (item.id === 'plaza') {
        rect(x - 22, y + 27, 44, 4, '#688b5b'); rect(x - 18, y - 1, 4, 29, '#8a6043'); rect(x + 14, y - 1, 4, 29, '#8a6043'); rect(x - 25, y - 5, 50, 5, '#8b5c4c'); rect(x - 19, y - 10, 38, 5, '#aa6b52'); rect(x - 11, y - 14, 22, 4, '#c88b5d'); rect(x - 9, y + 13, 18, 9, '#6aa1a2'); rect(x - 5, y + 10, 10, 4, '#c4e0bc'); rect(x - 2, y + 5, 4, 6, '#b1d4b1'); return;
      }
      if (item.id === 'forest') {
        shadow(40); rect(x - 21, y + 11, 42, 4, '#416b4d'); rect(x - 18, y - 4, 7, 17, '#78523b'); rect(x + 10, y - 7, 7, 20, '#78523b'); rect(x - 25, y - 13, 22, 14, '#3e714b'); rect(x + 3, y - 17, 25, 16, '#477d4e'); rect(x - 19, y - 20, 14, 9, '#5d9658'); rect(x + 7, y - 24, 15, 9, '#65a15b'); rect(x - 9, y + 4, 18, 7, '#b8794d'); rect(x - 6, y + 6, 4, 4, '#e7c074'); return;
      }
      if (item.id === 'garden') {
        shadow(40); poly([[x - 22, y + 11], [x - 14, y - 11], [x + 14, y - 11], [x + 22, y + 11]], '#6e9e92'); rect(x - 19, y + 7, 38, 5, '#4d806c'); rect(x - 16, y - 7, 3, 16, '#d7eed0'); rect(x - 2, y - 9, 3, 18, '#d7eed0'); rect(x + 13, y - 7, 3, 16, '#d7eed0'); rect(x - 12, y + 4, 5, 4, '#e6b06c'); rect(x - 3, y + 3, 5, 5, '#d98d8e'); rect(x + 8, y + 3, 5, 5, '#e9d27c'); return;
      }
      shadow(38); wall('#efb19f', 38, 25); roof('#9d5a6b', 45); rect(x + 11, y - 20, 6, 13, '#7b5242'); rect(x + 10, y - 23, 8, 4, '#6b4b40'); window(-14, 10, '#f7d88d'); window(8, 10, '#c8e2b1'); rect(x - 3, y + 16, 8, 14, '#a76a52'); rect(x + 22, y + 19, 5, 3, '#75513f'); rect(x + 27, y + 16, 7, 5, '#d7a05e'); rect(x - 24, y + 23, 4, 4, '#dd8290'); rect(x - 19, y + 20, 4, 7, '#7fa45d');
    };
    for (let y = 4; y < height; y += 17) { rect(102 + (y % 9), y, 2, 2, '#f2d58f'); rect(111 - (y % 7), y + 4, 2, 2, '#f0c782'); }
  }
  function drawBuildingSprites() {
    const lighting = lightForTime();
    app.querySelectorAll('[data-town-building]').forEach(canvas => {
      const item = place(canvas.dataset.townBuilding); const ctx = canvas.getContext('2d'); if (!ctx || !item) return;
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = (x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
      const poly = (points, fill) => { ctx.fillStyle = fill; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
      const window = (x, y, glow = '#f4d486') => { const light = lighting.isDark ? lighting.window : glow; rect(x, y, 9, 9, '#55483d'); rect(x + 2, y + 2, 5, 5, light); rect(x + 4, y + 2, 1, 5, lighting.isDark ? '#d59552' : '#8d815f'); };
      const door = (x, y, color = '#9a654e') => { rect(x, y, 10, 16, '#554238'); rect(x + 2, y + 2, 6, 14, color); rect(x + 7, y + 9, 1, 1, '#f2c165'); };
      const ground = () => { rect(6, 57, 44, 4, '#54794c'); rect(10, 55, 36, 3, '#7ca65b'); };
      if (item.id === 'clock') {
        ground(); rect(17, 11, 22, 47, '#554238'); rect(20, 13, 16, 43, '#a66c50'); rect(14, 8, 28, 6, '#684a43'); rect(19, 4, 18, 4, '#8f5950'); rect(25, 0, 6, 5, '#63463d'); rect(21, 18, 14, 14, '#5f4f40'); rect(23, 20, 10, 10, '#f0d084'); rect(27, 21, 2, 7, '#6b5945'); rect(27, 26, 5, 2, '#6b5945'); door(23, 40, '#82503f'); rect(15, 55, 26, 4, '#65493d'); return;
      }
      if (item.id === 'shop') {
        ground(); rect(5, 25, 46, 32, '#5b4539'); rect(8, 28, 40, 27, '#d79a5e'); rect(3, 21, 50, 8, '#8e5548'); for (let x = 5; x < 52; x += 8) rect(x, 23, 4, 5, '#f0cf7a'); rect(12, 8, 32, 13, '#674a3c'); rect(15, 11, 26, 8, '#b76b50'); rect(20, 13, 4, 4, '#e5bd67'); rect(25, 11, 4, 7, '#77a052'); window(10, 34); window(37, 34); door(23, 39); rect(1, 48, 8, 8, '#9f6a47'); rect(2, 45, 5, 4, '#76a057'); rect(47, 49, 8, 7, '#b57b4c'); return;
      }
      if (item.id === 'music') {
        ground(); rect(6, 23, 44, 34, '#453b4f'); rect(9, 26, 38, 29, '#776b8f'); rect(4, 18, 48, 8, '#443955'); rect(10, 12, 36, 7, '#5b4b72'); rect(12, 30, 15, 15, '#43394e'); rect(15, 33, 9, 9, '#d69e72'); rect(18, 36, 3, 3, '#43394e'); window(36, 31, '#b7d6c1'); door(26, 39, '#4b3d54'); rect(38, 7, 12, 12, '#443955'); rect(40, 9, 8, 8, '#d4a36e'); rect(43, 11, 2, 5, '#443955'); rect(48, 13, 3, 9, '#443955'); rect(45, 20, 6, 3, '#443955'); return;
      }
      if (item.id === 'library') {
        ground(); rect(4, 24, 48, 34, '#4d4238'); rect(7, 27, 42, 28, '#83a78e'); poly([[2, 24], [11, 14], [45, 14], [54, 24]], '#456b5d'); rect(8, 21, 40, 5, '#527a67'); rect(23, 6, 10, 16, '#684b3e'); rect(26, 3, 4, 5, '#866044'); rect(25, 9, 2, 9, '#d8875b'); rect(28, 8, 2, 10, '#e3be70'); rect(31, 10, 2, 8, '#a66a4e'); window(9, 32); window(38, 32); door(23, 40, '#6f4d3d'); rect(9, 48, 4, 6, '#d8895f'); rect(14, 47, 4, 7, '#e5c270'); rect(39, 47, 4, 7, '#bc7652'); return;
      }
      if (item.id === 'plaza') {
        ground(); rect(4, 55, 48, 4, '#80563e'); rect(9, 20, 5, 35, '#835a3f'); rect(42, 20, 5, 35, '#835a3f'); rect(3, 17, 50, 6, '#7d5045'); rect(9, 12, 38, 5, '#a3654e'); rect(17, 8, 22, 4, '#c18358'); rect(18, 39, 20, 13, '#4e7c80'); rect(21, 36, 14, 6, '#a9d1b0'); rect(25, 30, 6, 7, '#8ec19e'); rect(27, 25, 2, 7, '#c5e1ba'); rect(14, 52, 28, 3, '#d1aa68'); return;
      }
      if (item.id === 'forest') {
        ground(); rect(5, 44, 46, 14, '#416b4d'); rect(10, 30, 7, 24, '#704e3a'); rect(37, 25, 7, 29, '#704e3a'); rect(2, 16, 25, 20, '#3c7049'); rect(28, 10, 27, 24, '#477b4d'); rect(8, 9, 17, 13, '#5b9255'); rect(34, 4, 17, 11, '#63a05b'); rect(21, 45, 14, 9, '#b8794d'); rect(25, 47, 4, 4, '#edcb7a'); return;
      }
      if (item.id === 'garden') {
        ground(); rect(3, 51, 50, 7, '#476d59'); poly([[5, 51], [14, 18], [42, 18], [51, 51]], '#527d70'); poly([[9, 49], [17, 22], [39, 22], [47, 49]], '#b9dcca'); rect(18, 20, 3, 31, '#e1efcd'); rect(27, 20, 3, 31, '#e1efcd'); rect(37, 22, 3, 29, '#e1efcd'); rect(8, 39, 40, 3, '#74a68c'); rect(12, 45, 7, 6, '#df9c68'); rect(23, 43, 7, 8, '#d98588'); rect(35, 44, 7, 7, '#e8cf73'); rect(26, 49, 6, 9, '#5d664a'); return;
      }
      ground(); rect(5, 27, 46, 31, '#65483c'); rect(8, 30, 40, 26, '#ecad9b'); poly([[2, 28], [12, 14], [44, 14], [54, 28]], '#8e5364'); rect(13, 20, 30, 7, '#a76170'); rect(39, 5, 8, 17, '#64483d'); rect(37, 4, 12, 5, '#785245'); window(10, 34); window(37, 34, '#c4e0ad'); door(23, 40, '#9f624d'); rect(51, 43, 3, 12, '#72503e'); rect(48, 41, 8, 5, '#d8a15f'); rect(1, 49, 5, 5, '#d97e89'); rect(6, 46, 4, 9, '#70a05c');
    });
  }
  function drawTownLightCanvas() {
    const canvas = app.querySelector('[data-town-light-canvas]'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const lighting = lightForTime(); const width = canvas.width; const height = canvas.height;
    const sun = Math.min(.95, lighting.sunHeight * 1.05 * (1 - lighting.lamp * .9));
    ctx.clearRect(0, 0, width, height); if (sun <= .01) return;
    const x = 7 + lighting.sunProgress * 86; const y = 53 - lighting.sunHeight * 42;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 92);
    glow.addColorStop(0, `rgba(255,249,194,${(.44 * sun).toFixed(3)})`); glow.addColorStop(.18, `rgba(255,231,145,${(.2 * sun).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    const angle = (122 - lighting.sunProgress * 64) * Math.PI / 180; const length = 190; const spread = .18; const x1 = x + Math.cos(angle - spread) * length; const y1 = y + Math.sin(angle - spread) * length; const x2 = x + Math.cos(angle + spread) * length; const y2 = y + Math.sin(angle + spread) * length;
    ctx.fillStyle = `rgba(255,235,165,${(.13 * sun).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
  }
  function applyTownLighting(forceSprites = false) {
    const lighting = lightForTime(); const root = app.querySelector('.town-page'); if (!root) return;
    const sun = Math.min(.95, lighting.sunHeight * 1.05 * (1 - lighting.lamp * .9)); const sunAngle = 122 - lighting.sunProgress * 64;
    root.style.setProperty('--town-light-rgb', lighting.rgb.join(',')); root.style.setProperty('--town-light-opacity', lighting.opacity.toFixed(3)); root.style.setProperty('--town-scene-brightness', lighting.brightness.toFixed(3)); root.style.setProperty('--town-lamp-opacity', lighting.lamp.toFixed(3)); root.style.setProperty('--town-stars-opacity', lighting.stars.toFixed(3)); root.style.setProperty('--town-shadow-x', `${lighting.sx.toFixed(1)}px`); root.style.setProperty('--town-shadow-y', `${lighting.sy.toFixed(1)}px`); root.style.setProperty('--town-shadow-opacity', lighting.shadow.toFixed(3)); root.style.setProperty('--town-sun-opacity', sun.toFixed(3)); root.style.setProperty('--town-sun-angle', `${sunAngle.toFixed(1)}deg`); root.style.setProperty('--town-sun-x', `${(7 + lighting.sunProgress * 86).toFixed(2)}%`); root.style.setProperty('--town-sun-y', `${(53 - lighting.sunHeight * 42).toFixed(2)}%`);
    app.dataset.townPeriod = lighting.isDark ? 'night' : lighting.name === '黄昏' ? 'dusk' : lighting.name === '清晨' ? 'dawn' : 'day'; app.dataset.townWeather = town().weather;
    const period = app.querySelector('[data-town-period]'); const time = app.querySelector('[data-town-time]'); if (period) period.textContent = lighting.name; if (time) time.textContent = clock();
    drawTownLightCanvas();
    const marker = app.querySelector('.town-travelers'); if (marker && page === 'map') { const current = townHour() >= 22 || townHour() < 6 ? place('home') : place(town().position); marker.style.setProperty('--x', `${current.x}%`); marker.style.setProperty('--y', `${Math.min(89, current.y + 10)}%`); }
    const windowMode = lighting.isDark ? 'night' : 'day';
    if (forceSprites || lastWindowMode !== windowMode) { lastWindowMode = windowMode; drawBuildingSprites(); }
  }
  function render() {
    town(); save();
    const lifePage = page !== 'map' && page !== 'journal';
    app.innerHTML = `<div class="town-page ${lifePage ? 'is-life' : ''}">${page === 'map' ? mapPage() : page === 'journal' ? journalPage() : activityPage()}${nav()}${placeSheet()}${pickerSheet()}${giftSheet()}${toast ? `<div class="town-toast">${esc(toast)}</div>` : ''}</div>`;
    drawMap();
    applyTownLighting(true);
  }
  function flash(message) {
    toast = message; render(); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast = ''; if (app.classList.contains('is-open')) render(); }, 2300);
  }
  function travel(id) {
    const destination = place(id); const marker = app.querySelector('.town-travelers');
    if (destination.locked && !town().upgrades.bridge) return flash('先去建设页面修好小桥，星芽林地才会开放。');
    if (!placeIsOpen(destination)) return flash(`${destination.name}现在闭店休息，白天再来吧。`);
    clearTimeout(travelTimer); town().position = destination.id; save();
    if (marker && page === 'map') {
      marker.classList.add('is-walking'); marker.style.setProperty('--x', `${destination.x}%`); marker.style.setProperty('--y', `${Math.min(89, destination.y + 10)}%`);
      travelTimer = setTimeout(() => { activePlace = destination.id; render(); }, 520);
    } else { page = 'map'; activePlace = destination.id; render(); }
  }
  function explore(id) {
    const data = town(); if (!spendEnergy(data, 10)) return;
    const item = place(id); const list = events[id] || events.plaza; const count = Number(data.visits[id] || 0); const text = interpolate(list[count % list.length]);
    data.visits[id] = count + 1; data.stats.explore += 1;
    if (!data.visitedToday[id]) { data.visitedToday[id] = true; data.stamps += 1; }
    updateTasks(data); data.journal.unshift({ id: `town-${Date.now()}`, place: item.name, text, date: `${season()} · ${new Date().getMonth() + 1}月${new Date().getDate()}日 ${clock()}` });
    data.journal = data.journal.slice(0, 30); save(); flash(text);
  }
  function openTarget(target) {
    const launch = document.querySelector(`[data-app-key="${CSS.escape(target)}"]`);
    if (!launch) return flash('这个地点暂时还没有开放。');
    app.classList.remove('is-open'); activePlace = ''; picker = '';
    launch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="xiaozhen"]')) { state = load(); ensureBinding(); page = 'map'; activePlace = ''; picker = ''; giftPicker = ''; lastWindowMode = ''; render(); app.classList.add('is-open'); applyTownLighting(true); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-town-close]')) { app.classList.remove('is-open'); activePlace = ''; picker = ''; giftPicker = ''; return; }
    const tab = event.target.closest('[data-town-tab]'); if (tab) { page = tab.dataset.townTab; activePlace = ''; picker = ''; giftPicker = ''; render(); return; }
    const tool = event.target.closest('[data-town-tool]'); if (tool) { page = tool.dataset.townTool || 'map'; activePlace = ''; picker = ''; giftPicker = ''; render(); return; }
    const pick = event.target.closest('[data-town-pick]'); if (pick) { picker = pick.dataset.townPick; render(); return; }
    if (event.target.closest('[data-town-picker-close]')) { picker = ''; render(); return; }
    if (event.target.closest('[data-town-gift-close]')) { giftPicker = ''; render(); return; }
    const selected = event.target.closest('[data-town-select]'); if (selected) {
      if (selected.dataset.townSelect === 'profile') state.profileId = selected.dataset.townId;
      else { state.roleId = selected.dataset.townId; const linked = chat().chats?.[state.roleId]?.profileId; if (linked && chat().profiles.some(item => item.id === linked)) state.profileId = linked; }
      picker = ''; save(); render(); return;
    }
    if (event.target.closest('[data-town-place-close]')) { activePlace = ''; render(); return; }
    const placeButton = event.target.closest('[data-town-place]'); if (placeButton) { travel(placeButton.dataset.townPlace); return; }
    const exploreButton = event.target.closest('[data-town-explore]'); if (exploreButton) { explore(exploreButton.dataset.townExplore); return; }
    const target = event.target.closest('[data-town-target]'); if (target) { openTarget(target.dataset.townTarget); }
    const buySeedButton = event.target.closest('[data-town-buy-seed]'); if (buySeedButton) { buySeed(buySeedButton.dataset.townBuySeed); return; }
    const plantButton = event.target.closest('[data-town-plant]'); if (plantButton) { plantSeed(plantButton.dataset.townPlant); return; }
    const waterButton = event.target.closest('[data-town-water]'); if (waterButton) { waterPlot(Number(waterButton.dataset.townWater)); return; }
    const harvestButton = event.target.closest('[data-town-harvest]'); if (harvestButton) { harvestPlot(Number(harvestButton.dataset.townHarvest)); return; }
    const sellButton = event.target.closest('[data-town-sell]'); if (sellButton) { sellItem(sellButton.dataset.townSell); return; }
    if (event.target.closest('[data-town-fish-start]')) { beginFishing(); return; }
    if (event.target.closest('[data-town-fish-catch]')) { finishFishing(); return; }
    const gatherButton = event.target.closest('[data-town-gather]'); if (gatherButton) { gather(gatherButton.dataset.townGather); return; }
    const taskButton = event.target.closest('[data-town-task]'); if (taskButton) { completeTask(Number(taskButton.dataset.townTask)); return; }
    const talkButton = event.target.closest('[data-town-talk]'); if (talkButton) { talkNpc(talkButton.dataset.townTalk); return; }
    const giftSelect = event.target.closest('[data-town-gift-select]'); if (giftSelect) { giftNpc(giftSelect.dataset.townGiftSelect, giftSelect.dataset.townGiftItem); return; }
    const giftButton = event.target.closest('[data-town-gift]'); if (giftButton) { giftPicker = giftButton.dataset.townGift; render(); return; }
    const upgradeButton = event.target.closest('[data-town-upgrade]'); if (upgradeButton) { upgradeTown(upgradeButton.dataset.townUpgrade); return; }
    if (event.target.closest('[data-town-special]')) { specialEvent(); return; }
    if (event.target.closest('[data-town-festival-join]')) { joinFestival(); return; }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && app.classList.contains('is-open')) { if (picker) { picker = ''; render(); } else if (giftPicker) { giftPicker = ''; render(); } else if (activePlace) { activePlace = ''; render(); } else app.classList.remove('is-open'); } });
  setInterval(() => { if (app.classList.contains('is-open')) applyTownLighting(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && app.classList.contains('is-open')) applyTownLighting(true); });
  window.addEventListener('focus', () => { if (app.classList.contains('is-open')) applyTownLighting(true); });

  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.xiaozhen = { name: '小镇' };
})();
