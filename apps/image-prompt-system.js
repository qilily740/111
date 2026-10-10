(() => {
  const library = window.IdealImagePromptLibrary;
  const unique = values => [...new Set(values.filter(value => typeof value === 'string' && value.trim()))];
  function classify(original) {
    let text = String(original || '');
    const plan = text.match(/先阅读正文后确定的画面方案：([^\n]+)/);
    if (plan) text = plan[1];
    text = text
      .replace(/小懒猪|小馋猫|小狐狸|小太阳|白月光/g, '')
      .split(/[\n。；;]/)
      .filter(line => !/^(?:不要|禁止|避免|无|no\b|avoid\b|without\b)|昵称和比喻|仅当|外观参考|人物如出现|正文是事实依据/i.test(line.trim()))
      .join('\n')
      .replace(/(?:不要|不含|没有|不出现|without|avoid|no\b)[^，,\n]*/gi, '')
      .replace(/(?:像|如同|好比|性格|昵称|绰号|比喻|nicknamed|personality|metaphor)[^，,\n]*/gi, '');
    const people = /男性|女性|男人|女人|男孩|女孩|男生|女生|男士|女士|少年|少女|人物|自拍|人像|合照|portrait|selfie|\b(?:man|woman|male|female|person|people|human)\b/i.test(text);
    const nonPeople = /蛋糕|甜品|食物|料理|面包|咖啡|商品|产品|物品|手表|香水|手机|花束|宠物|动物|猫|狗|房间|室内|建筑|咖啡厅|咖啡馆|风景|森林|海滩|山脉|瀑布|海边|城市|街道|家居|家具|植物|花朵|水果|饮料|插画|二次元|动漫|海报|拼贴|平面设计|3d|游戏场景|\bcake|dessert|food|bread|coffee|product|object|watch|perfume|phone|bouquet|animal|cat|dog|interior|architecture|landscape|forest|beach|mountain|waterfall|city|street|furniture|plant|flower|fruit|drink|illustration|anime|poster|collage|graphic design|game scene\b/i.test(text);
    if (people && nonPeople) return ['PEOPLE', 'NON_PEOPLE'];
    if (people) return ['PEOPLE'];
    return ['NON_PEOPLE'];
  }
  function assemble(original, options = {}) {
    const raw = String(original || '');
    if (!raw.trim()) throw new Error('缺少生图提示词');
    const task = options.task || 'text';
    const categories = task === 'edit' || task === 'reference' ? [] : classify(raw);
    const guard = 'Explicit user requirements and reference constraints take priority over all quality guidance.';
    const taskGuard = task === 'edit' ? 'Preserve untouched areas and limit changes to the requested scope.' : task === 'reference' ? 'Preserve requested reference features and consistency.' : task === 'style' ? 'Follow the explicitly requested target medium and style.' : '';
    const positive = unique([raw, guard, taskGuard, library.SHARED_POSITIVE, ...categories.map(key => library[`${key}_POSITIVE`]), options.positivePrompt]).join('\n\n');
    const negative = unique([library.SHARED_NEGATIVE, ...categories.map(key => library[`${key}_NEGATIVE`]), options.negativePrompt, options.extraNegativePrompt]).join('\n\n');
    return { categories, positive, negative, prompt: options.separateNegative ? positive : `${positive}\n\nAvoid the following only when they are unintended and do not conflict with explicit user requirements:\n${negative}` };
  }
  window.IdealImagePromptSystem = Object.freeze({ classify, assemble });
})();
