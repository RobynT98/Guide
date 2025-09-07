
---

<div align="center">📱 PWA-lathund – Mobil + WSL 🖥️

Acode · GitHub Pages · Firebase Hosting · Vite/Node · Workbox

  

</div>En tydlig, praktisk handbok för att bygga och publicera Progressive Web Apps från mobilen (Acode + GitHub/Firebase) och från dator (WSL + Node/Vite). Innehåller mallar, CI/CD, felsökning, samt Figma-guiden för ikoner.


---

Innehåll

Start (vad är en PWA?)

Statisk PWA (mobil/desktop)

Node/Vite (WSL)

Workbox (auto-SW)

CI/CD (GitHub Pages & Firebase)

Firebase (Firestore/Auth)

Felsökning

Ikoner (Figma)

Extras (toast för ny version)



---

Start – kort om PWA

En PWA behöver tre saker: HTTPS, en manifestfil (manifest.webmanifest) och en Service Worker (sw.js). När dessa är på plats kan sidan installeras som app och få offline-stöd.


---

Statisk PWA (mobil/desktop)

Skapa följande struktur i repo-roten:

index.html

styles.css

app.js

sw.js

manifest.webmanifest

icons/icon-192.png

icons/icon-512.png


Lägg in filerna nedan.

<!-- index.html -->
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
  <header><h1>Hej, PWA!</h1></header>
  <main>
    <p>Installera mig till hemskärmen och testa offline.</p>
    <button id="refresh">Kolla uppdatering</button>
    <div id="status"></div>
  </main>
  <script src="/app.js" defer></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  </script>
</body>
</html>

/* styles.css */
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; }
header { background: #0d9488; color: #fff; padding: 1rem; }
main { padding: 1rem; max-width: 720px; margin: 0 auto; }
button { padding: .6rem 1rem; border: 0; border-radius: .5rem; }

// app.js
const statusEl = document.getElementById('status');

document.getElementById('refresh').addEventListener('click', async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else if (reg) {
    await reg.update();
    statusEl.textContent = 'Söker uppdatering…';
  }
});

navigator.serviceWorker?.addEventListener('controllerchange', () => {
  statusEl.textContent = 'Appen uppdaterades. Laddar om…';
  location.reload();
});

{
  "name": "Min PWA",
  "short_name": "PWA",
  "start_url": "/?source=a2hs",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "description": "Minimal PWA-mall.",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

// sw.js
const CACHE = 'app-v1';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/app.js',
  '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const fresh = await fetch(request);
      const c = await caches.open(CACHE);
      c.put(request, fresh.clone());
      return fresh;
    } catch {
      return caches.match('/index.html');
    }
  })());
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

Initiera Git och pusha till GitHub.

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main

Aktivera GitHub Pages: Settings → Pages → Deploy from branch → main / root.
För SPA-routing på Pages, lägg en kopia av index.html som 404.html.


---

Node/Vite (WSL)

Vite ger snabb devserver och bygger till dist/. Använd denna struktur:

index.html

public/manifest.webmanifest

public/icons/icon-192.png, public/icons/icon-512.png

src/main.js, src/styles.css, src/sw.js

package.json (scripts)

valfritt vite.config.js


Skapa projektet.

npm create vite@latest my-pwa -- --template vanilla
cd my-pwa
npm i

index.html laddar /src/main.js och /manifest.webmanifest. Lägg dina filer enligt strukturen ovan. Kör lokalt.

npm run dev
npm run build
npm run preview


---

Workbox (auto-genererad SW)

Installera Workbox och generera SW efter build.

npm i -D workbox-build

Skapa workbox-build.mjs i repo-roten.

import { generateSW } from 'workbox-build';

await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,webmanifest,png,svg,ico}'],
  swDest: 'dist/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: ({request}) => request.destination === 'image',
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 60, maxAgeSeconds: 2592000 } }
    },
    {
      urlPattern: ({url}) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static' }
    }
  ]
});

Uppdatera package.json scripts.

{
  "scripts": {
    "dev": "vite",
    "build": "vite build && node workbox-build.mjs",
    "preview": "vite preview"
  }
}

Registrera inte src/sw.js när du kör Workbox; den genererar dist/sw.js.


---

CI/CD – GitHub Actions

GitHub Pages (statisk eller Vite-dist)

Skapa .github/workflows/pages.yml.

name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --ignore-scripts || true
      - run: |
          if [ -f package.json ]; then
            npm run build || true
            mkdir -p out && cp -r dist/* out/ 2>/dev/null || cp -r . out/
          else
            mkdir -p out && cp -r . out/
          fi
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4

Aktivera Pages: Settings → Pages → Source: GitHub Actions.

Firebase Hosting (statisk eller Vite-dist)

Skapa .github/workflows/firebase.yml.

name: Deploy to Firebase Hosting
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --ignore-scripts || true
      - run: npm run build || true
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: YOUR_PROJECT_ID

Lägg hemligheten FIREBASE_SERVICE_ACCOUNT i Repo → Settings → Secrets → Actions.
Minsta firebase.json (statisk: "public": ".", Vite: "public": "dist").

{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [ { "source": "**", "destination": "/index.html" } ],
    "headers": [
      {
        "source": "**/*.webmanifest",
        "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }]
      }
    ]
  }
}


---

Firebase (Firestore/Auth) – snabbstart

Web v9 modular i en <script type="module"> eller i din bundlade kod.

<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
  import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
  import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

  const firebaseConfig = {/* DIN KONFIG */};
  const app = initializeApp(firebaseConfig);

  const db = getFirestore(app);
  const auth = getAuth(app);

  // Firestore
  const notes = collection(db, 'notes');
  await addDoc(notes, { text: 'Hej Firebase', ts: Date.now() });
  const snap = await getDocs(notes);
  snap.forEach(d => console.log(d.id, d.data()));

  // Google Auth
  const provider = new GoogleAuthProvider();
  document.body.insertAdjacentHTML('beforeend','<button id="login">Login with Google</button>');
  document.getElementById('login').onclick = () => signInWithPopup(auth, provider).then(r => console.log(r.user));
</script>


---

Felsökning

Installbarhet. Kontrollera att manifest.webmanifest laddas utan 404, att sidan går via HTTPS och att Service Worker är registrerad (DevTools → Application → Service Workers).

Offline. Säkerställ att filer finns i ASSETS eller hanteras via runtime-cache. Bumpa CACHE-namnet vid tunga ändringar.

Uppdateringar. Använd skipWaiting i SW och clients.claim. Visa gärna en banner när ny version finns.

iOS. Lägg apple-touch-icon, räkna med vissa SW-begränsningar i Safari.


---

Ikoner (Figma)

Skapa en kvadratisk 1024×1024 med generös safe-area. Exportera PNG 512×512 och 192×192 och lägg dem i icons/. För snygg Android-install, lägg till maskable-ikon i manifestet.

{
  "src": "/icons/icon-512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "any maskable"
}

Placering: statisk spår → /<repo-root>/icons/*.png, Vite → /public/icons/*.png.


---

Extras – toast när ny version finns

// Lägg till i app.js
navigator.serviceWorker?.getRegistration().then(reg => {
  if (!reg) return;
  reg.addEventListener('updatefound', () => {
    const nw = reg.installing;
    nw?.addEventListener('statechange', () => {
      if (nw.state === 'installed' && reg.waiting) {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:12px;background:#0d9488;color:#fff;text-align:center';
        bar.innerHTML = 'Ny version finns. <button id="upd">Uppdatera</button>';
        document.body.appendChild(bar);
        document.getElementById('upd').onclick = () => reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
});


---
