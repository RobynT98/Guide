// === Tema-växling (safe & tillgänglig) ===
(() => {
  const btn = document.getElementById('themeToggle');
  if (!btn) return; // om knappen inte finns, gör inget

  // Första körningen: ta sparat tema, annars systemets preferens
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('theme');
  const initial = saved || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(initial);

  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  });

  function applyTheme(theme) {
    // rensa båda först så vi inte samlar på oss klasser
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);

    // uppdatera knappens state/ikon
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
