// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Global parameters (dist/signals.js): pure signal math, defaults, and page wiring.
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('dist/signals.js', 'utf8');
const module = { exports: null };
runInNewContext(source, { module, Math, Number, Array, JSON, Object, Set, Map, String });
const S = module.exports && { ...module.exports, PARAMS: [...module.exports.PARAMS], GLOBAL_DEFAULTS: { ...module.exports.GLOBAL_DEFAULTS }, defaultBindings: n => JSON.parse(JSON.stringify(module.exports.defaultBindings(n))) };
assert(S, 'signals.js exports its helpers outside the browser');

// Frequency bands map to valid, ordered, non-overlapping FFT bins.
const ranges = S.BANDS.map(b => S.bandRange(b.lo, b.hi, 48000, 2048));
for (const [a, b] of ranges) assert(a >= 1 && b >= a && b < 1024);
for (let i = 1; i < ranges.length; i++) assert(ranges[i][0] >= ranges[i - 1][1] - 1, 'bands are ordered');
assert.equal(S.bandLevel(new Uint8Array(1024).fill(255), ranges[0]), 1);
assert.equal(S.bandLevel(new Uint8Array(1024), ranges[2]), 0);

// The envelope attacks fast, releases slower, stays in 0..1, and decays to rest in silence.
const env = { peak: 0.08, value: 0 };
for (let i = 0; i < 10; i++) S.follow(env, 0.5, 1 / 60);
assert(env.value > 0.9 && env.value <= 1, 'attack reaches full scale');
let v = env.value; S.follow(env, 0, 1 / 60); assert(env.value < v && env.value > v * 0.8, 'release is gradual');
for (let i = 0; i < 600; i++) S.follow(env, 0, 1 / 60);
assert(env.value < 1e-3, 'silence returns to rest');

// Clock, loop and modulation.
assert.equal(S.timeOfDay(new Date(2026, 0, 1, 0, 0, 0)), 0);
assert.equal(S.timeOfDay(new Date(2026, 0, 1, 12, 0, 0)), 0.5);
assert.equal(S.LOOP_SECONDS, 20);
assert(Math.abs(S.loopPhase(0)) < 1e-12 && Math.abs(S.loopPhase(10000) - 1) < 1e-12 && Math.abs(S.loopPhase(20000)) < 1e-12, 'loop is 0→1→0 over 20 s');
assert(Math.abs(S.loopPhase(19999) - S.loopPhase(1)) < 1e-9, 'loop has no seam');
assert.equal(S.modulate(5, 0, 0.5, 0, 10), 5);
assert.equal(S.modulate(5, 1, 0.3, 0, 10), 8);
assert.equal(S.modulate(5, 1, 1, 0, 10), 10, 'clamped to max');
assert.equal(S.modulate(5, 1, -1, 0, 10), 0, 'negative amounts invert and clamp');

// Layers: P1–P3 default to song bands, every experiment binds to them by default.
assert.deepEqual(S.PARAMS, ['P1', 'P2', 'P3']);
assert.deepEqual(S.GLOBAL_DEFAULTS, { P1: 'bass', P2: 'mids', P3: 'highs' });
for (const key of ['bass', 'mids', 'highs', 'mouseX', 'mouseY', 'clock', 'loop']) assert(S.INPUTS.some(i => i.key === key), `input ${key}`);
for (const n of [0, 1, 2, 5]) {
  const b = S.defaultBindings(n);
  assert.deepEqual(b.map(x => x.param), ['P1', 'P2', 'P3']);
  assert.equal(new Set(b.map(x => x.target)).size, 3, 'default bindings drive distinct parameters');
  for (const x of b) assert(x.target.startsWith('fx:') || Number(x.target.slice(7)) < n);
}
// No default input is always live, so nothing moves until a song plays.
for (const p of S.PARAMS) assert(S.INPUTS.find(i => i.key === S.GLOBAL_DEFAULTS[p]).audio);

// Wiring: every interactive player loads it; the spectrum analyzer keeps its own audio.
for (const page of ['experiment', 'fractal', 'wild', 'math', 'levitated', 'orbit-breach', 'tandava']) {
  const html = readFileSync(`dist/${page}.html`, 'utf8');
  assert(html.includes('<script src="signals.js" defer></script>') && html.includes('href="signals.css"'), `${page}.html loads global parameters`);
}
assert(!readFileSync('dist/spectrum.html', 'utf8').includes('signals.js'));
assert(source.includes(`'${S.DEMO.src}'`) && statSync(`dist/${S.DEMO.src}`).size > 100000, 'bundled demo song exists');
assert(!/\.play\(\)/.test(source.split('async function play')[0]), 'nothing plays before the visitor asks');
console.log('PASS: global parameters — band bins/levels, envelope attack/release/rest, clock, seamless 20-s loop, clamped/inverted modulation, P1–P3 defaults and bindings, page wiring, bundled song.');
