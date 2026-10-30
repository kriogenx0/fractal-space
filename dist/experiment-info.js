// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Keep the mobile canvas clear; the existing modal owns experiment details.
(() => {
  const $ = id => document.getElementById(id), title = $('title'), mobile = $('mobile-title'), help = $('help');
  if (!title || !mobile || !help) return;
  function heading() { mobile.textContent = title.textContent; mobile.title = title.textContent; $('info-title').textContent = title.textContent; }
  function details() {
    heading();
    for (const id of ['description', 'equation', 'measurement']) {
      const source = $(id), target = $('info-' + id);
      target.textContent = source?.textContent ?? '';
      target.hidden = !source || source.hidden || !target.textContent.trim();
    }
  }
  heading();
  new MutationObserver(heading).observe(title, { childList: true, characterData: true, subtree: true });
  help.addEventListener('click', details);
  document.body.classList.add('has-experiment-info');
})();
