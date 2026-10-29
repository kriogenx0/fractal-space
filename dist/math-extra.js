// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
const TAU = 2 * Math.PI;
export function integrateRK4(state, dt, derivative) {
  const add = (k, h) => state.map((v, i) => v + h * k[i]), a = derivative(state), b = derivative(add(a, dt / 2)), c = derivative(add(b, dt / 2)), d = derivative(add(c, dt));
  return state.map((v, i) => v + dt / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i]));
}
export function waveSample(x, z, time, wavelength = 1.1, separation = 1.4, phase = 0) {
  const r1 = Math.hypot(x + separation / 2, z), r2 = Math.hypot(x - separation / 2, z), k = TAU / wavelength, omega = TAU * .6;
  return (Math.cos(k * r1 - omega * time) / Math.sqrt(1 + .8 * r1) + Math.cos(k * r2 - omega * time + phase) / Math.sqrt(1 + .8 * r2)) * .32;
}
export function rosslerDerivative([x, y, z], a = .2, c = 5.7) { return [-y - z, x + a * y, .2 + z * (x - c)]; }
export function rosslerCurve(a = .2, c = 5.7, seed = 1) {
  let state = [1 + .001 * seed, 0, 0]; const points = []; let stopped = false;
  for (let i = 0; i < 9000; i++) { const next = integrateRK4(state, .025, p => rosslerDerivative(p, a, c)); if (!next.every(v => Number.isFinite(v) && Math.abs(v) < 100)) { stopped = true; break; } state = next; if (i >= 1000) points.push(state); }
  return { points, stopped };
}
export const magneticPoles = Array.from({ length: 3 }, (_, i) => [Math.cos(i * TAU / 3 - Math.PI / 2), Math.sin(i * TAU / 3 - Math.PI / 2)]);
export function magneticDerivative([x, y, vx, vy], damping = .22, strength = .8) {
  let ax = -.3 * x - damping * vx, ay = -.3 * y - damping * vy;
  for (const [mx, my] of magneticPoles) { const dx = mx - x, dy = my - y, factor = strength / (dx * dx + dy * dy + .35 ** 2) ** 1.5; ax += dx * factor; ay += dy * factor; }
  return [vx, vy, ax, ay];
}
export function magneticEnergy([x, y, vx, vy], strength = .8) { return (vx * vx + vy * vy) / 2 + .15 * (x * x + y * y) - magneticPoles.reduce((sum, [mx, my]) => sum + strength / Math.sqrt((mx - x) ** 2 + (my - y) ** 2 + .35 ** 2), 0); }
export function magneticLayout(width, height) { return { x: width / 2, y: height * .36, scale: Math.min(width / 6.5, height / 8) }; }
export function createMagneticPendulums(damping = .22, strength = .8, seed = 1, center = null) {
  const bodies = Array.from({ length: 21 }, (_, i) => { const angle = i / 21 * TAU + seed * .017, radius = center ? .09 + i * .008 : 2.25; const state = [(center?.[0] ?? 0) + radius * Math.cos(angle), (center?.[1] ?? 0) + radius * Math.sin(angle), 0, 0]; return { state, trail: [state.slice(0, 2)], quiet: 0 }; }); let steps = 0;
  function step() {
    let changed = false;
    for (const body of bodies) { if (body.quiet >= 60) continue; changed = true; for (let i = 0; i < 8; i++) body.state = integrateRK4(body.state, 1 / 240, p => magneticDerivative(p, damping, strength)); const d = magneticDerivative(body.state, damping, strength); body.quiet = Math.hypot(d[0], d[1]) < .015 && Math.hypot(d[2], d[3]) < .02 ? body.quiet + 1 : 0; body.trail.push(body.state.slice(0, 2)); if (body.trail.length > 361) body.trail.shift(); }
    steps++; return changed;
  }
  return { bodies, step, get steps() { return steps; }, get time() { return steps / 30; } };
}
export function createExtraMathScene(canvas, slug) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  let model, stamp = '', phase = 0;
  function prepare(s) { const next = `${s.a}:${s.b}:${s.seed}`; if (next === stamp) return; model = slug === 'rossler-attractor' ? rosslerCurve(s.a, s.b, s.seed) : slug === 'magnetic-pendulums' ? createMagneticPendulums(s.a, s.b, s.seed) : { phase }; stamp = next; }
  function step(s) { prepare(s); return slug === 'magnetic-pendulums' ? model.step() : true; }
  function special(s) { prepare(s); if (slug === 'wave-interference') { phase = phase ? 0 : Math.PI; model.phase = phase; } else if (slug === 'magnetic-pendulums') { stamp = ''; prepare(s); } else s.direction *= -1; }
  function plant(s, px, py) { prepare(s); if (slug !== 'magnetic-pendulums') return; const l = magneticLayout(canvas.width, canvas.height), center = [(px - l.x) / l.scale, (py - l.y) / l.scale].map(v => Math.max(-2.5, Math.min(2.5, v))); model = createMagneticPendulums(s.a, s.b, s.seed, center); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), hue = s.palette * 65;
    ctx.fillStyle = '#070c17'; ctx.fillRect(0, 0, W, H);
    function path(points, color, width = 1) { if (points.length < 2) return; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); }
    function dot(p, r, color) { ctx.beginPath(); ctx.arc(...p, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
    if (slug === 'magnetic-pendulums') {
      const l = magneticLayout(W, H), project = p => [l.x + p[0] * l.scale, l.y + p[1] * l.scale];
      for (const body of model.bodies) { let nearest = 0; magneticPoles.forEach((m, i) => { if (Math.hypot(m[0] - body.state[0], m[1] - body.state[1]) < Math.hypot(magneticPoles[nearest][0] - body.state[0], magneticPoles[nearest][1] - body.state[1])) nearest = i; }); const color = `hsl(${nearest * 120 + hue + 20},85%,70%)`; ctx.globalAlpha = .35; path(body.trail.map(project), color, Math.max(.7, unit / 750)); ctx.globalAlpha = 1; dot(project(body.state), Math.max(2, unit / 230), color); }
      magneticPoles.forEach((m, i) => { const p = project(m), color = `hsl(${i * 120 + hue + 20},85%,70%)`; ctx.globalAlpha = .16; dot(p, unit / 38, color); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(...p, Math.max(5, unit / 75), 0, TAU); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); path([[p[0] - 3, p[1]], [p[0] + 3, p[1]]], color); });
      return `${model.time.toFixed(1)} time units · ${model.bodies.filter(b => b.quiet < 60).length} moving / 21 · three attracting wells`;
    }
    const yaw = s.yaw + s.time * .1 * s.direction, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
    const project = ([x, y, z]) => { const xx = x * cy - z * sy, zz = x * sy + z * cy, yy = y * cp - zz * sp, depth = y * sp + zz * cp, scale = slug === 'wave-interference' ? unit * .08 * s.zoom : unit * .84 * s.zoom / Math.max(2.5, 6 + depth); return [W / 2 + xx * scale, H * .36 - yy * scale]; };
    if (slug === 'wave-interference') {
      const n = 36, point = (i, j) => { const x = (i / n * 2 - 1) * 3, z = (j / n * 2 - 1) * 3; return project([x, waveSample(x, z, s.time, s.a, s.b, phase), z]); };
      for (let i = 0; i <= n; i++) { path(Array.from({ length: n + 1 }, (_, j) => point(i, j)), `hsl(${175 + hue + i * 2},80%,66%)`, .8); ctx.globalAlpha = .4; path(Array.from({ length: n + 1 }, (_, j) => point(j, i)), `hsl(${230 + hue + i},80%,70%)`, .7); ctx.globalAlpha = 1; }
      for (const x of [-s.b / 2, s.b / 2]) dot(project([x, waveSample(x, 0, s.time, s.a, s.b, phase) + .1, 0]), Math.max(3, unit / 130), '#fff');
      return `Two coherent sources · ${phase ? 'opposite phase: centerline cancels' : 'same phase: centerline reinforces'} · λ ${s.a.toFixed(2)}`;
    }
    for (let i = 1; i < model.points.length; i += 12) { const points = model.points.slice(i - 1, i + 12).map(([x, y, z]) => project([x * .21, (z - 5) * .21, y * .21])); path(points, `hsl(${hue + 190 + i / Math.max(1, model.points.length) * 160},85%,68%)`, Math.max(.65, unit / 650)); }
    return `${model.points.length.toLocaleString()} RK4 samples · a ${s.a.toFixed(2)} · b 0.2 · c ${s.b.toFixed(2)}${model.stopped ? ' · trajectory left finite window' : ''}`;
  }
  return { prepare, step, special, plant, draw, get data() { return model; } };
}
