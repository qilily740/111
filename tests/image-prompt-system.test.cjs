const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const context = vm.createContext({window:{}});
vm.runInContext(read('apps/image-prompt-library.js'), context);
vm.runInContext(read('apps/image-prompt-system.js'), context);
const system = context.window.IdealImagePromptSystem;
for (const [prompt, expected] of [
 ['生成25岁年轻成年男性照片',['PEOPLE']],
 ['生成45岁成熟男性照片',['PEOPLE']],
 ['生成女性人像，疲惫、憔悴',['PEOPLE']],
 ['生成一个巧克力蛋糕',['NON_PEOPLE']],
 ['生成自然风景山川',['NON_PEOPLE']],
 ['生成建筑室内客厅',['NON_PEOPLE']],
 ['生成商品手表',['NON_PEOPLE']],
 ['生成男性吃蛋糕',['PEOPLE','NON_PEOPLE']],
 ['生成平面设计拼贴海报',['NON_PEOPLE']],
 ['生成二次元男性角色',['PEOPLE','NON_PEOPLE']],
 ['生成3D游戏场景，森林',['NON_PEOPLE']],
 ['生成女性人像，昵称小馋猫，性格像蛋糕一样甜',['PEOPLE']],
 ['生成真人男性在咖啡厅',['PEOPLE','NON_PEOPLE']],
 ['生成一只真实的猫',['NON_PEOPLE']],
 ['生成海报，蛋糕插画',['NON_PEOPLE']],
 ['生成女性人像，不要蛋糕和建筑',['PEOPLE']],
 ['请帮我画一下',['NON_PEOPLE']]
]) test(prompt, () => {
 const assembled = system.assemble(prompt);
 assert.deepEqual(Array.from(assembled.categories), expected);
 assert.ok(assembled.prompt.startsWith(prompt+'\n'));
 for (const key of ['SHARED_POSITIVE','SHARED_NEGATIVE']) assert.equal(assembled.prompt.split(context.window.IdealImagePromptLibrary[key]).length-1,1);
 assert.equal(assembled.positive.includes('[PEOPLE POSITIVE]'),expected.includes('PEOPLE'));
 assert.equal(assembled.positive.includes('[NON-PEOPLE POSITIVE]'),expected.includes('NON_PEOPLE'));
});
test('new TXT preserved verbatim and all seven rule blocks load independently', () => {
 const source = read('config/image-prompts.txt');
 assert.equal(source,fs.readFileSync('/Users/qiliy/Desktop/GPT生图提示词_人物与非人物_精简修订版.txt','utf8'));
 const library = context.window.IdealImagePromptLibrary;
 assert.equal(Object.keys(library).length,7);
 for (const block of Object.values(library)) assert.ok(source.includes(block));
 assert.ok(!library.SHARED_POSITIVE.includes('[SHARED NEGATIVE]'));
 assert.ok(!library.PEOPLE_POSITIVE.includes('[PEOPLE NEGATIVE]'));
});
for(const task of ['reference','edit','style']) test(task+' task constraints',()=>{
 const assembled=system.assemble('二次元女性，仅修改左上角', {task});
 assert.ok(assembled.prompt.startsWith('二次元女性，仅修改左上角'));
 if(task!=='style') assert.equal(assembled.categories.length,0);
 assert.match(assembled.prompt,task==='edit'?/limit changes to the requested scope/:task==='reference'?/reference features and consistency/:/target medium and style/);
});
test('shared generate path preserves parameters and sends only selected two-category prompts', async()=>{
 const requests=[];
 const runtime=vm.createContext({window:{...context.window, IdealMachinePutImage:async()=> 'asset:test'},localStorage:{getItem:()=>null},location:{href:'https://example.org',protocol:'https:'},Headers,URL,Blob,navigator:{onLine:true},fetch:async(url,options)=>{
  if(options.method==='POST'){requests.push(JSON.parse(options.body));return new Response(JSON.stringify({data:[{b64_json:'YQ=='}]}));}
  return new Response(new Blob(['image'],{type:'image/png'}));
 }});
 let source=read('apps/shengtu.js');
 source=source.slice(0,source.indexOf('  function canAutoGenerate'));
 const generateEnd=source.indexOf('\n  }',source.indexOf('  async function generate('))+5;
 vm.runInContext(source.slice(0,generateEnd)+'\nwindow.generateForTest=generate;})();',runtime);
 for(const protocol of ['openai','extended']) await runtime.window.generateForTest({prompt:'生成二次元男性',config:{endpoint:'https://example.org/v1',key:'test',model:'selected-model',protocol,quality:'high'},size:'768x1024',count:2});
 assert.equal(requests.length,2);
 for(const body of requests){assert.equal(body.model,'selected-model');assert.equal(body.size,'768x1024');assert.equal(body.n,2);assert.equal(body.quality,'high');assert.ok(body.prompt.startsWith('生成二次元男性'));assert.match(body.prompt,/\[PEOPLE POSITIVE\]/);assert.match(body.prompt,/\[NON-PEOPLE POSITIVE\]/);}
 assert.equal(requests[0].negative_prompt,undefined);
 assert.match(requests[0].prompt,/SHARED NEGATIVE/);
 assert.match(requests[1].negative_prompt,/SHARED NEGATIVE/);
 assert.doesNotMatch(requests[1].prompt,/SHARED NEGATIVE/);
 assert.equal(requests[1].width,768);
 assert.equal(requests[1].height,1024);
});
