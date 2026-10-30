// Original Canvas artworks. Geometry stays independent of DOM/input handling.
export const catalog = {
  'hyperspace-bloom': { n: 11, name: 'Hyperspace bloom', category: 'POSTCARDS FROM THE FOURTH DIMENSION', description: 'A cube slips out of the dimensions you know. Pull it apart. Watch it become a flower.', accent: '#d4a4ff', a: ['Fourth dimension', -12.56, 12.56, .01, 1.1], b: ['Echoes', 1, 32, 1, 9], special: 'Invert the fourth dimension', gesture: 'DRAG TO ORBIT · ARROWS TO TURN · SPACE TO INVERT', help: 'Drag to orbit a true four-dimensional hypercube projected into three dimensions. Fourth dimension rotates its XW and YW planes; Echoes layers its previous forms. Space inverts its unfolding.' },
  'gravity-well': { n: 12, name: 'Gravity is a suggestion', category: 'AN UNREASONABLE CELESTIAL MACHINE', description: 'Thousands of little suns take the long way home. Move the singularity. Tear the sky.', accent: '#ffb685', a: ['Gravity', 0.05, 6, .01, 1], b: ['Accretion', 1, 64, 1, 20], special: 'Reverse the current', gesture: 'CURSOR BENDS SPACE · DRAG TO ORBIT · SPACE REVERSES TIME', help: 'Move the cursor or use arrows to drag the gravity well through its particle disk. Drag to tilt the whole structure. Gravity winds the orbits tighter, Accretion adds streams, and Space reverses their flow.' },
  'infinite-descent': { n: 13, name: 'Infinite descent', category: 'ARCHITECTURE WITHOUT AN OUTSIDE', description: 'A tunnel made of tunnels. The closer you get, the more there is to fall into.', accent: '#a3efcb', a: ['Twist', -3, 3, .01, .25], b: ['Facets', 3, 24, 1, 6], special: 'Turn the tunnel inside out', gesture: 'CURSOR BENDS THE TUNNEL · ARROWS TO STEER · SCROLL TO DIVE', help: 'Move or use arrows to bend the vanishing point. Scroll to travel into a recursive polygon tunnel; Twist coils the architecture and Facets changes its structure. Space reverses the direction of travel.' },
  'dream-strata': { n: 14, name: 'Dream strata', category: 'A PLACE THAT MOVES WHEN YOU DO', description: 'Impossible monuments, suspended oceans, two moons. There is no fixed point of view.', accent: '#ffb8cd', a: ['Parallax', -3, 5, .01, 1.1], b: ['Monuments', 1, 40, 1, 11], special: 'Shift to the other sky', gesture: 'CURSOR SHIFTS THE WORLD · ARROWS TO WANDER · SCROLL TO APPROACH', help: 'Move your cursor to look between layers of floating architecture. Arrow keys wander through the depth, scroll to approach, and Parallax changes how strongly the layers separate. Space swaps the sky.' }
};
const TAU = Math.PI * 2;
const wave = n => (Math.sin(n * 127.1 + 311.7) * 43758.5453 % 1 + 1) % 1;
export function createScene(canvas, slug) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  function line(points, color, width = 1, close = false, fill = null) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (close) ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function dot(x, y, radius, color) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fillStyle = color; ctx.fill();
  }
  function draw(s) {
    const { width: W, height: H } = canvas, unit = Math.min(W, H), t = s.time, px = s.pointer[0], py = s.pointer[1];
    const color = (h, l = 70, a = 1) => `hsla(${h + s.palette * 65},78%,${l}%,${a})`;
    function project(p, scale = 1) {
      const [x, y, z] = p, cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
      const xx = x * cy - z * sy, zz = x * sy + z * cy, yy = y * cp - zz * sp, depth = y * sp + zz * cp;
      const f = unit * .72 * s.zoom * scale / Math.max(.65, 4.8 + depth);
      return [W * .5 + xx * f, H * .45 + yy * f, depth];
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#080b15'; ctx.fillRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W * .5, H * .42, 0, W * .5, H * .42, Math.max(W, H) * .7);
    bg.addColorStop(0, color(slug === 'dream-strata' ? 290 : 245, 12)); bg.addColorStop(1, '#050811');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Fixed seeds keep the star field anchored while each artwork moves.
    for (let i = 0; i < 125; i++) dot(wave(i + s.seed) * W, wave(i * 3 + 2) * H, (.3 + wave(i * 9) * .6) * unit / 700, color(210, 80, .15 + wave(i) * .35));
    if (slug === 'hyperspace-bloom') {
      const vertices = Array.from({ length: 16 }, (_, i) => Array.from({ length: 4 }, (_, j) => i & (1 << j) ? 1 : -1));
      function vertex(p, phase, size) {
        let [x, y, z, w] = p;
        const a = s.a + t * .19 * s.direction + phase, b = a * .73 + s.seed * .1;
        [x, w] = [x * Math.cos(a) - w * Math.sin(a), x * Math.sin(a) + w * Math.cos(a)];
        [y, w] = [y * Math.cos(b) - w * Math.sin(b), y * Math.sin(b) + w * Math.cos(b)];
        const f = 2.5 / (3.8 - w);
        return project([x * f * size, y * f * size, z * f * size]);
      }
      ctx.globalCompositeOperation = 'screen';
      for (let echo = Math.round(s.b) - 1; echo >= 0; echo--) {
        const points = vertices.map(p => vertex(p, echo * .11, 1.9 + echo * .095));
        const hue = 265 + echo * 9 + Math.sin(t * .1) * 25;
        for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) {
          const xor = i ^ j;
          if ((xor & (xor - 1)) === 0) line([points[i], points[j]], color(hue, 72, echo === 0 ? .95 : .15), (echo === 0 ? 1.3 : .65) * unit / 700);
        }
        if (echo === 0) for (const p of points) {
          dot(p[0], p[1], 4.5 * unit / 700, color(hue, 80, .12));
          dot(p[0], p[1], 1.7 * unit / 700, color(hue, 94));
        }
      }
    } else if (slug === 'gravity-well') {
      ctx.globalCompositeOperation = 'screen';
      const center = [px * 1.4, py * .8, 0], origin = project(center);
      // Analytic streams avoid unstable integration, even after a long hidden tab.
      for (let arm = 0; arm < Math.round(s.b); arm++) {
        const points = [], offset = arm / s.b * TAU;
        for (let i = 0; i <= 220; i++) {
          const f = i / 220, radius = .22 + f * 3.8, theta = offset + s.a * 3 / (radius + .3) + t * s.direction * (.12 + .22 / radius);
          const warp = Math.exp(-radius * .3), x = Math.cos(theta) * radius + center[0] * warp, z = Math.sin(theta) * radius;
          const y = Math.sin(theta * 3 + t * .2) * .07 * radius + center[1] * warp - s.a * .5 / (radius + .6);
          const p = project([x, y, z]); points.push(p);
          if (i % 4 === arm % 4) dot(p[0], p[1], (.45 + wave(i + arm * 70) * 1.1) * unit / 700, color(18 + f * 60 + arm * 2, 55 + f * 30, .8));
        }
        line(points, color(24 + arm * 3, 68, .18), .6 * unit / 700);
      }
      ctx.globalCompositeOperation = 'source-over';
      const radius = unit * .041 * s.zoom, halo = ctx.createRadialGradient(origin[0], origin[1], radius * .65, origin[0], origin[1], radius * 2.6);
      halo.addColorStop(0, '#05060a'); halo.addColorStop(.28, '#05060a'); halo.addColorStop(.37, color(28, 90)); halo.addColorStop(.43, color(12, 60, .65)); halo.addColorStop(1, '#00000000');
      ctx.fillStyle = halo; ctx.fillRect(origin[0] - radius * 3, origin[1] - radius * 3, radius * 6, radius * 6);
      dot(origin[0], origin[1], radius * .8, '#030409');
    } else if (slug === 'infinite-descent') {
      const sides = Math.round(s.b), cx = W * (.5 + px * .13), cy = H * (.43 + py * .12);
      const levels = 48, advance = t * .23 * s.direction + s.travel;
      ctx.globalCompositeOperation = 'screen';
      let previous = null;
      for (let i = levels; i >= 0; i--) {
        const depth = i + ((advance % 1 + 1) % 1), radius = unit * 2.2 * s.zoom * Math.exp(-depth * .115);
        const twist = s.a * depth + t * .07 + s.yaw, points = [];
        for (let j = 0; j < sides; j++) {
          const angle = j / sides * TAU + twist;
          points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * (1 + s.pitch * .15)]);
        }
        line(points, color(155 + depth * 3, 68, .2 + (1 - i / levels) * .5), unit / 950, true);
        if (previous) for (let j = 0; j < sides; j++) {
          line([points[j], previous[j]], color(185 + i * 2, 64, .28), unit / 1100);
          // Recursive doorways: smaller polygons grow from every tunnel facet.
          const next = points[(j + 1) % sides], x = (points[j][0] + next[0]) / 2, y = (points[j][1] + next[1]) / 2;
          if (i % 3 === 0 && i < 34) {
            for (let k = 0; k < 3; k++) {
              const r = radius * .11 * Math.pow(.53, k), poly = [];
              for (let n = 0; n < sides; n++) poly.push([x + Math.cos(n / sides * TAU + twist) * r, y + Math.sin(n / sides * TAU + twist) * r]);
              line(poly, color(300 - depth * 3, 75, .32), unit / 1400, true);
            }
          }
        }
        previous = points;
      }
      dot(cx, cy, unit * .006, color(175, 94));
    } else if (slug === 'dream-strata') {
      const shift = s.alternate ? 120 : 0, lookX = px * s.a + s.yaw * .4, lookY = py * s.a + s.pitch * .4;
      // Explicit depth layers: the near islands travel much farther than the moons.
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, color(240 + shift, 10)); sky.addColorStop(.6, color(320 + shift, 22)); sky.addColorStop(1, color(18 + shift, 12));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 2; i++) {
        const x = W * (.35 + i * .3) - lookX * unit * .025, y = H * (.23 + i * .1) - lookY * unit * .02, r = unit * (.095 - i * .04);
        const moon = ctx.createRadialGradient(x - r * .3, y - r * .35, 0, x, y, r);
        moon.addColorStop(0, color(35 + shift + i * 120, 90)); moon.addColorStop(.8, color(320 + shift, 65)); moon.addColorStop(1, color(290 + shift, 35));
        ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      for (let layer = 0; layer < 7; layer++) {
        const depth = (layer + 1) / 7, ground = H * (.5 + depth * .4) - lookY * unit * depth * .12;
        const ridge = [[0, H]];
        for (let x = -50; x <= W + 50; x += 15) ridge.push([x, ground + Math.sin(x / unit * 5 + layer * 1.7 + lookX * depth) * unit * .04 * depth]);
        ridge.push([W, H]); line(ridge, color(280 + shift, 15 + depth * 2), .5, true, color(265 + shift + layer * 7, 10 + depth * 8));
      }
      const count = Math.round(s.b);
      for (let i = 0; i < count; i++) {
        const depth = .3 + i / count * .9, size = unit * (.04 + depth * .075) * s.zoom;
        const x = W * (.08 + wave(i * 9 + s.seed) * .84) - lookX * unit * depth * .16;
        const y = H * (.27 + wave(i * 3 + 11) * .38) - lookY * unit * depth * .12 + Math.sin(t * .35 + i * 3) * unit * .015;
        const hue = 290 + shift + i * 9;
        // Hanging inverted pyramids and their impossibly narrow towers.
        line([[x - size, y], [x + size, y], [x, y + size * .85]], color(hue, 65, .6), .7, true, color(hue, 21));
        line([[x, y], [x + size, y], [x, y + size * .85]], color(hue, 50, .5), .6, true, color(hue, 14));
        const h = size * (1.3 + wave(i + 9) * 1.8), w = size * .2;
        line([[x - w, y], [x - w, y - h], [x + w, y - h - w * .4], [x + w, y]], color(hue, 75, .7), .7, true, color(hue, 26));
        line([[x, y - h], [x, y]], color(hue, 90, .5), .5);
        ctx.strokeStyle = color(30 + shift, 80, .8); ctx.lineWidth = unit / 900;
        ctx.beginPath(); ctx.ellipse(x, y - h * .67, size * .7, size * .2, -.3 + Math.sin(t * .2 + i) * .3, 0, TAU); ctx.stroke();
        dot(x, y - h - size * .13, unit * .0025, color(30 + shift, 95));
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  return { draw };
}
