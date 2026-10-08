import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';

const db = new DatabaseSync(':memory:');
for (const file of ['0001_repository.sql', '0003_personal_profile.sql', '0004_friends.sql']) {
  db.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
}
const accounts = [
  { id:'user-alice', username:'alice' },
  { id:'user-bob', username:'bob_ideal' }
];
const env = {
  DB:{ prepare(sql) { const stmt = db.prepare(sql); return { bind(...args) { return {
    first:async()=>stmt.get(...args), all:async()=>({results:stmt.all(...args)}), run:async()=>stmt.run(...args)
  }; } }; } },
  AUTH:{ async fetch(url, options) {
    if (url.endsWith('/auth/authorize')) return Response.json({user:{id:'user-alice',username:'alice'}});
    if (url.includes('/auth/users/search?')) {
      const q = new URL(url).searchParams.get('q');
      return Response.json({users:accounts.filter(a=>a.username.toLowerCase()===q.toLowerCase() && a.id!=='user-alice')});
    }
    return Response.json({error:'NOT_FOUND'}, {status:404});
  } }
};
const request = (path, body) => worker.fetch(new Request('https://test.local'+path, {
  method:body ? 'POST' : 'GET', headers:{Authorization:'Bearer session', 'Content-Type':'application/json'},
  ...(body ? {body:JSON.stringify(body)} : {})
}), env);

test('friend lookup requires the exact immutable Ideal ID', async () => {
  const exact = await request('/api/users/search?q=bob_ideal');
  assert.equal(exact.status, 200);
  assert.deepEqual((await exact.json()).users.map(user=>user.id), ['user-bob']);
  const partial = await request('/api/users/search?q=bob');
  assert.equal((await partial.json()).users.length, 0);
});

test('friend request accepts accountId and stores immutable user IDs', async () => {
  const response = await request('/api/me/friends/requests', {accountId:'bob_ideal'});
  assert.equal(response.status, 201);
  const row = db.prepare('SELECT from_user_id, to_user_id, to_username, status FROM friend_requests').get();
  assert.deepEqual({...row}, {from_user_id:'user-alice', to_user_id:'user-bob', to_username:'bob_ideal', status:'pending'});
  assert.equal((await request('/api/me/friends/requests', {username:'bob_ideal'})).status, 400);
});
