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
  'sea-thing': { number: 23, name: 'Sea Thing', description: 'Forty-two small bodies move as one. Free a segment and follow the creature it becomes.', original: 'levSeaThing', hint: 'Click a body to detach it · Arrows select · Space detach · Camera follows the freed body', action: 'Free selected body', a: ['Swimming speed', .1, 2, .05, 1], b: ['Turning', .5, 4, .1, 2] },
  'box-fitting': { number: 24, name: 'Box Fitting', description: 'Squares expand until they meet. Empty space becomes a patchwork of warm color.', original: 'levBoxFitting', recreation: true, action: 'Start a new field', hint: 'Click an empty space to plant a box · Arrows adjust controls · Space start again', a: ['Search pace', 1, 8, 1, 4], b: ['Spacing', .5, 3, .25, 1] },
  'quarter-round': { number: 25, name: 'Quarter Round Mosaic', description: 'A field of quarter circles borrows its colors from its neighbors. Early choices travel outward.', original: 'levQuarterRound', recreation: true, action: 'New mosaic', hint: 'Click for a fresh mosaic · Arrows adjust the grid and fill pace · Space regenerate', a: ['Columns', 12, 42, 1, 27], b: ['Fill pace', 1, 32, 1, 8] },
  'seeds': { number: 26, name: 'Seeds', description: 'One angle, repeated. A sunflower emerges from the arithmetic of growth.', original: 'levSeeds', year: 2001, recreation: true, action: 'Reseed', hint: 'Change the angle slowly · Arrows adjust angle and seed count · Click or Space reseed', a: ['Divergence angle', 130, 145, .01, 137.5], b: ['Seed count', 200, 2000, 50, 900] },
  'golden-spiral': { number: 27, name: 'Golden Spiral', description: 'Triangles, squares, and pentagons repeat toward an unreachable center at the golden ratio.', original: 'levGoldenSpiral', year: 2001, recreation: true, action: 'Next polygon', hint: 'Scroll to zoom toward the center · Arrows adjust sides and zoom · Space next polygon', a: ['Polygon sides', 3, 5, 1, 4], b: ['Zoom', .5, 30, .1, 1] },
  'city-lines': { number: 28, name: 'City Lines', description: 'Ten drawing machines trace a city from a single restless line, then fade away.', original: 'levCityLines', recreation: true, action: 'Draw another city', hint: 'Adjust oscillation and drawing pace · Click or Space redraw · P pause', a: ['Oscillation', .3, 2, .05, 1], b: ['Drawing pace', 1, 8, 1, 2] },
  'triangulation': { number: 29, name: 'Triangulation', description: 'Every triangle contains three more. A few shared points become a web of recursive rays.', original: 'levTriangulation', recreation: true, action: 'New triangulation', hint: 'Change recursion depth and irregularity · Click or Space rebuild · P pause', a: ['Recursion depth', 1, 8, 1, 6], b: ['Irregularity', 0, 1, .05, .8] },
  'isoblocks': { number: 30, name: 'Isoblocks', description: 'An invisible walker builds a three-dimensional grid. Every return makes a cube grow.', original: 'levIsoblocks', recreation: true, action: 'New grid', hint: 'Adjust grid size and walk pace · Click or Space begin a new walk · P pause', a: ['Grid extent', 3, 9, 1, 6], b: ['Walk pace', 1, 12, 1, 4] },
  'mycelium': { number: 31, name: 'Mycelium', description: 'Colored colonies spread through a barren field, branching through circles and finding their limits.', original: 'levMyco', year: 2001, recreation: true, action: 'New colonies', hint: 'Click a dormant colony to revive it or empty ground to seed · Arrows adjust growth · Space restart', a: ['Branch size', 3, 16, 1, 8], b: ['Spores / second', 2, 40, 1, 22] },
  'tentacles': {"number": 32, "name": "Tentacles", "description": "Twenty-seven linked nodes become a swimming organism. Plant a new life form with a click.", "original": "levFlagellum", "year": 2003, "recreation": true, "action": "Add a swimmer", "hint": "Click or Space to add a swimmer · Arrows adjust length and speed · P pause", "a": ["Segment length", 2, 7, 0.25, 4], "b": ["Swim speed", 0.2, 2, 0.1, 1]},
  'bit-field': {"number": 33, "name": "Bit Field", "description": "A cloud of floating pixels levitates through a rotating three-dimensional field.", "original": "levBitField", "year": 2003, "recreation": true, "action": "More particles", "hint": "Move horizontally to rotate · Click or Space adds particles · Arrows adjust population and speed", "a": ["Population", 120, 800, 40, 360], "b": ["Levitation speed", 0.2, 2, 0.1, 1]},
  'monkey-tree': {"number": 34, "name": "Monkey Tree", "description": "A line becomes a shape, then every line becomes that same shape. Recursion reveals a hidden landscape.", "original": "levMonkeyTree", "year": 2003, "recreation": true, "action": "New generator", "hint": "Click or Space for a new generator · Arrows change depth and aperture", "a": ["Substitution depth", 1, 6, 1, 5], "b": ["Aperture", 0.1, 1, 0.05, 0.65]},
  'oily-stratum': {"number": 35, "name": "Oily Stratum", "description": "Liquid islands merge, split, and fold into concentric contours.", "original": "levOilyStratum", "year": 2003, "recreation": true, "action": "New fluid", "hint": "Move horizontally for cohesion, vertically for size · Touch and drag · Arrows tune the fluid", "a": ["Cohesion", 0, 1, 0.05, 0.55], "b": ["Body radius", 12, 44, 1, 27]},
  'attractor-sets': {"number": 36, "name": "Attractor Sets", "description": "Rotating rings seek their shared colors. A web of relationships quietly organizes itself.", "original": "levAttractorSets", "year": 2001, "recreation": true, "action": "New relationships", "hint": "Click or Space to shuffle relationships · Arrows adjust rings and attraction · P pause", "a": ["Ring count", 4, 16, 1, 8], "b": ["Attraction", 0.2, 3, 0.1, 1]},
  'rotational-transformation': {"number": 37, "name": "Rotational Transformation", "description": "Nested circles grow by two percent, turning a golden-angle spiral into a shifting vortex.", "original": "levRotationalT", "year": 2001, "recreation": true, "action": "New vortex", "hint": "Arrows change nesting angle and circle count · Click or Space rephase · P pause", "a": ["Nesting angle", 120, 160, 0.1, 137.5], "b": ["Circle count", 60, 220, 10, 180]},
  'gathering-line': {"number": 38, "name": "Gathering Line", "description": "Nodes rush toward a wandering point, cling to its drawing, then lose their grip and fall.", "original": "levGatheringLine", "year": 2003, "recreation": true, "action": "Clear drawing", "hint": "Move or drag to draw · Arrows adjust grip and population · Space clears · P pause", "a": ["Grip duration", 30, 180, 10, 90], "b": ["Nodes per tick", 1, 4, 1, 2]},
  'riley-stack': {"number": 39, "name": "Riley Stack", "description": "A stack of rhythmic bands bends into an optical field. Small shifts make the surface breathe.", "original": "levRileyStack", "year": 2003, "recreation": true, "action": "New arrangement", "hint": "Move horizontally to bend the field · Arrows adjust density and warp · Click or Space rearrange", "a": ["Band count", 8, 48, 1, 24], "b": ["Warp", 0, 2, 0.05, 1]},
  'ca-twist': {"number": 59, "name": "Cellular Automata Twist", "description": "Rule 110 wraps around a rotating cylinder. Sixteen bits become a living sculpture.", "original": "levCATwist", "year": 2002, "recreation": true, "action": "New rule and seed", "hint": "Move sideways to reverse rotation, vertically to tilt · Click or Space randomizes · Arrows change rule and twist", "a": ["Rule", 0, 255, 1, 110], "b": ["Twist per row", 0, 0.18, 0.005, 0.045], "background": "#080d19"},
  'trema-field': {"number": 60, "name": "Trema Field", "description": "Cut away the middle third. Repeat. A cloud of circular voids reveals the arithmetic of absence.", "original": "levTremaFieldWhite", "year": 2002, "recreation": true, "action": "New field", "hint": "Arrows change recursion and cut size · Click or Space regenerate · P pause", "a": ["Recursion depth", 6, 12, 1, 12], "b": ["Cut scale", 0.6, 1.8, 0.05, 1.1], "background": "#faf9f5"},
  'folding-pentagons': {"number": 61, "name": "Folding Pentagons", "description": "A shrinking chain folds around its own edges. Follow the red joints and find a way out.", "original": "levFoldingPentagons", "year": 2002, "recreation": true, "action": "Unfold chain", "hint": "Hover or tap a pentagon to change its attachment side · Space unfolds all · Arrows change links and shrink", "a": ["Pentagons", 8, 32, 1, 18], "b": ["Shrink ratio", 0.82, 0.96, 0.01, 0.9]},
  'double-helix': {"number": 62, "name": "Double Helix", "description": "Three beads make a rung. Two spirals turn together. Pull their geometry apart with a click.", "original": "levDoubleHelix", "year": 2002, "recreation": true, "action": "Expand / collapse all", "hint": "Click a bead to expand its rung · Move to tilt · Space toggles all · Arrows change rungs and turns", "a": ["Rungs", 12, 72, 1, 36], "b": ["Turns", 1, 6, 0.1, 3], "background": "#080d19"}

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
