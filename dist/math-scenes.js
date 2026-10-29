import { createFibonacciScene } from './fibonacci-sculpture.js';
export { goldenRatio, fibonacciNumbers, fibonacciSculpture, fibonacciFrame, fibonacciVertices } from './fibonacci-sculpture.js';
import { createInkScene } from './orbit-ink.js';
export { inkRotate, inkInverse, inkLayout, inkProject, inkUnproject, createInkDrawing } from './orbit-ink.js';
import { createExtraMathScene } from './math-extra.js';
export { integrateRK4, waveSample, rosslerDerivative, rosslerCurve, magneticPoles, magneticDerivative, magneticEnergy, magneticLayout, createMagneticPendulums } from './math-extra.js';
// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Mathematical constructions. Klein bottle parametrization adapted from Three.js
// (MIT, Copyright three.js authors); see math/threejs-LICENSE.txt and math-notes.txt.
export const catalog = {
  'newton-basins': { n: 40, name: 'Newton basins', category: 'COMPLEX DYNAMICS', description: 'Every pixel asks the same question: which root will I reach?', equation: 'z ← z − λ (zⁿ − 1) / (n zⁿ⁻¹)', explanation: 'Apply relaxed Newton iteration to zⁿ − 1 at every starting point. Hue identifies the root reached; brightness records convergence speed. Dark pixels have not converged within 55 iterations. The jagged borders separate basins of attraction.', a: ['Polynomial degree n', 3, 7, 1, 3], b: ['Relaxation λ', .5, 1.5, .01, 1], special: 'Reset the complex plane', gesture: 'DRAG / ARROWS TO PAN · SCROLL / + − TO ZOOM', mode: 'plane' },
  'hopf-fibers': { n: 41, name: 'Hopf fibers', category: 'TOPOLOGY / S³ → S²', description: 'Circles from a four-dimensional sphere, each linked once with every other.', equation: '(z₁, z₂) = (cos η eⁱᵗ, sin η eⁱ⁽ᵗ⁺φ⁾)', explanation: 'Each curve is a circle on the unit three-sphere in four dimensions. Stereographic projection brings it into three dimensions. Three nearby latitudes form nested tori; changing η selects their position on the base sphere. Distinct fibers link once. The display uses finite curve samples.', reference: 'https://nilesjohnson.net/hopf.html', a: ['Latitude η', .2, 1.1, .01, .65], b: ['Fibers per latitude', 8, 40, 1, 20], special: 'Reverse the rotation', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL / + − TO ZOOM', mode: 'orbit' },
  'torus-knots': { n: 42, name: 'Torus knots', category: 'KNOT THEORY', description: 'Two winding numbers decide whether a single strand becomes a knot—or several become a link.', equation: 'r(t) = ((R+r cos qt) cos pt, (R+r cos qt) sin pt, r sin qt)', explanation: 'The integers p and q count windings around a torus. Coprime windings produce one knot; a common divisor d produces d separate linked components. The renderer traces every component, using reduced windings p/d and q/d with distinct phase offsets. The default (3,2) is a trefoil.', a: ['Longitudinal winding p', 2, 9, 1, 3], b: ['Meridional winding q', 2, 11, 1, 2], special: 'Next winding pair', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL / + − TO ZOOM', mode: 'orbit' },
  'gyroid-field': { n: 43, name: 'Gyroid', category: 'IMPLICIT SURFACES', description: 'One periodic equation opens a labyrinth with no preferred direction.', equation: 'sin x cos y + sin y cos z + sin z cos x = c', explanation: 'This trigonometric level set is a common nodal approximation to the gyroid, rather than an exact minimal surface. Moving c changes the level set; Repeats reveals its periodic cells. Space cycles solid, wireframe, and glass views to expose the passages. A marching-tetrahedra mesh approximates the surface, with lighting from its analytic gradient. The finite domain is open at its faces.', reference: 'https://ntrs.nasa.gov/citations/19700020472', a: ['Level c', -1, 1, .02, 0], b: ['Repeats', 1, 2, 1, 1], special: 'Solid / wireframe / glass', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL / + − TO ZOOM', mode: 'orbit' },
  'reaction-diffusion': { n: 44, name: 'Reaction–diffusion', category: 'PATTERN FORMATION', description: 'Two concentrations, two rates. Spots and labyrinths emerge from local reactions.', equation: '∂ₜA = ΔA − AB² + f(1−A); ∂ₜB = ½ΔB + AB² − (k+f)B', explanation: 'A fixed-step Gray–Scott simulation: A diffuses twice as fast as B; AB² converts A into B. Feed f replenishes A and removal k drains B. The periodic grid uses a nine-point Laplacian, Δt = 1, and concentrations bounded to [0,1]. Drag to seed B. Pause freezes the simulation; changing rates then takes effect when resumed.', reference: 'https://www.karlsims.com/rd.html', a: ['Feed f', .01, .08, .0001, .055], b: ['Removal k', .045, .07, .0001, .062], special: 'Next chemical regime', gesture: 'DRAG TO SEED B · ARROWS MOVE BRUSH · SPACE CHANGES REGIME', mode: 'reaction' },
  'clifford-attractor': { n: 45, name: 'Clifford attractor', category: 'ITERATED MAPS / CHAOS', description: 'A point follows a pair of equations. Its visits become a luminous density field.', equation: 'x′ = sin(ay) + c cos(ax); y′ = sin(bx) + d cos(by)', explanation: 'Both new coordinates use the previous point simultaneously. The renderer counts visits to each grid cell, then colors logarithmic density. The default constants are c = 1 and d = 0.7; Space selects another preset. Changing a or b restarts accumulation. Some parameters settle to simple cycles instead of a strange attractor.', a: ['Parameter a', -3, 3, .01, -1.4], b: ['Parameter b', -3, 3, .01, 1.6], special: 'Next attractor preset', gesture: 'ARROWS ADJUST a / b · SPACE FOR PRESETS · P PAUSES ACCUMULATION', mode: 'clifford' },
  'klein-bottle': { n: 46, name: 'Klein bottle', category: 'TOPOLOGY / NON-ORIENTABLE SURFACES', description: 'Follow a surface that has no globally distinct inside and outside.', equation: '(u, v) ∼ (u+2π, π−v); (u, v) ∼ (u, v+2π)', explanation: 'A Klein bottle is a closed, non-orientable surface. Its familiar bottle shape is an immersion into three dimensions: the neck passes through the wall, while the abstract surface does not join at that crossing. Neck width changes the shape; Surface reveal opens a cutaway. Space cycles glass, solid, and wireframe views. The fully revealed mesh identifies its end with a reversed parameter direction. Local shading is two-sided because no consistent global normal exists.', reference: 'https://www.math.union.edu/~dpvc/TFB/Art/PAC-9603/tour/klein/klein.html', a: ['Neck width', .65, 1.25, .01, 1], b: ['Surface reveal', .2, 1, .01, 1], special: 'Glass / solid / wireframe', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL TO ZOOM · SPACE CHANGES SURFACE', mode: 'orbit' },
  'torus': { n: 47, name: 'Torus', category: 'TOPOLOGY / SURFACES OF REVOLUTION', description: 'Two circular directions, one hole. Change the radii and follow the surface.', equation: 'r(u,v) = ((R+r cos v) cos u, r sin v, (R+r cos v) sin u)', explanation: 'A circle of radius r revolved around an axis at distance R produces a torus. The two sliders change its ring radius R and tube radius r, always keeping R greater than r so the hole remains open. Unlike the Klein bottle, this surface is orientable. Both are closed surfaces with Euler characteristic zero. Space cycles solid, wireframe, and glass views.', a: ['Ring radius R', 1.2, 2.4, .01, 1.7], b: ['Tube radius r', .2, 1.1, .01, .65], special: 'Solid / wireframe / glass', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL TO ZOOM · SPACE CHANGES SURFACE', mode: 'orbit' },
  'mobius-strip': { n: 48, name: 'Möbius strip', category: 'TOPOLOGY / ONE-SIDED SURFACES', description: 'A half-turn joins the ends of a ribbon. Follow its only edge all the way home.', equation: 'r(u,v) = ((R+v cos(hu/2)) cos u, v sin(hu/2), (R+v cos(hu/2)) sin u)', explanation: 'A Möbius strip is a non-orientable surface with one boundary loop. Its ends join with the width coordinate reversed: (0,v) is identified with (2π,−v). The width slider changes the ribbon; Half-turns selects 1, 3, or 5, all odd. The bright tracer follows the boundary and returns after two trips around the center. Space cycles solid, wireframe, and glass views. The tracer and rotation pause together; manual controls still work.', a: ['Ribbon half-width', .15, .85, .01, .55], b: ['Half-turns h', 1, 5, 2, 1], special: 'Solid / wireframe / glass', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL TO ZOOM · SPACE CHANGES SURFACE', mode: 'orbit' },
  'schwarz-lantern': { n: 49, name: 'Schwarz lantern', category: 'GEOMETRY / SCHWARZ’S POLYHEDRON', description: 'A cylinder assembled from triangles—and a warning that finer meshes can have worse area estimates.', equation: 'A = 2mn r sin(π/n) √((H/m)² + r²(1−cos(π/n))²)', explanation: 'Schwarz’s polyhedron, or Schwarz lantern, stacks staggered polygon rings on a cylinder. The controls set n vertices per ring and m bands; there are 2mn triangular faces. The live area ratio compares their summed area with the cylinder’s lateral area 2πrH, excluding end caps. More bands can increase error even though the vertices lie on the cylinder. When both counts grow, convergence requires m/n² to tend to zero. Space cycles solid, wireframe, and glass views.', reference: 'https://page.math.tu-berlin.de/~sullivan/L/10S/Geo2/ex1.pdf', a: ['Vertices per ring n', 4, 40, 1, 12], b: ['Vertical bands m', 2, 160, 1, 18], special: 'Solid / wireframe / glass', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL TO ZOOM · SPACE CHANGES SURFACE', mode: 'orbit' },
  'sierpinski-triangle': { n: 50, name: 'Sierpiński triangle', category: 'FRACTALS / RECURSIVE SUBDIVISION', description: 'Three smaller triangles survive each cut. Follow a simple rule toward infinite detail.', equation: 'Nₙ = 3ⁿ; sₙ = 2⁻ⁿ; Aₙ/A₀ = (3/4)ⁿ; D = log 3 / log 2', explanation: 'Join the midpoints of an equilateral triangle and remove the central triangle; repeat on the three survivors. Recursion depth sets the target generation. Construction progress reveals each round of cuts, interpolating the next central holes as you move the slider. Space advances a full generation, wrapping back to the initial triangle. The remaining area is (3/4)ⁿ after n complete generations. The infinite limiting set has dimension log 3 / log 2; every finite rendering is an approximation.', a: ['Recursion depth', 0, 8, 1, 6], b: ['Construction progress', 0, 1, .01, 1], special: 'Next construction step', gesture: 'DRAG / ARROWS TO PAN · SCROLL TO ZOOM · SPACE STEPS CONSTRUCTION', mode: 'plane', planeCenterY: .42, planeWidth: 2.5 },
  'koch-snowflake': { n: 51, name: 'Koch snowflake', category: 'FRACTALS / INFINITE BOUNDARIES', description: 'A triangle grows a coastline. Infinite perimeter, finite area, one repeating rule.', equation: 'Nₙ = 3·4ⁿ; Pₙ/P₀ = (4/3)ⁿ; Aₙ/A₀ = 8/5 − (3/5)(4/9)ⁿ', explanation: 'Replace the middle third of every edge with two sides of an outward equilateral triangle. Each edge becomes four edges, each one-third as long. Recursion depth sets the target; Construction progress raises the next generation of triangular peaks. Space advances one complete generation and wraps to the initial triangle. The perimeter grows without bound while the area approaches 8/5 of the starting triangle. The limiting boundary has dimension log 4 / log 3; every finite rendering is a polygonal approximation.', a: ['Recursion depth', 0, 7, 1, 5], b: ['Construction progress', 0, 1, .01, 1], special: 'Next construction step', gesture: 'DRAG / ARROWS TO PAN · SCROLL TO ZOOM · SPACE STEPS CONSTRUCTION', mode: 'plane', planeCenterY: .42, planeWidth: 3.1 },
  'double-pendulum': { n: 52, name: 'Double pendulum', category: 'CHAOS / COUPLED MOTION', description: 'Two arms, one law of gravity. A tiny change becomes an entirely different dance.', equation: '2θ̈₁ + cos(δ)θ̈₂ = −2g sin θ₁ − sin(δ)ω₂²; δ = θ₁−θ₂', explanation: 'Two equal point masses hang from rigid, massless rods of equal length. Angles are measured from the downward vertical; each slider sets a starting angle and releases both masses from rest. The brighter rods show the main pendulum; the faint twin starts with its lower angle just 0.01° larger. At energetic starting positions their paths can diverge. Small oscillations can remain regular. There is no damping or forcing. Eight fourth-order Runge–Kutta substeps per display tick approximate the equations; the energy drift readout reports numerical error. Space resets the same release, R cycles starting positions, and P pauses. Drag sets the lower starting angle. Trails retain the latest 30 seconds.', reference: 'https://www.myphysicslab.com/pendulum/double-pendulum-en.html', a: ['Upper starting angle θ₁ (°)', -175, 175, 1, 120], b: ['Lower starting angle θ₂ (°)', -175, 175, 1, -25], special: 'Replay the same release', gesture: 'DRAG SETS LOWER ANGLE · ARROWS SET ANGLES · SPACE REPLAYS · P PAUSES', mode: 'pendulum', previewSteps: 450 },
  'orbital-gravity': { n: 53, name: 'Orbital gravity', category: 'CELESTIAL MECHANICS / KEPLER ORBITS', description: 'Six worlds circle a star. Change its pull, change their speed, or launch a world of your own.', equation: 'r̈ = −μr / |r|³; μ = GM; v_c = √(μ/r); v_esc = √(2μ/r)', explanation: 'Each planet follows a fixed central star independently, in a flat plane. Gravity μ combines the gravitational constant and stellar mass. The six starting planets have tangential launch speeds k/√r in normalized units: circular motion needs k = √μ, escape starts at k = √(2μ). Changing either slider resets the system for repeatable comparisons. Drag from a point in space in the direction of launch; longer arrows give faster launches. Click drops a planet from rest. Up to twelve planets are retained. Space resets to six; R cycles orbit presets; P pauses; scroll, pinch or + / − zooms. Fixed-step velocity-Verlet integration approximates the inverse-square force. Planets hitting the star are absorbed; unbound planets beyond 200 units retire. Trails retain 30 simulation units. Planet sizes and colors are illustrative.', reference: 'https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/', a: ['Stellar gravity μ = GM', .25, 2.5, .01, 1.2], b: ['Launch speed k', .2, 2.2, .01, 1], special: 'Reset six-planet system', gesture: 'DRAG TO LAUNCH · ARROWS CHANGE GRAVITY / SPEED · SCROLL TO ZOOM · P PAUSES', mode: 'gravity', previewSteps: 900 },
  'wave-interference': { n: 54, name: 'Interference pool', category: 'WAVES / SUPERPOSITION', description: 'Two sources ripple through a luminous surface. Their meeting draws a moving geometry.', equation: 'u = Σ cos(2πrᵢ/λ − ωt + φᵢ) / √(1+0.8rᵢ)', explanation: 'This analytic surface adds two coherent radial wave profiles with the same frequency. The height scale is illustrative; the decaying amplitude is chosen for display. Wavelength and source separation change the interference pattern. Space switches the second source between matching and opposite phase: along the centerline the equal contributions reinforce or cancel. This is prescribed superposition, with no boundary reflections or fluid solver. Drag/arrows orbit, scroll/pinch zoom, and P freezes the waves and camera.', a: ['Wavelength λ', .4, 2.4, .01, 1.1], b: ['Source separation', .3, 3, .01, 1.4], help: 'Drag or use arrows to orbit the wave surface. Scroll / pinch / + / − zooms. Space switches between matching and opposite source phase. P freezes the waves and view; controls still work. Wavelength and source separation change the pattern.', special: 'Switch source phase', gesture: 'DRAG / ARROWS TO ORBIT · SPACE SWITCHES PHASE · P FREEZES WAVES', mode: 'orbit' },
  'rossler-attractor': { n: 55, name: 'Rössler attractor', category: 'CHAOS / CONTINUOUS FLOWS', description: 'A ribbon of motion spirals, lifts, and folds back into itself.', equation: 'ẋ = −y−z; ẏ = x+ay; ż = 0.2+z(x−c)', explanation: 'The Rössler system is a continuous flow with three coupled equations. The default a=0.2, b=0.2, c=5.7 shows its familiar folded spiral. Other parameters can produce regular cycles or different behavior. An RK4 trajectory discards an initial transient and keeps 8,000 samples; moving the controls recomputes it. The view rotates around that finite trace. Space reverses the view rotation; R changes the starting point. A trajectory leaving the finite window stops and is labeled.', reference: 'https://doi.org/10.1016/0375-9601(76)90101-8', a: ['Parameter a', .1, .28, .01, .2], b: ['Parameter c', 3.5, 6.5, .05, 5.7], help: 'Drag or use arrows to orbit the finite trajectory. Scroll / pinch / + / − zooms. Sliders rebuild the trace. Space reverses view rotation; R selects a nearby starting point; P freezes rotation. This is a finite RK4 sample of the continuous flow.', special: 'Reverse the view rotation', gesture: 'DRAG / ARROWS TO ORBIT · SCROLL TO ZOOM · SPACE REVERSES VIEW', mode: 'orbit' },
  'magnetic-pendulums': { n: 56, name: 'Magnetic pendulums', category: 'CHAOS / ATTRACTING WELLS', description: 'Twenty-one releases wander between three magnetic wells, weaving paths toward rest.', equation: 'r̈ = −0.3r − γṙ + Σ q(mᵢ−r) / (|mᵢ−r|²+0.35²)³ᐟ²', explanation: 'A planar pendulum model combines a restoring spring, damping, and three smooth attraction wells. The height offset 0.35 keeps the idealized magnetic force finite. Twenty-one bobs start from rest; color marks the closest well. Damping removes mechanical energy. The force is a simplified potential model, not a calibrated magnet law. Drag to release a close group near the cursor; small starting differences can send them toward different wells. Space resets the ring, R rotates the releases, and P pauses. Trails retain twelve time units. A bob stops after two seconds with tiny speed and force.', a: ['Damping γ', .08, .8, .01, .22], b: ['Attraction q', .2, 1.5, .01, .8], special: 'Reset the release ring', gesture: 'DRAG TO RELEASE A GROUP · ARROWS ADJUST γ / q · P PAUSES', mode: 'magnetic', previewSteps: 360 },
  'orbit-ink': { n: 57, name: 'Orbit ink', category: 'DRAWING / ROTATING SPACE', description: 'Draw a line. Let space turn it into a sculpture.', equation: 'p_world = R⁻¹(θ, φ) · (x_pen, y_pen, depth)', explanation: 'The pen works on a plane facing the camera. Every new point is transformed back into the sculpture’s coordinates using the inverse of the current rotation, so it stays in space as the sculpture turns. Holding the pen still while the scene rotates can draw a curved thread. Rotation speed changes smoothly; Pen depth moves the drawing plane. The drawing starts empty. Mouse, touch and pen all draw; a two-finger pinch zooms. Arrows orbit manually. P pauses automatic rotation while drawing stays available. Space, U or Command/Control-Z undo a stroke; Undo can also restore the most recent clear. R resets the view without changing the drawing. Colors apply to new strokes. Save frame exports the current view as PNG.', help: 'Drag to draw with mouse, pen or one finger. The sculpture keeps rotating while you draw. Rotation speed controls the turn; Pen depth layers strokes through space. Arrows orbit; scroll / pinch / + / − zooms. P freezes rotation while you keep drawing. U, Space or Command/Control-Z undo. Clear drawing is undoable. R resets the view. Color changes the next stroke; Save frame exports PNG. Reduced motion starts paused.', a: ['Rotation speed (° / s)', 0, 18, .1, 6], b: ['Pen depth', -2, 2, .01, 0], special: 'Undo stroke ↶', gesture: 'DRAG TO DRAW · ARROWS ORBIT · P PAUSES ROTATION · U UNDOS', mode: 'ink' },
  'fibonacci-sculpture': { n: 58, name: 'Fibonacci sculpture', category: 'NUMBER SEQUENCES / SPATIAL GROWTH', description: 'Each number becomes a cube. A luminous path climbs the growing sequence.', equation: 'F₁ = F₂ = 1; Fₙ = Fₙ₋₁ + Fₙ₋₂; Fₙ/Fₙ₋₁ → φ = (1+√5)/2', explanation: 'Squares with side lengths 1, 1, 2, 3, 5, 8 and onward tile an expanding rectangle. At full extrusion each becomes a cube with the same Fibonacci edge length. Quarter circles of those radii trace the familiar Fibonacci spiral in the footprint; vertical connectors lift it between cube tops. Lower Extrusion to flatten the sculpture and inspect the tiling. Sequence terms and Space reveal the construction one number at a time. The readout compares consecutive terms with the golden ratio. The camera fits the displayed terms, preserving their exact relative dimensions. The quarter-circle construction is an approximation associated with the logarithmic golden spiral.', help: 'Drag or use arrows to orbit. Scroll / pinch / + / − zooms. Sequence terms chooses 1–12 cubes; Space adds one term and wraps to the first. Extrusion goes from flat square tiling to full cubes. P freezes automatic rotation; manual controls still work. R changes the view. The numbers on visible cube tops and the readout show the sequence and its ratio to the previous term.', reference: 'https://mathworld.wolfram.com/FibonacciNumber.html', a: ['Sequence terms', 1, 12, 1, 8], b: ['Extrusion: flat → cubes', 0, 1, .01, 1], special: 'Next Fibonacci number', gesture: 'DRAG / ARROWS TO ORBIT · SPACE ADDS A TERM · SCROLL TO ZOOM', mode: 'orbit' }
};
const TAU = Math.PI * 2;
export const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
export function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function rng(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
export function newtonSample(x, y, degree = 3, relaxation = 1, maxIterations = 55) {
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let px = 1, py = 0;
    for (let i = 0; i < degree - 1; i++) [px, py] = [px * x - py * y, px * y + py * x];
    const fx = px * x - py * y - 1, fy = px * y + py * x;
    if (fx * fx + fy * fy < 1e-12) { const angle = (Math.atan2(y, x) + TAU) % TAU; return { root: Math.round(angle / TAU * degree) % degree, iterations: iteration }; }
    const denominator = degree * (px * px + py * py);
    if (denominator < 1e-24 || !Number.isFinite(denominator)) break;
    x -= relaxation * (fx * px + fy * py) / denominator; y -= relaxation * (fy * px - fx * py) / denominator;
  }
  return { root: -1, iterations: maxIterations };
}
export function hopfS3(eta, phi, t) { return [Math.cos(eta) * Math.cos(t), Math.cos(eta) * Math.sin(t), Math.sin(eta) * Math.cos(t + phi), Math.sin(eta) * Math.sin(t + phi)]; }
export function hopfMap([x, y, z, w]) { return [2 * (x * z + y * w), 2 * (y * z - x * w), x * x + y * y - z * z - w * w]; }
export function hopfPoint(eta, phi, t) { const [x, y, z, w] = hopfS3(eta, phi, t); return [x / (1 - w), y / (1 - w), z / (1 - w)]; }
export function torusPoint(t, p, q, component = 0) { const d = gcd(p, q), theta = p / d * t, phi = q / d * t + TAU * component / p, radius = 1.6 + .65 * Math.cos(phi); return [radius * Math.cos(theta), radius * Math.sin(theta), .65 * Math.sin(phi)]; }
// Classic bottle immersion: adapted from Three.js ParametricFunctions.klein.
// Copyright three.js authors (MIT); full notice in math/threejs-LICENSE.txt.
export function kleinPoint(u, v, width = 1) {
  const c = Math.cos(u), sn = Math.sin(u), radius = width * (2 - c);
  const x = 3 * c * (1 + sn) + radius * (u < Math.PI ? c * Math.cos(v) : Math.cos(v + Math.PI));
  const vertical = -8 * sn - (u < Math.PI ? radius * sn * Math.cos(v) : 0);
  return [x * .27, vertical * .21 + .15, -radius * Math.sin(v) * .27];
}
export function torusSurfacePoint(u, v, ring = 1.7, tube = .65) { const radius = ring + tube * Math.cos(v); return [radius * Math.cos(u), tube * Math.sin(v), radius * Math.sin(u)]; }
export function parametricSurface(slug, a, b) {
  if (!['klein-bottle', 'torus'].includes(slug)) throw new Error('Unknown parametric surface');
  const klein = slug === 'klein-bottle', full = !klein || b >= 1, nu = 72, nv = 36, vertices = [], faces = [], grid = [];
  const rows = full ? nu : nu + 1, columns = full ? nv : nv + 1;
  for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) { const u = i / nu * TAU, v = j / nv * TAU * (klein ? b : 1); vertices.push(klein ? kleinPoint(u, v, a) : torusSurfacePoint(u, v, a, b)); }
  function at(i, j) { if (!full) return i * columns + j; if (i === nu) { i = 0; if (klein) j = (nv / 2 - j + nv) % nv; } return i * nv + j % nv; }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const p = at(i, j), q = at(i + 1, j), r = at(i + 1, j + 1), t = at(i, j + 1); faces.push([p, q, r], [p, r, t]); }
  for (let i = 0; i < nu; i += 4) grid.push(Array.from({ length: nv + 1 }, (_, j) => at(i, j)));
  for (let j = 0; j < nv; j += 3) grid.push(Array.from({ length: nu + 1 }, (_, i) => at(i, j)));
  return { vertices, faces, grid, full };
}

export function mobiusPoint(u, v, halfTurns = 1) { const radius = 1.7 + v * Math.cos(halfTurns * u / 2); return [radius * Math.cos(u), v * Math.sin(halfTurns * u / 2), radius * Math.sin(u)]; }
export function mobiusSurface(width = .55, halfTurns = 1) {
  if (![1, 3, 5].includes(halfTurns)) throw new Error('The Möbius strip needs an odd half-turn count');
  const nu = 96, nv = 16, vertices = [], faces = [], grid = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j <= nv; j++) vertices.push(mobiusPoint(i / nu * TAU, (j / nv * 2 - 1) * width, halfTurns));
  const at = (i, j) => i === nu ? nv - j : i * (nv + 1) + j;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1); faces.push([a, b, c], [a, c, d]); }
  for (let i = 0; i < nu; i += 4) grid.push(Array.from({ length: nv + 1 }, (_, j) => at(i, j)));
  for (let j = 0; j <= nv; j += 4) grid.push(Array.from({ length: nu + 1 }, (_, i) => at(i, j)));
  return { vertices, faces, grid, full: true };
}
export function schwarzArea(n, m, radius = 1.5, height = 3) { return 2 * m * n * radius * Math.sin(Math.PI / n) * Math.hypot(height / m, radius * (1 - Math.cos(Math.PI / n))); }
export function schwarzLantern(n = 12, m = 18) {
  const radius = 1.5, height = 3, vertices = [], faces = [], edges = new Map();
  const at = (i, j) => i * n + (j + n) % n;
  for (let i = 0; i <= m; i++) for (let j = 0; j < n; j++) { const angle = j / n * TAU + (i % 2) * Math.PI / n; vertices.push([radius * Math.cos(angle), height * (i / m - .5), radius * Math.sin(angle)]); }
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { const a = at(i, j), peak = at(i + 1, j + i % 2); faces.push([a, peak, at(i, j + 1)], [a, at(i + 1, j + i % 2 - 1), peak]); }
  for (const face of faces) for (let k = 0; k < 3; k++) { const a = face[k], b = face[(k + 1) % 3], key = a < b ? `${a},${b}` : `${b},${a}`; if (!edges.has(key)) edges.set(key, [a, b]); }
  return { vertices, faces, grid: [...edges.values()], radius, height, area: schwarzArea(n, m, radius, height), cylinderArea: TAU * radius * height, full: true };
}

export function mathPlaneSpan(width, height, fitWidth = 0) { return Math.max(3.4, fitWidth * height / Math.max(1, width)); }

export function sierpinskiProgress(depth, progress) {
  const phase = depth * clamp(progress, 0, 1), generation = Math.min(depth, Math.floor(phase + 1e-10)), fraction = generation >= depth ? 0 : clamp(phase - generation, 0, 1);
  return { generation, fraction, area: (3 / 4) ** generation * (1 - fraction * fraction / 4), dimension: Math.log(3) / Math.log(2) };
}
export function sierpinskiTriangle(depth = 6) {
  if (!Number.isInteger(depth) || depth < 0 || depth > 8) throw new Error('Triangle depth must be an integer from 0 to 8');
  const outer = [[0, 2 / Math.sqrt(3)], [-1, -1 / Math.sqrt(3)], [1, -1 / Math.sqrt(3)]], levels = []; let leaves = [outer];
  const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  for (let level = 0; level < depth; level++) { const next = [], holes = []; for (const [a, b, c] of leaves) { const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a); holes.push([ab, bc, ca]); next.push([a, ab, ca], [ab, b, bc], [ca, bc, c]); } levels.push(holes); leaves = next; }
  return { depth, outer, levels, leaves, progress: sierpinskiProgress(depth, 1) };
}

export function kochProgress(depth, progress) {
  const phase = depth * clamp(progress, 0, 1), generation = Math.min(depth, Math.floor(phase + 1e-10)), fraction = generation >= depth ? 0 : clamp(phase - generation, 0, 1);
  return { generation, fraction, perimeter: (4 / 3) ** generation * (2 + Math.sqrt(1 + 3 * fraction * fraction)) / 3, area: 8 / 5 - 3 / 5 * (4 / 9) ** generation + fraction / 3 * (4 / 9) ** generation, dimension: Math.log(4) / Math.log(3) };
}
export function kochSubdivision(points, fraction = 1) {
  const next = [], height = Math.sqrt(3) / 6 * clamp(fraction, 0, 1);
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], dx = b[0] - a[0], dy = b[1] - a[1];
    // The polygon runs counterclockwise: its right normal points outward.
    next.push(a, [a[0] + dx / 3, a[1] + dy / 3], [(a[0] + b[0]) / 2 + dy * height, (a[1] + b[1]) / 2 - dx * height], [a[0] + dx * 2 / 3, a[1] + dy * 2 / 3]);
  }
  return next;
}
export function kochSnowflake(depth = 5) {
  if (!Number.isInteger(depth) || depth < 0 || depth > 7) throw new Error('Snowflake depth must be an integer from 0 to 7');
  const levels = [[[0, 2 / Math.sqrt(3)], [-1, -1 / Math.sqrt(3)], [1, -1 / Math.sqrt(3)]]];
  for (let n = 0; n < depth; n++) levels.push(kochSubdivision(levels[n]));
  return { depth, levels, progress: kochProgress(depth, 1) };
}

export function gyroid(x, y, z) { return Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x); }
export function gyroidGradient(x, y, z) { return [Math.cos(x) * Math.cos(y) - Math.sin(z) * Math.sin(x), Math.cos(y) * Math.cos(z) - Math.sin(x) * Math.sin(y), Math.cos(z) * Math.cos(x) - Math.sin(y) * Math.sin(z)]; }
export function tetraTriangles(points, values, level) {
  const inside = [], outside = []; values.forEach((v, i) => (v >= level ? inside : outside).push(i));
  if (!inside.length || !outside.length) return [];
  const cross = (a, b) => { const t = (level - values[a]) / (values[b] - values[a]); return points[a].map((v, i) => v + (points[b][i] - v) * t); };
  if (inside.length === 1) return [outside.map(b => cross(inside[0], b))];
  if (inside.length === 3) return [inside.map(a => cross(a, outside[0]))];
  const [a, b] = inside, [c, d] = outside, ac = cross(a, c), ad = cross(a, d), bc = cross(b, c), bd = cross(b, d); return [[ac, bc, ad], [ad, bc, bd]];
}
export function gyroidMesh(level = 0, repeats = 1) {
  const n = 14 * repeats, extent = Math.PI * repeats, step = extent * 2 / n, triangles = [], points = [], values = [];
  const index = (x, y, z) => (z * (n + 1) + y) * (n + 1) + x;
  for (let z = 0; z <= n; z++) for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) { const p = [x * step - extent, y * step - extent, z * step - extent]; points.push(p); values.push(gyroid(...p)); }
  const offsets = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], tetra = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ids = offsets.map(([dx, dy, dz]) => index(x + dx, y + dy, z + dz));
    for (const t of tetra) for (const triangle of tetraTriangles(t.map(i => points[ids[i]]), t.map(i => values[ids[i]]), level)) { const center = [0, 1, 2].map(axis => triangle.reduce((sum, p) => sum + p[axis], 0) / 3); triangles.push({ points: triangle.map(p => p.map(v => v / extent * 1.8)), normal: gyroidGradient(...center), value: center[2] / extent }); }
  }
  return triangles;
}

export function createReaction(width = 144, height = 96, seed = 1, initialize = true) {
  const size = width * height; let a = new Float32Array(size).fill(1), b = new Float32Array(size), nextA = new Float32Array(size), nextB = new Float32Array(size), steps = 0;
  const random = rng(seed), at = (x, y) => ((y + height) % height) * width + (x + width) % width;
  function plant(x, y, radius = 4) { const cx = Math.round(x), cy = Math.round(y); for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= radius * radius) { const i = at(cx + dx, cy + dy); a[i] = .5; b[i] = 1; } }
  function step(feed = .055, kill = .062) {
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x, left = x ? i - 1 : i + width - 1, right = x < width - 1 ? i + 1 : i - width + 1, up = y ? i - width : i + size - width, down = y < height - 1 ? i + width : x;
      const ul = y ? left - width : left + size - width, ur = y ? right - width : right + size - width, dl = y < height - 1 ? left + width : left % width, dr = y < height - 1 ? right + width : right % width;
      const lapA = -a[i] + .2 * (a[left] + a[right] + a[up] + a[down]) + .05 * (a[ul] + a[ur] + a[dl] + a[dr]);
      const lapB = -b[i] + .2 * (b[left] + b[right] + b[up] + b[down]) + .05 * (b[ul] + b[ur] + b[dl] + b[dr]), reaction = a[i] * b[i] * b[i];
      nextA[i] = clamp(a[i] + lapA - reaction + feed * (1 - a[i]), 0, 1); nextB[i] = clamp(b[i] + .5 * lapB + reaction - (kill + feed) * b[i], 0, 1);
    }
    [a, nextA] = [nextA, a]; [b, nextB] = [nextB, b]; steps++;
  }
  if (initialize) for (let i = 0; i < 18; i++) plant(random() * width, random() * height, 2 + Math.floor(random() * 3));
  return { width, height, get a() { return a; }, get b() { return b; }, get steps() { return steps; }, plant, step };
}
export function cliffordStep(x, y, a = -1.4, b = 1.6, c = 1, d = .7) { return [Math.sin(a * y) + c * Math.cos(a * x), Math.sin(b * x) + d * Math.cos(b * y)]; }
export function createClifford(seed = 1, a = -1.4, b = 1.6, c = 1, d = .7, side = 256) {
  const random = rng(seed), density = new Uint32Array(side * side); let x = random(), y = random(), count = 0, maximum = 0; const extent = Math.max(1 + Math.abs(c), 1 + Math.abs(d)) * 1.04;
  for (let i = 0; i < 100; i++) [x, y] = cliffordStep(x, y, a, b, c, d);
  function step(budget = 5000) { if (count >= 1500000) return false; for (let n = 0; n < budget && count < 1500000; n++) { [x, y] = cliffordStep(x, y, a, b, c, d); const ix = clamp(Math.floor((x / extent + 1) * side / 2), 0, side - 1), iy = clamp(Math.floor((y / extent + 1) * side / 2), 0, side - 1), id = iy * side + ix; maximum = Math.max(maximum, ++density[id]); count++; } return true; }
  return { density, side, c, d, step, get count() { return count; }, get maximum() { return maximum; }, get point() { return [x, y]; } };
}
// Equal unit masses and lengths; state = [theta1, theta2, omega1, omega2].
export function pendulumDerivative([a, b, u, v]) {
  const c = Math.cos(a - b), sn = Math.sin(a - b), f = -2 * 9.81 * Math.sin(a) - sn * v * v, h = -9.81 * Math.sin(b) + sn * u * u, denominator = 2 - c * c;
  return [u, v, (f - c * h) / denominator, (2 * h - c * f) / denominator];
}
export function pendulumRK4(state, dt = 1 / 240) {
  const add = (derivative, scale) => state.map((v, i) => v + derivative[i] * scale), k1 = pendulumDerivative(state), k2 = pendulumDerivative(add(k1, dt / 2)), k3 = pendulumDerivative(add(k2, dt / 2)), k4 = pendulumDerivative(add(k3, dt));
  return state.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
export function pendulumEnergy([a, b, u, v]) { return u * u + v * v / 2 + u * v * Math.cos(a - b) - 9.81 * (2 * Math.cos(a) + Math.cos(b)); }
export function pendulumPositions([a, b]) { const upper = [Math.sin(a), Math.cos(a)]; return [upper, [upper[0] + Math.sin(b), upper[1] + Math.cos(b)]]; }
export function pendulumLayout(width, height) { return { x: width / 2, y: height * .38, scale: Math.min(width / 4.8, height / 5.8) }; }
export function createDoublePendulum(a = 120, b = -25) {
  let main = [a * Math.PI / 180, b * Math.PI / 180, 0, 0], ghost = [main[0], main[1] + Math.PI / 18000, 0, 0], steps = 0;
  const initialEnergy = pendulumEnergy(main), trail = [pendulumPositions(main)[1]], ghostTrail = [pendulumPositions(ghost)[1]];
  function step() {
    for (let i = 0; i < 8; i++) { main = pendulumRK4(main); ghost = pendulumRK4(ghost); }
    steps++; trail.push(pendulumPositions(main)[1]); ghostTrail.push(pendulumPositions(ghost)[1]);
    if (trail.length > 901) { trail.shift(); ghostTrail.shift(); }
  }
  return { step, trail, ghostTrail, initialEnergy, get main() { return main; }, get ghost() { return ghost; }, get steps() { return steps; }, get energy() { return pendulumEnergy(main); }, get time() { return steps / 30; } };
}
export function orbitalAcceleration(x, y, mu) { const r = Math.hypot(x, y); if (r === 0) throw new Error('Gravity is singular at the origin'); const f = -mu / (r * r * r); return [x * f, y * f]; }
export function orbitalInvariants(body, mu) {
  const energy = (body.vx * body.vx + body.vy * body.vy) / 2 - mu / Math.hypot(body.x, body.y), angularMomentum = body.x * body.vy - body.y * body.vx;
  return { energy, angularMomentum, eccentricity: Math.sqrt(Math.max(0, 1 + 2 * energy * angularMomentum * angularMomentum / (mu * mu))) };
}
export function orbitalVerlet(body, mu, dt = 1 / 360, starRadius = .18) {
  if (body.status !== 'orbiting') return;
  const [ax, ay] = orbitalAcceleration(body.x, body.y, mu), dx = body.vx * dt + ax * dt * dt / 2, dy = body.vy * dt + ay * dt * dt / 2;
  // Check the swept segment before evaluating acceleration near the star.
  const q = dx * dx + dy * dy, b = 2 * (body.x * dx + body.y * dy), c = body.x * body.x + body.y * body.y - starRadius * starRadius, discriminant = b * b - 4 * q * c;
  if (starRadius > 0 && q > 0 && discriminant >= 0) { const t = (-b - Math.sqrt(discriminant)) / (2 * q); if (t >= 0 && t <= 1) { body.x += dx * t; body.y += dy * t; body.vx = body.vy = 0; body.status = 'absorbed'; return; } }
  body.x += dx; body.y += dy; const [bx, by] = orbitalAcceleration(body.x, body.y, mu); body.vx += (ax + bx) * dt / 2; body.vy += (ay + by) * dt / 2;
}
export function gravityLayout(width, height, zoom = 1) { return { x: width / 2, y: height * .37, scale: Math.min(width / 9.5, height / 11.5) * zoom }; }
export function createOrbitalGravity(mu = 1.2, speed = 1) {
  const bodies = []; let steps = 0;
  function launch(x, y, vx, vy) {
    if (bodies.length >= 12 || ![x, y, vx, vy].every(Number.isFinite) || Math.hypot(x, y) < .35 || Math.hypot(x, y) > 8 || Math.hypot(vx, vy) > 8) return false;
    const body = { x, y, vx, vy, status: 'orbiting', trail: [[x, y]], color: bodies.length * 52, size: 3 + bodies.length % 3 };
    body.initial = orbitalInvariants(body, mu); bodies.push(body); return true;
  }
  for (const [i, radius] of [.8, 1.15, 1.6, 2.15, 2.8, 3.55].entries()) { const angle = i * 2.399963, v = speed / Math.sqrt(radius); launch(radius * Math.cos(angle), radius * Math.sin(angle), -v * Math.sin(angle), v * Math.cos(angle)); }
  function step() {
    for (let i = 0; i < 12; i++) for (const body of bodies) orbitalVerlet(body, mu);
    for (const body of bodies) { if (body.status !== 'orbiting') continue; if (Math.hypot(body.x, body.y) > 200 && orbitalInvariants(body, mu).energy >= 0 && body.x * body.vx + body.y * body.vy > 0) body.status = 'escaped'; body.trail.push([body.x, body.y]); if (body.trail.length > 901) body.trail.shift(); }
    steps++;
  }
  return { mu, speed, bodies, launch, step, get steps() { return steps; }, get time() { return steps / 30; } };
}
function rgb(hue, light) { const h = ((hue % 360) + 360) % 360 / 60, c = (1 - Math.abs(2 * light - 1)) * .8, x = c * (1 - Math.abs(h % 2 - 1)), m = light - c / 2, colors = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x]; return colors.map(v => Math.round((v + m) * 255)); }

export function createMathScene(canvas, slug, makeSurface = () => document.createElement('canvas')) {
  if (!Object.hasOwn(catalog, slug)) throw new Error('Unknown mathematical experiment');
  if (slug === 'fibonacci-sculpture') return createFibonacciScene(canvas);
  if (slug === 'orbit-ink') return createInkScene(canvas);
  if (['wave-interference', 'rossler-attractor', 'magnetic-pendulums'].includes(slug)) return createExtraMathScene(canvas, slug);
  const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas 2D unavailable');
  let model, key = '', imageKey = '', surface, surfaceCtx, status = '', preset = 0;
  const mode = catalog[slug].mode;
  function prepare(s) {
    const next = ['sierpinski-triangle', 'koch-snowflake'].includes(slug) ? `construction:${s.a}` : `${s.seed}:${s.a}:${s.b}:${mode === 'clifford' ? preset : ''}`;
    if (next === key) return;
    if (mode === 'gravity') model = createOrbitalGravity(s.a, s.b);
    else if (mode === 'pendulum') model = createDoublePendulum(s.a, s.b);
    else if (mode === 'reaction') { if (!model || !key.startsWith(`${s.seed}:`)) { model = createReaction(144, 96, s.seed); for (let i = 0; i < 600; i++) model.step(s.a, s.b); } }
    else if (mode === 'clifford') { const constants = [[1, .7], [-1.4, -1.2], [1.1, 1]][preset % 3]; model = createClifford(s.seed, s.a, s.b, ...constants); model.step(80000); }
    else if (slug === 'koch-snowflake') model = kochSnowflake(Math.round(s.a));
    else if (slug === 'sierpinski-triangle') model = sierpinskiTriangle(Math.round(s.a));
    else if (slug === 'gyroid-field') model = gyroidMesh(s.a, Math.round(s.b));
    else if (slug === 'mobius-strip') model = mobiusSurface(s.a, Math.round(s.b));
    else if (slug === 'schwarz-lantern') model = schwarzLantern(Math.round(s.a), Math.round(s.b));
    else if (['klein-bottle', 'torus'].includes(slug)) model = parametricSurface(slug, s.a, s.b);
    key = next; imageKey = '';
  }
  function step(s) { prepare(s); if (mode === 'pendulum' || mode === 'gravity') { model.step(); return true; } if (mode === 'reaction') { for (let i = 0; i < 6; i++) model.step(s.a, s.b); imageKey = ''; return true; } if (mode === 'clifford') { const changed = model.step(); if (changed) imageKey = ''; return changed; } return mode === 'orbit'; }
  function plant(s, px, py) { prepare(s); if (mode !== 'reaction') return; const r = rasterRect(); if (px < r.x || px > r.x + r.w || py < r.y || py > r.y + r.h) return; model.plant(clamp((px - r.x) / r.w * model.width, 0, model.width - 1), clamp((py - r.y) / r.h * model.height, 0, model.height - 1)); imageKey = ''; }
  function special(s) {
    if (mode === 'pendulum' || mode === 'gravity') { key = ''; }
    else if (['sierpinski-triangle', 'koch-snowflake'].includes(slug)) { const depth = Math.round(s.a), next = Math.floor(depth * s.b + 1e-8) + 1; s.b = depth === 0 || next > depth ? 0 : next / depth; }
    else if (mode === 'plane') { s.center = [0, 0]; s.zoom = 1; }
    else if (mode === 'reaction') { const regimes = [[.055, .062], [.0367, .0649], [.03, .062], [.0545, .062]]; preset = (preset + 1) % regimes.length; [s.a, s.b] = regimes[preset]; s.seed++; }
    else if (mode === 'clifford') { const settings = [[-1.4, 1.6], [1.7, 1.7], [-1.7, 1.8]]; preset = (preset + 1) % settings.length; [s.a, s.b] = settings[preset]; s.seed++; }
    else if (slug === 'torus-knots') { s.a = s.a >= 9 ? 2 : s.a + 1; }
    else if (['klein-bottle', 'torus', 'mobius-strip', 'schwarz-lantern'].includes(slug)) s.surfaceStyle = ((s.surfaceStyle ?? 0) + 1) % 3;
    else if (slug === 'gyroid-field') s.surfaceStyle = ((s.surfaceStyle ?? 0) + 1) % 3;
    else s.direction *= -1;
    prepare(s);
  }
  function launch(s, start, end) { prepare(s); if (mode !== 'gravity') return false; let vx = (end[0] - start[0]) * .8, vy = (end[1] - start[1]) * .8; const speed = Math.hypot(vx, vy); if (speed > 8) { vx *= 8 / speed; vy *= 8 / speed; } return model.launch(start[0], start[1], vx, vy); }
  function rasterRect() { const aspect = mode === 'reaction' ? 1.5 : 1, width = Math.min(canvas.width * .92, canvas.height * .68 * aspect), height = width / aspect; return { x: (canvas.width - width) / 2, y: canvas.height * .44 - height / 2, w: width, h: height }; }
  function pixels(width, height, stamp, paint) {
    if (!surface) { surface = makeSurface(); surfaceCtx = surface.getContext('2d'); if (!surfaceCtx) throw new Error('Canvas image surface unavailable'); }
    if (imageKey !== stamp) { surface.width = width; surface.height = height; const image = surfaceCtx.createImageData(width, height); for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = (y * width + x) * 4, color = paint(x, y); image.data[i] = color[0]; image.data[i + 1] = color[1]; image.data[i + 2] = color[2]; image.data[i + 3] = 255; } surfaceCtx.putImageData(image, 0, 0); imageKey = stamp; }
    return surface;
  }
  function draw(s) {
    prepare(s); const W = canvas.width, H = canvas.height, unit = Math.min(W, H), hue = s.palette * 65;
    ctx.fillStyle = '#070c17'; ctx.fillRect(0, 0, W, H);
    if (mode === 'gravity') {
      const layout = gravityLayout(W, H, s.zoom), project = ([x, y]) => [layout.x + x * layout.scale, layout.y + y * layout.scale];
      function dot(x, y, radius, color) { ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
      function path(points, color, width) { ctx.beginPath(); points.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); }
      const stars = rng(537); for (let i = 0; i < 130; i++) dot(stars() * W, stars() * H, .3 + stars() * .8, '#a6bddd30');
      for (const radius of [.8, 1.6, 2.8, 3.55]) { ctx.beginPath(); ctx.arc(layout.x, layout.y, radius * layout.scale, 0, TAU); ctx.strokeStyle = '#172333'; ctx.lineWidth = 1; ctx.stroke(); }
      for (const body of model.bodies) {
        const color = `hsl(${body.color + hue + 175},82%,72%)`, trail = body.trail;
        for (let start = 0; start < trail.length - 1; start += 40) { ctx.globalAlpha = .07 + .68 * (start + 1) / trail.length; path(trail.slice(start, start + 41), color, Math.max(1, unit / 600)); } ctx.globalAlpha = 1;
        if (body.status === 'orbiting') { const p = project([body.x, body.y]); if (p[0] > -20 && p[0] < W + 20 && p[1] > -20 && p[1] < H + 20) { ctx.globalAlpha = .12; dot(...p, body.size * 3, color); ctx.globalAlpha = 1; dot(...p, body.size, color); dot(p[0] - 1, p[1] - 1, 1, '#fff'); } }
      }
      for (let i = 4; i > 0; i--) { ctx.globalAlpha = .025 * (5 - i); dot(layout.x, layout.y, .18 * layout.scale + i * unit / 70, '#ffad57'); } ctx.globalAlpha = 1;
      dot(layout.x, layout.y, .18 * layout.scale, '#ffc879'); dot(layout.x - layout.scale * .03, layout.y - layout.scale * .03, .11 * layout.scale, '#fff0c1');
      if (s.launch) { const { start, end } = s.launch; path([start, end], '#fff', 1.5); dot(...project(start), 4, '#fff'); const angle = Math.atan2(end[1] - start[1], end[0] - start[0]), length = .16 / s.zoom; path([[end[0] - length * Math.cos(angle - .5), end[1] - length * Math.sin(angle - .5)], end, [end[0] - length * Math.cos(angle + .5), end[1] - length * Math.sin(angle + .5)]], '#fff', 1.5); }
      const bound = model.bodies.filter(b => b.status === 'orbiting' && orbitalInvariants(b, s.a).energy < 0).length, unbound = model.bodies.filter(b => b.status === 'orbiting' && orbitalInvariants(b, s.a).energy >= 0).length, absorbed = model.bodies.filter(b => b.status === 'absorbed').length, escaped = model.bodies.filter(b => b.status === 'escaped').length;
      status = `${model.time.toFixed(1)} time units · ${bound} bound · ${unbound} unbound · ${absorbed} absorbed · ${escaped} beyond field · ${model.bodies.length}/12 planets`;
    } else if (mode === 'pendulum') {
      const layout = pendulumLayout(W, H), project = ([x, y]) => [layout.x + x * layout.scale, layout.y + y * layout.scale];
      for (const radius of [1, 2]) { ctx.beginPath(); ctx.arc(layout.x, layout.y, radius * layout.scale, 0, TAU); ctx.strokeStyle = '#172333'; ctx.lineWidth = 1; ctx.stroke(); }
      function path(points, color, width) { ctx.beginPath(); points.forEach((point, i) => { const p = project(point); if (i) ctx.lineTo(...p); else ctx.moveTo(...p); }); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); }
      for (const [trail, color] of [[model.ghostTrail, 35 + hue], [model.trail, 185 + hue]]) {
        for (let start = 0; start < trail.length - 1; start += 30) { ctx.globalAlpha = .08 + .72 * (start + 1) / trail.length; path(trail.slice(start, start + 31), `hsl(${color},90%,68%)`, Math.max(1, unit / 650)); } ctx.globalAlpha = 1;
      }
      function pendulum(state, color, ghost) { const positions = pendulumPositions(state); ctx.globalAlpha = ghost ? .45 : 1; path([[0, 0], ...positions], color, Math.max(ghost ? 1 : 2, unit / 320)); for (const p of positions) { ctx.beginPath(); ctx.arc(...project(p), Math.max(ghost ? 3 : 5, unit / (ghost ? 125 : 90)), 0, TAU); ctx.fillStyle = color; ctx.fill(); } ctx.globalAlpha = 1; }
      pendulum(model.ghost, `hsl(${35 + hue},95%,70%)`, true); pendulum(model.main, `hsl(${185 + hue},90%,78%)`, false);
      ctx.beginPath(); ctx.arc(layout.x, layout.y, Math.max(3, unit / 180), 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      const a = model.trail.at(-1), b = model.ghostTrail.at(-1), separation = Math.hypot(a[0] - b[0], a[1] - b[1]);
      status = `${model.time.toFixed(1)} s · tip separation ${separation.toFixed(4)} m · energy drift ${(Math.abs(model.energy - model.initialEnergy) / 29.43 * 1e6).toFixed(2)} ppm`;
    } else if (slug === 'koch-snowflake') {
      const info = kochProgress(model.depth, s.b), points = info.fraction > 0 ? kochSubdivision(model.levels[info.generation], info.fraction) : model.levels[info.generation], scale = H / mathPlaneSpan(W, H, 3.1) * s.zoom;
      model.progress = info;
      ctx.beginPath(); points.forEach(([x, y], i) => { const px = W * .5 + (x - s.center[0]) * scale, py = H * .42 - (y - s.center[1]) * scale; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.closePath();
      ctx.fillStyle = `hsl(${205 + hue},65%,28%)`; ctx.fill(); ctx.strokeStyle = `hsl(${185 + hue},90%,76%)`; ctx.lineWidth = Math.max(.7, unit / 550); ctx.lineJoin = 'round'; ctx.stroke();
      status = `Generation ${info.generation}${info.fraction > 1e-8 ? ' → ' + (info.generation + 1) : ''} / ${model.depth} · boundary dimension → ${info.dimension.toFixed(5)}`;
    } else if (slug === 'sierpinski-triangle') {
      const scale = H / mathPlaneSpan(W, H, 2.5) * s.zoom, project = ([x, y]) => [W * .5 + (x - s.center[0]) * scale, H * .42 - (y - s.center[1]) * scale], info = sierpinskiProgress(model.depth, s.b);
      model.progress = info;
      function triangle(points, color) { ctx.beginPath(); points.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
      triangle(model.outer, `hsl(${180 + hue},72%,65%)`);
      for (let level = 0; level < model.depth; level++) { const fraction = level < info.generation ? 1 : level === info.generation ? info.fraction : 0; if (fraction <= 0) break; for (const hole of model.levels[level]) { const center = [0, 1].map(axis => hole.reduce((sum, p) => sum + p[axis], 0) / 3), points = fraction === 1 ? hole : hole.map(p => p.map((value, axis) => center[axis] + (value - center[axis]) * fraction)); triangle(points, '#070c17'); } }
      status = `Generation ${info.generation}${info.fraction > 1e-8 ? ' → ' + (info.generation + 1) : ''} / ${model.depth} · retained area ${(info.area * 100).toFixed(3)}% · limit dimension ${info.dimension.toFixed(5)}`;
    } else if (mode === 'plane') {
      const width = Math.min(440, Math.max(160, Math.round(W / 3))), height = Math.max(100, Math.round(width * H / W)), span = 3.4 / s.zoom;
      const image = pixels(width, height, `${key}:${s.palette}:${s.zoom}:${s.center}:${W}:${H}`, (x, y) => { const sample = newtonSample(s.center[0] + (x / width - .5) * span * W / H, s.center[1] + (.5 - y / height) * span, Math.round(s.a), s.b); return sample.root < 0 ? [7, 12, 23] : rgb(sample.root * 360 / s.a + hue + 15, clamp(.72 - sample.iterations * .013, .14, .72)); });
      ctx.imageSmoothingEnabled = true; ctx.drawImage(image, 0, 0, W, H); status = `zⁿ − 1 · n = ${Math.round(s.a)} · λ = ${s.b.toFixed(2)} · zoom ×${s.zoom.toFixed(2)}`;
    } else if (mode === 'reaction' || mode === 'clifford') {
      const reaction = mode === 'reaction', width = reaction ? model.width : model.side, height = reaction ? model.height : model.side;
      const image = pixels(width, height, `${key}:${s.palette}`, (x, y) => { const id = y * width + x, value = reaction ? clamp(model.b[id] * 2.2, 0, 1) : model.density[id] ? Math.pow(Math.log1p(model.density[id]) / Math.log1p(model.maximum), .55) : 0; return value <= .002 ? [7, 12, 23] : rgb(hue + 180 + value * 130, .13 + value * .67); });
      const rect = rasterRect(); ctx.imageSmoothingEnabled = true; ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
      if (reaction) { const x = s.pointer[0] * W, y = s.pointer[1] * H; if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) { ctx.beginPath(); ctx.arc(x, y, rect.w / model.width * 4, 0, TAU); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); } }
      status = reaction ? `${model.steps} simulation steps · f ${s.a.toFixed(4)} · k ${s.b.toFixed(4)} · drag to seed B` : `${model.count.toLocaleString()} visits · c ${model.c} · d ${model.d}${model.count >= 1500000 ? ' · accumulation complete' : ''}`;
    } else {
      const yaw = s.yaw + s.time * .12 * s.direction, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
      const rotate = ([x, y, z]) => { const xx = x * cy - z * sy, zz = x * sy + z * cy; return [xx, y * cp - zz * sp, y * sp + zz * cp]; };
      const project = p => { const [x, y, z] = rotate(p), f = unit * .8 * s.zoom / Math.max(1.5, 5.8 + z); return [W * .5 + x * f, H * .42 + y * f, z]; };
      const path = (points, color, width = 1, fill = false) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); } };
      if (['klein-bottle', 'torus', 'mobius-strip', 'schwarz-lantern'].includes(slug)) {
        const klein = slug === 'klein-bottle', mobius = slug === 'mobius-strip', lantern = slug === 'schwarz-lantern', baseHue = klein ? 210 : mobius ? 280 : lantern ? 145 : 25, style = ((s.surfaceStyle ?? 0) + (klein ? 2 : 0)) % 3; // 0 solid, 1 wire, 2 glass.
        const projected = model.vertices.map(project), triangles = model.faces.map(face => {
          const [a, b, c] = face.map(i => model.vertices[i]), ab = b.map((v, i) => v - a[i]), ac = c.map((v, i) => v - a[i]);
          const normal = rotate([ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]]);
          return { face, normal, height: (a[1] + b[1] + c[1]) / 3, depth: face.reduce((sum, i) => sum + projected[i][2], 0) / 3 };
        }).sort((a, b) => b.depth - a.depth);
        if (style !== 1) {
          ctx.globalAlpha = style === 2 ? .24 : 1;
          for (const triangle of triangles) { const n = triangle.normal, light = Math.abs((n[0] * .3 - n[1] * .55 + n[2] * .8) / Math.max(1e-9, Math.hypot(...n))); const color = `hsl(${baseHue + hue + triangle.height * 24},72%,${25 + light * 43}%)`; const points = triangle.face.map(i => projected[i]); path(points, color, 1, true); if (lantern && style === 0) path([...points, points[0]], '#0b252d', Math.max(.25, unit / 1600)); }
        }
        ctx.globalAlpha = style === 0 ? .32 : .7;
        if (style !== 0) for (const trace of model.grid) path(trace.map(i => projected[i]), `hsl(${(klein ? 185 : mobius ? 295 : lantern ? 160 : 42) + hue},80%,75%)`, Math.max(.35, unit / 1100));
        ctx.globalAlpha = 1;
        const styles = ['solid', 'wireframe', 'glass'];
        if (mobius) { const p = project(mobiusPoint((s.time * .45) % (TAU * 2), s.a, Math.round(s.b))); ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(2, unit / 150), 0, TAU); ctx.fillStyle = '#fff4b5'; ctx.fill(); }
        status = mobius ? `Non-orientable · one boundary loop · χ = 0 · ${Math.round(s.b)} half-turn${s.b === 1 ? '' : 's'} · ${styles[style]}` : lantern ? `${model.faces.length.toLocaleString()} triangles · A ${model.area.toFixed(3)} / cylinder ${model.cylinderArea.toFixed(3)} = ${(model.area / model.cylinderArea).toFixed(4)}× · ${styles[style]}` : klein ? `${model.full ? 'Closed, non-orientable surface · χ = 0' : 'Cutaway view · open surface'} · ${styles[style]} · 3-D self-intersection` : `R ${s.a.toFixed(2)} · r ${s.b.toFixed(2)} · hole radius ${(s.a - s.b).toFixed(2)} · orientable · χ = 0 · ${styles[style]}`;
      } else if (slug === 'gyroid-field') {
        const triangles = model.map(t => ({ points: t.points.map(project), normal: rotate(t.normal), value: t.value })).sort((a, b) => b.points.reduce((sum, p) => sum + p[2], 0) - a.points.reduce((sum, p) => sum + p[2], 0));
        const style = s.surfaceStyle ?? 0, styles = ['solid', 'wireframe', 'glass'];
        ctx.globalAlpha = style === 2 ? .18 : style === 1 ? .6 : 1;
        for (const t of triangles) {
          const n = t.normal, light = Math.abs((n[0] * .3 - n[1] * .5 + n[2] * .8) / Math.max(.001, Math.hypot(...n))), color = `hsl(${175 + hue + t.value * 40},58%,${style === 1 ? 65 : 20 + light * 47}%)`;
          if (style === 1) path([...t.points, t.points[0]], color, Math.max(.25, unit / 1900)); else path(t.points, color, 1, true);
        }
        ctx.globalAlpha = 1;
        status = `${model.length.toLocaleString()} triangles · level ${s.a.toFixed(2)} · ${Math.round(s.b)} periodic cell${s.b === 1 ? '' : 's'} per axis · ${styles[style]} · nodal approximation`;
      } else {
        const segments = [];
        function curve(points, color) { for (let i = 1; i < points.length; i++) { const a = project(points[i - 1]), b = project(points[i]); segments.push({ a, b, color: typeof color === 'function' ? color(i / (points.length - 1)) : color, depth: (a[2] + b[2]) / 2 }); } }
        if (slug === 'hopf-fibers') {
          for (let layer = -1; layer <= 1; layer++) { const eta = clamp(s.a + layer * .12, .08, 1.3), shrink = .76; for (let fiber = 0; fiber < Math.round(s.b); fiber++) { const phi = fiber / Math.round(s.b) * TAU, points = Array.from({ length: 97 }, (_, i) => hopfPoint(eta, phi, i / 96 * TAU).map(v => v * shrink)); curve(points, `hsl(${fiber / s.b * 270 + layer * 25 + hue + 30},82%,66%)`); } }
          status = `${Math.round(s.b) * 3} fibers · 3 latitudes · every distinct pair links once`;
        } else {
          const p = Math.round(s.a), q = Math.round(s.b), components = gcd(p, q); for (let k = 0; k < components; k++) curve(Array.from({ length: 721 }, (_, i) => torusPoint(i / 720 * TAU, p, q, k)), t => `hsl(${hue + 20 + k * 360 / components + t * 65},88%,${57 + Math.sin(t * TAU) * 12}%)`);
          status = `T(${p}, ${q}) · gcd = ${components} · ${components === 1 ? 'one knot' : components + ' linked components'}`;
        }
        segments.sort((a, b) => b.depth - a.depth);
        const width = slug === 'torus-knots' ? Math.max(2, unit * .012 * s.zoom) : Math.max(.6, unit * .0018 * s.zoom);
        for (const segment of segments) path([segment.a, segment.b], segment.color, width);
      }
    }
    return status;
  }
  return { prepare, step, draw, plant, special, launch, get data() { return model; } };
}
