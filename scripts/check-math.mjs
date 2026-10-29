// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
export const math = await import(`data:text/javascript;base64,${Buffer.from(readFileSync('dist/math-scenes.js', 'utf8')).toString('base64')}`);
const { catalog, newtonSample, hopfS3, hopfMap, hopfPoint, torusPoint, gcd, gyroid, gyroidGradient, tetraTriangles, gyroidMesh, createReaction, cliffordStep, createClifford, createMathScene } = math, TAU = Math.PI * 2;
for (let n = 3; n <= 7; n++) {
  for (let root = 0; root < n; root++) { const angle = root * TAU / n; assert.equal(newtonSample(Math.cos(angle), Math.sin(angle), n).root, root); }
  assert.equal(newtonSample(0, 0, n).root, -1, 'Derivative-zero points stay explicitly unclassified');
  const theta = TAU / n, a = newtonSample(.8, .3, n), b = newtonSample(.8 * Math.cos(theta) - .3 * Math.sin(theta), .8 * Math.sin(theta) + .3 * Math.cos(theta), n); assert(a.root >= 0 && b.root === (a.root + 1) % n, 'Newton basins respect polynomial rotational symmetry');
}
for (const eta of [.08, .65, 1.22]) for (const phi of [0, .7, 3]) { const reference = hopfMap(hopfS3(eta, phi, 0)); for (let t = 0; t < TAU; t += .1) { const s3 = hopfS3(eta, phi, t); assert(Math.abs(s3.reduce((sum, v) => sum + v * v, 0) - 1) < 1e-12); hopfMap(s3).forEach((v, i) => assert(Math.abs(v - reference[i]) < 1e-12, 'Every point of a fiber maps to the same S² point')); assert(hopfPoint(eta, phi, t).every(Number.isFinite)); } }
const subtract = (a, b) => a.map((v, i) => v - b[i]);
function linkingNumber(a, b) { let sum = 0; for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) { const da = subtract(a[i], a[i - 1]), db = subtract(b[j], b[j - 1]), r = a[i].map((v, k) => (v + a[i - 1][k] - b[j][k] - b[j - 1][k]) / 2), cross = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]]; sum += cross.reduce((s, v, k) => s + v * r[k], 0) / Math.hypot(...r) ** 3; } return sum / (4 * Math.PI); }
const fiber = (eta, phi) => Array.from({ length: 161 }, (_, i) => hopfPoint(eta, phi, i / 160 * TAU));
assert(Math.abs(Math.abs(linkingNumber(fiber(.5, 0), fiber(.8, 1.3))) - 1) < .02, 'Distinct projected fibers have linking number one');
for (let p = 2; p <= 9; p++) for (let q = 2; q <= 11; q++) for (let component = 0; component < gcd(p, q); component++) { const start = torusPoint(0, p, q, component), end = torusPoint(TAU, p, q, component); assert(Math.hypot(...subtract(start, end)) < 1e-12, 'Every link component closes'); for (let t = 0; t < TAU; t += .3) { const [x, y, z] = torusPoint(t, p, q, component); assert(Math.abs((Math.hypot(x, y) - 1.6) ** 2 + z * z - .65 ** 2) < 1e-12, 'Knot components lie on the same torus'); } }
assert(Math.abs(Math.abs(linkingNumber(Array.from({ length: 161 }, (_, i) => torusPoint(i / 160 * TAU, 2, 2, 0)), Array.from({ length: 161 }, (_, i) => torusPoint(i / 160 * TAU, 2, 2, 1)))) - 1) < .02, 'T(2,2) contains distinct linked components');
for (const p of [[.2, .5, -.7], [2, 1, 0]]) { const g = gyroid(...p); assert(Math.abs(g + gyroid(...p.map(v => -v))) < 1e-12); assert(Math.abs(g - gyroid(p[0] + TAU, p[1], p[2])) < 1e-12); const gradient = gyroidGradient(...p); for (let axis = 0; axis < 3; axis++) { const a = p.slice(), b = p.slice(); a[axis] += 1e-6; b[axis] -= 1e-6; assert(Math.abs((gyroid(...a) - gyroid(...b)) / 2e-6 - gradient[axis]) < 1e-8); } }
const tetra = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
for (let mask = 0; mask < 16; mask++) { const triangles = tetraTriangles(tetra, tetra.map((_, i) => mask & 1 << i ? 1 : -1), 0), inside = mask.toString(2).split('1').length - 1; assert.equal(triangles.length, inside === 0 || inside === 4 ? 0 : inside === 2 ? 2 : 1); for (const t of triangles) for (const point of t) assert(point.every(v => Number.isFinite(v) && v >= 0 && v <= 1)); }
const plane = tetraTriangles(tetra, [0, 1, 1, 1], .6); for (const t of plane) for (const p of t) assert(Math.abs(p.reduce((s, v) => s + v, 0) - .6) < 1e-12, 'Marching interpolation places vertices exactly on a linear level set');
const mesh = gyroidMesh(0, 1); assert(mesh.length > 1000 && mesh.length < 30000); for (const triangle of mesh) for (const p of triangle.points) assert(Math.abs(gyroid(...p.map(v => v / 1.8 * Math.PI))) < .14, 'The finite mesh stays close to its implicit surface');
const equilibrium = createReaction(12, 10, 1, false); for (let i = 0; i < 30; i++) equilibrium.step(); assert(equilibrium.a.every(v => v === 1) && equilibrium.b.every(v => v === 0), 'Uniform A-only state is an equilibrium');
const diffusion = createReaction(12, 10, 1, false); diffusion.a.forEach((_, i) => diffusion.a[i] = .2 + i / 200); const before = diffusion.a.reduce((s, v) => s + v, 0); diffusion.step(0, 0); assert(Math.abs(diffusion.a.reduce((s, v) => s + v, 0) - before) < 1e-5, 'Periodic pure diffusion conserves concentration');
const reference = createReaction(6, 5, 1, false); reference.a.forEach((_, i) => { reference.a[i] = .1 + i / 50; reference.b[i] = i / 100; }); const oldA = reference.a.slice(), oldB = reference.b.slice(), index = (x, y) => ((y + 5) % 5) * 6 + ((x + 6) % 6); reference.step(.055, .062);
for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) { const id = index(x, y), lap = values => { let result = -values[id]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) result += values[index(x + dx, y + dy)] * (dx && dy ? .05 : .2); return result; }, reaction = oldA[id] * oldB[id] ** 2; assert(Math.abs(reference.a[id] - Math.max(0, Math.min(1, oldA[id] + lap(oldA) - reaction + .055 * (1 - oldA[id])))) < 1e-6); assert(Math.abs(reference.b[id] - Math.max(0, Math.min(1, oldB[id] + .5 * lap(oldB) + reaction - .117 * oldB[id]))) < 1e-6); }
for (const [feed, kill] of [[.01, .045], [.08, .07], [.055, .062]]) { const r = createReaction(36, 24, 1); for (let i = 0; i < 300; i++) r.step(feed, kill); assert(r.a.every(v => Number.isFinite(v) && v >= 0 && v <= 1) && r.b.every(v => Number.isFinite(v) && v >= 0 && v <= 1)); }
assert.deepEqual(cliffordStep(0, 0), [1, .7]); const clifford = createClifford(1); clifford.step(20000); assert.equal(clifford.density.reduce((s, v) => s + v, 0), clifford.count); assert.equal(clifford.maximum, clifford.density.reduce((m, v) => Math.max(m, v), 0)); assert(clifford.point.every(Number.isFinite));
function png(image) {
  function crc(data) { let c = 0xffffffff; for (const byte of data) { c ^= byte; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1; } return (c ^ 0xffffffff) >>> 0; }
  function chunk(type, data) { const body = Buffer.concat([Buffer.from(type), data]), length = Buffer.alloc(4), checksum = Buffer.alloc(4); length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(body)); return Buffer.concat([length, body, checksum]); }
  const head = Buffer.alloc(13); head.writeUInt32BE(image.width); head.writeUInt32BE(image.height, 4); head[8] = 8; head[9] = 6; const raw = Buffer.alloc((image.width * 4 + 1) * image.height); for (let y = 0; y < image.height; y++) Buffer.from(image.data.buffer, y * image.width * 4, image.width * 4).copy(raw, y * (image.width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
export function recorder(width, height) {
  const shapes = []; let path = '', arc = '', calls = 0, lastImage;
  const num = n => { assert(Number.isFinite(n), 'Finite Canvas coordinates'); calls++; return +n.toFixed(3); };
  const context = { fillStyle: '#000', strokeStyle: '#fff', lineWidth: 1,
    beginPath() { path = ''; arc = ''; }, moveTo(x, y) { path += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { path += `L${num(x)} ${num(y)}`; }, closePath() { path += 'Z'; },
    arc(x, y, r) { assert(r > 0); arc = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fillRect(x, y, w, h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}"/>`); },
    fill() { shapes.push(`<${arc || `path d="${path}"`} fill="${this.fillStyle}"/>`); }, stroke() { shapes.push(`<${arc || `path d="${path}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" stroke-linecap="round"/>`); },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }, putImageData(image) { lastImage = image; },
    drawImage(surface, x, y, w, h) { const image = surface.getImage(); assert(image && image.data.some(v => v !== 0), 'A raster scene contains rendered pixels'); shapes.push(`<image x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" href="data:image/png;base64,${png(image).toString('base64')}"/>`); }
  };
  return { canvas: { width, height, getContext: () => context, getImage: () => lastImage }, makeSurface: () => recorder(1, 1).canvas, count: () => calls, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.join('')}</svg>` };
}
export const baseState = work => ({ a: work.a[4], b: work.b[4], time: 1, yaw: .45, pitch: .45, zoom: 1, center: [0, 0], pointer: [.5, .42], seed: 1, palette: 0, direction: 1 });
for (const [slug, work] of Object.entries(catalog)) {
  const image = recorder(1000, 625), state = baseState(work), scene = createMathScene(image.canvas, slug, image.makeSurface); const status = scene.draw(state); assert(status.length > 5); if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, image.svg());
  for (const [width, height] of [[390, 844], [1600, 900]]) for (const end of [1, 2]) { const r = recorder(width, height), s = { ...baseState(work), a: work.a[end], b: work.b[end], zoom: end === 1 ? .5 : 2, center: [.3, -.2], palette: 2, time: 10000 }; const model = createMathScene(r.canvas, slug, r.makeSurface); model.draw(s); model.step(s); model.plant(s, width / 2, height * .42); model.special(s); model.draw(s); assert(r.count() > 5); }
}
console.log('PASS: six math experiments — Newton roots/symmetry, Hopf unit sphere/fibers/linking number, torus closure/link components, gyroid periodicity/gradient/meshing, Gray–Scott equilibrium/conservation/reference stencil, Clifford visit conservation, finite desktop/mobile previews.');
