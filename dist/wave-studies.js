// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Original implementations; equations and model limitations: math-notes.txt.
const PI = Math.PI, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function random(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }

// Coordinates cover the unit square; m/n count cosine half-waves.
export function chladniField(x, y, m, n, mix) {
  const a = m * PI, b = n * PI;
  return { value: Math.cos(a * x) * Math.cos(b * y) + mix * Math.cos(b * x) * Math.cos(a * y),
    dx: -a * Math.sin(a * x) * Math.cos(b * y) - mix * b * Math.sin(b * x) * Math.cos(a * y),
    dy: -b * Math.cos(a * x) * Math.sin(b * y) - mix * a * Math.cos(b * x) * Math.sin(a * y) };
}
export function chladniContours(m, n, mix, resolution = Math.max(128, 16 * Math.max(m, n))) {
  if (m === n && Math.abs(mix + 1) < 1e-12) return [];
  // A separable product has exact straight nodes, including their crossings.
  if (m === n || mix === 0) return [
    ...Array.from({ length: m }, (_, i) => [[(i + .5) / m, 0], [(i + .5) / m, 1]]),
    ...Array.from({ length: n }, (_, i) => [[0, (i + .5) / n], [1, (i + .5) / n]])
  ];
  const segments = [], stride = resolution + 1, values = new Float64Array(stride * stride);
  for (let j = 0; j <= resolution; j++) for (let i = 0; i <= resolution; i++) {
    const value = chladniField(i / resolution, j / resolution, m, n, mix).value;
    values[j * stride + i] = Math.abs(value) < 1e-12 ? 1e-12 : value;
  }
  // Marching triangles avoids the ambiguous four-edge saddle of square cells.
  function triangle(points, field) {
    const hits = [];
    for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; if ((field[i] < 0) === (field[j] < 0)) continue;
      const t = field[i] / (field[i] - field[j]); hits.push(points[i].map((v, axis) => v + t * (points[j][axis] - v)));
    }
    if (hits.length === 2 && Math.hypot(hits[0][0] - hits[1][0], hits[0][1] - hits[1][1]) > 1e-10) segments.push(hits);
  }
  for (let j = 0; j < resolution; j++) for (let i = 0; i < resolution; i++) {
    const p = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(p => p.map(v => v / resolution));
    const v = [values[j * stride + i], values[j * stride + i + 1], values[(j + 1) * stride + i + 1], values[(j + 1) * stride + i]];
    for (const ids of [[0, 1, 2], [0, 2, 3]]) triangle(ids.map(k => p[k]), ids.map(k => v[k]));
  }
  return segments;
}
export function createChladni(m, n, mix, count, seed = 1) {
  const rng = random(seed), particles = Array.from({ length: clamp(Math.round(count), 500, 6000) }, () => [rng(), rng()]);
  const model = { particles, segments: chladniContours(m, n, mix), cancelled: m === n && Math.abs(mix + 1) < 1e-12, steps: 0 };
  // A geometric relaxation toward u=0, not a mechanical sand/plate solver.
  function relax() {
    if (model.cancelled) return;
    for (const p of particles) {
      const f = chladniField(...p, m, n, mix), norm = f.dx ** 2 + f.dy ** 2;
      if (norm < 1e-10) { p[0] = clamp(p[0] + (rng() - .5) * .008, 0, 1); p[1] = clamp(p[1] + (rng() - .5) * .008, 0, 1); continue; }
      const factor = Math.min(.65, .024 * Math.sqrt(norm) / Math.max(1e-12, Math.abs(f.value))) * f.value / norm;
      p[0] = clamp(p[0] - factor * f.dx, 0, 1); p[1] = clamp(p[1] - factor * f.dy, 0, 1);
    }
  }
  model.step = () => { relax(); model.steps++; };
  model.stir = (x, y) => { for (const p of particles) if (Math.hypot(p[0] - x, p[1] - y) < .16) { const a = rng() * 2 * PI, r = .16 * Math.sqrt(rng()); p[0] = clamp(x + Math.cos(a) * r, 0, 1); p[1] = clamp(y + Math.sin(a) * r, 0, 1); } };
  // Form a static preview even when reduced motion starts the scene paused.
  for (let i = 0; i < 24; i++) relax();
  return model;
}
export function chladniLayout(width, height) {
  const side = Math.min(width * .78, height * (height > width ? .37 : .67));
  return { side, x: (width - side) / 2, y: height * (height > width ? .25 : .41) - side / 2 };
}

// Exact scalar solution of q'' + 2 gamma q' + lambda q = 0.
export function dampedMode(q0, v0, lambda, gamma, time) {
  const delta = lambda - gamma * gamma;
  if (Math.abs(delta) < 1e-10) { const b = v0 + gamma * q0, decay = Math.exp(-gamma * time); return [decay * (q0 + b * time), decay * (v0 - gamma * b * time)]; }
  if (delta > 0) { const w = Math.sqrt(delta), c = Math.cos(w * time), s = Math.sin(w * time), decay = Math.exp(-gamma * time); return [decay * (q0 * c + (v0 + gamma * q0) / w * s), decay * (v0 * c - (gamma * v0 + lambda * q0) / w * s)]; }
  const h = Math.sqrt(-delta), r1 = -gamma + h, r2 = -gamma - h, a = (v0 - r2 * q0) / (r1 - r2), b = q0 - a, e1 = Math.exp(r1 * time), e2 = Math.exp(r2 * time);
  return [a * e1 + b * e2, r1 * a * e1 + r2 * b * e2];
}
export function coupledSample(time, coupling, damping, stiffness, amplitude, release = 0) {
  const x0 = amplitude, y0 = release === 1 ? amplitude : release === 2 ? -amplitude : 0;
  const [p, vp] = dampedMode((x0 + y0) / 2, 0, stiffness, damping, time), [q, vq] = dampedMode((x0 - y0) / 2, 0, stiffness + 2 * coupling, damping, time);
  const x = p + q, y = p - q, vx = vp + vq, vy = vp - vq, shared = .25 * coupling * (x - y) ** 2;
  const energy1 = .5 * (vx ** 2 + stiffness * x ** 2) + shared, energy2 = .5 * (vy ** 2 + stiffness * y ** 2) + shared;
  return { x, y, vx, vy, energy1, energy2, energy: energy1 + energy2 };
}
const releases = ['One mass', 'In phase', 'Opposite'];
export function coupledLayout(width, height) { return { x: width / 2, y: height * (height > width ? .24 : .32), scale: Math.min(width * .135, height * .15) }; }
function painter(ctx) {
  return {
    path(points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); } },
    disc(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); ctx.fillStyle = color; ctx.fill(); }
  };
}
export function createWaveStudy(canvas, slug) {
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable');
  const { path, disc } = painter(ctx), sand = slug === 'chladni-study'; let model, stamp = '', view = 0, release = 0;
  function prepare(s) {
    const key = [s.a, s.b, s.c, s.d, s.seed, release].join(':'); if (key === stamp) return; stamp = key;
    if (sand) { model = createChladni(Math.round(s.a), Math.round(s.b), s.c, s.d, s.seed); model.view = view ? 'Nodal lines' : 'Sand'; }
    else { model = { time: 0, steps: 0, release: releases[release], sample: coupledSample(0, s.a, s.b, s.c, s.d, release) }; model.initialEnergy = model.sample.energy; }
  }
  function step(s) { prepare(s); if (sand) { if (!view) model.step(); return !view && !model.cancelled; } model.time += 1 / 30; model.steps++; model.sample = coupledSample(model.time, s.a, s.b, s.c, s.d, release); return true; }
  function special(s) { if (sand) { view = 1 - view; if (model) model.view = view ? 'Nodal lines' : 'Sand'; } else { release = (release + 1) % releases.length; } prepare(s); }
  function plant(s, px, py) { prepare(s); if (sand) { const l = chladniLayout(canvas.width, canvas.height), x = (px - l.x) / l.side, y = (py - l.y) / l.side; if (x >= 0 && x <= 1 && y >= 0 && y <= 1) model.stir(x, y); } else { const l = coupledLayout(canvas.width, canvas.height); s.d = Math.round(clamp(((px - l.x) / l.scale + 1.2) / .7, -1, 1) * 100) / 100; prepare(s); } }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), hue = 180 + s.palette * 55;
    ctx.fillStyle = '#080d19'; ctx.fillRect(0, 0, W, H);
    if (sand) {
      const l = chladniLayout(W, H), to = p => [l.x + p[0] * l.side, l.y + p[1] * l.side];
      ctx.fillStyle = '#111c2b'; ctx.fillRect(l.x, l.y, l.side, l.side);
      path([[l.x, l.y], [l.x + l.side, l.y], [l.x + l.side, l.y + l.side], [l.x, l.y + l.side], [l.x, l.y]], '#537080', Math.max(1, unit / 700));
      ctx.beginPath(); for (const segment of model.segments) { ctx.moveTo(...to(segment[0])); ctx.lineTo(...to(segment[1])); }
      ctx.strokeStyle = `hsla(${hue},80%,72%,${view ? .95 : .16})`; ctx.lineWidth = Math.max(.7, unit / (view ? 450 : 700)); ctx.stroke();
      if (!view) { ctx.fillStyle = `hsl(${hue + 20},80%,78%)`; const size = Math.max(.8, l.side / 400); for (const p of model.particles) { const [x, y] = to(p); ctx.fillRect(x - size / 2, y - size / 2, size, size); } }
      // Corner fasteners distinguish the finite plate from an infinite field.
      for (const x of [.025, .975]) for (const y of [.025, .975]) disc(...to([x, y]), Math.max(1.1, l.side * .005), '#81939e');
      return `${view ? 'Nodal lines' : 'Sand'} · m ${Math.round(s.a)}, n ${Math.round(s.b)} · ${model.cancelled ? 'Complete cancellation: every point is nodal' : model.particles.length + ' grains · idealized cosine field'}`;
    }
    const l = coupledLayout(W, H), p = model.sample, left = l.x - l.scale * 3.1, right = l.x + l.scale * 3.1, r = l.scale * .23;
    const x = l.x + l.scale * (-1.2 + .7 * p.x), y = l.x + l.scale * (1.2 + .7 * p.y), colors = [`hsl(${hue},85%,72%)`, `hsl(${hue + 135},85%,72%)`];
    function spring(a, b, color, width) { const points = [[a, l.y], [a + (b - a) * .08, l.y]]; for (let i = 0; i <= 20; i++) points.push([a + (b - a) * (.12 + .76 * i / 20), l.y + (i === 0 || i === 20 ? 0 : (i % 2 ? 1 : -1) * l.scale * .075)]); points.push([b, l.y]); path(points, color, width); }
    path([[left, l.y + l.scale * .42], [right, l.y + l.scale * .42]], '#294456');
    for (const a of [left, right]) { path([[a, l.y - l.scale * .45], [a, l.y + l.scale * .45]], '#758c99', 3); for (let i = -3; i <= 3; i++) path([[a - l.scale * .11, l.y + i * l.scale * .12], [a, l.y + (i + .8) * l.scale * .12]], '#42596b'); }
    spring(left, x - r, colors[0], 1.5); spring(x + r, y - r, s.a === 0 ? '#28394a' : '#ac93dd', s.a === 0 ? .5 : 1 + Math.sqrt(s.a)); spring(y + r, right, colors[1], 1.5);
    for (const [i, cx] of [x, y].entries()) { for (let j = 0; j < 14; j++) { const f = j / 14; disc(cx - r * f * .28, l.y - r * f * .3, r * (1 - .9 * f), `hsl(${hue + i * 135},75%,${22 + f * 65}%)`); } ctx.fillStyle = '#071323'; ctx.font = `${Math.max(11, r * .8)}px monospace`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), cx, l.y + r * .27); }
    // Twelve seconds of exact displacement curves, with a moving time marker.
    const chart = { x: W * .17, y: H * (H > W ? .37 : .54), w: W * .66, h: H * (H > W ? .11 : .16) }, start = Math.floor(model.time / 12) * 12;
    for (let i = 0; i <= 6; i++) path([[chart.x + chart.w * i / 6, chart.y - chart.h / 2], [chart.x + chart.w * i / 6, chart.y + chart.h / 2]], '#1f3344', .7);
    path([[chart.x, chart.y], [chart.x + chart.w, chart.y]], '#405264');
    for (let body = 0; body < 2; body++) path(Array.from({ length: 361 }, (_, i) => { const sample = coupledSample(start + i / 30, s.a, s.b, s.c, s.d, release); return [chart.x + i / 360 * chart.w, chart.y - sample[body ? 'y' : 'x'] * chart.h * .47]; }), colors[body], Math.max(1, unit / 450));
    const marker = chart.x + (model.time - start) / 12 * chart.w; path([[marker, chart.y - chart.h / 2], [marker, chart.y + chart.h / 2]], '#e2edf5', .8);
    for (let i = 0; i < 2; i++) { const bx = W * (.17 + .35 * i), by = chart.y + chart.h * .75, bw = W * .31; ctx.fillStyle = '#1c3041'; ctx.fillRect(bx, by, bw, Math.max(3, unit * .008)); ctx.fillStyle = colors[i]; ctx.fillRect(bx, by, bw * (model.initialEnergy > 0 ? clamp(p[i ? 'energy2' : 'energy1'] / model.initialEnergy, 0, 1) : 0), Math.max(3, unit * .008)); }
    return `${model.release} · ${model.time.toFixed(2)} s · Energy ${model.initialEnergy > 0 ? (p.energy / model.initialEnergy * 100).toFixed(1) + '%' : '0'} · exact normal modes`;
  }
  return { prepare, step, plant, special, draw, get data() { return model; } };
}
