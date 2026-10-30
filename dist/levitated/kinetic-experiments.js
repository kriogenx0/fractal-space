// SPDX-License-Identifier: GPL-3.0-only
// Behavioral recreations of Jared Tarbell's published Levitated descriptions.
// New Canvas implementation Copyright (C) 2026 Alex Vaos. See README.txt.
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function random(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
function ink(h, l = 45, p = 0) { return `hsl(${(h + p * 67) % 360},52%,${l}%)`; }
function line(ctx, points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineWidth = width; if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.stroke(); } }
function circle(ctx, x, y, r, color, fill = true) { ctx.beginPath(); ctx.arc(x, y, Math.max(.1, r), 0, TAU); if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.lineWidth = .6; ctx.strokeStyle = color; ctx.stroke(); } }
export const kineticSlugs = ['tentacles', 'bit-field', 'monkey-tree', 'oily-stratum', 'attractor-sets', 'rotational-transformation', 'gathering-line', 'riley-stack'];

export function createTentacles(seed = 1) {
  const rng = random(seed), creatures = []; let time = 0;
  function add(x, y) { if (creatures.length >= 14) creatures.shift(); const angle = rng() * TAU; creatures.push({ angle, phase: rng() * TAU, hue: 160 + rng() * 100, nodes: Array.from({ length: 27 }, (_, i) => ({ x: x - Math.cos(angle) * i * 4, y: y - Math.sin(angle) * i * 4 })) }); }
  function step(length = 4, speed = 1) {
    time += .08 * speed;
    for (const c of creatures) {
      const head = c.nodes[0]; c.angle += Math.sin(time * .23 + c.phase) * .025;
      if (head.x < 25 || head.x > 575 || head.y < 25 || head.y > 312) c.angle += Math.sin(Math.atan2(169 - head.y, 300 - head.x) - c.angle) * .15;
      head.x += Math.cos(c.angle) * speed * 1.8; head.y += Math.sin(c.angle) * speed * 1.8;
      for (let i = 1; i < c.nodes.length; i++) { const parent = c.nodes[i - 1], n = c.nodes[i], angle = Math.atan2(n.y - parent.y, n.x - parent.x) + (i === 1 ? Math.sin(time * 2 + c.phase) * .25 : 0); n.x = parent.x + Math.cos(angle) * length; n.y = parent.y + Math.sin(angle) * length; }
    }
  }
  for (let i = 0; i < 5; i++) add(120 + rng() * 360, 70 + rng() * 197);
  return { creatures, add, step };
}
function drawTentacles(ctx, model, palette) {
  for (const c of model.creatures) { line(ctx, c.nodes.map(n => [n.x, n.y]), ink(c.hue, 60, palette), .7); for (let i = 26; i >= 0; i--) { const n = c.nodes[i]; circle(ctx, n.x, n.y, .6 + (27 - i) * .16, ink(c.hue + i, 30 + i, palette)); } const h = c.nodes[0]; circle(ctx, h.x, h.y, 1.1, '#fff'); }
}
export function projectBit(point, angle, age = 0) {
  const x = point.x * Math.cos(angle) + point.z * Math.sin(angle), z = point.z * Math.cos(angle) - point.x * Math.sin(angle), perspective = 470 / (650 + z);
  return { x: 300 + x * perspective, y: 169 + (point.y - age) * perspective, scale: perspective, z };
}
function createBits(seed, count) { const rng = random(seed); return { age: 0, points: Array.from({ length: count }, () => ({ x: (rng() - .5) * 440, y: (rng() - .5) * 260, z: (rng() - .5) * 400, phase: rng() })) }; }
function drawBits(ctx, model, cursor, palette) {
  const points = model.points.map(p => { const age = (model.age * .002 + p.phase) % 1, lift = age < .2 ? (1 - age / .2) * 150 : age > .8 ? -(age - .8) / .2 * 150 : 0; return { ...projectBit(p, (cursor[0] - 300) / 300 * Math.PI, lift), alpha: Math.min(1, age * 8, (1 - age) * 8) }; }).sort((a, b) => b.z - a.z);
  for (const p of points) { ctx.globalAlpha = p.alpha; ctx.fillStyle = ink(205 + p.z * .08, 40, palette); const r = 1 + p.scale * 1.7; ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r); } ctx.globalAlpha = 1;
}

export function monkeySegments(seed = 1, depth = 5, aperture = .65) {
  const rng = random(seed), generator = [[0, 0], [.2, (rng() - .5) * aperture], [.5, -(rng() * .65 + .2) * aperture], [.8, (rng() - .5) * aperture], [1, 0]];
  let lines = [[[0, 0], [1, 0]]];
  for (let n = 0; n < depth; n++) { const next = []; for (const [a, b] of lines) { const dx = b[0] - a[0], dy = b[1] - a[1], points = generator.map(([x, y]) => [a[0] + dx * x - dy * y, a[1] + dy * x + dx * y]); for (let i = 1; i < points.length; i++) next.push([points[i - 1], points[i]]); } lines = next; }
  return { generator, lines };
}
function fit(points, padding = 25) { const xs = points.map(p => p[0]), ys = points.map(p => p[1]), minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), scale = Math.min((600 - padding * 2) / Math.max(.01, maxX - minX), (337 - padding * 2) / Math.max(.01, maxY - minY)); return ([x, y]) => [300 + (x - (minX + maxX) / 2) * scale, 169 + (y - (minY + maxY) / 2) * scale]; }
function drawMonkey(ctx, model, palette) { const project = fit(model.lines.flat()); ctx.beginPath(); for (const [a, b] of model.lines) { ctx.moveTo(...project(a)); ctx.lineTo(...project(b)); } ctx.strokeStyle = ink(265, 35, palette); ctx.lineWidth = .7; ctx.stroke(); }

export function oilValue(x, y, blobs) { return blobs.reduce((sum, b) => sum + b.r * b.r / Math.max(1, (x - b.x) ** 2 + (y - b.y) ** 2), 0); }
function createOil(seed) { const rng = random(seed); return { time: 0, phases: Array.from({ length: 7 }, () => rng() * TAU), blobs: [] }; }
function updateOil(model, cohesion, size, cursor) {
  const spread = 25 + (1 - cohesion) * 120 + Math.abs(cursor[0] - 300) * .12, radius = size * (.6 + cursor[1] / 337 * .8);
  model.blobs = model.phases.map((phase, i) => ({ x: 300 + Math.cos(model.time * (.7 + i * .03) + phase) * spread * 1.4, y: 169 + Math.sin(model.time + phase * 2) * spread * .65, r: radius * (.65 + i * .045) }));
}
function drawOil(ctx, model, palette) {
  const unit = 8, cols = 75, rows = 43, field = Array.from({ length: (cols + 1) * (rows + 1) }, (_, i) => oilValue(i % (cols + 1) * unit, Math.floor(i / (cols + 1)) * unit, model.blobs));
  for (const [layer, threshold] of [.85, 1.2, 1.9, 3.4].entries()) {
    ctx.beginPath();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const p = [[x * unit, y * unit, field[y * (cols + 1) + x]], [(x + 1) * unit, y * unit, field[y * (cols + 1) + x + 1]], [(x + 1) * unit, (y + 1) * unit, field[(y + 1) * (cols + 1) + x + 1]], [x * unit, (y + 1) * unit, field[(y + 1) * (cols + 1) + x]]];
      for (const triangle of [[p[0], p[1], p[2]], [p[0], p[2], p[3]]]) {
        const clipped = []; for (let i = 0; i < 3; i++) { const a = triangle[i], b = triangle[(i + 1) % 3], inside = a[2] >= threshold; if (inside) clipped.push(a); if (inside !== (b[2] >= threshold)) { const t = (threshold - a[2]) / (b[2] - a[2]); clipped.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
        if (clipped.length >= 3) { ctx.moveTo(clipped[0][0], clipped[0][1]); for (let i = 1; i < clipped.length; i++) ctx.lineTo(clipped[i][0], clipped[i][1]); ctx.closePath(); }
      }
    }
    ctx.fillStyle = ink(180 + layer * 25, 20 + layer * 15, palette); ctx.fill();
  }
}

export function createAttractors(seed = 1, count = 8) {
  const rng = random(seed), rings = Array.from({ length: count }, () => ({ x: 70 + rng() * 460, y: 55 + rng() * 227, angle: rng() * TAU, speed: (rng() - .5) * .025, values: Array.from({ length: 7 }, () => Math.floor(rng() * 5)) }));
  function step(strength = 1) {
    const forces = rings.map(() => [0, 0]);
    for (let i = 0; i < rings.length; i++) for (let j = i + 1; j < rings.length; j++) { const a = rings[i], b = rings[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy)), similarity = a.values.filter(v => b.values.includes(v)).length / 7, force = clamp((distance - (55 + (1 - similarity) * 95)) * .0007 * strength, -.4, .4); forces[i][0] += dx / distance * force; forces[i][1] += dy / distance * force; forces[j][0] -= dx / distance * force; forces[j][1] -= dy / distance * force; }
    rings.forEach((r, i) => { r.x = clamp(r.x + forces[i][0], 35, 565); r.y = clamp(r.y + forces[i][1], 35, 302); r.angle += r.speed; });
  }
  return { rings, step };
}
function drawAttractors(ctx, model, palette) {
  const dots = model.rings.flatMap(r => r.values.map((value, i) => ({ x: r.x + Math.cos(r.angle + i * TAU / 7) * 25, y: r.y + Math.sin(r.angle + i * TAU / 7) * 25, value })));
  for (let i = 0; i < dots.length; i++) { const a = dots[i]; for (let j = 0; j < i; j++) { const b = dots[j]; if (a.value === b.value && Math.hypot(a.x - b.x, a.y - b.y) < 110) { ctx.globalAlpha = .14; line(ctx, [[a.x, a.y], [b.x, b.y]], ink(a.value * 65, 45, palette), .5); } } }
  ctx.globalAlpha = 1; for (const r of model.rings) circle(ctx, r.x, r.y, 25, '#aab6b2', false); for (const p of dots) circle(ctx, p.x, p.y, 2.4, ink(p.value * 65, 42, palette));
}
export function rotationCircles(count = 180, angle = 137.5, time = 0) { let x = 0, y = 0, radius = 3; const circles = []; for (let i = 0; i < count; i++) { const theta = i * angle * Math.PI / 180 + time * (i / count); x += Math.cos(theta) * radius * .35; y += Math.sin(theta) * radius * .35; circles.push({ x, y, radius }); radius *= 1.02; } return circles; }
function drawRotation(ctx, model, angle, count, palette) { const circles = rotationCircles(count, angle, model.time), bound = Math.max(...circles.map(c => Math.max(Math.abs(c.x) + c.radius, Math.abs(c.y) + c.radius))), scale = 150 / bound; circles.forEach((c, i) => circle(ctx, 300 + c.x * scale, 169 + c.y * scale, c.radius * scale, ink(180 + i * 1.4, 42, palette), false)); }

export function createGathering(seed = 1) {
  const rng = random(seed), nodes = []; let time = 0;
  function step(grip = 90, pace = 2, cursor = null) {
    time += .018; const target = cursor ?? [300 + Math.cos(time * 1.7) * 180, 169 + Math.sin(time * 2.3) * 100];
    for (let i = 0; i < pace && nodes.length < 600; i++) nodes.push({ x: rng() * 600, y: rng() * 337, tx: target[0], ty: target[1], age: 0, settled: false, fall: 0 });
    for (const n of nodes) { if (!n.settled) { n.x += (n.tx - n.x) * .18; n.y += (n.ty - n.y) * .18; if (Math.hypot(n.tx - n.x, n.ty - n.y) < .3) n.settled = true; } else if (++n.age > grip) { n.fall += .025; n.y += n.fall; } }
    for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].age > grip + 90 || nodes[i].y > 370) nodes.splice(i, 1);
  }
  return { nodes, step };
}
function drawGathering(ctx, model, grip, palette) { for (const n of model.nodes) { ctx.globalAlpha = n.age > grip ? Math.max(0, 1 - (n.age - grip) / 90) : n.settled ? .9 : .35; circle(ctx, n.x, n.y, n.settled ? 1.3 : .6, ink(195 + n.tx * .1, 32, palette)); } ctx.globalAlpha = 1; }
function drawRiley(ctx, model, count, warp, cursor, palette) {
  const width = 540 / count, phase = model.phase + (cursor[0] - 300) / 300;
  for (let i = 0; i < count; i++) { const points = []; const edge = (y, side) => 30 + (i + side) * width + Math.sin(y / 337 * TAU * 2 + phase + i * .18) * width * warp * .85 + Math.sin(y / 337 * Math.PI) * (i - count / 2) * warp * .2; for (let y = 18; y <= 318; y += 3) points.push([edge(y, .1), y]); for (let y = 318; y >= 18; y -= 3) points.push([edge(y, .65), y]); line(ctx, points, ink(210 + i * 1.2, i % 3 === 0 ? 24 : 37, palette), 1, true); }
}

export function createKineticStudy(slug, seed, a, b) {
  if (!kineticSlugs.includes(slug)) throw new Error(`Unknown kinetic study: ${slug}`);
  let generation = seed, currentA = a, currentB = b, model, cursor = [300, 169], touched = false;
  function rebuild() { model = slug === 'tentacles' ? createTentacles(generation) : slug === 'bit-field' ? createBits(generation, Math.round(currentA)) : slug === 'monkey-tree' ? monkeySegments(generation, Math.round(currentA), currentB) : slug === 'oily-stratum' ? createOil(generation) : slug === 'attractor-sets' ? createAttractors(generation, Math.round(currentA)) : slug === 'gathering-line' ? createGathering(generation) : { time: random(generation)() * TAU, phase: random(generation)() * TAU }; if (slug === 'oily-stratum') updateOil(model, currentA, currentB, cursor); }
  function configure(a, b) { const changed = currentA !== a && ['bit-field', 'monkey-tree', 'attractor-sets'].includes(slug) || currentB !== b && slug === 'monkey-tree'; currentA = a; currentB = b; if (changed) rebuild(); if (slug === 'oily-stratum') updateOil(model, a, b, cursor); return changed; }
  function step(a, b) { configure(a, b); if (slug === 'tentacles') model.step(a, b); else if (slug === 'bit-field') model.age += b; else if (slug === 'oily-stratum') { model.time += .015; updateOil(model, a, b, cursor); } else if (slug === 'attractor-sets') model.step(b); else if (slug === 'rotational-transformation') model.time += .03; else if (slug === 'gathering-line') model.step(a, Math.round(b), touched ? cursor : null); else return false; return true; }
  function pointer(x, y) { cursor = [clamp(x, 0, 600), clamp(y, 0, 337)]; touched = true; if (slug === 'oily-stratum') updateOil(model, currentA, currentB, cursor); }
  function restart() { generation++; rebuild(); }
  function action() { if (slug === 'bit-field') return { a: Math.min(2000, currentA + 80) }; if (slug === 'tentacles') model.add(...cursor); else restart(); return null; }
  function click(x, y) { pointer(x, y); if (slug === 'bit-field') return action(); if (slug === 'tentacles') model.add(x, y); else if (slug !== 'oily-stratum' && slug !== 'gathering-line') restart(); }
  function draw(ctx, a, b, palette = 0) { if (slug === 'tentacles') drawTentacles(ctx, model, palette); else if (slug === 'bit-field') drawBits(ctx, model, cursor, palette); else if (slug === 'monkey-tree') drawMonkey(ctx, model, palette); else if (slug === 'oily-stratum') drawOil(ctx, model, palette); else if (slug === 'attractor-sets') drawAttractors(ctx, model, palette); else if (slug === 'rotational-transformation') drawRotation(ctx, model, a, Math.round(b), palette); else if (slug === 'gathering-line') drawGathering(ctx, model, a, palette); else drawRiley(ctx, model, Math.round(a), b, cursor, palette); }
  function status() { return slug === 'tentacles' ? `${model.creatures.length} swimmers · 27 nodes each` : slug === 'bit-field' ? `${model.points.length} particles · move horizontally to orbit` : slug === 'monkey-tree' ? `${model.lines.length} substituted segments` : slug === 'oily-stratum' ? '7 merging bodies · move to change cohesion and size' : slug === 'attractor-sets' ? `${model.rings.length} rings · shared colors attract` : slug === 'rotational-transformation' ? `${Math.round(currentB)} nested circles · scale ×1.02` : slug === 'gathering-line' ? `${model.nodes.length} gathering nodes · move to draw` : `${Math.round(currentA)} optical bands · move to bend`; }
  rebuild(); return { get data() { return model; }, configure, step, pointer, click, action, draw, status, warmup: slug === 'gathering-line' ? 160 : slug === 'tentacles' ? 25 : slug === 'attractor-sets' ? 100 : 0 };
}
