// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Original implicit droplets: a shared scalar field, shaded as a curved surface.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), TAU = Math.PI * 2;
export function liquidLayout(width, height) { return { x: width * .5, y: height * (width < height ? .28 : .42), scale: Math.max(1, Math.min(width, height)) * .155 }; }
export function liquidPoint(px, py, width, height) { const l = liquidLayout(width, height); return [(px - l.x) / l.scale, (py - l.y) / l.scale]; }
export function liquidField(x, y, bodies, cohesion = 1) {
  let value = 0, dx = 0, dy = 0;
  for (const b of bodies) { const xx = x - b.x, yy = y - b.y, r2 = b.radius * b.radius, d = xx * xx + yy * yy + .02 * r2, f = cohesion * r2 * r2 / (d * d); value += f; dx -= 4 * xx * f / d; dy -= 4 * yy * f / d; }
  return { value, dx, dy };
}
export function createLiquidDrops(seed = 1, count = 9) {
  let n = seed >>> 0, age = 0; const bounds = { left: -2.65, right: 2.65, top: -1.7, bottom: 1.7 }, bodies = [], random = () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296), cursor = { x: .65, y: .1, radius: .6, active: true };
  function add(x, y) { if (bodies.length >= 32) return false; const i = bodies.length, angle = i * 2.399963 + random() * .35; bodies.push({ x: clamp(x ?? Math.cos(angle) * (1.5 + random() * .6), bounds.left, bounds.right), y: clamp(y ?? Math.sin(angle) * (1.0 + random() * .45), bounds.top, bounds.bottom), vx: (random() - .5) * .2, vy: (random() - .5) * .2, radius: .32 + random() * .23, phase: random() * TAU }); return true; }
  function configure(population) { const target = clamp(Math.round(population), 2, 32); while (bodies.length > target) bodies.pop(); while (bodies.length < target) add(); }
  function step(drift = .6) {
    if (drift === 0) return false; const dt = drift / 30; age += dt;
    for (const b of bodies) {
      let ax = Math.sin(age * .7 + b.phase) * .06 - b.x * .035, ay = Math.cos(age * .9 + b.phase * 2) * .05 - b.y * .035;
      if (cursor.active) { const dx = cursor.x - b.x, dy = cursor.y - b.y, distance = Math.hypot(dx, dy), pull = .18 * Math.exp(-distance * distance / 3); ax += dx * pull; ay += dy * pull; }
      for (const other of bodies) { if (other === b) continue; const dx = b.x - other.x, dy = b.y - other.y, distance = Math.hypot(dx, dy), reach = b.radius + other.radius; if (distance < reach) { const angle = distance > 1e-8 ? Math.atan2(dy, dx) : b.phase; const force = .65 * (1 - distance / reach); ax += Math.cos(angle) * force; ay += Math.sin(angle) * force; } }
      b.vx = clamp((b.vx + ax * dt) * Math.exp(-.9 * dt), -.8, .8); b.vy = clamp((b.vy + ay * dt) * Math.exp(-.9 * dt), -.8, .8);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < bounds.left || b.x > bounds.right) { b.x = clamp(b.x, bounds.left, bounds.right); b.vx *= -.7; } if (b.y < bounds.top || b.y > bounds.bottom) { b.y = clamp(b.y, bounds.top, bounds.bottom); b.vy *= -.7; }
    }
    return true;
  }
  function scatter() { for (const [i, b] of bodies.entries()) { const angle = Math.atan2(b.y - cursor.y, b.x - cursor.x) + (i % 2 ? .2 : -.2); b.x = clamp(b.x + Math.cos(angle) * .45, bounds.left, bounds.right); b.y = clamp(b.y + Math.sin(angle) * .45, bounds.top, bounds.bottom); b.vx = Math.cos(angle) * .7; b.vy = Math.sin(angle) * .7; } }
  configure(count); return { bounds, bodies, cursor, configure, add, step, scatter, get age() { return age; } };
}
const palettes = [[31, 156, 194], [156, 166, 180], [221, 118, 36], [119, 77, 213], [215, 68, 135]];
export function liquidColor(field, palette = 0) {
  const f = Math.max(1.0001, field.value), height = Math.sqrt(1 - 1 / f), slope = .6 / (2 * f * f * height), norm = Math.hypot(field.dx * slope, field.dy * slope, 1), nx = -field.dx * slope / norm, ny = -field.dy * slope / norm, nz = 1 / norm;
  const diffuse = Math.max(0, nx * -.45 + ny * -.6 + nz * .66), specular = Math.max(0, nx * -.28 + ny * -.36 + nz * .89) ** 48, band = (.5 + .5 * Math.sin(ny * 10 + nx * 3)) ** 5, rim = (1 - nz) ** 2;
  return palettes[palette % palettes.length].map((v, i) => clamp(Math.round(v * (.16 + .64 * diffuse) + (55 + i * 8) * band + specular * 185 + rim * (45 + i * 15)), 0, 255));
}
export function createLiquidScene(canvas, makeSurface = () => document.createElement('canvas')) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable'); const surface = makeSurface(), raster = surface.getContext('2d'); if (!raster) throw new Error('Canvas 2D unavailable'); let model, seed;
  function prepare(s) { if (!model || seed !== s.seed) { const oldCursor = model?.cursor; model = createLiquidDrops(s.seed, s.a); if (oldCursor) Object.assign(model.cursor, oldCursor); seed = s.seed; } const l = liquidLayout(canvas.width, canvas.height); Object.assign(model.bounds, { left: -l.x / l.scale + .12, right: (canvas.width - l.x) / l.scale - .12, top: -l.y / l.scale + .12, bottom: (canvas.height - l.y) / l.scale - .12 }); model.configure(s.a); model.cursor.radius = s.c; }
  function pointer(s, px, py) { prepare(s); [model.cursor.x, model.cursor.y] = liquidPoint(px, py, canvas.width, canvas.height); model.cursor.active = true; }
  function setPointerActive(active) { if (model) model.cursor.active = active; }
  function plant(s, px, py) { pointer(s, px, py); if (model.add(model.cursor.x, model.cursor.y)) s.a = model.bodies.length; }
  function special(s) { prepare(s); model.scatter(); }
  function step(s) { prepare(s); return model.step(s.d); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, ratio = Math.min(1, 400 / Math.max(W, H)), width = Math.max(1, Math.round(W * ratio)), height = Math.max(1, Math.round(H * ratio));
    surface.width = width; surface.height = height; const image = raster.createImageData(width, height), l = liquidLayout(W, H), bodies = model.cursor.active ? [...model.bodies, model.cursor] : model.bodies;
    for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
      const x = ((i + .5) / width * W - l.x) / l.scale, y = ((j + .5) / height * H - l.y) / l.scale, field = liquidField(x, y, bodies, s.b), k = (j * width + i) * 4, halo = Math.min(1, field.value) ** 3;
      const background = [7 + halo * 3, 11 + halo * 8, 21 + halo * 12], coverage = clamp((field.value - 1) * 4 + .5, 0, 1), color = coverage ? liquidColor(field, s.palette) : background;
      for (let channel = 0; channel < 3; channel++) image.data[k + channel] = Math.round(background[channel] + (color[channel] - background[channel]) * coverage); image.data[k + 3] = 255;
    }
    raster.putImageData(image, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(surface, 0, 0, W, H);
    return `${model.bodies.length} floating drops${model.cursor.active ? ' + liquid cursor' : ''} · cohesion ${s.b.toFixed(2)} · ${s.d === 0 ? 'still field' : 'move slowly to draw the drops together'}`;
  }
  return { prepare, pointer, setPointerActive, plant, special, step, draw, get data() { return model; } };
}
