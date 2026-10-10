const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function setup(handler, proxy = false) {
  const calls = [];
  const context = vm.createContext({
    window: {
      IdealMachineConfig: proxy ? {repositoryApiBase:'https://ideal.example/api/repository'} : {},
      IdealMachineAuth: {getToken:()=>proxy ? 'session' : ''},
      IdealImagePromptSystem: {assemble:()=>({prompt:'image description',negative:'unwanted artifacts'})},
      IdealMachinePutImage: async()=> 'asset:test'
    },
    localStorage:{getItem:()=>null},location:{href:'https://ideal.example/',protocol:'https:'},
    Headers, URL, Blob, TypeError,
    fetch:async(url, options)=> {
      if(options.method==='GET') return new Response(new Blob(['image'],{type:'image/png'}));
      calls.push({url, ...options});
      return handler(url, options, calls.length);
    }
  });
  const source=fs.readFileSync(path.join(__dirname,'../apps/shengtu.js'),'utf8');
  vm.runInContext(source.slice(0,source.indexOf('  function canAutoGenerate'))+'window.generate=generate;})();',context);
  return {calls, run:()=>context.window.generate({prompt:'cake',config:{endpoint:'https://provider.example/v1',model:'selected',key:'secret'}})};
}
const success=()=>new Response(JSON.stringify({data:[{b64_json:'YQ=='}]}));
test('authenticated generation uses proxy once and keeps provider parameters',async()=>{
 const {calls,run}=setup(success,true);await run();
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://ideal.example/api/repository/api/image-proxy');
 assert.equal(calls[0].headers.get('X-Ideal-Target-URL'),'https://provider.example/v1/images/generations');
 assert.equal(calls[0].headers.get('Authorization'),'Bearer secret');
 assert.equal(calls[0].headers.get('X-Ideal-Authorization'),'Bearer session');
 assert.equal(calls[0].timeout,600000);
});
for(const status of [502,504,524]) test(`HTTP ${status} is reported without resubmitting`,async()=>{
 const {calls,run}=setup(()=>new Response('gateway timeout',{status}),true);
 await assert.rejects(run(),new RegExp(`HTTP ${status}.*安全代理`));assert.equal(calls.length,1);
});
test('opaque network failure does not replay a possibly accepted job',async()=>{
 const {calls,run}=setup(()=>{throw new TypeError('Failed to fetch');});
 await assert.rejects(run(),/连接中断.*直连/);assert.equal(calls.length,1);
});
test('local timeout is distinguished from gateway HTTP timeout',async()=>{
 const {calls,run}=setup(()=>{throw Object.assign(new Error('timeout'),{name:'TimeoutError'});});
 await assert.rejects(run(),/生图等待超时.*客户端/);assert.equal(calls.length,1);
});
test('proxy authorization rejection can fall back before submitting a job',async()=>{
 const {calls,run}=setup((url,options,n)=>n===1?new Response('{"error":"UNAUTHORIZED"}',{status:401}):success(),true);
 await run();assert.equal(calls.length,2);assert.equal(calls[1].url,'https://provider.example/v1/images/generations');
});
test('response_format rejection retries only the unsupported field',async()=>{
 const {calls,run}=setup((url,options,n)=>n===1?new Response('{"error":{"message":"unsupported response_format"}}',{status:400}):success());
 await run();assert.equal(calls.length,2);assert.equal(JSON.parse(calls[1].body).response_format,undefined);
});
test('unrelated parameter rejection is not blindly retried',async()=>{
 const {calls,run}=setup(()=>new Response('{"error":{"message":"unsupported parameter size"}}',{status:400}));
 await assert.rejects(run(),/HTTP 400/);assert.equal(calls.length,1);
});
