const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const source = fs.readFileSync(require('node:path').join(__dirname, '../apps/ideal-repository.js'), 'utf8');
  const storage = new Map();
  const pending = [];
  const context = vm.createContext({
    Date, JSON, sessionStorage: { getItem:key => storage.get(key), setItem:(key,value) => storage.set(key,value) },
    requestApi:() => new Promise(resolve => pending.push(resolve)),
    render() {}, root: { querySelector:() => null }
  });
  vm.runInContext(`let account = 'alice'; const accountStorageId = () => account;
    let chatList = [], chatListLoadedAt = 0, chatListPromise = null, chatListBusy = false, chatListSerial = 0, chatListLoaded = false, chatStatus = '';
    let screen = 'friends', friendPanel = '', friendsTab = 'inbox';
    ${source.slice(source.indexOf('  // Short-lived,'), source.indexOf('  function stopChatPolling'))}
    globalThis.api = { loadChats, readChatCache, writeChatCache, liveChatMessages,
      list:() => chatList, busy:() => chatListBusy,
      switchAccount() { account = 'bob'; ++chatListSerial; chatListBusy = false; chatListLoadedAt = 0; chatListPromise = null; chatListLoaded = false; chatList = []; }
    };`, context);
  return { api:context.api, pending };
}

test('cached inbox appears before the response and duplicate requests are avoided', async () => {
  const { api, pending } = setup();
  api.writeChatCache('list', [{ userId:'bob', lastMessageAt:Date.now(), lastMessage:'cached' }]);
  const request = api.loadChats();
  assert.equal(api.list()[0].lastMessage, 'cached');
  await api.loadChats();
  assert.equal(pending.length, 1);
  pending[0]({ chats:[{ userId:'bob', lastMessageAt:Date.now(), lastMessage:'fresh' }] });
  await request;
  assert.equal(api.list()[0].lastMessage, 'fresh');
  assert.equal(api.busy(), false);
});

test('account changes isolate cache and ignore the previous account response', async () => {
  const { api, pending } = setup();
  api.writeChatCache('list', [{ userId:'bob', lastMessageAt:Date.now() }]);
  const oldRequest = api.loadChats();
  api.switchAccount();
  assert.equal(api.readChatCache('list'), null);
  const newRequest = api.loadChats();
  pending[0]({ chats:[{ userId:'private-alice-chat' }] });
  await oldRequest;
  assert.equal(api.list().length, 0);
  assert.equal(api.busy(), true);
  pending[1]({ chats:[] });
  await newRequest;
  assert.equal(api.busy(), false);
});

test('expired cached messages and quoted bodies are hidden', () => {
  const { api } = setup();
  const expired = Date.now() - 8 * 86400000;
  const messages = api.liveChatMessages([
    { id:'expired', createdAt:expired },
    { id:'live', createdAt:Date.now(), replyCreatedAt:expired, replyBody:'expired quote' }
  ]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].replyBody, null);
});
