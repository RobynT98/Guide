const STATIC_CACHE = 'static-v2';
const RUNTIME_CACHE = 'runtime-v2';
const ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'data/commands.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Stale-While-Revalidate för data/ och same-origin requests
  if (new URL(request.url).origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const fetchPromise = fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
  }
});
