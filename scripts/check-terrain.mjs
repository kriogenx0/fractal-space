// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { math, recorder, baseState } from './check-math.mjs';
const { terrainNoise, createTerrainField, terrainHeight, terrainContour, terrainMesh, terrainCamera, createMathScene, catalog } = math;
for (let seed = 1; seed <= 4; seed++) for (let x = -4; x < 4; x += .17) { const n = terrainNoise(x, x * -.7, seed); assert(Number.isFinite(n) && n >= -1 && n <= 1); assert.equal(n, terrainNoise(x, x * -.7, seed)); }
for (const x of [-3, -1, 0, 2]) { const left = terrainNoise(x - 1e-6, .37, 3), right = terrainNoise(x + 1e-6, .37, 3); assert(Math.abs(left - right) < 1e-8, 'Quintic value noise is smooth across lattice seams'); }
assert.throws(() => createTerrainField(1, .6, 128));
function highFrequency(field) { let sum = 0; const { size, samples: h } = field; for (let j = 1; j < size - 1; j++) for (let i = 1; i < size - 1; i++) { const k = j * size + i; sum += (h[k - 1] + h[k + 1] - 2 * h[k]) ** 2 + (h[k - size] + h[k + size] - 2 * h[k]) ** 2; } return sum; }
for (const seed of [1, 7, 149]) {
  const smooth = createTerrainField(seed, 0), rough = createTerrainField(seed, 2); assert(highFrequency(rough) > highFrequency(smooth), 'More roughness contributes finer-scale relief');
  assert.deepEqual(smooth.samples, createTerrainField(seed, 0).samples); assert.notDeepEqual(smooth.samples, createTerrainField(seed + 1, 0).samples);
  for (const field of [smooth, rough]) {
    assert.equal(field.samples.length, 65 * 65); assert(field.samples.every(v => Number.isFinite(v) && v >= -1 && v <= 1)); assert(Math.abs(Math.max(...field.samples) - 1) < 1e-12); assert(Math.abs(Math.min(...field.samples) + 1) < 1e-12);
    for (const [peaks, valleys, depth] of [[0, 0, .1], [0, 6, 6], [8, 0, .1], [8, 6, 6]]) {
      const model = terrainMesh(field, peaks, valleys, depth); assert.equal(model.faces.length, 8192); assert.equal(model.walls.length, 256);
      for (const [i, p] of model.vertices.entries()) { assert.equal(p[1], terrainHeight(field.samples[i], peaks, valleys)); assert(p[1] >= -valleys - 1e-12 && p[1] <= peaks + 1e-12); assert(Math.hypot(...p.map((v, k) => v - model.center[k])) <= model.radius + 1e-10); }
      for (const face of model.faces) { assert.equal(new Set(face.indices).size, 3); assert(face.normal[1] > 0); assert(Math.abs(Math.hypot(...face.normal) - 1) < 1e-12); for (const segment of face.contours) { assert.equal(segment.length, 2); assert.equal(segment[0][1], segment[1][1]); assert(segment.flat().every(Number.isFinite)); } }
      for (const pitch of [-1.4, 0, 1.4]) { const camera = terrainCamera(model, 390, 844, { yaw: 2.2, pitch, time: 10000, direction: -1, zoom: 3 }); for (const p of model.vertices) assert(camera.project(p).every(Number.isFinite), 'Projection remains finite at extreme camera angles and depth'); }
    }
  }
}
assert.deepEqual(terrainContour([[0, 0, 0], [1, 2, 0], [0, 0, 1]], 1), [[.5, 1, 0], [.5, 1, .5]]); assert.equal(terrainContour([[0, 0, 0], [1, 0, 0], [0, 0, 1]], 0), null);
const state = baseState(catalog['mountain-terrain']), image = recorder(1000, 625), scene = createMathScene(image.canvas, 'mountain-terrain'); scene.draw(state); const model = scene.data, field = model.field;
scene.step(state); assert.equal(scene.data, model); state.a = 2; scene.draw(state); assert.notEqual(scene.data, model); assert.equal(scene.data.field, field);
const heights = scene.data.vertices.map(v => v[1]); state.d = 2; scene.draw(state); assert.deepEqual(scene.data.vertices.map(v => v[1]), heights);
for (const view of ['Alpine', 'Contours', 'Wireframe']) { assert.equal(scene.data.view, view); const r = recorder(1000, 625), s = baseState(catalog['mountain-terrain']), m = createMathScene(r.canvas, 'mountain-terrain'); for (let i = 0; i < ['Alpine', 'Contours', 'Wireframe'].indexOf(view); i++) m.special(s); m.draw(s); assert(r.count() > 1000); if (process.argv.includes('--write')) writeFileSync(`/tmp/mountain-terrain-${view.toLowerCase()}.svg`, r.svg()); scene.special(state); }
console.log('PASS: mountainous terrain — seeded bounded noise/seam continuity, roughness detail, exact peak/valley limits, stable relief/extent, upward unit normals, finite extreme projections, contour interpolation and all three views.');
