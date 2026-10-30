// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const wave = await import(`data:text/javascript;base64,${Buffer.from(readFileSync('dist/wave-studies.js')).toString('base64')}`);
const { chladniField: field, chladniContours: contours, createChladni, dampedMode, coupledSample: sample } = wave;
const close = (a, b, tolerance = 1e-10) => assert(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);
for (const [m, n, mix] of [[3, 5, -1], [1, 12, .35], [12, 12, 1], [4, 4, -1]]) {
  for (const [x, y] of [[.13, .27], [.4, .9], [0, 1]]) {
    const f = field(x, y, m, n, mix), h = 1e-6;
    close(f.dx, (field(x + h, y, m, n, mix).value - field(x - h, y, m, n, mix).value) / (2 * h), 2e-7);
    close(f.dy, (field(x, y + h, m, n, mix).value - field(x, y - h, m, n, mix).value) / (2 * h), 2e-7);
  }
  const segments = contours(m, n, mix);
  if (m === n && mix === -1) { assert.equal(segments.length, 0); close(field(.2, .4, m, n, mix).value, 0); continue; }
  assert(segments.length > (m === n ? 2 : 100) && segments.length < 150000);
  for (const [a, b] of segments) {
    assert(a.concat(b).every(v => Number.isFinite(v) && v >= 0 && v <= 1));
    assert(Math.abs(field((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, m, n, mix).value) < .035, 'Vector contours stay near the analytic zero set');
  }
}
for (let x = 0; x < 1; x += .071) close(field(x, x, 3, 5, -1).value, 0);
const grains = createChladni(3, 5, -1, 2800, 7), repeat = createChladni(3, 5, -1, 2800, 7);
assert.deepEqual(grains.particles, repeat.particles, 'Seeded relaxation is repeatable');
const residual = () => grains.particles.reduce((sum, p) => sum + Math.abs(field(...p, 3, 5, -1).value), 0) / grains.particles.length;
assert(residual() < .004, 'Initial static preview settles toward nodal lines');
const settled = residual(); grains.stir(.5, .5); assert(residual() > settled); assert.equal(grains.steps, 0, 'Paused stirring does not advance time');
const disturbed = residual(); for (let i = 0; i < 25; i++) grains.step(); assert(residual() < disturbed / 100);
assert(grains.particles.flat().every(v => Number.isFinite(v) && v >= 0 && v <= 1));
assert.equal(createChladni(1, 12, .4, 10000).particles.length, 6000);
const cancelled = createChladni(5, 5, -1, 500); const positions = structuredClone(cancelled.particles); cancelled.step(); assert.deepEqual(cancelled.particles, positions);

for (const coupling of [0, .2, 5]) for (const damping of [0, .3, 2]) for (const stiffness of [.1, 4, 16]) for (const release of [0, 1, 2]) {
  const initial = sample(0, coupling, damping, stiffness, .8, release); close(initial.x, .8); close(initial.y, release === 0 ? 0 : release === 1 ? .8 : -.8); close(initial.vx, 0); close(initial.vy, 0);
  let previousEnergy = initial.energy;
  for (const t of [.1, 1, 5, 30, 10000]) {
    const p = sample(t, coupling, damping, stiffness, .8, release); assert(Object.values(p).every(Number.isFinite));
    if (!damping) close(p.energy, initial.energy, 1e-12); else assert(p.energy <= previousEnergy + 1e-12, 'Damping never increases total energy');
    previousEnergy = p.energy;
    if (release === 1) { close(p.x, p.y); close(p.vx, p.vy); }
    if (release === 2) { close(p.x, -p.y); close(p.vx, -p.vy); }
    if (coupling === 0 && release === 0) { close(p.y, 0); close(p.vy, 0); }
  }
  const t = .73, h = 1e-5, p = sample(t, coupling, damping, stiffness, .8, release), a = sample(t - h, coupling, damping, stiffness, .8, release), b = sample(t + h, coupling, damping, stiffness, .8, release);
  close((b.x - a.x) / (2 * h), p.vx, 1e-8); close((b.y - a.y) / (2 * h), p.vy, 1e-8);
  close((b.vx - a.vx) / (2 * h), -stiffness * p.x - coupling * (p.x - p.y) - 2 * damping * p.vx, 1e-7);
  close((b.vy - a.vy) / (2 * h), -stiffness * p.y - coupling * (p.y - p.x) - 2 * damping * p.vy, 1e-7);
}
const critical = dampedMode(1, 0, 4, 2, 1); close(critical[0], 3 * Math.exp(-2)); close(critical[1], -4 * Math.exp(-2));
close(sample(10, 0, 0, 4, 1).x, Math.cos(20));
assert.equal(sample(20, 5, 2, .1, 0).energy, 0, 'Zero release remains at equilibrium');
console.log('PASS: Chladni analytic gradient, zero-set contours, cancellation, seeded relaxation/stirring/bounds; coupled exact ODE residuals, normal modes, critical/overdamping, equilibrium, conservation and dissipation.');
