// SPDX-License-Identifier: GPL-3.0-only
// Generates metadata and pre-rendered pages, including GPL Levitated templates.
// Copyright (C) 2026 Alex Vaos. See THIRD_PARTY_NOTICES.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { pathToFileURL } from 'node:url';
export const origin = 'https://fractalspace.org';
export const homeTitle = 'Fractal Space — Interactive Fractals, Math & Generative Art';
export const homeDescription = 'Explore interactive fractals, 3D geometry, chaos, and generative art by Alex Vaos. Play with mathematical experiments built in JavaScript, Canvas, and WebGL.';
export const escapeHTML = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = value => decode(value.replace(/<[^>]*>/g, ''));
const read = file => readFileSync(`dist/${file}`, 'utf8');
const absolute = path => new URL(path, origin + '/').href;
const alex = { '@type': 'Person', '@id': origin + '/#alex-vaos', name: 'Alex Vaos' };
const site = { '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: 'Fractal Space', creator: alex, inLanguage: 'en' };
const markers = /\n?<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\n?/g;
const stripSEO = html => html.replace(markers, '').replace(/<!-- PREVIEW:START -->[\s\S]*?<!-- PREVIEW:END -->/g, '').replace(/<noscript><style>\.static-preview[\s\S]*?<\/noscript>/g, '');
function catalog(file, name = 'catalog') {
  const source = read(file), literal = source.match(new RegExp(`(?:export )?const ${name}\\s*=\\s*(\\{[\\s\\S]*?\\n\\});`))?.[1];
  if (!literal) throw new Error(`Cannot read ${name} in ${file}`);
  return runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
}
const editorial = {
  'dream-strata': 'Explore a layered generative landscape in your browser. Move the cursor to shift floating monuments, suspended oceans, and distant moons.',
  mandelbulb: 'Explore a 3D Mandelbulb fractal in WebGL. Orbit and zoom into its folded surface, adjust power and iterations, and save a frame in your browser.',
  cathedral: 'Explore a Menger sponge fractal in 3D. Carve recursive tunnels into a cube, adjust recursion and twist, then orbit and zoom through its geometry.',
  'julia-tide': 'Explore an interactive Julia set. Move the cursor to change its complex constant, lock a shape, and zoom into the fractal in your browser.',
  'recursive-orchard': 'Grow a recursive 3D tree in your browser. Adjust branch angle and generations, bend the canopy with your cursor, and orbit its branching geometry.',
  'sierpinski-relic': 'Explore a 3D Sierpiński tetrahedron. Change recursion depth, separate nested pieces, and orbit the self-similar fractal in your browser.',
  'chaos-loom': 'Explore the Aizawa strange attractor as an interactive 3D artwork. Change its equations, orbit the trajectory, and reveal the geometry of chaos.',
  'newton-basins': 'Explore Newton fractals in the complex plane. Change the polynomial degree and relaxation, then pan and zoom through colorful basins of attraction.',
  'hopf-fibers': 'Explore the Hopf fibration in 3D. Rotate linked circles projected from a four-dimensional sphere and adjust their latitude and density.',
  'torus-knots': 'Explore torus knots and links in 3D. Change two winding numbers to reveal trefoils, linked components, and the geometry of coprime windings.',
  'gyroid-field': 'Explore a gyroid approximation in 3D. Adjust its periodic level-set equation and switch between solid, wireframe, and glass views of the labyrinth.',
  'reaction-diffusion': 'Paint an interactive Gray–Scott reaction–diffusion simulation. Adjust feed and removal rates to grow spots, waves, and labyrinths in your browser.',
  'clifford-attractor': 'Explore the Clifford strange attractor. Change the parameters of an iterated map and watch point density reveal patterns of deterministic chaos.',
  'klein-bottle': 'Explore a Klein bottle in 3D. Rotate its non-orientable surface, open a cutaway, and compare glass, solid, and wireframe views in your browser.',
  torus: 'Explore a torus in 3D. Change the ring and tube radii, orbit the surface, and switch between solid, glass, and wireframe views.',
  'mobius-strip': 'Explore a Möbius strip in 3D. Change its width and odd half-turns, trace its single boundary, and rotate this non-orientable surface.',
  'schwarz-lantern': 'Explore the Schwarz lantern polyhedron. Adjust cylinder rings and triangular bands to see why a finer mesh can produce a worse surface-area estimate.',
  'sierpinski-triangle': 'Build a Sierpiński triangle step by step. Adjust recursion and construction progress to explore self-similarity, area, and fractal dimension.',
  'koch-snowflake': 'Build a Koch snowflake step by step. Explore recursive construction, growing perimeter, and finite area with an interactive fractal in your browser.',
  'double-pendulum': 'Explore double-pendulum chaos. Set the starting angles and compare two nearly identical releases in an interactive physics simulation.',
  'orbital-gravity': 'Explore orbital gravity in your browser. Adjust a star’s pull, launch planets, and compare bound orbits, escape paths, and collisions.',
  'wave-interference': 'Explore wave interference from two sources. Change their spacing and frequency to reveal moving ripples, interference fringes, and standing patterns.',
  'rossler-attractor': 'Explore the Rössler strange attractor in 3D. Change its parameters, rotate the trajectory, and watch deterministic equations create a folded ribbon.',
  'magnetic-pendulums': 'Explore magnetic-pendulum chaos. Release nearby starting points toward three magnetic wells and adjust damping and attraction to compare their paths.',
  'orbit-ink': 'Draw in slowly rotating 3D space. Adjust rotation and pen depth, undo strokes, and save your interactive spatial drawing as an image.',
  'fibonacci-sculpture': 'Explore the Fibonacci sequence in 3D. Grow a sculpture of Fibonacci-sized cubes, follow its lifted spiral, and watch ratios approach the golden ratio.',
  'hyperspace-bloom': 'Explore a four-dimensional hypercube projected into 3D. Rotate its hidden dimension and layer echoes into an interactive generative artwork.',
  'gravity-well': 'Bend a disk of particle streams around a movable singularity. Explore an artistic gravity field with cursor controls, orbit, and adjustable flow.',
  'infinite-descent': 'Dive into a recursive polygon tunnel. Adjust twist and facets, bend its vanishing point, and explore infinite-looking generative architecture.',
  'silk-wind': 'Disturb a flowing 3D thread sculpture with your cursor. Adjust wind and weave, orbit the form, and explore an interactive Canvas artwork.',
  'impossible-water': 'Create ripples on an interactive surface made of light. Adjust flow and resonance and explore a generative Canvas water artwork.',
  afterimage: 'Draw gestures into a generative 3D artwork. Adjust drift and memory, orbit the trails, and watch your movement become an afterimage.',
  'electric-horizon': 'Travel through an interactive neon 3D landscape. Steer with arrow keys, change speed and geometry, and send pulses through a Canvas world.',
  'tandava-parallax': 'Explore a three-layer parallax starfield inspired by Tandava Cult. Scroll and move your cursor to compare star depths, drift, and parallax strength.'
};
export function getExperiments() {
  const index = read('index.html'), catalogs = { math: catalog('math-scenes.js'), fractal: catalog('fractal.js'), wild: catalog('wild-scenes.js'), levitated: catalog('levitated/experiments.js', 'works') };
  const cards = [...index.matchAll(/<a class="work-card" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, href, body]) => ({ href: decode(href), name: text(body.match(/<h2>(.*?)<\/h2>/)[1]), description: text(body.match(/<p>(.*?)<\/p>/)[1]), thumbnail: body.match(/<img[^>]+src="([^"]+)"/)[1], public: true }));
  cards.push({ href: 'wild.html?work=dream-strata', name: catalogs.wild['dream-strata'].name, description: catalogs.wild['dream-strata'].description, thumbnail: 'thumbnails/dream-strata.svg', public: false });
  return cards.map(card => {
    const url = new URL(card.href, origin + '/'), family = url.pathname.slice(1, -5), slug = url.searchParams.get('work') ?? 'tandava-parallax', data = catalogs[family]?.[slug] ?? {};
    let description = editorial[slug] ?? `${card.name}: ${card.description} Canvas ${data.recreation ? 'recreation' : 'adaptation'} of Jared Tarbell’s Levitated experiment.`;
    if (description.length > 190) description = description.slice(0, 187).replace(/\s+\S*$/, '') + '…';
    return { ...card, slug, family, data, description, title: family === 'levitated' ? `${card.name} — Levitated / Fractal Space` : `${card.name} — Fractal Space`, url: url.href, image: `social/${slug}.jpg`, output: family === 'tandava' ? 'tandava.html' : `_pages/${family}/${slug}.html` };
  });
}
function structuredExperiment(work) {
  const license = absolute(work.family === 'levitated' ? 'levitated/COPYING.txt' : 'LICENSE.txt');
  const art = { '@type': 'CreativeWork', '@id': work.url + '#artwork', name: work.name, description: work.description, url: work.url, image: absolute(work.image), creator: alex, license, isAccessibleForFree: true, inLanguage: 'en' };
  if (work.family === 'levitated') art.isBasedOn = { '@type': 'CreativeWork', name: work.name, url: `https://levitated.net/daily/${work.data.originalPage ?? work.data.original}.html`, creator: { '@type': 'Person', name: 'Jared Tarbell', url: 'https://levitated.net/' } };
  return { '@context': 'https://schema.org', '@graph': [site, { '@type': 'WebPage', '@id': work.url + '#webpage', url: work.url, name: work.title, description: work.description, isPartOf: { '@id': site['@id'] }, mainEntity: { '@id': art['@id'] }, primaryImageOfPage: { '@type': 'ImageObject', url: absolute(work.image), width: 1200, height: 630 }, breadcrumb: { '@id': work.url + '#breadcrumbs' }, inLanguage: 'en' }, art, { '@type': 'BreadcrumbList', '@id': work.url + '#breadcrumbs', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Fractal Space', item: origin + '/' }, { '@type': 'ListItem', position: 2, name: work.name, item: work.url }] }] };
}
function metadata(html, { title, description, url, image, imageAlt, structured, base = false }) {
  html = html.replace(markers, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[^>]*>/g, '');
  const tags = `${base ? '<base href="/">\n' : ''}<title>${escapeHTML(title)}</title>\n<meta name="description" content="${escapeHTML(description)}">\n<link rel="canonical" href="${escapeHTML(url)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<meta name="author" content="Alex Vaos">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Fractal Space">\n<meta property="og:locale" content="en_US">\n<meta property="og:title" content="${escapeHTML(title)}">\n<meta property="og:description" content="${escapeHTML(description)}">\n<meta property="og:url" content="${escapeHTML(url)}">\n<meta property="og:image" content="${absolute(image)}">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${escapeHTML(imageAlt)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${escapeHTML(title)}">\n<meta name="twitter:description" content="${escapeHTML(description)}">\n<meta name="twitter:image" content="${absolute(image)}">\n<meta name="twitter:image:alt" content="${escapeHTML(imageAlt)}">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">\n<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>`;
  // Apply theme before styles as usual; metadata is inserted after the charset.
  return html.replace(/<meta charset="utf-8">/, match => `${match}\n<!-- SEO:START -->\n${tags}\n<!-- SEO:END -->\n`);
}
function setContent(html, id, content) { const pattern = new RegExp(`(<(h1|h2|p|span|button|strong)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`); return html.replace(pattern, (_, start, tag, end) => start + escapeHTML(content) + end); }
function setHref(html, id, href) { return html.replace(new RegExp(`(<a\\b[^>]*id="${id}"[^>]*href=")[^"]*`), (_, start) => start + escapeHTML(href)); }
function preRender(template, work) {
  const d = work.data; let html = stripSEO(template);
  if (work.family === 'experiment') { html = setContent(html, 'page-title', work.name); html = setContent(html, 'page-description', work.description); html = setContent(html, 'scene-title', work.name.toUpperCase()); }
  else {
    html = setContent(html, 'title', work.name); html = setContent(html, 'description', d.description ?? work.description);
    for (const id of ['category', 'equation', 'explanation', 'status']) if (d[id]) html = setContent(html, id, d[id]);
    html = setContent(html, 'help-text', d.help ?? d.gesture ?? d.hint ?? work.description);
    if (d.a) html = setContent(html, 'label-a', d.a[0]); if (d.b) html = setContent(html, 'label-b', d.b[0]);
    if (d.special) html = setContent(html, 'special', d.special);
  }
  if (work.family === 'levitated') {
    html = setContent(html, 'edition', `EXPERIMENT ${d.number} / LEVITATED ${d.recreation ? 'RECREATION' : 'PORT'}`);
    html = setContent(html, 'hint', d.hint); html = setContent(html, 'action', d.action ?? 'Refill selection');
    html = setContent(html, 'original-credit', `Original experiment: Jared Tarbell / Levitated, ${d.year ?? 2003}`);
    html = setHref(html, 'original', `https://levitated.net/daily/${d.originalPage ?? d.original}.html`);
    html = setHref(html, 'original-source', `levitated/${d.original}.zip`);
    if (d.recreation) { html = setContent(html, 'adaptation-summary', 'A Levitated experiment re-created for Canvas, with modern controls.'); html = setContent(html, 'port-note', 'A Canvas recreation of the author’s published algorithm descriptions. Graphics and controls are newly implemented; see the port notes for differences.'); }
  }
  const fallback = `<!-- PREVIEW:START --><noscript><link rel="stylesheet" href="/static-preview.css"><article class="static-preview"><h2>${escapeHTML(work.name)}</h2><p>${escapeHTML(work.description)}</p><img src="/${work.thumbnail}" width="1000" height="625" alt="Preview of ${escapeHTML(work.name)}" loading="lazy">${d.explanation ? `<p>${escapeHTML(d.explanation)}</p>` : ''}<p>Enable JavaScript to interact with this experiment. Use a cursor, touch, or keyboard to explore.</p><a href="/">Browse all experiments</a></article></noscript><!-- PREVIEW:END -->`;
  return metadata(html.replace('</body>', fallback + '</body>'), { ...work, imageAlt: `${work.name} — interactive artwork on Fractal Space`, structured: structuredExperiment(work), base: work.family !== 'tandava' });
}
export function buildSEO() {
  const works = getExperiments(), publicWorks = works.filter(w => w.public), files = new Map(), templates = new Map();
  for (const work of works) { if (!templates.has(work.family)) templates.set(work.family, stripSEO(read(`${work.family}.html`))); files.set(work.output, preRender(templates.get(work.family), work)); }
  const indexStructured = { '@context': 'https://schema.org', '@graph': [site, { '@type': 'CollectionPage', '@id': origin + '/#collection', name: homeTitle, description: homeDescription, url: origin + '/', isPartOf: { '@id': site['@id'] }, mainEntity: { '@id': origin + '/#experiments' }, inLanguage: 'en' }, { '@type': 'ItemList', '@id': origin + '/#experiments', name: 'Interactive experiments', numberOfItems: publicWorks.length, itemListElement: publicWorks.map((w, i) => ({ '@type': 'ListItem', position: i + 1, name: w.name, url: w.url })) }] };
  let index = read('index.html');
  if (!index.includes('class="index-description"')) index = index.replace('</h1>', '</h1><p class="index-description">Interactive fractals, 3D geometry, chaos, and generative art. Explore mathematical experiments in your browser.</p>');
  files.set('index.html', metadata(index, { title: homeTitle, description: homeDescription, url: origin + '/', image: 'social/fractal-space.jpg', imageAlt: 'Fractal Space — interactive fractals, mathematics and generative art', structured: indexStructured }));
  const licenseTitle = 'License & credits — Fractal Space', licenseDescription = 'Fractal Space software licenses, Alex Vaos’s author credit, Jared Tarbell’s Levitated sources, and third-party notices.';
  files.set('licenses.html', metadata(read('licenses.html').replace(/(?:Twenty-four|\d+) Levitated experiments/, `${works.filter(w => w.family === 'levitated').length} Levitated experiments`), { title: licenseTitle, description: licenseDescription, url: origin + '/licenses.html', image: 'social/fractal-space.jpg', imageAlt: 'Fractal Space — interactive fractals, mathematics and generative art', structured: { '@context': 'https://schema.org', '@type': 'WebPage', name: licenseTitle, url: origin + '/licenses.html', description: licenseDescription, isPartOf: { '@id': site['@id'] } } }));
  const defaults = { experiment: 'silk-wind', fractal: 'mandelbulb', wild: 'hyperspace-bloom', math: 'newton-basins', levitated: 'invader-fractal' };
  const mappings = works.filter(w => w.family !== 'tandava').map(w => `    ~^/${w.family}\\.html:${w.slug}$ /${w.output};`);
  for (const [family, slug] of Object.entries(defaults)) mappings.push(`    ~^/${family}\\.html:$ /_pages/${family}/${slug}.html;`);
  files.set('seo-routes.conf', `# Generated by scripts/seo.mjs; include in Nginx http context.\nmap $args $seo_work {\n    default "";\n    ~(?:^|&)work=([^&]*) $1;\n}\nmap "$uri:$seo_work" $seo_page {\n    default "";\n${mappings.join('\n')}\n}\n`);
  files.set('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[origin + '/', ...publicWorks.map(w => w.url), origin + '/licenses.html'].map(url => `  <url><loc>${escapeHTML(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
  return { works, files };
}
export function writeSEO() { const result = buildSEO(); for (const [path, content] of result.files) { const target = `dist/${path}`; mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true }); writeFileSync(target, content); } return result; }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = process.argv.includes('--write') ? writeSEO() : buildSEO();
  if (!process.argv.includes('--write')) for (const [path, expected] of result.files) { if (read(path) !== expected) throw new Error(`Stale SEO output: dist/${path}. Run make seo.`); }
  console.log(`${process.argv.includes('--write') ? 'Generated' : 'Verified'} SEO for ${result.works.length} experiments and ${result.files.size} files.`);
}
