// Офлайн-кэш оболочки приложения. Данные (api.github.com) не кэшируются.
const CACHE = 'fit-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Сначала сеть (чтобы обновления приходили), без сети — из кэша.
  e.respondWith((async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch(e.request, { signal: ctrl.signal, cache: 'no-cache' });
      clearTimeout(t);
      if (r.ok) { const c = await caches.open(CACHE); c.put(e.request, r.clone()); }
      return r;
    } catch (err) {
      clearTimeout(t);
      const hit = await caches.match(e.request, { ignoreSearch: true }) || (e.request.mode === 'navigate' && await caches.match('./index.html'));
      if (hit) return hit;
      throw err;
    }
  })());
});
