// sw.js
const CACHE = 'pwa-guide-v4'; // bumpa detta när du ändrar
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Installera och cacha statiska filer
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Aktivera direkt
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Nätet först för JSON (alltid färsk lista), cache först för statiska filer
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Låt data/commands.json alltid gå nätet-först
  if (url.pathname.endsWith('/data/commands.json')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Statiska filer: cache-först, fallback nät
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
