// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Exact constant-gravity flight segments with collision-time resolution.
export const dropGravities = [{ name: 'Earth', g: 9.81 }, { name: 'Moon', g: 1.62 }, { name: 'Mars', g: 3.71 }, { name: 'Jupiter', g: 24.79 }, { name: 'Zero gravity', g: 0 }];
export function dropGravityName(g) { return dropGravities.find(p => Math.abs(p.g - g) < .005)?.name ?? 'Custom gravity'; }
export function createBallDrop(gravity = 9.81, rebound = .75, releaseHeight = 6) {
  if (![gravity, rebound, releaseHeight].every(Number.isFinite) || gravity < 0 || rebound < 0 || rebound > 1 || releaseHeight < 0) throw new Error('Invalid ball-drop parameters');
  let height = releaseHeight, velocity = 0, time = 0, bounces = 0, resting = releaseHeight === 0, steps = 0, lastImpact = null;
  const trail = [{ time: 0, height }], firstImpact = gravity > 0 ? Math.sqrt(2 * releaseHeight / gravity) : null;
  function step(dt = 1 / 30) {
    if (!Number.isFinite(dt) || dt < 0 || dt > 1) throw new Error('Ball-drop step must be between 0 and 1 second');
    if (resting || gravity === 0 || dt === 0) return false;
    let remaining = dt, elapsed = 0;
    while (remaining > 1e-12 && !resting) {
      const root = Math.sqrt(velocity * velocity + 2 * gravity * height);
      const impactTime = height > 0 && velocity <= 0 ? 2 * height / (root - velocity) : (velocity + root) / gravity;
      if (impactTime > remaining) { height += velocity * remaining - gravity * remaining * remaining / 2; velocity -= gravity * remaining; elapsed += remaining; remaining = 0; }
      else {
        const incoming = velocity - gravity * impactTime; elapsed += impactTime; remaining -= impactTime; height = 0; velocity = -rebound * incoming; bounces++;
        lastImpact = { time: time + elapsed, incoming, outgoing: velocity }; trail.push({ time: time + elapsed, height: 0 });
        // Resolve the finite-time accumulation of tiny inelastic rebounds as rest.
        if (velocity < .015) { velocity = 0; resting = true; }
      }
    }
    height = Math.max(0, height); time += dt; steps++; trail.push({ time, height }); while (trail.length > 601) trail.shift(); return true;
  }
  return { gravity, rebound, releaseHeight, firstImpact, step, trail, get height() { return height; }, get velocity() { return velocity; }, get time() { return time; }, get bounces() { return bounces; }, get resting() { return resting; }, get steps() { return steps; }, get lastImpact() { return lastImpact; }, get energy() { return gravity * height + velocity * velocity / 2; } };
}
export function ballDropLayout(width, height, releaseHeight = 6) {
  const floor = height * .59, top = height * .15, ceiling = Math.max(10, releaseHeight);
  return { x: width * .5, floor, top, ceiling, scale: (floor - top) / ceiling, radius: Math.max(7, Math.min(width, height) * .022) };
}
export function createBallDropScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable'); let model, stamp = '';
  function prepare(s) { const key = `${s.a}:${s.b}:${s.c}:${s.seed}`; if (stamp !== key) { model = createBallDrop(s.a, s.b, s.c); stamp = key; } }
  function step(s) { prepare(s); return model.step(s.d / 30); }
  function replay(s) { stamp = ''; prepare(s); }
  function special(s) { const i = dropGravities.findIndex(p => Math.abs(p.g - s.a) < .005); s.a = dropGravities[(i + 1) % dropGravities.length].g; replay(s); }
  function plant(s, px, py) { const l = ballDropLayout(canvas.width, canvas.height, s.c); s.c = Math.max(.25, Math.min(20, Math.round((l.floor - py - l.radius) / l.scale * 4) / 4)); replay(s); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), l = ballDropLayout(W, H, s.c), hue = 190 + s.palette * 65;
    ctx.fillStyle = '#080d19'; ctx.fillRect(0, 0, W, H);
    function path(points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); } }
    function disc(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
    const floorPoint = (x, z) => [l.x + (x - z) * unit * .065, l.floor + (x + z) * unit * .019];
    path([floorPoint(-3, -3), floorPoint(3, -3), floorPoint(3, 3), floorPoint(-3, 3)], '#112333', 1, true);
    for (let i = -3; i <= 3; i++) { path([floorPoint(i, -3), floorPoint(i, 3)], '#254653', .6); path([floorPoint(-3, i), floorPoint(3, i)], '#254653', .6); }
    // A perspective floor and layered sphere give depth without changing the 1-D model.
    for (let layer = 5; layer >= 1; layer--) { ctx.globalAlpha = .02 + .04 * (1 - model.height / l.ceiling); const ring = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return [l.x + Math.cos(a) * (l.radius * 1.2 + layer * 2), l.floor + Math.sin(a) * (l.radius * .25 + layer * .4)]; }); path(ring, '#7dccdf', 1, true); } ctx.globalAlpha = 1;
    const axis = W * .24; path([[axis, l.top], [axis, l.floor]], '#385360');
    const tickStep = l.ceiling > 10 ? 2 : 1;
    for (let h = 0; h <= l.ceiling; h += tickStep) { const y = l.floor - h * l.scale; path([[axis - 4, y], [axis + 4, y]], '#7397a1'); ctx.fillStyle = '#9db7c1'; ctx.font = `${Math.max(10, unit / 55)}px ui-monospace,monospace`; ctx.textAlign = 'right'; ctx.fillText(String(h), axis - 10, y + 4); }
    const y = l.floor - model.height * l.scale - l.radius;
    ctx.globalAlpha = .3; path([[axis + 6, y + l.radius], [l.x - l.radius * 1.8, y + l.radius]], '#8ed8e3', .7); ctx.globalAlpha = 1;
    for (let i = 0; i < model.trail.length; i += 5) { ctx.globalAlpha = .04 + .12 * i / model.trail.length; disc(l.x, l.floor - model.trail[i].height * l.scale - l.radius, l.radius * .24, `hsl(${hue},90%,80%)`); } ctx.globalAlpha = 1;
    for (let layer = 0; layer < 24; layer++) { const f = layer / 24; disc(l.x - l.radius * f * .29, y - l.radius * f * .33, l.radius * (1 - f * .92), `hsl(${hue},${70 + f * 15}%,${23 + f * 62}%)`); }
    disc(l.x - l.radius * .36, y - l.radius * .4, l.radius * .12, '#efffff');
    // Recent height history, with impact points retained exactly on the baseline.
    const chart = { x: W * .65, y: H * .2, w: W * .25, h: H * .28 }, span = Math.max(4, model.time), start = Math.max(0, model.time - 12);
    path([[chart.x, chart.y], [chart.x, chart.y + chart.h], [chart.x + chart.w, chart.y + chart.h]], '#335361');
    const points = model.trail.filter(p => p.time >= start).map(p => [chart.x + (p.time - start) / Math.min(12, span) * chart.w, chart.y + chart.h * (1 - p.height / l.ceiling)]); if (points.length > 1) path(points, `hsl(${hue},85%,70%)`, Math.max(1, unit / 450));
    return `${dropGravityName(s.a)} · ${model.height.toFixed(2)} m · ${model.velocity.toFixed(2)} m/s · ${model.bounces} rebounds · ${model.time.toFixed(2)} s${model.resting ? ' · at rest' : s.a === 0 ? ' · suspended' : ''}`;
  }
  return { prepare, step, special, plant, replay, draw, get data() { return model; } };
}
