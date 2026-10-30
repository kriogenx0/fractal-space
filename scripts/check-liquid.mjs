// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { math, baseState } from './check-math.mjs';
const { liquidField, liquidColor, liquidPoint, liquidLayout, createLiquidDrops } = math;
const close = (a, b, eps = 1e-8) => assert(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const body = (x, y, radius = .5) => ({ x, y, radius });
const a = body(-.3, .2), b = body(.7, -.4), p = [.2, .5], epsilon = 1e-5;
const field = liquidField(...p, [a, b], .8);
close(field.value, liquidField(...p, [a], .8).value + liquidField(...p, [b], .8).value);
close(field.dx, (liquidField(p[0] + epsilon, p[1], [a, b], .8).value - liquidField(p[0] - epsilon, p[1], [a, b], .8).value) / (2 * epsilon));
close(field.dy, (liquidField(p[0], p[1] + epsilon, [a, b], .8).value - liquidField(p[0], p[1] - epsilon, [a, b], .8).value) / (2 * epsilon));
close(liquidField(.2, .3, [body(0, 0)]).value, liquidField(-.2, -.3, [body(0, 0)]).value);
assert(liquidField(0, 0, [body(-1, 0), body(1, 0)]).value < 1, 'Distant drops have a gap at their midpoint');
assert(liquidField(0, 0, [body(-.55, 0), body(.55, 0)]).value > 1, 'Nearby drops form a liquid neck');
assert(Number.isFinite(liquidField(0, 0, [body(0, 0)]).value), 'The softened field is finite at a droplet center');
for (const [w, h] of [[1000, 625], [390, 844]]) { const l = liquidLayout(w, h), q = liquidPoint(l.x + .8 * l.scale, l.y - .3 * l.scale, w, h); close(q[0], .8); close(q[1], -.3); }
const drops = createLiquidDrops(27, 9), twin = createLiquidDrops(27, 9);
assert.deepEqual(drops.bodies, twin.bodies, 'An arrangement is reproducible from its seed');
assert.deepEqual(liquidField(.1, .2, [drops.cursor]), liquidField(.1, .2, [body(drops.cursor.x, drops.cursor.y, drops.cursor.radius)]), 'The cursor uses exactly the droplet field');
const before = JSON.stringify(drops.bodies); assert.equal(drops.step(0), false); assert.equal(JSON.stringify(drops.bodies), before); assert.equal(drops.age, 0);
drops.scatter(); assert.notEqual(JSON.stringify(drops.bodies), before, 'Scatter visibly works while drift is frozen');
drops.configure(100); assert.equal(drops.bodies.length, 32); assert.equal(drops.add(0, 0), false); drops.configure(-10); assert.equal(drops.bodies.length, 2);
for (const count of [2, 32]) for (const drift of [.05, 3]) {
  const model = createLiquidDrops(1, count);
  for (let i = 0; i < 2000; i++) { model.cursor.x = Math.sin(i * .01) * 3; model.cursor.y = Math.cos(i * .01) * 2; model.step(drift); }
  for (const d of model.bodies) { assert(Object.values(d).every(Number.isFinite)); assert(Math.abs(d.x) <= 2.65 && Math.abs(d.y) <= 1.7, 'Long-running drops stay within their bounds'); }
}
for (let palette = 0; palette < 5; palette++) for (const f of [field, liquidField(0, 0, [body(0, 0)]), liquidField(1e3, 1e3, [body(0, 0)])]) assert(liquidColor(f, palette).every(v => Number.isInteger(v) && v >= 0 && v <= 255));
const state = baseState(math.catalog['liquid-cursor']);
let rendered;
const fake = () => ({ width: 0, height: 0, getContext: () => ({ createImageData(w, h) { rendered = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; return rendered; }, putImageData() {} }) });
const canvas = { width: 3200, height: 1800, getContext: () => ({ drawImage() {} }) }, bounded = math.createMathScene(canvas, 'liquid-cursor', fake);
bounded.draw(state); assert.equal(rendered.width, 400); assert.equal(rendered.height, 225); const visible = rendered.data.slice(); bounded.setPointerActive(false); bounded.draw(state); assert.notDeepEqual(rendered.data, visible, 'Hiding the cursor removes its field from the rendered pixels');
bounded.plant(state, 3000, 1500); const planted = bounded.data.bodies.at(-1), target = liquidPoint(3000, 1500, canvas.width, canvas.height); close(planted.x, target[0]); close(planted.y, target[1]); bounded.step(state); assert(planted.x > 2.65, 'Drops deposited beyond the initial cluster stay where they were placed');
assert(rendered.data.every(Number.isFinite)); assert(rendered.data.every((v, i) => i % 4 !== 3 || v === 255), 'Every pixel has an opaque background for PNG export');
console.log('PASS: liquid field superposition, analytic gradient, merging necks, cursor equivalence, seeded drops, frozen/scattered states, long-run bounds, palettes, pointer transforms, cursor visibility, and bounded raster work.');
