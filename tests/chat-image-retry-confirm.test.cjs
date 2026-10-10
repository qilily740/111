const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../apps/liaotian.js'),'utf8');
test('failed image confirmation retries only when accepted and retains original context', async () => {
  let accepted=false, calls=0, argumentsUsed;
  const context=vm.createContext({window:{confirm:()=>accepted},generateCharacterChatImage:(...args)=>{calls++;argumentsUsed=args;return true;}});
  const start=source.indexOf('  async function confirmCharacterImageRetry(');
  vm.runInContext(source.slice(start,source.indexOf('  function clearChatImageRetryState(',start)),context);
  const chat={}, contact={}, message={};
  assert.equal(await context.confirmCharacterImageRetry('失败','画面',chat,contact,message),false);
  assert.equal(calls,0);
  accepted=true;
  assert.equal(await context.confirmCharacterImageRetry('失败','画面',chat,contact,message),true);
  assert.equal(calls,1);
  assert.deepEqual(argumentsUsed,['画面',chat,contact,message]);
  assert.doesNotMatch(source,/data-chat-image-retry=/);
});
