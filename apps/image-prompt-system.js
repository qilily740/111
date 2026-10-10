(() => {
  const library = window.IdealImagePromptLibrary;
  const unique = values => [...new Set(values.filter(value => typeof value === 'string' && value.trim()))];
  function classify(original) {
    // Inspect requested visual clauses, not personality notes, exclusions, or quoted prose.
    let text = String(original || '');
    const plan = text.match(/先阅读正文后确定的画面方案：([^\n]+)/);
    if (plan) text = plan[1];
    text = text.replace(/小懒猪|小馋猫|小狐狸|小太阳|白月光/g, '');
    text = text.split(/[\n。；;]/).filter(line => !/^(?:不要|禁止|避免|无|no\b|avoid\b|without\b)|昵称和比喻|仅当|外观参考|人物如出现|正文是事实依据/i.test(line.trim())).join('\n');
    text = text.replace(/(?:不要|不含|没有|不出现|without|avoid|no\b)[^，,\n]*/gi, '');
    text = text.replace(/(?:像|如同|好比|性格|昵称|绰号|比喻|nicknamed|personality|metaphor)[^，,\n]*/gi, '');
    const styles = [
      ['GRAPHIC', /平面设计|拼贴|海报|杂志封面|排版|collage|graphic design|poster|magazine cover/i],
      ['GAME3D', /\b3d\b|\bcgi\b|游戏(?:场景|美术|环境)|game (?:art|scene|environment)|三维|立体渲染/i],
      ['ANIME', /二次元|动漫|插画|漫画|anime|illustration|manga|水彩|油画|watercolor|oil painting/i]
    ];
    const style = styles.find(([, pattern]) => pattern.test(text));
    // Mixed or unusual explicitly specified media are ambiguous: global rules remain safe.
    if (styles.filter(([, pattern]) => pattern.test(text)).length > 1) return [];
    const result = style ? [style[0]] : [];
    const human = /男性|女性|男人|女人|男孩|女孩|人物|自拍|人像|合照|portrait|selfie|\b(?:man|woman|male|female|person|people)\b/i.test(text);
    if (!style && human) result.push('HUMAN');
    const environmental = [
      ['LANDSCAPE', /自然风景|山川|森林|海滩|山脉|瀑布|landscape|forest|beach|mountain|waterfall/i],
      ['ARCHITECTURE', /建筑|室内|客厅|卧室|咖啡厅|咖啡馆|architecture|interior|living room|bedroom|caf[eé]/i]
    ];
    // Illustration/collage modules preserve their medium; photographic material modules
    // can conflict with flat artwork. 3D may share relevant environment geometry rules.
    if (!style || style[0] === 'GAME3D') {
      environmental.forEach(([key, pattern]) => { if (pattern.test(text)) result.push(key); });
    }
    if (!style && human && /(?:吃|品尝|端着|拿着|eating|holding)[^，,\n]*(?:蛋糕|甜品|食物|cake|dessert|food)/i.test(text)) result.push('FOOD');
    if (!style && !human) {
      if (/蛋糕|甜品|食物|料理|面包|cake|dessert|food|bread|pastry/i.test(text)) result.push('FOOD');
      else if (/商品|产品|物品|手表|香水|手机|花束|product|object|watch|perfume|bouquet/i.test(text)) result.push('PRODUCT');
    }
    return unique(result);
  }
  function assemble(original, options = {}) {
    const raw = String(original || '');
    if (!raw.trim()) throw new Error('缺少生图提示词');
    const task = options.task || 'text';
    // Local edits apply only global rules to the requested area; identity/reference
    // constraints outrank beauty rules. This context does not add transport support.
    const categories = task === 'edit' || task === 'reference' ? [] : classify(raw);
    const guard = 'Explicit user requirements override enhancements, including intentional fatigue, aging, illness and artistic effects.';
    const taskGuard = task === 'edit' ? 'Apply enhancements only inside the explicitly requested edit region. Preserve all other pixels, layout and identity.' : task === 'reference' ? 'Preserve all reference features requested by the user; skip enhancements that alter reference consistency.' : task === 'style' ? 'The explicitly requested target medium takes priority over all enhancement language.' : '';
    // Classification happens locally; do not send its examples/instructions to the provider.
    // Read only the selected category blocks from the complete, unchanged library.
    const positive = unique([raw, guard, taskGuard, library.GLOBAL_POSITIVE, ...categories.map(key => library[`${key}_POSITIVE`]), options.positivePrompt]).join('\n\n');
    const negative = unique([library.GLOBAL_NEGATIVE, ...categories.map(key => library[`${key}_NEGATIVE`]), options.negativePrompt, options.extraNegativePrompt]).join('\n\n');
    return { categories, positive, negative, prompt: options.separateNegative ? positive : `${positive}\n\nAvoid the following only when they are unintended and do not conflict with explicit user requirements:\n${negative}` };
  }
  window.IdealImagePromptSystem = Object.freeze({ classify, assemble });
})();
