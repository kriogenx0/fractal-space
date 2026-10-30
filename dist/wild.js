import { catalog, createScene } from './wild-scenes.js';
const $ = q => document.querySelector(q);
const slugs = Object.keys(catalog), requested = new URLSearchParams(location.search).get('work');
const slug = slugs.includes(requested) ? requested : slugs[0], work = catalog[slug], grass = slug === 'grass-wind';
const canvas = $('#art'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { time: reduced ? 8 : 0, a: work.a[4], b: work.b[4], pointer: [0, 0], yaw: .3, pitch: .38, zoom: 1, palette: 0, seed: 1, direction: 1, travel: 0, alternate: false, paused: reduced };
let paused = reduced, dirty = true, visible = !document.hidden, last = performance.now(), lastDraw = 0, drag = null, pinch = 0;
const touches = new Map(), held = new Set();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
$('#title').textContent = work.name; $('#category').textContent = work.category; $('#description').textContent = work.description;
$('#edition').textContent = `FRACTAL SPACE / ${work.n}`; $('#material').textContent = 'LIVE CANVAS / EXPLORATIONS'; $('#status').textContent = 'ANOTHER WAY TO SEE THE WORLD.';
$('#gesture').textContent = work.gesture; $('#help-text').textContent = work.help; $('#special').textContent = work.special;
if (grass) { $('#shuffle').textContent = 'New meadow ↻'; $('#shuffle').setAttribute('title', 'Plant another seeded meadow (R)'); canvas.setAttribute('data-mode', 'grass'); }
if ($('#zoom-help')) $('#zoom-help').hidden = grass;
$('#next').href = slugs.indexOf(slug) === slugs.length - 1 ? 'tandava.html' : `wild.html?work=${slugs[slugs.indexOf(slug) + 1]}`;
document.title = `${work.name} — Fractal Space`; document.documentElement.style.setProperty('--accent', work.accent);
canvas.setAttribute('aria-label', `${work.name}. ${work.help}`);
for (const [key, range] of [['a', work.a], ['b', work.b]]) {
  const input = $(`#param-${key}`), output = $(`#value-${key}`);
  $('#label-' + key).textContent = range[0]; input.min = range[1]; input.max = range[2]; input.step = range[3]; input.value = range[4];
  const update = () => { state[key] = +input.value; output.textContent = state[key].toFixed(range[3] === 1 ? 0 : 2); dirty = true; };
  input.addEventListener('input', update); update();
}
function pauseUI() { state.paused = paused; $('#pause').textContent = paused ? '▶' : 'Ⅱ'; $('#pause').setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation'); }
function togglePause() { paused = !paused; pauseUI(); dirty = true; } pauseUI();
function special() { if (grass) { scene?.gust(state); dirty = true; return; } if (slug === 'dream-strata') state.alternate = !state.alternate; else state.direction *= -1; dirty = true; $('#special').setAttribute('aria-pressed', String(slug === 'dream-strata' ? state.alternate : state.direction < 0)); }
function vary() { if (grass) { clear(); state.seed++; state.time = 0; dirty = true; return; } state.seed++; state.yaw = Math.sin(state.seed * 2.1) * .7; state.palette = (state.palette + 1) % 5; state.time += 2.7; dirty = true; }
$('#pause').onclick = togglePause; $('#special').onclick = special; $('#shuffle').onclick = vary;
$('#palette').onclick = () => { state.palette = (state.palette + 1) % 5; dirty = true; };
function hud(show) { $('#hud').hidden = !show; $('#show').hidden = show; }
$('#hide').onclick = () => hud(false); $('#show').onclick = () => hud(true);
$('#help').onclick = () => { clear(); $('#help-dialog').showModal(); }; $('#close-help').onclick = () => $('#help-dialog').close();
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else $('#fullscreen').textContent = 'Unavailable'; } catch { $('#fullscreen').textContent = 'Unavailable'; } }
$('#fullscreen').onclick = fullscreen;
let scene;
try { scene = createScene(canvas, slug); } catch { $('#error').hidden = false; $('#error-message').textContent = 'This piece needs Canvas 2D. Try another browser to explore it.'; $('#hud').hidden = true; }
function resize() { const r = canvas.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 2, 1600 / Math.max(r.width, r.height)); canvas.width = Math.max(1, Math.round(r.width * scale)); canvas.height = Math.max(1, Math.round(r.height * scale)); dirty = true; }
new ResizeObserver(resize).observe(canvas); resize();
function locate(e) { const r = canvas.getBoundingClientRect(); state.pointer = [clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1), clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1)]; if (grass) scene?.pointer(state, ...state.pointer); dirty = true; }
canvas.onpointerdown = e => { canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId); locate(e); touches.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
canvas.onpointermove = e => { locate(e); if (grass) return; if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2) { const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) state.zoom = clamp(state.zoom * d / Math.max(1, pinch), .4, 2.4); pinch = d; drag = null; } else if (drag) { state.yaw += (e.clientX - drag[0]) * .005; state.pitch = clamp(state.pitch + (e.clientY - drag[1]) * .005, -1.1, 1.1); drag = [e.clientX, e.clientY]; } };
function release(e, canceled = false) { if (grass && (canceled || e.pointerType === 'touch' || e.pointerType === 'pen')) { scene?.leave(state); dirty = true; } touches.delete(e.pointerId); drag = null; pinch = 0; } canvas.onpointerup = e => release(e); canvas.onpointercancel = e => release(e, true);
canvas.onpointerleave = () => { if (grass) { scene?.leave(state); dirty = true; } };
canvas.addEventListener('wheel', e => { if (grass) return; e.preventDefault(); if (slug === 'infinite-descent') state.travel += e.deltaY * .004; else state.zoom = clamp(state.zoom * Math.exp(-e.deltaY * .001), .4, 2.4); dirty = true; }, { passive: false });
function clear() { if (grass) { scene?.leave(state); dirty = true; } held.clear(); touches.clear(); drag = null; pinch = 0; }
window.addEventListener('blur', clear); canvas.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { visible = !document.hidden; clear(); last = performance.now(); });
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || $('#help-dialog').open || /INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key.startsWith('Arrow')) { e.preventDefault(); held.add(e.key); }
  else if (!e.repeat) { const k = e.key.toLowerCase(); if (k === ' ') { e.preventDefault(); special(); } if (k === 'p') togglePause(); if (k === 'r') vary(); if (k === 'h') hud($('#hud').hidden); if (k === 'f') fullscreen(); if (!grass && ['+', '=', '-'].includes(k)) { state.zoom = clamp(state.zoom * (k === '-' ? .9 : 1.1), .4, 2.4); dirty = true; } }
});
window.addEventListener('keyup', e => held.delete(e.key));
$('#save').onclick = () => { scene?.draw(state); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), a = document.createElement('a'); a.download = `fractal-space-${slug}-${Date.now()}.png`; a.href = url; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }); };
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min(.045, (now - last) / 1000); last = now;
  if (!visible || !scene) return;
  if (!$('#help-dialog').open) { const dx = +held.has('ArrowRight') - +held.has('ArrowLeft'), dy = +held.has('ArrowDown') - +held.has('ArrowUp'); if (dx || dy) { if (grass || ['dream-strata', 'infinite-descent', 'gravity-well'].includes(slug)) { state.pointer[0] = clamp(state.pointer[0] + dx * dt, -1, 1); state.pointer[1] = clamp(state.pointer[1] + dy * dt, -1, 1); if (grass) scene.pointer(state, ...state.pointer); } else { state.yaw += dx * dt; state.pitch = clamp(state.pitch + dy * dt, -1.1, 1.1); } dirty = true; } }
  if (!paused && !$('#help-dialog').open) { state.time += dt; scene.step?.(state, dt); dirty = true; }
  if (dirty && now - lastDraw >= 1000 / 30) { const status = scene.draw(state); if (status) $('#status').textContent = status; dirty = false; lastDraw = now; }
}
const initialStatus = scene?.draw(state); if (initialStatus) $('#status').textContent = initialStatus; requestAnimationFrame(frame);
