// SPDX-License-Identifier: GPL-3.0-only — tests/previews for the Levitated ports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync('dist/levitated/experiments.js', 'utf8');
const { invaderMask, createPacking, createIK, drawPacking, drawIK } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(invaderMask(0).length, 0); assert.equal(invaderMask(32767).length, 25);
assert.deepEqual(invaderMask(16384), [[0, 0]], 'High bit is the center pixel of the first row');
const patterns = new Set();
for (let seed = 0; seed < 32768; seed++) {
  const cells = invaderMask(seed), keys = new Set(cells.map(p => p.join(',')));
  for (const [x, y] of cells) { assert(keys.has([-x, y].join(',')), 'Horizontal mirror'); assert(x >= -2 && x <= 2 && y >= 0 && y < 5); }
  patterns.add([...keys].sort().join(';'));
}
assert.equal(patterns.size, 32768, 'All 15-bit patterns remain distinct');
function validatePacking(items) {
  for (const r of items) { assert(r.x >= -1e-8 && r.y >= -1e-8); assert(r.x + r.size <= 600 + 1e-8 && r.y + r.size <= 337 + 1e-8); assert(r.size > 0); }
  for (let i = 0; i < items.length; i++) for (let j = 0; j < i; j++) {
    const a = items[i], b = items[j], overlap = Math.min(a.x + a.size, b.x + b.size) - Math.max(a.x, b.x) > 1e-8 && Math.min(a.y + a.size, b.y + b.size) - Math.max(a.y, b.y) > 1e-8;
    assert(!overlap, 'Recursive footprints must not overlap');
  }
}
for (const minimum of [3, 5, 24]) {
  const packing = createPacking(7, minimum); packing.step(6000); assert.equal(packing.queue.length, 0, 'Packing terminates'); validatePacking(packing.items);
  const untouched = packing.items.slice(1); packing.refill(0); packing.step(6000); validatePacking(packing.items); for (const item of untouched) assert(packing.items.includes(item), 'Refill only replaces the selected region');
}
for (const count of [24, 160]) {
  const field = createIK(5, count); for (let tick = 0; tick < 1200; tick++) field.step(2);
  for (const a of field.nodes) { assert([a.x, a.y, a.vx, a.vy].every(Number.isFinite)); for (const child of a.children) { const b = field.nodes[child]; assert(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - a.length) < 1e-7, 'Directional constraints preserve parent connection length'); } }
  const root = field.nodes[0], id = field.add(root.x, root.y); assert(id >= 0); field.constrain(); assert([field.nodes[id].x, field.nodes[id].y].every(Number.isFinite), 'Coincident points do not divide by zero');
  while (field.nodes.length < 240) field.add(300, 160); assert.equal(field.add(300, 160), -1, 'Node count is bounded');
}
// The thumbnails use the same drawing routines as the live pieces.
if (process.argv.includes('--write')) {
  for (const slug of ['invader-fractal', 'iterative-ik']) {
    const elements = ['<rect width="600" height="337" fill="white"/>']; let path = '', circle = null;
    const number = n => { assert(Number.isFinite(n)); return +n.toFixed(3); };
    const ctx = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
      beginPath() { path = ''; circle = null; }, moveTo(x, y) { path += `M${number(x)} ${number(y)}`; }, lineTo(x, y) { path += `L${number(x)} ${number(y)}`; },
      arc(x, y, r) { circle = `circle cx="${number(x)}" cy="${number(y)}" r="${number(r)}"`; },
      fillRect(x, y, w, h) { elements.push(`<rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" fill="${this.fillStyle}"/>`); },
      strokeRect() {}, fill() { elements.push(`<${circle} fill="${this.fillStyle}"/>`); }, stroke() { elements.push(`<path d="${path}" fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}"/>`); }
    };
    if (slug === 'invader-fractal') { const model = createPacking(1, 5); model.step(6000); drawPacking(ctx, model); }
    else { const model = createIK(1, 95); for (let tick = 0; tick < 180; tick++) model.step(); drawIK(ctx, model); }
    writeFileSync(`dist/thumbnails/${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="625" viewBox="0 0 600 337">${elements.join('')}</svg>`);
  }
}
assert(readFileSync('dist/levitated/COPYING.txt', 'utf8').includes('GNU GENERAL PUBLIC LICENSE'));
for (const name of ['levInvaderFractal', 'levIterativeIK']) assert(readFileSync(`dist/levitated/${name}-notice.txt`, 'utf8').includes('Copyright (C) 2003 Jared Tarbell'));
console.log('PASS: Levitated 32,768 symmetric invaders, non-overlapping recursive/refill layout, stable IK lengths, coincident nodes, limits, and license notices.');
