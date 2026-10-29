// SPDX-License-Identifier: GPL-3.0-only
// Share-image derivatives include GPL Levitated previews. Copyright (C) 2026 Alex Vaos.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeSEO } from './seo.mjs';
const require = createRequire(import.meta.url), sharp = require(process.env.SEO_SHARP_MODULE ?? '/opt/seo/node_modules/sharp');
const hash = data => createHash('sha256').update(data).digest('hex');
export const iconSource = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="38" fill="#101522"/><path d="M90 27 158 145H22Zm0 59-34 59h68Z" fill="#f2b093" fill-rule="evenodd"/><path d="m56 86 17 29H39Zm68 0 17 29h-34Z" fill="#101522"/></svg>';
const { works } = writeSEO(), records = [];
mkdirSync('dist/social', { recursive: true });
for (const work of [...works, { slug: 'fractal-space', thumbnail: 'thumbnails/mandelbulb.jpg', image: 'social/fractal-space.jpg', data: {} }]) {
  const source = readFileSync(`dist/${work.thumbnail}`), background = work.data.background ?? (work.family === 'levitated' ? '#fff' : '#080b15');
  const result = await sharp(source, { density: 120 }).resize(1200, 630, { fit: 'contain', background }).flatten({ background }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  writeFileSync(`dist/${work.image}`, result);
  records.push({ slug: work.slug, source: work.thumbnail, sourceSHA256: hash(source), image: work.image, imageSHA256: hash(result) });
}
writeFileSync('dist/favicon.svg', iconSource + '\n');
await sharp(Buffer.from(iconSource)).resize(32, 32).png().toFile('dist/favicon-32.png');
await sharp(Buffer.from(iconSource)).resize(180, 180).png().toFile('dist/apple-touch-icon.png');
writeFileSync('dist/social/manifest.json', JSON.stringify({ rendererSHA256: hash(readFileSync(new URL(import.meta.url))), records }, null, 2) + '\n');
console.log(`Generated ${records.length} 1200×630 JPEG share images, icons, and pre-rendered SEO pages.`);
