// SPDX-License-Identifier: GPL-3.0-only
// JavaScript adaptations of Levitated experiments. Additional studies: studies.js.
// Original algorithms Copyright (C) 2003 Jared Tarbell, levitated.net.
// Modern Canvas adaptation, 2026. See README.txt, original notices, COPYING.txt.
export const works = {
  'invader-fractal': { number: 16, name: 'Invader Fractal', description: 'A universe of 32,768 mirrored creatures, recursively fitting into one another’s space.', original: 'levInvaderFractal', hint: 'Click a creature to refill its region · ← → select · Space refill', a: ['Minimum size', 3, 24, 1, 5], b: ['Fill pace', 1, 30, 1, 8] },
  'iterative-ik': { number: 17, name: 'Iterative IK', description: 'Creatures of very little purpose. Connect a node, tug a limb, and let the structure wander.', original: 'levIterativeIK', hint: 'Click to add · Drag a node · Arrows to tug · Space pulse', a: ['Wander', 0, 2, .05, 1], b: ['Starting nodes', 24, 160, 1, 70] },
  'dla': { number: 18, name: 'Diffusion Limited Aggregation', description: 'Wandering particles find one another. A branching reef grows, one collision at a time.', original: 'levDLA', year: 2001, hint: 'Click to plant a sticky seed · Arrows move seed cursor · Space plant · P pause', action: 'Plant a seed', a: ['Stickiness', .1, 1, .05, 1], b: ['Growth pace', 1, 12, 1, 4] },
  'root-gardener': { number: 19, name: 'Root Gardener', description: 'Tend a recursive root system. Each click feeds a limb and, a little, its ancestors.', original: 'levRootGardener', hint: 'Click a limb tip to grow it · Arrows select · Space feed · P pause', action: 'Feed selected limb', a: ['Nourishment', 10, 60, 1, 40], b: ['Growth speed', .2, 3, .1, 1] },
  'ca-worm': { number: 20, name: 'Cellular Automata Worm', description: 'Thirty-two cells obey a tiny rule. Their successive generations twist into a growing organism.', original: 'levCAWorm', hint: 'Click for a new rule · ← → change rule · ↑ ↓ change twist · Space new rule', action: 'Random rule', a: ['Wolfram rule', 0, 255, 1, 114], b: ['Twist', 0, 16, .1, 10] },
  'deep-lorenz': { number: 21, name: 'Deep Lorenz', description: 'A strange attractor built from translucent rings. Never repeating, never settling down.', original: 'levLorenzDeep', originalPage: 'levDeepLorenz', hint: 'Drag or ← → to orbit · ↑ ↓ change trail · Space new trajectory · P pause', action: 'New trajectory', a: ['View angle', -3.14, 3.14, .01, .35], b: ['Trail length', 200, 2200, 100, 1200] },
  'orbiting-networks': { number: 22, name: 'Orbiting Networks', description: 'Build a constellation of orbiting nodes. Their connections become a moving drawing.', original: 'levOrbitingNetworks', year: 2002, background: '#080d19', hint: 'Press and hold to create a larger node · Move up/down to reverse orbits · Space add', action: 'Add a node', a: ['Orbit speed', .1, 2, .05, 1], b: ['Orbit reach', 25, 180, 1, 90] },
  'sea-thing': { number: 23, name: 'Sea Thing', description: 'Forty-two small bodies move as one. Free a segment and follow the creature it becomes.', original: 'levSeaThing', hint: 'Click a body to detach it · Arrows select · Space detach · Camera follows the freed body', action: 'Free selected body', a: ['Swimming speed', .1, 2, .05, 1], b: ['Turning', .5, 4, .1, 2] }
};
export function random(seed = 1) { let value = seed >>> 0; return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; }; }
export function invaderMask(seed) {
  const bits = (seed & 32767).toString(2).padStart(15, '0'), cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 5; y++) if (bits[y * 3 + x] === '1') { cells.push([x, y]); if (x) cells.push([-x, y]); }
  return cells;
}
export function createPacking(seed = 1, minimum = 5) {
  const rng = random(seed), items = [], queue = [{ x: 0, y: 0, w: 600, h: 337, depth: 0 }];
  function request(rect) { if (rect.w > minimum && rect.h > minimum && queue.length < 10000) queue.push(rect); }
  function step(count = 1) {
    for (let n = 0; n < count && queue.length && items.length < 6000; n++) {
      const r = queue.pop(), size = Math.min(r.w, r.h, Math.max(minimum, r.w * (.1 + rng() * .7)));
      const left = rng() < .5, top = rng() < .5, x = left ? r.x : r.x + r.w - size, y = top ? r.y : r.y + r.h - size;
      items.push({ x, y, size, seed: Math.floor(rng() * 32768), depth: r.depth });
      request({ x: left ? x + size : r.x, y, w: r.w - size, h: size, depth: r.depth + 1 });
      request({ x: r.x, y: top ? y + size : r.y, w: r.w, h: r.h - size, depth: r.depth + 1 });
    }
  }
  function refill(index) { const item = items[index]; if (!item) return; items.splice(index, 1); request({ x: item.x, y: item.y, w: item.size, h: item.size, depth: item.depth }); step(); }
  return { items, queue, step, refill };
}
export function createIK(seed = 1, count = 70) {
  const rng = random(seed), nodes = [];
  function add(x, y) {
    if (nodes.length >= 240) return -1;
    const node = { x, y, vx: 0, vy: 0, ax: 0, ay: 0, length: 15 + Math.floor(rng() * 25), radius: 1.4 + rng() * 2, parent: -1, children: [] };
    let nearest = -1, distance = 100;
    for (let i = 0; i < nodes.length; i++) { const d = Math.hypot(nodes[i].x - x, nodes[i].y - y); if (d < distance) { distance = d; nearest = i; } }
    const index = nodes.length; nodes.push(node);
    if (nearest >= 0) { nodes[nearest].children.push(index); node.parent = nearest; }
    return index;
  }
  function constrain(pinned = -1) {
    const seen = new Set();
    function visit(i) { if (seen.has(i)) return; seen.add(i); const a = nodes[i]; for (const child of a.children) { const b = nodes[child]; if (!b || seen.has(child)) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (child !== pinned) { const angle = d < 1e-9 ? child * 2.399963 : Math.atan2(dy, dx); b.x = a.x + Math.cos(angle) * a.length; b.y = a.y + Math.sin(angle) * a.length; } visit(child); } }
    nodes.forEach((n, i) => { if (n.parent < 0) visit(i); });
  }
  function step(wander = 1, pinned = -1) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]; if (i === pinned) { n.vx = n.vy = n.ax = n.ay = 0; continue; }
      if (rng() < (n.parent < 0 ? .2 : 1 / 15)) { n.ax += 2 * (rng() - rng()) * wander; n.ay += 2 * (rng() - rng()) * wander; }
      n.vx += n.ax; n.vy += n.ay;
      if (n.x < -10 || n.x > 610) n.vx -= (n.x - 300) / 50;
      if (n.y < -10 || n.y > 347) n.vy -= (n.y - 169) / 50;
      n.x += n.vx; n.y += n.vy; n.ax *= .8; n.ay *= .8; n.vx *= .82; n.vy *= .82;
    }
    constrain(pinned);
  }
  for (let i = 0; i < count; i++) add(20 + rng() * 560, 20 + rng() * 297);
  constrain();
  return { nodes, add, step, constrain, pulse(index = 0) { const n = nodes[index]; if (n) { n.ax += (rng() - .5) * 7; n.ay += (rng() - .5) * 7; } } };
}
export function drawPacking(ctx, packing, selected = -1, color = '#20231f') {
  ctx.fillStyle = color;
  packing.items.forEach((item, i) => {
    const unit = item.size / 7;
    for (const [x, y] of invaderMask(item.seed)) ctx.fillRect(item.x + (3 + x) * unit, item.y + (1 + y) * unit, unit, unit);
    if (i === selected) { ctx.strokeStyle = '#ff6138'; ctx.lineWidth = .7; ctx.strokeRect(item.x + .3, item.y + .3, item.size - .6, item.size - .6); }
  });
}
export function drawIK(ctx, field, selected = -1, color = '#181c24') {
  ctx.lineWidth = .55;
  field.nodes.forEach(a => { for (const id of a.children) { const b = field.nodes[id]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + (b.x - a.x) * .75, a.y + (b.y - a.y) * .75); ctx.strokeStyle = '#354caa77'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * .75, a.y + (b.y - a.y) * .75); ctx.lineTo(b.x, b.y); ctx.strokeStyle = '#b2bbd1'; ctx.stroke(); } });
  field.nodes.forEach((n, i) => { ctx.beginPath(); ctx.arc(n.x, n.y, n.radius + (i === selected ? 1.1 : 0), 0, Math.PI * 2); ctx.fillStyle = i === selected ? '#ff6138' : color; ctx.fill(); });
}
