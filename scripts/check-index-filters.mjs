// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync('dist/index.html', 'utf8'), source = readFileSync('dist/index-filters.js', 'utf8');
const cards = [...html.matchAll(/<a class="work-card" href="([^"]+)"([^>]*)>/g)].map(([, href, attributes]) => ({ href, tags: attributes.match(/data-tags="([^"]+)"/)?.[1], attributes }));
const filters = [...html.matchAll(/<button type="button" data-filter="([^"]+)" aria-pressed="([^"]+)" aria-controls="experiments">([^<]+)<\/button>/g)].map(([, key, pressed, label]) => ({ key, pressed, label }));
assert.deepEqual(filters.map(f => f.key), ['all', 'math', 'art', 'fractal', 'geometry', 'physics', 'sound', 'games', 'levitated']);
assert.equal(filters.filter(f => f.pressed === 'true').length, 1); assert.equal(filters[0].pressed, 'true');
assert(html.includes('aria-label="Filter experiments" hidden'), 'Controls are progressively enhanced');
assert(html.includes('id="filter-count" role="status" aria-live="polite" aria-atomic="true"'));
assert(html.includes('<script src="index-filters.js" defer></script>'));
assert(html.includes('class="card-grid" id="experiments"'));
for (const card of cards) { assert(card.tags, `${card.href} has tags`); assert(!/\bhidden\b/.test(card.attributes), 'All cards remain available without JavaScript'); for (const tag of card.tags.split(' ')) assert(filters.some(f => f.key === tag) && tag !== 'all', `Known tag: ${tag}`); }
const tags = href => cards.find(c => c.href === href).tags.split(' ');
assert(tags('fractal.html?work=mandelbulb').includes('fractal')); assert(tags('math.html?work=klein-bottle').includes('geometry')); assert(tags('math.html?work=ball-drop').includes('physics')); assert(tags('math.html?work=orbit-ink').includes('art')); assert(tags('levitated.html?work=invader-fractal').includes('levitated'));
function browser(href = 'https://fractalspace.org/') {
  const events = {}, location = { href }, history = { replaceState(_, __, url) { location.href = String(url); } };
  const items = cards.map(c => ({ href: c.href, dataset: { tags: c.tags }, hidden: false }));
  const buttons = filters.map(f => ({ dataset: { filter: f.key }, attributes: {}, listeners: {}, setAttribute(k, v) { this.attributes[k] = v; }, addEventListener(k, fn) { this.listeners[k] = fn; } }));
  const group = { hidden: true, querySelectorAll: () => buttons }, count = { textContent: '' };
  runInNewContext(source, { URL, document: { querySelector: q => q === '#index-filters' ? group : count, querySelectorAll: () => items }, window: { location, history, addEventListener: (event, fn) => events[event] = fn } });
  return { buttons, group, count, items, location, visible: () => items.filter(c => !c.hidden).map(c => c.href), click(key) { buttons.find(b => b.dataset.filter === key).listeners.click(); }, navigate(url, event = 'popstate') { location.href = url; events[event](); } };
}
const ui = browser(); assert(!ui.group.hidden); assert.equal(ui.visible().length, 67);
for (const { key } of filters) {
  ui.click(key);
  const selected = ui.buttons.filter(b => b.attributes['aria-pressed'] === 'true'); assert.equal(selected.length, 1); assert.equal(selected[0].dataset.filter, key);
  const expected = cards.filter(c => key === 'all' || c.tags.split(' ').includes(key)).map(c => c.href);
  assert(expected.length > 0, `Filter ${key} has results`); assert.deepEqual(ui.visible(), expected, 'Filtering preserves authored card order and hides irrelevant links');
  assert(ui.count.textContent.includes(String(expected.length).padStart(3, '0')));
  const url = new URL(ui.location.href); assert.equal(url.searchParams.get('tag'), key === 'all' ? null : key);
  assert.deepEqual(browser(url.href).visible(), expected, 'Shared URLs restore the selected collection');
}
ui.click('all'); assert.equal(ui.count.textContent, 'INDEX / 067 EXPERIMENTS'); assert.equal(ui.visible()[0], 'fractal.html?work=mandelbulb'); assert.deepEqual(ui.visible().slice(-2), ['levitated.html?work=invader-fractal', 'tandava.html']); assert(!ui.visible().some(href => href.includes('dream-strata')));
const shared = browser('https://fractalspace.org/?campaign=sample&tag=physics#experiments'); assert(shared.visible().includes('math.html?work=ball-drop')); assert(!shared.visible().includes('math.html?work=klein-bottle')); shared.click('all'); const url = new URL(shared.location.href); assert.equal(url.searchParams.get('campaign'), 'sample'); assert.equal(url.hash, '#experiments'); assert.equal(url.searchParams.get('tag'), null);
for (const tag of ['unknown', 'toString', '__proto__', '']) assert.equal(browser('https://fractalspace.org/?tag=' + tag).visible().length, 67, 'Unknown tags safely show All');
shared.navigate('https://fractalspace.org/?tag=geometry'); assert(shared.visible().includes('math.html?work=klein-bottle')); shared.navigate('https://fractalspace.org/?tag=art', 'pageshow'); assert(shared.visible().includes('math.html?work=orbit-ink')); assert.equal(shared.buttons.find(b => b.dataset.filter === 'art').attributes['aria-pressed'], 'true', 'Restored pages synchronize buttons and result count');
const css = readFileSync('dist/style.css', 'utf8'); assert(css.includes('.index-filters[hidden],.work-card[hidden]{display:none}'), 'Filtered anchors leave both layout and tab order'); assert(css.includes('min-height:44px'), 'Filter buttons retain touch-sized targets'); assert(css.includes('color:var(--ui-muted,var(--ink))'), 'Filters use the shared contrast-tested theme palette');
console.log('PASS: all index tags, overlapping collections, accessible filter/count markup, stable card order, shareable URLs, back/forward/page restoration, invalid tags, unfiltered fallback, and themed mobile controls.');
