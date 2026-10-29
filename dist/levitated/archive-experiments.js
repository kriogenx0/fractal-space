// SPDX-License-Identifier: GPL-3.0-only
// Canvas recreations of Jared Tarbell's published Levitated algorithms, 2001–2003.
// New implementation Copyright (C) 2026 Alex Vaos.
// Differences from Flash playback and source provenance are documented in README.txt.
const TAU = Math.PI * 2, PHI = (1 + Math.sqrt(5)) / 2;
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
function random(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
function path(ctx, points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (fill) ctx.closePath(); ctx.lineWidth = width; if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.stroke(); } }
function dot(ctx, x, y, r, color, fill = true) { ctx.beginPath(); ctx.arc(x, y, Math.max(.15, r), 0, TAU); if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.lineWidth = .7; ctx.strokeStyle = color; ctx.stroke(); } }
function pigment(hue, light = 50, palette = 0) { return `hsl(${(hue + palette * 65) % 360},45%,${light}%)`; }

export function createBoxes(seed = 1) {
  const rng = random(seed), boxes = []; let failures = 0;
  function overlaps(x, y, r, gap, ignored = -1) { return boxes.some((b, i) => i !== ignored && Math.abs(x - b.x) < r + b.r + gap && Math.abs(y - b.y) < r + b.r + gap); }
  function add(x, y, gap = 1) { if (boxes.length >= 600 || x < 3 || x > 597 || y < 3 || y > 334 || overlaps(x, y, 1, gap)) return false; boxes.push({ x, y, r: 1, growing: true }); failures = 0; return true; }
  function step(attempts = 4, gap = 1) {
    if (finished()) return false;
    for (let i = 0; i < Math.round(attempts); i++) { if (add(3 + rng() * 594, 3 + rng() * 331, gap)) break; failures++; }
    boxes.forEach((b, i) => { if (!b.growing) return; const r = b.r + 1; if (b.x - r < 2 || b.x + r > 598 || b.y - r < 2 || b.y + r > 335 || overlaps(b.x, b.y, r, gap, i)) b.growing = false; else b.r = r; });
    return true;
  }
  function finished() { return (failures > 1000 || boxes.length >= 600) && boxes.every(b => !b.growing); }
  return { boxes, add, step, finished };
}
export function drawBoxes(ctx, model, palette = 0) {
  model.boxes.forEach(b => { const band = Math.floor(b.y / 337 * 16); ctx.fillStyle = pigment(12 + band * 4, 28 + band * 2.5, palette); ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); });
}

export function createMosaic(seed = 1, columns = 27) {
  const rng = random(seed), rows = Math.max(6, Math.round(columns * 337 / 600)), cells = [], pending = [];
  const palette = [[46, 86, 75], [215, 119, 72], [229, 194, 117], [123, 156, 123], [116, 71, 73]];
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) { const id = cells.length; cells.push({ x, y, color: palette[Math.floor(rng() * palette.length)].slice(), visible: false }); pending.push(id); }
  // Shuffle the insertion order once; each tile then averages its present neighborhood.
  for (let i = pending.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pending[i], pending[j]] = [pending[j], pending[i]]; }
  function step(pace = 8) {
    if (!pending.length) return false;
    for (let n = 0; n < pace && pending.length; n++) {
      const cell = cells[pending.pop()], neighbors = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const x = cell.x + dx, y = cell.y + dy; if (x >= 0 && x < columns && y >= 0 && y < rows) neighbors.push(cells[y * columns + x]); }
      cell.color = [0, 1, 2].map(channel => Math.round(neighbors.reduce((sum, n) => sum + n.color[channel], 0) / neighbors.length)); cell.visible = true;
    }
    return true;
  }
  return { cells, pending, columns, rows, step, finished: () => !pending.length };
}
export function drawMosaic(ctx, model, palette = 0) {
  const unit = Math.min(570 / model.columns, 310 / model.rows), ox = (600 - model.columns * unit) / 2, oy = (337 - model.rows * unit) / 2;
  for (const cell of model.cells) if (cell.visible) {
    // The four corners of each 2x2 block meet to make a circle, as in the original.
    const right = cell.x % 2 === 0, bottom = cell.y % 2 === 0, x = ox + (cell.x + +right) * unit, y = oy + (cell.y + +bottom) * unit;
    const start = right ? (bottom ? Math.PI : Math.PI / 2) : (bottom ? -Math.PI / 2 : 0);
    const points = [[x, y]]; for (let k = 0; k <= 14; k++) { const angle = start + k / 14 * Math.PI / 2; points.push([x + Math.cos(angle) * unit * .95, y + Math.sin(angle) * unit * .95]); }
    const rgb = [0, 1, 2].map(channel => cell.color[(channel + palette) % 3]);
    path(ctx, points, `rgb(${rgb.join(',')})`, 1, true);
  }
}

export function seedPoint(index, angle = 137.5, count = 900, phase = 0) {
  const radius = 146 * Math.sqrt(index / Math.max(1, count)), theta = index * angle * Math.PI / 180 + phase;
  return { x: 300 + radius * Math.cos(theta), y: 169 + radius * Math.sin(theta), theta };
}
export function createSeeds(seed = 1) { let count = 0; const phase = random(seed)() * TAU; return { get count() { return count; }, phase, step(target = 900) { if (count >= target) return false; count = Math.min(target, count + 12); return true; }, finished: target => count >= target }; }
export function drawSeeds(ctx, model, angle, count, palette = 0) {
  const size = Math.max(1.1, 105 / Math.sqrt(count));
  for (let i = 0; i < Math.min(model.count, count); i++) { const p = seedPoint(i, angle, count, model.phase); dot(ctx, p.x, p.y, size * (1 + .18 * Math.sin(p.theta)), pigment(24 + i / count * 100, 32 + i / count * 24, palette)); }
}
export function goldenPolygons(sides = 4) {
  let x = 0, y = 0, radius = 110, angle = 0; const polygons = [];
  for (let depth = 0; depth < 64; depth++) {
    const points = Array.from({ length: sides }, (_, i) => [x + Math.cos(angle + i * TAU / sides) * radius, y + Math.sin(angle + i * TAU / sides) * radius]);
    polygons.push({ points, radius, depth }); x += Math.cos(angle) * radius * 1.15; y += Math.sin(angle) * radius * 1.15; radius /= PHI; angle += TAU / sides;
  }
  return { polygons, center: [x, y] };
}
export function drawGolden(ctx, sides, zoom, palette = 0) {
  const { polygons, center } = goldenPolygons(sides);
  for (const polygon of polygons) { const r = polygon.radius * zoom; if (r < .15 || r > 1800) continue;
    const points = polygon.points.map(([x, y]) => [300 + (x - center[0]) * zoom, 169 + (y - center[1]) * zoom]);
    path(ctx, [...points, points[0]], pigment(200 + polygon.depth * 13, 32 + polygon.depth % 5 * 6, palette), .8);
  }
}

export function createCity(seed = 1) {
  const rng = random(seed), lines = Array.from({ length: 10 }, (_, i) => ({ points: [[25, 38 + i * 27]], x: 25, y: 38 + i * 27, base: 38 + i * 27, phase: rng() * TAU, span: 0 })); let age = 0;
  function step(amplitude = 1, pace = 2) {
    if (age >= 1300) return false; age++;
    for (const [i, line] of lines.entries()) for (let k = 0; k < pace; k++) {
      if (--line.span <= 0) { line.span = 4 + Math.floor(rng() * 15); const next = line.base + Math.round(Math.sin(age * .018 + line.phase) * 12 * amplitude); line.points.push([line.x, next]); line.y = next; }
      line.x += .8 + i * .035; line.points.push([line.x, line.y]);
      if (line.x > 575) { const dx = line.x - 575; line.x = 575; line.points.forEach(p => p[0] -= dx); }
      while (line.points.length && line.points[0][0] < 25) line.points.shift();
    }
    return true;
  }
  return { lines, step, finished: () => age >= 1300, get age() { return age; } };
}
export function drawCity(ctx, model, palette = 0) {
  ctx.globalAlpha = model.age > 1000 ? Math.max(.03, 1 - (model.age - 1000) / 300) : 1;
  model.lines.forEach((line, i) => path(ctx, line.points, pigment(195 + i * 10, 28 + i * 3, palette), .8)); ctx.globalAlpha = 1;
}

export function triangleArea([a, b, c]) { return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2; }
export function createTriangles(seed = 1, depth = 6, irregularity = .8) {
  const rng = random(seed), outline = [[300, 20], [573, 310], [27, 310]], queue = [{ triangle: outline, depth: 0 }], divisions = [];
  function step() {
    if (!queue.length) return false;
    for (let n = 0; n < 90 && queue.length; n++) {
      const item = queue.pop(); if (item.depth >= depth) continue;
      const weights = Array.from({ length: 3 }, () => (1 - irregularity) + irregularity * (.05 + rng())), sum = weights.reduce((a, b) => a + b, 0);
      const d = [0, 1].map(axis => item.triangle.reduce((value, p, i) => value + p[axis] * weights[i] / sum, 0));
      divisions.push({ triangle: item.triangle, point: d, depth: item.depth });
      const [a, b, c] = item.triangle; for (const triangle of [[a, d, c], [a, b, d], [d, b, c]]) queue.push({ triangle, depth: item.depth + 1 });
    }
    return true;
  }
  return { outline, divisions, queue, step, finished: () => !queue.length };
}
export function drawTriangles(ctx, model, palette = 0) {
  path(ctx, [...model.outline, model.outline[0]], pigment(225, 35, palette), .8);
  for (let depth = 7; depth >= 0; depth--) {
    ctx.beginPath(); for (const division of model.divisions) if (division.depth === depth) for (const p of division.triangle) { ctx.moveTo(...division.point); ctx.lineTo(...p); }
    ctx.strokeStyle = pigment(190 + depth * 12, 36 + depth * 4, palette); ctx.lineWidth = Math.max(.25, 1 - depth * .1); ctx.stroke();
  }
}

export function createIsoblocks(seed = 1, extent = 6) {
  const rng = random(seed), blocks = new Map(), position = [0, 0, 0];
  function step(pace = 4) {
    for (let n = 0; n < pace; n++) { const axis = Math.floor(rng() * 3); position[axis] = clamp(position[axis] + (rng() < .5 ? -1 : 1), 0, extent - 1); const key = position.join(',');
      if (blocks.has(key)) blocks.get(key).size = Math.min(.95, blocks.get(key).size + .07); else blocks.set(key, { p: position.slice(), size: .25 }); }
    return true;
  }
  return { blocks, extent, position, step };
}
export function drawIsoblocks(ctx, model, palette = 0) {
  const unit = 132 / model.extent, center = (model.extent - 1) / 2;
  const project = ([x, y, z]) => [300 + (x - y) * unit * .866, 169 + ((x + y - center * 2) * .5 - (z - center)) * unit];
  const sorted = [...model.blocks.values()].sort((a, b) => a.p.reduce((s, v) => s + v, 0) - b.p.reduce((s, v) => s + v, 0));
  for (const block of sorted) {
    const [x, y, z] = block.p, h = block.size / 2, point = (dx, dy, dz) => project([x + dx * h, y + dy * h, z + dz * h]), hue = 170 + x / model.extent * 100;
    const faces = [[[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]];
    faces.forEach((face, i) => { const points = face.map(p => point(...p)); path(ctx, points, pigment(hue, [42, 56, 72][i], palette), .5, true); path(ctx, [...points, points[0]], '#ffffff66', .35); });
  }
}

export function createMycelium(seed = 1, radius = 8) {
  const rng = random(seed), nodes = [], active = [], buckets = new Map(); let budget = 0, colony = 0;
  const cell = 48, key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  function put(x, y, r, parent, color) { if (nodes.length >= 1800) return -1; const index = nodes.length; nodes.push({ x, y, radius: r, parent, colony: color, tries: 0 }); active.push(index); const k = key(x, y); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(index); return index; }
  function seedAt(x, y) { const nearby = nodes.findIndex(n => Math.hypot(n.x - x, n.y - y) < n.radius + 3); if (nearby >= 0) { nodes[nearby].tries = 0; if (!active.includes(nearby)) active.push(nearby); return nearby; } return put(clamp(x, 20, 580), clamp(y, 20, 317), radius, -1, colony++); }
  function collision(x, y, r, parent) {
    const bx = Math.floor(x / cell), by = Math.floor(y / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const i of buckets.get(`${bx + dx},${by + dy}`) ?? []) if (i !== parent) { const n = nodes[i]; if (Math.hypot(n.x - x, n.y - y) < (n.radius + r) * .9) return true; }
    return false;
  }
  function step(pace = 22) {
    if (!active.length || nodes.length >= 1800) return false;
    budget += pace / 30; let changed = false;
    while (budget >= 1 && active.length && nodes.length < 1800) {
      budget--; const choice = Math.floor(rng() * active.length), index = active[choice], n = nodes[index], angle = rng() * TAU, r = radius * (.6 + rng() * .8), distance = n.radius + r * .72, x = n.x + Math.cos(angle) * distance, y = n.y + Math.sin(angle) * distance;
      if (x > r + 4 && x < 596 - r && y > r + 4 && y < 333 - r && !collision(x, y, r, index)) { put(x, y, r, index, n.colony); changed = true; }
      if (++n.tries >= 8) active.splice(choice, 1);
    }
    return changed;
  }
  seedAt(150, 169); seedAt(300, 169); seedAt(450, 169);
  return { nodes, active, radius, step, seedAt, finished: () => !active.length || nodes.length >= 1800 };
}
export function drawMycelium(ctx, model, palette = 0) {
  for (const n of model.nodes) { const ink = pigment(15 + n.colony * 102, 48, palette); dot(ctx, n.x, n.y, n.radius, ink, false); dot(ctx, n.x, n.y, 1.1, ink); if (n.parent >= 0) { const p = model.nodes[n.parent], x = (n.x * p.radius + p.x * n.radius) / (n.radius + p.radius), y = (n.y * p.radius + p.y * n.radius) / (n.radius + p.radius); dot(ctx, x, y, 1.5, ink); } }
}

export const archiveSlugs = ['box-fitting', 'quarter-round', 'seeds', 'golden-spiral', 'city-lines', 'triangulation', 'isoblocks', 'mycelium'];
export function createArchiveStudy(slug, seed, a, b) {
  let generation = seed, currentA = a, currentB = b, model;
  function rebuild() {
    model = slug === 'box-fitting' ? createBoxes(generation) : slug === 'quarter-round' ? createMosaic(generation, Math.round(currentA)) : slug === 'seeds' ? createSeeds(generation) : slug === 'golden-spiral' ? {} : slug === 'city-lines' ? createCity(generation) : slug === 'triangulation' ? createTriangles(generation, Math.round(currentA), currentB) : slug === 'isoblocks' ? createIsoblocks(generation, Math.round(currentA)) : createMycelium(generation, currentA);
  }
  function configure(a, b) { const reset = currentA !== a && ['quarter-round', 'triangulation', 'isoblocks', 'mycelium'].includes(slug) || currentB !== b && ['triangulation', 'seeds'].includes(slug); currentA = a; currentB = b; if (reset) rebuild(); return reset; }
  function step(a, b) { configure(a, b); return slug === 'box-fitting' ? model.step(a, b) : slug === 'quarter-round' ? model.step(b) : slug === 'seeds' ? model.step(Math.round(b)) : slug === 'golden-spiral' ? false : slug === 'city-lines' ? model.step(a, b) : slug === 'triangulation' ? model.step() : slug === 'isoblocks' ? model.step(Math.round(b)) : model.step(b); }
  function draw(ctx, a, b, palette = 0) { if (slug === 'box-fitting') drawBoxes(ctx, model, palette); else if (slug === 'quarter-round') drawMosaic(ctx, model, palette); else if (slug === 'seeds') drawSeeds(ctx, model, a, Math.round(b), palette); else if (slug === 'golden-spiral') drawGolden(ctx, Math.round(a), b, palette); else if (slug === 'city-lines') drawCity(ctx, model, palette); else if (slug === 'triangulation') drawTriangles(ctx, model, palette); else if (slug === 'isoblocks') drawIsoblocks(ctx, model, palette); else drawMycelium(ctx, model, palette); }
  function restart() { generation++; rebuild(); }
  function click(x, y) { if (slug === 'box-fitting') return model.add(x, y, currentB); if (slug === 'mycelium') return model.seedAt(x, y); restart(); }
  function action() { if (slug === 'golden-spiral') return { a: currentA >= 5 ? 3 : currentA + 1 }; restart(); return null; }
  function status() { return slug === 'box-fitting' ? `${model.boxes.length} growing squares` : slug === 'quarter-round' ? `${model.cells.length - model.pending.length} / ${model.cells.length} tiles` : slug === 'seeds' ? `${model.count} seeds · angle ${currentA.toFixed(2)}°` : slug === 'golden-spiral' ? `${Math.round(currentA)} sides · golden ratio ${PHI.toFixed(6)} · scroll to zoom` : slug === 'city-lines' ? `${model.lines.length} drawing machines · ${model.age >= 1300 ? 'drawing complete' : 'drawing'}` : slug === 'triangulation' ? `${model.divisions.length} triangle divisions` : slug === 'isoblocks' ? `${model.blocks.size} cubes · ${Math.round(currentA)}³ grid` : `${model.nodes.length} spores · ${model.active.length} growing tips`; }
  rebuild();
  return { get data() { return model; }, configure, step, draw, click, action, status, warmup: slug === 'box-fitting' ? 80 : slug === 'quarter-round' ? 30 : slug === 'seeds' ? 70 : slug === 'golden-spiral' ? 0 : slug === 'city-lines' ? 180 : slug === 'triangulation' ? 8 : slug === 'isoblocks' ? 180 : 200 };
}
