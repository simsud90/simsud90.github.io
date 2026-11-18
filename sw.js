const CACHE = 'little-play-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './videos.js', './manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('little-play-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first: manually edited video lists appear on the next connected reload.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      if (event.request.mode === 'navigate') return await cache.match('./index.html');
      return Response.error();
    }
  })());
});
