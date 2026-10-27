// Record the actual Canvas geometry as SVG previews; also reject invalid drawing coordinates.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync('dist/wild-scenes.js', 'utf8');
const { catalog, createScene } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function recorder(width, height) {
  const shapes = [], defs = []; let path = '', special = null, calls = 0;
  const finite = args => { for (const n of args) assert(Number.isFinite(n), `Non-finite Canvas coordinate: ${n}`); calls++; };
  const attr = value => {
    if (value?.id) return `url(#${value.id})`;
    // SVG presentation attrs need separate opacity for broad renderer compatibility.
    const m = String(value).match(/^hsla\(([^,]+),([^,]+),([^,]+),([^\)]+)\)$/);
    return m ? `hsl(${m[1]},${m[2]},${m[3]})" ${active === 'fill' ? 'fill' : 'stroke'}-opacity="${m[4]}` : value;
  };
  let active = 'fill';
  function shape(kind, style) { const blend = ctx.globalCompositeOperation === 'screen' ? ' style="mix-blend-mode:screen"' : ''; shapes.push(`<${kind} ${style}${blend}/>`); }
  function gradient(type, args) {
    finite(args); const id = `g${defs.length}`, stops = [], index = defs.length; defs.push('');
    return { id, addColorStop(offset, color) { active = 'fill'; stops.push(`<stop offset="${offset}" stop-color="${attr(color).replace('fill-opacity', 'stop-opacity')}"/>`); defs[index] = type === 'radial' ? `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${args[3]}" cy="${args[4]}" r="${args[5]}" fx="${args[0]}" fy="${args[1]}">${stops.join('')}</radialGradient>` : `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${args[0]}" y1="${args[1]}" x2="${args[2]}" y2="${args[3]}">${stops.join('')}</linearGradient>`; } };
  }
  const ctx = {
    globalCompositeOperation: 'source-over', fillStyle: '#000', strokeStyle: '#fff', lineWidth: 1,
    beginPath() { path = ''; special = null; },
    moveTo(...v) { finite(v); path += `M${v.join(' ')} `; }, lineTo(...v) { finite(v); path += `L${v.join(' ')} `; }, closePath() { path += 'Z'; },
    arc(x, y, r, start, end) { finite([x, y, r, start, end]); assert(r >= 0); special = `circle cx="${x}" cy="${y}" r="${r}"`; },
    ellipse(x, y, rx, ry, angle, start, end) { finite([x, y, rx, ry, angle, start, end]); special = `ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${angle * 180 / Math.PI} ${x} ${y})"`; },
    fill() { active = 'fill'; shape(special || `path d="${path}"`, `fill="${attr(ctx.fillStyle)}"`); },
    stroke() { active = 'stroke'; shape(special || `path d="${path}"`, `fill="none" stroke="${attr(ctx.strokeStyle)}" stroke-width="${ctx.lineWidth}"`); },
    fillRect(x, y, w, h) { finite([x, y, w, h]); active = 'fill'; shape(`rect x="${x}" y="${y}" width="${w}" height="${h}"`, `fill="${attr(ctx.fillStyle)}"`); },
    createRadialGradient(...v) { return gradient('radial', v); }, createLinearGradient(...v) { return gradient('linear', v); }
  };
  return { canvas: { width, height, getContext: () => ctx }, svg: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs>${defs.join('')}</defs>${shapes.join('')}</svg>`, count: () => calls };
}
for (const [slug, work] of Object.entries(catalog)) {
  const base = { time: 8, a: work.a[4], b: work.b[4], pointer: [.12, -.1], yaw: .3, pitch: .38, zoom: 1, palette: 0, seed: 1, direction: 1, travel: 0, alternate: false };
  const thumbnail = recorder(1000, 625); createScene(thumbnail.canvas, slug).draw(base);
  if (process.argv.includes('--write')) writeFileSync(`dist/thumbnails/${slug}.svg`, thumbnail.svg());
  let drawings = 0;
  for (const [width, height] of [[390, 844], [1600, 900]]) {
    for (const extreme of [false, true]) {
      const r = recorder(width, height), state = { ...base, a: work.a[extreme ? 2 : 1], b: work.b[extreme ? 2 : 1], zoom: extreme ? 2.4 : .4, pointer: extreme ? [1, 1] : [-1, -1], pitch: extreme ? 1.1 : -1.1, time: 10000, direction: -1, alternate: true };
      const scene = createScene(r.canvas, slug); scene.draw(state); assert(r.count() > 100);
      const before = r.svg(); const changed = recorder(width, height); createScene(changed.canvas, slug).draw({ ...state, pointer: [0, 0], yaw: 1.5, time: 10001, palette: 2 }); assert.notEqual(changed.svg(), before, `${slug} should respond to interaction`); drawings++;
    }
  }
  console.log(`PASS: ${slug}: preview + ${drawings} mobile/desktop limit states; finite geometry and interactive output.`);
}
