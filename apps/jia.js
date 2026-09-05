(() => {
  const key = 'ideal-machine-home';
  const chatKey = 'ideal-machine-chat';
  const app = document.createElement('div');
  app.className = 'house-app';
  document.body.appendChild(app);

  const items = [
    { id: '3d-sofa-cream', name: '法式奶油沙发', cat: '客厅', price: 180, art: 'sofa', color: 'cream', tip: '可替换3D客厅沙发', is3d: true, slot: 'living_sofa', area: 'living', variant: 'cream' },
    { id: '3d-sofa-mauve', name: '灰紫绒面沙发', cat: '客厅', price: 210, art: 'sofa', color: 'purple', tip: '可替换3D客厅沙发', is3d: true, slot: 'living_sofa', area: 'living', variant: 'mauve' },
    { id: '3d-bed-rose', name: '灰玫瑰软床', cat: '卧室', price: 260, art: 'bed', color: 'pink', tip: '可替换3D卧室床', is3d: true, slot: 'bedroom_bed', area: 'bedroom', variant: 'rose' },
    { id: '3d-bed-lavender', name: '浅紫法式软床', cat: '卧室', price: 280, art: 'bed', color: 'purple', tip: '可替换3D卧室床', is3d: true, slot: 'bedroom_bed', area: 'bedroom', variant: 'lavender' },
    { id: '3d-wardrobe-cream', name: '奶白双门衣柜', cat: '卧室', price: 220, art: 'wardrobe', color: 'cream', tip: '可替换3D卧室衣柜', is3d: true, slot: 'bedroom_wardrobe', area: 'bedroom', variant: 'cream' },
    { id: '3d-wardrobe-mauve', name: '灰紫双门衣柜', cat: '卧室', price: 235, art: 'wardrobe', color: 'purple', tip: '可替换3D卧室衣柜', is3d: true, slot: 'bedroom_wardrobe', area: 'bedroom', variant: 'mauve' },
    { id: '3d-shelf-oak', name: '暖木厚书架', cat: '书房', price: 195, art: 'shelf', color: 'wood', tip: '可替换3D书房书架', is3d: true, slot: 'study_bookshelf', area: 'study', variant: 'oak' },
    { id: '3d-shelf-cream', name: '奶白法式书架', cat: '书房', price: 205, art: 'shelf', color: 'cream', tip: '可替换3D书房书架', is3d: true, slot: 'study_bookshelf', area: 'study', variant: 'cream' },
    { id: '3d-tv-gallery', name: '画框艺术电视', cat: '客厅', price: 230, art: 'tv', color: 'cream', tip: '可替换3D客厅电视', is3d: true, slot: 'living_tv', area: 'living', variant: 'gallery' },
    { id: '3d-tv-console', name: '悬浮影院电视', cat: '客厅', price: 255, art: 'tv', color: 'purple', tip: '带悬浮音响与金属底座', is3d: true, slot: 'living_tv', area: 'living', variant: 'console' },
    { id: '3d-fridge-french', name: '奶白法式冰箱', cat: '厨房', price: 245, art: 'fridge', color: 'cream', tip: '双开门与下层冷冻抽屉', is3d: true, slot: 'kitchen_fridge', area: 'dining', variant: 'french' },
    { id: '3d-fridge-mauve', name: '灰紫复古冰箱', cat: '厨房', price: 265, art: 'fridge', color: 'purple', tip: '圆角柜体与复古金属把手', is3d: true, slot: 'kitchen_fridge', area: 'dining', variant: 'retro' },
    { id: '3d-vanity-rose', name: '灰玫瑰梳妆台', cat: '卧室', price: 215, art: 'desk', color: 'pink', tip: '椭圆镜与三抽屉台面', is3d: true, slot: 'bedroom_vanity', area: 'bedroom', variant: 'rose' },
    { id: '3d-vanity-cream', name: '奶白法式梳妆台', cat: '卧室', price: 235, art: 'desk', color: 'cream', tip: '三折镜与弧形桌腿', is3d: true, slot: 'bedroom_vanity', area: 'bedroom', variant: 'cream' },
    { id: '3d-lounge-curved', name: '弧形会客沙发', cat: '会客厅', price: 310, art: 'sofa', color: 'pink', tip: '替换右侧一楼会客区', is3d: true, slot: 'bay_lounge', area: 'living', variant: 'curved' },
    { id: '3d-lounge-club', name: '双椅会客组合', cat: '会客厅', price: 325, art: 'armchair', color: 'purple', tip: '两张扶手椅与圆茶桌', is3d: true, slot: 'bay_lounge', area: 'living', variant: 'club' },
    { id: '3d-bath-clawfoot', name: '法式独立浴缸套装', cat: '浴室', price: 350, art: 'bath', color: 'cream', tip: '爪脚浴缸、洗手台与马桶', is3d: true, slot: 'bathroom_set', area: 'bathroom', variant: 'clawfoot' },
    { id: '3d-bath-rose', name: '灰粉嵌入浴室套装', cat: '浴室', price: 375, art: 'bath', color: 'pink', tip: '嵌入浴缸与双层洗手台', is3d: true, slot: 'bathroom_set', area: 'bathroom', variant: 'rose' },
    { id: '3d-car-aubergine', name: '深灰紫行政轿车', cat: '庭院', price: 680, art: 'car', color: 'purple', tip: '可替换3D庭院汽车车漆', is3d: true, slot: 'garden_car', area: 'balcony', variant: 'aubergine' },
    { id: '3d-car-pearl', name: '珍珠奶白行政轿车', cat: '庭院', price: 720, art: 'car', color: 'cream', tip: '可替换3D庭院汽车车漆', is3d: true, slot: 'garden_car', area: 'balcony', variant: 'pearl' },
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
  const cats = ['全部', ...new Set(items.filter(item => item.is3d).map(item => item.cat))];
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
  let house3d = null;
  let shop3dViewer = null;
  let preview3dId = '';
  let house3dFrame = 0;
  let house3dLastFrame = 0;
  let house3dPointer = null;
  let house3dObserver = null;
  let houseAmbience = { tone: 'day', weather: 'sunny', daylight: 1 };

  function load() { try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); return { profileId: saved.profileId || '', roleId: saved.roleId || '', homes: saved.homes || {} }; } catch { return { profileId: '', roleId: '', homes: {} }; } }
  function save() { localStorage.setItem(key, JSON.stringify(state)); }
  function read(name, fallback) { try { const value = JSON.parse(localStorage.getItem(name) || 'null'); return value ?? fallback; } catch { return fallback; } }
  function chat() { const value = read(chatKey, {}); return { profiles: Array.isArray(value.profiles) ? value.profiles : [], contacts: Array.isArray(value.contacts) ? value.contacts : [], chats: value.chats || {} }; }
  function user() { const list = chat().profiles; if (!state.profileId || !list.some(item => item.id === state.profileId)) state.profileId = list[0]?.id || ''; return list.find(item => item.id === state.profileId) || null; }
  function roles() { return chat().contacts; }
  function character() { const list = roles(); if (!state.roleId || !list.some(item => item.id === state.roleId)) state.roleId = list[0]?.id || ''; return list.find(item => item.id === state.roleId) || null; }
  function home() { const id = user()?.id || 'guest'; state.homes[id] ||= { coins: 120, owned: [], placed: [], work: { user: null, role: null }, history: [] }; const data = state.homes[id]; data.owned ||= []; data.equipped3d ||= {}; data.work ||= { user: null, role: null }; data.history ||= []; data.customJobs ||= []; data.workConfig ||= { timeRate: 1, rewardRate: 1 }; data.roomStyle ||= { wall: 'cream', floor: 'wood' }; data.areas ||= { living: { placed: data.placed || [], roomStyle: data.roomStyle } }; areas.forEach((entry, index) => { data.areas[entry.id] ||= { placed: [], roomStyle: { wall: 'cream', floor: index === 1 ? 'cream' : 'wood' } }; data.areas[entry.id].placed ||= []; data.areas[entry.id].roomStyle ||= { wall: 'cream', floor: 'wood' }; data.areas[entry.id].placed = data.areas[entry.id].placed.map((itemEntry, itemIndex) => { if (Number.isFinite(Number(itemEntry.x)) && Number.isFinite(Number(itemEntry.y))) return { ...itemEntry, rotation: Number(itemEntry.rotation) || 0 }; const slot = Number(itemEntry.slot); return { ...itemEntry, x: 22 + ((Number.isFinite(slot) ? slot : itemIndex) % 3) * 28, y: 25 + (Math.floor((Number.isFinite(slot) ? slot : itemIndex) / 3) % 3) * 25, rotation: 0 }; }); }); return data; }
  function areaData() { const data = home(); return data.areas[activeArea] || data.areas.living; }
  function userName() { const item = user(); return item?.nickname || item?.realName || item?.name || '我'; }
  function roleName() { const item = character(); return item?.nickname || item?.name || 'Ta'; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function avatar(item, fallback) { return item?.avatar ? `<img src="${esc(item.avatar)}" alt="">` : esc((item?.nickname || item?.name || fallback || '家').slice(0, 1)); }
  function uid() { return `house-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
  function item(id) { return items.find(entry => entry.id === id); }
  function owned(id) { return home().owned.filter(entry => entry.itemId === id).length; }
  function placed(id) { return areaData().placed.some(entry => entry.ownedId === id); }
  const slotNames = { living_sofa: '3D客厅沙发位', living_tv: '3D客厅电视位', kitchen_fridge: '3D厨房冰箱位', bedroom_bed: '3D卧室床位', bedroom_wardrobe: '3D卧室衣柜位', bedroom_vanity: '3D卧室梳妆台位', study_bookshelf: '3D书房书架位', bay_lounge: '3D会客厅家具位', bathroom_set: '3D浴室套装位', garden_car: '3D庭院停车位' };
  function placedAnywhere(id) { return Object.values(home().equipped3d || {}).includes(id) || Object.values(home().areas).some(area => area.placed.some(entry => entry.ownedId === id)); }
  function areaFor(id) { const slot = Object.entries(home().equipped3d || {}).find(([, ownedId]) => ownedId === id)?.[0]; if (slot) return slotNames[slot] || '3D小家'; const found = areas.find(area => home().areas[area.id]?.placed.some(entry => entry.ownedId === id)); return found?.name || ''; }
  function workJobs(actor = '') { const list = (home().customJobs || []).filter(entry => entry.source === 'api'); return actor ? list.filter(entry => entry.actor === actor) : list; }
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
      car: '<path d="M7 29h34l-2-9-7-6H18l-7 6zM11 29v5h4m18 0h4v-5M15 21h18M20 15l-3 6m11-6 4 6"/><circle cx="15" cy="31" r="4"/><circle cx="34" cy="31" r="4"/>',
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
      car: '<path d="M8 28h32l-2-7-6-5H18l-6 5z"/>',
      vase: '<path d="M19 24v11c0 4 3 5 5 5s5-1 5-5V24z"/>',
      clock: '<circle cx="24" cy="24" r="12"/>',
      plush: ''
    };
    const colors = { pink: '#e9a7aa', peach: '#efb38e', wood: '#c99a69', yellow: '#f0c86f', green: '#91c69d', cream: '#e8cda9', blue: '#9ebfdf', purple: '#b9a5d6' };
    return `<svg viewBox="0 0 48 48" aria-hidden="true" style="--house-art-fill:${colors[tone] || '#e8b0a8'}"><g fill="var(--house-art-fill)" opacity=".92">${fills[kind] || fills.picture}</g><g fill="none">${paths[kind] || paths.picture}</g></svg>`;
  }
  function furnitureScale(info) { return itemScales[info?.id] || furnitureScales[info?.art] || 1; }
  function createShopPreviewModel(id, THREE) {
    const group = new THREE.Group();
    const material = (color, roughness = .72, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const palette = {
      cream: material(0xe9e1d7, .9), mauve: material(0x8f818d, .92), rose: material(0xb98591, .9),
      lavender: material(0xaaa0ad, .9), wood: material(0xa98772, .78), darkWood: material(0x80665b, .8),
      trim: material(0xf2eee8, .82), metal: material(0x9b938e, .38, .55), tire: material(0x29272a, .96),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x9aa0a5, transparent: true, opacity: .48, roughness: .12, metalness: .05 }),
      carPurple: new THREE.MeshPhysicalMaterial({ color: 0x625a65, roughness: .3, metalness: .08, clearcoat: .78, clearcoatRoughness: .2 }),
      carPearl: new THREE.MeshPhysicalMaterial({ color: 0xd9d4ce, roughness: .27, metalness: .08, clearcoat: .86, clearcoatRoughness: .18 })
    };
    const add = (geometry, mat, position, name = '') => { const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh; };
    const box = (size, position, mat, name = '') => add(new THREE.BoxGeometry(...size, 2, 2, 2), mat, position, name);
    const cyl = (radius, height, position, mat, rotation = [0, 0, 0], segments = 24) => { const mesh = add(new THREE.CylinderGeometry(radius, radius, height, segments), mat, position); mesh.rotation.set(...rotation); return mesh; };
    const legSet = (w, d, y, mat) => { for (const x of [-1, 1]) for (const z of [-1, 1]) box([.1, .48, .1], [x * (w / 2 - .16), y, z * (d / 2 - .13)], mat); };
    const sofa = id.includes('mauve');
    if (id.startsWith('3d-sofa')) {
      const body = sofa ? palette.mauve : palette.cream, accent = sofa ? palette.lavender : palette.trim;
      box([3.2, .48, 1.12], [0, .55, 0], body); legSet(3.1, 1.05, .24, palette.darkWood);
      if (sofa) {
        for (const x of [-1.05, -.35, .35, 1.05]) box([.62, 1.05, .28], [x, 1.14, -.43], body);
        for (const x of [-.78, .78]) box([1.38, .18, .83], [x, .87, .08], accent);
        for (const x of [-1.48, 1.48]) box([.28, .78, 1.08], [x, .83, 0], body);
      } else {
        box([2.92, .86, .28], [0, 1.06, -.42], body);
        for (const x of [-.98, 0, .98]) { const cushion = box([.86, .2, .82], [x, .88, .06], accent); cushion.rotation.y = x * -.025; }
        for (const x of [-1.5, 1.5]) { const arm = cyl(.36, 1.08, [x, .82, 0], body, [Math.PI / 2, 0, 0]); arm.scale.x = .82; }
      }
    } else if (id.startsWith('3d-bed')) {
      const wing = id.includes('lavender'), fabric = wing ? palette.lavender : palette.rose;
      box([2.75, .34, 3.25], [0, .42, .15], palette.darkWood); box([2.58, .34, 3.05], [0, .7, .15], palette.trim);
      box([2.55, .16, 2.02], [0, .92, .52], fabric); for (const x of [-.66, .66]) box([1.05, .22, .68], [x, 1.01, -.83], palette.cream);
      if (wing) {
        box([2.65, 1.62, .24], [0, 1.36, -1.35], fabric);
        for (const x of [-1.42, 1.42]) { const side = box([.28, 1.52, .52], [x, 1.31, -1.18], fabric); side.rotation.y = x < 0 ? -.2 : .2; }
        for (const x of [-.8, 0, .8]) box([.045, 1.28, .27], [x, 1.36, -1.2], palette.trim);
      } else {
        box([2.72, 1.15, .24], [0, 1.17, -1.36], fabric); cyl(1.36, .24, [0, 1.73, -1.36], fabric, [Math.PI / 2, 0, 0], 36);
        for (const x of [-.75, .75]) cyl(.055, .28, [x, 1.32, -1.2], palette.trim, [Math.PI / 2, 0, 0], 12);
      }
    } else if (id.startsWith('3d-wardrobe')) {
      const panelled = id.includes('mauve'), body = panelled ? palette.mauve : palette.cream, trim = panelled ? palette.trim : palette.wood;
      box([2.1, 3.15, .82], [0, 1.62, 0], body); box([2.3, .16, 1.0], [0, 3.24, 0], trim); box([2.2, .12, .92], [0, .08, 0], trim);
      for (const x of [-.53, .53]) { box([.94, 2.72, .055], [x, 1.65, .44], body); box([.75, panelled ? .72 : 1.95, .075], [x, panelled ? 2.05 : 1.7, .49], trim); cyl(.045, .16, [x > 0 ? .12 : -.12, 1.52, .54], palette.metal); }
      if (panelled) for (const x of [-.53, .53]) box([.74, .82, .075], [x, .9, .49], palette.trim);
      else { const crown = add(new THREE.TorusGeometry(1.03, .1, 8, 32, Math.PI), trim, [0, 3.2, .02]); crown.rotation.z = Math.PI; crown.scale.y = .42; }
      legSet(1.95, .72, -.16, trim);
    } else if (id.startsWith('3d-shelf')) {
      const arched = id.includes('cream'), body = arched ? palette.cream : palette.wood, accent = arched ? palette.rose : palette.trim;
      box([2.15, 3.0, .42], [0, 1.52, -.25], body); for (const x of [-1.02, 1.02]) box([.16, 3.08, .78], [x, 1.54, 0], body);
      for (const y of arched ? [.16, .78, 1.42, 2.06, 2.7] : [.14, .74, 1.38, 2.04, 2.72]) box([2.2, .13, .75], [0, y, 0], arched ? palette.trim : body);
      if (arched) { const crown = add(new THREE.TorusGeometry(1.02, .12, 8, 32, Math.PI), body, [0, 2.97, 0]); crown.rotation.z = Math.PI; crown.scale.y = .56; box([1.9, .58, .06], [0, .43, .42], accent); }
      else box([2.38, .2, .9], [0, 3.12, 0], palette.darkWood);
      const colors = [palette.rose, palette.lavender, palette.trim, palette.darkWood];
      for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) box([.18 + (col % 2) * .05, .34 + (col % 3) * .06, .25], [-.76 + col * .3, .38 + row * .64, .28], colors[(row + col) % colors.length]);
    } else if (id.startsWith('3d-tv')) {
      const gallery = id.includes('gallery'), frame = gallery ? palette.wood : palette.metal;
      box([3.25, 1.82, .18], [0, 1.25, 0], frame); box([3.02, 1.6, .06], [0, 1.25, .12], palette.glass);
      if (gallery) { box([3.42, .1, .3], [0, .3, 0], palette.darkWood); for (const x of [-1.2, 1.2]) box([.1, .55, .1], [x, .55, 0], palette.darkWood); }
      else { box([2.25, .16, .68], [0, .24, 0], palette.mauve); box([.16, .72, .16], [0, .66, 0], palette.metal); for (const x of [-1.88, 1.88]) { box([.34, 1.28, .3], [x, .72, 0], palette.darkWood); for (const y of [.42, .95]) cyl(.1, .06, [x, y, .18], palette.metal, [Math.PI / 2, 0, 0]); } }
    } else if (id.startsWith('3d-fridge')) {
      const retro = id.includes('mauve'), body = retro ? palette.mauve : palette.cream;
      box([2.15, 3.25, 1.25], [0, 1.65, 0], body); box([2.22, .14, 1.3], [0, 3.3, 0], retro ? palette.trim : palette.metal);
      if (retro) { box([1.95, 1.9, .06], [0, 2.18, .66], body); box([1.95, 1.02, .06], [0, .68, .66], body); for (const y of [.72, 2.15]) box([.1, .72, .1], [.65, y, .75], palette.metal); }
      else { for (const x of [-.52, .52]) { box([.98, 2.08, .06], [x, 2.12, .66], body); box([.08, 1.0, .09], [x < 0 ? -.1 : .1, 2.05, .75], palette.metal); } box([2.02, .88, .06], [0, .56, .66], body); box([.72, .06, .08], [0, .8, .75], palette.metal); }
    } else if (id.startsWith('3d-vanity')) {
      const folding = id.includes('cream'), body = folding ? palette.cream : palette.rose;
      box([2.65, .18, .82], [0, .88, 0], body); for (const x of [-1.05, 1.05]) box([.14, .86, .14], [x, .43, 0], palette.wood);
      for (const x of [-.72, 0, .72]) box([.72, .48, .68], [x, .6, 0], body);
      if (folding) { for (const x of [-.75, 0, .75]) { const mirror = box([x ? .66 : .78, 1.3, .08], [x, 1.72, -.32], palette.trim); if (x) mirror.rotation.y = x < 0 ? .25 : -.25; } }
      else { const mirror = add(new THREE.TorusGeometry(.72, .1, 10, 42), palette.trim, [0, 1.75, -.32]); mirror.scale.y = 1.22; box([1.16, 1.4, .04], [0, 1.75, -.31], palette.glass); }
      box([1.05, .18, .58], [0, .25, 1.05], palette.trim); for (const x of [-.4, .4]) box([.09, .38, .09], [x, .08, 1.05], palette.wood);
    } else if (id.startsWith('3d-lounge')) {
      const club = id.includes('club');
      if (club) { for (const x of [-1.05, 1.05]) { box([1.2, .42, 1.0], [x, .5, 0], palette.mauve); box([1.08, .88, .22], [x, 1.05, -.38], palette.mauve); for (const side of [-.52, .52]) box([.2, .62, .94], [x + side, .72, 0], palette.mauve); } }
      else { for (const x of [-1.1, 0, 1.1]) { const seat = box([1.18, .45, .92], [x, .48, Math.abs(x) * .13], palette.rose); seat.rotation.y = -x * .15; const back = box([1.12, .78, .2], [x, .98, -.34 + Math.abs(x) * .13], palette.rose); back.rotation.y = -x * .15; } }
      cyl(.62, .1, [0, .72, 1.28], palette.wood, [0, 0, 0], 36); cyl(.08, .62, [0, .4, 1.28], palette.metal);
    } else if (id.startsWith('3d-bath')) {
      const inset = id.includes('rose'), tub = inset ? palette.rose : palette.cream;
      box([2.7, .72, 1.45], [0, .58, 0], tub); box([2.25, .08, 1.05], [0, .98, 0], palette.glass);
      for (const [x, z] of [[-1.22, -.62], [-1.22, .62], [1.22, -.62], [1.22, .62]]) cyl(.1, inset ? .18 : .38, [x, inset ? .15 : .12, z], palette.metal);
      box([1.15, .18, .72], [2.1, .92, -.15], palette.trim); box([.82, 1.2, .5], [2.1, .3, -.15], inset ? palette.rose : palette.wood);
      box([.72, .5, .78], [-2.05, .42, .1], palette.cream); cyl(.42, .45, [-2.05, .25, .42], palette.cream, [0, 0, 0], 28);
    } else {
      const pearl = id.includes('pearl'), paint = pearl ? palette.carPearl : palette.carPurple;
      box([4.65, .62, 1.72], [0, .72, 0], paint); box([1.62, .35, 1.66], [-1.42, 1.08, 0], paint); box([1.0, .34, 1.68], [1.82, 1.0, 0], paint);
      const cabin = box([2.25, .74, 1.5], [.35, 1.34, 0], palette.glass); cabin.scale.x = .96;
      for (const x of [-1.42, 1.42]) for (const z of [-.88, .88]) { const wheel = cyl(.43, .28, [x, .48, z], palette.tire, [Math.PI / 2, 0, 0], 32); cyl(.25, .3, [x, .48, z], palette.metal, [Math.PI / 2, 0, 0], pearl ? 12 : 18); }
      for (const z of [-.62, -.31, 0, .31, .62]) box([.1, .48, .035], [-2.36, .76, z], palette.metal);
      for (const z of [-.58, .58]) box([.08, .18, .46], [-2.39, .94, z], palette.trim);
      for (const x of [-.45, .65]) box([.045, .72, 1.58], [x, 1.28, 0], palette.metal);
      if (pearl) { box([2.0, .08, 1.74], [.55, .72, 0], palette.metal); box([.12, .16, .12], [-2.02, 1.28, 0], palette.metal); }
    }
    group.rotation.y = id.startsWith('3d-car') ? -.5 : -.48;
    return group;
  }
  function initShop3dPreviews() {
    const canvases = [...app.querySelectorAll('canvas[data-house-model-preview]')];
    const THREE = window.THREE;
    if (!canvases.length || !THREE) return;
    const source = document.createElement('canvas');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: source, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }); } catch { return; }
    renderer.setPixelRatio(1); renderer.setSize(280, 190, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvases.forEach(canvas => {
      const scene = new THREE.Scene();
      try {
        scene.background = new THREE.Color(0xf7f3f1);
        const camera = new THREE.PerspectiveCamera(32, 280 / 190, .1, 100);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8d7e83, 2.4));
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.2); keyLight.position.set(-4, 7, 5); keyLight.castShadow = true; scene.add(keyLight);
        const model = createShopPreviewModel(canvas.dataset.houseModelPreview, THREE); scene.add(model);
        const bounds = new THREE.Box3().setFromObject(model), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
        model.position.sub(center); const radius = Math.max(size.x, size.y, size.z); camera.position.set(radius * 1.55, radius * 1.12, radius * 1.8); camera.lookAt(0, 0, 0);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.2, 48), new THREE.MeshStandardMaterial({ color: 0xeee8e5, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -size.y / 2 - .03; floor.receiveShadow = true; scene.add(floor);
        renderer.render(scene, camera); canvas.width = 280; canvas.height = 190;
        const context = canvas.getContext('2d'); context?.drawImage(source, 0, 0);
        const sample = context?.getImageData(140, 95, 1, 1).data;
        if (sample?.[3]) canvas.classList.add('is-ready');
      } catch (error) { console.warn('3D furniture preview unavailable', error); }
      scene.traverse(object => { if (object.isMesh) { object.geometry?.dispose?.(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(mat => mat?.dispose?.()); } });
    });
    renderer.dispose();
  }
  function shopPreviewSheet() {
    const info = item(preview3dId);
    if (!info?.is3d) return '';
    return `<div class="house-3d-preview-layer"><div class="house-3d-preview-backdrop" data-house-preview-close></div><section role="dialog" aria-modal="true" aria-label="${esc(info.name)}3D预览"><header><div><small>360° FURNITURE PREVIEW</small><b>${esc(info.name)}</b></div><button data-house-preview-close type="button" aria-label="关闭">×</button></header><div class="house-3d-preview-stage"><canvas data-house-preview-canvas></canvas><div class="house-3d-preview-unavailable">当前浏览器暂时无法显示3D预览</div></div><footer><span>单指拖动旋转 · 双指缩放</span><strong>${info.price}<small> 家币</small></strong></footer></section></div>`;
  }
  function openShop3dPreview(id) {
    if (!item(id)?.is3d) return;
    shop3dViewer?.destroy?.(); app.querySelector('.house-3d-preview-layer')?.remove(); preview3dId = id;
    app.insertAdjacentHTML('beforeend', shopPreviewSheet()); requestAnimationFrame(initShop3dViewer);
  }
  function closeShop3dPreview() {
    shop3dViewer?.destroy?.(); preview3dId = ''; app.querySelector('.house-3d-preview-layer')?.remove();
  }
  function initShop3dViewer() {
    const canvas = app.querySelector('[data-house-preview-canvas]'), stage = canvas?.parentElement, THREE = window.THREE;
    if (!canvas || !stage || !THREE || shop3dViewer) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { stage.classList.add('is-unavailable'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf5f1ef);
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); scene.add(new THREE.HemisphereLight(0xffffff, 0x81747b, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.4); keyLight.position.set(-5, 8, 6); keyLight.castShadow = true; scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd8c9d3, 1.1); fillLight.position.set(5, 3, -4); scene.add(fillLight);
    const model = createShopPreviewModel(preview3dId, THREE); model.rotation.y = 0; scene.add(model);
    const bounds = new THREE.Box3().setFromObject(model), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3()); model.position.sub(center);
    const radius = Math.max(size.x, size.y, size.z), floor = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.25, 64), new THREE.MeshStandardMaterial({ color: 0xe9e3e0, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -size.y / 2 - .04; floor.receiveShadow = true; scene.add(floor);
    let yaw = .68, pitch = 1.02, distance = radius * 2.55, animationFrame = 0, dirty = true, lastPinch = 0; const pointers = new Map();
    const updateCamera = () => { camera.position.set(distance * Math.sin(pitch) * Math.sin(yaw), distance * Math.cos(pitch), distance * Math.sin(pitch) * Math.cos(yaw)); camera.lookAt(0, 0, 0); };
    const resize = () => { if (!stage.isConnected) return; const width = stage.clientWidth, height = stage.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); dirty = true; };
    const loop = () => { if (!shop3dViewer) return; animationFrame = requestAnimationFrame(loop); if (!dirty) return; dirty = false; updateCamera(); renderer.render(scene, camera); };
    const pointerDown = event => { pointers.set(event.pointerId, { x:event.clientX, y:event.clientY }); canvas.setPointerCapture?.(event.pointerId); };
    const pointerMove = event => { const previous = pointers.get(event.pointerId); if (!previous) return; pointers.set(event.pointerId, { x:event.clientX, y:event.clientY }); const points = [...pointers.values()]; if (points.length === 1) { yaw -= (event.clientX - previous.x) * .011; pitch = Math.max(.18, Math.min(1.52, pitch + (event.clientY - previous.y) * .009)); } else { const pinch = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); if (lastPinch) distance = Math.max(radius * 1.35, Math.min(radius * 4.5, distance - (pinch - lastPinch) * .018)); lastPinch = pinch; } dirty = true; event.preventDefault(); };
    const pointerEnd = event => { pointers.delete(event.pointerId); if (pointers.size < 2) lastPinch = 0; };
    const wheel = event => { event.preventDefault(); distance = Math.max(radius * 1.35, Math.min(radius * 4.5, distance + event.deltaY * .008)); dirty = true; };
    canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerup', pointerEnd); canvas.addEventListener('pointercancel', pointerEnd); canvas.addEventListener('wheel', wheel, { passive:false }); window.addEventListener('resize', resize);
    shop3dViewer = { destroy(){ cancelAnimationFrame(animationFrame); window.removeEventListener('resize', resize); scene.traverse(object => { if (!object.isMesh) return; object.geometry?.dispose?.(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(material => material?.dispose?.()); }); renderer.dispose(); shop3dViewer = null; } };
    resize(); loop();
  }
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
  function roomLegacy() { const data = home(); const roomData = areaData(); const area = areas.find(entry => entry.id === activeArea) || areas[0]; const placedMarkup = roomData.placed.map(entry => { const ownedItem = data.owned.find(candidate => candidate.id === entry.ownedId); const info = item(ownedItem?.itemId); if (!info) return ''; return `<button class="house-furniture ${selectedFurnitureId === entry.ownedId ? 'selected' : ''}" data-house-furniture="${entry.ownedId}" type="button" style="--house-scale:${furnitureScale(info)};left:${entry.x}%;top:${entry.y}%;transform:translate(-50%,-50%) rotate(${entry.rotation || 0}deg)">${art(info.art, ownedItem?.tone || info.color)}</button>`; }).join(''); const selected = roomData.placed.find(entry => entry.ownedId === selectedFurnitureId); const selectedItem = selected && data.owned.find(entry => entry.id === selected.ownedId); const selectedInfo = item(selectedItem?.itemId); return `<section class="house-room-card"><nav class="house-area-tabs">${areas.map(entry => `<button class="${entry.id === activeArea ? 'active' : ''}" data-house-area="${entry.id}" type="button"><b>${entry.name}</b><small>${entry.sub}</small></button>`).join('')}</nav><div class="house-card-title"><div><span>${area.name.toUpperCase()} · DRAG TO DECORATE</span><h2>${area.name}</h2></div><button class="house-style-button" data-house-style-open type="button">✦</button><small>${roomData.placed.length} 件家具</small></div><div class="house-room" data-house-room data-house-wall="${roomData.roomStyle.wall}" data-house-floor="${roomData.roomStyle.floor}">${placedMarkup}<span class="house-room-window">☼</span><span class="house-room-rug-mark">⌁</span></div>${selectedInfo ? `<div class="house-room-tools"><span><b>已选中家具</b><small>拖动改变位置</small></span><button data-house-rotate="-15" type="button">↶</button><button data-house-rotate="15" type="button">↷</button><button data-house-remove="${selectedFurnitureId}" type="button">收回</button></div>` : '<p>点击家具后拖动位置，或用下方仓库把新家具摆进来。</p>'}${roomSettings()}</section>`; }
  function room() { return `<section class="house-room-card house-3d-card"><iframe class="house-villa-frame" src="villa-3d/index.html?v=20260905-32" title="Cherry Conservatory Cottage 3D 小家" loading="eager"></iframe></section>`; }
  function history() { const list = home().history; return `<section class="house-history"><div class="house-card-title"><div><span>LITTLE MOMENTS</span><h2>最近发生</h2></div></div>${list.length ? list.slice(0, 3).map(entry => `<article><i>✦</i><span><b>${esc(entry.text)}</b><small>${esc(entry.time)}　+${entry.coins} 家币</small></span></article>`).join('') : '<p>你们的第一笔家币，会从一次小小的工作开始。</p>'}</section>`; }
  function roomPage() { return `${top('家', '')}${room()}`; }
  function dyeSheet() { if (!dyeId) return ''; const ownedItem = home().owned.find(entry => entry.id === dyeId); const info = item(ownedItem?.itemId); if (!ownedItem || !info) return ''; const currentTone = ownedItem.tone || info.color; return `<div class="house-dye-picker"><div data-house-dye-close></div><section><header><div><span>FURNITURE COLOR</span><b>给${esc(info.name)}换个颜色</b><small>颜色会保存到这件家具</small></div><button data-house-dye-close type="button">×</button></header><div class="house-dye-preview">${art(info.art, currentTone)}<span>${esc(info.name)}</span></div><div class="house-dye-colors">${dyeColors.map(choice => `<button class="${currentTone === choice.id ? 'active' : ''}" data-house-dye-color="${choice.id}" type="button"><i style="background:${choice.hex}"></i><span>${choice.name}</span></button>`).join('')}</div></section></div>`; }
  function worker(actor, label, person) { if (activeWork(actor)) { const task = activeWork(actor); const job = workJobs().find(entry => entry.id === task.jobId); const left = timeLeft(task); const duration = Number(task.duration || jobTime(job)); const progress = Math.min(100, Math.max(2, 100 - left / duration * 100)); return `<article class="house-worker working" data-house-worker="${actor}"><div class="house-worker-title"><i>${avatar(person, actor === 'role' ? 'Ta' : '我')}</i><span><small>${label}</small><b>${esc(actor === 'role' ? roleName() : userName())}</b></span><em>工作中</em></div><p data-house-work-status>${esc(job.name)}　·　还剩 ${left} 秒</p><div class="house-progress"><i data-house-work-progress style="width:${progress}%"></i></div></article>`; }
    const jobs = workJobs(actor); return `<article class="house-worker" data-house-worker="${actor}"><div class="house-worker-title"><i>${avatar(person, actor === 'role' ? 'Ta' : '我')}</i><span><small>${label}的专属工作</small><b>${esc(actor === 'role' ? roleName() : userName())}</b></span></div><div class="house-work-options">${jobs.map(job => `<button data-house-work="${actor}" data-house-job="${job.id}" type="button"><span>${esc(job.name)}</span><small>+${jobReward(job)} · ${jobTime(job)}s</small></button>`).join('')}</div></article>`; }
  function workSettings() { const config = workConfig(); return `<section class="house-work-settings"><div class="house-work-settings-head"><div><span>SMART JOBS</span><b>分别定制专属工作</b><small>用户设定 + 角色设定</small></div><button data-house-scan-jobs type="button" ${scanningJobs ? 'disabled' : ''}><i>✦</i>${scanningJobs ? '扫描中…' : '扫描设定'}</button></div><div class="house-work-scan-note"><i>⌁</i><span>分别检索两个人的职业、身份、技能和长处，生成各自不同的工作。</span></div><div class="house-work-tuning"><div class="house-slider-row"><label><span>工作时长</span><b data-house-time-label>${Math.round(config.timeRate * 100)}%</b></label><input type="range" min=".5" max="2" step=".1" value="${config.timeRate}" data-house-time-rate></div><div class="house-slider-row"><label><span>薪资倍率</span><b data-house-reward-label>${Math.round(config.rewardRate * 100)}%</b></label><input type="range" min=".5" max="2" step=".1" value="${config.rewardRate}" data-house-reward-rate></div></div></section>`; }
  function jobCatalog(actor, title, name) { const list = workJobs(actor); if (!list.length) return ''; return `<section class="house-job-catalog"><div class="house-card-title"><div><span>${title} · ${list.length} 项</span><h2>${esc(name)}的工作</h2></div></div>${list.map(job => `<article><div class="house-job-icon">${art(job.art || 'picture')}</div><span><b>${esc(job.name)}</b><small>${esc(job.detail || '一份根据设定生成的工作')}</small>${job.fit ? `<em>✦ ${esc(job.fit)}</em>` : ''}</span><strong>+${jobReward(job)}</strong></article>`).join('')}</section>`; }
  function workPage() { const hasAssignedJobs = workJobs('user').length || workJobs('role').length; const catalog = hasAssignedJobs ? `${jobCatalog('user', 'USER JOBS', userName())}${jobCatalog('role', 'CHARACTER JOBS', roleName())}` : '<section class="house-empty-card house-work-empty"><i>✦</i><h2>还没有专属工作</h2><p>点击上方“扫描设定”，API 会分别读取用户和角色的职业、技能与长处。</p></section>'; return `${top('打工', '每一份小小的努力，都会变成家里的新角落。')}${coins()}<section class="house-work-note"><span>WORK TOGETHER</span><h2>今天谁来上班？</h2><p>两个人拥有各自的专属工作，也可以同时工作，家币进入共同账户。</p></section>${workSettings()}<section class="house-workers">${worker('user', '用户', user())}${character() ? worker('role', '角色', character()) : '<p class="house-empty">还没有角色，请先在聊天 App 创建一个角色。</p>'}</section>${catalog}`; }
  function shopPage() { const available = items.filter(entry => entry.is3d); const list = cat === '全部' ? available : available.filter(entry => entry.cat === cat); return `${top('家具商城', '点击家具可以360°查看，购买后在仓库应用到3D小家。')}${coins()}<nav class="house-cats">${cats.map(name => `<button class="${cat === name ? 'active' : ''}" data-house-cat="${esc(name)}" type="button">${esc(name)}</button>`).join('')}</nav><section class="house-products">${list.map(info => `<article class="house-product ${info.color} is-3d" data-house-preview-id="${info.id}"><button class="house-product-art" type="button" aria-label="360度查看${esc(info.name)}"><span class="house-3d-badge">3D</span><span class="house-product-preview-fallback">${art(info.art, info.color)}</span><canvas class="house-product-3d-preview" data-house-model-preview="${info.id}"></canvas><em>360° 查看</em></button><div class="house-product-body"><small>${esc(info.cat)} · 立体家具</small><b>${esc(info.name)}</b><p>${esc(info.tip)}</p><footer><strong>${info.price}<i> 家币</i></strong><button data-house-buy="${info.id}" type="button" ${home().coins < info.price ? 'disabled' : ''}>${home().coins < info.price ? '不足' : '买下'}</button></footer></div></article>`).join('')}</section>`; }
  function storagePage() { const data = home(); const placedTotal = Object.values(data.areas).reduce((sum, area) => sum + area.placed.length, 0) + Object.keys(data.equipped3d || {}).length; return `${top('仓库', '购买的3D家具可以直接替换小家中的固定位置。')}${coins()}<div class="house-storage-summary"><span>MY FURNITURE</span><b>${data.owned.length} 件　·　已用 ${placedTotal} 件</b></div><section class="house-storage">${data.owned.length ? data.owned.slice().reverse().map(entry => { const info = item(entry.itemId); const isPlaced = placedAnywhere(entry.id); const refund = Math.floor((info?.price || 0) * .6); const actionText = isPlaced ? '收回' : info?.is3d ? '应用到3D小家' : '选择区域摆入'; return `<article class="house-storage-item ${info?.is3d ? 'is-3d' : ''}"><div>${info?.is3d ? '<span class="house-3d-badge">3D</span>' : ''}${art(info?.art, entry.tone || info?.color)}</div><span><b>${esc(info?.name || '家具')}</b><small>${esc(info?.cat || '')} · ${isPlaced ? `已放在${areaFor(entry.id)}` : info?.is3d ? `适用于${slotNames[info.slot] || '3D小家'}` : '仓库中'}</small></span><div class="house-storage-actions"><button data-house-dye="${entry.id}" type="button">染色</button><button data-house-${isPlaced ? 'remove' : 'place'}="${entry.id}" type="button" ${!isPlaced && !info?.is3d && data.areas[activeArea].placed.length >= maxFurniturePerArea ? 'disabled' : ''}>${actionText}</button><button class="recycle" data-house-recycle="${entry.id}" type="button">回收 +${refund}</button></div></article>`; }).join('') : '<div class="house-empty-card"><i>⌂</i><h2>仓库还是空的</h2><p>去商城挑一件喜欢的3D家具吧。</p><button data-house-page="shop" type="button">去商城</button></div>'}</section>`; }
  function placementSheet() { if (!placementPickerId) return ''; const entry = home().owned.find(itemEntry => itemEntry.id === placementPickerId); const info = item(entry?.itemId); if (!entry || !info) return ''; if (info.is3d) return `<div class="house-placement-picker"><div data-house-placement-close></div><section><header><div><span>3D FURNITURE</span><b>应用到3D小家</b></div><button data-house-placement-close type="button">×</button></header><div class="house-placement-item">${art(info.art, entry.tone || info.color)}<span><b>${esc(info.name)}</b><small>将替换${esc(slotNames[info.slot] || '对应家具位置')}</small></span></div><div class="house-placement-list"><button data-house-equip-model="${entry.id}" type="button"><i>3D</i><span><b>${esc(slotNames[info.slot] || '3D小家')}</b><small>固定槽位替换，不会穿墙或挡住通道</small></span><em>应用 ›</em></button></div></section></div>`; return `<div class="house-placement-picker"><div data-house-placement-close></div><section><header><div><span>PLACE FURNITURE</span><b>把家具放在哪里？</b></div><button data-house-placement-close type="button">×</button></header><div class="house-placement-item">${art(info.art, entry.tone || info.color)}<span><b>${esc(info.name)}</b><small>选择一个区域后即可摆入</small></span></div><div class="house-placement-list">${areas.map(area => { const roomData = home().areas[area.id]; const full = roomData.placed.length >= maxFurniturePerArea; const icons = { living: '⌂', dining: '◌', bedroom: '☾', study: '✎', balcony: '☼', bathroom: '♧' }; return `<button data-house-place-area="${area.id}" type="button" ${full ? 'disabled' : ''}><i>${icons[area.id] || '⌂'}</i><span><b>${area.name}</b><small>${area.sub} · ${roomData.placed.length}/${maxFurniturePerArea}</small></span><em>${full ? '已满' : '放入 ›'}</em></button>`; }).join('')}</div></section></div>`; }
  function picker() { if (!sheet) return ''; const list = sheet === 'profile' ? chat().profiles : roles(); return `<div class="house-picker"><div data-house-picker-close></div><section><header><span>CHOOSE ONE</span><button data-house-picker-close type="button">×</button></header><h2>选择${sheet === 'profile' ? '用户' : '角色'}</h2>${list.length ? list.map(entry => `<button data-house-select="${sheet}" data-house-id="${esc(entry.id)}" type="button"><i>${avatar(entry, sheet === 'profile' ? '我' : 'Ta')}</i><span><b>${esc(entry.nickname || entry.realName || entry.name || '未命名')}</b><small>${esc(entry.identity || '设定')}</small></span><em>${entry.id === (sheet === 'profile' ? state.profileId : state.roleId) ? '✓' : '›'}</em></button>`).join('') : '<p class="house-empty">还没有可选择的对象。</p>'}</section></div>`; }
  function nav() { return `<nav class="house-nav" data-house-tone="${houseAmbience.tone}" data-house-weather="${houseAmbience.weather}" style="--house-dock-daylight:${houseAmbience.daylight}"><button class="${page === 'room' ? 'active' : ''}" data-house-page="room" type="button"><b>⌂</b><small>小家</small></button><button class="${page === 'work' ? 'active' : ''}" data-house-page="work" type="button"><b>✦</b><small>打工</small></button><button class="${page === 'shop' ? 'active' : ''}" data-house-page="shop" type="button"><b>◇</b><small>商城</small></button><button class="${page === 'storage' ? 'active' : ''}" data-house-page="storage" type="button"><b>▦</b><small>仓库</small></button></nav>`; }
  function initThreeHome() {
    const stage = app.querySelector('[data-house-3d-stage]'); const THREE = window.THREE;
    if (!stage || !THREE || house3d) return;
    const canvas = stage.querySelector('canvas'); const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    const lowPower = matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.hardwareConcurrency <= 4 || (navigator.deviceMemory && navigator.deviceMemory <= 3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.35)); renderer.setSize(stage.clientWidth, stage.clientHeight, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = !lowPower; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / Math.max(1, stage.clientHeight), .1, 100); camera.position.set(14, 14, 18);
    const target = new THREE.Vector3(0, 1.1, 0); let distance = 26; let yaw = Math.PI; let pitch = .78;
    const ambient = new THREE.HemisphereLight(0xfff5f1, 0x7c6872, lowPower ? 1.35 : 1.65); scene.add(ambient);
    if (!lowPower) { const light = new THREE.DirectionalLight(0xffffff, 1.3); light.position.set(5, 15, 8); scene.add(light); }
    const roofCanvas=document.createElement('canvas'); roofCanvas.width=roofCanvas.height=128; const roofPaint=roofCanvas.getContext('2d'); roofPaint.fillStyle='#d98da8'; roofPaint.fillRect(0,0,128,128); for(let row=0;row<8;row++){ const y=row*16; roofPaint.fillStyle=row%2?'#e2a1b8':'#efb5c8'; roofPaint.fillRect(0,y,128,15); roofPaint.strokeStyle='rgba(126,60,88,.34)'; roofPaint.lineWidth=2; roofPaint.beginPath(); roofPaint.moveTo(0,y+15); roofPaint.lineTo(128,y+15); roofPaint.stroke(); const offset=row%2?8:0; for(let x=offset;x<128;x+=16){ roofPaint.strokeStyle='rgba(142,77,99,.3)'; roofPaint.lineWidth=1; roofPaint.beginPath(); roofPaint.moveTo(x,y); roofPaint.lineTo(x,y+15); roofPaint.stroke(); roofPaint.strokeStyle='rgba(255,241,246,.58)'; roofPaint.beginPath(); roofPaint.moveTo(x+1,y+1); roofPaint.lineTo(x+1,y+13); roofPaint.stroke(); } } const roofTexture=new THREE.CanvasTexture(roofCanvas); roofTexture.wrapS=roofTexture.wrapT=THREE.RepeatWrapping; roofTexture.repeat.set(4,4); roofTexture.colorSpace=THREE.SRGBColorSpace;
    const floorMat = new THREE.MeshStandardMaterial({ color:0xf8e6ce, roughness:1 }); const wallMat = new THREE.MeshStandardMaterial({ color:0xe9dff0, roughness:.96 }); const roofMat = new THREE.MeshStandardMaterial({ color:0xffffff, map:roofTexture, roughness:.88 }); const villaTrimMat = new THREE.MeshStandardMaterial({ color:0xfffff6, roughness:.92 }); const roadMat = new THREE.MeshStandardMaterial({ color:0xd7e8ed, roughness:1 }); const grassMat = new THREE.MeshStandardMaterial({ color:0xc5e8c3, roughness:1 }); const glassMat = new THREE.MeshPhysicalMaterial({ color:0xbfe7ee, transparent:true, opacity:.48, roughness:.12, metalness:.05, transmission:.12 }); const warmMat = new THREE.MeshStandardMaterial({ color:0xffe5a9, emissive:0xffbd68, emissiveIntensity:.65, roughness:.55 }); const ironMat = new THREE.MeshStandardMaterial({ color:0x4f4a55, metalness:.55, roughness:.42 });
    const group = new THREE.Group(); scene.add(group);
    const roomLayout = { living:[-2,-3.5,8,5], dining:[4,-3.5,4,5], bedroom:[-3.5,2.5,5,7], study:[.5,2.5,3,7], bathroom:[4,4,4,4], balcony:[4,.5,4,3] };
    const box = (w,h,d,x,y,z,mat) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); mesh.position.set(x,y,z); group.add(mesh); return mesh; };
    const gableRoof = (w,d,h,x,baseY,z) => { const roofGroup=new THREE.Group(); const slope=Math.hypot(w/2,h); const angle=Math.atan2(h,w/2); const left=new THREE.Mesh(new THREE.BoxGeometry(slope,.24,d+.45),roofMat); left.position.set(x-w/4,baseY+h/2,z); left.rotation.z=angle; roofGroup.add(left); const right=new THREE.Mesh(new THREE.BoxGeometry(slope,.24,d+.45),roofMat); right.position.set(x+w/4,baseY+h/2,z); right.rotation.z=-angle; roofGroup.add(right); const ridge=new THREE.Mesh(new THREE.BoxGeometry(.24,.24,d+.62),villaTrimMat); ridge.position.set(x,baseY+h+.02,z); roofGroup.add(ridge); roofGroup.name='independent-gable-roof'; group.add(roofGroup); return roofGroup; };
    const gableWall = (w,h,x,y,z,d) => { const shape=new THREE.Shape(); shape.moveTo(-w/2,0); shape.lineTo(w/2,0); shape.lineTo(0,h); shape.closePath(); const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),wallMat); wall.position.set(x,y,z); group.add(wall); return wall; };
    const archWindow = (x,y,z,w,h,light=true) => { const shape=new THREE.Shape(); const r=w/2; shape.moveTo(-r,0); shape.lineTo(r,0); shape.lineTo(r,h-r); shape.quadraticCurveTo(r,h,-0,h); shape.quadraticCurveTo(-r,h,-r,h-r); shape.closePath(); const pane=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.02}),light?warmMat:glassMat); pane.position.set(x,y,z); group.add(pane); box(.1,h-r+.08,w*.08,x-r-.06,y+(h-r)/2,z-.08,villaTrimMat); box(.1,h-r+.08,w*.08,x+r+.06,y+(h-r)/2,z-.08,villaTrimMat); const archFrame=new THREE.Mesh(new THREE.TorusGeometry(r+.06,.075,8,24,Math.PI),villaTrimMat); archFrame.position.set(x,y+h-r,z-.09); group.add(archFrame); box(.055,h-.18,.08,x,y+(h-r)/2,z-.13,villaTrimMat); box(w-.16,.055,.08,x,y+h*.52,z-.13,villaTrimMat); if(light&&!lowPower){ const glow=new THREE.PointLight(0xffc978,.55,4); glow.position.set(x,y+h*.55,z+.35); scene.add(glow); } };
    const column = (x,y,z,h=2.8,r=.12) => { const shaft=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.12,h,12),villaTrimMat); shaft.position.set(x,y+h/2,z); group.add(shaft); const cap=box(r*3,.14,r*3,x,y+h+.04,z,villaTrimMat); const base=box(r*3,.14,r*3,x,y-.04,z,villaTrimMat); return {shaft,cap,base}; };
    const balustrade = (x,z,length,alongX=true,y=4.3) => { const rail=box(alongX?length:.14,.12,alongX?.14:length,x,y+.95,z,villaTrimMat); for(let i=0;i<Math.max(2,Math.floor(length/0.55));i++){ const p=-length/2+.25+i*(length-.5)/Math.max(1,Math.floor(length/0.55)-1); column(alongX?x+p:x,y,z+(alongX?0:p),.9,.07); } return rail; };
    box(24,.35,24,0,-.26,0,grassMat); box(21,.16,2.1,0,-.05,-10.2,roadMat); box(2.1,.16,21,10.2,-.04,0,roadMat);
    // 当前房屋主体已清空，保留底座、场景、相机和天气，等待重新建模。
    if (false) { Object.entries(roomLayout).forEach(([, [x,z,w,d]]) => { const wallHeight=3.35; box(w,.22,d,x,0,z,floorMat); box(w,wallHeight,.14,x,wallHeight/2,z-d/2,wallMat); box(w,wallHeight,.14,x,wallHeight/2,z+d/2,wallMat); box(.14,wallHeight,d,x-w/2,wallHeight/2,z,wallMat); box(.14,wallHeight,d,x+w/2,wallHeight/2,z,wallMat); });
    // 参考小洋房做两层错落体块：一楼平顶露台，上层搭配浅粉色坡屋顶。
    box(12.7,.34,12.7,0,3.5,0,villaTrimMat);
    box(7.4,3.05,6.7,1.25,5.03,1.45,wallMat);
    box(7.7,.22,7,1.25,6.62,1.45,villaTrimMat);
    const mainRoofGroup = gableRoof(8.15,7.15,2.25,1.25,6.53,1.45); mainRoofGroup.name='mainRoofGroup'; gableWall(7.35,2.25,1.25,6.54,-2.14,.12); gableWall(7.35,2.25,1.25,6.54,5.04,.12);
    // 右侧二楼与主楼连成一个平顶翼楼，不再叠加第二个尖屋顶。
    box(4.35,2.75,4.35,3.55,4.9,-1.65,wallMat); box(4.6,.2,4.6,3.55,6.3,-1.65,villaTrimMat); box(4.7,.24,4.7,3.55,6.45,-1.65,roofMat);
    box(2.8,.28,1.4,0,3.42,-5.35,villaTrimMat);
    box(.42,2.9,.42,-1.08,1.85,-5.7,villaTrimMat); box(.42,2.9,.42,1.08,1.85,-5.7,villaTrimMat);
    box(5.1,.66,4.5,-3.55,3.84,2.85,wallMat); box(5.35,.22,4.75,-3.55,4.2,2.85,villaTrimMat);
    box(5.05,.55,.22,-3.55,4.45,.52,villaTrimMat); box(.22,.55,4.3,-6.08,4.45,2.85,villaTrimMat);
    box(.46,2.35,.46,3.2,7.5,2.25,villaTrimMat); box(.72,.28,.72,3.2,8.76,2.25,roofMat); const frontRoofGroup=gableRoof(3.7,2.7,1.15,0,3.46,-3.05); frontRoofGroup.name='frontRoofGroup'; gableWall(3.25,1.15,0,3.47,-4.42,.1); gableWall(3.25,1.15,0,3.47,-1.68,.1);
    // 前立面使用真正有厚度的拱形窗，窗格和暖光都作为独立几何体存在。
    archWindow(-.15,3.92,-2.13,1.55,2.28,true); archWindow(2.45,3.92,-2.13,1.72,2.5,true); archWindow(4.35,3.85,-3.86,1.2,2.05,true);
    // 左侧二层露台、柱廊与奶白色欧式栏杆。
    column(-5.25,4.25,.65,1.9,.11); column(-3.95,4.25,.65,1.9,.11); column(-2.65,4.25,.65,1.9,.11); balustrade(-3.95,.48,3.05,true,4.28);
    box(3.5,.12,2.65,-3.95,6.18,.65,villaTrimMat); column(-5.42,6.2,-.15,2.2,.1); column(-2.48,6.2,-.15,2.2,.1); box(3.25,.12,.12,-3.95,8.38,-.15,villaTrimMat); box(.12,2.2,2.65,-5.42,7.3,-.15,villaTrimMat); box(.12,2.2,2.65,-2.48,7.3,-.15,villaTrimMat);
    // 高低错落的装饰山墙、烟囱和屋脊收边。
    box(1.15,.16,.18,1.25,8.88,-2.1,villaTrimMat); box(.72,2.3,.72,2.85,7.85,2.55,villaTrimMat); box(1.02,.22,1.02,2.85,9.03,2.55,villaTrimMat);
    // 正前方的大门和门框。
    const doorMat = new THREE.MeshStandardMaterial({color:0xd59b72,roughness:.85});
    const doorShape=new THREE.Shape(); doorShape.moveTo(-.82,0); doorShape.lineTo(.82,0); doorShape.lineTo(.82,1.62); doorShape.quadraticCurveTo(0,2.72,-.82,1.62); doorShape.lineTo(-.82,0); const door=new THREE.Mesh(new THREE.ExtrudeGeometry(doorShape,{depth:.18,bevelEnabled:true,bevelSegments:2,bevelSize:.07,bevelThickness:.06}),doorMat); door.position.set(0,3.58,-3.12); group.add(door); const arch=new THREE.Mesh(new THREE.TorusGeometry(.84,.1,8,24,Math.PI),villaTrimMat); arch.position.set(0,5.14,-3.24); group.add(arch); const knob = new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshStandardMaterial({color:0xeccf74,metalness:.35,roughness:.35})); knob.position.set(.52,4.68,-3.27); group.add(knob); const doorEmblem=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshStandardMaterial({color:0xf2d37d,metalness:.3,roughness:.3})); doorEmblem.position.set(0,5.26,-3.27); group.add(doorEmblem); box(3.0,.18,1.2,0,3.42,-3.62,villaTrimMat); box(2.55,.18,.95,0,3.22,-3.38,villaTrimMat); box(2.1,.18,.7,0,3.02,-3.17,villaTrimMat);
    // 门口右前方的圆形庭院喷泉。
    const fountainStone=new THREE.MeshStandardMaterial({color:0xfffff4,roughness:.8}); const fountainWater=new THREE.MeshStandardMaterial({color:0x9edcf0,transparent:true,opacity:.82,roughness:.25}); const fountainX=0; const fountainZ=-7.35; const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.48,.32,24),fountainStone); basin.position.set(fountainX,.16,fountainZ); group.add(basin); const water=new THREE.Mesh(new THREE.CylinderGeometry(1.12,1.12,.06,24),fountainWater); water.position.set(fountainX,.35,fountainZ); group.add(water); const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.22,.42,1.18,12),fountainStone); pedestal.position.set(fountainX,.9,fountainZ); group.add(pedestal); const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.58,.28,.2,18),fountainStone); bowl.position.set(fountainX,1.48,fountainZ); group.add(bowl); const jet=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.82,8),fountainWater); jet.position.set(fountainX,1.94,fountainZ); group.add(jet); const streamMaterial=new THREE.LineBasicMaterial({color:0xd9f7ff,transparent:true,opacity:.82}); const sprayStreams=[]; for(let streamIndex=0;streamIndex<12;streamIndex++){ const streamGeo=new THREE.BufferGeometry(); streamGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(13*3),3)); const stream=new THREE.Line(streamGeo,streamMaterial); group.add(stream); sprayStreams.push({stream,angle:streamIndex*Math.PI*2/12}); } const sprayGeo=new THREE.BufferGeometry(); const sprayPositions=new Float32Array(36*3); for(let i=0;i<36;i++){ const angle=i*Math.PI*2/36; const radius=.18+(i%5)*.08; sprayPositions[i*3]=fountainX+Math.cos(angle)*radius; sprayPositions[i*3+1]=1.92+(i%6)*.16; sprayPositions[i*3+2]=fountainZ+Math.sin(angle)*radius; } sprayGeo.setAttribute('position',new THREE.BufferAttribute(sprayPositions,3)); const spray=new THREE.Points(sprayGeo,new THREE.PointsMaterial({color:0xd9f7ff,size:.1,transparent:true,opacity:.9})); group.add(spray);
    // 正门外的一盏低模路灯。
    const lampDark=new THREE.MeshStandardMaterial({color:0x52616b,roughness:.72}); const lampGlow=new THREE.MeshStandardMaterial({color:0xffefd0,emissive:0xffd792,emissiveIntensity:.8,roughness:.45}); const lampPole=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,3.5,8),lampDark); lampPole.position.set(5.8,1.75,-7.35); group.add(lampPole); box(.75,.1,.12,5.5,3.38,-7.35,lampDark); box(.38,.22,.36,5.16,3.23,-7.35,lampGlow); if(!lowPower){ const lampLight=new THREE.PointLight(0xffdba7,.7,5); lampLight.position.set(5.16,3.05,-7.35); scene.add(lampLight); }
    const leafMat=new THREE.MeshStandardMaterial({color:0x79a978,roughness:1}); const flowerMats=[0xf5a6bd,0xe7b5dc,0xffd0dc].map(color=>new THREE.MeshStandardMaterial({color,roughness:1})); const flowerBush=(x,z,scale=1)=>{ const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.52*scale,1),leafMat); leaves.position.set(x,.45*scale,z); group.add(leaves); for(let i=0;i<5;i++){ const bloom=new THREE.Mesh(new THREE.SphereGeometry(.13*scale,6,4),flowerMats[i%flowerMats.length]); const angle=i*Math.PI*2/5; bloom.position.set(x+Math.cos(angle)*.4*scale,.72*scale+(i%2)*.12,z+Math.sin(angle)*.4*scale); group.add(bloom); } };
    // 喷泉周围的环形花坛、右侧休息区和铁艺庭院门。
    for(let i=0;i<14;i++){ const angle=i*Math.PI*2/14; flowerBush(Math.cos(angle)*2.05,fountainZ+Math.sin(angle)*1.55,.55+(i%3)*.1); }
    const gateX=7.2, gateZ=-5.2; box(2.1,.14,.14,gateX,2.65,gateZ,ironMat); box(2.1,.14,.14,gateX,1.15,gateZ,ironMat); for(let i=0;i<6;i++) box(.08,2.2,.08,gateX-1+i*.4,1.9,gateZ,ironMat); const gateArch=new THREE.Mesh(new THREE.TorusGeometry(1.02,.09,8,24,Math.PI),ironMat); gateArch.position.set(gateX,2.65,gateZ); group.add(gateArch);
    const table=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,.1,16),villaTrimMat); table.position.set(5.0,1.05,-7.0); group.add(table); const tableLeg=new THREE.Mesh(new THREE.CylinderGeometry(.1,.16,.95,8),ironMat); tableLeg.position.set(5.0,.55,-7.0); group.add(tableLeg); const umbrella=new THREE.Mesh(new THREE.ConeGeometry(1.35,.38,24),villaTrimMat); umbrella.position.set(5.0,3.05,-7.0); group.add(umbrella); box(.06,2.1,.06,5.0,1.9,-7.0,ironMat);
    [[-5.3,-6.8,.9],[-3.9,-7.05,.75],[2.8,-6.85,.85],[4.2,-6.95,.72],[6.75,-4.4,.8],[6.8,-2.7,.72]].forEach(args=>flowerBush(...args));
    // 一棵大樱花树：每朵花由分开的花瓣组成，避免树冠变成一整坨。
    const cherryTree = (x,z) => { const trunkMat=new THREE.MeshStandardMaterial({color:0x76504b,roughness:1}); const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.38,.58,4.6,8),trunkMat); trunk.position.set(x,2.3,z); group.add(trunk); [[-.9,3.55,0,.75],[.88,3.65,.25,-.72],[-.25,4,-.35,.2],[.25,4.15,.35,-.18]].forEach(([ox,oy,oz,turn])=>{ const branch=new THREE.Mesh(new THREE.CylinderGeometry(.13,.24,2.65,7),trunkMat); branch.position.set(x+ox*.5,oy,z+oz); branch.rotation.z=turn; group.add(branch); }); const petalGeo=new THREE.SphereGeometry(.27,7,5); const petalMats=[0xffc0d3,0xffd5e2,0xffa9c4,0xffe5ec].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9})); const clusters=[[-2.05,5,.2],[-1.75,5.65,-.45],[-1.25,6.15,.15],[-.65,5.55,-.85],[-.35,6.35,-.25],[.25,5.8,.45],[.75,6.2,-.15],[1.25,5.65,.55],[1.8,5.35,-.2],[2.05,4.75,.4],[-1.85,4.35,-.55],[-1.2,4.65,.75],[-.55,4.85,.05],[.05,4.55,-.75],[.65,4.8,.85],[1.3,4.45,-.6],[1.75,4.25,.35],[-.75,5.25,.85],[.45,5.25,-.95],[0,5.5,0]]; clusters.forEach((entry,index)=>{ const [cx,cy,cz]=entry; for(let p=0;p<6;p++){ const angle=p*Math.PI*2/6; const petal=new THREE.Mesh(petalGeo,petalMats[(index+p)%petalMats.length]); petal.scale.set(1.3,.7,.92); petal.position.set(x+cx+Math.cos(angle)*.4,cy+Math.sin(angle)*.3,z+cz+Math.sin(angle)*.34); petal.rotation.z=angle; group.add(petal); } }); };
    cherryTree(-8,4.8); }
    const palette = { pink:0xe9a7aa, wood:0xc99a69, yellow:0xf0c86f, green:0x91c69d, cream:0xe8cda9, blue:0x9ebfdf, purple:0xb9a5d6, peach:0xefb38e };
    const furniture = data => { Object.entries(data.areas || {}).forEach(([areaId, roomData]) => { const layout = roomLayout[areaId]; if (!layout) return; const [rx,rz,rw,rd] = layout; (roomData.placed || []).forEach(entry => { const ownedItem = data.owned.find(candidate => candidate.id === entry.ownedId); const info = item(ownedItem?.itemId); if (!info) return; const material = new THREE.MeshStandardMaterial({ color:palette[ownedItem?.tone || info.color] || 0xc9b6b2, roughness:.92 }); const width = info.art === 'bed' || info.art === 'sofa' ? 1.6 : .9; const depth = info.art === 'bed' ? 1.2 : .75; const height = info.art === 'lamp' || info.art === 'plant' ? 1.7 : .65; const mesh = box(width,height,depth,rx-rw/2+(Number(entry.x)||50)/100*rw,height/2+.12,rz-rd/2+(Number(entry.y)||50)/100*rd,material); mesh.rotation.y = Number(entry.rotation || 0) * Math.PI / 180; }); }); };
    // 房屋重新建模前不渲染旧家具。
    const weatherNames = { clear:'晴天', cloudy:'多云', rain:'下雨', snow:'下雪' }; const data = home(); data.weather ||= Object.keys(weatherNames)[Math.floor(Math.random() * 4)]; save(); const weather = data.weather;
    const weatherLabel = stage.querySelector('[data-house-3d-weather]'); if (weatherLabel) weatherLabel.textContent = `今日 · ${weatherNames[weather] || '晴天'}`;
    let weatherPoints = null; if (weather === 'rain' || weather === 'snow') { const count = lowPower ? 80 : 180; const positions = new Float32Array(count * 3); for (let i=0;i<count;i++) { positions[i*3]=(Math.random()-.5)*18; positions[i*3+1]=Math.random()*10+.5; positions[i*3+2]=(Math.random()-.5)*14; } const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.BufferAttribute(positions,3)); weatherPoints = new THREE.Points(geometry,new THREE.PointsMaterial({ color:weather==='rain'?0x83a8c5:0xffffff, size:weather==='rain'?.08:.16, transparent:true, opacity:.75 })); scene.add(weatherPoints); }
    const resize = () => { if (!stage.isConnected) return; renderer.setSize(stage.clientWidth,stage.clientHeight,false); camera.aspect=stage.clientWidth/Math.max(1,stage.clientHeight); camera.updateProjectionMatrix(); }; window.addEventListener('resize',resize); house3dObserver = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) house3d.paused = true; }, { threshold:.05 }); house3dObserver.observe(stage);
    const updateCamera = () => { camera.position.set(target.x+distance*Math.sin(pitch)*Math.sin(yaw),target.y+distance*Math.cos(pitch),target.z+distance*Math.sin(pitch)*Math.cos(yaw)); camera.lookAt(target); };
    const loop = now => { if (!house3d || house3d.paused || document.hidden || !app.classList.contains('is-open') || page !== 'room') { house3dFrame = 0; return; } house3dFrame=requestAnimationFrame(loop); if (now-house3dLastFrame < (lowPower?66:40)) return; house3dLastFrame=now; if (weatherPoints) { const pos=weatherPoints.geometry.attributes.position; for(let i=1;i<pos.count;i++){ const y=pos.getY(i)-(weather==='rain'?.22:.035); pos.setY(i,y<.2?10:y); } pos.needsUpdate=true; } updateCamera(); renderer.render(scene,camera); };
    house3d = { renderer, scene, camera, paused:false, resize, destroy:() => { cancelAnimationFrame(house3dFrame); window.removeEventListener('resize',resize); house3dObserver?.disconnect(); renderer.dispose(); house3d=null; } }; updateCamera(); house3dFrame=requestAnimationFrame(loop);
    stage.addEventListener('pointerdown', event => { house3dPointer={x:event.clientX,y:event.clientY}; stage.setPointerCapture?.(event.pointerId); }); stage.addEventListener('pointermove', event => { if (!house3dPointer) return; yaw -= (event.clientX-house3dPointer.x)*.009; pitch=Math.max(.18,Math.min(1.48,pitch+(event.clientY-house3dPointer.y)*.009)); house3dPointer={x:event.clientX,y:event.clientY}; }); stage.addEventListener('pointerup', () => { house3dPointer=null; }); stage.addEventListener('pointercancel', () => { house3dPointer=null; }); stage.addEventListener('wheel', event => { event.preventDefault(); distance=Math.max(16,Math.min(38,distance+event.deltaY*.018)); }, { passive:false });
    let pinch = 0; stage.addEventListener('touchstart', event => { if (event.touches.length === 2) pinch=Math.hypot(event.touches[0].clientX-event.touches[1].clientX,event.touches[0].clientY-event.touches[1].clientY); }, { passive:true }); stage.addEventListener('touchmove', event => { if (event.touches.length !== 2 || !pinch) return; const next=Math.hypot(event.touches[0].clientX-event.touches[1].clientX,event.touches[0].clientY-event.touches[1].clientY); distance=Math.max(16,Math.min(38,distance-(next-pinch)*.025)); pinch=next; event.preventDefault(); }, { passive:false }); stage.addEventListener('touchend', () => { pinch=0; }, { passive:true });
  }
  function render(preserveScroll = false) { const previousPage = preserveScroll ? app.querySelector('.house-page') : null; const scrollTop = previousPage?.scrollTop || 0; house3d?.destroy?.(); shop3dViewer?.destroy?.(); preview3dId = ''; finishWork(); app.innerHTML = `<main class="house-page">${page === 'room' ? roomPage() : page === 'work' ? workPage() : page === 'shop' ? shopPage() : storagePage()}${toast ? `<div class="house-toast">${esc(toast)}</div>` : ''}${nav()}${placementSheet()}${dyeSheet()}</main>`; if (preserveScroll) { const nextPage = app.querySelector('.house-page'); if (nextPage) nextPage.scrollTop = scrollTop; } if (page === 'room') { const tabs = app.querySelector('.house-area-tabs'); const activeTab = tabs?.querySelector('.active'); if (tabs && activeTab) tabs.scrollLeft = Math.max(0, activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2); initThreeHome(); } else if (page === 'shop') requestAnimationFrame(initShop3dPreviews); if (toast) { clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast = ''; render(true); }, 2400); } }
  function refreshWorkProgress() { if (finishWork()) { render(); return; } ['user', 'role'].forEach(actor => { const task = activeWork(actor); const box = app.querySelector(`[data-house-worker="${actor}"]`); if (!task || !box) return; const job = workJobs().find(entry => entry.id === task.jobId); if (!job) return; const left = timeLeft(task); const duration = Number(task.duration || jobTime(job)); const status = box.querySelector('[data-house-work-status]'); const progress = box.querySelector('[data-house-work-progress]'); if (status) status.textContent = `${job.name}　·　还剩 ${left} 秒`; if (progress) progress.style.width = `${Math.min(100, Math.max(2, 100 - left / duration * 100))}%`; }); }
  function flash(message, preserveScroll = false) { toast = message; render(preserveScroll); }
  function start(actor, jobId) { if (actor === 'role' && !character()) return; const data = home(); if (data.work[actor]) return; const job = workJobs(actor).find(entry => entry.id === jobId); if (!job) return; const duration = jobTime(job); const reward = jobReward(job); data.work[actor] = { jobId, duration, reward, end: Date.now() + duration * 1000 }; save(); flash(`${actor === 'role' ? roleName() : userName()} 开始工作了`); }
  function settingText(person, label) { if (!person) return `${label}：未绑定`; const fields = label === '用户' ? [['姓名', person.realName || person.name], ['网名', person.nickname], ['身份', person.identity], ['职业', person.occupation || person.profession || person.job], ['技能', person.skills || person.specialties], ['长处', person.strengths], ['性别', person.gender], ['生日', person.birthday], ['用户设定', person.persona], ['背景', person.background], ['补充描述', person.description]] : [['姓名', person.name], ['昵称', person.nickname], ['身份', person.identity], ['职业', person.occupation || person.profession || person.job], ['技能', person.skills || person.specialties], ['长处', person.strengths], ['性别', person.gender], ['生日', person.birthday], ['角色设定', person.details], ['签名', person.signature], ['背景', person.background], ['补充描述', person.description]]; if (label === '角色' && person.worldbook) { const books = read('ideal-machine-worldbooks', {}); const book = (books.local || []).find(entry => entry.id === person.worldbook); if (book) fields.push(['局部世界书', (book.entries || []).filter(entry => entry.enabled !== false).map(entry => `【${entry.name}】${entry.content}`).join('\n')]); } return `${label}设定：\n${fields.filter(([, value]) => value).map(([name, value]) => `${name}：${Array.isArray(value) ? value.join('、') : String(value).trim()}`).join('\n') || '暂无可读取的文字设定'}`; }
  async function scanJobs() { if (scanningJobs) return; const p = user(); const r = character(); if (!p || !r) return flash('请先绑定用户和角色设定', true); const config = window.IdealMachineAPI?.getConfig?.() || {}; const model = window.IdealMachineAPI?.getModel?.('jia') || window.IdealMachineAPI?.getModel?.('chat') || window.IdealMachineAPI?.getModel?.('ta'); if (!config.endpoint || !config.key || !model) return flash('请先在设置中为“家”配置 API 模型', true); let resultMessage = ''; scanningJobs = true; render(true);
    try {
      const prompt = `请分别分析下面的“用户设定”和“角色设定”，先各自检索其明确职业、身份、技能、兴趣、经历与性格长处，再为两个人分别生成 3 到 5 项专属短期工作。\n\n关键规则：\n1. userJobs 只能依据用户设定，roleJobs 只能依据角色设定，禁止把一方的职业或技能套给另一方。\n2. 两组工作必须有明显区别，工作名称不得跨组重复。\n3. 优先匹配明确写出的职业、专业能力和技能；其次才使用兴趣与性格长处。\n4. 不要套用面包店、跑腿、整理等通用工作，除非对应人物设定明确支持。\n5. 每项 fit 必须指出该人物自己的具体设定依据；没有依据时不要编造。\n6. 工作须安全、日常、可完成，不涉及真实金钱或危险行为。\n\n只返回合法 JSON 对象，不要 Markdown：\n{"userJobs":[{"name":"工作名称","detail":"具体做什么","fit":"对应的用户职业或技能依据","time":整数秒数,"coins":整数家币,"art":"picture|bread|plant|box"}],"roleJobs":[{"name":"工作名称","detail":"具体做什么","fit":"对应的角色职业或技能依据","time":整数秒数,"coins":整数家币,"art":"picture|bread|plant|box"}]}\n工作时长 10 到 90 秒，家币 15 到 120。\n\n${settingText(p, '用户')}\n\n${settingText(r, '角色')}`;
      const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model, temperature: .6, messages: [{ role: 'system', content: '你是个性化工作设计师。必须把用户和角色当作两个独立的人分析，分别生成只属于本人的工作；严禁混用两人的职业、身份和技能。只输出合法 JSON。' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const raw = String(data.choices?.[0]?.message?.content || '').replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(raw);
      const userJobs = Array.isArray(parsed?.userJobs) ? parsed.userJobs : Array.isArray(parsed?.user_jobs) ? parsed.user_jobs : [];
      const roleJobs = Array.isArray(parsed?.roleJobs) ? parsed.roleJobs : Array.isArray(parsed?.role_jobs) ? parsed.role_jobs : [];
      const normalizeJobs = (list, actor) => list.slice(0, 5).map((entry, index) => ({ id: `smart-${actor}-${Date.now()}-${index}`, source: 'api', actor, name: String(entry.name || '').trim().slice(0, 24), detail: String(entry.detail || '').trim().slice(0, 70), fit: String(entry.fit || '').trim().slice(0, 70), time: Math.max(10, Math.min(90, Number(entry.time) || 20)), coins: Math.max(15, Math.min(120, Number(entry.coins) || 30)), art: ['picture', 'bread', 'plant', 'box'].includes(entry.art) ? entry.art : 'picture' })).filter(entry => entry.name && entry.detail && entry.fit);
      const generatedUserJobs = normalizeJobs(userJobs, 'user');
      const generatedRoleJobs = normalizeJobs(roleJobs, 'role');
      if (generatedUserJobs.length < 3 || generatedRoleJobs.length < 3) throw new Error('用户或角色的专属工作不足 3 项');
      const userNames = new Set(generatedUserJobs.map(entry => entry.name));
      if (generatedRoleJobs.some(entry => userNames.has(entry.name))) throw new Error('两个人的工作出现重复，请重新扫描');
      home().customJobs = [...generatedUserJobs, ...generatedRoleJobs]; save(); resultMessage = `已分别为${userName()}和${roleName()}生成专属工作`;
    } catch (error) { home().customJobs = []; save(); resultMessage = `根据设定生成失败：${error.message}`; }
    finally { scanningJobs = false; toast = resultMessage; render(true); }
  }
  function buy(id) { const info = item(id); const data = home(); if (!info || data.coins < info.price) return; data.coins -= info.price; data.owned.push({ id: uid(), itemId: id }); save(); flash(`${info.name} 已放进仓库`); }
  function dye(id, tone) { const ownedItem = home().owned.find(entry => entry.id === id); const choice = dyeColors.find(entry => entry.id === tone); if (!ownedItem || !choice) return; ownedItem.tone = choice.id; dyeId = ''; save(); flash(`${item(ownedItem.itemId)?.name || '家具'}换成${choice.name}啦`); }
  function place(id, targetArea = activeArea) { const data = home(); activeArea = targetArea; const roomData = areaData(); if (roomData.placed.length >= maxFurniturePerArea || placedAnywhere(id)) return; const index = roomData.placed.length; roomData.placed.push({ ownedId: id, x: 22 + (index % 4) * 19, y: 27 + (Math.floor(index / 4) % 3) * 25, rotation: 0 }); selectedFurnitureId = id; placementPickerId = ''; save(); flash(`家具已经放进${areas.find(area => area.id === activeArea)?.name || '房间'}啦`); }
  function furnishingPayload() { const data = home(); return Object.fromEntries(Object.entries(data.equipped3d || {}).map(([slot, ownedId]) => { const ownedItem = data.owned.find(entry => entry.id === ownedId); const info = item(ownedItem?.itemId); return [slot, info ? { itemId: info.id, variant: info.variant, tone: ownedItem?.tone || info.color } : null]; }).filter(([, value]) => value)); }
  function postFurnishing() { const frame = app.querySelector('.house-villa-frame'); frame?.contentWindow?.postMessage({ type: 'ideal-house-furnishing', items: furnishingPayload() }, '*'); }
  function equip3d(id) { const data = home(); const ownedItem = data.owned.find(entry => entry.id === id); const info = item(ownedItem?.itemId); if (!ownedItem || !info?.is3d || !info.slot) return; data.equipped3d[info.slot] = id; Object.values(data.areas).forEach(area => { area.placed = area.placed.filter(entry => entry.ownedId !== id); }); placementPickerId = ''; save(); postFurnishing(); flash(`${info.name}已应用到${slotNames[info.slot] || '3D小家'}`); }
  function recycle(id) { const data = home(); const ownedItem = data.owned.find(entry => entry.id === id); const info = item(ownedItem?.itemId); if (!ownedItem || !info) return; const refund = Math.floor(info.price * .6); if (!window.confirm(`回收「${info.name}」将返还 ${refund} 家币，确定吗？`)) return; data.owned = data.owned.filter(entry => entry.id !== id); Object.values(data.areas).forEach(area => { area.placed = area.placed.filter(entry => entry.ownedId !== id); }); Object.keys(data.equipped3d || {}).forEach(slot => { if (data.equipped3d[slot] === id) delete data.equipped3d[slot]; }); data.coins += refund; if (selectedFurnitureId === id) selectedFurnitureId = ''; save(); postFurnishing(); flash(`已回收${info.name}，返还 ${refund} 家币`); }
  function rotate(degrees) { const entry = areaData().placed.find(item => item.ownedId === selectedFurnitureId); if (!entry) return; entry.rotation = (Number(entry.rotation) || 0) + degrees; save(); render(); }
  window.addEventListener('message', event => {
    const frame = app.querySelector('.house-villa-frame');
    const payload = event.data;
    if (!frame || event.source !== frame.contentWindow || !payload) return;
    if (payload.type === 'ideal-house-ready') { postFurnishing(); return; }
    if (payload.type !== 'ideal-house-ambience') return;
    const tones = ['morning', 'day', 'afternoon', 'evening', 'night'];
    const weathers = ['sunny', 'cloudy', 'rain', 'snow'];
    houseAmbience = {
      tone: tones.includes(payload.tone) ? payload.tone : 'day',
      weather: weathers.includes(payload.weather) ? payload.weather : 'sunny',
      daylight: Math.max(0, Math.min(1, Number(payload.daylight) || 0))
    };
    const dock = app.querySelector('.house-nav');
    if (!dock) return;
    dock.dataset.houseTone = houseAmbience.tone;
    dock.dataset.houseWeather = houseAmbience.weather;
    dock.style.setProperty('--house-dock-daylight', houseAmbience.daylight);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="jia"]')) { state = load(); page = 'room'; preview3dId = ''; sheet = roles().length ? 'role' : ''; app.classList.add('is-open'); render(); requestAnimationFrame(() => house3d?.resize?.()); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-house-close]')) { preview3dId = ''; shop3dViewer?.destroy?.(); app.classList.remove('is-open'); return; }
    const pageButton = event.target.closest('[data-house-page]'); if (pageButton) { page = pageButton.dataset.housePage; preview3dId = ''; sheet = ''; roomStyleOpen = false; render(); return; }
    const pick = event.target.closest('[data-house-pick]'); if (pick) { sheet = pick.dataset.housePick; render(); return; }
    if (event.target.closest('[data-house-picker-close]')) { sheet = ''; render(); return; }
    const selected = event.target.closest('[data-house-select]'); if (selected) { if (selected.dataset.houseSelect === 'profile') state.profileId = selected.dataset.houseId; else { state.roleId = selected.dataset.houseId; const linkedProfileId = chat().chats?.[state.roleId]?.profileId; if (linkedProfileId && chat().profiles.some(item => item.id === linkedProfileId)) state.profileId = linkedProfileId; } sheet = ''; save(); render(); return; }
    const areaButton = event.target.closest('[data-house-area]'); if (areaButton) { activeArea = areaButton.dataset.houseArea; selectedFurnitureId = ''; roomStyleOpen = false; render(); return; }
    const categoryButton = event.target.closest('[data-house-cat]'); if (categoryButton) { cat = categoryButton.dataset.houseCat; render(); return; }
    const previewButton = event.target.closest('[data-house-preview-id]'); if (previewButton) { openShop3dPreview(previewButton.dataset.housePreviewId); return; }
    if (event.target.closest('[data-house-preview-close]')) { closeShop3dPreview(); return; }
    if (event.target.closest('[data-house-scan-jobs]')) { scanJobs(); return; }
    const workButton = event.target.closest('[data-house-work]'); if (workButton) { start(workButton.dataset.houseWork, workButton.dataset.houseJob); return; }
    const buyButton = event.target.closest('[data-house-buy]'); if (buyButton) { buy(buyButton.dataset.houseBuy); return; }
    if (event.target.closest('[data-house-dye-close]')) { dyeId = ''; render(); return; }
    const dyeButton = event.target.closest('[data-house-dye]'); if (dyeButton) { dyeId = dyeButton.dataset.houseDye; render(); return; }
    const dyeColorButton = event.target.closest('[data-house-dye-color]'); if (dyeColorButton) { dye(dyeId, dyeColorButton.dataset.houseDyeColor); return; }
    const placeButton = event.target.closest('[data-house-place]'); if (placeButton) { placementPickerId = placeButton.dataset.housePlace; render(); return; }
    if (event.target.closest('[data-house-placement-close]')) { placementPickerId = ''; render(); return; }
    const equip3dButton = event.target.closest('[data-house-equip-model]'); if (equip3dButton) { equip3d(equip3dButton.dataset.houseEquipModel); return; }
    const placeAreaButton = event.target.closest('[data-house-place-area]'); if (placeAreaButton) { place(placementPickerId, placeAreaButton.dataset.housePlaceArea); return; }
    const rotateButton = event.target.closest('[data-house-rotate]'); if (rotateButton) { rotate(Number(rotateButton.dataset.houseRotate)); return; }
    if (event.target.closest('[data-house-style-open]')) { roomStyleOpen = true; page = 'room'; render(); return; }
    if (event.target.closest('[data-house-style-close]')) { roomStyleOpen = false; render(); return; }
    const wallButton = event.target.closest('[data-house-wall]'); if (wallButton) { areaData().roomStyle.wall = wallButton.dataset.houseWall; save(); render(true); return; }
    const floorButton = event.target.closest('[data-house-floor]'); if (floorButton) { areaData().roomStyle.floor = floorButton.dataset.houseFloor; save(); render(true); return; }
    const furnitureButton = event.target.closest('[data-house-furniture]'); if (furnitureButton && !furnitureButton.dataset.houseDragged) { selectedFurnitureId = furnitureButton.dataset.houseFurniture; page = 'room'; render(); return; }
    const removeButton = event.target.closest('[data-house-remove]'); if (removeButton) { const data = home(); const ownedId = removeButton.dataset.houseRemove; const roomData = areaData(); roomData.placed = roomData.placed.filter(entry => entry.ownedId !== ownedId); Object.keys(data.equipped3d || {}).forEach(slot => { if (data.equipped3d[slot] === ownedId) delete data.equipped3d[slot]; }); if (selectedFurnitureId === ownedId) selectedFurnitureId = ''; save(); postFurnishing(); flash('家具已收回仓库'); return; }
    const recycleButton = event.target.closest('[data-house-recycle]'); if (recycleButton) { recycle(recycleButton.dataset.houseRecycle); return; }
  });
  app.addEventListener('click', event => {
    if (event.target.closest('[data-house-buy]')) return;
    const previewButton = event.target.closest('[data-house-preview-id]');
    const closeButton = event.target.closest('[data-house-preview-close]');
    if (!previewButton && !closeButton) return;
    event.preventDefault(); event.stopPropagation();
    if (previewButton) openShop3dPreview(previewButton.dataset.housePreviewId); else closeShop3dPreview();
  }, true);
  document.addEventListener('input', event => { if (!app.classList.contains('is-open')) return; const config = workConfig(); if (event.target.matches('[data-house-time-rate]')) { config.timeRate = Number(event.target.value); const label = app.querySelector('[data-house-time-label]'); if (label) label.textContent = `${Math.round(config.timeRate * 100)}%`; save(); } if (event.target.matches('[data-house-reward-rate]')) { config.rewardRate = Number(event.target.value); const label = app.querySelector('[data-house-reward-label]'); if (label) label.textContent = `${Math.round(config.rewardRate * 100)}%`; save(); } });
  document.addEventListener('pointerdown', event => { const target = event.target.closest('[data-house-furniture]'); const roomElement = target?.closest('[data-house-room]'); if (!target || !roomElement) return; const entry = areaData().placed.find(item => item.ownedId === target.dataset.houseFurniture); if (!entry) return; const rect = roomElement.getBoundingClientRect(); dragState = { target, entry, rect, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false }; target.setPointerCapture?.(event.pointerId); }, true);
  document.addEventListener('pointermove', event => { const drag = dragState; if (!drag || drag.pointerId !== event.pointerId) return; const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true; if (!drag.moved) return; drag.entry.x = Math.max(10, Math.min(90, (event.clientX - drag.rect.left) / drag.rect.width * 100)); drag.entry.y = Math.max(13, Math.min(87, (event.clientY - drag.rect.top) / drag.rect.height * 100)); drag.target.style.left = `${drag.entry.x}%`; drag.target.style.top = `${drag.entry.y}%`; event.preventDefault(); }, true);
  document.addEventListener('pointerup', event => { const drag = dragState; if (!drag || drag.pointerId !== event.pointerId) return; if (drag.moved) { selectedFurnitureId = drag.entry.ownedId; save(); drag.target.dataset.houseDragged = 'true'; setTimeout(() => delete drag.target.dataset.houseDragged, 100); } dragState = null; }, true);
  setInterval(() => { if (app.classList.contains('is-open') && (activeWork('user') || activeWork('role'))) refreshWorkProgress(); }, 1000);
  window.IdealMachineApps = window.IdealMachineApps || {};
  window.IdealMachineApps.jia = { name: '家' };
})();
