// ------------------------
// Hjälpare / DOM-referenser
// ------------------------
const el  = (q, d=document) => d.querySelector(q);
const els = (q, d=document) => [...d.querySelectorAll(q)];

const searchInput = el('#search');
const catSelect   = el('#category');
const sortSelect  = el('#sort');
const resultsEl   = el('#results');
const countEl     = el('#count');
const errEl       = el('#err');        // <div id="err"> i index.html (valfritt)
const installBtn  = el('#installBtn');

let all = [];
let deferredPrompt = null;

// ------------------------
// Add to Home Screen (A2HS)
// ------------------------
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  installBtn.hidden = true;
  await deferredPrompt?.prompt();
  deferredPrompt = null;
});

// -------------------------------------
// Ladda data (cache-bust + tydlig felinfo)
// -------------------------------------
async function loadData() {
  try {
    const url = `data/commands.json?ts=${Date.now()}`;      // cache-bust
    const r   = await fetch(url, { cache: 'no-store' });     // hämta färskt
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);

    const text = await r.text();
    try {
      all = JSON.parse(text);
    } catch (e) {
      console.error('JSON-parse-fel i commands.json. Förhandsvisning:', text.slice(0, 200));
      throw e;
    }
    if (errEl) errEl.textContent = '';
  } catch (e) {
    console.error('Kunde inte ladda commands.json', e);
    all = [];
    if (errEl) errEl.textContent = 'Fel: kunde inte ladda commands.json';
  }
  initFilters();
  render();
}

// ------------------------
// Filter + sorteringslogik
// ------------------------
function initFilters() {
  const cats = Array.from(new Set(all.map(x => x.category))).sort();
  catSelect.innerHTML =
    '<option value="">Alla kategorier</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  // återställ senast använda filter
  const s  = localStorage.getItem('cmdSearch') || '';
  const c  = localStorage.getItem('cmdCat')    || '';
  const so = localStorage.getItem('cmdSort')   || 'relevance';
  searchInput.value = s; catSelect.value = c; sortSelect.value = so;
}

function score(item, q) {
  if (!q) return 1;
  q = q.toLowerCase();
  const hay = (item.command + ' ' + item.description + ' ' + (item.tags||[]).join(' ')).toLowerCase();
  return hay.includes(q) ? 1 : 0;
}

const compareAlpha = (a, b) => a.command.localeCompare(b.command, 'sv');
const slug = (s='') => String(s).toLowerCase().replace(/[^a-z0-9+.-]+/g, '-');

// ------------------------
// Rendera träfflistan
// ------------------------
function render() {
  const q = searchInput.value.trim().toLowerCase();
  const c = catSelect.value;
  const s = sortSelect.value;

  let items = all
    .map(it => ({ ...it, _score: score(it, q) }))
    .filter(it => (!q || it._score > 0) && (!c || it.category === c));

  if (s === 'alpha') items.sort(compareAlpha);
  else items.sort((a,b) => b._score - a._score || compareAlpha(a,b));

  countEl.textContent = items.length ? `${items.length} träffar` : 'Inga träffar';
  resultsEl.innerHTML = items.map(toCard).join('');
  attachCopyHandlers();
}

function toCard(it) {
  const catClass = `badge badge--cat badge--${slug(it.category)}`;
  const tags = (it.tags || [])
    .map(t => `<span class="badge badge--tag badge--${slug(t)}">${t}</span>`)
    .join(' ');

  return `
  <article class="card" role="listitem">
    <header>
      <code class="cmd">${escapeHtml(it.command)}</code>
      <span class="${catClass}">${it.category}</span>
    </header>
    <p class="desc">${escapeHtml(it.description)}</p>
    ${it.example ? `<pre class="cmd" aria-label="Exempel"><code>${escapeHtml(it.example)}</code></pre>` : ''}
    <div class="meta">
      <div>${tags}</div>
      <div>
        <button class="btn copy" data-copy="${escapeHtml(it.command)}">Kopiera</button>
        ${it.link ? `<a class="btn" href="${it.link}" target="_blank" rel="noopener">Läs mer</a>` : ''}
      </div>
    </div>
  </article>`;
}

// ------------------------
// Kopiera-knappar
// ------------------------
function attachCopyHandlers() {
  els('.copy').forEach(btn => {
    btn.onclick = async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Kopierat!';
        setTimeout(() => (btn.textContent = 'Kopiera'), 1000);
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        btn.textContent = 'Kopierat!';
        setTimeout(() => (btn.textContent = 'Kopiera'), 1000);
      }
    };
  });
}

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ------------------------
// UI-händelser
// ------------------------
searchInput.addEventListener('input', () => {
  localStorage.setItem('cmdSearch', searchInput.value);
  render();
});
catSelect.addEventListener('change', () => {
  localStorage.setItem('cmdCat', catSelect.value);
  render();
});
sortSelect.addEventListener('change', () => {
  localStorage.setItem('cmdSort', sortSelect.value);
  render();
});

// Snabbtangent: '/' för fokus, Esc för att rensa
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault(); searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.value = ''; localStorage.removeItem('cmdSearch'); render();
  }
});

// -------------------------------------------------
// Tema-växling (säkert och tillgängligt) – IIFE
// -------------------------------------------------
(() => {
  const btn = document.getElementById('themeToggle');
  if (!btn) return; // om knappen inte finns, gör inget

  // Första körningen: ta sparat tema, annars systemets preferens
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved  = localStorage.getItem('theme');
  const initial = saved || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(initial);

  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  });

  function applyTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);

    // uppdatera knappens text/aria
    if (theme === 'dark') {
      btn.textContent = '☀️ Ljust';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Byt till ljust läge');
    } else {
      btn.textContent = '🌙 Mörkt';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Byt till mörkt läge');
    }
  }
})();

// Starta appen
loadData();
