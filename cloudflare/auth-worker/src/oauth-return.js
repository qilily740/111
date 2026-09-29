function normalizeFrontendUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.username || url.password || url.search || url.hash) return '';
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return '';
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

export function allowedOAuthReturnUrl(env, value) {
  const requested = normalizeFrontendUrl(value);
  if (!requested) return '';
  const configured = [env.FRONTEND_URL, ...String(env.OAUTH_RETURN_URLS || '').split(',')]
    .map(normalizeFrontendUrl)
    .filter(Boolean);
  return configured.includes(requested) ? requested : '';
}

export function oauthReturnUrl(env, value) {
  return allowedOAuthReturnUrl(env, value) || normalizeFrontendUrl(env.FRONTEND_URL);
}
