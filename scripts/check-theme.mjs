// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('dist/theme.js', 'utf8');
const pages = readdirSync('dist').filter(name => name.endsWith('.html'));
for (const page of pages) {
  const html = readFileSync(`dist/${page}`, 'utf8');
  assert.equal((html.match(/id="theme-select"/g) ?? []).length, 1, `${page}: one accessible theme selector`);
  assert(html.includes('aria-label="Color theme"'), `${page}: theme selector needs a label`);
  assert(html.includes('name="color-scheme" content="light dark"'), `${page}: native controls support both themes`);
  assert(html.includes('name="theme-color"'), `${page}: browser chrome has a theme color`);
  assert(html.includes('<script src="theme.js"></script>'), `${page}: theme applies during head parsing`);
  assert(html.indexOf('src="theme.js"') < html.indexOf('rel="stylesheet"'), `${page}: saved preference applies before CSS`);
  assert(html.indexOf('href="theme.css"') > html.lastIndexOf('</style>'), `${page}: theme CSS follows inline styles`);
  assert(html.indexOf('href="theme.css"') < html.indexOf('</head>'), `${page}: shared theme CSS is loaded`);
}
function browser({ storage = new Map(), dark = false, blocked = false, loading = true, legacyMedia = false } = {}) {
  const events = {}, mediaEvents = {}, selectEvents = {}, root = { dataset: {} }, control = { hidden: true };
  let ready = !loading, meta;
  const select = { value: '', closest: () => control, addEventListener: (type, fn) => selectEvents[type] = fn };
  const media = { matches: dark, ...(legacyMedia ? { addListener: fn => mediaEvents.change = fn } : { addEventListener: (type, fn) => mediaEvents[type] = fn }) };
  const document = {
    documentElement: root, readyState: loading ? 'loading' : 'complete',
    querySelector: query => query === '#theme-select' ? (ready ? select : null) : { setAttribute: (_, value) => meta = value },
    addEventListener: (type, fn) => events[type] = fn
  };
  runInNewContext(source, {
    document, window: { matchMedia: () => media, addEventListener: (type, fn) => events[type] = fn },
    localStorage: {
      getItem: key => { if (blocked) throw Error('blocked'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); },
      removeItem: key => { if (blocked) throw Error('blocked'); storage.delete(key); }
    }
  });
  return {
    root, control, select, meta: () => meta,
    ready() { ready = true; events.DOMContentLoaded?.(); },
    choose(value) { select.value = value; selectEvents.change(); },
    system(value) { media.matches = value; mediaEvents.change(); },
    storage(key, newValue) { events.storage({ key, newValue }); }
  };
}
const key = 'fractal-space-theme', shared = new Map();
for (const choice of ['light', 'dark']) {
  shared.set(key, choice);
  for (const page of pages) {
    const tab = browser({ storage: shared, dark: choice !== 'dark' });
    assert.equal(tab.root.dataset.resolvedTheme, choice, `${page}: saved choice wins before DOM ready`);
    assert.equal(tab.meta(), choice === 'dark' ? '#101610' : '#f4f3ed');
    tab.ready(); assert.equal(tab.select.value, choice); assert.equal(tab.control.hidden, false);
  }
}
const tab = browser({ storage: shared, dark: true }); tab.ready();
tab.choose('light'); assert.equal(shared.get(key), 'light');
tab.system(false); tab.system(true); assert.equal(tab.root.dataset.resolvedTheme, 'light');
tab.choose('system'); assert(!shared.has(key)); assert.equal(tab.root.dataset.resolvedTheme, 'dark');
tab.system(false); assert.equal(tab.root.dataset.resolvedTheme, 'light');
tab.storage(key, 'dark'); assert.equal(tab.select.value, 'dark'); assert.equal(tab.root.dataset.resolvedTheme, 'dark');
tab.storage('another-setting', 'light'); assert.equal(tab.root.dataset.resolvedTheme, 'dark');
tab.storage(null, null); assert.equal(tab.select.value, 'system');
const beforeReady = browser(); beforeReady.storage(key, 'dark'); beforeReady.ready(); assert.equal(beforeReady.select.value, 'dark');
const invalid = browser({ storage: new Map([[key, 'bad-preference']]), dark: true }); invalid.ready(); assert.equal(invalid.select.value, 'system');
for (const loading of [true, false]) {
  const restricted = browser({ blocked: true, loading }); restricted.ready(); restricted.choose('dark'); assert.equal(restricted.root.dataset.resolvedTheme, 'dark');
}
const legacy = browser({ legacyMedia: true }); legacy.ready(); legacy.system(true); assert.equal(legacy.root.dataset.resolvedTheme, 'dark');

// Verify actual shared CSS text colors remain readable on both interface surfaces.
const css = readFileSync('dist/theme.css', 'utf8');
function luminance(hex) {
  const c = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
}
let palettes = 0;
for (const [, scheme, block] of css.matchAll(/color-scheme:(light|dark);([^}]+)/g)) {
  const colors = Object.fromEntries([...block.matchAll(/--ui-([a-z]+):(#[a-f0-9]{6})(?=;|$)/g)].map(m => [m[1], m[2]]));
  for (const foreground of ['ink', 'muted', 'meta', 'accent']) for (const background of ['bg', 'surface']) {
    const a = luminance(colors[foreground]), b = luminance(colors[background]);
    assert((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${scheme}: ${foreground} on ${background} needs readable contrast`);
  }
  palettes++;
}
assert.equal(palettes, 3, 'Default light, system dark and explicit dark palettes are checked');
console.log(`PASS: themes on all ${pages.length} pages; navigation persistence, system/explicit changes, cross-tab sync, blocked storage, and interface text contrast.`);
