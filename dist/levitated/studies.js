// SPDX-License-Identifier: GPL-3.0-only
// Canvas adaptations of Jared Tarbell's Levitated studies (2001–2003).
// Original FLA archives and notices are distributed alongside this file. See README.txt.
const TAU = Math.PI * 2, rad = d => d * Math.PI / 180;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function random(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
function line(ctx, points, color, width = 1, close = false, fill = false) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  if (close) ctx.closePath(); ctx.strokeStyle = color; ctx.lineWidth = width;
  if (fill) { ctx.fillStyle = color; ctx.fill(); } else ctx.stroke();
}
function circle(ctx, x, y, r, color, fill = true) { ctx.beginPath(); ctx.arc(x, y, Math.max(.1, r), 0, TAU); if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.stroke(); } }

export function createDLA(seed = 1) {
  const rng = random(seed), particles = [], walkers = [], buckets = new Map(), cell = 24, limit = 2400;
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  function attach(x, y, radius = 4, parent = -1, angle = 0) {
    if (particles.length >= limit) return -1;
    const id = particles.length; particles.push({ x, y, radius, parent, angle });
    const k = key(x, y); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(id); return id;
  }
  function seedAt(x, y) { return attach(clamp(x, 12, 588), clamp(y, 12, 325), 9); }
  function spawn() {
    const side = Math.floor(rng() * 4), x = side === 1 ? 5 : side === 3 ? 595 : 5 + rng() * 590, y = side === 0 ? 5 : side === 2 ? 332 : 5 + rng() * 327;
    return { x, y, vx: clamp((300 - x) / 20, -5, 5), vy: clamp((169 - y) / 15, -5, 5), angle: rng() * TAU, radius: 2 + rng() * 5, age: 0 };
  }
  function hit(x, y) {
    const bx = Math.floor(x / cell), by = Math.floor(y / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const id of buckets.get(`${bx + dx},${by + dy}`) ?? []) {
      const p = particles[id]; if ((p.x - x) ** 2 + (p.y - y) ** 2 <= p.radius ** 2) return id;
    }
    return -1;
  }
  function step(stickiness = 1, pace = 4) {
    for (let tick = 0; tick < Math.round(clamp(pace, 1, 12)) && particles.length < limit; tick++) for (let i = 0; i < walkers.length; i++) {
      const w = walkers[i]; w.vx = clamp(w.vx + (Math.floor(rng() * 7) - 3) / 5, -5, 5); w.vy = clamp(w.vy + (Math.floor(rng() * 7) - 3) / 5, -5, 5);
      w.x += w.vx; w.y += w.vy; w.angle += rad(1); w.age++;
      const rx = 15 * Math.cos(w.angle), ry = 15 * Math.sin(w.angle);
      let parent = -1;
      for (const [dx, dy] of [[-rx, -ry], [rx, -ry], [-rx, ry], [rx, ry]]) { parent = hit(w.x + dx, w.y + dy); if (parent >= 0) break; }
      if (parent >= 0 && rng() < stickiness && w.x >= 3 && w.x <= 597 && w.y >= 3 && w.y <= 334) { attach(w.x, w.y, w.radius, parent, w.angle); walkers[i] = spawn(); }
      else if (w.x < -10 || w.x > 610 || w.y < -10 || w.y > 347 || w.age > 1400) walkers[i] = spawn();
    }
  }
  seedAt(300, 169); for (let i = 0; i < 96; i++) walkers.push(spawn());
  return { particles, walkers, limit, step, seedAt };
}
export function drawDLA(ctx, model, color, cursor = null) {
  for (const p of model.particles) {
    if (p.parent >= 0) { const parent = model.particles[p.parent]; line(ctx, [[parent.x, parent.y], [p.x, p.y]], color, .8); }
    const points = Array.from({ length: 4 }, (_, i) => [p.x + Math.cos(p.angle + i * TAU / 4) * p.radius, p.y + Math.sin(p.angle + i * TAU / 4) * p.radius]);
    line(ctx, points, color, 1, true, true);
  }
  ctx.globalAlpha = .25; for (const w of model.walkers) circle(ctx, w.x, w.y, w.radius * .45, color); ctx.globalAlpha = 1;
  if (cursor) { circle(ctx, ...cursor, 10, '#b23f2b', false); }
}

export function createGarden(seed = 1) {
  const rng = random(seed), nodes = [], limit = 360;
  function add(parent, core, angle, depth, auto = true) {
    if (nodes.length >= limit) return -1;
    nodes.push({ parent, core: 0, from: 0, target: core, angle, fromAngle: angle, targetAngle: angle, phase: 0, depth, children: [], auto, wait: 25 + rng() * 20 });
    const id = nodes.length - 1; if (parent >= 0) nodes[parent].children.push(id); return id;
  }
  function branch(id, count = 1) {
    const n = nodes[id]; if (!n || n.depth >= 6) return;
    for (let i = 0; i < count && n.children.length < 4; i++) add(id, n.target * (.4 + rng() * .49), Math.floor(rng() * 121) - 60, n.depth + 1);
  }
  function target(id, core, angle) { const n = nodes[id]; n.from = n.core; n.fromAngle = n.angle; n.target = n.parent < 0 ? Math.min(core, 125) : Math.min(core, 73); n.targetAngle = angle; n.phase = 0; }
  function grow(id, strength = 40) {
    const n = nodes[id]; if (!n || n.phase < 1) return false;
    const requested = n.core + strength; target(id, requested, n.angle + Math.floor(rng() * 31) - 15);
    if (requested > 73 && n.parent >= 0) branch(id);
    let parent = n.parent, amount = 2.5;
    while (parent >= 0 && amount > .1) { const p = nodes[parent]; target(parent, p.target + amount, p.targetAngle); parent = p.parent; amount *= .5; }
    return true;
  }
  function step(speed = 1) {
    for (const n of nodes.slice()) {
      n.phase = Math.min(1, n.phase + clamp(speed, .2, 3) / 20);
      // The source uses a bundled easing function; this port uses smoothstep interpolation.
      const e = n.phase * n.phase * (3 - 2 * n.phase); n.core = n.from + (n.target - n.from) * e; n.angle = n.fromAngle + (n.targetAngle - n.fromAngle) * e;
      if (n.auto && n.phase === 1) { n.wait -= speed; if (n.wait <= 0) { n.auto = false; if (n.core > 20 && n.depth < 4) branch(nodes.indexOf(n), 1 + Math.floor(rng() * 4)); } }
    }
  }
  function poses() {
    const result = [];
    for (const n of nodes) {
      const p = n.parent < 0 ? { x: 300, y: 316, angle: 0, scale: 1 } : result[n.parent];
      const angle = p.angle + rad(n.angle), scale = p.scale * n.core / 100, length = 120 * scale;
      result.push({ x: p.x + Math.sin(angle) * length, y: p.y - Math.cos(angle) * length, fromX: p.x, fromY: p.y, angle, scale });
    }
    // Keep the root system in the drawing field as nourishment changes its extent.
    const xs = result.flatMap(p => [p.x, p.fromX]), ys = result.flatMap(p => [p.y, p.fromY]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const framing = Math.min(1, 548 / Math.max(1, maxX - minX), 285 / Math.max(1, maxY - minY));
    const offsetX = 300 - (minX + maxX) / 2 * framing, offsetY = 312 - maxY * framing;
    return result.map(p => ({ ...p, x: p.x * framing + offsetX, y: p.y * framing + offsetY, fromX: p.fromX * framing + offsetX, fromY: p.fromY * framing + offsetY, scale: p.scale * framing }));
  }
  add(-1, 100, 0, 0); return { nodes, limit, step, grow, poses };
}
export function drawGarden(ctx, model, selected, color) {
  model.poses().forEach((p, i) => {
    const n = model.nodes[i], ink = i === selected ? '#b23f2b' : color;
    line(ctx, [[p.fromX, p.fromY], [p.x, p.y]], ink, Math.max(.6, p.scale * 7));
    const side = 4 + p.scale * 7, dx = Math.cos(p.angle) * side, dy = Math.sin(p.angle) * side;
    line(ctx, [[p.x - dx, p.y - dy], [p.x, p.y - 3], [p.x + dx, p.y + dy]], ink, .7);
    circle(ctx, p.x, p.y, n.children.length ? 1.8 : 2.6, ink, !n.children.length);
    if (i === selected) circle(ctx, p.x, p.y, 7, ink, false);
  });
}

export function nextCARow(bits, rule) {
  let next = 0;
  for (let i = 0; i < 32; i++) { const lower = (bits >>> ((i + 31) % 32)) & 1, center = (bits >>> i) & 1, upper = (bits >>> ((i + 1) % 32)) & 1; if ((rule >>> ((upper << 2) | (center << 1) | lower)) & 1) next = (next | (1 << i)) >>> 0; }
  return next >>> 0;
}
export function createWorm(seed = 1, rule = 114) {
  const rng = random(seed), rows = []; let bits = Math.floor(rng() * 4294967296) >>> 0, depth = 0, t = 0, x = 0, y = 0, angle = 0;
  function step(twist = 10) {
    if (depth >= 3000 || rows.length >= 320) return;
    const oldAngle = rad(angle), omega = twist - rows.length * .01;
    x -= 20 * Math.sin(oldAngle); y += 20 * Math.cos(oldAngle); angle += omega * Math.sin(t); t += .1 + depth / 50000;
    rows.push({ bits, x, y, angle: rad(angle), scale: (rows.length + 1) / 100 });
    let population = 0, n = bits; while (n) { n &= n - 1; population++; }
    depth += 1 + population; bits = nextCARow(bits, rule);
  }
  return { rows, rule, step, get depth() { return depth; } };
}
export function wormCells(model) {
  const cells = [];
  for (const row of model.rows) for (let i = 0; i < 32; i++) if ((row.bits >>> i) & 1) {
    const c = Math.cos(row.angle), s = Math.sin(row.angle), local = (32 - i) * 10 * row.scale;
    cells.push({ x: row.x + c * local, y: row.y + s * local, size: Math.max(.3, row.scale * 8), angle: row.angle });
  }
  return cells;
}
export function drawWorm(ctx, model, color) {
  const cells = wormCells(model); if (!cells.length) return;
  const minX = Math.min(...cells.map(p => p.x - p.size)), maxX = Math.max(...cells.map(p => p.x + p.size)), minY = Math.min(...cells.map(p => p.y - p.size)), maxY = Math.max(...cells.map(p => p.y + p.size));
  const scale = Math.min(550 / Math.max(1, maxX - minX), 295 / Math.max(1, maxY - minY));
  for (const p of cells) { const x = 300 + (p.x - (minX + maxX) / 2) * scale, y = 169 + (p.y - (minY + maxY) / 2) * scale, r = Math.max(.3, p.size * scale / 2); line(ctx, Array.from({ length: 4 }, (_, i) => [x + Math.cos(p.angle + Math.PI / 4 + i * TAU / 4) * r, y + Math.sin(p.angle + Math.PI / 4 + i * TAU / 4) * r]), color, .5, true, true); }
}

export function lorenzStep([x, y, z]) { return [x + .01 * 10 * (y - x), y + .01 * (x * (28 - z) - y), z + .01 * (x * y - 8 / 3 * z)]; }
export function createLorenz(seed = 1) {
  const rng = random(seed), points = []; let current = [(rng() * 50 - 25) / 2, 1, rng() * 25];
  function step(limit = 1200) { for (let n = 0; n < 12; n++) { current = lorenzStep(current); points.push(current); } if (points.length > limit) points.splice(0, points.length - limit); }
  return { points, step };
}
export function drawLorenz(ctx, model, angle, color) {
  const c = Math.cos(angle), s = Math.sin(angle); ctx.lineWidth = .4;
  model.points.forEach(([x, y, z], i) => { const px = y * c - (z - 25) * s, depth = y * s + (z - 25) * c; ctx.globalAlpha = .06 + .38 * i / Math.max(1, model.points.length); circle(ctx, 300 + px * 7.2, 169 + x * 6.5, Math.max(.5, (z * .09) * (1 + depth / 140)), color, false); });
  ctx.globalAlpha = 1;
}

export function createOrbits(seed = 1) {
  const rng = random(seed), nodes = [], limit = 140;
  function add(x, y, size = 7, reach = 90) {
    if (nodes.length >= limit) return -1;
    let parent = -1; for (let i = 0; i < nodes.length; i++) if (Math.hypot(nodes[i].x - x, nodes[i].y - y) < Math.min(250, reach + size * 3)) { parent = i; break; }
    const p = nodes[parent], radius = p ? Math.hypot(p.x - x, p.y - y) : 0;
    nodes.push({ x, y, parent, radius, size: clamp(size, 2, 24), angle: p ? Math.atan2(y - p.y, x - p.x) : 0, speed: rad((10 + Math.floor(rng() * 90)) / 25) * (rng() < .5 ? -1 : 1) }); return nodes.length - 1;
  }
  function step(speed = 1, pointerY = 140) { const modulation = (169 - pointerY) / 50; for (const n of nodes) if (n.parent >= 0) { n.angle += n.speed * speed * modulation; const p = nodes[n.parent]; n.x = p.x + Math.cos(n.angle) * n.radius; n.y = p.y + Math.sin(n.angle) * n.radius; } }
  for (let i = 0; i < 6; i++) add(270 + i * 10, 150 + rng() * 40, 2 + Math.floor(rng() * 10));
  return { nodes, limit, add, step };
}
export function drawOrbits(ctx, model, selected = -1) {
  ctx.lineWidth = .6;
  for (const n of model.nodes) if (n.parent >= 0) { const p = model.nodes[n.parent]; ctx.globalAlpha = .22; circle(ctx, p.x, p.y, n.radius, '#9bb7df', false); line(ctx, [[n.x, n.y], [p.x, p.y]], '#c1d2f6', .5); }
  ctx.globalAlpha = 1;
  model.nodes.forEach((n, i) => { circle(ctx, n.x, n.y, n.size, i === selected ? '#ffb685' : '#b9d3f5', false); circle(ctx, n.x, n.y, 1.5, '#edf6ff'); });
}

export function createSeaThing(seed = 1, count = 42) {
  const rng = random(seed), nodes = Array.from({ length: count }, (_, i) => ({ x: i * 10, y: 0, theta: 0, turn: 0, parent: i - 1, radius: 11 - 9 * i / count }));
  const camera = { x: 110, y: 169 }; let focus = 0, time = 0;
  function detach(id) { if (!nodes[id]) return; nodes[id].parent = -1; focus = id; }
  function step(speed = 1, maxTurn = 2) {
    time++;
    for (const n of nodes) { const p = nodes[n.parent]; n.turn = p ? clamp((p.theta - n.theta) / 20, -maxTurn, maxTurn) : clamp(n.turn + (Math.floor(rng() * 101) - 50) / 150, -maxTurn, maxTurn); n.theta += n.turn; n.x -= speed * Math.cos(rad(n.theta)); n.y -= speed * Math.sin(rad(n.theta)); }
    camera.x += (300 - nodes[focus].x - camera.x) / 200; camera.y += (169 - nodes[focus].y - camera.y) / 200;
  }
  return { nodes, camera, step, detach, get time() { return time; }, get focus() { return focus; } };
}
export function drawSeaThing(ctx, model, selected, color) {
  const { x, y } = model.camera;
  model.nodes.forEach((n, i) => {
    const p = model.nodes[n.parent]; if (p) line(ctx, [[n.x + x, n.y + y], [p.x + x, p.y + y]], '#6c85aa', Math.max(.5, n.radius / 5));
    const r = n.radius * (1 + .14 * Math.sin(model.time * .08 + i * .4));
    circle(ctx, n.x + x, n.y + y, r, i === selected ? '#b23f2b' : color, false);
    circle(ctx, n.x + x + Math.cos(rad(n.theta)) * r * .45, n.y + y + Math.sin(rad(n.theta)) * r * .45, Math.max(.6, r * .2), color);
    if (i === selected) circle(ctx, n.x + x, n.y + y, r + 4, '#b23f2b', false);
  });
}
