// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function analyzeSpectrum(frequency, wave, sampleRate, fftSize, floor = -90, count = 96) {
  const step = sampleRate / fftSize, high = Math.min(20000, sampleRate / 2), bands = new Float32Array(count);
  let peak = -Infinity, bin = 0, energy = 0;
  for (let i = Math.max(1, Math.ceil(20 / step)); i < frequency.length && i * step <= high; i++) if (frequency[i] > peak) { peak = frequency[i]; bin = i; }
  for (let j = 0; j < count; j++) {
    const lo = 20 * (high / 20) ** (j / count), hi = 20 * (high / 20) ** ((j + 1) / count);
    let db = floor; for (let i = Math.max(1, Math.ceil(lo / step)); i < Math.min(frequency.length, Math.ceil(hi / step)); i++) if (Number.isFinite(frequency[i])) db = Math.max(db, frequency[i]);
    bands[j] = clamp((db - floor) / -floor, 0, 1);
  }
  for (const v of wave) energy += v * v;
  let offset = 0; if (bin > 0 && bin < frequency.length - 1) { const a = frequency[bin - 1], b = frequency[bin], c = frequency[bin + 1], d = a - 2 * b + c; if ([a, b, c].every(Number.isFinite) && Math.abs(d) > 1e-10) offset = clamp(.5 * (a - c) / d, -.5, .5); }
  const rms = Math.sqrt(energy / Math.max(1, wave.length));
  return { bands, wave, high, peakHz: peak > floor ? (bin + offset) * step : null, peakDb: Number.isFinite(peak) ? peak : null, rmsDb: rms > 1e-6 ? 20 * Math.log10(rms) : -120, resolution: step };
}
export function createAudioEngine({ AudioContext, mediaDevices, media, urls, onEnded = () => {} }) {
  let context, analyser, monitor, toneGain, source, oscillator, stream, mediaNode, fileURL, generation = 0, kind = null, frequency, wave;
  let fftSize = 4096, smoothing = .75, volume = .25, toneHz = 220, shape = 'sine';
  function clear() {
    if (monitor) monitor.gain.value = 0;
    if (oscillator) { oscillator.stop(); oscillator.disconnect(); oscillator = null; }
    if (toneGain) { toneGain.disconnect(); toneGain = null; }
    source?.disconnect(); source = null;
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    media.pause(); if (fileURL) { media.removeAttribute('src'); media.load(); urls.revokeObjectURL(fileURL); fileURL = null; }
    kind = null;
  }
  async function ready(ticket) {
    if (!AudioContext) throw new Error('Web Audio is unavailable in this browser.');
    if (!context) { context = new AudioContext(); analyser = context.createAnalyser(); analyser.fftSize = fftSize; analyser.smoothingTimeConstant = smoothing; monitor = context.createGain(); monitor.gain.value = 0; analyser.connect(monitor); monitor.connect(context.destination); }
    await context.resume(); return ticket === generation;
  }
  async function start(type, file) {
    const ticket = ++generation; clear();
    try {
      if (!await ready(ticket)) return false;
      if (type === 'microphone') {
        if (!mediaDevices?.getUserMedia) throw new Error('Microphone access requires HTTPS and a supported browser.');
        const incoming = await mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
        if (ticket !== generation) { incoming.getTracks().forEach(track => track.stop()); return false; }
        stream = incoming; for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (ticket === generation) { stop(); onEnded(); } }); source = context.createMediaStreamSource(stream); source.connect(analyser);
        // The microphone is analyzed with a silent output path to prevent feedback.
        monitor.gain.value = 0;
      } else if (type === 'file') {
        fileURL = urls.createObjectURL(file); media.src = fileURL;
        mediaNode ??= context.createMediaElementSource(media); source = mediaNode; source.connect(analyser); monitor.gain.value = volume;
        await media.play(); if (ticket !== generation) return false;
      } else {
        oscillator = context.createOscillator(); oscillator.type = shape; oscillator.frequency.value = toneHz;
        toneGain = context.createGain(); toneGain.gain.value = .15; oscillator.connect(toneGain); toneGain.connect(analyser); oscillator.start(); monitor.gain.value = volume;
      }
      kind = type; return true;
    } catch (error) { if (ticket !== generation) return false; clear(); throw error; }
  }
  function stop() { generation++; clear(); }
  function read() {
    if (!analyser || !kind) return null;
    if (frequency?.length !== analyser.frequencyBinCount) { frequency = new Float32Array(analyser.frequencyBinCount); wave = new Float32Array(analyser.fftSize); }
    analyser.getFloatFrequencyData(frequency); analyser.getFloatTimeDomainData(wave);
    return { frequency, wave, sampleRate: context.sampleRate, fftSize: analyser.fftSize };
  }
  return { start, stop, read, get kind() { return kind; },
    setTone(hz, type) { toneHz = clamp(hz, 20, 4000); shape = ['sine', 'triangle', 'sawtooth', 'square'].includes(type) ? type : 'sine'; if (oscillator) { oscillator.frequency.setTargetAtTime(toneHz, context.currentTime, .02); oscillator.type = shape; } },
    setVolume(value) { volume = clamp(value, 0, 1); if (monitor && kind !== 'microphone') monitor.gain.value = volume; },
    configure(size, smooth) { fftSize = [1024, 2048, 4096, 8192, 16384].includes(size) ? size : 4096; smoothing = clamp(smooth, 0, .98); if (analyser) { analyser.fftSize = fftSize; analyser.smoothingTimeConstant = smoothing; } }
  };
}
export function createSpectrumView(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  const history = []; let peaks = new Float32Array(96), previous;
  function reset() { history.length = 0; peaks.fill(0); previous = null; }
  function capture(frame) { if (!frame) return; if (frame.bands.length !== peaks.length) peaks = new Float32Array(frame.bands.length); for (let i = 0; i < peaks.length; i++) peaks[i] = Math.max(frame.bands[i], peaks[i] - .012); history.push(frame.bands.slice()); if (history.length > 64) history.shift(); previous = { ...frame, wave: frame.wave.slice() }; }
  function draw(frame = previous, view = 'spectrum', floor = -90) {
    const W = canvas.width, H = canvas.height, density = W / (canvas.clientWidth || W), left = W * .07, right = W * .96, top = H * .13, bottom = H * .64, width = right - left, h = bottom - top, fs = Math.max(10, Math.min(15, W / density / 65)) * density;
    ctx.fillStyle = '#080d18'; ctx.fillRect(0, 0, W, H); ctx.font = `${fs}px monospace`; ctx.lineWidth = 1;
    const text = (s, x, y, color = '#94abc5') => { ctx.fillStyle = color; ctx.fillText(s, x, y); };
    text(view === 'spectrum' ? 'FREQUENCY SPECTRUM' : 'FREQUENCY / TIME', left, H * .065, '#d8e8f5');
    text(frame ? '20 Hz — ' + Math.round(frame.high / 1000) + ' kHz' : 'CHOOSE A SOUND SOURCE', W * .61, H * .065);
    if (view === 'spectrum') {
      for (let j = 0; j <= 3; j++) { const y = top + h * j / 3; ctx.strokeStyle = '#233247'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); text(String(Math.round(floor * j / 3)), W * .012, y + fs / 3); }
      if (frame) { const bw = width / frame.bands.length; for (let i = 0; i < frame.bands.length; i++) { const v = frame.bands[i]; ctx.fillStyle = `hsl(${185 + i / frame.bands.length * 100},78%,${48 + v * 18}%)`; if (v > 0) ctx.fillRect(left + i * bw, bottom - v * h, Math.max(1, bw * .72), v * h); ctx.fillStyle = '#e2c7ff'; if (peaks[i] > 0) ctx.fillRect(left + i * bw, bottom - peaks[i] * h, Math.max(1, bw * .72), 1.5); } }
      const high = frame?.high ?? 20000; for (const hz of [20, 100, 1000, 10000, 20000]) if (hz <= high) { const x = left + Math.log(hz / 20) / Math.log(high / 20) * width; text(hz < 1000 ? String(hz) : hz / 1000 + 'k', Math.min(x, right - fs * 3), bottom + fs * 1.7); }
    } else {
      const n = history.length;
      for (let row = 0; row < n; row++) { const depth = (n - 1 - row) / 64, values = history[row], x0 = left + width * .19 * depth, y0 = bottom - h * .82 * depth, span = width * (1 - .32 * depth); ctx.beginPath(); ctx.moveTo(x0, y0); for (let i = 0; i < values.length; i++) ctx.lineTo(x0 + i / (values.length - 1) * span, y0 - values[i] * h * .22); ctx.lineTo(x0 + span, y0); ctx.closePath(); ctx.fillStyle = '#0a1424'; ctx.fill(); ctx.strokeStyle = `hsl(${185 + depth * 95},75%,${65 - depth * 28}%)`; ctx.stroke(); }
      text('LOW FREQUENCIES', left, bottom + fs * 1.7); text('HIGH FREQUENCIES', right - fs * 17, bottom + fs * 1.7);
    }
    const mid = H * .86; ctx.strokeStyle = '#233247'; ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke(); text('WAVEFORM / TIME', left, H * .77, '#d8e8f5');
    if (frame) { ctx.strokeStyle = '#8ee6d5'; ctx.lineWidth = 1.5; ctx.beginPath(); const limit = Math.min(frame.wave.length, Math.round(W * 1.5)); for (let i = 0; i < limit; i++) { const sample = frame.wave[Math.floor(i / Math.max(1, limit - 1) * (frame.wave.length - 1))], x = left + i / Math.max(1, limit - 1) * width, y = mid - clamp(sample, -1, 1) * H * .09; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); text((1000 / frame.resolution).toFixed(1) + ' ms window', W * .64, H * .77); }
    return frame;
  }
  return { capture, draw, reset, get historyLength() { return history.length; } };
}
