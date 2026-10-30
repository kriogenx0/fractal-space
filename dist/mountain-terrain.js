// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Seeded, domain-warped ridged value noise; original implementation.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), mix = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);
function lattice(x, z, seed) { let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(seed, 1442695041); h = Math.imul(h ^ h >>> 13, 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295 * 2 - 1; }
export function terrainNoise(x, z, seed = 1) { const ix = Math.floor(x), iz = Math.floor(z), u = smooth(x - ix), v = smooth(z - iz); return mix(mix(lattice(ix, iz, seed), lattice(ix + 1, iz, seed), u), mix(lattice(ix, iz + 1, seed), lattice(ix + 1, iz + 1, seed), u), v); }
export function createTerrainField(seed = 1, roughness = .6, resolution = 64) {
  if (!Number.isInteger(resolution) || resolution < 8 || resolution > 96) throw new Error('Terrain resolution must be 8–96 cells');
  const size = resolution + 1, samples = new Float64Array(size * size), persistence = .25 + clamp(roughness, 0, 2) * .43;
  let minimum = Infinity, maximum = -Infinity;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = (i / resolution - .5) * 5.4, z = (j / resolution - .5) * 4.4;
    const wx = x + terrainNoise(x * .42 + 21, z * .42 - 7, seed + 101) * .6, wz = z + terrainNoise(x * .42 - 9, z * .42 + 13, seed + 211) * .6;
    let amplitude = 1, weight = 0, value = 0, px = wx * .4 + 3.7, pz = wz * .4 - 5.3;
    for (let octave = 0; octave < 5; octave++) { const ridge = 1 - Math.abs(terrainNoise(px, pz, seed + octave * 37)); value += ridge * ridge * amplitude; weight += amplitude; amplitude *= persistence; const nextX = (px * .8 - pz * .6) * 1.9 + 7.1; pz = (px * .6 + pz * .8) * 1.9 - 3.8; px = nextX; }
    const height = value / weight + terrainNoise(wx * .28, wz * .28, seed + 313) * .16;
    samples[j * size + i] = height; minimum = Math.min(minimum, height); maximum = Math.max(maximum, height);
  }
  // Normalize this finite field once. Relief controls then preserve its shape.
  const center = (minimum + maximum) / 2, halfRange = Math.max(1e-12, (maximum - minimum) / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = clamp((samples[i] - center) / halfRange, -1, 1);
  return { seed, roughness, resolution, size, samples };
}
export function terrainHeight(sample, peaks = 1.35, valleys = .45) { return sample >= 0 ? peaks * sample ** 1.55 : -valleys * (-sample) ** .9; }
const subtract = (a, b) => a.map((v, i) => v - b[i]);
function normal(a, b, c) { const u = subtract(b, a), v = subtract(c, a), n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], length = Math.hypot(...n); return n.map(v => v / length); }
export function terrainContour(points, level) {
  const crossings = [];
  for (let i = 0; i < 3; i++) { const a = points[i], b = points[(i + 1) % 3]; if ((a[1] < level) !== (b[1] < level)) { const t = (level - a[1]) / (b[1] - a[1]); crossings.push([mix(a[0], b[0], t), level, mix(a[2], b[2], t)]); } }
  return crossings.length === 2 && Math.hypot(...subtract(crossings[0], crossings[1])) > 1e-10 ? crossings : null;
}
export function terrainMesh(field, peaks = 1.35, valleys = .45, depth = 1.1) {
  const { resolution: n, size, samples } = field, vertices = [], faces = [], walls = [], floor = -valleys - .22;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) vertices.push([(i / n - .5) * 5.4, terrainHeight(samples[j * size + i], peaks, valleys), (j / n - .5) * 4.4 * depth]);
  const levels = peaks + valleys > 1e-8 ? Array.from({ length: 12 }, (_, i) => -valleys + (i + .5) / 12 * (peaks + valleys)) : [];
  function face(indices) { const points = indices.map(i => vertices[i]), height = points.reduce((s, p) => s + p[1], 0) / 3, low = Math.min(...points.map(p => p[1])), high = Math.max(...points.map(p => p[1])); faces.push({ indices, normal: normal(...points), height, contours: levels.filter(level => level > low && level < high).map(level => terrainContour(points, level)).filter(Boolean) }); }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * size + i, b = a + 1, c = a + size, d = c + 1; face([a, c, b]); face([b, c, d]); }
  const boundaries = [Array.from({ length: size }, (_, i) => i), Array.from({ length: size }, (_, j) => j * size + n), Array.from({ length: size }, (_, i) => n * size + n - i), Array.from({ length: size }, (_, j) => (n - j) * size)];
  boundaries.forEach((edge, side) => { for (let i = 1; i < edge.length; i++) { const a = vertices[edge[i - 1]], b = vertices[edge[i]], points = [a, b, [b[0], floor, b[2]], [a[0], floor, a[2]]]; walls.push({ points, normal: [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]][side] }); } });
  const bottom = [[-2.7, floor, -2.2 * depth], [2.7, floor, -2.2 * depth], [2.7, floor, 2.2 * depth], [-2.7, floor, 2.2 * depth]];
  return { field, vertices, faces, walls, edges: boundaries, bottom, floor, peaks, valleys, depth, center: [0, (peaks + floor) / 2, 0], radius: Math.hypot(2.7, 2.2 * depth, (peaks - floor) / 2) };
}
export function terrainCamera(model, width, height, state) {
  const angle = state.yaw + state.time * .07 * state.direction, pitch = -state.pitch, cy = Math.cos(angle), sy = Math.sin(angle), cp = Math.cos(pitch), sp = Math.sin(pitch), distance = model.radius * 3.4, focal = Math.min(width, height) * 1.85 * state.zoom;
  const rotate = ([x, y, z]) => { const xx = x * cy - z * sy, zz = x * sy + z * cy; return [xx, y * cp - zz * sp, y * sp + zz * cp]; };
  const project = p => { const q = rotate(subtract(p, model.center)), scale = focal / (distance + q[2]); return [width / 2 + q[0] * scale, height * (width < height ? .25 : .37) - q[1] * scale, q[2]]; };
  return { rotate, project };
}
const palettes = [ [[22, 64, 62], [66, 105, 77], [112, 111, 94], [143, 151, 157], [239, 246, 249]], [[16, 46, 70], [29, 109, 122], [88, 158, 152], [169, 193, 182], [244, 242, 218]], [[48, 31, 65], [102, 56, 87], [155, 98, 94], [207, 158, 128], [255, 232, 206]], [[40, 51, 76], [79, 82, 125], [130, 117, 155], [192, 178, 203], [249, 238, 252]], [[38, 50, 39], [96, 110, 65], [148, 147, 98], [196, 193, 150], [251, 248, 224]] ];
function colorAt(t, light, palette) { const stops = palettes[palette % palettes.length], index = clamp(t, 0, 1) * (stops.length - 1), low = Math.floor(index), high = Math.min(stops.length - 1, low + 1); return `rgb(${stops[low].map((v, i) => Math.round(clamp(mix(v, stops[high][i], index - low) * light, 0, 255))).join(',')})`; }
export function createTerrainScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  let field, model, fieldKey = '', meshKey = '', view = 0; const views = ['Alpine', 'Contours', 'Wireframe'];
  function prepare(s) { const roughness = s.c ?? .6, depth = s.d ?? 1.1, nextField = `${s.seed}:${roughness}`, nextMesh = `${nextField}:${s.a}:${s.b}:${depth}`; if (nextField !== fieldKey) { field = createTerrainField(s.seed, roughness); fieldKey = nextField; } if (nextMesh !== meshKey) { model = terrainMesh(field, s.a, s.b, depth); meshKey = nextMesh; } model.view = views[view]; }
  function step(s) { prepare(s); return true; }
  function special(s) { view = (view + 1) % views.length; prepare(s); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), camera = terrainCamera(model, W, H, s), projected = model.vertices.map(camera.project), primitives = [];
    ctx.globalAlpha = 1; ctx.fillStyle = '#080d16'; ctx.fillRect(0, 0, W, H);
    function path(points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); } }
    const add = (points, n, color, contours = null) => { if (camera.rotate(n)[2] >= 0) return; primitives.push({ points, color, contours, depth: points.reduce((s, p) => s + p[2], 0) / points.length }); };
    add(model.bottom.map(camera.project), [0, -1, 0], '#10212a');
    for (const wall of model.walls) { const light = wall.normal[0] ? .75 : .95; add(wall.points.map(camera.project), wall.normal, colorAt(.06, light, s.palette)); }
    for (const face of model.faces) {
      const altitude = face.height >= 0 ? .2 + .8 * face.height / Math.max(.001, s.a) : .2 * (1 + face.height / Math.max(.001, s.b)), diffuse = Math.max(0, face.normal[0] * -.43 + face.normal[1] * .86 + face.normal[2] * -.28), light = .3 + diffuse * .85;
      add(face.indices.map(i => projected[i]), face.normal, view === 2 ? colorAt(.1, .38 + diffuse * .3, s.palette) : colorAt(altitude, light * (view === 1 ? .66 : 1), s.palette), view === 1 ? face.contours : null);
    }
    primitives.sort((a, b) => b.depth - a.depth);
    for (const p of primitives) { path(p.points, p.color, 1, true); if (view !== 2) path([...p.points, p.points[0]], p.color, Math.max(.55, unit / 1000)); if (view === 2) { ctx.globalAlpha = .5; path([...p.points, p.points[0]], '#9dd6d0', Math.max(.35, unit / 1800)); ctx.globalAlpha = 1; } if (p.contours) { ctx.globalAlpha = .8; for (const segment of p.contours) path(segment.map(camera.project), '#b5e7d6', Math.max(.55, unit / 1100)); ctx.globalAlpha = 1; } }
    // Rim lines reveal the height field's cross section, including its valleys.
    ctx.globalAlpha = .45;
    for (const [side, edge] of model.edges.entries()) if (camera.rotate(model.walls[side * model.field.resolution].normal)[2] < 0) path(edge.map(i => projected[i]), '#b2d9ca', Math.max(.5, unit / 1250));
    ctx.globalAlpha = 1;
    return `Seed ${s.seed} · ${model.faces.length.toLocaleString('en-US')} triangles · Relief ${(s.a + s.b).toFixed(2)} units · ${views[view]} · Space changes view`;
  }
  return { prepare, step, special, draw, plant() {}, get data() { return model; } };
}
