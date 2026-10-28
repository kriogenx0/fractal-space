// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Runs before CSS is applied so saved themes do not flash on page load.
(() => {
  const key = 'fractal-space-theme', themes = ['system', 'light', 'dark'];
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = 'system';
  try { const saved = localStorage.getItem(key); if (themes.includes(saved)) theme = saved; } catch { /* Storage can be unavailable in private/restricted contexts. */ }
  function apply() {
    root.dataset.theme = theme;
    const dark = theme === 'dark' || (theme === 'system' && system.matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101610' : '#f4f3ed');
  }
  apply();
  if (system.addEventListener) system.addEventListener('change', apply);
  else if (system.addListener) system.addListener(apply);
  function controls() {
    const select = document.querySelector('#theme-select');
    if (!select) return;
    select.value = theme;
    select.closest('.theme-control').hidden = false;
    select.addEventListener('change', () => {
      if (!themes.includes(select.value)) return;
      theme = select.value;
      try { if (theme === 'system') localStorage.removeItem(key); else localStorage.setItem(key, theme); } catch { /* The chosen theme still works for this visit. */ }
      apply();
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      theme = themes.includes(event.newValue) ? event.newValue : 'system';
      select.value = theme; apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', controls, { once: true });
  else controls();
})();
