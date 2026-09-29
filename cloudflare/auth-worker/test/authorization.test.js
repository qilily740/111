import test from 'node:test';
import assert from 'node:assert/strict';
import activationWorker from '../../activation-worker/src/index.js';
import authWorker from '../src/index.js';
import catboxWorker from '../../catbox-relay-worker/src/index.js';
import musicAuthWorker from '../../music-auth-worker/src/index.js';
import musicWorker from '../../music-worker/src/index.js';
import pushWorker from '../../push-worker/src/index.js';
import { authorizeIdealSession } from '../../shared/auth.js';

function authBinding(response = new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' }
})) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url: String(url), headers: new Headers(init?.headers) });
      return response.clone();
    }
  };
}

const protectedCases = [
  ['activation create', activationWorker, 'https://activation.test/activation/create', 'POST'],
  ['activation verify', activationWorker, 'https://activation.test/activation/verify', 'POST'],
  ['image upload relay', catboxWorker, 'https://images.test/images', 'POST'],
  ['music API', musicWorker, 'https://music-api.test/api/search?keywords=x', 'GET'],
  ['music login API', musicAuthWorker, 'https://music-auth.test/api/auth/qr/key', 'GET'],
  ['push subscription', pushWorker, 'https://push.test/subscribe', 'POST']
];

for (const [name, worker, url, method] of protectedCases) {
  test(`${name} rejects requests without an Ideal Machine session`, async () => {
    const AUTH = authBinding();
    const request = new Request(url, { method, headers: { Origin: 'https://qilily740.github.io' } });
    const response = await worker.fetch(request, { AUTH });
    assert.equal(response.status, 401);
    assert.equal(AUTH.calls.length, 0, 'a missing token is rejected before a service-binding lookup');
    assert.match(await response.text(), /UNAUTHORIZED/);
  });
}

test('a normal Authorization header is forwarded to the Auth Worker', async () => {
  const AUTH = authBinding(new Response(JSON.stringify({ ok: true, user: { id: 'user-1' } }), { status: 200 }));
  const result = await authorizeIdealSession(new Request('https://api.test/private', {
    headers: { Authorization: 'Bearer ideal-session-token' }
  }), { AUTH });
  assert.equal(result.ok, true);
  assert.equal(AUTH.calls.length, 1);
  assert.equal(AUTH.calls[0].headers.get('Authorization'), 'Bearer ideal-session-token');
});

test('the music-specific Ideal header takes priority over a Netease Authorization token', async () => {
  const AUTH = authBinding(new Response(JSON.stringify({ ok: true, user: { id: 'user-1' } }), { status: 200 }));
  const result = await authorizeIdealSession(new Request('https://music.test/api/search', {
    headers: {
      Authorization: 'Bearer netease-session-token',
      'X-Ideal-Authorization': 'Bearer ideal-session-token'
    }
  }), { AUTH });
  assert.equal(result.ok, true);
  assert.equal(AUTH.calls[0].headers.get('Authorization'), 'Bearer ideal-session-token');
});

test('a missing Auth Service Binding fails closed', async () => {
  const result = await authorizeIdealSession(new Request('https://api.test/private', {
    headers: { Authorization: 'Bearer ideal-session-token' }
  }), {});
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'AUTH_SERVICE_UNAVAILABLE');
});

test('Better Auth direct signup cannot bypass the eligibility and email-ticket flow', async () => {
  const response = await authWorker.fetch(new Request('https://auth.test/api/auth/sign-up/email', { method: 'POST' }), {});
  assert.equal(response.status, 403);
  assert.match(await response.text(), /REGISTRATION_FLOW_REQUIRED/);
});
