// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// An original elastic-blade artwork, not a calibrated vegetation/fluid model.
const TAU = Math.PI * 2, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function random(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
export function grassCamera(width, height) {
  const focal = height * .85, horizon = height * .20;
  return { focal, horizon,
    project(x, y, z) { const depth = Math.max(.8, 4 + z); return [width / 2 + x * focal / depth, horizon + (2.7 - y) * focal / depth]; },
    root(blade) { const depth = 2.7 / (.04 + blade.u * 1.12); return [(blade.nx - .5) * width / focal * depth, 0, depth - 4]; }
  };
}
export function grassGust(gust, time, nx, u) {
  const age = (time - gust.start) / gust.duration; if (age <= 0 || age >= 1) return 0;
  const coordinate = gust.x * (nx - .5) + gust.z * (.5 - u) * .7, front = age * 1.8 - .9;
  return Math.exp(-1 * ((coordinate - front) / .17) ** 2) * Math.sin(Math.PI * age) * gust.power;
}
export function createGrassField(seed = 1, count = 3600) {
  const rng = random(seed), size = clamp(Math.round(count), 500, 5000), rows = 46;
  const blades = Array.from({ length: size }, (_, i) => ({ nx: -.07 + rng() * 1.14, u: (i % rows + rng()) / rows, height: .65 + rng() * .9, width: .018 + rng() * .025, lean: (rng() - .5) * .23, phase: rng() * TAU, tone: rng(), stiffness: 26 + rng() * 22, x: 0, z: 0, vx: 0, vz: 0 })).sort((a, b) => a.u - b.u);
  const pointer = { x: .5, y: .5, active: false, mx: 0, my: 0 }, gusts = [];
  const model = { blades, pointer, gusts, time: 0, steps: 0, gustCount: 0, nextGust: 2.5 + rng() * 1.8, wind: .75, reach: .2, aspect: 1 };
  function gust(preview = false) {
    const angle = (rng() - .5) * .9 + (rng() < .3 ? Math.PI : 0), duration = 2.8 + rng() * 1.2;
    gusts.push({ start: model.time - (preview ? duration * .45 : 0), duration, x: Math.cos(angle), z: Math.sin(angle), power: 1.1 + rng() * .5 });
    if (gusts.length > 3) gusts.shift(); model.gustCount++;
  }
  function target(blade) {
    const t = model.time, phase = blade.phase, breeze = .18 + .10 * Math.sin(t * .8 - blade.nx * 4 + blade.u * 3) + .055 * Math.sin(t * 1.7 + phase);
    let x = model.wind * breeze, z = model.wind * .06 * Math.sin(t * .5 + blade.u * 7);
    for (const g of gusts) { const force = grassGust(g, t, blade.nx, blade.u) * model.wind; x += force * g.x; z += force * g.z; }
    if (pointer.active) {
      const depth = 2.7 / (.04 + blade.u * 1.12), y = .2 + (2.7 - blade.height * .5) * .85 / depth;
      const sx = model.aspect >= 1 ? model.aspect : 1, sy = model.aspect >= 1 ? 1 : 1 / model.aspect;
      const dx = (blade.nx - pointer.x) * sx, dy = (y - pointer.y) * sy, distance = Math.hypot(dx, dy), reach = model.reach;
      if (distance < reach) { const weight = (1 - (distance / reach) ** 2) ** 2, norm = Math.max(.025, distance); x += weight * (dx / norm * 1.05 + pointer.mx * 6); z -= weight * (dy / norm * .9 + pointer.my * 6); }
    }
    const length = Math.hypot(x, z), scale = length > 1.15 ? 1.15 / length : 1;
    return [x * scale, z * scale];
  }
  function pose() { for (const b of blades) { [b.x, b.z] = target(b); b.vx = b.vz = 0; } }
  function configure(wind, reach, aspect = model.aspect, frozen = false) { model.wind = clamp(wind, 0, 3); model.reach = clamp(reach, .05, .5); model.aspect = clamp(aspect, .2, 6); if (frozen) pose(); }
  function movePointer(x, y, frozen = false) {
    if (pointer.active) { pointer.mx = clamp((x - pointer.x) * (model.aspect >= 1 ? model.aspect : 1), -.3, .3); pointer.my = clamp((y - pointer.y) * (model.aspect < 1 ? 1 / model.aspect : 1), -.3, .3); }
    else pointer.mx = pointer.my = 0;
    pointer.x = clamp(x, 0, 1); pointer.y = clamp(y, 0, 1); pointer.active = true; if (frozen) pose();
  }
  function leave(frozen = false) { pointer.active = false; pointer.mx = pointer.my = 0; if (frozen) pose(); }
  function step(dt = 1 / 60) {
    const elapsed = clamp(dt, 0, .05), steps = Math.ceil(elapsed * 60); if (!steps) return;
    const h = elapsed / steps;
    for (let i = 0; i < steps; i++) {
      model.time += h; model.steps++;
      if (model.time >= model.nextGust) { gust(); model.nextGust = model.time + 7 + rng() * 6; }
      for (let j = gusts.length - 1; j >= 0; j--) if (model.time - gusts[j].start >= gusts[j].duration) gusts.splice(j, 1);
      for (const b of blades) {
        const [tx, tz] = target(b), drag = 8.2;
        b.vx = clamp(b.vx + ((tx - b.x) * b.stiffness - drag * b.vx) * h, -6, 6);
        b.vz = clamp(b.vz + ((tz - b.z) * b.stiffness - drag * b.vz) * h, -6, 6);
        b.x += b.vx * h; b.z += b.vz * h;
        const norm = Math.hypot(b.x, b.z); if (norm > 1.3) { b.x *= 1.3 / norm; b.z *= 1.3 / norm; }
      }
      pointer.mx *= Math.exp(-h * 7); pointer.my *= Math.exp(-h * 7);
    }
  }
  configure(.75, .2); pose();
  return Object.assign(model, { configure, movePointer, leave, step, gust, pose });
}
const palettes = [
  { sky: ['#91b9bb', '#e4e8ba'], ground: ['#637f3d', '#152e24'], hue: 91, saturation: 46, sun: '#fff7c8' },
  { sky: ['#b69b84', '#ffe5b5'], ground: ['#a88b43', '#3d3920'], hue: 48, saturation: 55, sun: '#ffe9b3' },
  { sky: ['#141a3b', '#827a9b'], ground: ['#4e5265', '#141b2e'], hue: 240, saturation: 34, sun: '#e1dcff' },
  { sky: ['#89afb8', '#d6e8dc'], ground: ['#648e81', '#153c3b'], hue: 160, saturation: 35, sun: '#e9fff7' },
  { sky: ['#846c85', '#ffc5a1'], ground: ['#8b724f', '#352735'], hue: 24, saturation: 48, sun: '#ffe0b3' }
];
export function createGrassScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  let model, seed, configured = '', camera, roots = [], frame = '', cursor = null;
  function prepare(s) {
    const born = !model || seed !== s.seed;
    if (born) { seed = s.seed; model = createGrassField(seed, canvas.width < canvas.height ? 2200 : 3600); configured = ''; frame = ''; if (cursor) model.movePointer(...cursor, !!s.paused); }
    const next = [canvas.width, canvas.height].join(':');
    if (next !== frame) { camera = grassCamera(canvas.width, canvas.height); roots = model.blades.map(b => camera.root(b)); frame = next; }
    const key = [s.a, s.b, frame].join(':');
    if (configured !== key) { model.configure(s.a, s.b, canvas.width / canvas.height, !!s.paused || born); configured = key; }
  }
  function pointer(s, x, y) { prepare(s); cursor = [(x + 1) / 2, (y + 1) / 2]; model.movePointer(...cursor, !!s.paused); }
  function leave(s) { cursor = null; prepare(s); model.leave(!!s.paused); }
  function gust(s) { prepare(s); model.gust(!!s.paused); if (s.paused) model.pose(); }
  function step(s, dt = 1 / 60) { prepare(s); model.step(dt); return true; }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), p = palettes[s.palette % palettes.length];
    const sky = ctx.createLinearGradient(0, 0, 0, H * .4); sky.addColorStop(0, p.sky[0]); sky.addColorStop(1, p.sky[1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * .77, H * .16, 0, W * .77, H * .16, unit * .3); sun.addColorStop(0, p.sun + 'aa'); sun.addColorStop(.16, p.sun + '33'); sun.addColorStop(1, p.sun + '00'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H * .5);
    // Distant soft ridges anchor the field without a hard horizon line.
    for (let layer = 0; layer < 3; layer++) { ctx.beginPath(); ctx.moveTo(0, H); for (let i = 0; i <= 50; i++) { const x = i / 50; ctx.lineTo(x * W, H * (.22 + layer * .017 + Math.sin(x * 5 + layer * 1.3) * .015 + Math.sin(x * 13 + layer) * .004)); } ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = [`${p.ground[0]}55`, `${p.ground[0]}99`, p.ground[0]][layer]; ctx.fill(); }
    const ground = ctx.createLinearGradient(0, H * .25, 0, H); ground.addColorStop(0, p.ground[0]); ground.addColorStop(1, p.ground[1]); ctx.fillStyle = ground; ctx.fillRect(0, H * .26, W, H * .74);
    for (let i = 0; i < model.blades.length; i++) {
      const b = model.blades[i], root = roots[i], norm = Math.hypot(b.x, b.z), left = [], right = [], center = [], segments = b.u < .15 ? 3 : 5;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments, h = b.height, point = camera.project(root[0] + h * (b.lean * t + b.x * t * t), h * (t - Math.min(.60, norm * .34) * t * t * t), root[2] + h * b.z * .5 * t * t);
        const width = b.width * camera.focal / Math.max(.8, 4 + root[2]) * (1 - t) ** .7;
        left.push([point[0] - width / 2, point[1]]); right.push([point[0] + width / 2, point[1]]); center.push(point);
      }
      ctx.beginPath(); left.forEach((v, j) => j ? ctx.lineTo(...v) : ctx.moveTo(...v)); for (let j = right.length - 1; j >= 0; j--) ctx.lineTo(...right[j]); ctx.closePath();
      const light = 21 + b.tone * 23 + (1 - b.u) * 12 + clamp(b.x, -.6, .6) * 5;
      ctx.fillStyle = `hsl(${p.hue + b.tone * 22},${p.saturation}%,${light}%)`; ctx.fill();
      if (b.u > .35 && i % 3 === 0) { ctx.beginPath(); center.forEach((v, j) => j ? ctx.lineTo(...v) : ctx.moveTo(...v)); ctx.strokeStyle = `hsla(${p.hue + 17},50%,${Math.min(78, light + 21)}%,.4)`; ctx.lineWidth = Math.max(.3, b.u * unit / 1300); ctx.stroke(); }
    }
    // A few airborne seeds follow the same slow wind direction.
    for (let i = 0; i < 24; i++) {
      const x = ((i * .61803398875 + model.time * (.008 + i % 3 * .003) * s.a) % 1.2) * W - .1 * W, y = H * (.20 + (i * .381966 % .40)) + Math.sin(model.time * .5 + i) * H * .018;
      ctx.beginPath(); ctx.arc(x, y, Math.max(.5, unit * (.0006 + (i % 4) * .00022)), 0, TAU); ctx.fillStyle = p.sun + '66'; ctx.fill();
    }
    return `${model.blades.length} blades · ${s.a === 0 ? 'Still air' : model.gusts.length ? 'Gust' : 'Breeze'} · ${model.pointer.active ? 'Brushing' : 'Move / touch'}`;
  }
  return { prepare, draw, pointer, leave, gust, step, get data() { return model; } };
}
