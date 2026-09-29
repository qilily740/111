export async function authorizeIdealSession(request, env) {
  const authorization = request.headers.get('X-Ideal-Authorization') || request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(authorization)) {
    return { ok: false, status: 401, body: { error: 'UNAUTHORIZED' } };
  }
  if (!env.AUTH) {
    return { ok: false, status: 503, body: { error: 'AUTH_SERVICE_UNAVAILABLE' } };
  }
  try {
    const response = await env.AUTH.fetch('https://ideal-machine-auth/auth/authorize', {
      method: 'POST',
      headers: { Authorization: authorization }
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) return { ok: false, status: response.status, body };
    if (!body?.ok || !body?.user?.id) return { ok: false, status: 503, body: { error: 'AUTH_SERVICE_UNAVAILABLE' } };
    return { ok: true, status: 200, user: body.user };
  } catch {
    return { ok: false, status: 503, body: { error: 'AUTH_SERVICE_UNAVAILABLE' } };
  }
}
