// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const extraModule = `data:text/javascript;base64,${Buffer.from(readFileSync('dist/math-extra.js', 'utf8')).toString('base64')}`;
const inkModule = `data:text/javascript;base64,${Buffer.from(readFileSync('dist/orbit-ink.js', 'utf8')).toString('base64')}`;
const fibonacciModule = `data:text/javascript;base64,${Buffer.from(readFileSync('dist/fibonacci-sculpture.js', 'utf8')).toString('base64')}`;
export const math = await import(`data:text/javascript;base64,${Buffer.from(readFileSync('dist/math-scenes.js', 'utf8').replaceAll("'./math-extra.js'", JSON.stringify(extraModule)).replaceAll("'./orbit-ink.js'", JSON.stringify(inkModule)).replaceAll("'./fibonacci-sculpture.js'", JSON.stringify(fibonacciModule))).toString('base64')}`);
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
// Topology is checked on indexed sheets, so immersion intersections never weld.
function topology(model) {
  const edges = new Map(), neighbors = model.faces.map(() => []);
  model.faces.forEach((face, fi) => { assert.equal(new Set(face).size, 3); for (let k = 0; k < 3; k++) { const a = face[k], b = face[(k + 1) % 3], key = a < b ? `${a},${b}` : `${b},${a}`; if (!edges.has(key)) edges.set(key, []); edges.get(key).push({ face: fi, direction: a < b ? 1 : -1 }); } });
  let boundary = 0; for (const incident of edges.values()) { assert(incident.length <= 2); if (incident.length === 1) boundary++; else { const [a, b] = incident, parity = a.direction === b.direction ? -1 : 1; neighbors[a.face].push([b.face, parity]); neighbors[b.face].push([a.face, parity]); } }
  const signs = new Int8Array(model.faces.length); let orientable = true, components = 0;
  for (let root = 0; root < signs.length; root++) { if (signs[root]) continue; components++; signs[root] = 1; const queue = [root]; for (let qi = 0; qi < queue.length; qi++) { const face = queue[qi]; for (const [next, parity] of neighbors[face]) { const required = signs[face] * parity; if (!signs[next]) { signs[next] = required; queue.push(next); } else if (signs[next] !== required) orientable = false; } } }
  return { chi: model.vertices.length - edges.size + model.faces.length, boundary, orientable, components };
}
for (const width of [.65, 1, 1.25]) {
  for (let v = 0; v <= TAU; v += .2) { const a = math.kleinPoint(TAU, v, width), b = math.kleinPoint(0, Math.PI - v, width); assert(Math.hypot(...a.map((value, i) => value - b[i])) < 1e-12, 'Klein seam closes with reversed parameter direction'); }
  const klein = math.parametricSurface('klein-bottle', width, 1); assert.deepEqual(topology(klein), { chi: 0, boundary: 0, orientable: false, components: 1 });
}
for (const [ring, tube] of [[1.2, .2], [1.2, 1.1], [2.4, 1.1]]) { const torus = math.parametricSurface('torus', ring, tube); assert.deepEqual(topology(torus), { chi: 0, boundary: 0, orientable: true, components: 1 }); for (const [x, y, z] of torus.vertices) assert(Math.abs((Math.hypot(x, z) - ring) ** 2 + y * y - tube * tube) < 1e-12, 'Every surface vertex satisfies the torus equation'); }
const cutaway = math.parametricSurface('klein-bottle', 1, .5); assert(!cutaway.full && topology(cutaway).boundary > 0, 'A cutaway is explicitly open');
assert(readFileSync('dist/math/threejs-LICENSE.txt', 'utf8').includes('Copyright © 2010-2026 three.js authors'));

function boundaryLoops(model) {
  const edges = new Map(), adjacency = new Map();
  for (const face of model.faces) for (let k = 0; k < 3; k++) { const a = face[k], b = face[(k + 1) % 3], key = a < b ? `${a},${b}` : `${b},${a}`; if (!edges.has(key)) edges.set(key, { a, b, count: 0 }); edges.get(key).count++; }
  for (const { a, b, count } of edges.values()) if (count === 1) { if (!adjacency.has(a)) adjacency.set(a, []); if (!adjacency.has(b)) adjacency.set(b, []); adjacency.get(a).push(b); adjacency.get(b).push(a); }
  const seen = new Set(); let loops = 0; for (const start of adjacency.keys()) { if (seen.has(start)) continue; loops++; const queue = [start]; seen.add(start); for (let i = 0; i < queue.length; i++) { const next = adjacency.get(queue[i]); assert.equal(next.length, 2, 'Boundary is a cycle without branching'); for (const v of next) if (!seen.has(v)) { seen.add(v); queue.push(v); } } } return loops;
}
for (const width of [.15, .85]) for (const turns of [1, 3, 5]) {
  const strip = math.mobiusSurface(width, turns); assert.deepEqual(topology(strip), { chi: 0, boundary: 192, orientable: false, components: 1 }); assert.equal(boundaryLoops(strip), 1);
  for (const v of [-width, 0, width]) { const a = math.mobiusPoint(TAU, v, turns), b = math.mobiusPoint(0, -v, turns); assert(Math.hypot(...a.map((value, i) => value - b[i])) < 1e-12); }
  const start = math.mobiusPoint(0, width, turns), halfway = math.mobiusPoint(TAU, width, turns), finish = math.mobiusPoint(TAU * 2, width, turns); assert(Math.hypot(...start.map((value, i) => value - halfway[i])) > width); assert(Math.hypot(...start.map((value, i) => value - finish[i])) < 1e-12, 'The single boundary returns after two center circuits');
}
for (const [n, m] of [[4, 2], [12, 18], [8, 160], [40, 160]]) {
  const lantern = math.schwarzLantern(n, m); assert.equal(lantern.faces.length, 2 * n * m); assert.deepEqual(topology(lantern), { chi: 0, boundary: 2 * n, orientable: true, components: 1 }); assert.equal(boundaryLoops(lantern), 2);
  for (const [x, y, z] of lantern.vertices) assert(Math.abs(Math.hypot(x, z) - lantern.radius) < 1e-12 && Math.abs(y) <= lantern.height / 2);
  let area = 0; for (const face of lantern.faces) { const [a, b, c] = face.map(i => lantern.vertices[i]), u = b.map((v, i) => v - a[i]), v = c.map((value, i) => value - a[i]); area += Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2; } assert(Math.abs(area - lantern.area) / area < 1e-10, 'Summed geometric triangle area equals the independent closed formula');
}
const ratio = (n, m) => math.schwarzArea(n, m) / (TAU * 1.5 * 3); assert(Math.abs(ratio(200, 200) - 1) < .0001); assert(Math.abs(ratio(200, 200 ** 2) - Math.sqrt(1 + Math.PI ** 4 / 16)) < .001); assert(ratio(40, 40 ** 3) > ratio(20, 20 ** 3) * 1.9, 'Over-refining the bands makes area diverge');

const area2D = ([a, b, c]) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
for (let depth = 0; depth <= 8; depth++) {
  const triangle = math.sierpinskiTriangle(depth), outerArea = area2D(triangle.outer); assert.equal(triangle.leaves.length, 3 ** depth); assert.equal(triangle.levels.flat().length, (3 ** depth - 1) / 2);
  const total = triangle.leaves.reduce((sum, t) => sum + area2D(t), 0); assert(Math.abs(total / outerArea - (3 / 4) ** depth) < 1e-10);
  for (const leaf of triangle.leaves) { assert(Math.abs(area2D(leaf) / outerArea - (1 / 4) ** depth) < 1e-12); for (const point of leaf) assert(point.every(Number.isFinite)); }
  assert.equal(math.sierpinskiProgress(depth, 0).area, 1); assert.equal(math.sierpinskiProgress(depth, 1).area, (3 / 4) ** depth);
  if (depth) { const info = math.sierpinskiProgress(depth, .5 / depth); assert(Math.abs(info.area - (1 - .5 ** 2 / 4)) < 1e-12); }
}
for (const [width, height] of [[390, 844], [1600, 900]]) { const span = math.mathPlaneSpan(width, height, 2.5); for (const [x, y] of math.sierpinskiTriangle(0).outer) { const px = width * .5 + x * height / span, py = height * .42 - y * height / span; assert(px > 0 && px < width && py > 0 && py < height, 'The initial triangle fits mobile and desktop canvases'); } }
// Independent geometry sums verify both the completed and growing snowflake.
function polygonMetrics(points) { let area = 0, perimeter = 0; for (let i = 0; i < points.length; i++) { const a = points[i], b = points[(i + 1) % points.length]; assert(a.every(Number.isFinite)); area += a[0] * b[1] - a[1] * b[0]; perimeter += Math.hypot(b[0] - a[0], b[1] - a[1]); } return { area: area / 2, perimeter }; }
for (let depth = 0; depth <= 7; depth++) {
  const snowflake = math.kochSnowflake(depth), points = snowflake.levels[depth], metrics = polygonMetrics(points), info = math.kochProgress(depth, 1);
  assert.equal(points.length, 3 * 4 ** depth); assert(Math.abs(metrics.area / Math.sqrt(3) - info.area) < 1e-10); assert(Math.abs(metrics.perimeter / 6 - info.perimeter) < 1e-10);
  for (let i = 0; i < points.length; i++) assert(Math.abs(Math.hypot(...points[i].map((v, axis) => v - points[(i + 1) % points.length][axis])) - 2 / 3 ** depth) < 1e-12);
  assert.equal(math.kochProgress(depth, 0).area, 1); assert(info.area < 1.6);
  if (depth < 7) for (const fraction of [0, .25, .5, 1]) { const grown = polygonMetrics(math.kochSubdivision(points, fraction)), expected = math.kochProgress(depth + 1, (depth + fraction) / (depth + 1)); assert(Math.abs(grown.area / Math.sqrt(3) - expected.area) < 1e-10); assert(Math.abs(grown.perimeter / 6 - expected.perimeter) < 1e-10); }
  for (const [width, height] of [[390, 844], [1600, 900]]) { const scale = height / math.mathPlaneSpan(width, height, 3.1); for (const [x, y] of points) { assert(Math.abs(x * scale) < width / 2); assert(height * .42 - y * scale > 0 && height * .42 - y * scale < height, 'The snowflake fits the initial mobile and desktop view'); } }
}
for (const depth of [-1, .5, 8]) assert.throws(() => math.kochSnowflake(depth));
// Validate the integrator against mechanics, independently of the renderer.
assert(math.pendulumDerivative([0, 0, 0, 0]).every(v => v === 0));
for (const state of [[.7, -.3, 1.2, -.8], [2.8, 2.8, -2, 3], [-2.5, 1.5, 4, -3]]) {
  const [a, b, u, v] = state, [, , aa, bb] = math.pendulumDerivative(state), c = Math.cos(a - b), sn = Math.sin(a - b);
  assert(Math.abs(2 * aa + c * bb + 2 * 9.81 * Math.sin(a) + sn * v * v) < 1e-12); assert(Math.abs(c * aa + bb + 9.81 * Math.sin(b) - sn * u * u) < 1e-12);
  math.pendulumDerivative(state.map(v => -v)).forEach((v, i) => assert(Math.abs(v + math.pendulumDerivative(state)[i]) < 1e-12));
  const [p, q] = math.pendulumPositions(state); assert(Math.abs(Math.hypot(...p) - 1) < 1e-12 && Math.abs(Math.hypot(q[0] - p[0], q[1] - p[1]) - 1) < 1e-12);
}
function integrate(dt) { let state = [2, -.4, 0, 0]; for (let i = 0; i < Math.round(1 / dt); i++) state = math.pendulumRK4(state, dt); return state; }
const solution = integrate(1 / 3840), integrationError = dt => Math.hypot(...integrate(dt).map((v, i) => v - solution[i])); assert(integrationError(1 / 60) > integrationError(1 / 120) * 10, 'RK4 converges at fourth order before chaotic separation');
const forward = math.pendulumRK4([.3, -.4, .8, -.6]); const reversed = math.pendulumRK4([forward[0], forward[1], -forward[2], -forward[3]]); [.3, -.4, -.8, .6].forEach((v, i) => assert(Math.abs(reversed[i] - v) < 1e-9));
for (const [a, b] of [[0, 0], [120, -25], [175, -175], [-175, 175], [10, 15]]) {
  const pendulum = math.createDoublePendulum(a, b), twin = math.createDoublePendulum(a, b); let maxDrift = 0;
  for (let i = 0; i < 1800; i++) { pendulum.step(); if (i < 300) twin.step(); assert([...pendulum.main, ...pendulum.ghost].every(Number.isFinite)); maxDrift = Math.max(maxDrift, Math.abs(pendulum.energy - pendulum.initialEnergy)); if (i === 299) assert.deepEqual(pendulum.main, twin.main, 'Identical releases replay exactly'); }
  assert(maxDrift / 29.43 < 2e-5, 'Energy remains stable over 60 simulated seconds'); assert.equal(pendulum.trail.length, 901); assert.equal(pendulum.ghostTrail.length, 901); assert.equal(pendulum.time, 60);
}
const chaos = math.createDoublePendulum(); for (let i = 0; i < 900; i++) chaos.step(); assert(Math.hypot(...chaos.trail.at(-1).map((v, i) => v - chaos.ghostTrail.at(-1)[i])) > .1, 'The chosen energetic release separates from its perturbed twin');
// Independent mechanics checks for the central-star sandbox.
const orbitBody = (x, y, vx, vy) => ({ x, y, vx, vy, status: 'orbiting' });
const gravityAcceleration = math.orbitalAcceleration(2, 0, 3); assert(Math.abs(gravityAcceleration[0] + .75) < 1e-12 && gravityAcceleration[1] === 0);
const circle = orbitBody(1, 0, 0, 1); let circleEnergyError = 0;
for (let i = 0; i < 2262; i++) { math.orbitalVerlet(circle, 1); circleEnergyError = Math.max(circleEnergyError, Math.abs(math.orbitalInvariants(circle, 1).energy + .5)); }
const circleTime = 2262 / 360; assert(Math.hypot(circle.x - Math.cos(circleTime), circle.y - Math.sin(circleTime)) < 1e-4); assert(circleEnergyError < 1e-8); assert(Math.abs(math.orbitalInvariants(circle, 1).angularMomentum - 1) < 1e-12);
for (const [mu, speed] of [[1, 1], [1.5, 1], [.5, 1.5]]) { const b = orbitBody(2, 0, 0, speed / Math.sqrt(2)), info = math.orbitalInvariants(b, mu); assert(Math.abs(info.eccentricity - Math.abs(speed * speed / mu - 1)) < 1e-12); assert.equal(info.energy < 0, speed * speed < 2 * mu); }
const symmetric = orbitBody(1, .5, -.2, .8), mirror = orbitBody(-1, -.5, .2, -.8); for (let i = 0; i < 100; i++) { math.orbitalVerlet(symmetric, 1); math.orbitalVerlet(mirror, 1); } for (const key of ['x', 'y', 'vx', 'vy']) assert(Math.abs(symmetric[key] + mirror[key]) < 1e-12);
const radial = orbitBody(.5, 0, -1, 0); for (let i = 0; i < 300; i++) math.orbitalVerlet(radial, 2.5); assert.equal(radial.status, 'absorbed'); assert(Math.abs(Math.hypot(radial.x, radial.y) - .18) < 1e-12);
const reversible = orbitBody(2, .1, -.2, .7), original = { ...reversible }; math.orbitalVerlet(reversible, 1); reversible.vx *= -1; reversible.vy *= -1; math.orbitalVerlet(reversible, 1); for (const key of ['x', 'y']) assert(Math.abs(reversible[key] - original[key]) < 1e-12); for (const key of ['vx', 'vy']) assert(Math.abs(reversible[key] + original[key]) < 1e-12);
for (const [mu, speed] of [[1.2, 1], [.25, 2.2], [2.5, .2]]) {
  const system = math.createOrbitalGravity(mu, speed), repeat = math.createOrbitalGravity(mu, speed);
  for (let i = 0; i < 3000; i++) { system.step(); if (i < 300) repeat.step(); if (i === 299) assert.deepEqual(system.bodies, repeat.bodies); }
  for (const body of system.bodies) { assert([body.x, body.y, body.vx, body.vy].every(Number.isFinite)); assert(body.trail.length <= 901); if (body.status === 'orbiting') { const now = math.orbitalInvariants(body, mu); assert(Math.abs(now.angularMomentum - body.initial.angularMomentum) < 1e-10); assert(Math.abs(now.energy - body.initial.energy) < 1e-4); } }
  if (speed === .2) assert(system.bodies.every(b => b.status === 'absorbed')); if (speed === 2.2) assert(system.bodies.some(b => b.status === 'escaped'));
}
const launches = math.createOrbitalGravity(); assert(!launches.launch(0, 0, 1, 1)); assert(!launches.launch(1, 0, Infinity, 0)); for (let i = 0; i < 6; i++) assert(launches.launch(2, 0, 0, 1)); assert(!launches.launch(2, 0, 0, 1)); assert.equal(launches.bodies.length, 12); assert.equal(launches.steps, 0);
// Wave symmetry, coherent cancellation, temporal periodicity and height bounds.
for (const t of [0, .3, 100]) for (const z of [-3, -.2, 1.7]) {
  assert(Math.abs(math.waveSample(0, z, t, 1.1, 1.4, Math.PI)) < 1e-12);
  assert(Math.abs(math.waveSample(.7, z, t) - math.waveSample(-.7, z, t)) < 1e-12);
  assert(Math.abs(math.waveSample(.2, z, t) - math.waveSample(.2, z, t + 1 / .6)) < 1e-12);
  assert(Math.abs(math.waveSample(.2, z, t)) <= .64);
}
// RK4 convergence against an analytic solution, and the Rössler equilibrium.
function rkError(dt) { let p = [1]; for (let i = 0; i < Math.round(1 / dt); i++) p = math.integrateRK4(p, dt, x => x); return Math.abs(p[0] - Math.E); }
assert(rkError(.1) / rkError(.05) > 14);
const rz = (5.7 - Math.sqrt(5.7 ** 2 - 4 * .2 * .2)) / (.4); assert(math.rosslerDerivative([.2 * rz, -rz, rz]).every(v => Math.abs(v) < 1e-12));
for (const a of [.1, .2, .28]) for (const c of [3.5, 5.7, 6.5]) { const curve = math.rosslerCurve(a, c); assert(curve.points.length <= 8000 && curve.points.length > 100); assert(curve.points.flat().every(Number.isFinite)); if (a === .2 && c === 5.7) assert(!curve.stopped && curve.points.length === 8000); }
// Magnetic force equals minus the potential gradient; damping removes energy.
const magneticState = [.4, -.7, .6, -.8], magneticDamping = .22, magneticStrength = .8, magneticD = math.magneticDerivative(magneticState, magneticDamping, magneticStrength);
let energyRate = 0; for (let axis = 0; axis < 4; axis++) { const a = magneticState.slice(), b = magneticState.slice(); a[axis] += 1e-6; b[axis] -= 1e-6; energyRate += (math.magneticEnergy(a, magneticStrength) - math.magneticEnergy(b, magneticStrength)) / 2e-6 * magneticD[axis]; } assert(Math.abs(energyRate + magneticDamping * (magneticState[2] ** 2 + magneticState[3] ** 2)) < 1e-8);
for (const [damping, strength] of [[.08, .2], [.8, 1.5], [.22, .8]]) {
  const field = math.createMagneticPendulums(damping, strength), energies = field.bodies.map(b => math.magneticEnergy(b.state, strength));
  for (let i = 0; i < 600; i++) field.step(); field.bodies.forEach((b, i) => { assert(b.state.every(Number.isFinite)); assert(b.trail.length <= 361); assert(math.magneticEnergy(b.state, strength) <= energies[i] + 1e-7); });
}
// Pen projection must round-trip while the world rotates, at every depth.
for (const [width, height] of [[390, 844], [1600, 900]]) for (const yaw of [-2, .45, 3]) for (const pitch of [-1.4, .45, 1.4]) for (const depth of [-2, 0, 2]) {
  const state = { yaw, pitch, zoom: 1.3, b: depth }, px = width * .73, py = height * .26, world = math.inkUnproject(px, py, width, height, state, .7), projected = math.inkProject(world, width, height, state, .7);
  assert(Math.abs(projected[0] - px) < 1e-10 && Math.abs(projected[1] - py) < 1e-10 && Math.abs(projected[2] - depth) < 1e-12, 'The mark stays under the pen at all orientations');
  const p = [.7, -1, .4], rotated = math.inkRotate(p, yaw, pitch); assert(Math.abs(Math.hypot(...p) - Math.hypot(...rotated)) < 1e-12); math.inkInverse(rotated, yaw, pitch).forEach((v, i) => assert(Math.abs(v - p[i]) < 1e-12));
}
const ink = math.createInkDrawing(3, 2); assert(!ink.begin([NaN, 0, 0], 190, [0, 0])); assert(ink.begin([0, 0, 0], 190, [0, 0])); assert(!ink.sample([0, 0, 0])); assert(ink.sample([1, 0, 0])); assert(ink.sample([2, 0, 0])); assert(!ink.sample([3, 0, 0])); assert(ink.full); assert(!ink.begin([0, 0, 0], 190, [0, 0])); ink.end(); const savedInk = JSON.stringify(ink.strokes); ink.clear(); assert.equal(ink.points, 0); assert(ink.undo()); assert.equal(JSON.stringify(ink.strokes), savedInk); assert.equal(ink.points, 3); assert(ink.undo()); assert.equal(ink.points, 0);
const strokeLimit = math.createInkDrawing(10, 2); for (let i = 0; i < 2; i++) { assert(strokeLimit.begin([i, 0, 0], i * 65, [0, 0])); strokeLimit.end(); } assert(!strokeLimit.begin([3, 0, 0], 0, [0, 0])); assert(strokeLimit.undo()); assert(strokeLimit.begin([3, 0, 0], 0, [0, 0]));
// Sequence, rectangle tiling, true cube dimensions, and lifted-arc continuity.
assert.deepEqual(math.fibonacciNumbers(12), [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]);
for (let count = 1; count <= 12; count++) {
  const model = math.fibonacciSculpture(count), values = model.numbers, bounds = model.bounds, next = count === 1 ? 1 : values.at(-1) + values.at(-2), squareArea = values.reduce((n, v) => n + v * v, 0);
  assert.equal(squareArea, values.at(-1) * next); assert.equal((bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ), squareArea);
  if (count > 2) assert.equal(values.at(-1), values.at(-2) + values.at(-3));
  model.cubes.forEach((cube, i) => {
    const vertices = math.fibonacciVertices(cube); for (const axis of [0, 1, 2]) assert.equal(Math.max(...vertices.map(p => p[axis])) - Math.min(...vertices.map(p => p[axis])), cube.value, 'All three cube dimensions equal the Fibonacci term');
    for (let j = 0; j < i; j++) { const other = model.cubes[j]; assert(Math.min(cube.x + cube.value, other.x + other.value) <= Math.max(cube.x, other.x) || Math.min(cube.z + cube.value, other.z + other.value) <= Math.max(cube.z, other.z), 'Square interiors never overlap'); }
    for (const [x, y, z] of cube.arc) { assert(Math.abs(Math.hypot(x - cube.center[0], z - cube.center[1]) - cube.value) < 1e-10); assert.equal(y, cube.value); assert(x >= cube.x - 1e-10 && x <= cube.x + cube.value + 1e-10 && z >= cube.z - 1e-10 && z <= cube.z + cube.value + 1e-10); }
    if (i) { const previous = model.cubes[i - 1].arc.at(-1), start = cube.arc[0]; assert(Math.hypot(start[0] - previous[0], start[2] - previous[2]) < 1e-10, 'Lifted quarter arcs meet through a vertical connector'); }
    for (const extrusion of [0, .4, 1]) { const frame = math.fibonacciFrame(model, extrusion); for (const p of math.fibonacciVertices(cube, extrusion)) assert(Math.hypot(...p.map((v, axis) => v - frame.center[axis])) <= frame.radius + 1e-10, 'Auto-framing contains every displayed cube'); }
  });
  if (count > 1) assert.equal(model.ratio, values.at(-1) / values.at(-2)); else assert.equal(model.ratio, null);
}
assert(Math.abs(math.fibonacciSculpture(12).ratio - math.goldenRatio) < .00006); for (const count of [0, 13, 1.5]) assert.throws(() => math.fibonacciNumbers(count));
function png(image) {
  function crc(data) { let c = 0xffffffff; for (const byte of data) { c ^= byte; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1; } return (c ^ 0xffffffff) >>> 0; }
  function chunk(type, data) { const body = Buffer.concat([Buffer.from(type), data]), length = Buffer.alloc(4), checksum = Buffer.alloc(4); length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(body)); return Buffer.concat([length, body, checksum]); }
  const head = Buffer.alloc(13); head.writeUInt32BE(image.width); head.writeUInt32BE(image.height, 4); head[8] = 8; head[9] = 6; const raw = Buffer.alloc((image.width * 4 + 1) * image.height); for (let y = 0; y < image.height; y++) Buffer.from(image.data.buffer, y * image.width * 4, image.width * 4).copy(raw, y * (image.width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
export function recorder(width, height) {
  const shapes = []; let path = '', arc = '', calls = 0, lastImage;
  const num = n => { assert(Number.isFinite(n), 'Finite Canvas coordinates'); calls++; return +n.toFixed(3); };
  const context = { globalAlpha: 1, fillStyle: '#000', strokeStyle: '#fff', lineWidth: 1,
    beginPath() { path = ''; arc = ''; }, moveTo(x, y) { path += `M${num(x)} ${num(y)}`; }, lineTo(x, y) { path += `L${num(x)} ${num(y)}`; }, closePath() { path += 'Z'; },
    arc(x, y, r) { assert(r > 0); arc = `circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"`; },
    fillRect(x, y, w, h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}"/>`); },
    fill() { shapes.push(`<${arc || `path d="${path}"`} fill="${this.fillStyle}"${this.globalAlpha === 1 ? '' : ` opacity="${this.globalAlpha}"`}/>`); }, stroke() { shapes.push(`<${arc || `path d="${path}"`} fill="none" stroke="${this.strokeStyle}" stroke-width="${num(this.lineWidth)}" stroke-linecap="round"${this.globalAlpha === 1 ? '' : ` opacity="${this.globalAlpha}"`}/>`); },
    fillText(text, x, y) { assert(/^[0-9]+$/.test(text), 'Numeric geometry labels'); shapes.push(`<text x="${num(x)}" y="${num(y)}" fill="${this.fillStyle}" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="${parseFloat(this.font)}">${text}</text>`); },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }, putImageData(image) { lastImage = image; },
    drawImage(surface, x, y, w, h) { const image = surface.getImage(); assert(image && image.data.some(v => v !== 0), 'A raster scene contains rendered pixels'); shapes.push(`<image x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" href="data:image/png;base64,${png(image).toString('base64')}"/>`); }
  };
  return { canvas: { width, height, getContext: () => context, getImage: () => lastImage }, makeSurface: () => recorder(1, 1).canvas, count: () => calls, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.join('')}</svg>` };
}
export const baseState = work => ({ a: work.a[4], b: work.b[4], time: 1, yaw: .45, pitch: .45, zoom: 1, center: [0, 0], pointer: [.5, .42], seed: 1, palette: 0, direction: 1 });
for (const [slug, work] of Object.entries(catalog)) {
  const image = recorder(1000, 625), state = baseState(work), scene = createMathScene(image.canvas, slug, image.makeSurface); if (work.mode === 'ink') { for (let stroke = 0; stroke < 3; stroke++) { state.palette = stroke; state.b = (stroke - 1) * .5; scene.beginStroke(state, 650, 230); for (let i = 0; i <= 240; i++) { const t = i / 240 * Math.PI * 4; scene.moveStroke(state, 500 + Math.cos(t) * (150 - stroke * 20), 230 + Math.sin(t * 1.5) * 90); scene.step(state); } scene.endStroke(); } } for (let i = 0; i < (work.previewSteps ?? 0); i++) scene.step(state); const status = scene.draw(state); assert(status.length > 5); if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, image.svg());
  for (const [width, height] of [[390, 844], [1600, 900]]) for (const end of [1, 2]) { const r = recorder(width, height), s = { ...baseState(work), a: work.a[end], b: work.b[end], zoom: end === 1 ? .5 : 2, center: [.3, -.2], palette: 2, time: 10000 }; const model = createMathScene(r.canvas, slug, r.makeSurface); model.draw(s); model.step(s); model.plant(s, width / 2, height * .42); model.special(s); model.draw(s); assert(r.count() > 5); }
}
console.log('PASS: nineteen math experiments — Newton roots/symmetry, Hopf unit sphere/fibers/linking number, torus closure/link components, gyroid periodicity/gradient/meshing, Gray–Scott equilibrium/conservation/reference stencil, Clifford visit conservation, closed Klein/torus meshes, Euler characteristic, orientability, cutaways, Möbius seam/single boundary, Schwarz area/convergence, Sierpiński counts/areas/interpolation, Koch edge counts/lengths/areas/peak interpolation, double-pendulum mechanics/energy/RK4/replay/trail bounds, Kepler energy/angular momentum/escape/collisions, coherent waves, RK4 convergence, Rössler equilibrium, magnetic potential/dissipation/bounds, 3-D ink projection/inverse rotations/drawing limits/undo, Fibonacci recurrence/tiling/cube edges/arc joins/ratio limits, finite desktop/mobile previews.');
