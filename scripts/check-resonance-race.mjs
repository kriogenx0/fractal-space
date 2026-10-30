// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { resonanceResponse, standingSample, createRace } = await import(`data:text/javascript;base64,${Buffer.from(readFileSync('dist/resonance-race.js')).toString('base64')}`);
const close = (a, b, tolerance = 1e-10) => assert(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);
for (const damping of [.01, .06, .7, 1]) {
  close(resonanceResponse(0, damping).gain, 1); close(resonanceResponse(0, damping).lag, 0);
  close(resonanceResponse(1, damping).gain, 1 / (2 * damping)); close(resonanceResponse(1, damping).lag, Math.PI / 2);
  for (const ratio of [.1, .8, 1, 1.2, 3]) { const p = resonanceResponse(ratio, damping); assert(p.gain > 0 && Number.isFinite(p.gain)); assert(p.lag >= 0 && p.lag <= Math.PI); }
}
assert(resonanceResponse(1, .01).gain > resonanceResponse(1, .5).gain, 'Damping lowers the resonant response');
for (const n of [1, 3, 12]) for (const time of [0, .123, 10000]) for (let node = 0; node <= n; node++) close(standingSample(node / n, time, n, 1, .01, 4), 0, 1e-13);
for (const ratio of [.5, 1, 2]) for (const damping of [.01, .2, 1]) {
  const n = 3, c = .8, natural = Math.PI * n * c, t = .31, h = 1e-5, x = .21, sample = t => standingSample(x, t, n, ratio, damping, c), u = sample(t), velocity = (sample(t + h) - sample(t - h)) / (2 * h), acceleration = (sample(t + h) - 2 * u + sample(t - h)) / (h * h), lag = resonanceResponse(ratio, damping).lag;
  close(acceleration + 2 * damping * natural * velocity + natural * natural * u, .02 * natural * natural * Math.sin(n * Math.PI * x) * Math.cos(natural * ratio * t + lag), 5e-6);
}
for (const reach of [.5, 3, 8]) for (const drop of [.25, 2, 6]) for (const gravity of [.1, 9.8, 40]) {
  const model = createRace(reach, drop, gravity);
  assert(model.cycloid.theta > 0 && model.cycloid.theta < 2 * Math.PI);
  assert(model.finish[0] < model.finish[1], 'The cycloid beats the straight line');
  assert(model.finish[0] <= model.finish[2] + 1e-9, 'The cycloid beats the test parabola');
  close(model.finish[1], Math.hypot(reach, drop) * Math.sqrt(2 / (gravity * drop)));
  for (let path = 0; path < 3; path++) {
    const start = model.sample(path, 0), end = model.sample(path, model.finish[path] * 2);
    start.position.forEach(v => close(v, 0)); close(start.speed, 0); assert(end.arrived);
    close(end.position[0], reach); close(end.position[1], drop); close(end.speed ** 2, 2 * gravity * drop, 1e-9);
    for (const f of [.05, .4, .8]) {
      const t = model.finish[path] * f, h = model.finish[path] * 1e-4, p = model.sample(path, t), before = model.sample(path, t - h).position, after = model.sample(path, t + h).position;
      assert(p.position.every(Number.isFinite) && !p.arrived); close(p.speed ** 2, 2 * gravity * p.position[1], 1e-9);
      const numericalSpeed = Math.hypot(...after.map((v, i) => (v - before[i]) / (2 * h)));
      assert(Math.abs(numericalSpeed - p.speed) / Math.max(.01, p.speed) < .006, 'Time inversion follows the energy-derived speed along the drawn path');
    }
  }
  const fastGravity = createRace(reach, drop, gravity * 4); model.finish.forEach((t, i) => close(fastGravity.finish[i], t / 2, 1e-9));
  const refined = createRace(reach, drop, gravity, 2048); close(refined.finish[2], model.finish[2], 2e-8);
  assert(model.times.every((t, i) => Number.isFinite(t) && (i === 0 || t > model.times[i - 1])));
}
const shallow = createRace(8, .25, 9.8); assert(shallow.cycloid.depth > shallow.drop, 'Wide cycloids dip below the finish before climbing');
const reference = createRace(3, 2, 9.8); close(reference.cycloid.radius, 1.00133, .00001); close(reference.cycloid.theta, 3.06878, .00001);
console.log('PASS: resonance gain/phase, modal boundaries/nodes and forced ODE residual; race endpoints, minimum times, energy/kinematic consistency, gravity scaling, quadrature convergence and wide-track dips.');
