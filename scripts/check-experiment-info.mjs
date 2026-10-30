// MIT License — Copyright (c) 2026 Alex Vaos. See ../LICENSE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync('dist/experiment-info.js', 'utf8');
for (const page of ['math', 'fractal', 'wild']) {
  const html = readFileSync(`dist/${page}.html`, 'utf8');
  assert(html.includes('<script src="experiment-info.js" defer></script>'));
  assert(html.indexOf('href="experiment-info.css"') > html.indexOf('href="theme.css"'), 'Mobile layout overrides the themed overlay');
  assert(html.includes('id="mobile-title" class="mobile-work-name" role="heading" aria-level="1"'));
  assert(html.includes('id="help-dialog" aria-labelledby="info-title"'));
  assert(html.includes('aria-label="About this experiment and controls"'));
}
function page({ math = true, hasTitle = true } = {}) {
  const nodes = {}, classes = new Set(); let observer, originalClicks = 0;
  for (const id of ['title', 'mobile-title', 'help', 'info-title', 'description', 'info-description', 'info-equation', 'info-measurement']) nodes[id] = { textContent: '', hidden: false, listeners: [], addEventListener(type, fn) { assert.equal(type, 'click'); this.listeners.push(fn); } };
  nodes.title.textContent = 'Initial title'; nodes.description.textContent = 'A description';
  if (math) { nodes.equation = { textContent: 'x = a(θ−sin θ)', hidden: false }; nodes.measurement = { textContent: '1 Cycloid 0.981 s', hidden: false }; }
  if (!hasTitle) delete nodes.title;
  nodes.help.onclick = () => originalClicks++;
  runInNewContext(source, { document: { getElementById: id => nodes[id] ?? null, body: { classList: { add: name => classes.add(name) } } }, MutationObserver: class { constructor(fn) { observer = fn; } observe(node, options) { assert.equal(node, nodes.title); assert(options.childList && options.characterData && options.subtree); } } });
  return { nodes, classes, updateTitle(name) { nodes.title.textContent = name; observer(); }, click() { nodes.help.listeners.forEach(fn => fn()); nodes.help.onclick(); }, clicks: () => originalClicks };
}
for (const math of [true, false]) {
  const ui = page({ math }); assert(ui.classes.has('has-experiment-info'));
  assert.equal(ui.nodes['mobile-title'].textContent, 'Initial title');
  ui.updateTitle('A new experiment'); assert.equal(ui.nodes['mobile-title'].textContent, 'A new experiment'); assert.equal(ui.nodes['info-title'].textContent, 'A new experiment');
  ui.click(); assert.equal(ui.clicks(), 1, 'Existing help/open/pause handlers still run');
  assert.equal(ui.nodes['info-description'].textContent, 'A description'); assert(!ui.nodes['info-description'].hidden);
  assert.equal(ui.nodes['info-equation'].hidden, !math); assert.equal(ui.nodes['info-measurement'].hidden, !math);
  if (math) {
    ui.nodes.measurement.textContent = 'A changed reading'; ui.click(); assert.equal(ui.nodes['info-measurement'].textContent, 'A changed reading', 'Reopening Info gets the current readout');
    ui.nodes.measurement.hidden = true; ui.click(); assert(ui.nodes['info-measurement'].hidden, 'Unavailable readings stay hidden');
  }
  ui.nodes.description.textContent = ''; ui.click(); assert(ui.nodes['info-description'].hidden);
}
const unavailable = page({ hasTitle: false }); assert(!unavailable.classes.size, 'Incomplete markup preserves the original layout');
console.log('PASS: mobile experiment headings, Info description/equation/current readings, optional fields, existing modal handlers, route-title updates, and progressive fallback.');
