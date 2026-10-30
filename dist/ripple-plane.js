// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Original damped-wave solver and perspective water surface.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => a.map((v, i) => v - b[i]), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = v => { const length = Math.hypot(...v); return v.map(x => x / length); };
export const rippleExtent = 6.4, rippleDt = 1 / 120;
export function createRippleField(resolution = 64) {
  if (!Number.isInteger(resolution) || resolution < 16 || resolution > 96) throw new Error('Water grid must have 16–96 cells');
  const size = resolution + 1, spacing = rippleExtent / resolution, count = size * size, sponge = new Float64Array(count), impacts = [];
  let height = new Float64Array(count), previous = new Float64Array(count), next = new Float64Array(count), steps = 0, time = 0, drops = 0, quiet = true;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const edge = Math.min(i, j, resolution - i, resolution - j); sponge[j * size + i] = 12 * Math.max(0, 1 - edge / 8) ** 2; }
  function drop(x, z, radius = .28, strength = .8) {
    if (![x, z, radius, strength].every(Number.isFinite) || Math.abs(x) > rippleExtent / 2 || Math.abs(z) > rippleExtent / 2) return false;
    radius = clamp(radius, .05, 1.2); strength = clamp(strength, -1, 1);
    const reach = radius * 4, gx = (x / rippleExtent + .5) * resolution, gz = (z / rippleExtent + .5) * resolution, cells = reach / spacing;
    for (let j = Math.max(1, Math.floor(gz - cells)); j <= Math.min(resolution - 1, Math.ceil(gz + cells)); j++) for (let i = Math.max(1, Math.floor(gx - cells)); i <= Math.min(resolution - 1, Math.ceil(gx + cells)); i++) {
      const dx = (i - gx) * spacing, dz = (j - gz) * spacing, q = (dx * dx + dz * dz) / (radius * radius);
      if (q > 16) continue;
      const pulse = -strength * (1 - q / 2) * Math.exp(-q / 2), k = j * size + i;
      // Equal displacement of both buffers adds no artificial initial velocity.
      height[k] += pulse; previous[k] += pulse;
    }
    impacts.push({ x, z, born: time }); if (impacts.length > 32) impacts.shift(); drops++; quiet = false; return true;
  }
  function step(speed = 1.15, damping = .35) {
    if (quiet) return false;
    speed = clamp(speed, 0, 5); damping = clamp(damping, 0, 6);
    const lambda2 = (speed * rippleDt / spacing) ** 2;
    // Four substeps per 30 Hz display tick. Worst-case Courant number is .625 (below 1/√2).
    for (let iteration = 0; iteration < 4; iteration++) {
      for (let j = 1; j < resolution; j++) for (let i = 1; i < resolution; i++) {
        const k = j * size + i, loss = (damping + sponge[k]) * rippleDt / 2, lap = height[k - 1] + height[k + 1] + height[k - size] + height[k + size] - 4 * height[k];
        next[k] = (2 * height[k] - (1 - loss) * previous[k] + lambda2 * lap) / (1 + loss);
      }
      const old = previous; previous = height; height = next; next = old;
    }
    steps++; time = steps / 30;
    for (let i = impacts.length - 1; i >= 0; i--) if (time - impacts[i].born > 1) impacts.splice(i, 1);
    let magnitude = 0; for (let i = 0; i < count; i++) magnitude = Math.max(magnitude, Math.abs(height[i]), Math.abs(previous[i]));
    if (magnitude < 1e-7) { height.fill(0); previous.fill(0); next.fill(0); impacts.length = 0; quiet = true; }
    return true;
  }
  function clear() { height.fill(0); previous.fill(0); next.fill(0); impacts.length = 0; steps = time = drops = 0; quiet = true; }
  return { size, resolution, spacing, impacts, drop, step, clear, get height() { return height; }, get previous() { return previous; }, get steps() { return steps; }, get time() { return time; }, get drops() { return drops; }, get quiet() { return quiet; } };
}
export function rippleCamera(width, height, state) {
  const yaw = state.yaw, pitch = -state.pitch, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), distance = 15.6, focal = Math.min(width, height) * (width < height ? 1.65 : 1.95) * state.zoom, centerY = height * (width < height ? .25 : .37);
  const rotate = ([x, y, z]) => { const xx = x * cy - z * sy, zz = x * sy + z * cy; return [xx, y * cp - zz * sp, y * sp + zz * cp]; };
  const inverse = ([x, y, z]) => { const yy = y * cp + z * sp, zz = -y * sp + z * cp; return [x * cy + zz * sy, yy, -x * sy + zz * cy]; };
  const project = p => { const q = rotate(p), scale = focal / (distance + q[2]); return [width / 2 + q[0] * scale, centerY - q[1] * scale, q[2]]; };
  const ray = (px, py) => ({ origin: inverse([0, 0, -distance]), direction: unit(inverse([(px - width / 2) / focal, -(py - centerY) / focal, 1])) });
  return { rotate, inverse, project, ray };
}
export function ripplePlaneHit(camera, px, py) {
  const ray = camera.ray(px, py); if (Math.abs(ray.direction[1]) < 1e-9) return null;
  const t = -ray.origin[1] / ray.direction[1]; if (t < 0) return null;
  const x = ray.origin[0] + ray.direction[0] * t, z = ray.origin[2] + ray.direction[2] * t;
  return Math.abs(x) <= rippleExtent / 2 && Math.abs(z) <= rippleExtent / 2 ? [x, z] : null;
}
export function rippleVertices(field, amplitude = 1) { return Array.from({ length: field.height.length }, (_, k) => [(k % field.size / field.resolution - .5) * rippleExtent, amplitude * Math.tanh(field.height[k]), (Math.floor(k / field.size) / field.resolution - .5) * rippleExtent]); }
export function rippleHeightAt(field, x, z, amplitude = 1) {
  const gx = clamp((x / rippleExtent + .5) * field.resolution, 0, field.resolution), gz = clamp((z / rippleExtent + .5) * field.resolution, 0, field.resolution), i = Math.min(field.resolution - 1, Math.floor(gx)), j = Math.min(field.resolution - 1, Math.floor(gz)), u = gx - i, v = gz - j, a = j * field.size + i;
  const h = k => amplitude * Math.tanh(field.height[k]), ha = h(a), hb = h(a + 1), hc = h(a + field.size), hd = h(a + field.size + 1);
  return u + v <= 1 ? ha + (hb - ha) * u + (hc - ha) * v : hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v);
}
export function rippleTriangleHit(ray, a, b, c) {
  const e1 = sub(b, a), e2 = sub(c, a), p = cross(ray.direction, e2), determinant = dot(e1, p); if (Math.abs(determinant) < 1e-10) return null;
  const t = sub(ray.origin, a), u = dot(t, p) / determinant; if (u < -1e-9 || u > 1 + 1e-9) return null;
  const q = cross(t, e1), v = dot(ray.direction, q) / determinant; if (v < -1e-9 || u + v > 1 + 1e-9) return null;
  const distance = dot(e2, q) / determinant; return distance > 0 ? distance : null;
}
export function rippleSurfaceHit(field, amplitude, camera, px, py) {
  const ray = camera.ray(px, py), vertices = rippleVertices(field, amplitude); let distance = Infinity;
  for (let j = 0; j < field.resolution; j++) for (let i = 0; i < field.resolution; i++) { const a = j * field.size + i, b = a + 1, c = a + field.size, d = c + 1; for (const indices of [[a, c, b], [b, c, d]]) { const t = rippleTriangleHit(ray, ...indices.map(k => vertices[k])); if (t !== null && t < distance) distance = t; } }
  if (!Number.isFinite(distance)) return null;
  const p = ray.origin.map((v, i) => v + ray.direction[i] * distance); return [clamp(p[0], -rippleExtent / 2, rippleExtent / 2), clamp(p[2], -rippleExtent / 2, rippleExtent / 2)];
}
export function createRippleScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  const field = createRippleField(); let initialized = false, target = [0, 0], marker = false;
  function prepare(s) { if (initialized) return; initialized = true; field.drop(-1.2, .35, s.d ?? .28); for (let i = 0; i < 11; i++) field.step(s.b, s.c ?? .35); field.drop(1, -.55, s.d ?? .28); for (let i = 0; i < 11; i++) field.step(s.b, s.c ?? .35); }
  function step(s) { prepare(s); return field.step(s.b, s.c ?? .35); }
  function moveTarget(dx, dz) { target = [clamp(target[0] + dx, -3.1, 3.1), clamp(target[1] + dz, -3.1, 3.1)]; marker = true; }
  function pointer(s, px, py) { const hit = ripplePlaneHit(rippleCamera(canvas.width, canvas.height, s), px, py); marker = !!hit; if (hit) target = hit; }
  function special(s) { prepare(s); marker = true; field.drop(...target, s.d ?? .28); }
  function dropAt(s, px, py) { prepare(s); const hit = rippleSurfaceHit(field, s.a, rippleCamera(canvas.width, canvas.height, s), px, py); if (!hit) return false; target = hit; marker = true; return field.drop(...hit, s.d ?? .28); }
  function clear() { initialized = true; field.clear(); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, camera = rippleCamera(W, H, s), vertices = rippleVertices(field, s.a), projected = vertices.map(camera.project), faces = [], theme = s.palette % 5;
    ctx.globalAlpha = 1; ctx.fillStyle = '#07101c'; ctx.fillRect(0, 0, W, H);
    const themes = [[18, 128, 163], [52, 158, 132], [108, 100, 188], [174, 112, 66], [66, 134, 192]], tint = themes[theme], lightDirection = unit([-.35, .8, -.5]);
    function path(points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); } }
    function face(a, b, c) { const n = unit(cross(sub(vertices[b], vertices[a]), sub(vertices[c], vertices[a]))), viewNormal = camera.rotate(n), lighting = .44 + .6 * Math.max(0, dot(n, lightDirection)), specular = Math.max(0, dot(viewNormal, unit([-.15, .5, -1]))) ** 28, elevation = (vertices[a][1] + vertices[b][1] + vertices[c][1]) / 3 / Math.max(.2, s.a), shimmer = .88 + elevation * .45;
      const color = `rgb(${tint.map((v, i) => Math.round(clamp(v * lighting * shimmer + specular * (i ? 190 : 150) + Math.max(0, elevation) * 65, 0, 255))).join(',')})`, points = [projected[a], projected[b], projected[c]];
      faces.push({ points, color, depth: points.reduce((sum, p) => sum + p[2], 0) / 3 }); }
    for (let j = 0; j < field.resolution; j++) for (let i = 0; i < field.resolution; i++) { const a = j * field.size + i, b = a + 1, c = a + field.size, d = c + 1; face(a, c, b); face(b, c, d); }
    faces.sort((a, b) => b.depth - a.depth);
    for (const f of faces) { path(f.points, f.color, 1, true); path([...f.points, f.points[0]], f.color, .6); }
    // A faint surface grid makes height and perspective visible even between impacts.
    ctx.globalAlpha = .11;
    for (let row = 0; row < field.size; row += 4) { path(Array.from({ length: field.size }, (_, i) => projected[row * field.size + i]), '#b6efff', .55); path(Array.from({ length: field.size }, (_, i) => projected[i * field.size + row]), '#b6efff', .55); }
    ctx.globalAlpha = .65; const half = rippleExtent / 2; path([[-half, 0, -half], [half, 0, -half], [half, 0, half], [-half, 0, half], [-half, 0, -half]].map(camera.project), '#72b8cb', 1);
    for (const impact of field.impacts) { const age = field.time - impact.born, radius = .07 + age * s.b; ctx.globalAlpha = Math.max(0, 1 - age) * .45; const ring = []; for (let i = 0; i <= 32; i++) { const angle = i / 32 * Math.PI * 2, x = impact.x + Math.cos(angle) * radius, z = impact.z + Math.sin(angle) * radius; if (Math.abs(x) <= half && Math.abs(z) <= half) ring.push(camera.project([x, rippleHeightAt(field, x, z, s.a) + .015, z])); } if (ring.length > 1) path(ring, '#b8f4ff', 1); }
    ctx.globalAlpha = 1;
    if (marker) { const p = camera.project([target[0], rippleHeightAt(field, ...target, s.a) + .025, target[1]]); ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.strokeStyle = '#e2fbff'; ctx.lineWidth = 1; ctx.stroke(); path([[p[0] - 10, p[1]], [p[0] + 10, p[1]]], '#e2fbff', .8); path([[p[0], p[1] - 10], [p[0], p[1] + 10]], '#e2fbff', .8); }
    return `${field.drops} ${field.drops === 1 ? 'droplet' : 'droplets'} · Click / tap water to add · Drag to orbit · Space drops at the target`;
  }
  return { prepare, step, draw, special, clear, moveTarget, pointer, dropAt, plant: dropAt, get target() { return target; }, get data() { return field; } };
}
