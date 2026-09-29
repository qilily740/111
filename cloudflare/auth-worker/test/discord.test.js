import test from 'node:test';
import assert from 'node:assert/strict';
import { discordMember } from '../src/discord.js';

const guildOne = '1548614114899796074';
const roleOne = '1548619622431850506';
const guildTwo = '1379304008157499423';
const roleTwo = '1379453550161039502';

function environment() {
  return {
    DISCORD_API_BASE_URL: 'https://discord.test/api/v10',
    DISCORD_GUILD_ROLE_REQUIREMENTS: JSON.stringify([
      { guildId: guildOne, roleIds: [roleOne] },
      { guildId: guildTwo, roleIds: [roleTwo] }
    ])
  };
}

test('accepts the matching role in the second configured guild after a 404 in the first', async () => {
  const calls = [];
  const result = await discordMember(environment(), 'user-oauth-token', async (url, init) => {
    calls.push({ url, headers: new Headers(init.headers) });
    return calls.length === 1
      ? new Response(null, { status: 404 })
      : Response.json({ roles: [roleTwo] });
  });

  assert.equal(result.status, 'active');
  assert.deepEqual(calls.map(call => call.url), [
    `https://discord.test/api/v10/users/@me/guilds/${guildOne}/member`,
    `https://discord.test/api/v10/users/@me/guilds/${guildTwo}/member`
  ]);
  assert.equal(calls[0].headers.get('Authorization'), 'Bearer user-oauth-token');
});

test('does not match a role from one guild against another guild requirement', async () => {
  let call = 0;
  const result = await discordMember(environment(), 'user-oauth-token', async () => {
    call += 1;
    return call === 1
      ? Response.json({ roles: [roleTwo] })
      : new Response(null, { status: 404 });
  });

  assert.equal(result.status, 'no_role');
  assert.equal(call, 2);
});

test('fails closed when the guild-role configuration is malformed', async () => {
  let called = false;
  const result = await discordMember({ DISCORD_GUILD_ROLE_REQUIREMENTS: '{bad json' }, 'token', async () => {
    called = true;
    return Response.json({ roles: [roleOne] });
  });

  assert.equal(result.status, 'check_failed');
  assert.equal(called, false);
});
