const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup(resolveAsset) {
  const source = fs.readFileSync(path.join(__dirname, '../apps/liaotian.js'), 'utf8');
  const context = vm.createContext({
    window: { IdealMachineGetImage:resolveAsset },
    esc:value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;'),
    emojiDisplaySource:value => value, normalizeEmojiImageSource:value => value,
    app: {}, Promise
  });
  vm.runInContext(source.slice(source.indexOf('  const emojiImageCache ='), source.indexOf('  const emojiImageObserver')) +
    '\nglobalThis.api = { resolveEmojiImage, rememberEmojiImage, emojiImageMarkup, hydrateEmojiImages };', context);
  return context.api;
}

test('simultaneous sticker loads share a read and later renders use the resolved source', async () => {
  let reads = 0;
  let finish;
  const api = setup(() => { reads++; return new Promise(resolve => { finish = resolve; }); });
  const first = api.resolveEmojiImage('idb:image:sticker');
  const second = api.resolveEmojiImage('idb:image:sticker');
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(reads, 1);
  finish('data:image/png;base64,loaded');
  await first;
  await api.resolveEmojiImage('idb:image:sticker');
  assert.equal(reads, 1);
  assert.match(api.emojiImageMarkup('idb:image:sticker', true), /src="data:image\/png;base64,loaded"/);
});

test('cold local stickers do not load an invalid idb URL; failed reads can retry', async () => {
  let reads = 0;
  const api = setup(() => ++reads === 1 ? '' : 'data:image/png;base64,recovered');
  assert.doesNotMatch(api.emojiImageMarkup('idb:image:sticker', true), /\ssrc=/);
  assert.equal(await api.resolveEmojiImage('idb:image:sticker'), '');
  assert.equal(await api.resolveEmojiImage('idb:image:sticker'), 'data:image/png;base64,recovered');
  assert.equal(reads, 2);
});

test('warm stickers reserve their dimensions without lazy-loading conversation bubbles', () => {
  const api = setup();
  api.rememberEmojiImage('https://example.test/sticker.gif', { width:150, height:75 });
  const html = api.emojiImageMarkup('https://example.test/sticker.gif', true);
  assert.match(html, /width="150" height="75"/);
  assert.match(html, /width:150px!important;height:75px!important/);
  assert.doesNotMatch(html, /loading="lazy"/);
  assert.match(api.emojiImageMarkup('https://example.test/sticker.gif'), /loading="lazy"/);
});

test('hydration handles an image added directly and never reassigns an already warm src', async () => {
  let assignments = 0;
  const api = setup(() => 'data:image/png;base64,loaded');
  api.rememberEmojiImage('idb:image:sticker', { src:'data:image/png;base64,loaded' });
  const image = {
    dataset:{ emojiSrc:'idb:image:sticker' }, isConnected:true, complete:true,
    naturalWidth:200, naturalHeight:100, matches:() => true, querySelectorAll:() => [],
    getAttribute:() => 'data:image/png;base64,loaded', addEventListener() {},
    set src(value) { assignments++; }
  };
  api.hydrateEmojiImages(image);
  await Promise.resolve();
  api.hydrateEmojiImages(image);
  assert.equal(assignments, 0);
  assert.match(api.emojiImageMarkup('idb:image:sticker', true), /width="150" height="75"/);
});

test('redrawing the same conversation reuses the loaded sticker node', () => {
  const source = fs.readFileSync(path.join(__dirname, '../apps/liaotian.js'), 'utf8');
  const previous = { dataset:{ emojiSrc:'https://example.test/sticker.gif' }, closest:() => ({ dataset:{ chatMessageId:'m1' } }) };
  let replacedWith;
  let images = [previous];
  const next = { ...previous, replaceWith:image => { replacedWith = image; } };
  const context = vm.createContext({
    activeContact:'contact1', app:{ querySelectorAll:() => images },
    render:() => { images = [next]; }, hydrateEmojiImages() {}
  });
  vm.runInContext(source.slice(source.indexOf('  const renderWithStableEmojiImages ='), source.indexOf('  startActiveMessageAutomation();', source.indexOf('  const renderWithStableEmojiImages ='))) + '\nrender();', context);
  assert.equal(replacedWith, previous);
});
