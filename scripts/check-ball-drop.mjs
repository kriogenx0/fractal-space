// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { math } from './check-math.mjs';
const { createBallDrop, ballDropLayout } = math;
const close = (a, b, message) => assert(Math.abs(a - b) < 1e-9, message);
const flight = createBallDrop(9.81, .75, 6); for (let i = 0; i < 30; i++) flight.step(); close(flight.height, 6 - 9.81 / 2, 'Free fall follows the exact quadratic'); close(flight.velocity, -9.81); close(flight.energy, 9.81 * 6);
for (const e of [0, .1, .5, .75, 1]) {
  const b = createBallDrop(2, e, 1); b.step(1); assert.equal(b.bounces, 1); close(b.height, 0); close(b.lastImpact.time, 1); close(b.velocity, 2 * e); close(b.energy, 2 * e * e, 'An impact retains e squared of mechanical energy');
  if (e) { b.step(e); close(b.velocity, 0); close(b.height, e * e, 'The next apex has e squared of the previous height'); }
  else { assert(b.resting); assert.equal(b.step(), false); }
}
const moon = createBallDrop(1.62, .75, 6), earth = createBallDrop(); assert(moon.firstImpact > earth.firstImpact * 2, 'Lunar gravity produces a slower fall');
const zero = createBallDrop(0, 1, 20); for (let i = 0; i < 1000; i++) assert.equal(zero.step(), false); assert.equal(zero.height, 20); assert.equal(zero.velocity, 0); assert.equal(zero.bounces, 0); assert.equal(zero.firstImpact, null);
// Resolving collision times makes playback speed independent of frame partitioning.
const slow = createBallDrop(24.79, .8, 6), fast = createBallDrop(24.79, .8, 6); for (let i = 0; i < 600; i++) slow.step(.005); for (let i = 0; i < 30; i++) fast.step(.1); close(slow.height, fast.height); close(slow.velocity, fast.velocity); assert.equal(slow.bounces, fast.bounces);
for (const gravity of [.01, 1.62, 9.81, 40]) for (const e of [0, .01, .75, .9999, 1]) for (const height of [.25, 20]) {
  const b = createBallDrop(gravity, e, height), energy = b.energy; for (let i = 0; i < 3000; i++) { b.step(.1); assert([b.height, b.velocity, b.energy].every(Number.isFinite)); assert(b.height >= 0 && b.height <= height + 1e-8); assert(b.energy <= energy + 1e-8); }
  assert(b.trail.length <= 601); if (e === 1) close(b.energy, energy, 'Elastic rebounds conserve energy over a long run'); if (e === 0) assert(b.resting);
}
const fine = createBallDrop(40, .01, .25); fine.step(1); assert(fine.resting && fine.bounces < 10, 'Tiny rebounds settle without an unbounded collision loop');
for (const [width, height] of [[390, 844], [1600, 900]]) for (const release of [.25, 20]) { const l = ballDropLayout(width, height, release); assert(l.floor - release * l.scale - l.radius > 0); assert(l.floor < height * .7); }
assert.throws(() => createBallDrop(-1)); assert.throws(() => createBallDrop(1, 1.1)); assert.throws(() => createBallDrop(1, .5, NaN));
console.log('PASS: ball drop — analytic flight/impact times, restitution and apex energy, lunar/zero gravity, playback partition independence, stable long-run endpoints, bounded trails, inelastic rest, and mobile layout.');
