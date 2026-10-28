import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const renderer = readFileSync('dist/parallax-scene.js', 'utf8');
const real = await import(`data:text/javascript;base64,${Buffer.from(renderer).toString('base64')}`);
const source = readFileSync('dist/tandava.js', 'utf8').replace(/^import[^\n]*\n/, '');
const nodes = new Map(), events = new Map(); let frame, builds = 0, draws = 0, observed;
const context = { setTransform() {}, fillRect() { draws++; }, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, arc() {}, fill() {} };
function node(selector) { if (!nodes.has(selector)) nodes.set(selector, { hidden: false, style: {}, setAttribute() {}, getContext: () => context, showModal() { this.open = true; }, close() { this.open = false; } }); return nodes.get(selector); }
const sandbox = {
  makeStars: (...args) => { builds++; return real.makeStars(...args); },
  projectStar(star, state) { observed = { time: state.time, pointer: [...state.pointer] }; return real.projectStar(star, state); }, heroPose: real.heroPose,
  document: { hidden: false, querySelector: node, querySelectorAll: () => [], addEventListener() {}, documentElement: {} },
  window: { addEventListener: (name, fn) => events.set(name, fn) }, matchMedia: () => ({ matches: false }),
  innerWidth: 1000, innerHeight: 625, scrollY: 0, devicePixelRatio: 1, performance: { now: () => 0 }, requestAnimationFrame(fn) { frame = fn; }
};
runInNewContext(source, sandbox);
assert.equal(builds, 1);
sandbox.innerHeight = 500; events.get('resize')(); assert.equal(builds, 1, 'URL-bar height changes keep the starfield');
sandbox.innerWidth = 1200; events.get('resize')(); assert.equal(builds, 2, 'Width changes rebuild the starfield');
events.get('pointermove')({ pointerType: 'mouse', clientX: 1200, clientY: 250 });
const initialDraws = draws;
frame(1000 / 120); assert(Math.abs(observed.pointer[0] - .025) < 1e-12, 'Exact reference easing: five percent per frame');
frame(2000 / 120); assert(Math.abs(observed.pointer[0] - .04875) < 1e-12);
assert.equal(draws, initialDraws + 2, 'Both 120Hz animation frames render; no 30fps throttle');
frame(1000); assert(Math.abs(observed.time - 1) < 1e-12, 'Drift follows elapsed time');
console.log('PASS: Tandava controller retains stars across mobile height changes, uses reference cursor easing, and renders every animation frame.');
