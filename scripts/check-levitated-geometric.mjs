// SPDX-License-Identifier: GPL-3.0-only — checks/previews for geometric Levitated recreations.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const load = async file => import(`data:text/javascript;base64,${Buffer.from(readFileSync(file, 'utf8')).toString('base64')}`);
const { geometricSlugs, createGeometricStudy, nextCARow, createCATwist, projectGeometry, cantorGaps, createTrema, pentagonChain, createPentagons, helixRung } = await load('dist/levitated/geometric-experiments.js');
const { works } = await load('dist/levitated/experiments.js');
const archives = JSON.parse(readFileSync('dist/levitated/geometric-checksums.json', 'utf8'));
assert.equal(archives.length, geometricSlugs.length);
for (const { name, sha256, copyright } of archives) { assert.equal(createHash('sha256').update(readFileSync(`dist/levitated/${name}.zip`)).digest('hex'), sha256); const notice = readFileSync(`dist/levitated/${name}-notice.txt`, 'utf8'); assert(notice.includes('GNU General Public License') && notice.includes(copyright)); }
// Check every Wolfram truth-table entry and both wraparound neighbors.
for (let rule = 0; rule < 256; rule++) for (let bits = 0; bits < 8; bits++) {
  const row = [(bits >>> 2) & 1, (bits >>> 1) & 1, bits & 1];
  assert.equal(nextCARow(row, rule)[1], (rule >>> bits) & 1);
}
assert.deepEqual(nextCARow([1, 0, 0, 0, 0], 90), [0, 1, 0, 0, 1], 'Left neighbor wraps across the cylindrical seam');
assert.deepEqual(nextCARow([0, 0, 0, 0, 1], 90), [1, 0, 0, 1, 0], 'Right neighbor wraps across the cylindrical seam');
for (const rule of [0, 30, 110, 255]) { const ca = createCATwist(2, rule); for (let i = 0; i < 1500; i++) ca.step(-2); assert.equal(ca.rows.length, 88); assert(ca.rows.every(row => row.length === 16 && row.every(v => v === 0 || v === 1))); if (rule === 0 || rule === 255) assert(ca.rows.flat().every(v => v === +(rule === 255))); }
assert.deepEqual(createCATwist(5).rows, createCATwist(5).rows, 'Seeded history is reproducible');
for (const depth of [1, 6, 12]) {
  const gaps = cantorGaps(depth); assert.equal(gaps.length, 2 ** depth - 1);
  const length = gaps.reduce((sum, g) => sum + g.hi - g.lo, 0); assert(Math.abs(length - (1 - (2 / 3) ** depth)) < 1e-10, 'Removed length is the complement of the Cantor survivors');
  const sorted = [...gaps].sort((a, b) => a.lo - b.lo); for (let i = 0; i < sorted.length; i++) { const g = sorted[i]; assert(g.lo > 0 && g.hi < 1 && g.hi > g.lo); if (i) assert(sorted[i - 1].hi <= g.lo + 1e-12, 'Removed gaps never overlap'); }
  const field = createTrema(3, depth); for (let i = 0; i < 200; i++) field.step(); assert.equal(field.revealed, Math.min(16000, gaps.length));
  for (const h of field.holes) { assert(h.x >= 0 && h.x <= 600 && h.y >= 0 && h.y <= 337); assert(Math.abs(h.radius ** 2 / (h.hi - h.lo) - 190 ** 2) < 1e-8, 'Disk area is proportional to removed interval length'); }
}
for (const count of [8, 32]) for (const shrink of [.82, .96]) {
  const model = createPentagons(7, count), poses = pentagonChain(model.folds, shrink); assert.equal(poses.length, count);
  for (let i = 0; i < count; i++) {
    const p = poses[i], side = 2 * p.radius * Math.sin(Math.PI / 5);
    for (let k = 0; k < 5; k++) assert(Math.abs(Math.hypot(p.vertices[k].x - p.vertices[(k + 1) % 5].x, p.vertices[k].y - p.vertices[(k + 1) % 5].y) - side) < 1e-8, 'Every pentagon remains regular');
    if (i) { const parent = poses[i - 1], midpoint = { x: (p.vertices[0].x + p.vertices[1].x) / 2, y: (p.vertices[0].y + p.vertices[1].y) / 2 }; assert(Math.abs(p.radius / parent.radius - shrink) < 1e-10); assert(Math.hypot(midpoint.x - parent.attachment.x, midpoint.y - parent.attachment.y) < 1e-8, 'Child edge midpoint stays attached to the chosen parent edge'); }
  }
  const before = model.folds[0]; for (let i = 0; i < 5; i++) model.fold(0); assert.equal(model.folds[0], before, 'Five folds return a joint to its starting side'); model.unfold(); assert(model.folds.every(v => v === 0));
  const straight = pentagonChain(model.folds, shrink); assert(straight.every((p, i) => !i || p.x > straight[i - 1].x), 'Unfolding produces the extended baseline chain');
}
for (const count of [12, 72]) for (const turns of [1, 6]) for (const expanded of [false, true]) for (let i = 0; i < count; i++) {
  const [left, center, right] = helixRung(i, count, turns, .7, expanded); assert.equal(left.x, center.x); assert.equal(right.x, center.x); assert.equal(left.y, -right.y); assert.equal(left.z, -right.z); assert(Math.abs(Math.hypot(left.y, left.z) - (expanded ? 110 : 64)) < 1e-10);
  for (const p of [left, center, right]) for (const tilt of [-.2, .6]) for (const yaw of [-.2, .2]) { const q = projectGeometry(p, tilt, yaw); assert(Object.values(q).every(Number.isFinite)); assert(q.scale > 0); }
}
function recorder(background = '#fff') {
  const shapes = []; let shape = '', drawing = '';
  const num = n => { assert(Number.isFinite(n), 'Finite Canvas geometry'); return +n.toFixed(4); };
  const ctx = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    beginPath() { shape = ''; drawing = ''; }, moveTo(x, y) { drawing += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { drawing += `L${num(x)} ${num(y)}`; }, closePath() { drawing += 'Z'; }, arc(x, y, r) { assert(r > 0); shape = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fillRect(x, y, w, h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); },
    fill() { shapes.push(`<${shape || `path d="${drawing}"`} fill="${this.fillStyle}" opacity="${num(this.globalAlpha)}"/>`); }, stroke() { shapes.push(`<${shape || `path d="${drawing}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" opacity="${num(this.globalAlpha)}"/>`); }
  };
  return { ctx, count: () => shapes.length, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 600 375"><rect width="600" height="375" fill="${background}"/><g transform="translate(0 19)">${shapes.join('')}</g></svg>` };
}
for (const slug of geometricSlugs) {
  const w = works[slug], a = w.a[4], b = w.b[4], preview = createGeometricStudy(slug, 1, a, b), image = recorder(w.background);
  for (let i = 0; i < Math.max(preview.warmup, 100); i++) preview.step(a, b); preview.draw(image.ctx, a, b); assert(image.count() >= 2, `${slug} creates artwork`);
  if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, image.svg());
  for (const ae of [1, 2]) for (const be of [1, 2]) { const ea = w.a[ae], eb = w.b[be], model = createGeometricStudy(slug, 3, ea, eb); for (let i = 0; i < Math.max(40, model.warmup); i++) model.step(ea, eb); model.pointer(590, 330); const r = recorder(w.background); model.draw(r.ctx, ea, eb, 2); const changes = model.click(300, 169); if (changes) model.configure(changes.a ?? ea, changes.b ?? eb); model.action(); assert(model.status().length > 0); }
}
console.log('PASS: four geometric recreations — archive hashes/notices, all 256 CA truth tables, seam wrapping/history bounds, Cantor removed length/nonoverlap, proportional cut area, regular pentagons/edge attachments, unfolding, opposite helix strands, finite previews.');
