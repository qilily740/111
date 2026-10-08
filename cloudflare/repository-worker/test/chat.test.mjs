import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';

const db = new DatabaseSync(':memory:');
for (const file of ['0001_repository.sql','0002_profile_saved.sql','0003_google_drive.sql','0003_personal_profile.sql','0004_friends.sql','0005_profile_avatar.sql','0006_direct_messages.sql','0007_chat_replies_blocks.sql']) {
  db.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
}
const accounts = [{id:'user-alice',username:'alice'},{id:'user-bob',username:'bob_ideal'},{id:'user-stranger',username:'stranger'}];
const env = {
  DB:{prepare(sql) { const statement = db.prepare(sql); return {bind(...args) { return {
    first:async()=>statement.get(...args), all:async()=>({results:statement.all(...args)}), run:async()=>statement.run(...args)
  }; }}; }},
  AUTH:{async fetch(url, options) {
    if (!url.endsWith('/auth/authorize')) return Response.json({error:'NOT_FOUND'}, {status:404});
    const token = options.headers.Authorization.split(' ')[1];
    const user = accounts.find(account => account.id === token);
    return user ? Response.json({user}) : Response.json({error:'UNAUTHORIZED'}, {status:401});
  }}
};
const request = (userId,path,body,method) => worker.fetch(new Request(`https://test.local${path}`, {
  method:method || (body ? 'POST' : 'GET'), headers:{Authorization:`Bearer ${userId}`, 'Content-Type':'application/json'},
  ...(body ? {body:JSON.stringify(body)} : {})
}),env);
const makeFriends = () => db.prepare(`INSERT OR IGNORE INTO friend_requests
  (id,from_user_id,from_username,to_user_id,to_username,status,created_at,updated_at) VALUES (?,?,?,?,?,'accepted',?,?)`)
  .run('friendship-alice-bob','user-alice','alice','user-bob','bob_ideal',Date.now(),Date.now());

test('friends can send, list, and read direct messages with seven-day expiry', async () => {
  makeFriends();
  const sent = await request('user-alice','/api/me/chats/user-bob/messages',{text:'你好，好友'});
  assert.equal(sent.status,201);
  const payload = await sent.json();
  assert.equal(payload.message.body,'你好，好友');
  const stored = db.prepare('SELECT sender_id,recipient_id,expires_at,created_at FROM direct_messages WHERE id=?').get(payload.message.id);
  assert.equal(stored.sender_id,'user-alice');
  assert.equal(stored.recipient_id,'user-bob');
  assert.equal(stored.expires_at-stored.created_at,7*24*60*60*1000);

  const inbox = await (await request('user-bob','/api/me/chats')).json();
  assert.equal(inbox.chats[0].lastMessage,'你好，好友');
  assert.equal(inbox.chats[0].lastMessageSenderId,'user-alice');
  assert.equal(inbox.chats[0].unreadCount,1);
  const conversation = await (await request('user-bob','/api/me/chats/user-alice/messages')).json();
  assert.equal(conversation.messages[0].senderId,'user-alice');
  assert.equal(conversation.messages[0].body,'你好，好友');
  assert.equal((await (await request('user-bob','/api/me/chats')).json()).chats[0].unreadCount,0);
});

test('chat rejects non-friends, blank messages, and unsupported message fields', async () => {
  assert.equal((await request('user-alice','/api/me/chats/user-stranger/messages',{text:'hello'})).status,403);
  makeFriends();
  assert.equal((await request('user-alice','/api/me/chats/user-bob/messages',{text:'  '})).status,400);
  assert.equal((await request('user-alice','/api/me/chats/user-bob/messages',{text:'hi',attachment:'x'})).status,400);
  assert.equal((await request('user-alice','/api/me/chats/user-stranger/messages')).status,403);
});

test('chat supports replies and blocking prevents new messages until unblocked', async () => {
  makeFriends();
  const original = await (await request('user-alice','/api/me/chats/user-bob/messages',{text:'原消息'})).json();
  const replyResponse = await request('user-bob','/api/me/chats/user-alice/messages',{text:'回复',replyToId:original.message.id});
  assert.equal(replyResponse.status,201);
  const conversation = await (await request('user-alice','/api/me/chats/user-bob/messages')).json();
  const reply = conversation.messages.find(message => message.body === '回复');
  assert.equal(reply.replyToId,original.message.id);
  assert.equal(reply.replyBody,'原消息');
  assert.equal(reply.replyCreatedAt,original.message.createdAt);

  assert.equal((await request('user-alice','/api/me/blocks/user-bob',{},'POST')).status,200);
  assert.equal((await request('user-alice','/api/me/chats/user-bob/messages',{text:'不该发送'})).status,403);
  assert.equal((await (await request('user-alice','/api/me/chats')).json()).chats.length,0);
  assert.equal((await request('user-alice','/api/me/blocks/user-bob',null,'DELETE')).status,200);
  assert.equal((await request('user-alice','/api/me/chats/user-bob/messages',{text:'恢复聊天'})).status,201);
});

test('scheduled cleanup and read endpoints delete expired messages', async () => {
  makeFriends();
  db.prepare(`INSERT INTO direct_messages (id,sender_id,recipient_id,body,created_at,expires_at)
    VALUES ('expired-message','user-alice','user-bob','过期消息',?,?)`).run(Date.now()-8*24*60*60*1000,Date.now()-1);
  await worker.scheduled({},env);
  assert.equal(db.prepare('SELECT id FROM direct_messages WHERE id=?').get('expired-message'),undefined);
});
