// Re-created from observation of tandavacult.com/js/main.js (2026-10-27).
// The three layers preserve the reference's density, depth, and triangle proportions.
export const layers = [
  { name: 'Far', density: .00028, radius: [.4, .9], opacity: [.25, .55], scroll: .04, pointer: 4, triangles: 0 },
  { name: 'Middle', density: .00011, radius: [.7, 1.3], opacity: [.4, .8], scroll: .12, pointer: 10, triangles: 0 },
  { name: 'Near', density: .00004, radius: [1.1, 1.8], opacity: [.6, 1], scroll: .28, pointer: 20, triangles: .14 }
];
const wrap = (n, size) => ((n % size) + size) % size;
export function makeStars(width, height, seed = 1) {
  let value = seed >>> 0;
  const rand = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  const between = range => range[0] + rand() * (range[1] - range[0]);
  return layers.map((layer, index) => Array.from({ length: Math.round(width * height * layer.density) }, () => ({
    x: rand() * width, y: rand() * height, radius: between(layer.radius), opacity: between(layer.opacity),
    flicker: .3 + rand() * .8, phase: rand() * Math.PI * 2, triangle: rand() < layer.triangles, layer: index
  })));
}
export function projectStar(star, state) {
  const layer = layers[star.layer], time = state.reduced ? 0 : state.time;
  const pointer = state.reduced ? [0, 0] : state.pointer;
  const shift = state.scroll * layer.scroll * state.depth + time * 22 * layer.scroll * state.drift;
  return {
    x: wrap(star.x - pointer[0] * layer.pointer * state.depth, state.width),
    y: wrap(star.y - shift - pointer[1] * layer.pointer * state.depth, state.height),
    radius: star.radius,
    opacity: star.opacity * (state.reduced ? 1 : .75 + .25 * Math.sin(time * star.flicker + star.phase)),
    triangle: star.triangle
  };
}
export function heroPose(scroll, height, reduced) {
  return reduced ? { y: 0, opacity: 1 } : { y: scroll * .18, opacity: Math.max(0, 1 - scroll / (height * .7)) };
}
