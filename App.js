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
