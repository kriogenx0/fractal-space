// SPDX-License-Identifier: GPL-3.0-only
// Browser UI for the Levitated adaptations. Original algorithms: Jared Tarbell.
import { archiveSlugs, createArchiveStudy } from './archive-experiments.js';
import { works, createPacking, createIK, drawPacking, drawIK } from './experiments.js';
import { createDLA, drawDLA, createGarden, drawGarden, createWorm, drawWorm, createLorenz, drawLorenz, createOrbits, drawOrbits, createSeaThing, drawSeaThing } from './studies.js';
const $ = q => document.querySelector(q), requested = new URLSearchParams(location.search).get('work');
const slug = works[requested] ? requested : 'invader-fractal', work = works[slug], slugs = Object.keys(works);
const canvas = $('#art'), ctx = canvas.getContext('2d'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const archiveMode = archiveSlugs.includes(slug);
const packing = slug === 'invader-fractal', ik = slug === 'iterative-ik', clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let seed = 1, model, a = work.a[4], b = work.b[4], selected = -1, paused = reduced, dirty = true, visible = !document.hidden, last = performance.now(), accumulator = 0, drag = -1, lastDraw = 0, colorIndex = 0, press = null;
const held = new Set(), colors = ['#20231f', '#b23f2b', '#3d437a'], cursor = [300, 140];
$('#title').textContent = work.name; $('#description').textContent = work.description; $('#hint').textContent = work.hint;
$('#edition').textContent = `EXPERIMENT ${work.number} / LEVITATED PORT`;
$('#original-credit').textContent = `Original experiment: Jared Tarbell / Levitated, ${work.year ?? 2003}`;
document.title = `${work.name} — Levitated / Fractal Space`;
$('#original').href = `https://levitated.net/daily/${work.originalPage ?? work.original}.html`; $('#original-source').href = `levitated/${work.original}.zip`;
if (work.recreation) $('#adaptation-summary').textContent = 'A Levitated experiment re-created for Canvas, with modern controls.';
if (work.recreation) $('#port-note').textContent = 'A Canvas recreation of the author’s published algorithm descriptions. Graphics and controls are newly implemented; see the port notes for differences.';
$('#next').href = slugs.indexOf(slug) === slugs.length - 1 ? 'tandava.html' : `levitated.html?work=${slugs[slugs.indexOf(slug) + 1]}`;
canvas.setAttribute('aria-label', `${work.name}. ${work.hint}. R starts a new variation.`);
function tick() {
  if (archiveMode) { dirty = model.step(a, b) || dirty; return; }
  if ((packing && !model.queue.length) || (slug === 'dla' && model.particles.length >= model.limit) || (slug === 'ca-worm' && (model.depth >= 3000 || model.rows.length >= 320)) || (slug === 'root-gardener' && model.nodes.every(n => n.phase >= 1 && !n.auto))) return;
  if (packing) model.step(Math.round(b));
  else if (ik) model.step(a, drag >= 0 ? drag : held.size ? selected : -1);
  else if (slug === 'dla') model.step(a, b);
  else if (slug === 'root-gardener') model.step(b);
  else if (slug === 'ca-worm') model.step(b);
  else if (slug === 'deep-lorenz') model.step(Math.round(b));
  else if (slug === 'orbiting-networks') model.step(a, cursor[1]);
  else if (slug === 'sea-thing') model.step(a, b);
  dirty = true;
}
function reset() {
  model = archiveMode ? createArchiveStudy(slug, seed, a, b) : packing ? createPacking(seed, a) : ik ? createIK(seed, Math.round(b)) : slug === 'dla' ? createDLA(seed) : slug === 'root-gardener' ? createGarden(seed) : slug === 'ca-worm' ? createWorm(seed, Math.round(a)) : slug === 'deep-lorenz' ? createLorenz(seed) : slug === 'orbiting-networks' ? createOrbits(seed) : createSeaThing(seed);
  selected = -1; accumulator = 0;
  const warmup = archiveMode ? model.warmup * (reduced ? 3 : 1) : packing ? (reduced ? 750 : 0) : ik ? 0 : slug === 'dla' ? (reduced ? 140 : 20) : slug === 'root-gardener' ? 200 : slug === 'ca-worm' ? (reduced ? 320 : 15) : slug === 'deep-lorenz' ? 120 : slug === 'sea-thing' ? 100 : 0;
  for (let i = 0; i < warmup; i++) tick(); dirty = true;
}
function updateParameter(key, value) {
  const range = work[key], v = clamp(value, range[1], range[2]);
  if (key === 'a') a = v; else b = v;
  $('#param-'+key).value = v; $('#value-'+key).textContent = v.toFixed(range[3] >= 1 ? 0 : 2);
  if (archiveMode && model.configure(a, b) && paused) for (let i = 0; i < Math.max(40, model.warmup * 3); i++) tick();
  if ((packing && key === 'a') || (ik && key === 'b') || (slug === 'ca-worm' && key === 'a')) reset(); dirty = true;
}
for (const [key, range] of [['a', work.a], ['b', work.b]]) {
  const input = $('#param-'+key); input.min = range[1]; input.max = range[2]; input.step = range[3]; input.value = range[4]; $('#label-'+key).textContent = range[0];
  input.oninput = () => updateParameter(key, +input.value); $('#value-'+key).textContent = range[4].toFixed(range[3] >= 1 ? 0 : 2);
}
function pauseUI() { $('#pause').textContent = paused ? 'Resume' : 'Pause'; $('#pause').setAttribute('aria-pressed', String(paused)); }
function pause() { paused = !paused; held.clear(); pauseUI(); dirty = true; } pauseUI();
$('#pause').onclick = pause; $('#reset').onclick = () => { seed++; reset(); };
$('#color').onclick = () => { colorIndex = (colorIndex + 1) % colors.length; dirty = true; };
$('#color').hidden = slug === 'orbiting-networks';
function action() {
  if (archiveMode) { const changes = model.action(); if (changes) for (const [key, value] of Object.entries(changes)) updateParameter(key, value); if (paused) for (let i = 0; i < Math.max(40, model.warmup * 3); i++) tick(); dirty = true; return; }
  if (packing) { if (selected < 0 && model.items.length) selected = 0; model.refill(selected); selected = -1; if (paused) model.step(6000); }
  else if (ik) model.pulse(Math.max(0, selected));
  else if (slug === 'dla') model.seedAt(...cursor);
  else if (slug === 'root-gardener') { if (selected < 0) selected = model.nodes.length - 1; model.grow(selected, a); if (paused) for (let i = 0; i < 100; i++) model.step(b); }
  else if (slug === 'ca-worm') { seed++; updateParameter('a', Math.floor(Math.random() * 256)); }
  else if (slug === 'deep-lorenz') { seed++; reset(); }
  else if (slug === 'orbiting-networks') selected = model.add(...cursor, 7, b);
  else if (slug === 'sea-thing') { if (selected < 1) selected = Math.floor(model.nodes.length / 2); model.detach(selected); }
  dirty = true;
}
$('#action').textContent = work.action ?? (packing ? 'Refill selection' : 'Send a pulse'); $('#action').onclick = action;
let scale = 1, ox = 0, oy = 0;
function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); scale = Math.min(canvas.width / 600, canvas.height / 337); ox = (canvas.width - 600 * scale) / 2; oy = (canvas.height - 337 * scale) / 2; dirty = true; }
new ResizeObserver(resize).observe(canvas);
function draw() {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = work.background ?? '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.setTransform(scale, 0, 0, scale, ox, oy);
  const color = colors[colorIndex]; let status;
  if (archiveMode) { model.draw(ctx, a, b, colorIndex); status = model.status(); }
  else if (packing) { drawPacking(ctx, model, selected, color); status = `${model.items.length} creatures · ${model.queue.length ? 'still finding space' : 'canvas filled'}`; }
  else if (ik) { drawIK(ctx, model, selected, color); status = `${model.nodes.length} nodes · click to connect another`; }
  else if (slug === 'dla') { drawDLA(ctx, model, color, document.activeElement === canvas ? cursor : null); status = `${model.particles.length} attached particles · ${model.particles.length >= model.limit ? 'growth limit reached — start a new reef' : '96 wandering particles'}`; }
  else if (slug === 'root-gardener') { drawGarden(ctx, model, selected, color); status = `${model.nodes.length} limbs · click a tip to nourish its branch`; }
  else if (slug === 'ca-worm') { drawWorm(ctx, model, color); status = `Rule ${model.rule} · ${model.rows.length} generations · ${model.depth >= 3000 || model.rows.length >= 320 ? 'growth complete — choose another rule' : 'growing'}`; }
  else if (slug === 'deep-lorenz') { drawLorenz(ctx, model, a, color); status = `${model.points.length} rings · σ 10 · ρ 28 · β 8/3`; }
  else if (slug === 'orbiting-networks') { drawOrbits(ctx, model, selected); status = `${model.nodes.length} nodes · hold longer to create a wider orbit`; }
  else { drawSeaThing(ctx, model, selected, color); status = `${model.nodes.length} bodies · ${model.nodes.filter(n => n.parent < 0).length} free swimmers`; }
  $('#count').textContent = status; dirty = false;
}
function point(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width / scale - ox / scale, (e.clientY - r.top) * canvas.height / r.height / scale - oy / scale]; }
function nearest(points, x, y, max = Infinity) { let index = -1, distance = max; points.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < distance) { distance = d; index = i; } }); return index; }
canvas.onpointerdown = e => {
  const [x, y] = point(e); if (x < 0 || y < 0 || x > 600 || y > 337) return;
  canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId); cursor[0] = x; cursor[1] = y; press = { id: e.pointerId, time: performance.now(), x, y };
  if (archiveMode) { model.click(x, y); if (paused) for (let i = 0; i < Math.max(40, model.warmup * 3); i++) tick(); }
  else if (packing) { selected = model.items.findIndex(n => x >= n.x && x < n.x + n.size && y >= n.y && y < n.y + n.size); if (selected >= 0) action(); }
  else if (ik) { selected = nearest(model.nodes, x, y, 12); if (selected < 0) selected = model.add(x, y); drag = selected; if (selected >= 0) { model.nodes[selected].x = x; model.nodes[selected].y = y; model.constrain(selected); } }
  else if (slug === 'root-gardener') { selected = nearest(model.poses(), x, y); action(); }
  else if (slug === 'sea-thing') { selected = nearest(model.nodes.map(n => ({ x: n.x + model.camera.x, y: n.y + model.camera.y })), x, y, 28); if (selected >= 0) { model.detach(selected); dirty = true; } }
  else if (slug === 'dla' || slug === 'ca-worm') action();
  dirty = true;
};
canvas.onpointermove = e => {
  const p = point(e); cursor[0] = clamp(p[0], 0, 600); cursor[1] = clamp(p[1], 0, 337);
  if (ik && drag >= 0) { const n = model.nodes[drag]; n.x = cursor[0]; n.y = cursor[1]; model.constrain(drag); }
  if (slug === 'deep-lorenz' && press) { updateParameter('a', a + (p[0] - press.x) * .01); press.x = p[0]; }
  dirty = true;
};
canvas.onpointerup = e => { if (press?.id === e.pointerId && slug === 'orbiting-networks') { const p = point(e); selected = model.add(clamp(p[0], 0, 600), clamp(p[1], 0, 337), clamp((performance.now() - press.time) / 20 + 1, 2, 24), b); dirty = true; } drag = -1; press = null; };
canvas.onpointercancel = () => { drag = -1; press = null; };
function clear() { held.clear(); drag = -1; press = null; }
window.addEventListener('blur', clear); canvas.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { visible = !document.hidden; clear(); last = performance.now(); });
canvas.onkeydown = e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.startsWith('Arrow')) {
    e.preventDefault(); const dx = +(e.key === 'ArrowRight') - +(e.key === 'ArrowLeft'), dy = +(e.key === 'ArrowDown') - +(e.key === 'ArrowUp');
    if (archiveMode) { const key = dx ? 'a' : 'b'; updateParameter(key, (dx ? a : b) + (dx || dy) * work[key][3]); }
    else if (ik) held.add(e.key);
    else if (!e.repeat && (packing || slug === 'root-gardener' || slug === 'sea-thing')) { const count = packing ? model.items.length : model.nodes.length; if (count) selected = (Math.max(0, selected) + (dx || dy) + count) % count; }
    else if (slug === 'ca-worm') updateParameter(dx ? 'a' : 'b', dx ? a + dx : b + dy * .5);
    else if (slug === 'deep-lorenz') updateParameter(dx ? 'a' : 'b', dx ? a + dx * .1 : b + dy * 100);
    else { cursor[0] = clamp(cursor[0] + dx * 12, 0, 600); cursor[1] = clamp(cursor[1] + dy * 12, 0, 337); }
    dirty = true;
  } else if (!e.repeat) { const k = e.key.toLowerCase(); if (k === ' ') { e.preventDefault(); action(); } if (k === 'p') pause(); if (k === 'r') { seed++; reset(); } }
};
canvas.addEventListener('wheel', e => { if (slug !== 'golden-spiral') return; e.preventDefault(); updateParameter('b', b * Math.exp(-e.deltaY * .002)); }, { passive: false });
window.addEventListener('keyup', e => held.delete(e.key));
$('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('#stage').requestFullscreen) await $('#stage').requestFullscreen(); else $('#fullscreen').textContent = 'Unavailable'; } catch { $('#fullscreen').textContent = 'Unavailable'; } };
$('#save').onclick = () => { draw(); canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `levitated-${slug}-${seed}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }); };
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.max(0, Math.min(.06, (now - last) / 1000)); last = now; if (!visible || !ctx) return;
  if (ik && held.size) { if (selected < 0) selected = 0; const n = model.nodes[selected]; if (n) { n.x += (+held.has('ArrowRight') - +held.has('ArrowLeft')) * dt * 80; n.y += (+held.has('ArrowDown') - +held.has('ArrowUp')) * dt * 80; model.constrain(selected); dirty = true; } }
  if (!paused) { accumulator += dt; const interval = ik ? 1 / 60 : 1 / 30; while (accumulator >= interval) { tick(); accumulator -= interval; } }
  if (dirty && now - lastDraw > 1000 / 30) { draw(); lastDraw = now; }
}
if (!ctx) $('#count').textContent = 'Canvas is unavailable in this browser.';
reset(); resize(); draw(); requestAnimationFrame(frame);
