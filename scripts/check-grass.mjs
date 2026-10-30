// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { wild } from './render-wild.mjs';
const { createGrassField, grassCamera, grassGust } = wild;
const a = createGrassField(7, 500), b = createGrassField(7, 500);
assert.deepEqual(a.blades, b.blades, 'Planting is seeded and repeatable');
assert.equal(createGrassField(1, 100000).blades.length, 5000);
assert.equal(createGrassField(1, 1).blades.length, 500);
for (const field of [a, b]) { field.configure(0, .2, 1, true); field.movePointer(.48, .45); for (let i = 0; i < 240; i++) field.step(); }
assert.deepEqual(a.blades, b.blades, 'Spring trajectories are deterministic');
const field = createGrassField(2, 500); field.configure(0, .2, 1, true);
assert(field.blades.every(b => b.x === 0 && b.z === 0), 'No wind or brush gives a straight equilibrium');
const blade = field.blades.find(b => b.nx > .4 && b.nx < .6 && b.u > .4 && b.u < .7), depth = 2.7 / (.04 + blade.u * 1.12), midY = .2 + (2.7 - blade.height * .5) * .85 / depth;
field.movePointer(blade.nx - .04, midY, true); assert(blade.x > .8, 'A paused brush bends nearby blades'); assert.equal(field.steps, 0); assert.equal(field.time, 0);
field.leave(true); assert(field.blades.every(b => b.x === 0 && b.z === 0));
field.movePointer(blade.nx - .04, midY); for (let i = 0; i < 60; i++) field.step(); assert(blade.x > .8); field.leave(); for (let i = 0; i < 180; i++) field.step(); assert(field.blades.every(b => Math.hypot(b.x, b.z) < .002), 'Damped blades recover after the brush leaves');
const gust = { start: 0, duration: 4, x: 1, z: 0, power: 1.5 };
assert.equal(grassGust(gust, 0, .5, .5), 0); assert.equal(grassGust(gust, 4, .5, .5), 0);
assert(grassGust(gust, 1.3, .2, .5) > grassGust(gust, 1.3, .8, .5) * 10);
assert(grassGust(gust, 2.7, .8, .5) > grassGust(gust, 2.7, .2, .5) * 10, 'Gusts travel across space');
const wind = createGrassField(4, 500); wind.configure(3, .5, .45);
for (let i = 0; i < 600; i++) { if (i % 50 === 0) wind.gust(); wind.movePointer((i % 100) / 100, .5 + Math.sin(i) * .2); wind.step(); }
assert(wind.gustCount > 10); assert(wind.gusts.length <= 3); assert(wind.blades.every(b => [b.x, b.z, b.vx, b.vz].every(Number.isFinite) && Math.hypot(b.x, b.z) <= 1.300001));
const scheduled = createGrassField(10, 500); for (let i = 0; i < 360; i++) scheduled.step(); assert.equal(scheduled.gustCount, 1, 'The first occasional gust arrives without interaction');
for (const [width, height] of [[390, 844], [1600, 900]]) { const camera = grassCamera(width, height); for (const blade of scheduled.blades) { const root = camera.root(blade), p = camera.project(...root); assert(Math.abs(p[0] / width - blade.nx) < 1e-12); assert(p.every(Number.isFinite)); } }

const source = readFileSync('dist/wild.js', 'utf8').replace(/^import .*$/gm, '') + '\nglobalThis.inspect=()=>({state,scene,paused});';
function player(reduced = false, width = 1000, height = 625) {
  let callback, clock = 0, saved = false; const events = {}, nodes = {};
  const finite = (...args) => assert(args.every(Number.isFinite));
  const ctx = { fillRect: finite, moveTo: finite, lineTo: finite, arc: finite, beginPath() {}, closePath() {}, fill() {}, stroke() {}, createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; } };
  for (const [, id] of readFileSync('dist/wild.html', 'utf8').matchAll(/id="([^"]+)"/g)) nodes[id] = { textContent: '', hidden: id === 'error', tagName: 'BUTTON', open: false, handlers: {}, setAttribute(k, v) { this[k] = v; }, addEventListener(k, fn) { this.handlers[k] = fn; } };
  Object.assign(nodes.art, { tagName: 'CANVAS', getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width, height }), focus() {}, setPointerCapture() {}, toBlob(fn) { fn({}); } });
  nodes['help-dialog'].showModal = () => nodes['help-dialog'].open = true; nodes['help-dialog'].close = () => nodes['help-dialog'].open = false;
  const document = { hidden: false, documentElement: { style: { setProperty() {} }, requestFullscreen: async () => document.fullscreenElement = true }, querySelector: q => nodes[q.slice(1)], addEventListener: (k, fn) => events['document:' + k] = fn, createElement: () => ({ click() { saved = true; } }) };
  const sandbox = { ...wild, document, location: { search: '?work=grass-wind' }, URLSearchParams, matchMedia: () => ({ matches: reduced }), devicePixelRatio: 1, performance: { now: () => clock }, requestAnimationFrame: fn => callback = fn, ResizeObserver: class { observe() {} }, window: { addEventListener: (k, fn) => events[k] = fn }, URL: { createObjectURL: () => 'blob:grass', revokeObjectURL() {} }, setTimeout: fn => fn() };
  runInNewContext(source, sandbox);
  return { nodes, document, state: () => sandbox.inspect(), frame() { clock += 40; callback(clock); }, key(key, target = nodes.art) { events.keydown({ key, target, repeat: false, preventDefault() {} }); }, up(key) { events.keyup({ key }); }, input(k, v) { nodes['param-' + k].value = v; nodes['param-' + k].handlers.input(); }, pointer(x, y, type = 'mouse') { return { clientX: x, clientY: y, pointerId: 1, pointerType: type }; }, saved: () => saved, blur() { events.blur(); }, visibility(hidden) { document.hidden = hidden; events['document:visibilitychange'](); } };
}
for (const [width, height] of [[1000, 625], [390, 844]]) {
  const ui = player(true, width, height), state = ui.state().state, data = ui.state().scene.data;
  assert(ui.state().paused); assert(ui.nodes['zoom-help'].hidden); assert.equal(ui.nodes.shuffle.textContent, 'New meadow ↻');
  const initial = data.blades.map(b => b.x); ui.nodes.art.onpointermove(ui.pointer(width * .4, height * .5)); ui.frame(); assert(data.pointer.active); assert.notDeepEqual(data.blades.map(b => b.x), initial); assert.equal(data.steps, 0);
  const camera = [state.yaw, state.pitch, state.zoom]; ui.nodes.art.onpointerdown(ui.pointer(100, 200, 'touch')); ui.nodes.art.onpointermove(ui.pointer(150, 220, 'touch')); ui.nodes.art.onpointerup(ui.pointer(150, 220, 'touch')); assert(!data.pointer.active); assert.deepEqual([state.yaw, state.pitch, state.zoom], camera, 'Brushing never orbits the camera');
  ui.key('ArrowRight'); ui.frame(); ui.up('ArrowRight'); assert(data.pointer.active); ui.nodes.art.onpointercancel(ui.pointer(150, 220)); assert(!data.pointer.active);
  const gusts = data.gustCount; ui.key(' '); ui.frame(); assert.equal(data.gustCount, gusts + 1); assert.equal(data.steps, 0, 'Paused gust previews do not advance time');
  ui.input('a', 0); ui.input('b', .5); ui.frame(); assert.equal(ui.state().scene.data, data); assert.equal(data.wind, 0); assert.equal(data.reach, .5);
  ui.key('p'); ui.frame(); assert(data.steps > 0); ui.key('p'); const pose = data.blades.map(b => [b.x, b.z]), time = data.time; ui.frame(); ui.frame(); assert.deepEqual(data.blades.map(b => [b.x, b.z]), pose, 'Pausing preserves the exact pose'); assert.equal(data.time, time);
  ui.nodes.art.onpointermove(ui.pointer(width * .4, height * .5)); ui.nodes.help.onclick(); assert(!data.pointer.active); const a = state.a; ui.key(' '); assert.equal(state.a, a); ui.nodes['close-help'].onclick();
  ui.key('r'); ui.frame(); assert.notEqual(ui.state().scene.data, data); assert.equal(state.a, 0); assert.equal(state.b, .5); assert.equal(ui.state().scene.data.steps, 0); ui.nodes.save.onclick(); assert(ui.saved());
  ui.key('p'); ui.visibility(true); const hidden = ui.state().scene.data.time; ui.frame(); assert.equal(ui.state().scene.data.time, hidden); ui.visibility(false); ui.frame(); assert(ui.state().scene.data.time > hidden); ui.blur(); assert(!ui.state().scene.data.pointer.active);
}
console.log('PASS: grass seed/geometry, calm equilibrium, spatial gusts/scheduling, bounded spring recovery, paused brush/gust/parameters, exact freeze, mobile touch/cancel, keyboard, reset, help, hidden tabs and PNG export.');
