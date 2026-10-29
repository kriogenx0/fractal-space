// SPDX-License-Identifier: GPL-3.0-only — verifies pre-rendered GPL and original pages.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildSEO, escapeHTML, origin, homeDescription } from './seo.mjs';
const read = file => readFileSync(`dist/${file}`, 'utf8'), hash = value => createHash('sha256').update(value).digest('hex');
const { works, files } = buildSEO(), titles = new Set(), descriptions = new Set();
for (const [path, expected] of files) assert.equal(read(path), expected, `Generated SEO is current: ${path}; run make seo after catalog/template edits`);
for (const w of works) {
  const html = read(w.output), title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1], description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.equal(title, escapeHTML(w.title)); assert(!titles.has(title), `${w.slug}: unique title`); titles.add(title);
  assert.equal(description, escapeHTML(w.description)); assert(!descriptions.has(description), `${w.slug}: unique description`); descriptions.add(description);
  assert(w.description.length >= 70 && w.description.length <= 190, `${w.slug}: concise, descriptive snippet`);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1); assert(html.includes(`rel="canonical" href="${escapeHTML(w.url)}"`));
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) assert.equal((html.match(new RegExp(`property="${key}"`, 'g')) ?? []).length, 1, `${w.slug}: one ${key}`);
  assert(html.includes('name="twitter:card" content="summary_large_image"'));
  assert(html.includes(`<meta property="og:image" content="${origin}/${w.image}"`)); assert(existsSync(`dist/${w.image}`));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const art = graph.find(x => x['@type'] === 'CreativeWork'); assert.equal(art.url, w.url); assert.equal(art.name, w.name); assert.equal(art.isAccessibleForFree, true);
  if (w.family === 'levitated') { assert.equal(art.isBasedOn.creator.name, 'Jared Tarbell'); assert(art.license.endsWith('/levitated/COPYING.txt')); assert(html.includes(`href="levitated/${w.data.original}.zip"`)); }
  assert(html.includes('<noscript>')); assert(html.includes(`alt="Preview of ${escapeHTML(w.name)}"`));
  const body = html.slice(html.indexOf('</head>')); assert(body.includes(escapeHTML(w.name)), `${w.slug}: real title in response body before JavaScript`);
  if (w.family === 'math') assert(body.includes(escapeHTML(w.data.explanation)), `${w.slug}: pre-rendered mathematical explanation`);
  const h1s = [...html.matchAll(/<h1\b/g)]; assert.equal(h1s.length, 1, `${w.slug}: one primary heading`);
  assert.equal((html.match(/class="static-preview"/g) ?? []).length, 1, `${w.slug}: single no-JavaScript fallback`);
}
const home = read('index.html'), structured = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert(home.includes(escapeHTML(homeDescription))); const list = structured['@graph'].find(x => x['@type'] === 'ItemList');
assert.equal(list.numberOfItems, works.filter(w => w.public).length); assert.equal(list.itemListElement[0].name, 'Mandelbulb');
assert(!list.itemListElement.some(x => x.url.includes('dream-strata'))); assert(list.itemListElement.at(-1).url.endsWith('/tandava.html'));
const sitemap = read('sitemap.xml'), locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(new Set(locations).size, locations.length); assert.equal(locations.length, list.numberOfItems + 2);
for (const w of works.filter(w => w.public)) assert(locations.includes(escapeHTML(w.url)), `${w.slug}: canonical URL in sitemap`);
assert(!locations.some(url => url.includes('_pages/') || url.includes('dream-strata')));
assert(read('robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`)); assert(!read('robots.txt').includes('Disallow: /'));
// JPEG frame dimensions and integrity are checked without image-generation dependencies.
function jpegSize(buffer) { assert.equal(buffer.readUInt16BE(0), 0xffd8); let offset = 2; while (offset < buffer.length) { assert.equal(buffer[offset], 0xff); const marker = buffer[offset + 1]; offset += 2; if (marker >= 0xc0 && marker <= 0xc3) return [buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3)]; offset += buffer.readUInt16BE(offset); } throw new Error('JPEG frame not found'); }
const manifest = JSON.parse(read('social/manifest.json')); assert.equal(manifest.rendererSHA256, hash(readFileSync('scripts/render-social.mjs')), 'Share renderer is current'); assert.equal(manifest.records.length, works.length + 1);
for (const record of manifest.records) { const image = readFileSync(`dist/${record.image}`); assert.equal(record.sourceSHA256, hash(readFileSync(`dist/${record.source}`)), `${record.slug}: thumbnail is current`); assert.equal(record.imageSHA256, hash(image)); assert.deepEqual(jpegSize(image), [1200, 630]); assert(image.length < 1024 * 1024, 'Share image stays below 1 MB'); }
for (const name of ['favicon-32.png', 'apple-touch-icon.png']) { const image = readFileSync(`dist/${name}`), size = name === 'favicon-32.png' ? 32 : 180; assert.equal(image.readUInt32BE(16), size); assert.equal(image.readUInt32BE(20), size); }
console.log(`PASS: ${works.length} pre-rendered experiments; unique metadata/canonicals, source credits, valid JSON-LD, canonical sitemap, ${manifest.records.length} current JPEG previews, icons, and no-JavaScript content.`);
