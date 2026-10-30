// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Original mathematical models; sources and limitations in math-notes.txt.
const PI = Math.PI, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function resonanceResponse(ratio, damping) {
  return { gain: 1 / Math.hypot(1 - ratio * ratio, 2 * damping * ratio), lag: Math.atan2(2 * damping * ratio, 1 - ratio * ratio) };
}
export function standingSample(x, time, harmonic, ratio, damping, speed) {
  const response = resonanceResponse(ratio, damping), natural = harmonic * speed / 2;
  return .02 * response.gain * Math.sin(harmonic * PI * x) * Math.cos(2 * PI * natural * ratio * time);
}
export function resonanceLayout(W, H) {
  const portrait = H > W;
  return { x: W * .14, width: W * .72, y: H * (portrait ? .18 : .24), amplitude: H * (portrait ? .065 : .105), chart: { x: W * .22, y: H * (portrait ? .28 : .43), width: W * .56, height: H * (portrait ? .09 : .14) } };
}
export function cycloidParameters(reach, drop) {
  let low = .000001, high = 2 * PI - .000001;
  for (let i = 0; i < 70; i++) { const theta = (low + high) / 2; if ((theta - Math.sin(theta)) / (1 - Math.cos(theta)) < reach / drop) low = theta; else high = theta; }
  const theta = (low + high) / 2, radius = drop / (1 - Math.cos(theta));
  return { theta, radius, depth: theta > PI ? 2 * radius : drop };
}
export function raceParabola(z, reach, drop) { const u = z * z; return [reach * u, drop * (2 * u - u * u)]; }
// u=z² removes the starting 1/sqrt(u) singularity from travel-time quadrature.
function parabolaTimeDerivative(z, reach, drop, gravity) {
  return 2 * Math.hypot(reach, 2 * drop * (1 - z * z)) / Math.sqrt(2 * gravity * drop * (2 - z * z));
}
export function createRace(reach, drop, gravity, cells = 1024) {
  const cycloid = cycloidParameters(reach, drop), times = new Float64Array(cells + 1);
  for (let i = 1; i <= cells; i++) { const a = (i - 1) / cells, b = i / cells; times[i] = times[i - 1] + (b - a) / 6 * (parabolaTimeDerivative(a, reach, drop, gravity) + 4 * parabolaTimeDerivative((a + b) / 2, reach, drop, gravity) + parabolaTimeDerivative(b, reach, drop, gravity)); }
  const finish = [cycloid.theta * Math.sqrt(cycloid.radius / gravity), Math.sqrt(2 * (reach * reach + drop * drop) / (gravity * drop)), times[cells]];
  function point(path, fraction) {
    if (path === 0) { const theta = clamp(fraction, 0, 1) * cycloid.theta; return [cycloid.radius * (theta - Math.sin(theta)), cycloid.radius * (1 - Math.cos(theta))]; }
    if (path === 1) return [reach * fraction, drop * fraction];
    return raceParabola(fraction, reach, drop);
  }
  function sample(path, time) {
    const t = clamp(time, 0, finish[path]); let u;
    if (path === 0) u = t / finish[0];
    else if (path === 1) u = (t / finish[1]) ** 2;
    else { let low = 0, high = cells; while (high - low > 1) { const mid = (low + high) >>> 1; if (times[mid] <= t) low = mid; else high = mid; } u = (low + (t - times[low]) / (times[high] - times[low])) / cells; }
    const position = point(path, u); return { position, speed: Math.sqrt(2 * gravity * position[1]), arrived: time >= finish[path] };
  }
  return { reach, drop, gravity, cycloid, finish, times, point, sample, time: 0, steps: 0 };
}
export function raceLayout(W, H, model) {
  const scale = Math.min(W * .72 / model.reach, H * (H > W ? .20 : .32) / model.cycloid.depth);
  return { x: (W - scale * model.reach) / 2, y: H * .12, scale, barY: H * (H > W ? .34 : .49), barHeight: H * (H > W ? .018 : .027) };
}
function painter(ctx) {
  return { path(points, color, width = 1) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }, disc(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fillStyle = color; ctx.fill(); } };
}
export function createResonanceRace(canvas, slug) {
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable');
  const { path, disc } = painter(ctx), resonance = slug === 'standing-resonance'; let model, stamp = '', dragLayout = null;
  function prepare(s) {
    const key = (resonance ? [s.a, s.b, s.c, s.d, s.seed] : [s.a, s.b, s.c, s.seed]).join(':'); if (stamp === key) return; stamp = key;
    if (resonance) { const response = resonanceResponse(s.b, s.c), natural = s.a * s.d / 2; model = { ...response, natural, frequency: natural * s.b, wavelength: 2 / s.a, playback: Math.min(1, 3 / (natural * s.b)), time: 0, steps: 0, nodes: s.a + 1 }; }
    else model = createRace(s.a, s.b, s.c);
  }
  function step(s) { prepare(s); if (resonance) { model.time += model.playback / 30; model.steps++; return true; } const end = Math.max(...model.finish); if (model.time >= end) return false; model.time = Math.min(end, model.time + s.d / 30); model.steps++; return true; }
  function special(s) { if (resonance) s.a = s.a >= 12 ? 1 : s.a + 1; else s.seed++; prepare(s); }
  function beginDrag(s) { prepare(s); if (!resonance) dragLayout = raceLayout(canvas.width, canvas.height, model); }
  function endDrag() { dragLayout = null; }
  function plant(s, px, py) {
    prepare(s);
    if (resonance) { const l = resonanceLayout(canvas.width, canvas.height); s.b = Math.round(clamp(.1 + (px - l.chart.x) / l.chart.width * 2.9, .1, 3) * 100) / 100; }
    else { const l = dragLayout ?? raceLayout(canvas.width, canvas.height, model); s.a = Math.round(clamp((px - l.x) / l.scale, .5, 8) * 10) / 10; s.b = Math.round(clamp((py - l.y) / l.scale, .25, 6) * 20) / 20; }
    prepare(s);
  }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), hue = 184 + s.palette * 55;
    ctx.fillStyle = '#080d19'; ctx.fillRect(0, 0, W, H);
    if (resonance) {
      const l = resonanceLayout(W, H), amplitude = l.amplitude * Math.tanh(model.gain / 5), phase = Math.cos(2 * PI * model.frequency * model.time), samples = Math.max(240, s.a * 40);
      path([[l.x, l.y], [l.x + l.width, l.y]], '#354c5d');
      for (const sign of [-1, 1]) path(Array.from({ length: samples + 1 }, (_, i) => [l.x + i / samples * l.width, l.y + sign * amplitude * Math.sin(s.a * PI * i / samples)]), '#37546a', .7);
      const wave = Array.from({ length: samples + 1 }, (_, i) => [l.x + i / samples * l.width, l.y - amplitude * Math.sin(s.a * PI * i / samples) * phase]);
      path(wave, `hsla(${hue},85%,70%,.12)`, Math.max(6, unit / 50)); path(wave, `hsl(${hue},90%,76%)`, Math.max(1.2, unit / 350));
      for (let i = 0; i <= s.a; i++) { const x = l.x + i / s.a * l.width; disc(x, l.y, Math.max(2, unit / 180), '#ffdcb0'); }
      for (const x of [l.x, l.x + l.width]) path([[x, l.y - l.amplitude * 1.12], [x, l.y + l.amplitude * 1.12]], '#8498a9', 2);
      const c = l.chart, to = (r, gain) => [c.x + (r - .1) / 2.9 * c.width, c.y + c.height * (1 - Math.log1p(gain) / Math.log(51))];
      for (const r of [1, 2, 3]) { const x = to(r, 0)[0]; path([[x, c.y], [x, c.y + c.height]], '#243d50', .7); ctx.fillStyle = '#92a8b8'; ctx.font = `${Math.max(9, unit / 65)}px monospace`; ctx.textAlign = 'center'; ctx.fillText(String(r), x, c.y + c.height + Math.max(12, unit / 40)); }
      path([[c.x, c.y], [c.x, c.y + c.height], [c.x + c.width, c.y + c.height]], '#4b6578');
      const ratios = Array.from({ length: 601 }, (_, i) => .1 + i / 600 * 2.9); ratios.push(1); if (s.c < Math.SQRT1_2) ratios.push(Math.sqrt(1 - 2 * s.c * s.c)); ratios.sort((a, b) => a - b);
      path(ratios.filter(r => r >= .1).map(r => to(r, resonanceResponse(r, s.c).gain)), `hsl(${hue + 130},85%,74%)`, Math.max(1, unit / 450));
      const current = to(s.b, model.gain); path([[current[0], c.y], [current[0], c.y + c.height]], '#b4cedc', .7); disc(...current, Math.max(3, unit / 140), '#f9f4dc');
      return `Harmonic ${s.a} · ${model.nodes} nodes · Gain ${model.gain.toFixed(2)}× · ${model.playback < 1 ? model.playback.toFixed(2) + '× playback' : 'steady driven mode'}`;
    }
    const l = dragLayout ?? raceLayout(W, H, model), colors = [`hsl(${hue},90%,75%)`, `hsl(${hue + 150},90%,75%)`, `hsl(${hue + 70},80%,75%)`], to = p => [l.x + p[0] * l.scale, l.y + p[1] * l.scale];
    const start = to([0, 0]), finish = to([model.reach, model.drop]);
    path([[start[0], start[1]], [finish[0], start[1]], finish], '#233c4f', .8);
    for (let i = 0; i < 3; i++) {
      path(Array.from({ length: 241 }, (_, j) => to(model.point(i, j / 240))), colors[i], Math.max(1, unit / 430));
      const position = to(model.sample(i, model.time).position), radius = Math.max(4, unit / 80);
      disc(...position, radius * 1.7, `hsla(${hue + [0, 150, 70][i]},80%,65%,.1)`); disc(...position, radius, colors[i]); disc(position[0] - radius * .3, position[1] - radius * .3, radius * .22, '#ffffff');
      const by = l.barY + i * l.barHeight, bx = W * .28, bw = W * .44, proportion = model.finish[i] / Math.max(...model.finish);
      path([[bx, by], [bx + bw, by]], '#263e50', Math.max(2, unit / 180)); path([[bx, by], [bx + bw * proportion, by]], colors[i], Math.max(2, unit / 180));
      const progress = Math.min(1, model.time / model.finish[i]); disc(bx + bw * proportion * progress, by, Math.max(2.5, unit / 160), '#f2f9ff');
      ctx.fillStyle = colors[i]; ctx.font = `${Math.max(10, unit / 55)}px monospace`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), bx - Math.max(12, unit / 30), by + 4);
      const label = to(model.point(i, .45)); ctx.fillText(String(i + 1), label[0] + (i - 1) * 10, label[1] - 12);
    }
    for (const point of [start, finish]) { disc(...point, Math.max(2, unit / 200), '#fff5db'); }
    return `${model.time.toFixed(2)} s · ${model.sample(0, model.time).arrived ? 'Cycloid arrived' : 'Racing from rest'}${model.time >= Math.max(...model.finish) ? ' · finished · R replays' : ''}`;
  }
  return { prepare, step, special, plant, beginDrag, endDrag, draw, get data() { return model; } };
}
