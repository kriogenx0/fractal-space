/* MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt. */
/* Site-wide global parameters P1–P3, shared by every experiment page.
   Two layers:
   1. Site-wide: each global parameter reads one input — a song's bass, mids
      or highs, mouse X or Y, the time of day, or a 20-second loop. Changing an
      input here changes every experiment at once.
   2. Per experiment: the experiment's own parameters (its range sliders, plus
      canvas pulse, hue and glow) are bound to P1–P3 by default, and each
      binding can be re-pointed or scaled.
   The song is the bundled Go Away Robot track or a local file. Nothing loads,
   plays or moves until the visitor starts a song or picks a live input. */
(() => {
  'use strict';
  const DEMO = { src: 'audio/go-away-robot-christmas-batman.mp3', title: 'Christmas Batman', artist: 'Go Away Robot' };
  const BANDS = [
    { key: 'bass', name: 'Bass', lo: 20, hi: 250 },
    { key: 'mids', name: 'Mids', lo: 250, hi: 2000 },
    { key: 'highs', name: 'Highs', lo: 2000, hi: 12000 }
  ];
  const INPUTS = [
    { key: 'none', name: 'Nothing' },
    ...BANDS.map(b => ({ key: b.key, name: 'Song ' + b.name.toLowerCase(), audio: true })),
    { key: 'mouseX', name: 'Mouse X' },
    { key: 'mouseY', name: 'Mouse Y' },
    { key: 'clock', name: 'Time of day' },
    { key: 'loop', name: '20-second loop' }
  ];
  const PARAMS = ['P1', 'P2', 'P3'];
  const GLOBAL_DEFAULTS = { P1: 'bass', P2: 'mids', P3: 'highs' };
  const EFFECTS = { 'fx:pulse': 'Canvas pulse', 'fx:hue': 'Canvas hue', 'fx:glow': 'Canvas glow' };
  const LOOP_SECONDS = 20;
  const GLOBAL_KEY = 'fs-global-params';

  /* ---------- pure helpers (exported for tests) ---------- */
  function bandRange(lo, hi, sampleRate, fftSize) {
    const binHz = sampleRate / fftSize, bins = fftSize / 2;
    const a = Math.max(1, Math.floor(lo / binHz)), b = Math.min(bins - 1, Math.ceil(hi / binHz));
    return [a, Math.max(a, b)];
  }
  function bandLevel(data, [a, b]) {
    let sum = 0;
    for (let i = a; i <= b; i++) sum += data[i];
    return sum / ((b - a + 1) * 255);
  }
  /* Auto-gain envelope: fast attack, slower release, normalized by a decaying
     peak so quiet and loud songs both use the full 0..1 range. */
  function follow(state, raw, dt) {
    state.peak = Math.max(raw, state.peak * Math.exp(-dt / 4), 0.08);
    const target = Math.min(1, raw / state.peak);
    const rate = target > state.value ? 1 - Math.exp(-dt / 0.03) : 1 - Math.exp(-dt / 0.18);
    state.value += (target - state.value) * rate;
    return state.value;
  }
  const timeOfDay = date => (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000) / 86400;
  /* Smooth 0→1→0 over the loop, so bound parameters never jump at the seam. */
  const loopPhase = (ms, seconds = LOOP_SECONDS) => 0.5 - 0.5 * Math.cos(2 * Math.PI * ((ms / 1000) % seconds) / seconds);
  /* amount is −1..1: a full-scale parameter adds |amount| of the slider's span. */
  const modulate = (base, level, amount, min, max) => Math.min(max, Math.max(min, base + level * amount * (max - min)));
  /* Default bindings: P1 pulses the canvas, P2 and P3 drive the first two
     sliders; with fewer sliders they fall back to canvas hue and glow. */
  function defaultBindings(sliderCount) {
    return [
      { param: 'P1', target: 'fx:pulse', amount: 0.6 },
      { param: 'P2', target: sliderCount > 0 ? 'slider:0' : 'fx:hue', amount: sliderCount > 0 ? 0.35 : 0.5 },
      { param: 'P3', target: sliderCount > 1 ? 'slider:1' : 'fx:glow', amount: sliderCount > 1 ? 0.35 : 0.5 }
    ];
  }
  const api = { bandRange, bandLevel, follow, modulate, timeOfDay, loopPhase, defaultBindings, BANDS, INPUTS, PARAMS, GLOBAL_DEFAULTS, DEMO, LOOP_SECONDS };
  if (typeof window === 'undefined' || typeof document === 'undefined') { if (typeof module !== 'undefined') module.exports = api; return; }
  window.FractalSignals = api;

  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const write = (key, value) => { try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const inputKeys = new Set(INPUTS.map(i => i.key)), audioKeys = new Set(BANDS.map(b => b.key));

  /* Layer 1: site-wide inputs for P1–P3. */
  const globals = { ...GLOBAL_DEFAULTS };
  function loadGlobals() {
    const saved = read(GLOBAL_KEY) || {};
    for (const p of PARAMS) globals[p] = inputKeys.has(saved[p]) ? saved[p] : GLOBAL_DEFAULTS[p];
  }
  loadGlobals();

  /* Layer 2: this experiment's bindings to P1–P3. Unsaved means "use defaults". */
  const family = location.pathname.replace(/^\/_pages\/([^/]+)\/.*/, '/$1.html');
  // Experiments can switch works in place, so the key follows the current URL.
  const bindingKey = () => { const work = new URLSearchParams(location.search).get('work'); return 'fs-bindings:' + family + (work ? '?' + work : ''); };
  let customKey = bindingKey();
  const loadCustom = () => {
    const saved = read(customKey);
    return Array.isArray(saved) ? saved.filter(b => b && PARAMS.includes(b.param) && typeof b.target === 'string').map(b => ({ param: b.param, target: b.target, amount: Math.max(-1, Math.min(1, Number(b.amount) || 0)) })) : null;
  };
  let custom = loadCustom();
  const bindings = () => {
    if (customKey !== bindingKey()) { reset(); customKey = bindingKey(); custom = loadCustom(); if (!panel.hidden) render(); }
    return custom || defaultBindings(sliders().length);
  };
  const edit = () => { if (!custom) custom = structuredClone(bindings()); return custom; };
  const saveBindings = () => write(customKey, custom);

  /* ---------- live values ---------- */
  const inputs = Object.fromEntries(INPUTS.map(i => [i.key, 0]));
  inputs.mouseX = inputs.mouseY = 0.5;
  const env = Object.fromEntries(BANDS.map(b => [b.key, { peak: 0.08, value: 0 }]));
  const pointer = { x: 0.5, y: 0.5 };
  addEventListener('pointermove', e => { pointer.x = e.clientX / Math.max(1, innerWidth); pointer.y = e.clientY / Math.max(1, innerHeight); }, { passive: true });
  const paramValue = p => inputs[globals[p]] || 0;

  let ctx = null, analyser = null, data = null, ranges = null, objectURL = null;
  let raf = 0, last = 0, running = false, canvas = null, sliderClock = 0;
  const bases = new Map(); // slider -> value the visitor chose; parameters modulate around it

  /* ---------- interface ---------- */
  const root = document.createElement('div');
  root.className = 'fs-signals';
  root.innerHTML = `<button class="fs-signals-toggle" type="button" aria-expanded="false" aria-controls="fs-signals-panel" title="Drive this experiment with a song, the mouse, the clock or a loop">♫ <span>P1 P2 P3</span></button>
<section class="fs-signals-panel" id="fs-signals-panel" aria-label="Global parameters" hidden>
  <div class="fs-signals-head"><strong>Global parameters</strong><button class="fs-signals-close" type="button" aria-label="Close parameters panel">×</button></div>
  <div class="fs-signals-sources">
    <button class="fs-signals-demo" type="button">▶ ${DEMO.title} <small>${DEMO.artist}</small></button>
    <button class="fs-signals-upload" type="button">Upload song…</button>
    <input class="fs-signals-file" type="file" accept="audio/*" hidden>
  </div>
  <div class="fs-signals-transport"><button class="fs-signals-play" type="button" disabled>Pause</button><button class="fs-signals-stop" type="button" disabled>Stop</button><span class="fs-signals-status" role="status" aria-live="polite">No song playing.</span></div>
  <audio class="fs-signals-audio" preload="none" hidden></audio>
  <h3>Inputs <small>all experiments</small></h3>
  <ol class="fs-signals-globals">${PARAMS.map(p => `<li data-param="${p}"><b>${p}</b><label><span class="fs-sr">${p} input</span><select>${INPUTS.map(i => `<option value="${i.key}">${i.name}</option>`).join('')}</select></label><span class="fs-signals-meter"><span></span></span></li>`).join('')}</ol>
  <h3>Bindings <small>this experiment</small></h3>
  <ol class="fs-signals-map"></ol>
  <div class="fs-signals-actions"><button class="fs-signals-add" type="button">+ Add binding</button><button class="fs-signals-reset" type="button">Defaults</button><button class="fs-signals-clear" type="button">Clear</button></div>
  <p class="fs-signals-note">Bass to 250 Hz, mids to 2 kHz, highs to 12 kHz. Negative amounts invert. Everything runs in your browser; uploaded songs never leave it.</p>
</section>`;
  const $ = s => root.querySelector(s);
  const panel = $('.fs-signals-panel'), toggle = $('.fs-signals-toggle'), status = $('.fs-signals-status'), list = $('.fs-signals-map');
  const playBtn = $('.fs-signals-play'), stopBtn = $('.fs-signals-stop'), fileInput = $('.fs-signals-file'), element = $('.fs-signals-audio');

  function sliders() {
    return [...document.querySelectorAll('input[type="range"]')].filter(s => !root.contains(s) && !s.disabled && s.getClientRects().length);
  }
  function sliderName(s) {
    const label = s.labels?.[0] || s.closest('label');
    let text = s.getAttribute('aria-label') || '';
    if (!text && label) { const clone = label.cloneNode(true); clone.querySelectorAll('output,input,select').forEach(n => n.remove()); text = clone.textContent; }
    return (text || s.id || 'Slider').replace(/\s+/g, ' ').trim().slice(0, 32);
  }
  const resolve = target => target?.startsWith('slider:') ? sliders()[Number(target.slice(7))] || null : null;

  function render() {
    for (const li of root.querySelectorAll('.fs-signals-globals li')) li.querySelector('select').value = globals[li.dataset.param];
    const targets = [['none', 'Nothing'], ...Object.entries(EFFECTS), ...sliders().map((s, i) => ['slider:' + i, sliderName(s)])];
    list.replaceChildren(...bindings().map((b, i) => {
      const li = document.createElement('li'); li.dataset.index = i;
      li.innerHTML = `<label><span class="fs-sr">Parameter</span><select data-field="target"></select></label>
<span class="fs-signals-arrow" aria-hidden="true">←</span>
<label><span class="fs-sr">Driven by</span><select data-field="param">${PARAMS.map(p => `<option>${p}</option>`).join('')}</select></label>
<label><span class="fs-sr">Amount</span><input data-field="amount" type="range" min="-1" max="1" step="0.01"></label>
<button type="button" class="fs-signals-remove" aria-label="Remove binding">×</button>`;
      const target = li.querySelector('[data-field="target"]');
      const options = targets.some(([v]) => v === b.target) ? targets : [...targets, [b.target, 'Unavailable here']];
      target.replaceChildren(...options.map(([v, t]) => new Option(t, v)));
      target.value = b.target;
      li.querySelector('[data-field="param"]').value = b.param;
      li.querySelector('[data-field="amount"]').value = b.amount;
      return li;
    }));
  }
  function reset() { restoreSliders(); clearEffects(); }
  root.querySelector('.fs-signals-globals').addEventListener('change', e => {
    const p = e.target.closest('li')?.dataset.param; if (!p) return;
    reset(); globals[p] = e.target.value; write(GLOBAL_KEY, globals); syncEngine();
  });
  // Another tab changed the site-wide inputs.
  addEventListener('storage', e => { if (e.key === GLOBAL_KEY) { loadGlobals(); if (!panel.hidden) render(); syncEngine(); } });
  list.addEventListener('change', e => {
    const li = e.target.closest('li'), field = e.target.dataset.field; if (!li || !field || field === 'amount') return;
    reset(); edit()[li.dataset.index][field] = e.target.value; saveBindings(); syncEngine();
  });
  list.addEventListener('input', e => {
    const li = e.target.closest('li'); if (li && e.target.dataset.field === 'amount') { edit()[li.dataset.index].amount = Number(e.target.value); saveBindings(); syncEngine(); }
  });
  list.addEventListener('click', e => {
    const li = e.target.closest('.fs-signals-remove')?.closest('li'); if (!li) return;
    reset(); edit().splice(Number(li.dataset.index), 1); saveBindings(); render(); syncEngine();
  });
  $('.fs-signals-add').addEventListener('click', () => {
    edit().push({ param: 'P1', target: sliders().length ? 'slider:0' : 'fx:hue', amount: 0.3 }); saveBindings(); render(); syncEngine();
    list.lastElementChild?.querySelector('select')?.focus();
  });
  $('.fs-signals-reset').addEventListener('click', () => { reset(); custom = null; saveBindings(); render(); syncEngine(); });
  $('.fs-signals-clear').addEventListener('click', () => { reset(); custom = []; saveBindings(); render(); syncEngine(); });

  // A visitor moving a bound slider sets the new resting value the parameters modulate around.
  document.addEventListener('input', e => { if (e.isTrusted && e.target.type === 'range' && bases.has(e.target)) bases.set(e.target, Number(e.target.value)); }, true);

  function open(state) {
    panel.hidden = !state; toggle.setAttribute('aria-expanded', String(state)); root.classList.toggle('open', state);
    if (state) { render(); paintMeters(); }
    syncEngine();
  }
  toggle.addEventListener('click', () => open(panel.hidden));
  $('.fs-signals-close').addEventListener('click', () => { open(false); toggle.focus(); });
  // Keep the artwork's keyboard and pointer shortcuts from firing while using the panel.
  for (const type of ['keydown', 'keyup', 'keypress']) panel.addEventListener(type, e => {
    e.stopPropagation();
    if (type === 'keydown' && e.key === 'Escape') { open(false); toggle.focus(); }
  });
  for (const type of ['pointerdown', 'mousedown', 'touchstart', 'wheel', 'click']) root.addEventListener(type, e => e.stopPropagation(), { passive: true });

  /* ---------- audio ---------- */
  function ensureGraph() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('This browser has no Web Audio support.');
    ctx = new AC();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.6;
    data = new Uint8Array(analyser.frequencyBinCount);
    ranges = Object.fromEntries(BANDS.map(b => [b.key, bandRange(b.lo, b.hi, ctx.sampleRate, analyser.fftSize)]));
    ctx.createMediaElementSource(element).connect(analyser);
    analyser.connect(ctx.destination);
  }
  async function play(src, label) {
    try {
      ensureGraph();
      if (element.getAttribute('src') !== src) element.src = src;
      await ctx.resume();
      await element.play();
      status.textContent = 'Playing ' + label;
      playBtn.disabled = stopBtn.disabled = false; playBtn.textContent = 'Pause';
      syncEngine();
    } catch (err) {
      status.textContent = err?.name === 'NotSupportedError' ? 'Your browser cannot play that file.' : 'Could not play: ' + (err?.message || err);
    }
  }
  $('.fs-signals-demo').addEventListener('click', () => play(DEMO.src, `“${DEMO.title}” by ${DEMO.artist}`));
  $('.fs-signals-upload').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]; if (!file) return;
    const previous = objectURL; objectURL = URL.createObjectURL(file);
    play(objectURL, file.name.replace(/\.[^.]+$/, '')).then(() => { if (previous) URL.revokeObjectURL(previous); });
    fileInput.value = '';
  });
  playBtn.addEventListener('click', () => {
    if (element.paused) { ctx?.resume(); element.play().then(() => { playBtn.textContent = 'Pause'; status.textContent = 'Playing.'; syncEngine(); }); }
    else { element.pause(); playBtn.textContent = 'Play'; }
  });
  stopBtn.addEventListener('click', () => {
    element.pause(); element.currentTime = 0;
    playBtn.disabled = stopBtn.disabled = true; playBtn.textContent = 'Pause';
    status.textContent = 'Stopped.';
  });
  element.addEventListener('ended', () => { playBtn.textContent = 'Play'; status.textContent = 'Song ended.'; });
  element.addEventListener('pause', () => { if (!element.ended && element.currentTime) status.textContent = 'Paused.'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !element.paused) { element.pause(); playBtn.textContent = 'Play'; } });

  /* ---------- driving the artwork ---------- */
  function findCanvas() {
    const all = [...document.querySelectorAll('canvas')].filter(c => !root.contains(c) && c.getClientRects().length);
    return all.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0] || null;
  }
  function clearEffects() { if (canvas) { canvas.style.transform = ''; canvas.style.filter = ''; } }
  function restoreSliders() {
    for (const [s, v] of bases) { s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); }
    bases.clear();
  }
  function paintMeters() {
    for (const li of root.querySelectorAll('.fs-signals-globals li')) li.querySelector('.fs-signals-meter span').style.transform = `scaleX(${paramValue(li.dataset.param).toFixed(3)})`;
  }
  /* The engine runs while the panel is open, a song plays, or a P reads an
     always-live input (mouse, clock, loop). Otherwise the page is left alone. */
  const liveInput = () => PARAMS.some(p => globals[p] !== 'none' && !audioKeys.has(globals[p]));
  const needsEngine = () => !panel.hidden || !element.paused || (liveInput() && bindings().some(b => b.target !== 'none' && b.amount));
  function syncEngine() {
    if (needsEngine()) { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); } }
    else if (running) { running = false; cancelAnimationFrame(raf); reset(); }
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const playing = ctx && !element.paused;
    if (playing) analyser.getByteFrequencyData(data);
    for (const b of BANDS) inputs[b.key] = follow(env[b.key], playing ? bandLevel(data, ranges[b.key]) : 0, dt);
    const ease = 1 - Math.exp(-dt / 0.08);
    inputs.mouseX += (pointer.x - inputs.mouseX) * ease;
    inputs.mouseY += (pointer.y - inputs.mouseY) * ease;
    inputs.clock = timeOfDay(new Date());
    inputs.loop = loopPhase(performance.now());
    if (!panel.hidden) paintMeters();

    canvas = canvas?.isConnected && canvas.getClientRects().length ? canvas : findCanvas();
    let scale = 1, hue = 0, glow = 0;
    const drive = new Map();
    for (const b of bindings()) {
      const v = paramValue(b.param) * b.amount;
      if (!v) continue;
      if (b.target === 'fx:pulse') scale += v * 0.12;
      else if (b.target === 'fx:hue') hue += v * 180;
      else if (b.target === 'fx:glow') glow += v;
      else { const s = resolve(b.target); if (s) drive.set(s, (drive.get(s) || 0) + v); }
    }
    if (canvas) {
      canvas.style.transform = scale !== 1 ? `scale(${Math.max(0.5, scale).toFixed(4)})` : '';
      const g = Math.max(-0.9, glow);
      canvas.style.filter = hue || g ? `hue-rotate(${hue.toFixed(1)}deg) brightness(${(1 + g * 0.55).toFixed(3)}) saturate(${(1 + g * 0.6).toFixed(3)})` : '';
    }
    // Sliders often rebuild geometry, so update them at ~30 fps and only on a visible change.
    if (now - sliderClock >= 33) {
      sliderClock = now;
      for (const [s, v] of bases) if (!drive.has(s)) { s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); bases.delete(s); }
      for (const [s, v] of drive) {
        if (!bases.has(s)) bases.set(s, Number(s.value));
        const min = Number(s.min || 0), max = Number(s.max || 100), step = Number(s.step) || (max - min) / 100;
        const next = modulate(bases.get(s), v, 1, min, max);
        if (Math.abs(next - Number(s.value)) >= step * 0.999) { s.value = next; s.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    }
    if (needsEngine()) raf = requestAnimationFrame(tick); else { running = false; reset(); }
  }

  const mount = () => { document.body.append(root); syncEngine(); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
