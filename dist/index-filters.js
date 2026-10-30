// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
(() => {
  const group = document.querySelector('#index-filters');
  if (!group) return;
  const buttons = [...group.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.work-card')];
  const count = document.querySelector('#filter-count');
  const filters = new Set(buttons.map(button => button.dataset.filter));
  const entries = cards.map(card => ({ card, tags: new Set((card.dataset.tags || '').split(/\s+/)) }));
  function select(requested, updateURL = false) {
    const active = filters.has(requested) ? requested : 'all';
    let visible = 0;
    for (const { card, tags } of entries) {
      card.hidden = active !== 'all' && !tags.has(active);
      if (!card.hidden) visible++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === active));
    const total = String(cards.length).padStart(3, '0');
    count.textContent = active === 'all' ? `INDEX / ${total} EXPERIMENTS` : `INDEX / ${String(visible).padStart(3, '0')} OF ${total} EXPERIMENTS`;
    if (updateURL) {
      const url = new URL(window.location.href);
      if (active === 'all') url.searchParams.delete('tag'); else url.searchParams.set('tag', active);
      window.history.replaceState(null, '', url);
    }
  }
  function restore() { select(new URL(window.location.href).searchParams.get('tag')); }
  for (const button of buttons) button.addEventListener('click', () => select(button.dataset.filter, true));
  restore();
  group.hidden = false;
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
})();
