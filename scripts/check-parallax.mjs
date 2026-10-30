import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync('dist/parallax-scene.js', 'utf8');
const { makeStars, projectStar, heroPose, layers } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const state = { width: 1000, height: 625, time: 0, scroll: 0, pointer: [0, 0], depth: 1, drift: 1, reduced: false };
const stars = makeStars(state.width, state.height);
assert.deepEqual(stars.map(s => s.length), [175, 69, 25], 'Reference star densities');
assert.deepEqual(stars, makeStars(state.width, state.height), 'Stable star positions across identical builds');
assert(stars[2].some(s => s.triangle), 'Nearest layer has outlined triangles');
assert(stars.slice(0, 2).every(group => group.every(s => !s.triangle)), 'Triangles appear only in the nearest layer');
for (let i = 0; i < 3; i++) {
  const star = { x: 500, y: 300, radius: 1, opacity: .8, flicker: .6, phase: .3, triangle: false, layer: i };
  const base = projectStar(star, state), scrolled = projectStar(star, { ...state, scroll: 100 });
  assert(Math.abs(base.y - scrolled.y - 100 * layers[i].scroll) < 1e-9, 'Scroll follows the reference depth factor');
  const moved = projectStar(star, { ...state, pointer: [.5, .5] });
  assert.equal(base.x - moved.x, layers[i].pointer * .5, 'Pointer follows the reference factor');
  const quiet = projectStar(star, { ...state, reduced: true });
  assert.deepEqual(quiet, projectStar(star, { ...state, reduced: true, time: 999, pointer: [.5, -.5] }), 'Reduced motion removes autonomous and pointer motion');
  assert.equal(quiet.opacity, star.opacity, 'Reduced motion removes twinkling');
  assert.notEqual(quiet.y, projectStar(star, { ...state, reduced: true, scroll: 100 }).y, 'Reduced motion retains scroll-controlled depth');
  for (const scroll of [-1e6, 1e6]) { const p = projectStar(star, { ...state, scroll, time: 10000, depth: 12, drift: 10 }); assert(p.x >= 0 && p.x < state.width); assert(p.y >= 0 && p.y < state.height); assert(p.opacity >= 0 && p.opacity <= 1); }
}
assert.deepEqual(heroPose(350, 1000, false), { y: 63, opacity: .5 });
assert.deepEqual(heroPose(10000, 1000, true), { y: 0, opacity: 1 });
// Preview generated from the same seeded star geometry as the experiment.
if (process.argv.includes('--write')) {
  const shapes = ['<rect width="1000" height="625" fill="#060608"/>'];
  for (const group of stars) for (const star of group) {
    const p = projectStar(star, state), h = p.radius * 3.2;
    shapes.push(p.triangle ? `<path d="M${p.x} ${p.y-h}L${p.x+h*.9} ${p.y+h*.6}L${p.x-h*.9} ${p.y+h*.6}Z" fill="none" stroke="#fff" stroke-width=".8" opacity="${p.opacity}"/>` : `<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="#fff" opacity="${p.opacity}"/>`);
  }
  shapes.push('<path d="M500 215L555 310H445Z" fill="none" stroke="#f1f0ec" stroke-width="1.1"/>');
  writeFileSync('dist/thumbnails/tandava-parallax.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 1000 625">${shapes.join('')}</svg>`);
}
console.log('PASS: Tandava parallax densities, near-only triangles, scroll/pointer factors, reduced motion, wrapping, and hero fade.');

await import('./check-tandava-controller.mjs');
