const DISCORD_ID_PATTERN = /^\d{17,20}$/;

function discordGuildRequirements(env) {
  let requirements;
  try {
    requirements = JSON.parse(String(env.DISCORD_GUILD_ROLE_REQUIREMENTS || '[]'));
  } catch {
    return null;
  }
  if (!Array.isArray(requirements) || requirements.length === 0) return null;
  const valid = requirements.map(item => ({
    guildId: String(item?.guildId || ''),
    roleIds: Array.isArray(item?.roleIds) ? item.roleIds.map(String) : []
  }));
  if (valid.some(item => !DISCORD_ID_PATTERN.test(item.guildId) || item.roleIds.length === 0 || item.roleIds.some(roleId => !DISCORD_ID_PATTERN.test(roleId)))) return null;
  return valid;
}

export async function discordMember(env, accessToken, fetchFn = fetch) {
  const requirements = discordGuildRequirements(env);
  if (!requirements) return { status: 'check_failed', httpStatus: 503 };

  const apiBase = String(env.DISCORD_API_BASE_URL || 'https://discord.com/api/v10').replace(/\/$/, '');
  let memberFound = false;
  try {
    for (const [requirementIndex, requirement] of requirements.entries()) {
      const response = await fetchFn(`${apiBase}/users/@me/guilds/${encodeURIComponent(requirement.guildId)}/member`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
      });
      if (response.status === 404) continue;
      if (!response.ok) {
        console.warn(JSON.stringify({ event: 'discord_member_api_rejected', status: response.status, requirementIndex }));
        return { status: 'check_failed', httpStatus: response.status };
      }
      memberFound = true;
      const member = await response.json();
      const roles = Array.isArray(member?.roles) ? member.roles.map(String) : [];
      if (roles.some(roleId => requirement.roleIds.includes(roleId))) return { status: 'active', httpStatus: 200 };
    }
  } catch {
    console.warn(JSON.stringify({ event: 'discord_member_api_unreachable' }));
    return { status: 'check_failed', httpStatus: 503 };
  }
  return { status: memberFound ? 'no_role' : 'not_in_guild', httpStatus: 200 };
}
