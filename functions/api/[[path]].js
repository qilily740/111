const upstreams = {
  activation: { origin: 'https://activation.ideal-laedi.cc.cd', prefix: '' },
  auth: { origin: 'https://auth.ideal-laedi.cc.cd', prefix: '' },
  beauty: { origin: 'https://beauty.ideal-laedi.cc.cd', prefix: '' },
  images: { origin: 'https://images.ideal-laedi.cc.cd', prefix: '' },
  music: { origin: 'https://music.ideal-laedi.cc.cd', prefix: '' },
  push: { origin: 'https://ideal-machine-push.ideal-machine.workers.dev', prefix: '' },
  repository: { origin: 'https://ideal-machine-repository.ideal-machine.workers.dev', prefix: '' }
};
const allowedOrigins = new Set([
  'https://app.ideal-laedi.cc.cd',
  'https://qilily740.github.io',
  'http://localhost:8787',
  'http://127.0.0.1:8787'
]);

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = new Headers({ 'Vary': 'Origin' });
  if (!allowedOrigins.has(origin)) return headers;
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers') || 'Authorization, Content-Type');
  headers.set('Access-Control-Expose-Headers', 'Set-Auth-Token, Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const incoming = new URL(request.url);
  const [, , service, ...segments] = incoming.pathname.split('/');
  const upstream = upstreams[service];
  if (!upstream) return Response.json({ error: 'API_NOT_FOUND' }, { status: 404 });

  const target = new URL(upstream.origin);
  const suffix = segments.join('/');
  target.pathname = `${upstream.prefix}/${suffix}`.replace(/\/{2,}/g, '/');
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

  try {
    const response = await fetch(new Request(target, init));
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('access-control-allow-origin');
    responseHeaders.delete('access-control-allow-credentials');
    for (const [name, value] of corsHeaders(request)) responseHeaders.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch {
    return Response.json({ error: 'UPSTREAM_UNAVAILABLE' }, { status: 502 });
  }
}
