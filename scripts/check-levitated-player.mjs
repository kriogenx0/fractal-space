// SPDX-License-Identifier: GPL-3.0-only — integration checks for the Levitated player.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const load = async name => import(`data:text/javascript;base64,${Buffer.from(readFileSync(`dist/levitated/${name}.js`, 'utf8')).toString('base64')}`);
const base = await load('experiments'), studies = await load('studies'), archive = await load('archive-experiments');
const source = readFileSync('dist/levitated/player.js', 'utf8').replace(/^import .*$/gm, '') + '\nglobalThis.inspect=()=>({model,selected,a,b,paused,slug});';
const html = readFileSync('dist/levitated.html', 'utf8'), ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
function player(slug, reduced = false, width = 600) {
  let clock = 0, callback, saved = false; const events = {}, elements = {};
  const finite = (...args) => assert(args.every(Number.isFinite), 'Player sends finite Canvas coordinates');
  const ctx = { globalAlpha: 1, setTransform: finite, fillRect: finite, strokeRect: finite, beginPath() {}, closePath() {}, moveTo: finite, lineTo: finite, arc: finite, fill() {}, stroke() {} };
  for (const id of ids) elements[id] = { value: '', hidden: false, textContent: '', style: {}, setAttribute(key, value) { this[key] = value; } };
  const document = { hidden: false, activeElement: null, fullscreenElement: null, title: '', querySelector(query) { assert(query.startsWith('#') && elements[query.slice(1)], `Element exists: ${query}`); return elements[query.slice(1)]; }, addEventListener(type, fn) { events[type] = fn; }, createElement() { return { click() { saved = true; } }; }, exitFullscreen: async () => { document.fullscreenElement = null; } };
  const canvas = elements.art; Object.assign(canvas, { getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width, height: width * 337 / 600 }), focus() { document.activeElement = canvas; }, setPointerCapture() {}, addEventListener(type, fn) { events[type] = fn; }, toBlob(fn) { fn({}); } });
  elements.stage.requestFullscreen = async () => { document.fullscreenElement = elements.stage; };
  const sandbox = { ...base, ...studies, ...archive, document, location: { search: `?work=${slug}` }, URLSearchParams, matchMedia: () => ({ matches: reduced }), performance: { now: () => clock }, devicePixelRatio: 1, ResizeObserver: class { observe() {} }, requestAnimationFrame: fn => callback = fn, URL: { createObjectURL: () => 'blob:preview', revokeObjectURL() {} }, setTimeout: fn => fn(), window: { addEventListener(type, fn) { events[type] = fn; } } };
  runInNewContext(source, sandbox);
  function frame() { clock += 40; callback(clock); }
  function pointer(x, y) { return { clientX: x / 600 * width, clientY: y / 600 * width, pointerId: 1 }; }
  return { state: () => sandbox.inspect(), elements, canvas, document, events, frame, hold(ms) { clock += ms; }, click(x, y) { const p = pointer(x, y); canvas.onpointerdown(p); canvas.onpointerup(p); }, down(x, y) { canvas.onpointerdown(pointer(x, y)); }, up(x, y) { canvas.onpointerup(pointer(x, y)); }, key(key) { canvas.onkeydown({ key, repeat: false, preventDefault() {} }); }, saved: () => saved };
}
for (const [slug, work] of Object.entries(base.works)) for (const reduced of [false, true]) {
  const ui = player(slug, reduced, reduced ? 390 : 600);
  assert.equal(ui.elements.title.textContent, work.name); assert.equal(ui.elements['original-source'].href, `levitated/${work.original}.zip`);
  assert.equal(ui.state().paused, reduced); for (let i = 0; i < 3; i++) ui.frame();
  ui.key('ArrowRight'); ui.key(' '); ui.frame(); ui.elements.pause.onclick(); ui.frame();
  ui.elements['param-a'].value = work.a[1]; ui.elements['param-a'].oninput();
  ui.elements['param-b'].value = work.b[2]; ui.elements['param-b'].oninput();
  ui.frame(); ui.elements.save.onclick(); assert(ui.saved(), `${slug}: PNG export click`);
  await ui.elements.fullscreen.onclick(); assert.equal(ui.document.fullscreenElement, ui.elements.stage);
  ui.elements.reset.onclick(); ui.frame(); assert(ui.elements.count.textContent.length > 0);
}
const golden = player('golden-spiral'); const beforeZoom = golden.state().b; let prevented = false; golden.events.wheel({ deltaY: -100, preventDefault() { prevented = true; } }); assert(prevented && golden.state().b > beforeZoom, 'Wheel zooms toward the spiral center'); golden.elements.action.onclick(); assert.equal(golden.state().a, 5, 'Next polygon advances the side count');
const planting = player('mycelium', true); const colonyCount = planting.state().model.data.nodes.length; planting.click(35, 35); assert(planting.state().model.data.nodes.length > colonyCount, 'Planting a colony works with motion paused');
const dla = player('dla'); const particles = dla.state().model.particles.length; dla.click(100, 120); assert.equal(dla.state().model.particles.length, particles + 1, 'Pointer plants one DLA seed');
const orbit = player('orbiting-networks'); const nodes = orbit.state().model.nodes.length; orbit.down(380, 180); assert.equal(orbit.state().model.nodes.length, nodes); orbit.hold(300); orbit.up(380, 180); assert.equal(orbit.state().model.nodes.length, nodes + 1); assert.equal(orbit.state().model.nodes.at(-1).size, 16, 'Hold duration determines new node size');
orbit.down(400, 160); orbit.canvas.onpointercancel(); orbit.up(400, 160); assert.equal(orbit.state().model.nodes.length, nodes + 1, 'Canceled pointer does not create a node');
const worm = player('ca-worm'); worm.key('ArrowRight'); assert.equal(worm.state().a, 115); assert.equal(worm.state().model.rule, 115);
const lorenz = player('deep-lorenz'); assert(lorenz.elements.original.href.endsWith('/levDeepLorenz.html'), 'Page name differs from source archive name');
const sea = player('sea-thing'); const model = sea.state().model, body = model.nodes[20]; sea.click(body.x + model.camera.x, body.y + model.camera.y); assert.equal(model.nodes[20].parent, -1, 'Click detaches the selected body');
console.log('PASS: all Levitated players initialize on desktop/mobile and with reduced motion; parameters, keyboard, pause, variation, fullscreen, export, hold/cancel, and source links work.');
