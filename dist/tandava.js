import { makeStars, projectStar, heroPose } from './parallax-scene.js';
const $ = q => document.querySelector(q), canvas = $('#stars'), ctx = canvas.getContext('2d', { alpha: false });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { width: innerWidth, height: innerHeight, time: 0, scroll: scrollY, pointer: [0, 0], depth: 1, drift: 1, reduced };
let stars = [], paused = reduced, dirty = true, visible = !document.hidden, last = performance.now(), dpr = 1;
const target = [0, 0], enabled = [true, true, true], held = new Set();
if (!ctx) { $('#error').hidden = false; $('.controls').hidden = true; }
function resize() {
  state.width = innerWidth; state.height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(state.width * dpr); canvas.height = Math.round(state.height * dpr);
  stars = makeStars(state.width, state.height, Math.floor(Math.random() * 4294967296)); dirty = true;
}
function draw() {
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, state.width, state.height);
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = .8;
  for (let i = 0; i < 3; i++) if (enabled[i]) for (const star of stars[i]) {
    const p = projectStar(star, state); ctx.globalAlpha = p.opacity; ctx.beginPath();
    if (p.triangle) { const h = p.radius * 3.2; ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + h * .9, p.y + h * .6); ctx.lineTo(p.x - h * .9, p.y + h * .6); ctx.closePath(); ctx.stroke(); }
    else { ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  const hero = heroPose(state.scroll, state.height, reduced); $('#hero-triangle').style.transform = `translate3d(0,${hero.y}px,0)`; $('#hero-triangle').style.opacity = hero.opacity;
  dirty = false;
}
function pauseUI() { $('#pause').textContent = paused ? 'Resume' : 'Pause'; $('#pause').setAttribute('aria-pressed', String(paused)); }
function togglePause() { paused = !paused; pauseUI(); dirty = true; } pauseUI();
$('#pause').onclick = togglePause;
for (const name of ['depth', 'drift']) $('#'+name+'-input').oninput = e => { state[name] = +e.target.value; $('#'+name+'-value').textContent = state[name].toFixed(1)+'×'; dirty = true; };
document.querySelectorAll('[data-layer]').forEach(input => input.onchange = () => { enabled[+input.dataset.layer] = input.checked; dirty = true; });
function hud(show) { $('.controls').hidden = !show; $('#show').hidden = show; }
$('#hide').onclick = () => hud(false); $('#show').onclick = () => hud(true);
$('#help').onclick = () => { held.clear(); $('#help-dialog').showModal(); }; $('#close-help').onclick = () => $('#help-dialog').close();
async function full() { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else $('#fullscreen').textContent = 'Unavailable'; } catch { $('#fullscreen').textContent = 'Unavailable'; } } $('#fullscreen').onclick = full;
$('#reset').onclick = () => { state.depth = state.drift = 1; state.time = 0; target.fill(0); state.pointer.fill(0); for (const name of ['depth', 'drift']) { $('#'+name+'-input').value = 1; $('#'+name+'-value').textContent = '1.0×'; } document.querySelectorAll('[data-layer]').forEach(input => { input.checked = true; enabled[+input.dataset.layer] = true; }); window.scrollTo({ top: 0, behavior: 'instant' }); dirty = true; };
$('#save').onclick = () => { draw(); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'fractal-space-tandava-parallax.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }); };
window.addEventListener('pointermove', e => { if (reduced || e.pointerType !== 'mouse') return; target[0] = e.clientX / state.width - .5; target[1] = e.clientY / state.height - .5; dirty = true; }, { passive: true });
window.addEventListener('scroll', () => { state.scroll = scrollY; dirty = true; }, { passive: true });
// Match the reference: mobile URL-bar height changes must not reseed the sky.
window.addEventListener('resize', () => { if (innerWidth !== state.width) resize(); else if (reduced) draw(); });
window.addEventListener('blur', () => held.clear()); document.addEventListener('visibilitychange', () => { visible = !document.hidden; held.clear(); last = performance.now(); });
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || $('#help-dialog').open || /INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); held.add(e.key); }
  else if (!e.repeat) { const key = e.key.toLowerCase(); if (key === 'p') togglePause(); if (key === 'h') hud($('.controls').hidden); if (key === 'f') full(); }
}); window.addEventListener('keyup', e => held.delete(e.key));
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.max(0, (now - last) / 1000); last = now; if (!visible || !ctx) return;
  if (!$('#help-dialog').open) {
    if (!reduced) { const dx = +held.has('ArrowRight') - +held.has('ArrowLeft'); target[0] = Math.max(-.5, Math.min(.5, target[0] + dx * dt * .5));
      const easing = .05; for (let i = 0; i < 2; i++) { if (Math.abs(target[i] - state.pointer[i]) > .0001) { state.pointer[i] += (target[i] - state.pointer[i]) * easing; dirty = true; } }
    }
    if (!paused) { state.time += dt; dirty = true; }
  }
  if (dirty) draw();
}
resize(); draw(); requestAnimationFrame(frame);
