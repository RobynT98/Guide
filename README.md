# 📱 PWA-lathund – Mobil
En komplett guide för att bygga, felsöka och publicera Progressive Web Apps (PWA).  
Fokus: mobil (Acode, GitHub, Firebase Hosting) + dator/WSL (Node, Vite, Workbox).

👉 **Testa appen här:** [Kommandodatabas på GitHub Pages](https://robynT98.github.io/pwa-guide/)

## Badges

![PWA](https://img.shields.io/badge/Type-PWA-blue)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen)
![Firebase](https://img.shields.io/badge/Deploy-Firebase-orange)

## Table of Contents
- [Installation](#installation)
- [Usage / Examples](#usage--examples)
- [Deployment](#deployment)
- [Documentation (Firebase)](#documentation-firebase)
- [Felsökning](#felsökning)
- [Tips ](#tips)

## Installation

### Skapa projektstrukturen:

``` 
txt

my-pwa/
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.webmanifest
└── icons/
    ├── icon-192.png
    └── icon-512.png

```

### Initiera Git (Acode / Termux):


```
bash

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
## Usage/Examples

### index.html

```
html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My PWA</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="manifest" href="manifest.webmanifest">
</head>
<body>
  <h1>Hello PWA 🚀</h1>
  <script src="app.js"></script>
</body>
</html>
```
### styles.css
``` 
css

body {
  font-family: sans-serif;
  text-align: center;
  margin: 2rem;
}
```
### app.js
``` 
js

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log("Service Worker registered"));
}

```
### manifest.webmanifest
```
json

{
  "name": "My PWA",
  "short_name": "PWA",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
### sw.js
```
js

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pwa-cache').then((cache) => {
      return cache.addAll(['/', '/index.html', '/styles.css', '/app.js']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

```













## Deployment

### GitHub Pages (snabbaste vägen)

1. Pusha koden till `main`.
2. Öppna **Settings → Pages**.
3. Välj **Deploy from branch** → `main` + **root**.
4. Vänta någon minut. Din sida hamnar på: `https://<user>.github.io/<repo>/`.

> SPA-routing? Lägg en kopia av `index.html` som `404.html` i roten.


### GitHub Actions (automatisk deploy till Pages)

Skapa `.github/workflows/pages.yml`:

```
yaml

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
      # Om du inte har package.json funkar detta ändå (kopierar allt).
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
```
Aktivera Pages: Settings → Pages → Source: GitHub Actions.

### Firebase Hosting (CLI – manuell)

Installera verktyg, logga in och deploya:

```
bash

npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```
Minimal firebase.json (statisk PWA utan build):
```
json

{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.webmanifest",
        "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }]
      }
    ]
  }
}
```
Bygger du med Vite/Node? Byt "public": "." till "public": "dist" och kör npm run build före firebase deploy.

### Firebase Hosting (GitHub Actions – automatisk)
Skapa .github/workflows/firebase.yml:
```
yaml 

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
```

Lägg hemligheten FIREBASE_SERVICE_ACCOUNT under Repo → Settings → Secrets → Actions
(Innehållet är JSON-Service Account-nyckeln från Firebase → Project Settings → Service accounts).
















## Documentation (Firebase)

### Firestore

```
js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```
### Authentication
```
js

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

signInWithPopup(auth, provider)
  .then(result => console.log(result.user))
  .catch(err => console.error(err));
```

## Felsökning

- **Appen går inte att installera?**
  - Kontrollera att `manifest.webmanifest` och ikonerna är länkade korrekt i `index.html`.
  - Se till att servern körs via **HTTPS**.

- **Offline fungerar inte?**
  - Säkerställ att `sw.js` (service worker) registreras utan fel.
  - Öppna DevTools → Application → Service Workers och titta efter errors.

- **Uppdateringar visas inte?**
  - Service workers cachar filer. Prova `Ctrl+Shift+R` (hård refresh).
  - Lägg till logik i `sw.js` för att visa notis när ny version finns.

- **iOS problem?**
  - iOS stöd för PWA är begränsat (t.ex. ingen push).
  - Testa i Safari och aktivera "Add to Home Screen".
## Tips

- **DevTools** → Använd fliken *Lighthouse* för att testa PWA-funktioner.
- **Figma** → Skapa egna ikoner (192px, 512px) och exportera som `.png`.
- **Maskable icons** → Se [https://maskable.app](https://maskable.app) för Android-stöd.
- **Workbox** → Automatisera service workers vid build (`workbox-cli`).
