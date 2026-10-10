const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../apps/liaotian.js'), 'utf8');
function setup() {
  const context = vm.createContext({ quoteMessageText:message => message.text, quoteMessageSpeaker:() => '用户' });
  const sections = [
    ['  function normalizeCharacterControlMarkers(', '  function isCharacterChatMessage('],
    ['  function characterQuoteFromMarker(', '  function parseCharacterVoiceParts(']
  ];
  for (const [start, end] of sections) vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))), context);
  return context;
}
const chat = { messages:[{ id:'message-1', role:'user', text:'原始消息内容' }] };
test('quote variants resolve the actual message and leave only reply text', () => {
  const api = setup();
  for (const marker of ['[[QUOTE id="message-1"]]', '[[ QUOTE id = “message-1” ]]', '［［quote message_id=message-1］］', '[[QUOTE:message-1]]', '[[QUOTE message-id=message-1]][[/QUOTE]]']) {
    const result = api.parseCharacterQuoteMarker(marker + '收到', chat);
    assert.equal(result.quote?.id, 'message-1', marker);
    assert.equal(result.quote?.text, '原始消息内容', marker);
    assert.equal(result.clean.trim(), '收到', marker);
  }
});
test('unresolved and truncated quote controls never leak into the bubble', () => {
  const api = setup();
  assert.equal(api.parseCharacterQuoteMarker('[[ QUOTE id="missing" ]]收到', chat).quote, null);
  assert.equal(api.cleanCharacterVisibleText('[[ QUOTE id="missing" ]]收到[[ /QUOTE ]]'), '收到');
  assert.equal(api.cleanCharacterVisibleText('收到[[ QUOTE id="missing"'), '收到');
});
