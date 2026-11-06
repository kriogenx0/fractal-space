// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { wild, recorder } from './render-wild.mjs';
const { glyphAlphabet, glyphScripts, rainLayout, rainColumn, headRow, RAIN_RATE, createScene, driveValue, createLoudness } = wild;

// Alphabets: seeded, unique, bounded to the unit box, and distinct per script.
assert.equal(glyphScripts.length, 4);
for (let script = 0; script < 4; script++) {
  const a = glyphAlphabet(script, 3), b = glyphAlphabet(script, 3), keys = a.map(g => JSON.stringify(g));
  assert.deepEqual(a, b, 'Alphabets are repeatable for a seed');
  assert.equal(a.length, 48); assert.equal(new Set(keys).size, 48, 'Every glyph in a script is unique');
  for (const g of a) { assert(g.lines.length + g.dots.length > 0); for (const v of [...g.lines.flat(), ...g.dots.flat()]) assert(v >= 0 && v <= 1); }
  assert.notDeepEqual(glyphAlphabet(script, 4), a, 'A new seed invents a new alphabet');
}
assert(glyphAlphabet(2, 1).every(g => g.dots.length > 0), 'Pinhole code is punched from dots');
assert(glyphAlphabet(0, 1).every(g => g.lines.some(([x1, , x2]) => x1 === x2)), 'Stem runes keep a vertical stem');

// Layout and drop motion.
for (const [w, h] of [[390, 844], [1600, 900]]) for (const columns of [12, 120]) for (const zoom of [.4, 2.4]) {
  const near = rainLayout(w, h, columns, zoom, 1), far = rainLayout(w, h, columns, zoom, 0);
  assert(near.count >= 6 && near.count <= 180 && far.count <= 260 && far.count >= near.count);
  assert(Math.abs(near.cellW * near.count - w) < 1e-6 && near.rows * near.cellH >= h);
}
const [drop] = rainColumn(1, 1, 5, 40);
assert(drop.speed >= .55 && drop.speed <= 1.5 && drop.period > 40);
assert(Math.abs(headRow(drop, 10) - headRow(drop, 10 + drop.period / drop.speed)) < 1e-9, 'Drops wrap after one period');
assert(headRow(drop, 1) - headRow(drop, 0) > 0 || headRow(drop, 0) > drop.period * .5, 'Drops fall downward');
assert.deepEqual(rainColumn(1, 1, 5, 40), rainColumn(1, 1, 5, 40));

// Scene: deterministic drawing, pause-safe stepping, finite geometry and a bounded workload.
const base = { time: 8, a: 1, b: 48, pointer: [.1, -.1], yaw: .3, pitch: .38, zoom: 1, palette: 0, seed: 1, script: 0 };
const svg = state => { const r = recorder(1000, 625), scene = createScene(r.canvas, 'glyph-rain'); const status = scene.draw(state); return { svg: r.svg(), status, scene, calls: r.count() }; };
assert.equal(svg(base).svg, svg(base).svg, 'Identical state draws identically');
for (const change of [{ script: 1 }, { seed: 2 }, { palette: 3 }, { pointer: [-.8, .6] }, { yaw: 1.2 }, { zoom: 2 }, { lens: false }, { lensSize: .5 }]) assert.notEqual(svg({ ...base, ...change }).svg, svg(base).svg, `${Object.keys(change)} changes the image`);
assert.match(svg(base).status, /^\d+ columns · Stem runes · Tidepool · \d+ glyphs$/);
assert.match(svg({ ...base, script: 2, palette: 1 }).status, /Pinhole code · Ember/);
{ const { scene } = svg(base), start = scene.fall; scene.step(base, .05); assert(Math.abs(scene.fall - start - .05 * RAIN_RATE) < 1e-9); scene.step({ ...base, a: 0 }, 1); assert(Math.abs(scene.fall - start - .05 * RAIN_RATE) < 1e-9, 'Zero speed holds still'); }
{ const heavy = svg({ ...base, b: 120, zoom: .4, a: 4, time: 1e4 }); assert(heavy.calls < 400000, 'Densest setting stays within a bounded draw budget'); }

// Lens defaults keep existing previews; a hidden lens never displaces glyphs, whatever its size.
assert.equal(svg({ ...base, lens: true, lensSize: .2 }).svg, svg(base).svg);
assert.equal(svg({ ...base, lens: false, lensSize: .6 }).svg, svg({ ...base, lens: false, lensSize: .1 }).svg);
// Input mapping and loudness.
const sig = { x: .25, y: 1, audio: .5 };
assert.equal(driveValue('slider', 0, 4, sig, 1.3), 1.3); assert.equal(driveValue('mouse-x', 0, 4, sig, 1.3), 1); assert.equal(driveValue('mouse-y', .05, .6, sig, .2), .6);
assert.equal(driveValue('audio', 12, 120, sig, 48, 1), 66, 'Stepped parameters snap'); assert.equal(driveValue('audio', 0, 4, { ...sig, audio: null }, 2), 2, 'No audio keeps the current value');
assert.equal(driveValue('mouse-x', 0, 4, { x: 3 }, 0), 4, 'Signals are clamped');
{ const loud = createLoudness(); for (let i = 0; i < 60; i++) loud.push(0); assert(loud.level < .01); for (let i = 0; i < 30; i++) loud.push(.2); assert(loud.level > .9, 'Loud input rises quickly'); for (let i = 0; i < 30; i++) loud.push(.002); assert(loud.level < .2, 'Silence releases'); for (let i = 0; i < 600; i++) loud.push(.015); assert(loud.level > .5, 'Auto-gain adapts to a quiet microphone'); }

// Player integration: keyboard, buttons, pause and reduced motion.
const source = readFileSync('dist/wild.js', 'utf8').replace(/^import .*$/gm, '') + '\nglobalThis.inspect=()=>({state,scene,paused});';
function player(reduced = false, width = 1000, height = 625) {
  let callback, clock = 0, saved = false; const events = {}, nodes = {};
  const finite = (...args) => assert(args.every(Number.isFinite));
  const ctx = { fillRect: finite, moveTo: finite, lineTo: finite, arc: finite, beginPath() {}, closePath() {}, fill() {}, stroke() {}, createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; } };
  for (const [, id] of readFileSync('dist/wild.html', 'utf8').matchAll(/id="([^"]+)"/g)) nodes[id] = { textContent: '', hidden: id === 'error', tagName: 'BUTTON', open: false, handlers: {}, setAttribute(k, v) { this[k] = v; }, addEventListener(k, fn) { this.handlers[k] = fn; } };
  Object.assign(nodes.art, { tagName: 'CANVAS', getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width, height }), focus() {}, setPointerCapture() {}, toBlob(fn) { fn({}); } });
  nodes['help-dialog'].showModal = () => nodes['help-dialog'].open = true; nodes['help-dialog'].close = () => nodes['help-dialog'].open = false;
  const document = { hidden: false, documentElement: { style: { setProperty() {} } }, querySelector: q => nodes[q.slice(1)], addEventListener: (k, fn) => events['document:' + k] = fn, createElement: () => ({ click() { saved = true; } }) };
  const sandbox = { ...wild, document, location: { search: '?work=glyph-rain' }, URLSearchParams, matchMedia: () => ({ matches: reduced }), devicePixelRatio: 1, performance: { now: () => clock }, requestAnimationFrame: fn => callback = fn, ResizeObserver: class { observe() {} }, window: { addEventListener: (k, fn) => events[k] = fn }, URL: { createObjectURL: () => 'blob:glyph', revokeObjectURL() {} }, setTimeout: fn => fn() };
  runInNewContext(source, sandbox);
  return { nodes, state: () => sandbox.inspect(), frame() { clock += 40; callback(clock); }, key(key) { events.keydown({ key, target: nodes.art, repeat: false, preventDefault() {} }); }, up(key) { events.keyup({ key }); }, saved: () => saved };
}
for (const [width, height] of [[1000, 625], [390, 844]]) {
  const ui = player(false, width, height), { state, scene } = ui.state();
  assert.equal(ui.nodes.shuffle.textContent, 'New alphabet ↻'); assert.equal(ui.nodes.special.textContent, 'Change the script');
  ui.frame(); ui.frame(); const moving = scene.fall; ui.frame(); assert(scene.fall > moving, 'Rain falls while playing');
  ui.key(' '); assert.equal(state.script, 1); ui.nodes.special.onclick(); assert.equal(state.script, 2); ui.key(' '); ui.key(' '); assert.equal(state.script, 0, 'Four scripts cycle');
  const seed = state.seed, yaw = state.yaw, palette = state.palette; ui.key('r'); assert.equal(state.seed, seed + 1); assert.equal(state.yaw, yaw, 'New alphabet keeps the slant'); assert.equal(state.palette, palette);
  ui.key('ArrowLeft'); ui.frame(); ui.up('ArrowLeft'); assert(state.pointer[0] < 0, 'Arrow keys move the lens');
  ui.key('p'); const frozen = scene.fall; ui.frame(); ui.frame(); assert.equal(scene.fall, frozen, 'Pause freezes the rain');
  ui.key('='); assert(state.zoom > 1, 'Zoom changes glyph size'); ui.nodes.save.onclick(); assert(ui.saved());
  assert.match(ui.nodes.status.textContent, /columns · /);
}
{ const ui = player(true), { scene } = ui.state(); assert(ui.state().paused); const still = scene.fall; ui.frame(); ui.frame(); assert.equal(scene.fall, still, 'Reduced motion starts paused'); assert(still > 0, 'Reduced motion still shows a populated frame'); }
console.log('PASS: glyph rain alphabets, layouts, drop wrapping, deterministic drawing, interaction responses, bounded density, script cycling, new alphabet, lens keys, pause, reduced motion, zoom and PNG export.');
