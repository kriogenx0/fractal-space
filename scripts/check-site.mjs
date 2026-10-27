import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('dist');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path); else files.push(path);
  }
}
walk(root);
const htmlFiles = files.filter(path => path.endsWith('.html'));
const jsFiles = files.filter(path => path.endsWith('.js'));
assert(htmlFiles.length > 0, 'The site needs an index and experiment pages.');
for (const path of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${relative(root, path)}: ${result.stderr}`);
}
let checked = 0;
for (const path of htmlFiles) {
  const html = readFileSync(path, 'utf8');
  for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = new URL(value, `https://site.invalid/${relative(root, path)}`);
    if (url.origin !== 'https://site.invalid') continue;
    const asset = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert(asset === root || asset.startsWith(root + '/'), `Path escapes the site: ${value}`);
    assert(existsSync(asset), `${relative(root, path)} links to missing asset: ${value}`);
    if (statSync(asset).isDirectory()) assert(existsSync(join(asset, 'index.html')), `Missing index for ${value}`);
    checked++;
  }
}
const index = readFileSync(join(root, 'index.html'), 'utf8');
const cards = [...index.matchAll(/<a class="work-card" href="([^"]+)"/g)].map(match => match[1]);
assert(cards.length > 0, 'No experiment cards found.');
assert.equal(new Set(cards).size, cards.length, 'Duplicate experiment cards.');
const legacy = readFileSync(join(root, 'app.js'), 'utf8').match(/const workSlugs=\[([^\]]+)\]/)?.[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? [];
const fractals = [...readFileSync(join(root, 'fractal.js'), 'utf8').matchAll(/^ '([^']+)':\{n:/gm)].map(match => match[1]);
for (const href of cards) {
  const url = new URL(href, 'https://site.invalid/');
  const work = url.searchParams.get('work');
  const known = url.pathname === '/fractal.html' ? fractals : legacy;
  assert(known.includes(work), `Card points to an unknown experiment: ${href}`);
}
console.log(`PASS: ${jsFiles.length} JavaScript files, ${checked} local links/assets, ${cards.length} unique experiment routes.`);
