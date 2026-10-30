// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const moduleURL = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const engineURL = moduleURL(readFileSync('dist/spectrum-engine.js', 'utf8'));
const { analyzeSpectrum, createAudioEngine, createSpectrumView } = await import(engineURL);
const { initSpectrum } = await import(moduleURL(readFileSync('dist/spectrum.js', 'utf8').replace("'./spectrum-engine.js'", JSON.stringify(engineURL))));
const close = (a, b, eps = 1e-5) => assert(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
// Independent direct DFT of a windowed, sampled sine; no browser FFT is mocked here.
const N = 1024, rate = 8192, wave = Float32Array.from({ length: N }, (_, i) => .5 * Math.sin(2 * Math.PI * 440 * i / rate));
const frequency = new Float32Array(N / 2);
for (let k = 0; k < frequency.length; k++) { let re = 0, im = 0; for (let j = 0; j < N; j++) { const w = .42 - .5 * Math.cos(2 * Math.PI * j / N) + .08 * Math.cos(4 * Math.PI * j / N), a = 2 * Math.PI * k * j / N; re += wave[j] * w * Math.cos(a); im -= wave[j] * w * Math.sin(a); } frequency[k] = 20 * Math.log10(Math.max(1e-12, Math.hypot(re, im) / N)); }
const frame = analyzeSpectrum(frequency, wave, rate, N); close(frame.peakHz, 440, .01); close(frame.rmsDb, 20 * Math.log10(.5 / Math.sqrt(2))); close(frame.resolution, 8); assert.equal(frame.high, rate / 2); assert.equal(frame.bands.length, 96); assert(frame.bands.every(v => v >= 0 && v <= 1));
const silent = analyzeSpectrum(new Float32Array(2048).fill(-Infinity), new Float32Array(4096), 48000, 4096); assert.equal(silent.peakHz, null); assert.equal(silent.rmsDb, -120); assert(silent.bands.every(v => v === 0));
const dc = new Float32Array(2048).fill(-Infinity); dc[0] = 0; assert.equal(analyzeSpectrum(dc, new Float32Array(4096), 48000, 4096).peakHz, null, 'DC is not a displayed sound frequency');
const full = new Float32Array(2048).fill(5); const clipped = analyzeSpectrum(full, new Float32Array(4096).fill(1), 48000, 4096); assert(clipped.bands.every(v => v === 0 || v === 1)); assert(clipped.bands.some(v => v === 1), 'Populated bands clamp at full scale; empty log bands remain empty');
const soft = analyzeSpectrum(frequency, wave, rate, N, -120); assert(soft.bands.reduce((a,b)=>a+b,0) >= frame.bands.reduce((a,b)=>a+b,0), 'A lower display floor reveals quieter content');
function rig() {
  const nodes = [], tracks = [], revoked = [], requests = []; let context, mediaNodes = 0, serial = 0;
  const node = type => { const n = { nodeType: type, type, edges: [], stopped: false, connect(other) { this.edges.push(other); return other; }, disconnect() { this.edges = []; }, stop() { this.stopped = true; }, start() { this.started = true; }, gain: { value: 0 }, frequency: { value: 0, setTargetAtTime(v) { this.value = v; } } }; nodes.push(n); return n; };
  const makeStream = () => { const track = { stopped: false, handlers: {}, stop() { this.stopped = true; }, addEventListener(k, fn) { this.handlers[k] = fn; } }; tracks.push(track); return { getTracks: () => [track] }; };
  const media = { src: '', paused: true, pause() { this.paused = true; }, async play() { this.paused = false; }, removeAttribute() { this.src = ''; }, load() {} };
  const mediaDevices = { async getUserMedia(constraints) { requests.push(constraints); return makeStream(); } };
  const urls = { createObjectURL() { return 'blob:test-' + ++serial; }, revokeObjectURL(url) { revoked.push(url); } };
  class AudioContext {
    constructor() { context = this; this.sampleRate = 48000; this.currentTime = 0; this.destination = node('destination'); }
    async resume() {}
    createAnalyser() { const a = node('analyser'); Object.assign(a, { fftSize: 4096, get frequencyBinCount() { return this.fftSize / 2; }, getFloatFrequencyData(data) { data.fill(-100); data[Math.round(440 / (48000 / this.fftSize))] = -20; }, getFloatTimeDomainData(data) { for (let i = 0; i < data.length; i++) data[i] = .1 * Math.sin(i / 20); } }); Object.defineProperty(a, 'frequencyBinCount', { get: () => a.fftSize / 2 }); return a; }
    createGain() { return node('gain'); } createOscillator() { return node('oscillator'); } createMediaStreamSource() { return node('microphone'); } createMediaElementSource() { mediaNodes++; return node('file'); }
  }
  let ended = 0; const deps = { AudioContext, mediaDevices, media, urls, onEnded() { ended++; } }, engine = createAudioEngine(deps);
  return { engine, deps, nodes, tracks, revoked, requests, media, urls, makeStream, get context() { return context; }, get mediaNodes() { return mediaNodes; }, get ended() { return ended; } };
}
const r = rig(); assert.equal(r.context, undefined, 'No AudioContext or microphone request on load'); assert.equal(r.requests.length, 0);
await r.engine.start('tone'); assert.equal(r.engine.kind, 'tone'); assert.equal(r.nodes.find(n => n.nodeType === 'oscillator').started, true); const monitor = r.nodes.find(n => n.edges.includes(r.context.destination)); assert.equal(monitor.gain.value, .25);
r.engine.setTone(880, 'square'); assert.equal(r.nodes.find(n => n.nodeType === 'oscillator').frequency.value, 880); r.engine.configure(16384, .9); assert.equal(r.engine.read().frequency.length, 8192); assert.equal(r.engine.read().wave.length, 16384);
await r.engine.start('microphone'); assert(r.nodes.find(n => n.nodeType === 'oscillator').stopped); assert.equal(r.requests.length, 1); assert.equal(r.requests[0].video, false); assert.equal(monitor.gain.value, 0); r.engine.setVolume(1); assert.equal(monitor.gain.value, 0, 'Microphone can never be monitored through speakers');
r.tracks[0].handlers.ended(); assert.equal(r.engine.kind, null); assert.equal(r.ended, 1); assert(r.tracks[0].stopped);
await r.engine.start('file', { name: 'one.wav' }); assert.equal(r.mediaNodes, 1); assert(!r.media.paused); await r.engine.start('file', { name: 'two.wav' }); assert.equal(r.mediaNodes, 1, 'A media element source is reused across file selections'); assert(r.revoked.includes('blob:test-1')); r.engine.stop(); assert(r.media.paused); assert(r.revoked.includes('blob:test-2')); assert.equal(r.media.src, ''); assert.equal(r.engine.read(), null);
const denied = rig(); denied.deps.mediaDevices.getUserMedia = async () => { throw Object.assign(new Error('denied'), { name: 'NotAllowedError' }); }; await assert.rejects(denied.engine.start('microphone'), { name: 'NotAllowedError' }); assert.equal(denied.engine.kind, null);
const late = rig(); let grant; late.deps.mediaDevices.getUserMedia = () => new Promise(resolve => grant = resolve); const pending = late.engine.start('microphone'); await Promise.resolve(); await Promise.resolve(); assert(grant); late.engine.stop(); await late.engine.start('tone'); const incoming = late.makeStream(); grant(incoming); assert.equal(await pending, false); assert(late.tracks[0].stopped, 'A permission grant after cancellation immediately releases its tracks'); assert.equal(late.engine.kind, 'tone', 'A stale microphone request never replaces the newer source');
const badFile = rig(); badFile.media.play = async () => { throw Object.assign(new Error('codec'), { name: 'NotSupportedError' }); }; await assert.rejects(badFile.engine.start('file', {})); assert.equal(badFile.engine.kind, null); assert.equal(badFile.revoked.length, 1);
function recorder(width, height) {
  const shapes = []; let path = '', calls = 0; const num = n => { assert(Number.isFinite(n)); calls++; return +n.toFixed(3); }; const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  const ctx = { beginPath() { path = ''; }, moveTo(x,y) { path += `M${num(x)} ${num(y)}`; }, lineTo(x,y) { path += `L${num(x)} ${num(y)}`; }, closePath() { path += 'Z'; }, fillRect(x,y,w,h) { shapes.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${this.fillStyle}"/>`); }, fillText(s,x,y) { assert(!/NaN|Infinity/.test(s)); shapes.push(`<text x="${num(x)}" y="${num(y)}" font-family="monospace" font-size="${parseFloat(this.font)}" fill="${this.fillStyle}">${escape(s)}</text>`); }, stroke() { shapes.push(`<path d="${path}" fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}"/>`); }, fill() { shapes.push(`<path d="${path}" fill="${this.fillStyle}"/>`); } };
  return { canvas: { width, height, getContext: () => ctx }, calls: () => calls, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.join('')}</svg>` };
}
const previewFrequency = new Float32Array(2048).fill(-100), previewWave = Float32Array.from({ length: 4096 }, (_, i) => .15 * (Math.sin(2*Math.PI*19*i/4096) + .3*Math.sin(2*Math.PI*57*i/4096) + .13*Math.sin(2*Math.PI*95*i/4096)));
for (let h = 1; h <= 19; h += 2) for (let j = -2; j <= 2; j++) previewFrequency[19*h+j] = -23 - 28 * Math.log10(h) - Math.abs(j) * 8;
const preview = analyzeSpectrum(previewFrequency, previewWave, 48000, 4096);
for (const [width,height] of [[1000,625],[390,420],[1600,900]]) for (const mode of ['spectrum','waterfall']) { const image = recorder(width,height), view = createSpectrumView(image.canvas); view.draw(null,mode); for(let i=0;i<100;i++)view.capture(preview); assert.equal(view.historyLength,64); view.draw(preview,mode); assert(image.calls()>100); view.reset(); assert.equal(view.historyLength,0); }
const retina = recorder(780, 840); retina.canvas.clientWidth = 390; createSpectrumView(retina.canvas).draw(preview); assert.equal(parseFloat(retina.canvas.getContext().font), 20, 'High-density mobile labels stay 10 CSS pixels instead of shrinking');
if(process.argv.includes('--write')) { const image=recorder(1000,625),view=createSpectrumView(image.canvas); view.capture(preview);view.draw(preview);writeFileSync('dist/thumbnails/spectrum-analyzer.svg',image.svg()); const fall=recorder(1000,625),terrain=createSpectrumView(fall.canvas);for(let i=0;i<64;i++)terrain.capture({...preview,bands:Float32Array.from(preview.bands,(v,j)=>v*(.7+.3*Math.sin(i*.12+j*.08)))});terrain.draw(preview,'waterfall');writeFileSync('/tmp/spectrum-waterfall.svg',fall.svg()); }
const html = readFileSync('dist/spectrum.html','utf8');
function player(reduced=false) {
  const mock=rig(), elements={}, events={}; let callback, clock=0,saved=false;
  for(const [,id]of html.matchAll(/id="([^"]+)"/g))elements[id]={value:'',hidden:false,disabled:false,tagName:'DIV',textContent:'',handlers:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},click(){this.clicked=true;}};
  Object.assign(elements.player,mock.media);for(const [key,value]of Object.entries({'tone-hz':220,'wave-shape':'sine','volume':.25,'fft-size':4096,'smoothing':.75,'floor':90}))elements[key].value=String(value);
  Object.assign(elements.spectrum,{width:1000,height:560,getBoundingClientRect:()=>({width:1000,height:560}),toBlob(fn){fn({});}});
  const doc={hidden:false,querySelector:q=>elements[q.slice(1)],createElement:()=>({click(){saved=true;}}),addEventListener:(k,fn)=>events[k]=fn};
  const win={navigator:{mediaDevices:mock.deps.mediaDevices},AudioContext:mock.deps.AudioContext,URL:mock.urls,devicePixelRatio:1,matchMedia:()=>({matches:reduced}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>callback=fn,addEventListener:(k,fn)=>events[k]=fn,setTimeout:fn=>fn()};
  const render={captures:0,draws:0,reset(){},capture(){this.captures++;},draw(){this.draws++;}};let engine;
  const api=initSpectrum(doc,win,deps=>engine=createAudioEngine(deps),()=>render);
  return{api,engine,elements,render,events,doc,mock,saved:()=>saved,frame(){clock+=40;callback(clock);},key(key,target={tagName:'CANVAS'}){events.keydown({key,target,preventDefault(){}});}};
}
const ui=player();assert.equal(ui.engine.kind,null);assert.equal(ui.mock.context,undefined);await ui.elements.tone.onclick();ui.mock.nodes.find(n=>n.nodeType==='analyser').getFloatFrequencyData=data=>{data.fill(-100);data[38]=-60;};ui.frame();assert(ui.api.frame.peakHz>0);const captures=ui.render.captures;ui.key('p');ui.frame();assert.equal(ui.render.captures,captures);assert.equal(ui.engine.kind,'tone','Freezing the view does not stop audio');ui.elements.floor.value=40;ui.elements.floor.handlers.input();assert.equal(ui.render.captures,captures+1,'Frozen data can be rescaled without sampling a new audio window');ui.frame();assert.equal(ui.elements.peak.textContent,'—','Frozen measurement labels follow the display floor');ui.key('v');assert(ui.elements.view.textContent.includes('Waterfall'));ui.elements.save.onclick();assert(ui.saved());ui.key('p',{tagName:'INPUT'});assert(ui.api.frozen);ui.key('Escape');assert.equal(ui.engine.kind,null);
await ui.elements.microphone.onclick();ui.doc.hidden=true;ui.events.visibilitychange();assert.equal(ui.engine.kind,null);assert(ui.mock.tracks.at(-1).stopped,'Hiding the tab releases microphone capture');ui.doc.hidden=false;await ui.elements.tone.onclick();ui.events.pagehide();assert.equal(ui.engine.kind,null);
const reduced=player(true);assert(reduced.api.frozen);await reduced.elements.tone.onclick();reduced.frame();const first=reduced.render.captures;reduced.frame();assert.equal(reduced.render.captures,first);reduced.elements.freeze.onclick();reduced.frame();assert(reduced.render.captures>first);
console.log('PASS: independent DFT peak/RMS measurements, silence/DC/log bands, lazy audio startup, oscillator edits, microphone isolation/release/cancellation, file routing/reuse/errors/URL cleanup, bounded desktop/mobile spectrum/waterfall rendering, reduced motion, frozen rescaling, keyboard controls, PNG export, and page lifecycle.');
