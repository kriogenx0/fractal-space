// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
import { createAudioEngine, analyzeSpectrum, createSpectrumView } from './spectrum-engine.js';
export function initSpectrum(doc, win, makeEngine = createAudioEngine, makeView = createSpectrumView) {
  const $ = id => doc.querySelector('#' + id), canvas = $('spectrum'), player = $('player');
  const engine = makeEngine({ AudioContext: win.AudioContext || win.webkitAudioContext, mediaDevices: win.navigator.mediaDevices, media: player, urls: win.URL, onEnded: () => stop('Microphone disconnected. Choose a source to restart.') });
  let renderer; try { renderer = makeView(canvas); } catch { $('audio-status').textContent = 'Canvas 2D is unavailable in this browser.'; for (const id of ['tone', 'microphone', 'open-file']) $(id).disabled = true; return; }
  let frozen = win.matchMedia('(prefers-reduced-motion: reduce)').matches, mode = 'spectrum', frame = null, dirty = true, last = 0, request = 0, busy = false, raw = null, configuredFloor = 90;
  const sources = ['tone', 'microphone', 'open-file'];
  function controls() { for (const id of sources) $(id).disabled = busy; $('stop').disabled = !busy && !engine.kind; player.hidden = engine.kind !== 'file'; $('freeze').setAttribute('aria-pressed', String(frozen)); $('freeze').textContent = frozen ? 'Resume view' : 'Freeze view'; }
  function resize() { const r = canvas.getBoundingClientRect(), ratio = Math.min(win.devicePixelRatio || 1, 2, 1600 / Math.max(r.width, r.height)); canvas.width = Math.max(1, Math.round(r.width * ratio)); canvas.height = Math.max(1, Math.round(r.height * ratio)); dirty = true; }
  new win.ResizeObserver(resize).observe(canvas); resize(); controls();
  function stop(message = 'Audio stopped. Choose a source to begin again.') { request++; busy = false; engine.stop(); controls(); $('audio-status').textContent = message; dirty = true; }
  async function start(type, file) {
    const id = ++request; busy = true; frame = null; raw = null; renderer.reset(); dirty = true; controls(); $('audio-status').textContent = type === 'microphone' ? 'Waiting for microphone permission… Stop audio cancels this request.' : 'Starting audio…';
    try { const started = await engine.start(type, file); if (id !== request) return; busy = false; controls(); if (!started) return; $('audio-status').textContent = type === 'microphone' ? 'Microphone active · analyzed locally · speaker monitoring off' : type === 'file' ? 'Playing: ' + file.name : 'Test tone playing · adjust frequency and wave shape'; }
    catch (error) { if (id !== request) return; busy = false; controls(); const messages = { NotAllowedError: 'Audio permission was denied. Try a test tone or open a local file.', NotFoundError: 'No microphone was found. Try a test tone or local file.', NotReadableError: 'The microphone is unavailable or in use by another app.', NotSupportedError: 'This audio format is unsupported. Try another file.' }; $('audio-status').textContent = messages[error.name] || error.message || 'Audio could not start. Try another source.'; }
    dirty = true;
  }
  $('tone').onclick = () => start('tone'); $('microphone').onclick = () => start('microphone'); $('open-file').onclick = () => { $('audio-file').value = ''; $('audio-file').click(); }; $('audio-file').onchange = () => { const file = $('audio-file').files[0]; if (file) start('file', file); }; $('stop').onclick = () => stop();
  player.onended = () => stop('Playback finished. Open another file or choose a source.'); player.onerror = () => { if (engine.kind === 'file') stop('This file could not be played. Try another audio format.'); };
  const settings = () => { if (raw && configuredFloor !== +$('floor').value) { frame = analyzeSpectrum(raw.frequency, raw.wave, raw.sampleRate, raw.fftSize, -$('floor').value); renderer.reset(); renderer.capture(frame); } configuredFloor = +$('floor').value; engine.setTone(+$('tone-hz').value, $('wave-shape').value); engine.setVolume(+$('volume').value); engine.configure(+$('fft-size').value, +$('smoothing').value); $('tone-value').textContent = $('tone-hz').value + ' Hz'; $('volume-value').textContent = Math.round(+$('volume').value * 100) + '%'; $('smooth-value').textContent = (+$('smoothing').value).toFixed(2); $('floor-value').textContent = '−' + $('floor').value + ' dB'; dirty = true; };
  for (const id of ['tone-hz', 'wave-shape', 'volume', 'fft-size', 'smoothing', 'floor']) $(id).addEventListener(id === 'wave-shape' || id === 'fft-size' ? 'change' : 'input', settings); settings();
  const freeze = () => { frozen = !frozen; controls(); dirty = true; }; $('freeze').onclick = freeze;
  const view = () => { mode = mode === 'spectrum' ? 'waterfall' : 'spectrum'; $('view').textContent = 'View: ' + (mode === 'spectrum' ? 'Spectrum' : 'Waterfall') + ' ↻'; dirty = true; }; $('view').onclick = view;
  function draw() { renderer.draw(frame, mode, -$('floor').value); if (frame) { $('peak').textContent = frame.peakHz === null ? '—' : frame.peakHz.toFixed(1) + ' Hz'; $('level').textContent = frame.rmsDb <= -120 ? '≤ −120 dBFS' : frame.rmsDb.toFixed(1) + ' dBFS'; $('resolution').textContent = frame.resolution.toFixed(2) + ' Hz'; } dirty = false; }
  $('save').onclick = () => { draw(); canvas.toBlob(blob => { if (!blob) return; const url = win.URL.createObjectURL(blob), a = doc.createElement('a'); a.download = 'fractal-space-spectrum.png'; a.href = url; a.click(); win.setTimeout(() => win.URL.revokeObjectURL(url), 1500); }); };
  win.addEventListener('keydown', e => { if (e.key === 'Escape') { stop(); return; } if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || /INPUT|SELECT|BUTTON|TEXTAREA/.test(e.target.tagName)) return; if (e.key.toLowerCase() === 'p') { e.preventDefault(); freeze(); } if (e.key.toLowerCase() === 'v') { e.preventDefault(); view(); } });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) stop('Audio stopped while the tab was hidden. Choose a source to restart.'); }); win.addEventListener('pagehide', () => stop());
  function animate(now) {
    win.requestAnimationFrame(animate); if (doc.hidden || now - last < 1000 / 30) return; last = now;
    if (engine.kind && (!frozen || !frame)) { const data = engine.read(); if (data) { raw = { ...data, frequency: data.frequency.slice(), wave: data.wave.slice() }; frame = analyzeSpectrum(data.frequency, data.wave, data.sampleRate, data.fftSize, -$('floor').value); renderer.capture(frame);  dirty = true; } }
    if (dirty) draw();
  }
  draw(); win.requestAnimationFrame(animate); return { engine, stop, start, get frame() { return frame; }, get frozen() { return frozen; } };
}
if (typeof document !== 'undefined') initSpectrum(document, window);
