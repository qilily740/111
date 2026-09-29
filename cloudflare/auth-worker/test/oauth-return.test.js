import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedOAuthReturnUrl, oauthReturnUrl } from '../src/oauth-return.js';

const env = {
  FRONTEND_URL: 'https://qilily740.github.io/111/',
  OAUTH_RETURN_URLS: 'http://localhost:8765/,http://127.0.0.1:8765/'
};

test('returns only an explicitly configured frontend URL', () => {
  assert.equal(allowedOAuthReturnUrl(env, 'http://localhost:8765/'), 'http://localhost:8765/');
  assert.equal(allowedOAuthReturnUrl(env, 'https://qilily740.github.io/111/'), env.FRONTEND_URL);
  assert.equal(oauthReturnUrl(env, 'http://127.0.0.1:8765/'), 'http://127.0.0.1:8765/');
});

test('rejects arbitrary sites and lookalike local URLs', () => {
  for (const value of [
    'https://attacker.example/',
    'http://localhost:8766/',
    'http://localhost:8765.evil.example/',
    'http://localhost:8765/other',
    'http://localhost:8765/?ticket=stolen',
    'javascript:alert(1)'
  ]) assert.equal(allowedOAuthReturnUrl(env, value), '');
  assert.equal(oauthReturnUrl(env, 'https://attacker.example/'), env.FRONTEND_URL);
});
