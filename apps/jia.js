(() => {
  const key = 'ideal-machine-home';
  const chatKey = 'ideal-machine-chat';
  const app = document.createElement('div');
  app.className = 'house-app';
  document.body.appendChild(app);

  const items = [
    { id: 'sofa', name: '云朵沙发', cat: '客厅', price: 80, art: 'sofa', color: 'pink', tip: '适合一起看电影' },
    { id: 'table', name: '圆圆餐桌', cat: '客厅', price: 110, art: 'table', color: 'wood', tip: '早餐要坐在一起' },
    { id: 'lamp', name: '月亮小灯', cat: '灯具', price: 68, art: 'lamp', color: 'yellow', tip: '把夜晚照得刚刚好' },
    { id: 'plant', name: '窗边绿植', cat: '植物', price: 45, art: 'plant', color: 'green', tip: '每天都在悄悄长大' },
    { id: 'rug', name: '奶油地毯', cat: '装饰', price: 72, art: 'rug', color: 'cream', tip: '踩上去像一朵云' },
    { id: 'shelf', name: '小小书架', cat: '收纳', price: 125, art: 'shelf', color: 'wood', tip: '放下喜欢的书' },
    { id: 'bed', name: '晚安小床', cat: '卧室', price: 180, art: 'bed', color: 'blue', tip: '做一个柔软的好梦' },
    { id: 'picture', name: '星星挂画', cat: '装饰', price: 55, art: 'picture', color: 'purple', tip: '把夜空挂在墙上' },
    { id: 'desk', name: '窗边书桌', cat: '书房', price: 135, art: 'desk', color: 'wood', tip: '一起写信和做计划' },
    { id: 'chair', name: '软软椅子', cat: '书房', price: 64, art: 'chair', color: 'blue', tip: '留一个位置给你' },
    { id: 'kitchen', name: '迷你餐车', cat: '厨房', price: 98, art: 'kitchen', color: 'green', tip: '把好吃的都摆在这里' },
    { id: 'cushion', name: '茶杯抱枕', cat: '装饰', price: 38, art: 'cushion', color: 'pink', tip: '沙发上的小伙伴' },
    { id: 'armchair', name: '小熊单人沙发', cat: '客厅', price: 92, art: 'armchair', color: 'yellow', tip: '一个人也可以舒服地坐着' },
    { id: 'tv', name: '圆角小电视', cat: '客厅', price: 145, art: 'tv', color: 'purple', tip: '一起看今晚的电影' },
    { id: 'dining-chair', name: '奶油餐椅', cat: '餐厅', price: 52, art: 'chair', color: 'cream', tip: '围着餐桌坐满两个人' },
    { id: 'fridge', name: '糖果冰箱', cat: '厨房', price: 155, art: 'fridge', color: 'pink', tip: '藏着明天的早餐' },
    { id: 'bath', name: '云朵浴缸', cat: '浴室', price: 168, art: 'bath', color: 'blue', tip: '泡一会儿就会恢复能量' },
    { id: 'wardrobe', name: '小衣柜', cat: '卧室', price: 130, art: 'wardrobe', color: 'wood', tip: '把两个人的衣服放在一起' },
    { id: 'piano', name: '奶油小钢琴', cat: '书房', price: 240, art: 'piano', color: 'purple', tip: '让房间有一点柔软的声音' },
    { id: 'hammock', name: '阳台吊床', cat: '阳台', price: 105, art: 'hammock', color: 'green', tip: '晒着太阳一起发呆' },
    { id: 'flower-box', name: '窗台花箱', cat: '阳台', price: 58, art: 'flowerbox', color: 'green', tip: '种下属于你们的小花' },
    { id: 'ottoman', name: '云朵脚凳', cat: '客厅', price: 58, art: 'ottoman', color: 'pink', tip: '坐在沙发边伸伸懒腰' },
    { id: 'coffee-table', name: '草莓小茶几', cat: '客厅', price: 88, art: 'table', color: 'pink', tip: '放下两杯热乎乎的饮料' },
    { id: 'books', name: '彩色绘本架', cat: '收纳', price: 105, art: 'books', color: 'purple', tip: '把喜欢的故事排在一起' },
    { id: 'nightstand', name: '晚安床头柜', cat: '卧室', price: 76, art: 'nightstand', color: 'wood', tip: '放一盏灯和睡前读物' },
    { id: 'mirror', name: '兔兔穿衣镜', cat: '卧室', price: 118, art: 'mirror', color: 'pink', tip: '出门前一起整理好心情' },
    { id: 'vanity', name: '蜜桃梳妆台', cat: '卧室', price: 156, art: 'desk', color: 'pink', tip: '留一个慢慢准备的角落' },
    { id: 'toilet', name: '圆圆小马桶', cat: '浴室', price: 92, art: 'toilet', color: 'blue', tip: '浴室里的实用小家具' },
    { id: 'sink', name: '贝壳洗手台', cat: '浴室', price: 108, art: 'sink', color: 'blue', tip: '洗漱用品都有自己的位置' },
    { id: 'shower', name: '彩虹淋浴间', cat: '浴室', price: 142, art: 'shower', color: 'purple', tip: '冲掉一天的疲惫' },
    { id: 'bath-mat', name: '小花浴室垫', cat: '浴室', price: 48, art: 'rug', color: 'green', tip: '踩起来软绵绵的' },
    { id: 'desk-lamp', name: '星星书桌灯', cat: '灯具', price: 62, art: 'lamp', color: 'purple', tip: '陪你们读完最后一页' },
    { id: 'plant-hanging', name: '吊起来的绿萝', cat: '阳台', price: 66, art: 'plant', color: 'green', tip: '让阳台也长出一点春天' },
    { id: 'flower-chair', name: '花花阳台椅', cat: '阳台', price: 74, art: 'chair', color: 'yellow', tip: '晒太阳的专属位置' },
    { id: 'tea-cart', name: '奶油点心车', cat: '餐厅', price: 124, art: 'kitchen', color: 'cream', tip: '把下午茶推到窗边' },
    { id: 'wall-clock', name: '软糖挂钟', cat: '装饰', price: 52, art: 'picture', color: 'yellow', tip: '记住每一个一起生活的时刻' },
    { id: 'dining-cabinet', name: '奶油餐边柜', cat: '餐厅', price: 132, art: 'shelf', color: 'cream', tip: '把餐具和小点心收好' },
    { id: 'dining-stool', name: '草莓高脚凳', cat: '餐厅', price: 54, art: 'chair', color: 'pink', tip: '厨房岛台边的可爱座位' },
    { id: 'dessert-display', name: '甜点展示架', cat: '餐厅', price: 116, art: 'kitchen', color: 'yellow', tip: '每天都摆上一份小甜点' },
    { id: 'bedside-lamp', name: '月牙床头灯', cat: '卧室', price: 64, art: 'lamp', color: 'yellow', tip: '睡前留一盏温柔的灯' },
    { id: 'study-shelf', name: '蓝莓资料架', cat: '书房', price: 112, art: 'shelf', color: 'blue', tip: '把灵感和资料分门别类' },
    { id: 'study-stool', name: '软糖学习椅', cat: '书房', price: 68, art: 'chair', color: 'yellow', tip: '坐下来专心完成一件事' },
    { id: 'stationery-board', name: '心情留言板', cat: '书房', price: 58, art: 'picture', color: 'pink', tip: '留下今天想对彼此说的话' },
    { id: 'balcony-table', name: '阳台小圆桌', cat: '阳台', price: 86, art: 'table', color: 'green', tip: '放两杯饮料和一束花' },
    { id: 'watering-can', name: '彩虹浇花壶', cat: '阳台', price: 46, art: 'plant', color: 'blue', tip: '给阳台植物一点小小的照顾' },
    { id: 'towel-rack', name: '云朵毛巾架', cat: '浴室', price: 72, art: 'shelf', color: 'blue', tip: '把柔软的毛巾挂在手边' },
    { id: 'bathroom-mirror', name: '泡泡浴室镜', cat: '浴室', price: 96, art: 'mirror', color: 'pink', tip: '洗漱时也要记得对自己笑' },
    { id: 'vase', name: '草莓小花瓶', cat: '装饰', price: 46, art: 'vase', color: 'pink', tip: '插一朵今天喜欢的小花' },
    { id: 'carpet', name: '彩虹软地毯', cat: '装饰', price: 108, art: 'rug', color: 'purple', tip: '给房间铺上一小片彩虹' },
    { id: 'painting', name: '蜜桃风景挂画', cat: '装饰', price: 84, art: 'picture', color: 'peach', tip: '把喜欢的风景留在墙上' },
    { id: 'clock', name: '布丁小挂钟', cat: '装饰', price: 66, art: 'clock', color: 'yellow', tip: '让时间也变得软乎乎' },
    { id: 'photo-frame', name: '两个人的相框', cat: '装饰', price: 58, art: 'picture', color: 'wood', tip: '放一张想一起记住的照片' },
    { id: 'candle', name: '奶油香薰蜡烛', cat: '装饰', price: 42, art: 'lamp', color: 'peach', tip: '给晚上的房间一点香气' },
    { id: 'plush', name: '小熊毛绒玩偶', cat: '装饰', price: 63, art: 'plush', color: 'yellow', tip: '坐在床边陪你们入睡' },
    { id: 'basket', name: '莓莓收纳篮', cat: '收纳', price: 70, art: 'shelf', color: 'pink', tip: '把零碎的小东西装起来' }
  ];
  const areas = [
    { id: 'living', name: '客厅', sub: '一起休息' },
    { id: 'dining', name: '餐厅', sub: '一起吃饭' },
    { id: 'bedroom', name: '卧室', sub: '一起晚安' },
    { id: 'study', name: '书房', sub: '一起做事' },
    { id: 'balcony', name: '阳台', sub: '一起发呆' },
    { id: 'bathroom', name: '浴室', sub: '一起洗漱' }
  ];
  const maxFurniturePerArea = 12;
  const dyeColors = [{ id: 'pink', name: '草莓粉', hex: '#e9a7aa' }, { id: 'peach', name: '蜜桃橘', hex: '#efb38e' }, { id: 'yellow', name: '奶油黄', hex: '#f0c86f' }, { id: 'green', name: '薄荷绿', hex: '#91c69d' }, { id: 'blue', name: '晴空蓝', hex: '#9ebfdf' }, { id: 'purple', name: '星星紫', hex: '#b9a5d6' }, { id: 'cream', name: '奶油白', hex: '#e8cda9' }, { id: 'wood', name: '暖木色', hex: '#c99a69' }];
  const furnitureScales = { sofa: 1.34, table: 1.18, lamp: .55, plant: .62, rug: .95, shelf: 1.24, bed: 1.4, picture: .58, desk: 1.2, chair: .88, kitchen: 1.16, cushion: .58, armchair: 1.25, tv: 1, fridge: 1.28, bath: 1.36, wardrobe: 1.3, piano: 1.35, hammock: 1.28, flowerbox: .66, bread: .64, box: .64, ottoman: 1, books: 1, nightstand: .94, mirror: .9, toilet: 1, sink: 1, shower: 1.2, vase: .48, clock: .5, plush: .62 };
  const itemScales = { 'coffee-table': 1.18, 'dining-cabinet': 1.24, 'dining-stool': .82, 'dessert-display': .88, 'bedside-lamp': .5, 'study-shelf': 1.12, 'study-stool': .82, 'stationery-board': .52, 'balcony-table': 1.05, 'watering-can': .5, 'flower-chair': .86, 'towel-rack': .72, 'bathroom-mirror': .72, vase: .48, carpet: 1.08, painting: .62, clock: .5, 'photo-frame': .52, candle: .45, plush: .62, basket: .68 };
  const cats = ['全部', ...new Set(items.map(item => item.cat))];
  let state = load();
  let page = 'room';
  let cat = '全部';
  let sheet = '';
  let toast = '';
  let selectedFurnitureId = '';
  let dragState = null;
  let roomStyleOpen = false;
  let activeArea = 'living';
  let placementPickerId = '';
  let dyeId = '';
  let toastTimer = 0;
  let scanningJobs = false;

  function load() { try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); return { profileId: saved.profileId || '', roleId: saved.roleId || '', homes: saved.homes || {} }; } catch { return { profileId: '', roleId: '', homes: {} }; } }
  function save() { localStorage.setItem(key, JSON.stringify(state)); }
  function read(name, fallback) { try { const value = JSON.parse(localStorage.getItem(name) || 'null'); return value ?? fallback; } catch { return fallback; } }
  function chat() { const value = read(chatKey, {}); return { profiles: Array.isArray(value.profiles) ? value.profiles : [], contacts: Array.isArray(value.contacts) ? value.contacts : [], chats: value.chats || {} }; }
  function user() { const list = chat().profiles; if (!state.profileId || !list.some(item => item.id === state.profileId)) state.profileId = list[0]?.id || ''; return list.find(item => item.id === state.profileId) || null; }
  function roles() { return chat().contacts; }
  function character() { const list = roles(); if (!state.roleId || !list.some(item => item.id === state.roleId)) state.roleId = list[0]?.id || ''; return list.find(item => item.id === state.roleId) || null; }
  function home() { const id = user()?.id || 'guest'; state.homes[id] ||= { coins: 120, owned: [], placed: [], work: { user: null, role: null }, history: [] }; const data = state.homes[id]; data.owned ||= []; data.work ||= { user: null, role: null }; data.history ||= []; data.customJobs ||= []; data.workConfig ||= { timeRate: 1, rewardRate: 1 }; data.roomStyle ||= { wall: 'cream', floor: 'wood' }; data.areas ||= { living: { placed: data.placed || [], roomStyle: data.roomStyle } }; areas.forEach((entry, index) => { data.areas[entry.id] ||= { placed: [], roomStyle: { wall: 'cream', floor: index === 1 ? 'cream' : 'wood' } }; data.areas[entry.id].placed ||= []; data.areas[entry.id].roomStyle ||= { wall: 'cream', floor: 'wood' }; data.areas[entry.id].placed = data.areas[entry.id].placed.map((itemEntry, itemIndex) => { if (Number.isFinite(Number(itemEntry.x)) && Number.isFinite(Number(itemEntry.y))) return { ...itemEntry, rotation: Number(itemEntry.rotation) || 0 }; const slot = Number(itemEntry.slot); return { ...itemEntry, x: 22 + ((Number.isFinite(slot) ? slot : itemIndex) % 3) * 28, y: 25 + (Math.floor((Number.isFinite(slot) ? slot : itemIndex) / 3) % 3) * 25, rotation: 0 }; }); }); return data; }
  function areaData() { const data = home(); return data.areas[activeArea] || data.areas.living; }
  function userName() { const item = user(); return item?.nickname || item?.realName || item?.name || '我'; }
  function roleName() { const item = character(); return item?.nickname || item?.name || 'Ta'; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function avatar(item, fallback) { return item?.avatar ? `<img src="${esc(item.avatar)}" alt="">` : esc((item?.nickname || item?.name || fallback || '家').slice(0, 1)); }
  function uid() { return `house-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
  function item(id) { return items.find(entry => entry.id === id); }
  function owned(id) { return home().owned.filter(entry => entry.itemId === id).length; }
  function placed(id) { return areaData().placed.some(entry => entry.ownedId === id); }
  function placedAnywhere(id) { return Object.values(home().areas).some(area => area.placed.some(entry => entry.ownedId === id)); }
  function areaFor(id) { const found = areas.find(area => home().areas[area.id]?.placed.some(entry => entry.ownedId === id)); return found?.name || ''; }
  function workJobs() { return (home().customJobs || []).filter(entry => entry.source === 'api'); }
  function workConfig() { const config = home().workConfig; config.timeRate = Math.max(.5, Math.min(2, Number(config.timeRate) || 1)); config.rewardRate = Math.max(.5, Math.min(2, Number(config.rewardRate) || 1)); return config; }
  function jobTime(job) { return Math.max(5, Math.round(Number(job.time || 12) * workConfig().timeRate)); }
  function jobReward(job) { return Math.max(1, Math.round(Number(job.coins || 1) * workConfig().rewardRate)); }
  function art(kind, tone = '') {
    const paths = {
      sofa: '<path d="M12 28v-7c0-5 3-8 8-8h8c5 0 8 3 8 8v7"/><path d="M9 25h30v11H9zM14 36v4M34 36v4M15 25v-5M33 25v-5"/>',
      table: '<ellipse cx="24" cy="17" rx="14" ry="5"/><path d="M11 17v7c0 4 6 6 13 6s13-2 13-6v-7M16 30v10M32 30v10"/>',
      lamp: '<path d="M18 12h12l5 12H13zM24 24v12M16 40h16"/><circle cx="24" cy="9" r="2"/>',
      plant: '<path d="M18 23c-7-5-7-11-5-14 6 1 9 6 7 13M30 23c7-5 7-11 5-14-6 1-9 6-7 13M24 21c0-8 4-13 8-14 2 8-1 13-8 16M16 24h16l-2 16H18z"/>',
      rug: '<ellipse cx="24" cy="28" rx="17" ry="9"/><path d="M13 25c5 3 17 3 22 0M14 31c5 3 15 3 20 0"/>',
      shelf: '<path d="M12 9h24v31H12zM12 19h24M12 30h24M18 14h4M28 14h4M17 25h5M28 25h4"/>',
      bed: '<path d="M9 29h30v10H9zM9 29V18c0-3 2-5 5-5h20c3 0 5 2 5 5v11M13 25h9c2 0 3 2 3 4M13 39v2M35 39v2"/>',
      picture: '<rect x="10" y="9" width="28" height="29" rx="2"/><path d="m14 32 7-8 5 5 4-4 4 7M17 17h.1"/>',
      desk: '<path d="M9 14h30v7H9zM13 21v19M35 21v19M18 28h12"/>',
      chair: '<path d="M15 12h18v13H15zM15 25h18l-2 7H17zM19 32v8M29 32v8"/>',
      kitchen: '<path d="M10 17h28v23H10zM10 24h28M16 12v8M24 12v8M32 12v8M16 30h5M27 30h5"/>',
      cushion: '<path d="m14 16 10-5 10 5 3 11-13 10-13-10zM17 18l7 4 7-4M17 30l7-5 7 5"/>',
      armchair: '<path d="M13 28v-7c0-4 3-7 7-7h8c4 0 7 3 7 7v7M10 25h28v11H10zM15 36v4M33 36v4"/>',
      tv: '<rect x="9" y="12" width="30" height="22" rx="4"/><path d="M19 40h10M24 34v6M17 18h14"/>',
      fridge: '<rect x="13" y="8" width="22" height="32" rx="3"/><path d="M13 24h22M29 15v4M29 29v4"/>',
      bath: '<path d="M9 25h30v5c0 6-5 10-11 10H20c-6 0-11-4-11-10v-5ZM13 25V15c0-4 3-6 6-4l3 3M9 31h30M14 40v2M34 40v2"/>',
      wardrobe: '<rect x="11" y="8" width="26" height="32" rx="2"/><path d="M24 8v32M21 24h.1M27 24h.1"/>',
      piano: '<path d="M9 16h30v20H9zM14 36v4M34 36v4M13 16v-5h22v5M16 16v12M20 16v12M24 16v12M28 16v12M32 16v12"/>',
      hammock: '<path d="M10 12v27M38 12v27M10 16c7 17 21 17 28 0M16 26c5 4 11 4 16 0"/>',
      flowerbox: '<path d="M10 25h28l-3 12H13zM15 25c-1-8 3-13 7-14M24 25c0-8 4-13 8-14M18 20c-4-4-4-8-2-10 4 1 5 5 2 10"/>',
      ottoman: '<rect x="11" y="19" width="26" height="16" rx="6"/><path d="M15 35v5M33 35v5"/>',
      books: '<path d="M12 11h7v28h-7zM21 15h7v24h-7zM30 9h6v30h-6zM12 39h24"/>',
      nightstand: '<rect x="12" y="15" width="24" height="25" rx="2"/><path d="M12 24h24M18 20h5M17 40v2M31 40v2"/>',
      mirror: '<rect x="14" y="8" width="20" height="30" rx="10"/><path d="M24 38v4M18 42h12"/>',
      toilet: '<path d="M14 21h20v8c0 6-4 10-10 10s-10-4-10-10zM18 21V11h12v10M20 15h8"/>',
      sink: '<path d="M10 24h28v5c0 5-4 8-9 8H19c-5 0-9-3-9-8zM17 24v-7h14v7M24 17v-5M20 12h8"/>',
      shower: '<path d="M15 39V17c0-6 4-10 9-10s9 4 9 10v22M11 17h26M17 23h.1M22 27h.1M28 22h.1M32 28h.1"/>',
      vase: '<path d="M18 10h12M20 10c0 6-3 8-3 13v12c0 4 3 6 7 6s7-2 7-6V23c0-5-3-7-3-13M17 35h14"/>',
      clock: '<circle cx="24" cy="24" r="14"/><path d="M24 16v9l6 4M20 7h8M24 5v3"/>',
      plush: '<circle cx="16" cy="15" r="5" fill="var(--house-art-fill)" stroke="#876565" stroke-width="1.4"/><circle cx="32" cy="15" r="5" fill="var(--house-art-fill)" stroke="#876565" stroke-width="1.4"/><circle cx="24" cy="23" r="11" fill="var(--house-art-fill)" stroke="#876565" stroke-width="1.4"/><ellipse cx="24" cy="35" rx="9" ry="7" fill="var(--house-art-fill)" stroke="#876565" stroke-width="1.4"/><ellipse cx="24" cy="28" rx="5" ry="4" fill="#f8d9cb" stroke="#876565" stroke-width="1"/><circle cx="19" cy="23" r="1.5" fill="#654b50" stroke="none"/><circle cx="29" cy="23" r="1.5" fill="#654b50" stroke="none"/><circle cx="16" cy="28" r="2" fill="#eea5ad" stroke="none"/><circle cx="32" cy="28" r="2" fill="#eea5ad" stroke="none"/><path d="M22 28c1 1 3 1 4 0M24 28v2M17 35l-4 3M31 35l4 3M19 40v2M29 40v2" fill="none" stroke="#876565" stroke-width="1.4" stroke-linecap="round"/>',
      bread: '<path d="M11 30c0-10 6-17 13-17s13 7 13 17c0 4-3 7-7 7H18c-4 0-7-3-7-7Z"/><path d="M18 22c2 1 3 3 3 6M26 19c2 2 3 4 3 7"/>',
      box: '<path d="m10 17 14-7 14 7-14 7zM10 17v15l14 7 14-7V17M24 24v15M17 14l14 7"/>'
    };
    const fills = {
      sofa: '<path d="M12 28h24v8H12z"/><path d="M15 21c0-4 3-6 6-6h6c3 0 6 2 6 6v5H15z"/>',
      table: '<ellipse cx="24" cy="17" rx="13" ry="4"/>',
      lamp: '<path d="M18 13h12l4 10H14z"/>',
      plant: '<path d="M17 26h14l-2 13H19z"/><path d="M24 21c-5-5-5-9-3-12 5 2 6 7 3 12z"/>',
      rug: '<ellipse cx="24" cy="28" rx="16" ry="8"/>',
      shelf: '<path d="M13 10h22v29H13z"/>',
      bed: '<path d="M10 29h28v9H10z"/><path d="M13 20c0-4 3-6 7-6h10c3 0 5 2 5 6v8H13z"/>',
      picture: '<rect x="11" y="10" width="26" height="27" rx="1"/>',
      desk: '<path d="M10 15h28v5H10z"/>',
      chair: '<path d="M16 13h16v11H16z"/><path d="M17 25h14l-2 7H19z"/>',
      kitchen: '<path d="M11 18h26v20H11z"/>',
      cushion: '<path d="m15 17 9-4 9 4 2 9-11 8-11-8z"/>',
      armchair: '<path d="M13 28h22v8H13z"/><path d="M16 21c0-4 3-6 6-6h4c3 0 6 2 6 6v5H16z"/>',
      tv: '<rect x="11" y="14" width="26" height="17" rx="3"/>',
      fridge: '<rect x="14" y="9" width="20" height="30" rx="2"/>',
      bath: '<path d="M10 26h28v4c0 5-4 8-9 8H19c-5 0-9-3-9-8z"/>',
      wardrobe: '<rect x="12" y="9" width="24" height="30" rx="1"/>',
      piano: '<path d="M10 17h28v18H10z"/>',
      hammock: '<path d="M11 16c7 15 19 15 26 0M16 26c5 3 11 3 16 0"/>',
      flowerbox: '<path d="M11 26h26l-3 10H14z"/>',
      ottoman: '<rect x="12" y="20" width="24" height="14" rx="5"/>',
      books: '<rect x="13" y="12" width="5" height="25"/><rect x="22" y="16" width="5" height="21"/><rect x="31" y="10" width="4" height="27"/>',
      nightstand: '<rect x="13" y="16" width="22" height="23" rx="2"/>',
      mirror: '<rect x="16" y="10" width="16" height="26" rx="8"/>',
      toilet: '<path d="M15 22h18v7c0 5-4 8-9 8s-9-3-9-8z"/>',
      sink: '<path d="M11 25h26v4c0 4-4 7-8 7H19c-4 0-8-3-8-7z"/>',
      shower: '<path d="M16 38V18c0-5 3-9 8-9s8 4 8 9v20z"/>',
      vase: '<path d="M19 24v11c0 4 3 5 5 5s5-1 5-5V24z"/>',
      clock: '<circle cx="24" cy="24" r="12"/>',
      plush: ''
    };
    const colors = { pink: '#e9a7aa', peach: '#efb38e', wood: '#c99a69', yellow: '#f0c86f', green: '#91c69d', cream: '#e8cda9', blue: '#9ebfdf', purple: '#b9a5d6' };
    return `<svg viewBox="0 0 48 48" aria-hidden="true" style="--house-art-fill:${colors[tone] || '#e8b0a8'}"><g fill="var(--house-art-fill)" opacity=".92">${fills[kind] || fills.picture}</g><g fill="none">${paths[kind] || paths.picture}</g></svg>`;
  }
  function furnitureScale(info) { return itemScales[info?.id] || furnitureScales[info?.art] || 1; }
  function activeWork(actor) { return home().work[actor]; }
  function finishWork() {
    const data = home(); let changed = false;
    ['user', 'role'].forEach(actor => { const task = data.work[actor]; if (!task || task.end > Date.now()) return; const job = workJobs().find(entry => entry.id === task.jobId); if (!job) return; const reward = Number(task.reward || jobReward(job)); data.coins += reward; data.work[actor] = null; data.history.unshift({ id: uid(), text: `${actor === 'role' ? roleName() : userName()} 完成了${job.name}的工作`, coins: reward, time: new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }); data.history = data.history.slice(0, 10); toast = `+${reward} 家币　${actor === 'role' ? roleName() : userName()} 回家啦`; changed = true; });
    if (changed) save();
  }
  function timeLeft(task) { return Math.max(0, Math.ceil((task.end - Date.now()) / 1000)); }
  function top(title, sub) { return `<header class="house-top"><div><span>OUR LITTLE HOME</span><h1>${title}</h1><p>${sub}</p></div><button data-house-close type="button">×</button></header>`; }
  function coins() { return `<section class="house-coins"><div><span>HOME COINS</span><b>${home().coins}</b><small>家币 · 仅用于家具商城</small></div><i>♡</i></section>`; }
  function people() { const p = user(); const r = character(); return `<section class="house-people"><button data-house-pick="profile" type="button"><i>${avatar(p, '我')}</i><span><small>用户</small><b>${esc(userName())}</b></span></button><em>♥</em><button data-house-pick="role" type="button"><i>${avatar(r, 'Ta')}</i><span><small>角色</small><b>${esc(roleName())}</b></span></button></section>`; }
  function roomSettings() { if (!roomStyleOpen) return ''; const wall = [{ id: 'cream', name: '奶油墙' }, { id: 'pink', name: '草莓墙' }, { id: 'sky', name: '晴天墙' }, { id: 'mint', name: '薄荷墙' }, { id: 'lavender', name: '紫藤墙' }, { id: 'cloud', name: '云朵墙' }, { id: 'candy', name: '糖果墙' }, { id: 'star', name: '星星墙' }, { id: 'bunny', name: '兔兔墙' }, { id: 'peach', name: '蜜桃墙' }, { id: 'flower', name: '小花墙' }, { id: 'berry', name: '莓莓墙' }]; const floor = [{ id: 'wood', name: '木质地板' }, { id: 'cream', name: '奶油地板' }, { id: 'pink', name: '粉色地板' }, { id: 'blue', name: '蓝色地板' }, { id: 'check', name: '糖果格子' }, { id: 'cloud', name: '云朵地毯' }, { id: 'rainbow', name: '彩虹地板' }, { id: 'mint', name: '薄荷地板' }, { id: 'strawberry', name: '草莓地板' }, { id: 'star', name: '星星地板' }, { id: 'lilac', name: '紫色地板' }, { id: 'cookie', name: '曲奇地板' }]; return `<section class="house-style-panel"><header><div><span>ROOM STYLE</span><b>布置${areas.find(entry => entry.id === activeArea)?.name || '房间'}</b><small>每个区域都可以单独换主题</small></div><button data-house-style-close type="button">×</button></header><div class="house-style-group"><small>墙壁 · 可爱主题</small><div>${wall.map(choice => `<button class="house-swatch wall-${choice.id} ${areaData().roomStyle.wall === choice.id ? 'active' : ''}" data-house-wall="${choice.id}" type="button"><i></i><span>${choice.name}</span></button>`).join('')}</div></div><div class="house-style-group"><small>地板 · 可爱主题</small><div>${floor.map(choice => `<button class="house-swatch floor-${choice.id} ${areaData().roomStyle.floor === choice.id ? 'active' : ''}" data-house-floor="${choice.id}" type="button"><i></i><span>${choice.name}</span></button>`).join('')}</div></div></section>`; }
  function room() { const data = home(); const roomData = areaData(); const area = areas.find(entry => entry.id === activeArea) || areas[0]; const placedMarkup = roomData.placed.map(entry => { const ownedItem = data.owned.find(candidate => candidate.id === entry.ownedId); const info = item(ownedItem?.itemId); if (!info) return ''; return `<button class="house-furniture ${selectedFurnitureId === entry.ownedId ? 'selected' : ''}" data-house-furniture="${entry.ownedId}" type="button" style="--house-scale:${furnitureScale(info)};left:${entry.x}%;top:${entry.y}%;transform:translate(-50%,-50%) rotate(${entry.rotation || 0}deg)">${art(info.art, ownedItem?.tone || info.color)}</button>`; }).join(''); const selected = roomData.placed.find(entry => entry.ownedId === selectedFurnitureId); const selectedItem = selected && data.owned.find(entry => entry.id === selected.ownedId); const selectedInfo = item(selectedItem?.itemId); return `<section class="house-room-card"><nav class="house-area-tabs">${areas.map(entry => `<button class="${entry.id === activeArea ? 'active' : ''}" data-house-area="${entry.id}" type="button"><b>${entry.name}</b><small>${entry.sub}</small></button>`).join('')}</nav><div class="house-card-title"><div><span>${area.name.toUpperCase()} · DRAG TO DECORATE</span><h2>${area.name}</h2></div><button class="house-style-button" data-house-style-open type="button">✦</button><small>${roomData.placed.length} 件家具</small></div><div class="house-room" data-house-room data-house-wall="${roomData.roomStyle.wall}" data-house-floor="${roomData.roomStyle.floor}">${placedMarkup}<span class="house-room-window">☼</span><span class="house-room-rug-mark">⌁</span></div>${selectedInfo ? `<div class="house-room-tools"><span><b>已选中家具</b><small>拖动改变位置</small></span><button data-house-rotate="-15" type="button">↶</button><button data-house-rotate="15" type="button">↷</button><button data-house-remove="${selectedFurnitureId}" type="button">收回</button></div>` : '<p>点击家具后拖动位置，或用下方仓库把新家具摆进来。</p>'}${roomSettings()}</section>`; }
  function history() { const list = home().history; return `<section class="house-history"><div class="house-card-title"><div><span>LITTLE MOMENTS</span><h2>最近发生</h2></div></div>${list.length ? list.slice(0, 3).map(entry => `<article><i>✦</i><span><b>${esc(entry.text)}</b><small>${esc(entry.time)}　+${entry.coins} 家币</small></span></article>`).join('') : '<p>你们的第一笔家币，会从一次小小的工作开始。</p>'}</section>`; }
  function roomPage() { return `${top('家', '一起赚家币，一起把房间填满。')}${coins()}${people()}${room()}<section class="house-quick"><button data-house-page="work" type="button"><b>去打工</b><small>一起攒下一件家具</small><strong>→</strong></button><button data-house-page="shop" type="button"><b>逛商城</b><small>挑一件今天喜欢的东西</small><strong>→</strong></button></section>${history()}`; }
  function dyeSheet() { if (!dyeId) return ''; const ownedItem = home().owned.find(entry => entry.id === dyeId); const info = item(ownedItem?.itemId); if (!ownedItem || !info) return ''; const currentTone = ownedItem.tone || info.color; return `<div class="house-dye-picker"><div data-house-dye-close></div><section><header><div><span>FURNITURE COLOR</span><b>给${esc(info.name)}换个颜色</b><small>颜色会保存到这件家具</small></div><button data-house-dye-close type="button">×</button></header><div class="house-dye-preview">${art(info.art, currentTone)}<span>${esc(info.name)}</span></div><div class="house-dye-colors">${dyeColors.map(choice => `<button class="${currentTone === choice.id ? 'active' : ''}" data-house-dye-color="${choice.id}" type="button"><i style="background:${choice.hex}"></i><span>${choice.name}</span></button>`).join('')}</div></section></div>`; }
  function worker(actor, label, person) { if (activeWork(actor)) { const task = activeWork(actor); const job = workJobs().find(entry => entry.id === task.jobId); const left = timeLeft(task); const duration = Number(task.duration || jobTime(job)); const progress = Math.min(100, Math.max(2, 100 - left / duration * 100)); return `<article class="house-worker working" data-house-worker="${actor}"><div class="house-worker-title"><i>${avatar(person, actor === 'role' ? 'Ta' : '我')}</i><span><small>${label}</small><b>${esc(actor === 'role' ? roleName() : userName())}</b></span><em>工作中</em></div><p data-house-work-status>${esc(job.name)}　·　还剩 ${left} 秒</p><div class="house-progress"><i data-house-work-progress style="width:${progress}%"></i></div></article>`; }
    return `<article class="house-worker" data-house-worker="${actor}"><div class="house-worker-title"><i>${avatar(person, actor === 'role' ? 'Ta' : '我')}</i><span><small>${label}</small><b>${esc(actor === 'role' ? roleName() : userName())}</b></span></div><div class="house-work-options">${workJobs().map(job => `<button data-house-work="${actor}" data-house-job="${job.id}" type="button"><span>${esc(job.name)}</span><small>+${jobReward(job)} · ${jobTime(job)}s</small></button>`).join('')}</div></article>`; }
  function workSettings() { const config = workConfig(); return `<section class="house-work-settings"><div class="house-work-settings-head"><div><span>SMART JOBS</span><b>为你们定制工作</b><small>用户设定 × 角色设定</small></div><button data-house-scan-jobs type="button" ${scanningJobs ? 'disabled' : ''}><i>✦</i>${scanningJobs ? '扫描中…' : '扫描设定'}</button></div><div class="house-work-scan-note"><i>⌁</i><span>扫描身份、职业和性格，生成更适合你们的工作。</span></div><div class="house-work-tuning"><div class="house-slider-row"><label><span>工作时长</span><b data-house-time-label>${Math.round(config.timeRate * 100)}%</b></label><input type="range" min=".5" max="2" step=".1" value="${config.timeRate}" data-house-time-rate></div><div class="house-slider-row"><label><span>薪资倍率</span><b data-house-reward-label>${Math.round(config.rewardRate * 100)}%</b></label><input type="range" min=".5" max="2" step=".1" value="${config.rewardRate}" data-house-reward-rate></div></div></section>`; }
  function workPage() { const list = workJobs(); const catalog = list.length ? `<section class="house-job-catalog"><div class="house-card-title"><div><span>JOB CATALOG · ${list.length} 项</span><h2>适合你们的工作</h2></div></div>${list.map(job => `<article><div class="house-job-icon">${art(job.art || 'picture')}</div><span><b>${esc(job.name)}</b><small>${esc(job.detail || '一份根据设定生成的工作')}</small>${job.fit ? `<em>✦ ${esc(job.fit)}</em>` : ''}</span><strong>+${jobReward(job)}</strong></article>`).join('')}</section>` : '<section class="house-empty-card house-work-empty"><i>✦</i><h2>还没有专属工作</h2><p>点击上方“扫描设定”，让 API 读取你们的身份、技能和性格后生成工作。</p></section>'; return `${top('打工', '每一份小小的努力，都会变成家里的新角落。')}${coins()}<section class="house-work-note"><span>WORK TOGETHER</span><h2>今天谁来上班？</h2><p>用户和角色可以同时工作，获得的家币会进入共同账户。</p></section>${workSettings()}<section class="house-workers">${worker('user', '用户', user())}${character() ? worker('role', '角色', character()) : '<p class="house-empty">还没有角色，请先在聊天 App 创建一个角色。</p>'}</section>${catalog}`; }
  function shopPage() { const list = cat === '全部' ? items : items.filter(entry => entry.cat === cat); return `${top('家具商城', '用家币买下每一个想一起拥有的小东西。')}${coins()}<nav class="house-cats">${cats.map(name => `<button class="${cat === name ? 'active' : ''}" data-house-cat="${esc(name)}" type="button">${esc(name)}</button>`).join('')}</nav><section class="house-products">${list.map(info => `<article class="house-product ${info.color}"><div class="house-product-art">${art(info.art, info.color)}</div><div class="house-product-body"><small>${esc(info.cat)}</small><b>${esc(info.name)}</b><p>${esc(info.tip)}</p><footer><strong>${info.price}<i> 家币</i></strong><button data-house-buy="${info.id}" type="button" ${home().coins < info.price ? 'disabled' : ''}>${home().coins < info.price ? '不足' : '买下'}</button></footer></div></article>`).join('')}</section>`; }
  function storagePage() { const data = home(); const placedTotal = Object.values(data.areas).reduce((sum, area) => sum + area.placed.length, 0); return `${top('仓库', '买下的家具都在这里，随时可以换个颜色。')}${coins()}<div class="house-storage-summary"><span>MY FURNITURE</span><b>${data.owned.length} 件　·　已摆 ${placedTotal} 件</b></div><section class="house-storage">${data.owned.length ? data.owned.slice().reverse().map(entry => { const info = item(entry.itemId); const isPlaced = placedAnywhere(entry.id); const refund = Math.floor((info?.price || 0) * .6); return `<article class="house-storage-item"><div>${art(info?.art, entry.tone || info?.color)}</div><span><b>${esc(info?.name || '家具')}</b><small>${esc(info?.cat || '')} · ${isPlaced ? `已放在${areaFor(entry.id)}` : '仓库中'}</small></span><div class="house-storage-actions"><button data-house-dye="${entry.id}" type="button">染色</button><button data-house-${isPlaced ? 'remove' : 'place'}="${entry.id}" type="button" ${!isPlaced && data.areas[activeArea].placed.length >= maxFurniturePerArea ? 'disabled' : ''}>${isPlaced ? '收回' : '选择区域摆入'}</button><button class="recycle" data-house-recycle="${entry.id}" type="button">回收 +${refund}</button></div></article>`; }).join('') : '<div class="house-empty-card"><i>⌂</i><h2>仓库还是空的</h2><p>去商城挑一件喜欢的家具吧。</p><button data-house-page="shop" type="button">去商城</button></div>'}</section>`; }
  function placementSheet() { if (!placementPickerId) return ''; const entry = home().owned.find(itemEntry => itemEntry.id === placementPickerId); const info = item(entry?.itemId); if (!entry || !info) return ''; return `<div class="house-placement-picker"><div data-house-placement-close></div><section><header><div><span>PLACE FURNITURE</span><b>把家具放在哪里？</b></div><button data-house-placement-close type="button">×</button></header><div class="house-placement-item">${art(info.art, entry.tone || info.color)}<span><b>${esc(info.name)}</b><small>选择一个区域后即可摆入</small></span></div><div class="house-placement-list">${areas.map(area => { const roomData = home().areas[area.id]; const full = roomData.placed.length >= maxFurniturePerArea; const icons = { living: '⌂', dining: '◌', bedroom: '☾', study: '✎', balcony: '☼', bathroom: '♧' }; return `<button data-house-place-area="${area.id}" type="button" ${full ? 'disabled' : ''}><i>${icons[area.id] || '⌂'}</i><span><b>${area.name}</b><small>${area.sub} · ${roomData.placed.length}/${maxFurniturePerArea}</small></span><em>${full ? '已满' : '放入 ›'}</em></button>`; }).join('')}</div></section></div>`; }
  function picker() { if (!sheet) return ''; const list = sheet === 'profile' ? chat().profiles : roles(); return `<div class="house-picker"><div data-house-picker-close></div><section><header><span>CHOOSE ONE</span><button data-house-picker-close type="button">×</button></header><h2>选择${sheet === 'profile' ? '用户' : '角色'}</h2>${list.length ? list.map(entry => `<button data-house-select="${sheet}" data-house-id="${esc(entry.id)}" type="button"><i>${avatar(entry, sheet === 'profile' ? '我' : 'Ta')}</i><span><b>${esc(entry.nickname || entry.realName || entry.name || '未命名')}</b><small>${esc(entry.identity || '设定')}</small></span><em>${entry.id === (sheet === 'profile' ? state.profileId : state.roleId) ? '✓' : '›'}</em></button>`).join('') : '<p class="house-empty">还没有可选择的对象。</p>'}</section></div>`; }
  function nav() { return `<nav class="house-nav"><button class="${page === 'room' ? 'active' : ''}" data-house-page="room" type="button"><b>⌂</b><small>小家</small></button><button class="${page === 'work' ? 'active' : ''}" data-house-page="work" type="button"><b>✦</b><small>打工</small></button><button class="${page === 'shop' ? 'active' : ''}" data-house-page="shop" type="button"><b>◇</b><small>商城</small></button><button class="${page === 'storage' ? 'active' : ''}" data-house-page="storage" type="button"><b>▦</b><small>仓库</small></button></nav>`; }
  function render(preserveScroll = false) { const previousPage = preserveScroll ? app.querySelector('.house-page') : null; const scrollTop = previousPage?.scrollTop || 0; finishWork(); app.innerHTML = `<main class="house-page">${page === 'room' ? roomPage() : page === 'work' ? workPage() : page === 'shop' ? shopPage() : storagePage()}${toast ? `<div class="house-toast">${esc(toast)}</div>` : ''}${nav()}${placementSheet()}${dyeSheet()}</main>`; if (preserveScroll) { const nextPage = app.querySelector('.house-page'); if (nextPage) nextPage.scrollTop = scrollTop; } if (page === 'room') { const tabs = app.querySelector('.house-area-tabs'); const activeTab = tabs?.querySelector('.active'); if (tabs && activeTab) tabs.scrollLeft = Math.max(0, activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2); } if (toast) { clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast = ''; render(); }, 2400); } }
  function refreshWorkProgress() { if (finishWork()) { render(); return; } ['user', 'role'].forEach(actor => { const task = activeWork(actor); const box = app.querySelector(`[data-house-worker="${actor}"]`); if (!task || !box) return; const job = workJobs().find(entry => entry.id === task.jobId); if (!job) return; const left = timeLeft(task); const duration = Number(task.duration || jobTime(job)); const status = box.querySelector('[data-house-work-status]'); const progress = box.querySelector('[data-house-work-progress]'); if (status) status.textContent = `${job.name}　·　还剩 ${left} 秒`; if (progress) progress.style.width = `${Math.min(100, Math.max(2, 100 - left / duration * 100))}%`; }); }
  function flash(message) { toast = message; render(); }
  function start(actor, jobId) { if (actor === 'role' && !character()) return; const data = home(); if (data.work[actor]) return; const job = workJobs().find(entry => entry.id === jobId); if (!job) return; const duration = jobTime(job); const reward = jobReward(job); data.work[actor] = { jobId, duration, reward, end: Date.now() + duration * 1000 }; save(); flash(`${actor === 'role' ? roleName() : userName()} 开始工作了`); }
  function settingText(person, label) { if (!person) return `${label}：未绑定`; const fields = label === '用户' ? [['姓名', person.realName || person.name], ['网名', person.nickname], ['性别', person.gender], ['生日', person.birthday], ['用户设定', person.persona], ['补充描述', person.description]] : [['姓名', person.name], ['昵称', person.nickname], ['身份', person.identity], ['性别', person.gender], ['生日', person.birthday], ['角色设定', person.details], ['签名', person.signature], ['补充描述', person.description]]; if (label === '角色' && person.worldbook) { const books = read('ideal-machine-worldbooks', {}); const book = (books.local || []).find(entry => entry.id === person.worldbook); if (book) fields.push(['局部世界书', (book.entries || []).filter(entry => entry.enabled !== false).map(entry => `【${entry.name}】${entry.content}`).join('\n')]); } return `${label}设定：\n${fields.filter(([, value]) => value).map(([name, value]) => `${name}：${String(value).trim()}`).join('\n') || '暂无可读取的文字设定'}`; }
  async function scanJobs() { if (scanningJobs) return; const p = user(); const r = character(); if (!p || !r) return flash('请先绑定用户和角色设定'); const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('jia') || window.IdealMachineAPI?.getModel?.('chat') || window.IdealMachineAPI?.getModel?.('ta'); if (!config.endpoint || !config.key || !model) return flash('请先在设置中为“家”配置 API 模型'); scanningJobs = true; render();
    try {
      const prompt = `请严格根据下面两份人物设定，为他们的共同小家生成 4 到 8 个真正匹配人物身份、技能、兴趣或性格的短期工作。不要套用面包店、跑腿、整理等通用工作，除非设定明确支持它们；每项都必须能指出具体依据。工作必须安全、日常、可完成，不涉及真实金钱或危险行为。只返回 JSON 数组，每项格式为 {"name":"工作名称","detail":"一句话描述具体要做什么","fit":"一句话说明它对应了哪条人物设定","time":整数秒数,"coins":整数家币,"art":"picture|bread|plant|box"}。工作时长控制在 10 到 90 秒，家币控制在 15 到 120 之间，工作之间要有明显差异。\n\n${settingText(p, '用户')}\n\n${settingText(r, '角色')}`;
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: .65, messages: [{ role: 'system', content: '你是共同小家里的个性化工作设计师。必须读取并使用人物设定，只输出合法 JSON，不要编造未提供的身份。' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed?.jobs;
      if (!Array.isArray(list)) throw new Error('模型返回格式不是工作列表');
      generated = list.map((entry, index) => ({ id: `smart-${Date.now()}-${index}`, source: 'api', name: String(entry.name || '').trim().slice(0, 24), detail: String(entry.detail || '').trim().slice(0, 70), fit: String(entry.fit || '').trim().slice(0, 70), time: Math.max(10, Math.min(90, Number(entry.time) || 20)), coins: Math.max(15, Math.min(120, Number(entry.coins) || 30)), art: ['picture', 'bread', 'plant', 'box'].includes(entry.art) ? entry.art : 'picture' })).filter(entry => entry.name && entry.detail && entry.fit);
      if (generated.length < 3) throw new Error('模型返回的设定匹配工作不足 3 项');
      home().customJobs = generated; save(); flash(`已根据你们的设定生成 ${generated.length} 项工作`);
    } catch (error) { home().customJobs = []; save(); flash(`根据设定生成失败：${error.message}`); }
    finally { scanningJobs = false; render(); }
  }
  function buy(id) { const info = item(id); const data = home(); if (!info || data.coins < info.price) return; data.coins -= info.price; data.owned.push({ id: uid(), itemId: id }); save(); flash(`${info.name} 已放进仓库`); }
  function dye(id, tone) { const ownedItem = home().owned.find(entry => entry.id === id); const choice = dyeColors.find(entry => entry.id === tone); if (!ownedItem || !choice) return; ownedItem.tone = choice.id; dyeId = ''; save(); flash(`${item(ownedItem.itemId)?.name || '家具'}换成${choice.name}啦`); }
  function place(id, targetArea = activeArea) { const data = home(); activeArea = targetArea; const roomData = areaData(); if (roomData.placed.length >= maxFurniturePerArea || placedAnywhere(id)) return; const index = roomData.placed.length; roomData.placed.push({ ownedId: id, x: 22 + (index % 4) * 19, y: 27 + (Math.floor(index / 4) % 3) * 25, rotation: 0 }); selectedFurnitureId = id; placementPickerId = ''; save(); flash(`家具已经放进${areas.find(area => area.id === activeArea)?.name || '房间'}啦`); }
  function recycle(id) { const data = home(); const ownedItem = data.owned.find(entry => entry.id === id); const info = item(ownedItem?.itemId); if (!ownedItem || !info) return; const refund = Math.floor(info.price * .6); if (!window.confirm(`回收「${info.name}」将返还 ${refund} 家币，确定吗？`)) return; data.owned = data.owned.filter(entry => entry.id !== id); Object.values(data.areas).forEach(area => { area.placed = area.placed.filter(entry => entry.ownedId !== id); }); data.coins += refund; if (selectedFurnitureId === id) selectedFurnitureId = ''; save(); flash(`已回收${info.name}，返还 ${refund} 家币`); }
  function rotate(degrees) { const entry = areaData().placed.find(item => item.ownedId === selectedFurnitureId); if (!entry) return; entry.rotation = (Number(entry.rotation) || 0) + degrees; save(); render(); }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="jia"]')) { state = load(); page = 'room'; sheet = ''; render(); app.classList.add('is-open'); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-house-close]')) { app.classList.remove('is-open'); return; }
    const pageButton = event.target.closest('[data-house-page]'); if (pageButton) { page = pageButton.dataset.housePage; sheet = ''; roomStyleOpen = false; render(); return; }
    const pick = event.target.closest('[data-house-pick]'); if (pick) { sheet = pick.dataset.housePick; render(); return; }
    if (event.target.closest('[data-house-picker-close]')) { sheet = ''; render(); return; }
    const selected = event.target.closest('[data-house-select]'); if (selected) { if (selected.dataset.houseSelect === 'profile') state.profileId = selected.dataset.houseId; else { state.roleId = selected.dataset.houseId; const linkedProfileId = chat().chats?.[state.roleId]?.profileId; if (linkedProfileId && chat().profiles.some(item => item.id === linkedProfileId)) state.profileId = linkedProfileId; } sheet = ''; save(); render(); return; }
    const areaButton = event.target.closest('[data-house-area]'); if (areaButton) { activeArea = areaButton.dataset.houseArea; selectedFurnitureId = ''; roomStyleOpen = false; render(); return; }
    const categoryButton = event.target.closest('[data-house-cat]'); if (categoryButton) { cat = categoryButton.dataset.houseCat; render(); return; }
    if (event.target.closest('[data-house-scan-jobs]')) { scanJobs(); return; }
    const workButton = event.target.closest('[data-house-work]'); if (workButton) { start(workButton.dataset.houseWork, workButton.dataset.houseJob); return; }
    const buyButton = event.target.closest('[data-house-buy]'); if (buyButton) { buy(buyButton.dataset.houseBuy); return; }
    if (event.target.closest('[data-house-dye-close]')) { dyeId = ''; render(); return; }
    const dyeButton = event.target.closest('[data-house-dye]'); if (dyeButton) { dyeId = dyeButton.dataset.houseDye; render(); return; }
    const dyeColorButton = event.target.closest('[data-house-dye-color]'); if (dyeColorButton) { dye(dyeId, dyeColorButton.dataset.houseDyeColor); return; }
    const placeButton = event.target.closest('[data-house-place]'); if (placeButton) { placementPickerId = placeButton.dataset.housePlace; render(); return; }
    if (event.target.closest('[data-house-placement-close]')) { placementPickerId = ''; render(); return; }
    const placeAreaButton = event.target.closest('[data-house-place-area]'); if (placeAreaButton) { place(placementPickerId, placeAreaButton.dataset.housePlaceArea); return; }
    const rotateButton = event.target.closest('[data-house-rotate]'); if (rotateButton) { rotate(Number(rotateButton.dataset.houseRotate)); return; }
    if (event.target.closest('[data-house-style-open]')) { roomStyleOpen = true; page = 'room'; render(); return; }
    if (event.target.closest('[data-house-style-close]')) { roomStyleOpen = false; render(); return; }
    const wallButton = event.target.closest('[data-house-wall]'); if (wallButton) { areaData().roomStyle.wall = wallButton.dataset.houseWall; save(); render(true); return; }
    const floorButton = event.target.closest('[data-house-floor]'); if (floorButton) { areaData().roomStyle.floor = floorButton.dataset.houseFloor; save(); render(true); return; }
    const furnitureButton = event.target.closest('[data-house-furniture]'); if (furnitureButton && !furnitureButton.dataset.houseDragged) { selectedFurnitureId = furnitureButton.dataset.houseFurniture; page = 'room'; render(); return; }
    const removeButton = event.target.closest('[data-house-remove]'); if (removeButton) { const roomData = areaData(); roomData.placed = roomData.placed.filter(entry => entry.ownedId !== removeButton.dataset.houseRemove); if (selectedFurnitureId === removeButton.dataset.houseRemove) selectedFurnitureId = ''; save(); flash('家具已收回仓库'); return; }
    const recycleButton = event.target.closest('[data-house-recycle]'); if (recycleButton) { recycle(recycleButton.dataset.houseRecycle); return; }
  });
  document.addEventListener('input', event => { if (!app.classList.contains('is-open')) return; const config = workConfig(); if (event.target.matches('[data-house-time-rate]')) { config.timeRate = Number(event.target.value); const label = app.querySelector('[data-house-time-label]'); if (label) label.textContent = `${Math.round(config.timeRate * 100)}%`; save(); } if (event.target.matches('[data-house-reward-rate]')) { config.rewardRate = Number(event.target.value); const label = app.querySelector('[data-house-reward-label]'); if (label) label.textContent = `${Math.round(config.rewardRate * 100)}%`; save(); } });
  document.addEventListener('pointerdown', event => { const target = event.target.closest('[data-house-furniture]'); const roomElement = target?.closest('[data-house-room]'); if (!target || !roomElement) return; const entry = areaData().placed.find(item => item.ownedId === target.dataset.houseFurniture); if (!entry) return; const rect = roomElement.getBoundingClientRect(); dragState = { target, entry, rect, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false }; target.setPointerCapture?.(event.pointerId); }, true);
  document.addEventListener('pointermove', event => { const drag = dragState; if (!drag || drag.pointerId !== event.pointerId) return; const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true; if (!drag.moved) return; drag.entry.x = Math.max(10, Math.min(90, (event.clientX - drag.rect.left) / drag.rect.width * 100)); drag.entry.y = Math.max(13, Math.min(87, (event.clientY - drag.rect.top) / drag.rect.height * 100)); drag.target.style.left = `${drag.entry.x}%`; drag.target.style.top = `${drag.entry.y}%`; event.preventDefault(); }, true);
  document.addEventListener('pointerup', event => { const drag = dragState; if (!drag || drag.pointerId !== event.pointerId) return; if (drag.moved) { selectedFurnitureId = drag.entry.ownedId; save(); drag.target.dataset.houseDragged = 'true'; setTimeout(() => delete drag.target.dataset.houseDragged, 100); } dragState = null; }, true);
  setInterval(() => { if (app.classList.contains('is-open') && (activeWork('user') || activeWork('role'))) refreshWorkProgress(); }, 1000);
  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.jia = { name: '家' };
})();
