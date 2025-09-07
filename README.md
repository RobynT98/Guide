📱 PWA-lathund – Mobil 

     (Acode + GitHub + Firebase & WSL)
     
En komplett guide för att bygga, felsöka och publicera Progressive Web Apps. Fokus: mobil (Acode, GitHub, Firebase Hosting) men med extradel för Node/WSL, Figma, VCS.0) 

Vad är en PWA?
En Progressive Web App är en webbapp som:

Körs via HTTPS
Har en manifestfil (manifest.webmanifest)
Har en Service Worker för offline/caching
Är responsiv
Kan installeras som en app (Add to Home Screen)

Projektstruktur: 

my-pwa/
  index.html
  styles.css
  app.js
  sw.js
  manifest.webmanifest
  icons/
    icon-192.png
    icon-512.png
______________________________________________________

    Mobilflöde (Acode → GitHub → Pages/Firebase)
Skapa filerna i Acode.

Initiera Git i Termux eller Acode:

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main

GitHub Pages: Settings → Pages → deploy main branch → root.
URL blir https://<user>.github.io/<repo>/

Firebase Hosting (via dator/WSL eller Termux):
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


Felsökning
Appen går inte att installera: kolla att manifest laddas, att SW är aktiv, och att sidan körs via HTTPS.
Offline funkar inte: kontrollera ASSETS i sw.js och bumpa CACHE-namnet.
Uppdateringar fastnar: använd skipWaiting och clients.claim.

Små tips
Testa i Chrome DevTools → Application → Service Workers.
Lighthouse (Audit) ger PWA-score.
Använd Figma för ikoner (1024x1024 → exportera 512 & 192).
Lägg purpose: "maskable" på ikonen i manifestet för snygg Android-install.

______________________________________________________

