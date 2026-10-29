// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
export const goldenRatio = (1 + Math.sqrt(5)) / 2;
export function fibonacciNumbers(count = 8) {
  if (!Number.isInteger(count) || count < 1 || count > 12) throw new Error('Choose 1 to 12 Fibonacci terms');
  const numbers = [1]; if (count > 1) numbers.push(1); while (numbers.length < count) numbers.push(numbers.at(-1) + numbers.at(-2)); return numbers;
}
export function fibonacciSculpture(count = 8) {
  const numbers = fibonacciNumbers(count), cubes = []; let minX = 0, maxX = 1, minZ = 0, maxZ = 1;
  numbers.forEach((value, i) => {
    let x = 0, z = 0;
    if (i) { const direction = (i - 1) % 4; if (direction === 0) { x = maxX; z = minZ; } else if (direction === 1) { x = minX; z = maxZ; } else if (direction === 2) { x = minX - value; z = minZ; } else { x = minX; z = minZ - value; } }
    const corner = i % 4, center = [x + (corner === 0 || corner === 3 ? value : 0), z + (corner === 0 || corner === 1 ? value : 0)], angle = Math.PI + i * Math.PI / 2;
    const arc = Array.from({ length: 49 }, (_, j) => { const t = angle + j / 48 * Math.PI / 2; return [center[0] + value * Math.cos(t), value, center[1] + value * Math.sin(t)]; });
    cubes.push({ x, z, value, arc, center }); minX = Math.min(minX, x); maxX = Math.max(maxX, x + value); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z + value);
  });
  return { numbers, cubes, bounds: { minX, maxX, minZ, maxZ }, ratio: count > 1 ? numbers.at(-1) / numbers.at(-2) : null };
}
export function fibonacciVertices({ x, z, value }, extrusion = 1) { return Array.from({ length: 8 }, (_, k) => [x + (k & 1 ? value : 0), k & 4 ? value * extrusion : 0, z + (k & 2 ? value : 0)]); }
export function fibonacciFrame(model, extrusion = 1) {
  const { minX, maxX, minZ, maxZ } = model.bounds, height = model.numbers.at(-1) * extrusion;
  return { center: [(minX + maxX) / 2, height / 2, (minZ + maxZ) / 2], radius: Math.hypot(maxX - minX, height, maxZ - minZ) / 2 };
}
export function createFibonacciScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable'); let model, count = 0;
  function prepare(s) { if (Math.round(s.a) !== count) { count = Math.round(s.a); model = fibonacciSculpture(count); } }
  function step(s) { prepare(s); return true; }
  function special(s) { s.a = s.a >= 12 ? 1 : s.a + 1; prepare(s); }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), frame = fibonacciFrame(model, s.b), hue = s.palette * 65;
    const yaw = s.yaw + s.time * .1 * s.direction, pitch = -s.pitch, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rotate = ([x, y, z]) => { const xx = x * cy - z * sy, zz = x * sy + z * cy; return [xx, y * cp - zz * sp, y * sp + zz * cp]; };
    const project = p => { const q = rotate(p.map((v, i) => (v - frame.center[i]) / frame.radius * 2.4)); return [W / 2 + q[0] * unit * .13 * s.zoom, H * .37 - q[1] * unit * .13 * s.zoom, q[2]]; };
    ctx.fillStyle = '#070c17'; ctx.fillRect(0, 0, W, H);
    function path(points, color, width = 1, fill = false) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = ctx.lineCap = 'round'; if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else ctx.stroke(); }
    const faces = [], labels = [], definitions = [ { indices: [0, 1, 5, 4], normal: [0, 0, -1] }, { indices: [2, 6, 7, 3], normal: [0, 0, 1] }, { indices: [0, 4, 6, 2], normal: [-1, 0, 0] }, { indices: [1, 3, 7, 5], normal: [1, 0, 0] }, { indices: [4, 5, 7, 6], normal: [0, 1, 0] }, { indices: [0, 2, 3, 1], normal: [0, -1, 0] } ];
    model.cubes.forEach((cube, i) => {
      const { x, z, value } = cube, height = value * s.b, vertices = fibonacciVertices(cube, s.b), projected = vertices.map(project), color = 190 + hue + i * 21;
      for (const definition of definitions) { if (s.b === 0 ? definition.normal[1] !== 1 : rotate(definition.normal)[2] >= 0) continue; const points = definition.indices.map(k => projected[k]); faces.push({ points, depth: points.reduce((n, p) => n + p[2], 0) / points.length, color, light: definition.normal[1] ? 52 : definition.normal[0] ? 37 : 29 }); }
      const size = value / frame.radius * 2.4 * unit * .13 * s.zoom; if (size >= 17) labels.push({ point: project([x + value * .5, height, z + value * .5]), value });
    });
    faces.sort((a, b) => b.depth - a.depth);
    for (const face of faces) { ctx.globalAlpha = .38; path(face.points, `hsl(${face.color},65%,${face.light}%)`, 1, true); ctx.globalAlpha = .85; path([...face.points, face.points[0]], `hsl(${face.color},80%,72%)`, Math.max(.7, unit / 1000)); } ctx.globalAlpha = 1;
    const spiral = [];
    for (const cube of model.cubes) for (const point of cube.arc) spiral.push(project([point[0], point[1] * s.b, point[2]]));
    ctx.globalAlpha = .17; path(spiral, '#ffd483', Math.max(4, unit / 95)); ctx.globalAlpha = 1; path(spiral, '#ffdd9d', Math.max(1.5, unit / 320));
    const placedLabels = []; labels.sort((a, b) => b.value - a.value);
    for (const { point, value } of labels) { if (placedLabels.some(p => Math.hypot(p[0] - point[0], p[1] - point[1]) < Math.max(18, unit / 28))) continue; placedLabels.push(point); ctx.font = `${Math.max(10, unit / 48)}px ui-monospace,monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff5d9'; ctx.fillText(String(value), point[0], point[1]); }
    return `${model.numbers.join(' · ')} · ${s.b === 1 ? 'cube edges = Fibonacci numbers' : s.b === 0 ? 'flat Fibonacci tiling' : 'extruded square prisms'} · Space adds the next term`;
  }
  return { prepare, step, special, draw, plant() {}, get data() { return model; } };
}
