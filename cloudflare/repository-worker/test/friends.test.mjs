import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';

const db = new DatabaseSync(':memory:');
for (const file of ['0001_repository.sql', '0002_profile_saved.sql', '0003_google_drive.sql', '0003_personal_profile.sql', '0004_friends.sql', '0005_profile_avatar.sql']) {
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
  GOOGLE_CLIENT_ID:'test-client', GOOGLE_CLIENT_SECRET:'test-secret', GOOGLE_REFRESH_TOKEN:'test-refresh',
  AUTH:{ async fetch(url, options) {
    if (url.endsWith('/auth/authorize')) {
      const token = options.headers.Authorization.split(' ')[1];
      const user = accounts.find(a=>a.id===token) || accounts[0];
      return Response.json({user});
    }
    if (url.includes('/auth/users/search?')) {
      const q = new URL(url).searchParams.get('q');
      const token = options.headers.Authorization.split(' ')[1];
      return Response.json({users:accounts.filter(a=>a.username.toLowerCase()===q.toLowerCase() && a.id!==token)});
    }
    return Response.json({error:'NOT_FOUND'}, {status:404});
  } }
};
const requestAs = (token, path, body, method) => {
  const isForm = body instanceof FormData;
  return worker.fetch(new Request('https://test.local'+path, {
    method:method || (body ? 'POST' : 'GET'), headers:{Authorization:`Bearer ${token}`, ...(isForm ? {} : {'Content-Type':'application/json'})},
    ...(body ? {body:isForm ? body : JSON.stringify(body)} : {})
  }), env);
};
const request = (path, body) => requestAs('user-alice', path, body);

test('friend lookup requires the exact immutable Ideal ID and includes public profile details', async () => {
  db.prepare('INSERT INTO repository_profiles (user_id,nickname) VALUES (?,?)').run('user-bob','小狗爱你');
  const exact = await request('/api/users/search?q=bob_ideal');
  assert.equal(exact.status, 200);
  const [bob] = (await exact.json()).users;
  assert.equal(bob.id, 'user-bob');
  assert.equal(bob.nickname, '小狗爱你');
  assert.equal(bob.avatarUrl, '');
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

test('profile avatar upload and reads are authenticated and expose only an API path', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options={}) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({access_token:'test-access'});
    if (url.startsWith('https://www.googleapis.com/drive/v3/files?fields=id')) return Response.json({id:'test-folder'});
    if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files?')) return Response.json({id:'avatar-file'});
    if (url === 'https://www.googleapis.com/drive/v3/files/avatar-file?alt=media') return new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]), {headers:{'Content-Type':'image/jpeg'}});
    if (url.startsWith('https://www.googleapis.com/drive/v3/files/')) return new Response(null, {status:204});
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const form = new FormData();
    form.set('avatar', new File([new Uint8Array([0xff,0xd8,0xff,0xd9])], 'avatar.jpg', {type:'image/jpeg'}));
    const uploaded = await requestAs('user-bob','/api/me/avatar',form);
    assert.equal(uploaded.status, 200);
    assert.equal((await uploaded.json()).avatarUrl, '/api/users/user-bob/avatar');
    const search = await request('/api/users/search?q=bob_ideal');
    assert.equal((await search.json()).users[0].avatarUrl, '/api/users/user-bob/avatar');
    const image = await request('/api/users/user-bob/avatar');
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('Content-Type'), 'image/jpeg');
    assert.deepEqual([...new Uint8Array(await image.arrayBuffer())], [0xff,0xd8,0xff,0xd9]);
  } finally { globalThis.fetch = originalFetch; }
});
