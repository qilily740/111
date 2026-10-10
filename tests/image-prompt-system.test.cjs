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
 ['生成25岁年轻成年男性照片',['HUMAN']],
 ['生成45岁成熟男性照片',['HUMAN']],
 ['生成女性人像，疲惫、憔悴',['HUMAN']],
 ['生成一个巧克力蛋糕',['FOOD']],
 ['生成自然风景山川',['LANDSCAPE']],
 ['生成建筑室内客厅',['ARCHITECTURE']],
 ['生成商品手表',['PRODUCT']],
 ['生成男性吃蛋糕',['HUMAN','FOOD']],
 ['生成平面设计拼贴海报',['GRAPHIC']],
 ['生成二次元男性角色',['ANIME']],
 ['生成3D游戏场景，森林',['GAME3D','LANDSCAPE']],
 ['生成女性人像，昵称小馋猫，性格像蛋糕一样甜',['HUMAN']],
 ['生成真人男性在咖啡厅',['HUMAN','ARCHITECTURE']],
 ['生成一只真实的猫',[]],
 ['生成海报，蛋糕插画',[]],
 ['生成女性人像，不要蛋糕和建筑',['HUMAN']],
 ['请帮我画一下',[]]
]) test(prompt, () => {
 const assembled = system.assemble(prompt);
 assert.deepEqual(Array.from(assembled.categories), expected);
 assert.ok(assembled.prompt.startsWith(prompt+'\n'));
 for (const key of ['GLOBAL_POSITIVE','GLOBAL_NEGATIVE']) assert.equal(assembled.prompt.split(context.window.IdealImagePromptLibrary[key]).length-1,1);
 if (expected.includes('ANIME') || expected.includes('GAME3D')) assert.ok(!assembled.positive.includes('[REALISTIC HUMAN PORTRAIT]'));
});
test('TXT blocks preserved verbatim', () => {
 const source = read('config/image-prompts.txt');
 const blocks = source.split('='.repeat(60)).filter((_, index) => index > 1 && index % 2 === 0 && index < source.split('='.repeat(60)).length - 1).map(block => block.replace(/^\n+|\n+$/g, ''));
 assert.deepEqual(Object.values(context.window.IdealImagePromptLibrary), blocks);
 for (const block of Object.values(context.window.IdealImagePromptLibrary)) assert.ok(source.includes(block));
 assert.equal(Object.keys(context.window.IdealImagePromptLibrary).length,19);
});
for(const task of ['reference','edit','style']) test(task+' task constraints',()=>{
 const assembled=system.assemble('二次元女性，仅修改左上角', {task});
 assert.ok(assembled.prompt.startsWith('二次元女性，仅修改左上角'));
 if(task!=='style') assert.equal(assembled.categories.length,0);
 assert.match(assembled.prompt,task==='edit'?/all other pixels/:task==='reference'?/reference consistency/:/target medium/);
});
test('real shared generate path preserves parameters, separates negatives, one POST per generation', async()=>{
 const requests=[];
 const runtime=vm.createContext({window:{...context.window, IdealMachinePutImage:async()=> 'asset:test'},localStorage:{getItem:()=>null},location:{href:'https://example.org',protocol:'https:'},Headers,URL,Blob,navigator:{onLine:true},fetch:async(url,options)=>{
  if(options.method==='POST'){requests.push(JSON.parse(options.body));return new Response(JSON.stringify({data:[{b64_json:'YQ=='}]}));}
  return new Response(new Blob(['image'],{type:'image/png'}));
 }});
 let source=read('apps/shengtu.js');
 source=source.slice(0,source.indexOf('  function canAutoGenerate'));
 // Only load the actual shared request functions, excluding unrelated settings UI.
 const generateEnd=source.indexOf('\n  }',source.indexOf('  async function generate('))+5;
 vm.runInContext(source.slice(0,generateEnd)+'\nwindow.generateForTest=generate;})();',runtime);
 for(const protocol of ['openai','extended']) await runtime.window.generateForTest({prompt:'生成二次元男性',config:{endpoint:'https://example.org/v1',key:'test',model:'selected-model',protocol,quality:'high'},size:'768x1024',count:2});
 assert.equal(requests.length,2);
 for(const body of requests){assert.equal(body.model,'selected-model');assert.equal(body.size,'768x1024');assert.equal(body.n,2);assert.equal(body.quality,'high');assert.ok(body.prompt.startsWith('生成二次元男性'));}
 assert.equal(requests[0].negative_prompt,undefined);
 assert.match(requests[0].prompt,/GLOBAL NEGATIVE/);
 assert.match(requests[1].negative_prompt,/GLOBAL NEGATIVE/);
 assert.doesNotMatch(requests[1].prompt,/GLOBAL NEGATIVE/);
 assert.equal(requests[1].width,768);
 assert.equal(requests[1].height,1024);
});
