import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';

const db = new DatabaseSync(':memory:');
for (const file of ['0001_repository.sql', '0002_profile_saved.sql', '0003_google_drive.sql', '0003_personal_profile.sql', '0005_profile_avatar.sql', '0010_post_preview_image.sql']) {
  db.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
}
const statement = (sql, args) => {
  const stmt = db.prepare(sql);
  return { first:async()=>stmt.get(...args), all:async()=>({results:stmt.all(...args)}), run:async()=>stmt.run(...args) };
};
const env = {
  DB:{
    prepare(sql) { return { bind(...args) { return statement(sql, args); } }; },
    async batch(statements) { return Promise.all(statements.map(item => item.run())); }
  },
  GOOGLE_CLIENT_ID:'test-client', GOOGLE_CLIENT_SECRET:'test-secret', GOOGLE_REFRESH_TOKEN:'test-refresh', GOOGLE_DRIVE_FOLDER_ID:'test-folder',
  AUTH:{fetch:async()=>Response.json({user:{id:'user-one',username:'author'}})}
};
let uploadNumber = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async input => {
  const url = String(input);
  if (url === 'https://oauth2.googleapis.com/token') return Response.json({access_token:'test-access'});
  if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files?')) return Response.json({id:`drive-file-${++uploadNumber}`});
  throw new Error(`Unexpected fetch: ${url}`);
};
const request = form => worker.fetch(new Request('https://test.local/api/posts', {
  method:'POST', headers:{Authorization:'Bearer test-token'}, body:form
}), env);

test('beauty post preview image is stored as a marked attachment and is not a substitute for its source', async () => {
  try {
    const previewOnly = new FormData();
    previewOnly.set('channel','beauty'); previewOnly.set('title','预览图测试');
    previewOnly.set('preview',new File([new Uint8Array([0x89,0x50,0x4e,0x47])],'preview.png',{type:'image/png'}));
    assert.equal((await request(previewOnly)).status,400);

    const form = new FormData();
    form.set('channel','beauty'); form.set('title','预览图测试'); form.set('codeText','IDEAL-CHA-12345');
    form.set('preview',new File([new Uint8Array([0x89,0x50,0x4e,0x47])],'preview.png',{type:'image/png'}));
    const created = await request(form);
    assert.equal(created.status,201);
    const {id} = await created.json();
    const listed = await worker.fetch(new Request('https://test.local/api/posts?channel=beauty',{headers:{Authorization:'Bearer test-token'}}),env);
    const post = (await listed.json()).posts.find(item=>item.id===id);
    assert.equal(post.attachments.length,1);
    assert.equal(post.attachments[0].isPreview,true);
    assert.equal(post.attachments[0].name,'preview.png');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
