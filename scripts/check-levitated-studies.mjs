// SPDX-License-Identifier: GPL-3.0-only — verification and previews for the Levitated adaptations.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = readFileSync('dist/levitated/studies.js', 'utf8');
const { createDLA, drawDLA, createGarden, drawGarden, createWorm, nextCARow, drawWorm, createLorenz, lorenzStep, drawLorenz, createOrbits, drawOrbits, createSeaThing, drawSeaThing } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const finite = (values, message = 'Finite simulation coordinates') => assert(values.every(Number.isFinite), message);
const dla = createDLA(7);
for (let i = 0; i < 160; i++) dla.step(1, 12);
assert(dla.particles.length > 100, 'DLA attaches drifting particles to the seed');
assert(dla.particles.length <= dla.limit); assert.equal(dla.walkers.length, 96);
for (let i = 0; i < dla.particles.length; i++) { const n = dla.particles[i]; finite([n.x, n.y, n.radius]); assert(n.parent < i, 'Attachments point to an existing particle'); if (n.parent >= 0) { const p = dla.particles[n.parent]; assert(Math.hypot(n.x - p.x, n.y - p.y) <= 15 + p.radius + 1e-8, 'A rotated hit probe must touch its parent'); } }
for (const n of dla.walkers) { finite([n.x, n.y, n.vx, n.vy]); assert(Math.abs(n.vx) <= 5 && Math.abs(n.vy) <= 5); }
const sparse = createDLA(7); for (let i = 0; i < 30; i++) sparse.step(0, 12); assert.equal(sparse.particles.length, 1, 'Zero stickiness cannot attach');
while (sparse.particles.length < sparse.limit) sparse.seedAt(300, 169); assert.equal(sparse.seedAt(0, 0), -1, 'DLA growth is bounded');
const garden = createGarden(1); for (let i = 0; i < 250; i++) garden.step(); assert(garden.nodes.length > 4, 'Recursive initial roots grow');
const leaf = garden.nodes.findIndex((n, i) => i > 0 && !n.children.length && n.phase === 1); assert(leaf > 0);
const parent = garden.nodes[garden.nodes[leaf].parent], previous = parent.target;
assert(garden.grow(leaf, 60)); assert(garden.nodes[leaf].target <= 73, 'Interactive child growth has the source scale cap'); assert(parent.target >= previous, 'Nourishment reaches ancestors');
for (let n = 0; n < 80; n++) { for (let i = 0; i < garden.nodes.length; i++) garden.grow(i, 60); for (let k = 0; k < 24; k++) garden.step(3); }
assert(garden.nodes.length <= garden.limit); for (const p of garden.poses()) { finite([p.x, p.y, p.scale, p.angle]); assert(p.x >= 20 && p.x <= 580 && p.y >= 20 && p.y <= 320, 'Growing roots stay in view'); }
for (let rule = 0; rule < 256; rule++) for (let neighborhood = 0; neighborhood < 8; neighborhood++) {
  const bits = ((neighborhood & 1) << 15) | (((neighborhood >> 1) & 1) << 16) | (((neighborhood >> 2) & 1) << 17);
  assert.equal((nextCARow(bits, rule) >>> 16) & 1, (rule >>> neighborhood) & 1, 'All Wolfram rules preserve source bit order');
}
assert.equal(nextCARow(0x80000000, 90), 0x40000001, 'CA ring wraps bit 31 to bit 0');
for (const rule of [0, 30, 90, 114, 255]) { const model = createWorm(1, rule); for (let n = 0; n < 1000; n++) model.step(16); assert(model.rows.length <= 320 && model.rows.length > 0); model.rows.forEach(p => finite([p.x, p.y, p.angle, p.scale])); }
assert.deepEqual(lorenzStep([1, 2, 3]), [1.1, 2.23, 2.94], 'Euler update uses the original Lorenz constants and simultaneous state');
const lorenz = createLorenz(3); for (let n = 0; n < 3000; n++) lorenz.step(2200); assert.equal(lorenz.points.length, 2200); for (const p of lorenz.points) { finite(p); assert(p.every(v => Math.abs(v) < 100)); }
const orbits = createOrbits(1); const orbit = orbits.nodes.find(n => n.parent >= 0), angle = orbit.angle;
orbits.step(1, 119); assert(Math.abs(orbit.angle - angle - orbit.speed) < 1e-10); orbits.step(1, 219); assert(Math.abs(orbit.angle - angle) < 1e-10, 'Cursor reverses orbit direction');
while (orbits.nodes.length < orbits.limit) orbits.add(300, 169, 7); assert.equal(orbits.add(300, 169), -1);
for (let tick = 0; tick < 600; tick++) orbits.step(2, 0); orbits.nodes.forEach((n, i) => { finite([n.x, n.y, n.radius]); assert(n.parent < i, 'Orbit parent graph cannot form cycles'); if (n.parent >= 0) { const p = orbits.nodes[n.parent]; assert(Math.abs(Math.hypot(n.x - p.x, n.y - p.y) - n.radius) < 1e-7); } });
const sea = createSeaThing(1); assert.equal(sea.nodes.length, 42); sea.detach(21); assert.equal(sea.nodes[21].parent, -1); assert.equal(sea.focus, 21);
for (let i = 0; i < 3000; i++) sea.step(2, 4); sea.nodes.forEach(n => finite([n.x, n.y, n.theta, n.turn])); finite([sea.camera.x, sea.camera.y]); assert.equal(sea.nodes.filter(n => n.parent < 0).length, 2);

const archives = {
  levDLA: 'd632c971783f6054be05be1ddf17a995ad57911d49d2f4da239b0840bef9a77d',
  levRootGardener: '44899c0e828a1defd9cfeab824102ffc0106e3d6e945e766c906c723bfa17334',
  levCAWorm: '4631f9fe9cf459662945b1b0439b39e1bf1b4cdcee5268983e45dc54ba58b3a8',
  levLorenzDeep: 'fbcf2638e4d82d9daf5b3612e88b52e7a8c3450990da8b4b8202ee82d0829451',
  levOrbitingNetworks: 'b7a317b004b81f5104b1378f80e17a3fa9d5bf19729c550c85e34d0905d13941',
  levSeaThing: '0ff8f4dc3d09fb75c0a20006b934afcca5b57381293225c00c3519105016270b'
};
for (const [name, hash] of Object.entries(archives)) { assert.equal(createHash('sha256').update(readFileSync(`dist/levitated/${name}.zip`)).digest('hex'), hash); const notice = readFileSync(`dist/levitated/${name}-notice.txt`, 'utf8'); assert(notice.includes('GNU General Public License') && notice.includes('Jared Tarbell')); }

function recorder(background = '#fff') {
  const shapes = [`<rect width="600" height="337" fill="${background}"/>`]; let path = '', arc = null;
  const num = n => { assert(Number.isFinite(n), 'Finite rendered coordinates'); return +n.toFixed(3); };
  const ctx = {
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    beginPath() { path = ''; arc = null; }, moveTo(x, y) { path += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { path += `L${num(x)} ${num(y)}`; }, closePath() { path += 'Z'; },
    arc(x, y, r) { assert(r > 0); arc = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fill() { shapes.push(`<${arc ?? `path d="${path}"`} fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); },
    stroke() { shapes.push(`<${arc ?? `path d="${path}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" opacity="${num(this.globalAlpha)}"/>`); }
  };
  return { ctx, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 600 375"><rect width="600" height="375" fill="${background}"/><g transform="translate(0 19)">${shapes.join('')}</g></svg>`, count: () => shapes.length };
}
const previews = [
  ['dla', () => { const m = createDLA(1); for (let i = 0; i < 28; i++) m.step(1, 4); return m; }, (ctx, m) => drawDLA(ctx, m, '#334962')],
  ['root-gardener', () => { const m = createGarden(1); for (let n = 0; n < 6; n++) { for (let i = 0; i < 240; i++) m.step(); for (let i = 1; i < m.nodes.length; i++) if (i % 3 === 0) m.grow(i, 40); } return m; }, (ctx, m) => drawGarden(ctx, m, -1, '#37634c')],
  ['ca-worm', () => { const m = createWorm(1); for (let i = 0; i < 160; i++) m.step(); return m; }, (ctx, m) => drawWorm(ctx, m, '#4b3f77')],
  ['deep-lorenz', () => { const m = createLorenz(1); for (let i = 0; i < 150; i++) m.step(1800); return m; }, (ctx, m) => drawLorenz(ctx, m, .35, '#354c7a')],
  ['orbiting-networks', () => { const m = createOrbits(1); for (const [x, y] of [[210, 90], [390, 100], [290, 240], [440, 210], [150, 190], [100, 110]]) m.add(x, y, 10, 180); for (let i = 0; i < 100; i++) m.step(1, 110); return m; }, (ctx, m) => drawOrbits(ctx, m), '#080d19'],
  ['sea-thing', () => { const m = createSeaThing(1); for (let i = 0; i < 240; i++) m.step(); m.detach(25); for (let i = 0; i < 60; i++) m.step(); return m; }, (ctx, m) => drawSeaThing(ctx, m, -1, '#3e6395')]
];
for (const [slug, make, render, background] of previews) {
  const recorded = recorder(background); render(recorded.ctx, make()); assert(recorded.count() > 8, `${slug} produces visible geometry`);
  if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, recorded.svg());
}
console.log('PASS: six Levitated studies — DLA attachment and bounds, recursive nourishment, all 256 CA rules, Lorenz equations, cycle-free orbits, detachment, finite previews, and original GPL archive hashes.');
