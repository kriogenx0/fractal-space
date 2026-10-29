// SPDX-License-Identifier: GPL-3.0-only
// Behavioral recreations of Jared Tarbell's published Levitated descriptions.
// New Canvas implementation Copyright (C) 2026 Alex Vaos. See README.txt.
const TAU = Math.PI * 2, clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function random(seed) { let v = seed >>> 0; return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 4294967296; }; }
function path(ctx, points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; if (fill) { ctx.closePath(); ctx.fill(); } else ctx.stroke(); }
function circle(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, Math.max(.1, r), 0, TAU); ctx.fillStyle = color; ctx.fill(); }
function ink(h, l, palette = 0) { return `hsl(${(h + palette * 83) % 360},52%,${l}%)`; }
export const geometricSlugs = ['ca-twist', 'trema-field', 'folding-pentagons', 'double-helix'];

// Elementary cellular automaton with periodic boundaries, not signed bit masks.
export function nextCARow(row, rule) { const n = row.length; return row.map((_, i) => (rule >>> ((row[(i + n - 1) % n] << 2) | (row[i] << 1) | row[(i + 1) % n])) & 1); }
export function createCATwist(seed = 1, rule = 110) {
  const rng = random(seed), rows = [Array.from({ length: 16 }, () => +(rng() > .48))];
  if (!rows[0].some(Boolean)) rows[0][8] = 1;
  const model = { rows, rule: Math.round(rule), angle: -.6, generation: 0,
    step(speed = 1) { rows.push(nextCARow(rows.at(-1), model.rule)); if (rows.length > 88) rows.shift(); model.angle += speed * .012; model.generation++; }
  }; for (let i = 0; i < 87; i++) model.step(0); return model;
}
export function projectGeometry(p, tilt = .16, yaw = 0) {
  const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw), z0 = p.z * Math.cos(yaw) - p.x * Math.sin(yaw), y = p.y * Math.cos(tilt) - z0 * Math.sin(tilt), z = p.y * Math.sin(tilt) + z0 * Math.cos(tilt), scale = 640 / (720 + z);
  return { x: 300 + x * scale, y: 169 + y * scale, z, scale };
}
function drawTwist(ctx, model, twist, cursor, palette) {
  ctx.fillStyle = '#080d19'; ctx.fillRect(0, 0, 600, 337);
  const cells = [], tilt = (cursor[1] - 169) / 337 * .75 + .12;
  model.rows.forEach((row, j) => row.forEach((on, i) => {
    if (!on) return;
    const theta = i / 16 * TAU + model.angle + j * twist, y = (j - (model.rows.length - 1) / 2) * 3.3;
    const points = [[-.43, -1.25], [.43, -1.25], [.43, 1.25], [-.43, 1.25]].map(([u, v]) => { const a = theta + u * TAU / 16; return projectGeometry({ x: Math.cos(a) * 94, y: y + v, z: Math.sin(a) * 94 }, tilt); });
    cells.push({ points, z: points.reduce((s, p) => s + p.z, 0) / 4, age: j / model.rows.length });
  }));
  cells.sort((a, b) => b.z - a.z);
  for (const c of cells) { ctx.globalAlpha = clamp((.2 + c.age * .8) * (.35 + (100 - c.z) / 200 * .65), .03, 1); path(ctx, c.points, palette ? ink(175, 80, palette) : '#edf5ff', 1, true); } ctx.globalAlpha = 1;
}

// Breadth-first middle-third removal; all significant gaps precede fine ones.
export function cantorGaps(depth = 12) {
  let domains = [[0, 1]]; const gaps = [];
  for (let level = 0; level < Math.round(clamp(depth, 1, 12)); level++) { const next = []; for (const [lo, hi] of domains) { const third = (hi - lo) / 3; gaps.push({ lo: lo + third, hi: hi - third, depth: level }); next.push([lo, lo + third], [hi - third, hi]); } domains = next; }
  return gaps;
}
export function createTrema(seed = 1, depth = 12) {
  const rng = random(seed), holes = cantorGaps(depth).slice(0, 4000).map(gap => ({ ...gap, x: rng() * 600, y: rng() * 337, radius: 190 * Math.sqrt(gap.hi - gap.lo) }));
  return { holes, revealed: 0, step() { this.revealed = Math.min(this.holes.length, this.revealed + 120); } };
}
function drawTrema(ctx, model, size, palette) { ctx.fillStyle = '#faf9f5'; ctx.fillRect(0, 0, 600, 337); for (const h of model.holes.slice(0, model.revealed)) circle(ctx, h.x, h.y, h.radius * size, palette ? ink(210, 12, palette) : '#101317'); }

export function pentagonChain(folds, shrink = .9) {
  const poses = []; let x = 0, y = 0, radius = 55, angle = -Math.PI / 5;
  for (let i = 0; i < folds.length; i++) {
    const vertices = Array.from({ length: 5 }, (_, k) => ({ x: x + Math.cos(angle + k * TAU / 5) * radius, y: y + Math.sin(angle + k * TAU / 5) * radius }));
    const edge = ((i === 0 ? 0 : i % 2 ? 2 : 3) + folds[i]) % 5, p = vertices[edge], q = vertices[(edge + 1) % 5], attachment = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, outward = angle + (edge + .5) * TAU / 5;
    poses.push({ x, y, radius, angle, vertices, attachment });
    radius *= shrink; x = attachment.x + Math.cos(outward) * radius * Math.cos(Math.PI / 5); y = attachment.y + Math.sin(outward) * radius * Math.cos(Math.PI / 5); angle = outward + Math.PI - Math.PI / 5;
  } return poses;
}
function fitChain(poses) {
  const vertices = poses.flatMap(p => p.vertices), xs = vertices.map(p => p.x), ys = vertices.map(p => p.y), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, scale = Math.min(530 / Math.max(1, Math.max(...xs) - Math.min(...xs)), 275 / Math.max(1, Math.max(...ys) - Math.min(...ys)));
  const point = p => ({ x: 300 + (p.x - cx) * scale, y: 169 + (p.y - cy) * scale });
  return poses.map(p => ({ ...point(p), radius: p.radius * scale, vertices: p.vertices.map(point), attachment: point(p.attachment) }));
}
export function pentagonPoses(folds, shrink) { return fitChain(pentagonChain(folds, shrink)); }
export function createPentagons(seed = 1, count = 18) { const rng = random(seed), folds = Array.from({ length: Math.round(count) }, (_, i) => i > 1 && i < count - 1 && rng() < .24 ? 1 + Math.floor(rng() * 4) : 0); if (!folds.some(Boolean)) folds[3] = 1; return { folds, hovered: false, fold(i) { if (i >= 0 && i < folds.length - 1) folds[i] = (folds[i] + 1) % 5; }, unfold() { folds.fill(0); } }; }
function drawPentagons(ctx, model, shrink, palette) {
  const poses = pentagonPoses(model.folds, shrink);
  for (let i = 0; i < poses.length; i++) { const p = poses[i]; path(ctx, p.vertices, ink(190 + i * 7, 90 - i * .8, palette), 1, true); path(ctx, [...p.vertices, p.vertices[0]], ink(200 + i * 4, 30, palette), .8); if (i < poses.length - 1) path(ctx, [p, p.attachment], '#607583', .45); if (model.folds[i]) circle(ctx, p.x, p.y, 2.3, '#ce3e38'); }
}

export function helixRung(index, count, turns = 3, phase = 0, expanded = false) {
  const angle = index / (count - 1) * TAU * turns + phase, radius = expanded ? 110 : 64, x = (index / (count - 1) - .5) * 500, y = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  return [{ x, y, z }, { x, y: 0, z: 0 }, { x, y: -y, z: -z }];
}
export function helixPoses(model, count, turns, cursor) { return Array.from({ length: Math.round(count) }, (_, i) => helixRung(i, Math.round(count), turns, model.phase, model.expanded.has(i)).map(p => projectGeometry(p, .32 + (cursor[1] - 169) / 337 * .5, (cursor[0] - 300) / 600 * .35))); }
function drawHelix(ctx, model, count, turns, cursor, palette) {
  ctx.fillStyle = '#080d19'; ctx.fillRect(0, 0, 600, 337);
  const poses = helixPoses(model, count, turns, cursor), primitives = [];
  for (let i = 0; i < poses.length; i++) {
    const rung = poses[i];
    for (let j = 0; j < 2; j++) primitives.push({ z: (rung[j].z + rung[j + 1].z) / 2, draw() { path(ctx, [rung[j], rung[j + 1]], model.expanded.has(i) ? '#e3c997' : '#46596c', .65); } });
    for (const k of [0, 2]) if (i) { const a = poses[i - 1][k], b = rung[k]; primitives.push({ z: (a.z + b.z) / 2, draw() { path(ctx, [a, b], ink(k ? 270 : 180, 64, palette), 1.5); } }); }
    rung.forEach((p, k) => primitives.push({ z: p.z - .1, draw() { const radius = (k === 1 ? 2.4 : model.expanded.has(i) ? 7 : 4) * p.scale; circle(ctx, p.x, p.y, radius + 1, '#101b2c'); circle(ctx, p.x, p.y, radius, ink(k === 1 ? 40 : k === 0 ? 180 : 270, 65, palette)); if (k !== 1) { const d = radius * .5; path(ctx, [{ x: p.x, y: p.y - d }, { x: p.x + d, y: p.y }, { x: p.x, y: p.y + d }, { x: p.x - d, y: p.y }, { x: p.x, y: p.y - d }], '#e8f3ff', .55); } } }));
  }
  primitives.sort((a, b) => b.z - a.z); for (const primitive of primitives) primitive.draw();
}

export function createGeometricStudy(slug, seed = 1, a, b) {
  if (!geometricSlugs.includes(slug)) throw new Error(`Unknown geometric study: ${slug}`);
  let generation = seed, currentA = a, currentB = b, model, cursor = [400, 169]; const rng = random(seed);
  function rebuild() { model = slug === 'ca-twist' ? createCATwist(generation, currentA) : slug === 'trema-field' ? createTrema(generation, currentA) : slug === 'folding-pentagons' ? createPentagons(generation, currentA) : { phase: -.5, expanded: new Set() }; }
  function configure(a, b) { const rebuildNeeded = a !== currentA && slug !== 'double-helix'; currentA = a; currentB = b; if (rebuildNeeded) rebuild(); if (slug === 'double-helix') for (const i of model.expanded) if (i >= Math.round(a)) model.expanded.delete(i); return rebuildNeeded; }
  function step(a, b) { configure(a, b); if (slug === 'ca-twist') { model.step((cursor[0] - 300) / 150); return true; } if (slug === 'trema-field') { const before = model.revealed; model.step(); return model.revealed !== before; } if (slug === 'double-helix') { model.phase += .012; return true; } return false; }
  function hitPentagon(x, y) { const poses = pentagonPoses(model.folds, currentB); for (let i = poses.length - 2; i >= 0; i--) { const v = poses[i].vertices; let inside = true; for (let j = 0; j < 5; j++) { const p = v[j], q = v[(j + 1) % 5]; if ((q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x) < 0) { inside = false; break; } } if (inside) return i; } return -1; }
  function pointer(x, y) { cursor = [clamp(x, 0, 600), clamp(y, 0, 337)]; if (slug === 'folding-pentagons') { const i = hitPentagon(...cursor); if (i >= 0 && !model.hovered) model.fold(i); model.hovered = i >= 0; } }
  function action() { if (slug === 'ca-twist') { generation++; const rule = (Math.floor(rng() * 255) + 1 + Math.round(currentA)) % 256; currentA = rule; rebuild(); return { a: rule }; } if (slug === 'folding-pentagons') model.unfold(); else if (slug === 'double-helix') { if (model.expanded.size === Math.round(currentA)) model.expanded.clear(); else for (let i = 0; i < Math.round(currentA); i++) model.expanded.add(i); } else { generation++; rebuild(); } return null; }
  function click(x, y) { if (slug === 'folding-pentagons') { const i = hitPentagon(x, y); model.fold(i); model.hovered = i >= 0; return; } if (slug === 'double-helix') { const poses = helixPoses(model, currentA, currentB, cursor); let best = -1, distance = 17; poses.forEach((rung, i) => rung.forEach(p => { const d = Math.hypot(x - p.x, y - p.y); if (d < distance) { best = i; distance = d; } })); if (best >= 0) { if (model.expanded.has(best)) model.expanded.delete(best); else model.expanded.add(best); } return; } return action(); }
  function draw(ctx, a, b, palette = 0) { if (slug === 'ca-twist') drawTwist(ctx, model, b, cursor, palette); else if (slug === 'trema-field') drawTrema(ctx, model, b, palette); else if (slug === 'folding-pentagons') drawPentagons(ctx, model, b, palette); else drawHelix(ctx, model, a, b, cursor, palette); }
  function status() { return slug === 'ca-twist' ? `Rule ${model.rule} · 16 bits · ${model.generation} generations · ${model.rows.length} visible rows` : slug === 'trema-field' ? `${model.revealed} / ${model.holes.length} circular cuts · middle-third recursion` : slug === 'folding-pentagons' ? `${model.folds.length} pentagons · ${model.folds.filter(Boolean).length} folded joints · red dots mark changed sides` : `${Math.round(currentA)} rungs · ${model.expanded.size} expanded · click a bead`; }
  rebuild(); return { get data() { return model; }, configure, step, pointer, click, action, draw, status, warmup: slug === 'trema-field' ? 40 : 0, warmWhilePaused: slug === 'trema-field' };
}
