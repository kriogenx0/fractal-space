// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Screensaver mode: a new experiment every period (one minute by default,
// aligned to the wall clock). During each period, elapsed time 0 → 60 s sweeps
// one of that experiment's sliders from its minimum to its maximum.
//
// Query options:
//   seconds=60        length of each experiment, 10–3600
//   caption=fade      fade (show for a few seconds after each switch), always, or off
//   work=math/torus   only cycle these works (comma separated player/slug)
//   param=random      random, first, or a slider id such as param-b
const $ = query => document.querySelector(query);
const options = new URLSearchParams(location.search);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const period = clamp(Number(options.get('seconds')) || 60, 10, 3600) * 1000;
const captionMode = options.get('caption') ?? 'fade';
const paramMode = options.get('param') ?? 'random';
const frames = [$('#frame-a'), $('#frame-b')];
// Interactive pieces that need a microphone, a player, or scrolling stay out.
const playable = /^(experiment|fractal|math|levitated|wild)\.html\?work=[a-z0-9-]+$/;

let works = [], queue = [], active = null, loading = null, currentSlot = null, captionTimer = 0;

const shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };

async function catalog() {
  const requested = options.get('work');
  if (requested) return requested.split(',').map(item => item.trim()).filter(Boolean).map(item => `../${item.includes('.html') ? item : item.replace('/', '.html?work=')}`);
  const html = await (await fetch('../', { cache: 'no-cache' })).text();
  const found = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replace(/&amp;/g, '&')).filter(href => playable.test(href));
  return [...new Set(found)].map(href => `../${href}`);
}

function nextWork() {
  if (!queue.length) {
    queue = shuffle([...works]);
    // Never show the same work twice in a row across reshuffles.
    if (queue.length > 1 && active && queue[0] === active.href) queue.push(queue.shift());
  }
  return queue.shift();
}

const saverCSS = `
html,body{overflow:hidden!important;cursor:none!important;background:#000!important}
body *{visibility:hidden!important;cursor:none!important}
canvas[data-screensaver]{visibility:visible!important;position:fixed!important;inset:0!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;transform:none!important;z-index:2147483646!important}`;

function prepare(frame) {
  const doc = frame.contentDocument, win = frame.contentWindow;
  if (!doc?.body) return null;
  // Read the title before hiding the page: innerText skips invisible text.
  const title = doc.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim() || doc.title.split(' — ')[0];
  // Show the largest canvas alone, full bleed, and hide every control and caption.
  const canvases = [...doc.querySelectorAll('canvas')];
  const canvas = canvases.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
  canvas?.setAttribute('data-screensaver', '');
  const style = doc.createElement('style');
  style.textContent = saverCSS;
  doc.head.append(style);
  doc.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  win.dispatchEvent(new win.Event('resize'));
  const sliders = [...doc.querySelectorAll('input[type="range"]')].filter(input => !input.disabled && !input.closest('[hidden]') && Number(input.max) > Number(input.min));
  let input = null;
  if (paramMode === 'first') input = sliders[0];
  else if (paramMode !== 'random') input = sliders.find(slider => slider.id === paramMode);
  input ??= sliders[Math.floor(Math.random() * sliders.length)] ?? null;
  const label = input && (input.closest('label')?.querySelector('span')?.textContent || input.getAttribute('aria-label') || input.id);
  return { win, input, label: label?.trim() ?? '', title, last: null, lastAt: 0 };
}

function drive(state, phase, force = false) {
  const input = state?.input;
  if (!input) return;
  const min = Number(input.min), max = Number(input.max), step = Number(input.step);
  let value = min + phase * (max - min);
  if (step > 0) value = clamp(min + Math.round((value - min) / step) * step, min, max);
  const text = String(Number(value.toFixed(6)));
  const now = performance.now();
  // Throttle so rebuild-heavy experiments are not reset dozens of times a second.
  if (text === state.last || (!force && now - state.lastAt < 120)) return;
  state.last = text; state.lastAt = now;
  input.value = text;
  input.dispatchEvent(new state.win.Event('input', { bubbles: true }));
  input.dispatchEvent(new state.win.Event('change', { bubbles: true }));
}

function caption(state) {
  const box = $('#caption');
  $('#caption-title').textContent = state?.title ?? '';
  $('#caption-param').textContent = state?.label ? `${state.label} ← time` : '';
  clearTimeout(captionTimer);
  if (captionMode === 'off') return box.classList.remove('on');
  box.classList.add('on');
  if (captionMode !== 'always') captionTimer = setTimeout(() => box.classList.remove('on'), 6000);
}

function load(slot) {
  const href = nextWork();
  const frame = frames.find(item => item !== active?.frame);
  const ticket = { slot, href, frame };
  loading = ticket;
  frame.classList.remove('on');
  frame.onload = () => {
    if (loading !== ticket) return;
    let state = null;
    try { state = prepare(frame); } catch (error) { console.warn('Screensaver could not prepare', href, error); }
    // Give WebGL a moment to draw its first frame before the crossfade.
    setTimeout(() => {
      if (loading !== ticket) return;
      const previous = active;
      active = { ...ticket, state };
      loading = null;
      drive(state, phaseOf(Date.now()), true);
      frame.classList.add('on');
      $('#loader').classList.add('done');
      caption(state);
      if (previous) {
        previous.frame.classList.remove('on');
        setTimeout(() => { if (active?.frame !== previous.frame && loading?.frame !== previous.frame) previous.frame.src = 'about:blank'; }, 1800);
      }
    }, 500);
  };
  frame.src = href;
}

const slotOf = time => Math.floor(time / period);
const phaseOf = time => (time % period) / period;

function tick() {
  const now = Date.now(), slot = slotOf(now);
  if (slot !== currentSlot) { currentSlot = slot; load(slot); }
  if (active) {
    drive(active.state, phaseOf(now));
    $('#caption-progress').value = phaseOf(now);
  }
}

catalog().catch(() => []).then(found => {
  works = found.length ? found : ['../fractal.html?work=mandelbulb'];
  setInterval(tick, 100);
  tick();
});
