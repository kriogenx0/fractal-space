// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync('dist/fractal.js', 'utf8') + '\nglobalThis.inspect=()=>({catalog,work,paramA,paramB,geometry,cloud,growth,cloudProgress,paused});';
function player(slug) {
  const nodes = new Map(), shaders = [], uniforms = new Map(); let callback, clock = 0, calls = 0;
  const finite = (...values) => { assert(values.every(Number.isFinite), `${slug}: finite drawing/uniform values`); calls++; };
  const gradient = (...values) => { finite(...values); return { addColorStop() {} }; };
  const ctx = { fillRect: finite, moveTo: finite, lineTo: finite, arc: finite, beginPath() {}, closePath() {}, fill() {}, stroke() {}, createRadialGradient: gradient };
  // Capture uniforms and shader sources; real GPU compilation is not simulated.
  const gl = { VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    createShader(type) { const shader = { type }; shaders.push(shader); return shader; }, shaderSource(shader, code) { shader.code = code; }, compileShader() {}, getShaderParameter: () => true,
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true, useProgram() {}, createBuffer: () => ({}), bindBuffer() {}, bufferData() {}, getAttribLocation: () => 0, enableVertexAttribArray() {}, vertexAttribPointer() {}, getUniformLocation: (_, name) => name,
    uniform1f(name, value) { finite(value); uniforms.set(name, value); }, uniform2f(name, ...values) { finite(...values); uniforms.set(name, values); }, drawArrays() {}, viewport: finite };
  function node(selector) { if (!nodes.has(selector)) nodes.set(selector, { hidden: selector === '#error', open: false, value: '', style: { setProperty() {} }, setAttribute() {}, addEventListener() {}, getBoundingClientRect: () => ({ width: 390, height: 844 }), getContext: kind => kind === 'webgl' ? gl : ctx, toBlob(fn) { fn({}); } }); return nodes.get(selector); }
  const sandbox = { document: { querySelector: node, documentElement: node('html'), hidden: false, addEventListener() {}, createElement: () => ({ click() {} }) }, window: { addEventListener() {} }, location: { search: `?work=${slug}` }, URLSearchParams, matchMedia: () => ({ matches: true }), devicePixelRatio: 1, performance: { now: () => 0 }, ResizeObserver: class { constructor(fn) { this.fn = fn; } observe() { this.fn(); } }, requestAnimationFrame(fn) { callback = fn; }, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, setTimeout(fn) { fn(); }, console };
  runInNewContext(source, sandbox);
  return { nodes, shaders, uniforms, state: () => sandbox.inspect(), count: () => calls, frame() { clock += 40; callback(clock); }, input(key, value) { const input = node('#param-' + key); input.value = value; input.oninput(); } };
}
for (const slug of ['mandelbulb', 'cathedral', 'julia-tide', 'recursive-orchard', 'sierpinski-relic', 'chaos-loom']) {
  const ui = player(slug), { work } = ui.state();
  for (const key of ['a', 'b']) { const range = work[key], input = ui.nodes.get('#param-' + key); assert.equal(+input.min, range[1]); assert.equal(+input.max, range[2]); }
  for (const ae of [1, 2]) for (const be of [1, 2]) {
    ui.input('a', work.a[ae]); ui.input('b', work.b[be]); ui.frame();
    const state = ui.state(); assert.equal(state.paramA, work.a[ae]); assert.equal(state.paramB, work.b[be]); assert(state.paused);
    if (['bulb', 'menger', 'julia'].includes(work.engine)) { assert.equal(ui.uniforms.get('uA'), work.a[ae]); assert.equal(ui.uniforms.get('uB'), work.b[be]); }
    if (work.engine === 'tree') { assert.equal(state.geometry.length, (3 ** (work.a[ae] + 1) - 1) / 2); assert(state.growth > state.paramA, 'Paused edits reveal every requested generation'); }
    if (work.engine === 'tetra') assert.equal(state.geometry.length, 4 ** (work.a[ae] + 1));
    if (work.engine === 'chaos') { assert(state.cloud.length > 0); assert(state.cloud.length <= 144000); assert(state.cloud.every(p => p.every(Number.isFinite))); if (be === 2) assert(state.cloud.length > 72000, 'Higher density generates additional samples'); }
  }
  if (work.engine === 'bulb') assert(ui.shaders.some(s => s.code.includes('i<24;i++')));
  if (work.engine === 'menger') assert(ui.shaders.some(s => s.code.includes('i<7;i++')));
  if (work.engine === 'julia') assert(ui.shaders.some(s => s.code.includes('i<600;i++')));
  assert(ui.count() > 0);
}
console.log('PASS: six fractal players — slider extremes reach renderers/shader uniforms, recursion ceilings generate actual geometry, larger density adds samples, paused edits and mobile projections remain finite.');
