const CACHE_NAME = 'ideal-machine-shell-v20260916-desktop-orb-tap-1';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('ideal-machine-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json?.() || {}; } catch { payload = { body: event.data?.text?.() || '' }; }
  event.waitUntil(self.registration.showNotification(String(payload.title || 'Ideal'), {
    body: String(payload.body || payload.message || '收到一条新消息'),
    icon: payload.icon || './assets/icons/ideal-orbit-day.png',
    badge: payload.badge || './assets/icons/ideal-orbit-day.png',
    tag: String(payload.tag || `ideal-message-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    renotify: true,
    timestamp: Number(payload.timestamp || Date.now()),
    data: { ...(payload.data || {}), url: payload.url || payload.data?.url || './' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const contactId = String(event.notification.data?.contactId || '');
  const targetUrl = String(event.notification.data?.url || './');
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    const current = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (current) {
      current.postMessage({ type:'ideal-open-chat', contactId });
      await current.focus();
      return;
    }
    await self.clients.openWindow(contactId ? `./?idealOpenChat=${encodeURIComponent(contactId)}` : targetUrl);
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(new Request(request, { cache: 'no-store' }));
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return (await caches.match('./')) || (await caches.match('./index.html')) || new Response('理想机暂时无法连接网络', { status: 503 });
      }
      return new Response('', { status: 503 });
    }
  })());
});
