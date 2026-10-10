const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../apps/liaotian.js'), 'utf8');
function setup() {
  const context = vm.createContext({esc:String});
  const start = source.indexOf('  function chatImageRetryState(');
  vm.runInContext(source.slice(start, source.indexOf('  async function generateCharacterChatImage(', start)), context);
  return context;
}
test('one retry stays beside the latest character message after a user message and moves on a new reply', () => {
  const api = setup();
  const chat = {messages:[{id:'old',role:'character',imageGenerationRetryPrompt:'old image'}, {id:'latest',role:'character',imageGenerationRetryPrompt:'new image'}]};
  chat.messages.push({id:'user',role:'user'});
  assert.equal(api.chatImageRetryState(chat).anchor.id, 'latest');
  assert.equal(chat.messages.map(message => api.chatImageRetryMarkup(message,chat)).filter(Boolean).length,1);
  chat.messages.push({id:'reply',role:'character'});
  assert.equal(api.chatImageRetryMarkup(chat.messages[1],chat),'');
  assert.match(api.chatImageRetryMarkup(chat.messages[3],chat), /data-chat-image-retry="latest"/);
  api.clearChatImageRetryState(chat);
  assert.equal(chat.messages.map(message => api.chatImageRetryMarkup(message,chat)).filter(Boolean).length,0);
});
