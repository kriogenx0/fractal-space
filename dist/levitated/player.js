// SPDX-License-Identifier: GPL-3.0-only
// Browser UI for the Levitated adaptations. Original algorithms: Jared Tarbell.
import { works, createPacking, createIK, drawPacking, drawIK } from './experiments.js';
const $ = q => document.querySelector(q), requested = new URLSearchParams(location.search).get('work'), slug = works[requested] ? requested : 'invader-fractal', work = works[slug], isPacking = slug === 'invader-fractal';
const canvas = $('#art'), ctx = canvas.getContext('2d'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 1, model, a = work.a[4], b = work.b[4], selected = -1, paused = reduced, dirty = true, visible = !document.hidden, last = performance.now(), accumulator = 0, drag = -1, lastDraw = 0, colorIndex = 0;
const held = new Set(), colors = ['#20231f', '#b23f2b', '#3d437a'];
$('#title').textContent = work.name; $('#description').textContent = work.description; $('#hint').textContent = work.hint; $('#edition').textContent = `EXPERIMENT ${work.number} / LEVITATED PORT`;
document.title = `${work.name} — Levitated / Fractal Space`; $('#original').href = `https://levitated.net/daily/${work.original}.html`; $('#original-source').href = `levitated/${work.original}.zip`;
$('#next').href = isPacking ? 'levitated.html?work=iterative-ik' : 'tandava.html'; canvas.setAttribute('aria-label', `${work.name}. ${work.hint}. P pauses, R starts again.`);
function reset() { model = isPacking ? createPacking(seed, a) : createIK(seed, Math.round(b)); selected = -1; if (isPacking && reduced) model.step(6000); dirty = true; }
for (const [key, range] of [['a', work.a], ['b', work.b]]) { const input = $('#param-'+key); input.min = range[1]; input.max = range[2]; input.step = range[3]; input.value = range[4]; $('#label-'+key).textContent = range[0]; const update = () => { const value = +input.value; $('#value-'+key).textContent = value.toFixed(range[3] === 1 ? 0 : 2); if (key === 'a') a = value; else b = value; if ((isPacking && key === 'a') || (!isPacking && key === 'b')) reset(); dirty = true; }; input.oninput = update; $('#value-'+key).textContent = range[4].toFixed(range[3] === 1 ? 0 : 2); }
function pauseUI() { $('#pause').textContent = paused ? 'Resume' : 'Pause'; $('#pause').setAttribute('aria-pressed', String(paused)); } pauseUI();
function pause() { paused = !paused; held.clear(); pauseUI(); dirty = true; } $('#pause').onclick = pause;
$('#reset').onclick = () => { seed++; reset(); }; $('#color').onclick = () => { colorIndex = (colorIndex + 1) % colors.length; dirty = true; };
function action() { if (isPacking) { if (selected < 0 && model.items.length) selected = 0; model.refill(selected); selected = -1; if (paused) model.step(6000); } else model.pulse(Math.max(0, selected)); dirty = true; }
$('#action').textContent = isPacking ? 'Refill selection' : 'Send a pulse'; $('#action').onclick = action;
let scale = 1, ox = 0, oy = 0;
function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); scale = Math.min(canvas.width / 600, canvas.height / 337); ox = (canvas.width - 600 * scale) / 2; oy = (canvas.height - 337 * scale) / 2; dirty = true; }
new ResizeObserver(resize).observe(canvas);
function draw() { if (!ctx) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.setTransform(scale, 0, 0, scale, ox, oy); if (isPacking) drawPacking(ctx, model, selected, colors[colorIndex]); else drawIK(ctx, model, selected, colors[colorIndex]); $('#count').textContent = isPacking ? `${model.items.length} creatures · ${model.queue.length ? 'still finding space' : 'canvas filled'}` : `${model.nodes.length} nodes · click to connect another`; dirty = false; }
function point(e) { const r = canvas.getBoundingClientRect(), dx = canvas.width / r.width, dy = canvas.height / r.height; return [(e.clientX - r.left) * dx / scale - ox / scale, (e.clientY - r.top) * dy / scale - oy / scale]; }
canvas.onpointerdown = e => { const [x, y] = point(e); if (x < 0 || y < 0 || x > 600 || y > 337) return; canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId);
  if (isPacking) { const i = model.items.findIndex(item => x >= item.x && x < item.x + item.size && y >= item.y && y < item.y + item.size); if (i >= 0) { selected = i; action(); } }
  else { let closest = -1, distance = 12; model.nodes.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < distance) { distance = d; closest = i; } }); selected = closest < 0 ? model.add(x, y) : closest; drag = selected; if (selected >= 0) { const n = model.nodes[selected]; n.x = x; n.y = y; model.constrain(selected); } } dirty = true;
};
canvas.onpointermove = e => { if (drag < 0 || isPacking) return; const p = point(e), n = model.nodes[drag]; n.x = Math.max(0, Math.min(600, p[0])); n.y = Math.max(0, Math.min(337, p[1])); model.constrain(drag); dirty = true; };
canvas.onpointerup = canvas.onpointercancel = () => { drag = -1; };
function clear() { held.clear(); drag = -1; } window.addEventListener('blur', clear); canvas.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { visible = !document.hidden; clear(); last = performance.now(); });
canvas.onkeydown = e => { if (e.metaKey || e.ctrlKey || e.altKey) return; if (e.key.startsWith('Arrow')) { e.preventDefault(); if (isPacking && !e.repeat) { const count = model.items.length; if (count) selected = (selected + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1) + count) % count; dirty = true; } else held.add(e.key); } else if (!e.repeat) { const key = e.key.toLowerCase(); if (key === ' ') { e.preventDefault(); action(); } if (key === 'p') pause(); if (key === 'r') { seed++; reset(); } } };
window.addEventListener('keyup', e => held.delete(e.key));
$('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('#stage').requestFullscreen) await $('#stage').requestFullscreen(); else $('#fullscreen').textContent = 'Unavailable'; } catch { $('#fullscreen').textContent = 'Unavailable'; } };
$('#save').onclick = () => { draw(); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `levitated-${slug}-${seed}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }); };
function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.06, (now - last) / 1000); last = now; if (!visible || !ctx) return;
  if (!isPacking && held.size) { if (selected < 0) selected = 0; const n = model.nodes[selected]; if (n) { n.x += (+held.has('ArrowRight') - +held.has('ArrowLeft')) * dt * 80; n.y += (+held.has('ArrowDown') - +held.has('ArrowUp')) * dt * 80; model.constrain(selected); dirty = true; } }
  if (!paused) { if (isPacking) { if (model.queue.length) { model.step(Math.round(b)); dirty = true; } } else { accumulator += dt; while (accumulator >= 1 / 60) { model.step(a, drag >= 0 ? drag : held.size ? selected : -1); accumulator -= 1 / 60; } dirty = true; } }
  if (dirty && now - lastDraw > 1000 / 30) { draw(); lastDraw = now; }
}
if (!ctx) $('#count').textContent = 'Canvas is unavailable in this browser.'; reset(); resize(); draw(); requestAnimationFrame(frame);
