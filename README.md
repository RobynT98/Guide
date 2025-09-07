
---

📱 PWA-lathund – Mobil (Acode + GitHub + Firebase) & WSL

En komplett guide för att bygga, felsöka och publicera Progressive Web Apps. Fokus: mobil (Acode, GitHub, Firebase Hosting) men med extradel för Node/WSL, Figma, VCS.


---

0) Vad är en PWA?

En Progressive Web App är en webbapp som:

Körs via HTTPS

Har en manifestfil (manifest.webmanifest)

Har en Service Worker för offline/caching

Är responsiv

Kan installeras som en app (Add to Home Screen)



---

1) Minimal mall

index.html

<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Min PWA</title>
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#0d9488" />
  <link rel="icon" href="/icons/icon-192.png" sizes="192x192">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <h1>Hej, PWA!</h1>
  <button id="refresh">Kolla uppdatering</button>
  <div id="status"></div>
  <script src="/app.js" defer></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>

styles.css

body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem; }
h1 { color: #0d9488; }
button { padding: .6rem 1rem; border-radius: .5rem; }

app.js

const statusEl = document.getElementById('status');
document.getElementById('refresh').addEventListener('click', async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
});
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  statusEl.textContent = 'Appen uppdateras, laddar om...';
  location.reload();
});

manifest.webmanifest

{
  "name": "Min PWA",
  "short_name": "PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

sw.js

const CACHE = 'app-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      })
    )
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});


---

2) Projektstruktur

my-pwa/
  index.html
  styles.css
  app.js
  sw.js
  manifest.webmanifest
  icons/
    icon-192.png
    icon-512.png


---

3) Mobilflöde (Acode → GitHub → Pages/Firebase)

1. Skapa filerna i Acode.


2. Initiera Git i Termux eller Acode:

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main


3. GitHub Pages: Settings → Pages → deploy main branch → root.
URL blir https://<user>.github.io/<repo>/


4. Firebase Hosting (via dator/WSL eller Termux):

npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy



firebase.json minimal:

{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      { "source": "**/*.webmanifest", "headers": [
        {"key": "Content-Type", "value": "application/manifest+json"}
      ]}
    ]
  }
}


---

4) Felsökning

Appen går inte att installera: kolla att manifest laddas, att SW är aktiv, och att sidan körs via HTTPS.

Offline funkar inte: kontrollera ASSETS i sw.js och bumpa CACHE-namnet.

Uppdateringar fastnar: använd skipWaiting och clients.claim.



---

5) Små tips

Testa i Chrome DevTools → Application → Service Workers.

Lighthouse (Audit) ger PWA-score.

Använd Figma för ikoner (1024x1024 → exportera 512 & 192).

Lägg purpose: "maskable" på ikonen i manifestet för snygg Android-install.



---
