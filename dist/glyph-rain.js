// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// An original falling-script artwork. Every glyph is an invented vector stroke
// pattern generated from a seed; no fonts, characters or external assets.
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function random(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
// Integer hash for per-column and per-cell choices; stable across frames.
export function cellHash(...values) {
  let h = 2166136261;
  for (const v of values) { h = Math.imul(h ^ (v | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
  return (h >>> 0) / 4294967296;
}
export const glyphScripts = ['Stem runes', 'Circuit marks', 'Pinhole code', 'Shard angles'];
const NODE_X = [0, .5, 1], NODE_Y = [0, 1 / 3, 2 / 3, 1];
const node = (i, j) => [NODE_X[i], NODE_Y[j]];
// Each glyph is { lines: [[x1, y1, x2, y2]], dots: [[x, y]] } inside a unit box.
export function glyphAlphabet(script = 0, seed = 1, size = 48) {
  const rng = random(cellHash(script, seed, 977) * 4294967296), pick = n => Math.floor(rng() * n), glyphs = [], seen = new Set();
  for (let attempt = 0; glyphs.length < size && attempt < size * 20; attempt++) {
    const lines = [], dots = [], add = (a, b) => { if (a[0] !== b[0] || a[1] !== b[1]) lines.push([...a, ...b]); };
    if (script % 4 === 0) {
      // Stem runes: a vertical spine with two or three branching strokes.
      const stem = pick(3), top = pick(2), bottom = 2 + pick(2); add(node(stem, top), node(stem, bottom));
      for (let k = 3 + pick(2); k > 0; k--) { const i = pick(3), j = pick(4), di = pick(3) - 1, dj = pick(3) - 1; add(node(i, j), node(clamp(i + di, 0, 2), clamp(j + dj, 0, 3))); }
    } else if (script % 4 === 1) {
      // Circuit marks: an orthogonal trace that ends in a solder pad.
      let i = pick(3), j = pick(4); dots.push(node(i, j));
      for (let k = 2 + pick(3); k > 0; k--) { const horizontal = rng() < .5, ni = horizontal ? clamp(i + (rng() < .5 ? -1 : 1), 0, 2) : i, nj = horizontal ? j : clamp(j + (rng() < .5 ? -1 : 1), 0, 3); add(node(i, j), node(ni, nj)); i = ni; j = nj; }
      dots.push(node(i, j));
    } else if (script % 4 === 2) {
      // Pinhole code: a sparse 3 × 4 punch pattern with one optional dash.
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) if (rng() < .42) dots.push(node(i, j));
      if (dots.length < 3) dots.push(node(pick(3), pick(4)), node(pick(3), pick(4)));
      if (rng() < .4) { const j = pick(4); add(node(0, j), node(2, j)); }
    } else {
      // Shard angles: crossing diagonals braced by a horizontal bar.
      for (let k = 2 + pick(2); k > 0; k--) { const i = pick(2), j = pick(3); add(node(i, j), node(i + 1, j + 1 + pick(Math.min(2, 3 - j)))); }
      const j = pick(4); add(node(pick(2), j), node(2, j));
    }
    const key = JSON.stringify([lines, dots]);
    if ((lines.length || dots.length) && !seen.has(key)) { seen.add(key); glyphs.push({ lines, dots }); }
  }
  return glyphs;
}
const palettes = [
  { name: 'Tidepool', bg: ['#04121a', '#010409'], hue: 186, sat: 82, head: '#eafffb', lens: 318 },
  { name: 'Ember', bg: ['#170805', '#050102'], hue: 18, sat: 88, head: '#fff1dc', lens: 196 },
  { name: 'Orchid', bg: ['#120719', '#040108'], hue: 286, sat: 68, head: '#fbeaff', lens: 52 },
  { name: 'Gilded', bg: ['#110e04', '#030201'], hue: 44, sat: 82, head: '#fffbe8', lens: 204 },
  { name: 'Frost', bg: ['#08101c', '#020409'], hue: 214, sat: 46, head: '#ffffff', lens: 168 }
];
export const RAIN_RATE = 9; // glyph rows per second at Fall speed 1 and column speed 1
// Column geometry for one depth layer; pure function of canvas size and state.
export function rainLayout(width, height, columns, zoom = 1, layer = 1) {
  const portrait = width < height, base = clamp(Math.round(columns / clamp(zoom, .4, 2.4) * (portrait ? .62 : 1)), 6, 180);
  const count = layer ? base : Math.min(260, Math.round(base * 1.6)), cellW = width / count, cellH = cellW * 1.3;
  return { count, cellW, cellH, rows: Math.ceil(height / cellH) + 1 };
}
// Per-column drop parameters. Two drops share each column at different speeds.
export function rainColumn(seed, layer, col, rows) {
  const h = k => cellHash(seed, layer, col, k);
  return [0, 1].map(d => {
    const length = Math.round(9 + h(d * 7 + 1) * (layer ? 26 : 16)), gap = Math.round(3 + h(d * 7 + 2) * rows * .7);
    return { speed: .55 + h(d * 7 + 3) * .95, length, period: rows + length + gap, phase: h(d * 7 + 4) + d * .5 };
  });
}
// The continuous row of a drop's head after `fall` rows of travel.
export function headRow(drop, fall) { return ((drop.phase * drop.period + fall * drop.speed) % drop.period + drop.period) % drop.period - drop.length * .2; }
export function createGlyphRainScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  let fall = null, alphabetKey = '', alphabet = [];
  const LEVELS = 6;
  function prime(s) { if (fall === null) fall = (s.time || 0) * s.a * RAIN_RATE; }
  function step(s, dt = 1 / 60) { prime(s); fall += clamp(dt, 0, .1) * s.a * RAIN_RATE; return true; }
  function glyphs(s) {
    const key = `${(s.script ?? 0) % 4}:${s.seed}`;
    if (key !== alphabetKey) { alphabet = glyphAlphabet((s.script ?? 0) % 4, s.seed, 48); alphabetKey = key; }
    return alphabet;
  }
  function draw(s) {
    prime(s);
    const W = canvas.width, H = canvas.height, unit = Math.min(W, H), p = palettes[s.palette % palettes.length], set = glyphs(s);
    const slant = clamp(Math.sin((s.yaw ?? .3) - .3), -.8, .8) * .45;
    const px = (clamp(s.pointer?.[0] ?? 0, -1, 1) + 1) / 2 * W, py = (clamp(s.pointer?.[1] ?? 0, -1, 1) + 1) / 2 * H, lensOn = s.lens !== false, reach = unit * clamp(s.lensSize ?? .2, .02, 1);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, p.bg[0]); bg.addColorStop(1, p.bg[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (lensOn) { const halo = ctx.createRadialGradient(px, py, 0, px, py, reach * 1.4); halo.addColorStop(0, `hsla(${p.lens},80%,60%,.16)`); halo.addColorStop(1, `hsla(${p.lens},80%,60%,0)`); ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H); }
    let total = 0, columns = 0;
    for (const layer of [0, 1]) {
      const { count, cellW, cellH, rows } = rainLayout(W, H, s.b, s.zoom ?? 1, layer); if (layer) columns = count;
      const extra = Math.ceil(Math.abs(slant) * H / 2 / cellW) + 1, gw = cellW * (layer ? .66 : .52), gh = cellH * (layer ? .68 : .56);
      // Buckets: one path per brightness level keeps draw calls constant.
      const buckets = Array.from({ length: LEVELS + 2 }, () => ({ lines: [], dots: [] }));
      for (let col = -extra; col < count + extra; col++) {
        const drops = rainColumn(s.seed, layer, col, rows), x0 = (col + .5) * cellW;
        for (const drop of drops) {
          const head = headRow(drop, fall), first = Math.max(0, Math.floor(head - drop.length) + 1), last = Math.min(rows, Math.floor(head));
          for (let row = first; row <= last; row++) {
            const behind = head - row; if (behind < 0 || behind > drop.length) continue;
            const isHead = behind < 1, y = isHead ? head * cellH : (row + .5) * cellH;
            let x = x0 + (y - H / 2) * slant;
            const dx = x - px, dy = y - py, d = Math.hypot(dx, dy), w = lensOn && d < reach ? (1 - (d / reach) ** 2) ** 2 : 0;
            x += Math.sign(dx || 1) * w * reach * (layer ? .38 : .22);
            if (x < -cellW || x > W + cellW || y < -cellH || y > H + cellH) continue;
            const rate = .35 + cellHash(col, row, layer, 5) * 1.6, glyph = set[Math.floor(cellHash(s.seed, layer, col, row, Math.floor(fall * (isHead ? 6 : rate) / 4 + cellHash(col, row, 3) * 9)) * set.length)];
            const fade = (1 - behind / drop.length) ** 1.4, bucket = isHead ? LEVELS : w > .35 && layer ? LEVELS + 1 : clamp(Math.ceil(fade * LEVELS) - 1, 0, LEVELS - 1);
            buckets[bucket].lines.push([glyph, x - gw / 2, y - gh / 2]); total++;
          }
        }
      }
      const width = Math.max(.6, cellW * (layer ? .095 : .065));
      for (let level = 0; level < buckets.length; level++) {
        const items = buckets[level].lines; if (!items.length) continue;
        const head = level === LEVELS, lens = level === LEVELS + 1, alpha = (layer ? 1 : .42) * (head ? 1 : lens ? .95 : .14 + .8 * ((level + 1) / LEVELS) ** 1.3);
        const color = head ? p.head : lens ? `hsla(${p.lens},90%,74%,${alpha.toFixed(3)})` : `hsla(${p.hue + level * 3},${p.sat}%,${30 + level * 7}%,${alpha.toFixed(3)})`;
        const passes = head && layer ? [[3.4, `hsla(${p.hue},95%,80%,.22)`], [1, color]] : [[1, color]];
        for (const [scale, style] of passes) {
          const glow = scale > 1;
          ctx.beginPath();
          for (const [g, gx, gy] of items) for (const [x1, y1, x2, y2] of g.lines) { ctx.moveTo(gx + x1 * gw, gy + y1 * gh); ctx.lineTo(gx + x2 * gw, gy + y2 * gh); }
          ctx.strokeStyle = style; ctx.lineWidth = width * scale; ctx.stroke();
          if (glow) continue; // Bloom only widens strokes; dots stay crisp.
          ctx.beginPath(); const r = width * .9;
          for (const [g, gx, gy] of items) for (const [x, y] of g.dots) { const cx = gx + x * gw, cy = gy + y * gh; ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy - r); ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx - r, cy + r); ctx.closePath(); }
          ctx.fillStyle = style; ctx.fill();
        }
      }
    }
    // A thin vignette keeps the edges quiet without a hard frame.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, unit * .35, W / 2, H / 2, Math.hypot(W, H) * .62); vignette.addColorStop(0, `${p.bg[1]}00`); vignette.addColorStop(1, `${p.bg[1]}cc`); ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    return `${columns} columns · ${glyphScripts[(s.script ?? 0) % 4]} · ${p.name} · ${total} glyphs`;
  }
  return { draw, step, get fall() { return fall; } };
}
export { palettes as rainPalettes };

// ---- Input mapping: drive any parameter from a slider, the pointer or the microphone level.
export const driveSources = [['slider', 'Slider'], ['mouse-x', 'Mouse X'], ['mouse-y', 'Mouse Y'], ['audio', 'Audio level']];
// signals: { x, y, audio } each 0..1 (y is 1 at the top). Returns the fallback for 'slider'.
export function driveValue(source, min, max, signals, fallback, step = 0) {
  const t = source === 'mouse-x' ? signals.x : source === 'mouse-y' ? signals.y : source === 'audio' ? signals.audio : null;
  if (t == null || !Number.isFinite(t)) return fallback;
  const v = min + (max - min) * clamp(t, 0, 1);
  return step >= 1 ? Math.round(v / step) * step : v;
}
// Auto-gained microphone loudness, smoothed with a fast attack and slow release.
export function createLoudness() {
  let peak = .02, level = 0;
  return { get level() { return level; }, push(rms, dt = 1 / 60) {
    peak = Math.max(rms, peak * Math.exp(-dt * .35), .02);
    const target = clamp(rms / peak, 0, 1); level += (target - level) * (1 - Math.exp(-dt * (target > level ? 30 : 6)));
    return level;
  } };
}
// Adds lens controls and per-parameter "Drive" menus to the wild player panel.
// Needs a real DOM; returns null when one is not available (tests, old browsers).
export function createRainInputs({ document, anchor, state, ranges, onStatus = () => {} }) {
  if (!anchor?.before || !document?.createElement) return null;
  const make = (tag, props = {}) => Object.assign(document.createElement(tag), props), sources = {}, controls = {};
  let audio = null, starting = null; const loud = createLoudness(), buffer = new Float32Array(1024);
  function menu(key) {
    const select = make('select', { className: 'drive', title: 'Drive this parameter from an input' });
    select.setAttribute('aria-label', `Drive ${ranges[key][0]} with`);
    for (const [value, label] of driveSources) select.append(make('option', { value, textContent: label === 'Slider' ? 'Drive: slider' : `Drive: ${label}` }));
    select.addEventListener('change', () => choose(key, select.value)); sources[key] = 'slider'; return select;
  }
  function attach(key, input, output) { controls[key] = { input, output, select: menu(key) }; input.parentNode.append(controls[key].select); }
  for (const key of ['a', 'b']) attach(key, document.querySelector(`#param-${key}`), document.querySelector(`#value-${key}`));
  // Lens size slider.
  const [label, min, max, step, value] = ranges.lensSize, lensLabel = make('label'), out = make('output'), slider = make('input', { type: 'range', min, max, step, value });
  lensLabel.append(make('span', { textContent: label }), out, slider); anchor.before(lensLabel); attach('lensSize', slider, out);
  const show = () => { out.textContent = (+state.lensSize).toFixed(2); };
  slider.addEventListener('input', () => { state.lensSize = +slider.value; show(); onStatus(); }); state.lensSize = value; show();
  // Lens on/off.
  const toggle = make('label', { className: 'lens-toggle' }), box = make('input', { type: 'checkbox', checked: state.lens !== false });
  toggle.append(box, make('span', { textContent: 'Show lens' })); anchor.before(toggle);
  box.addEventListener('change', () => { state.lens = box.checked; onStatus(); });
  async function startAudio() {
    if (audio || starting) return starting;
    starting = (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const context = new (globalThis.AudioContext || globalThis.webkitAudioContext)(), analyser = context.createAnalyser(); analyser.fftSize = buffer.length;
      context.createMediaStreamSource(stream).connect(analyser); audio = { stream, context, analyser };
    })().catch(() => { for (const key in sources) if (sources[key] === 'audio') { controls[key].select.value = 'slider'; choose(key, 'slider'); } onStatus('Microphone unavailable — check permission'); }).finally(() => { starting = null; });
    return starting;
  }
  function stopAudio() { if (!audio) return; audio.stream.getTracks().forEach(t => t.stop()); audio.context.close?.(); audio = null; }
  function choose(key, source) {
    sources[key] = source; controls[key].input.disabled = source !== 'slider';
    if (source === 'audio') startAudio();
    if (!Object.values(sources).includes('audio')) stopAudio();
    onStatus();
  }
  function update(dt) {
    let rms = 0;
    if (audio) { audio.analyser.getFloatTimeDomainData(buffer); for (const v of buffer) rms += v * v; rms = Math.sqrt(rms / buffer.length); loud.push(rms, dt); }
    const signals = { x: (state.pointer[0] + 1) / 2, y: 1 - (state.pointer[1] + 1) / 2, audio: audio ? loud.level : null };
    let changed = false;
    for (const key in sources) {
      if (sources[key] === 'slider') continue;
      const [, lo, hi, st] = ranges[key], next = driveValue(sources[key], lo, hi, signals, state[key], st);
      if (next === state[key]) continue;
      state[key] = next; controls[key].input.value = next; controls[key].output.textContent = next.toFixed(st >= 1 ? 0 : 2); changed = true;
    }
    return changed;
  }
  return { update, sources, get level() { return audio ? loud.level : null; }, stop: stopAudio };
}
