// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
import { catalog, createMathScene, clamp } from './math-scenes.js';
const $ = query => document.querySelector(query), slugs = Object.keys(catalog), requested = new URLSearchParams(location.search).get('work');
const slug = slugs.includes(requested) ? requested : slugs[0], work = catalog[slug], mode = work.mode;
const canvas = $('#art'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { a: work.a[4], b: work.b[4], time: 0, yaw: .45, pitch: .45, zoom: 1, center: [0, 0], palette: 0, seed: 1, direction: 1, pointer: [.5, .42] };
let scene, paused = reduced, visible = !document.hidden, dirty = true, last = performance.now(), lastDraw = 0, accumulator = 0, drag = null, pinch = 0;
const touches = new Map();
$('#title').textContent = work.name; $('#category').textContent = work.category; $('#description').textContent = work.description;
$('#equation').textContent = work.equation; $('#measurement').hidden = slug !== 'schwarz-lantern'; $('#explanation').textContent = work.explanation; $('#edition').textContent = `FRACTAL SPACE / ${work.n}`;
$('#material').textContent = 'MATHEMATICS / LIVE CANVAS'; $('#gesture').textContent = work.gesture; $('#special').textContent = work.special;
$('#help-text').textContent = work.mode === 'reaction' ? 'Drag to seed chemical B. Arrow keys move the brush and Enter plants at its position. Space selects a chemical regime. P pauses; changing rates while paused takes effect after resuming.' : work.mode === 'clifford' ? 'Arrow keys adjust a and b. Space selects a preset, R restarts the accumulation, P pauses it.' : work.mode === 'plane' ? 'Drag or use arrows to pan the complex plane. Scroll, pinch or + / − to zoom. Space resets the view. R changes the polynomial degree.' : 'Drag or use arrows to orbit. Scroll, pinch or + / − to zoom. Space uses the named action; P pauses rotation.';
$('#zoom-help').hidden = !['plane', 'orbit'].includes(mode);
$('#reference').hidden = !work.reference; if (work.reference) $('#reference').href = work.reference;
$('#next').href = slugs.indexOf(slug) === slugs.length - 1 ? 'fractal.html?work=mandelbulb' : `math.html?work=${slugs[slugs.indexOf(slug) + 1]}`;
document.title = `${work.name} — Fractal Space`; canvas.setAttribute('aria-label', `${work.name}. ${$('#help-text').textContent}`);
function precision(step) { return step >= 1 ? 0 : step < .001 ? 4 : 2; }
function sync() { for (const key of ['a', 'b']) { const range = work[key], input = $('#param-' + key); $('#label-' + key).textContent = range[0]; input.min = range[1]; input.max = range[2]; input.step = range[3]; input.value = state[key]; $('#value-' + key).textContent = state[key].toFixed(precision(range[3])); } }
function parameter(key, value) { const range = work[key]; state[key] = clamp(Math.round((value - range[1]) / range[3]) * range[3] + range[1], range[1], range[2]); sync(); dirty = true; }
for (const key of ['a', 'b']) $('#param-' + key).addEventListener('input', () => parameter(key, +$('#param-' + key).value)); sync();
function pauseUI() { $('#pause').textContent = paused ? '▶' : 'Ⅱ'; $('#pause').setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation'); $('#pause').setAttribute('aria-pressed', String(paused)); }
function pause() { paused = !paused; accumulator = 0; pauseUI(); dirty = true; } pauseUI();
function special() { if (!scene) return; scene.special(state); sync(); dirty = true; }
function vary() { state.seed++; if (mode === 'plane') parameter('a', state.a >= 7 ? 3 : state.a + 1); else if (mode === 'orbit') state.yaw += .5; dirty = true; }
$('#pause').onclick = pause; $('#special').onclick = special; $('#shuffle').onclick = vary; $('#palette').onclick = () => { state.palette = (state.palette + 1) % 5; dirty = true; };
function hud(show) { $('#hud').hidden = !show; $('#show').hidden = show; }
$('#hide').onclick = () => hud(false); $('#show').onclick = () => hud(true);
$('#help').onclick = () => { clear(); $('#help-dialog').showModal(); }; $('#close-help').onclick = () => $('#help-dialog').close();
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else $('#fullscreen').textContent = 'Unavailable'; } catch { $('#fullscreen').textContent = 'Unavailable'; } }
$('#fullscreen').onclick = fullscreen;
try { scene = createMathScene(canvas, slug); } catch { $('#error').hidden = false; $('#error-message').textContent = 'This experiment needs Canvas 2D. Try another browser to explore it.'; $('#hud').hidden = true; }
function resize() { const r = canvas.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 2, 1600 / Math.max(r.width, r.height)); canvas.width = Math.max(1, Math.round(r.width * scale)); canvas.height = Math.max(1, Math.round(r.height * scale)); dirty = true; }
new ResizeObserver(resize).observe(canvas); resize();
function locate(e) { const r = canvas.getBoundingClientRect(); state.pointer = [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)]; dirty = true; }
function plant() { scene?.plant(state, state.pointer[0] * canvas.width, state.pointer[1] * canvas.height); dirty = true; }
function zoom(factor, anchor = null) { if (!['plane', 'orbit'].includes(mode)) return; const before = 3.4 / state.zoom; state.zoom = clamp(state.zoom * factor, mode === 'plane' ? .5 : .25, mode === 'plane' ? 100000 : 3); if (mode === 'plane' && anchor) { const after = 3.4 / state.zoom; state.center[0] += (anchor[0] - .5) * canvas.width / canvas.height * (before - after); state.center[1] += (.5 - anchor[1]) * (before - after); } dirty = true; }
canvas.onpointerdown = e => { canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId); locate(e); touches.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; if (mode === 'reaction') plant(); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
canvas.onpointermove = e => {
  locate(e); if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, [e.clientX, e.clientY]);
  if (mode === 'reaction') { plant(); return; }
  if (touches.size === 2) { const [a, b] = [...touches.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(distance / Math.max(1, pinch)); pinch = distance; drag = null; }
  else if (drag) { const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; if (mode === 'orbit') { state.yaw += dx * .006; state.pitch = clamp(state.pitch + dy * .006, -1.4, 1.4); } else if (mode === 'plane') { const span = 3.4 / state.zoom, height = canvas.getBoundingClientRect().height; state.center[0] -= dx / height * span; state.center[1] += dy / height * span; } drag = [e.clientX, e.clientY]; }
};
function release(e) { touches.delete(e.pointerId); drag = null; pinch = 0; } canvas.onpointerup = canvas.onpointercancel = release;
canvas.addEventListener('wheel', e => { if (!['plane', 'orbit'].includes(mode)) return; e.preventDefault(); locate(e); zoom(Math.exp(-e.deltaY * .0015), state.pointer); }, { passive: false });
function clear() { touches.clear(); drag = null; pinch = 0; accumulator = 0; }
window.addEventListener('blur', clear); canvas.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { visible = !document.hidden; clear(); last = performance.now(); });
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || $('#help-dialog').open || /INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key.startsWith('Arrow')) {
    e.preventDefault(); const dx = +(e.key === 'ArrowRight') - +(e.key === 'ArrowLeft'), dy = +(e.key === 'ArrowDown') - +(e.key === 'ArrowUp');
    if (mode === 'plane') { state.center[0] += dx * .15 / state.zoom; state.center[1] -= dy * .15 / state.zoom; }
    else if (mode === 'orbit') { state.yaw += dx * .08; state.pitch = clamp(state.pitch + dy * .08, -1.4, 1.4); }
    else if (mode === 'reaction') { state.pointer[0] = clamp(state.pointer[0] + dx * .025, 0, 1); state.pointer[1] = clamp(state.pointer[1] + dy * .025, 0, 1); }
    else parameter(dx ? 'a' : 'b', (dx ? state.a : state.b) + (dx || dy) * .01);
    dirty = true;
  } else if (!e.repeat) { const key = e.key.toLowerCase(); if (key === ' ') { e.preventDefault(); special(); } if (key === 'enter' && mode === 'reaction') { e.preventDefault(); plant(); } if (key === 'p') pause(); if (key === 'r') vary(); if (key === 'h') hud($('#hud').hidden); if (key === 'f') fullscreen(); if (['+', '=', '-'].includes(key)) zoom(key === '-' ? .85 : 1.15); }
});
$('#save').onclick = () => { if (!scene) return; scene.draw(state); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.download = `fractal-space-${slug}-${state.seed}.png`; link.href = url; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }); };
function draw() { if (scene) { $('#status').textContent = scene.draw(state); if (slug === 'schwarz-lantern') { const model = scene.data, text = `Triangle area ${model.area.toFixed(3)} · Cylinder ${model.cylinderArea.toFixed(3)} · Ratio ${(model.area / model.cylinderArea).toFixed(4)}×`; if ($('#measurement').textContent !== text) $('#measurement').textContent = text; } } dirty = false; }
function frame(now) {
  requestAnimationFrame(frame); const dt = clamp((now - last) / 1000, 0, .06); last = now;
  if (!visible || !scene) return;
  if (!paused && !$('#help-dialog').open) { accumulator += dt; while (accumulator >= 1 / 30) { state.time += 1 / 30; dirty = scene.step(state) || dirty; accumulator -= 1 / 30; } }
  if (dirty && now - lastDraw >= 1000 / 30) { draw(); lastDraw = now; }
}
draw(); requestAnimationFrame(frame);
