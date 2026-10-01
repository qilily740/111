const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const calls = [];
  const config = { endpoint: 'https://main.example/v1', key: 'main-test-key' };
  const window = {
    fetch: async (input, init) => { calls.push({ input, init }); return new Response('{}'); },
    IdealMachineAPI: { getConfig: () => config, getModel: () => 'test-model' },
    addEventListener() {}
  };
  const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('  const nativeFetch ='), source.indexOf('  const assetDBPromise =')), {
    window, location: { href: 'https://ideal.example/', origin: 'https://ideal.example' },
    URL, Headers, Request, Response, AbortController, DOMException, FormData, Blob, setTimeout, clearTimeout
  });
  return { api: window.IdealMachineRequest, window, calls };
}

test('chat uses explicit credentials and retains messages and model', async () => {
  const { api, calls } = setup();
  await api.chat([{ role: 'user', content: 'hello' }], { endpoint: 'https://other.example/v1/chat/completions/', key: 'other-test-key' });
  assert.equal(calls[0].input, 'https://other.example/v1/chat/completions');
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer other-test-key');
  assert.deepEqual(JSON.parse(calls[0].init.body), { messages: [{ role: 'user', content: 'hello' }], model: 'test-model' });
});
test('embeddings use their own key instead of the main API key', async () => {
  const { api, calls } = setup();
  await api.embeddings('hello', { endpoint: 'https://vector.example/v1', key: 'vector-test-key', model: 'embedding-model' });
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer vector-test-key');
  assert.deepEqual(JSON.parse(calls[0].init.body), { input: 'hello', model: 'embedding-model' });
});
test('explicit empty key does not silently reuse saved credentials', async () => {
  const { api, calls } = setup();
  await api.models({ endpoint: 'https://public.example/v1', key: '' });
  assert.equal(calls[0].init.headers.has('Authorization'), false);
});
test('model list replaces a full completion route and keeps query parameters', async () => {
  const { api, calls } = setup();
  await api.models({ endpoint: 'https://main.example/v1/chat/completions?version=1' });
  assert.equal(calls[0].input, 'https://main.example/v1/models?version=1');
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer main-test-key');
});
test('generic requests retain string bodies and explicit authorization headers', async () => {
  const { api, calls } = setup();
  await api.request('embeddings', { method: 'POST', body: '{"input":"hello"}', headers: { Authorization: 'Bearer header-test-key' } });
  assert.equal(calls[0].init.body, '{"input":"hello"}');
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer header-test-key');
});
test('Request input cancellation propagates to the network', async () => {
  const { window, calls } = setup();
  const controller = new AbortController();
  controller.abort();
  await window.fetch(new Request('https://main.example/v1/models', { signal: controller.signal }));
  assert.equal(calls[0].init.signal.aborted, true);
});
