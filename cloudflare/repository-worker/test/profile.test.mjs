import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';
const db = new DatabaseSync(':memory:');
for(const file of ['0001_repository.sql','0002_profile_saved.sql','0003_personal_profile.sql'])db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
const env={DB:{prepare(sql){const stmt=db.prepare(sql);return {bind(...args){return {first:async()=>stmt.get(...args),all:async()=>({results:stmt.all(...args)}),run:async()=>stmt.run(...args)}}}}},AUTH:{fetch:async(_url,options)=>Response.json({user:{id:options.headers.Authorization.split(' ')[1],username:'immutable',createdAt:1743217200000}})}};
const request=(user,path,body)=>worker.fetch(new Request('https://test.local'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
test('profile saves privately per authenticated user and preserves registration date',async()=>{
const response=await request('one','/api/me/profile',{nickname:'昵称',bio:'介绍',note:'私密备注'});assert.equal(response.status,200);assert.equal((await response.json()).profile.createdAt,1743217200000);
assert.equal((await (await request('two','/api/me/profile')).json()).profile.note,'');
assert.equal((await (await request('one','/api/me/profile')).json()).profile.note,'私密备注');
await request('one','/api/me/profile',{nickname:'改名'});assert.equal((await (await request('one','/api/me/profile')).json()).profile.note,'私密备注');
});
test('rejects account and date edits, invalid field types, and blank nickname',async()=>{
for(const body of [{username:'changed'},{createdAt:Date.now()},{user_id:'two'},{nickname:' '},{note:12},{bio:'x'.repeat(1001)}])assert.equal((await request('one','/api/me/profile',body)).status,400);
});
test('likes contain only this account likes, newest first and paginate',async()=>{
for(let i=0;i<32;i++){
db.prepare('INSERT INTO posts (id,channel,author_id,author_name,title,body,code_text,tags_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run('p'+i,'beauty','author','作者','作品'+i,'','','[]',i,i);
db.prepare('INSERT INTO post_likes (post_id,user_id,created_at) VALUES (?,?,?)').run('p'+i,'one',i);
}
const first=await (await request('one','/api/me/likes')).json();assert.equal(first.posts.length,30);assert.equal(first.posts[0].id,'p31');assert.equal(first.hasMore,true);
const last=await (await request('one','/api/me/likes?offset=30')).json();assert.equal(last.posts.length,2);assert.equal(last.hasMore,false);
assert.equal((await (await request('two','/api/me/likes')).json()).posts.length,0);
db.prepare('DELETE FROM post_likes WHERE user_id=? AND post_id=?').run('one','p31');assert.equal((await (await request('one','/api/me/likes')).json()).posts[0].id,'p30');
});
