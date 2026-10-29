// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
const TAU = Math.PI * 2;
export function inkRotate([x, y, z], yaw, pitch) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), xx = x * cy - z * sy, zz = x * sy + z * cy; return [xx, y * cp - zz * sp, y * sp + zz * cp]; }
export function inkInverse([x, y, z], yaw, pitch) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), yy = y * cp + z * sp, zz = -y * sp + z * cp; return [x * cy + zz * sy, yy, -x * sy + zz * cy]; }
export function inkLayout(width, height, zoom = 1) { return { x: width / 2, y: height * .37, scale: Math.max(1, Math.min(width, height)) * .17 * zoom }; }
export function inkUnproject(px, py, width, height, state, rotation = 0) { const l = inkLayout(width, height, state.zoom); return inkInverse([(px - l.x) / l.scale, (l.y - py) / l.scale, state.b], state.yaw + rotation, state.pitch); }
export function inkProject(point, width, height, state, rotation = 0) { const l = inkLayout(width, height, state.zoom), p = inkRotate(point, state.yaw + rotation, state.pitch); return [l.x + p[0] * l.scale, l.y - p[1] * l.scale, p[2]]; }
export function createInkDrawing(maxPoints = 12000, maxStrokes = 128) {
  let strokes = [], cleared = null, active = null, points = 0, rotation = 0, brush = null;
  function end() { active = null; brush = null; }
  function sample(point) { if (!active || points >= maxPoints || !point.every(v => Number.isFinite(v) && Math.abs(v) <= 100)) return false; const last = active.points.at(-1); if (last && Math.hypot(...point.map((v, i) => v - last[i])) < .003) return false; active.points.push(point.slice()); points++; return true; }
  function begin(point, color, position) { end(); if (strokes.length >= maxStrokes || points >= maxPoints || !point.every(v => Number.isFinite(v) && Math.abs(v) <= 100)) return false; active = { color, points: [] }; strokes.push(active); brush = position.slice(); sample(point); return true; }
  function undo() { end(); if (strokes.length) { points -= strokes.pop().points.length; return true; } if (cleared) { strokes = cleared; cleared = null; points = strokes.reduce((n, s) => n + s.points.length, 0); return true; } return false; }
  function clear() { end(); if (strokes.length) { cleared = strokes; strokes = []; points = 0; } }
  return { begin, sample, end, undo, clear, get strokes() { return strokes; }, get points() { return points; }, get full() { return points >= maxPoints || strokes.length >= maxStrokes; }, get canUndo() { return strokes.length > 0 || !!cleared; }, get active() { return active; }, get brush() { return brush; }, set brush(value) { brush = value; }, get rotation() { return rotation; }, set rotation(value) { rotation = ((value % TAU) + TAU) % TAU; } };
}
export function createInkScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable'); const model = createInkDrawing();
  const point = (s, x, y) => inkUnproject(x, y, canvas.width, canvas.height, s, model.rotation);
  function beginStroke(s, x, y) { return model.begin(point(s, x, y), 190 + s.palette * 65, [x / canvas.width, y / canvas.height]); }
  function moveStroke(s, x, y) { if (!model.active) return; model.brush = [x / canvas.width, y / canvas.height]; model.sample(point(s, x, y)); }
  function step(s) { model.rotation += s.a * Math.PI / 180 / 30; if (model.active && model.brush) model.sample(point(s, model.brush[0] * canvas.width, model.brush[1] * canvas.height)); return s.a !== 0 || !!model.active; }
  function resetView(s) { model.end(); model.rotation = 0; s.yaw = .45; s.pitch = .45; s.zoom = 1; }
  function draw(s) {
    const W = canvas.width, H = canvas.height, unit = Math.min(W, H), project = p => inkProject(p, W, H, s, model.rotation);
    ctx.fillStyle = '#070c17'; ctx.fillRect(0, 0, W, H);
    function path(points, color, width) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = ctx.lineJoin = 'round'; ctx.stroke(); }
    // The reference grid rotates in the same coordinate system as the drawing.
    for (let i = -2; i <= 2; i++) { path([[-1.2, -.96, i * .6], [1.2, -.96, i * .6]].map(project), '#203346', 1); path([[i * .6, -.96, -1.2], [i * .6, -.96, 1.2]].map(project), '#203346', 1); }
    const corners = Array.from({ length: 8 }, (_, i) => [i & 1 ? 1.2 : -1.2, i & 2 ? 1.2 : -1.2, i & 4 ? 1.2 : -1.2]);
    for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) path([corners[i], corners[i | bit]].map(project), '#152535', 1);
    const chunks = [], dots = [];
    for (const stroke of model.strokes) { const pts = stroke.points.map(project); if (pts.length === 1) dots.push({ point: pts[0], color: stroke.color }); for (let i = 1; i < pts.length; i += 16) { const points = pts.slice(i - 1, i + 16); chunks.push({ points, depth: points.reduce((n, p) => n + p[2], 0) / points.length, color: stroke.color }); } }
    chunks.sort((a, b) => b.depth - a.depth);
    const width = Math.max(1.7, unit / 300);
    for (const chunk of chunks) { const color = `hsl(${chunk.color},90%,${Math.max(48, Math.min(85, 72 - chunk.depth * 5))}%)`; ctx.globalAlpha = .12; path(chunk.points, color, width * 4); ctx.globalAlpha = 1; path(chunk.points, color, width); }
    for (const dot of dots) { ctx.beginPath(); ctx.arc(dot.point[0], dot.point[1], width, 0, TAU); ctx.fillStyle = `hsl(${dot.color},90%,75%)`; ctx.fill(); }
    if (model.brush) { const [x, y] = model.brush; ctx.beginPath(); ctx.arc(x * W, y * H, 5, 0, TAU); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
    return `${model.strokes.length} strokes · ${model.points.toLocaleString()} points · depth ${s.b.toFixed(2)} · ${model.full ? 'drawing limit: undo or clear to continue' : model.points ? 'U / Space to undo · R resets view' : 'Draw your first stroke · the space turns as you draw'}`;
  }
  return { draw, step, beginStroke, moveStroke, endStroke: discardTap => { if (discardTap && model.active?.points.length === 1) model.undo(); else model.end(); }, special: () => model.undo(), clear: () => model.clear(), resetView, plant() {}, get data() { return model; } };
}
