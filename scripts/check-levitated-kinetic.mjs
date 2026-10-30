// SPDX-License-Identifier: GPL-3.0-only — checks/previews for kinetic Levitated recreations.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const load = async file => import(`data:text/javascript;base64,${Buffer.from(readFileSync(file, 'utf8')).toString('base64')}`);
const { kineticSlugs, createKineticStudy, createTentacles, projectBit, monkeySegments, oilValue, createAttractors, rotationCircles, createGathering } = await load('dist/levitated/kinetic-experiments.js');
const { works } = await load('dist/levitated/experiments.js');
const archives = JSON.parse(readFileSync('dist/levitated/kinetic-checksums.json', 'utf8'));
assert.equal(archives.length, kineticSlugs.length);
for (const { name, sha256, copyright } of archives) { assert.equal(createHash('sha256').update(readFileSync(`dist/levitated/${name}.zip`)).digest('hex'), sha256); const notice = readFileSync(`dist/levitated/${name}-notice.txt`, 'utf8'); assert(notice.includes('GNU General Public License') && notice.includes(copyright)); }
for (const length of [2, 7]) {
  const swimmers = createTentacles(2); for (let i = 0; i < 2000; i++) swimmers.step(length, 2);
  for (const c of swimmers.creatures) { assert.equal(c.nodes.length, 27); for (let i = 1; i < 27; i++) { const a = c.nodes[i - 1], b = c.nodes[i]; assert(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - length) < 1e-8, 'Every trailing segment retains its constraint'); } }
  for (let i = 0; i < 30; i++) swimmers.add(300, 169); assert.equal(swimmers.creatures.length, 14, 'Spawning stays bounded');
}
const point = { x: 200, y: 50, z: 100 }, projected = projectBit(point, 0); assert(Math.abs(projected.x - (300 + 200 * 470 / 750)) < 1e-10); assert(projectBit(point, Math.PI).x < 300, 'Orbit changes the side of a point');
for (const depth of [1, 5, 6]) for (const aperture of [.1, 1]) { const { lines } = monkeySegments(5, depth, aperture); assert.equal(lines.length, 4 ** depth); assert.deepEqual(lines[0][0], [0, 0]); assert(Math.abs(lines.at(-1)[1][0] - 1) < 1e-9); for (let i = 1; i < lines.length; i++) assert(Math.hypot(lines[i][0][0] - lines[i - 1][1][0], lines[i][0][1] - lines[i - 1][1][1]) < 1e-8, 'Substitution remains a continuous curve'); }
const blob = [{ x: 300, y: 169, r: 20 }]; assert.equal(oilValue(320, 169, blob), 1); assert.equal(oilValue(340, 169, blob), .25); assert(oilValue(300, 169, blob) > 1); assert.equal(oilValue(320, 169, [...blob, ...blob]), 2, 'Metaball fields add');
const attraction = createAttractors(1, 2); Object.assign(attraction.rings[0], { x: 100, y: 169, values: [0, 0, 0, 0, 0, 0, 0] }); Object.assign(attraction.rings[1], { x: 500, y: 169, values: [0, 0, 0, 0, 0, 0, 0] }); for (let i = 0; i < 7000; i++) attraction.step(3); const distance = attraction.rings[1].x - attraction.rings[0].x; assert(Math.abs(distance - 55) < .01, 'Matching rings approach their separation distance');
const crowded = createAttractors(7, 16); for (let i = 0; i < 2000; i++) crowded.step(3); for (const r of crowded.rings) assert(r.x >= 35 && r.x <= 565 && r.y >= 35 && r.y <= 302);
for (const count of [60, 220]) { const circles = rotationCircles(count, 137.5, 9); assert.equal(circles.length, count); for (let i = 1; i < count; i++) assert(Math.abs(circles[i].radius / circles[i - 1].radius - 1.02) < 1e-12); }
const gathering = createGathering(2); for (let i = 0; i < 1500; i++) gathering.step(30, 4); assert(gathering.nodes.length <= 600); for (let i = 0; i < 1000; i++) gathering.step(30, 0); assert.equal(gathering.nodes.length, 0, 'Every released node is eventually removed');

function recorder() {
  const shapes = []; let shape = '', drawing = '';
  const num = n => { assert(Number.isFinite(n), 'Finite Canvas geometry'); return +n.toFixed(4); };
  const ctx = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    beginPath() { shape = ''; drawing = ''; }, moveTo(x, y) { drawing += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { drawing += `L${num(x)} ${num(y)}`; }, closePath() { drawing += 'Z'; }, arc(x, y, r) { assert(r > 0); shape = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fillRect(x, y, w, h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); },
    fill() { shapes.push(`<${shape || `path d="${drawing}"`} fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); }, stroke() { shapes.push(`<${shape || `path d="${drawing}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" opacity="${num(this.globalAlpha)}"/>`); }
  };
  return { ctx, count: () => shapes.length, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 600 375"><rect width="600" height="375" fill="white"/><g transform="translate(0 19)">${shapes.join('')}</g></svg>` };
}
for (const slug of kineticSlugs) {
  const w = works[slug], a = w.a[4], b = w.b[4], preview = createKineticStudy(slug, 1, a, b), image = recorder();
  for (let i = 0; i < Math.max(preview.warmup, 100); i++) preview.step(a, b); preview.draw(image.ctx, a, b); assert(image.count() >= 1, `${slug} creates artwork`);
  if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, image.svg());
  for (const ae of [1, 2]) for (const be of [1, 2]) { const ea = w.a[ae], eb = w.b[be], model = createKineticStudy(slug, 3, ea, eb); for (let i = 0; i < Math.max(40, model.warmup); i++) model.step(ea, eb); model.pointer(590, 330); const r = recorder(); model.draw(r.ctx, ea, eb, 2); model.click(300, 169); model.action(); assert(model.status().length > 0); }
}
console.log('PASS: eight kinetic recreations — original archive hashes, 27-joint constraints, perspective orbit, continuous recursive substitution, additive metaballs, convergent attraction, 1.02 circle scaling, node lifetime bounds, and finite previews.');
