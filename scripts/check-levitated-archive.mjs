// SPDX-License-Identifier: GPL-3.0-only — checks/previews for Levitated behavioral recreations.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const archives = JSON.parse(readFileSync('dist/levitated/archive-checksums.json', 'utf8'));
assert.equal(archives.length, 8);
for (const { name, sha256, copyright } of archives) { assert.equal(createHash('sha256').update(readFileSync(`dist/levitated/${name}.zip`)).digest('hex'), sha256, 'Original archive is unchanged'); const notice = readFileSync(`dist/levitated/${name}-notice.txt`, 'utf8'); assert(notice.includes('GNU General Public License') && notice.includes(copyright)); }
const source = readFileSync('dist/levitated/archive-experiments.js', 'utf8');
const { archiveSlugs, createArchiveStudy, createBoxes, createMosaic, seedPoint, goldenPolygons, createCity, createTriangles, triangleArea, createIsoblocks, createMycelium } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { works } = await import(`data:text/javascript;base64,${Buffer.from(readFileSync('dist/levitated/experiments.js', 'utf8')).toString('base64')}`);
for (const spacing of [.5, 3]) {
  const boxes = createBoxes(4); for (let i = 0; i < 1200; i++) boxes.step(8, spacing);
  assert(boxes.boxes.length > 50 && boxes.boxes.length <= 600);
  for (let i = 0; i < boxes.boxes.length; i++) { const a = boxes.boxes[i]; assert(a.x - a.r >= 2 && a.x + a.r <= 598 && a.y - a.r >= 2 && a.y + a.r <= 335); for (let j = 0; j < i; j++) { const b = boxes.boxes[j]; assert(Math.abs(a.x - b.x) >= a.r + b.r || Math.abs(a.y - b.y) >= a.r + b.r, 'Growing squares cannot overlap'); } }
}
for (const columns of [12, 27, 42]) { const mosaic = createMosaic(2, columns); const total = mosaic.cells.length; for (let i = 0; i < total; i++) mosaic.step(8); assert.equal(mosaic.pending.length, 0); assert.equal(mosaic.cells.filter(c => c.visible).length, total); assert.equal(mosaic.step(), false); for (const c of mosaic.cells) assert(c.color.every(v => Number.isInteger(v) && v >= 0 && v <= 255)); }
for (const count of [200, 900, 2000]) for (const angle of [130, 137.5, 145]) for (let i = 0; i < count; i++) { const p = seedPoint(i, angle, count); assert(Math.abs((p.x - 300) ** 2 + (p.y - 169) ** 2 - 146 ** 2 * i / count) < 1e-7, 'Phyllotaxis follows the square-root radial law'); }
const phi = (1 + Math.sqrt(5)) / 2;
for (const sides of [3, 4, 5]) { const { polygons } = goldenPolygons(sides); assert.equal(polygons.length, 64); polygons.forEach((p, i) => { assert.equal(p.points.length, sides); assert(p.points.flat().every(Number.isFinite)); if (i) assert(Math.abs(polygons[i - 1].radius / p.radius - phi) < 1e-12); }); }
const city = createCity(2); for (let i = 0; i < 1400; i++) city.step(2, 8); assert.equal(city.step(), false); assert.equal(city.lines.length, 10); for (const line of city.lines) { assert(line.points.length < 1500); assert(line.points.flat().every(Number.isFinite)); }
for (const depth of [1, 6, 8]) for (const irregularity of [0, 1]) { const triangles = createTriangles(3, depth, irregularity); for (let i = 0; i < 200; i++) triangles.step(); assert.equal(triangles.queue.length, 0); assert.equal(triangles.divisions.length, (3 ** depth - 1) / 2); for (const { triangle: [a, b, c], point: d } of triangles.divisions) { const original = triangleArea([a, b, c]), children = triangleArea([a, d, c]) + triangleArea([a, b, d]) + triangleArea([d, b, c]); assert(Math.abs(original - children) < 1e-6, 'Recursive children partition the parent triangle'); } }
for (const extent of [3, 9]) { const cubes = createIsoblocks(1, extent); for (let i = 0; i < 2000; i++) cubes.step(12); assert(cubes.blocks.size > 10 && cubes.blocks.size <= extent ** 3); for (const b of cubes.blocks.values()) { assert(b.p.every(v => Number.isInteger(v) && v >= 0 && v < extent)); assert(b.size >= .25 && b.size <= .95); } }
for (const radius of [3, 16]) { const myco = createMycelium(1, radius); for (let i = 0; i < 2400; i++) myco.step(40); assert(myco.nodes.length > 20 && myco.nodes.length <= 1800); for (let i = 0; i < myco.nodes.length; i++) { const n = myco.nodes[i]; assert([n.x, n.y, n.radius].every(Number.isFinite)); assert(n.parent < i); } const id = myco.seedAt(300, 169); assert(id >= 0 && myco.active.includes(id), 'Click can reactivate a dormant colony'); }

function recorder() {
  const shapes = []; let shape = '', drawing = '';
  const num = n => { assert(Number.isFinite(n), 'Finite Canvas geometry'); return +n.toFixed(4); };
  const ctx = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    beginPath() { shape = ''; drawing = ''; }, moveTo(x, y) { drawing += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { drawing += `L${num(x)} ${num(y)}`; }, closePath() { drawing += 'Z'; }, arc(x, y, r) { assert(r > 0); shape = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fillRect(x, y, w, h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}"/>`); },
    fill() { shapes.push(`<${shape || `path d="${drawing}"`} fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); }, stroke() { shapes.push(`<${shape || `path d="${drawing}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" opacity="${num(this.globalAlpha)}"/>`); }
  };
  return { ctx, count: () => shapes.length, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 600 375"><rect width="600" height="375" fill="white"/><g transform="translate(0 19)">${shapes.join('')}</g></svg>` };
}
for (const slug of archiveSlugs) {
  const w = works[slug], a = w.a[4], b = w.b[4], preview = createArchiveStudy(slug, 1, a, b), image = recorder();
  const ticks = slug === 'quarter-round' ? 200 : slug === 'city-lines' ? 500 : slug === 'mycelium' ? 650 : slug === 'box-fitting' ? 250 : slug === 'isoblocks' ? 350 : 180;
  for (let i = 0; i < ticks; i++) preview.step(a, b); preview.draw(image.ctx, a, b); assert(image.count() > 2, `${slug} creates artwork`);
  if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, image.svg());
  for (const ae of [1, 2]) for (const be of [1, 2]) { const ea = w.a[ae], eb = w.b[be], model = createArchiveStudy(slug, 3, ea, eb); for (let i = 0; i < 40; i++) model.step(ea, eb); const r = recorder(); model.draw(r.ctx, ea, eb, 2); model.click(300, 169); model.action(); assert(model.status().length > 0); }
}
console.log('PASS: eight archive recreations — non-overlapping box growth, complete mosaic grids, phyllotaxis, golden scaling, bounded city lines, triangle area preservation, 3-D grid bounds, colony revival, and finite previews.');
