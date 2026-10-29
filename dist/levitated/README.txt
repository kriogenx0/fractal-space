Levitated -> JavaScript / Fractal Space

Original experiments by Jared Tarbell, 2001–2003; preserve the individual
archive notices for their original copyright years.
Original source: https://levitated.net/daily/levInvaderFractal.zip
                 https://levitated.net/daily/levIterativeIK.zip
Archive pages: https://levitated.net/daily/levInvaderFractal.html
               https://levitated.net/daily/levIterativeIK.html
Inspected and downloaded 2026-10-27.

The original archives and their levitated.txt notices are distributed here
unchanged. Each notice grants redistribution/modification under the GNU
General Public License without naming a version. These JavaScript adaptations
are distributed under GPL version 3 (see COPYING.txt); the original notices
are preserved beside the original source downloads.

Corresponding source for these adaptations is the unminified, directly served
experiments.js, studies.js, archive-experiments.js, player.js, and style.css in this directory, together with
../levitated.html. No compilation, Flash plug-in, or external library is needed.
Serve the dist directory through any HTTP server to run the adaptations.

Port notes:
- Invader Fractal preserves 15-bit, 3x5 encoding, horizontal mirroring into
  a 5x5 icon, square footprints, corner placement, queued recursive region
  filling, and click-to-refill. Modern additions: seeded reproducibility,
  bounded work, adjustable minimum size/fill pace, keyboard selection, PNG save.
- Iterative IK preserves free-node impulses, force decay .80, velocity decay
  .82, natural connection lengths 15..39, nearest-node attachment inside a
  100-unit radius, and directional parent-to-child constraints. Modern additions:
  a bounded node count, cycle-safe traversal, coincident-node handling,
  deterministic time steps, dragging, keyboard movement, reduced motion.
- Neither adaptation is a pixel-identical preservation of Flash playback;
  UI, random sequence, rendering, and controls have been modernized.

No site-wide license change is implied for unrelated Fractal Space experiments.

Archive checksums:
levInvaderFractal.zip SHA-256 66cb9a85e8316ff2fcfacf5f07cfd81c1de487841f535fb88ba8a512c1693b9d
levIterativeIK.zip SHA-256 ef333b43a38eb7348362223078ae7ae8a61dff2ba4278c16b998aeadea3fa536

Additional Levitated ports, inspected and downloaded 2026-10-28
-------------------------------------------------------------
All six original ZIP files and their levitated.txt notices are preserved
unchanged beside the ports. These are adaptations, not exact Flash playback.

- DLA (2001): preserves edge-spawned particles, an initial push toward the
  center, velocity perturbations clamped to 5, one-degree rotation per step,
  and four rotated hit probes. Canvas uses a spatial index and geometric
  collision discs instead of Flash bitmap hitTest; the particle drawing and
  initial biomass are reconstructed. Modern additions: sticky seeds placed
  by touch/keys, stickiness, bounded growth, and parallel walkers.
- Root Gardener (2003): preserves selective +40 growth, ±15-degree rotation,
  a 73-percent interactive child cap, child scales 40–89 percent of the parent,
  recursive branching and diminishing nourishment of ancestors. Limb graphics
  are reconstructed; smoothstep replaces the bundled easing implementation.
  Depth/node limits, adjustable nourishment and speed, keyboard selection,
  and initial recursive growth make it usable without Flash timelines.
- CA Worm (2003): preserves a circular 32-cell bit row, all 256 rules with
  the source's n2/n1/n0 bit order, default rule 114, accumulating row rotation,
  scale, position, changing omega and phase, and the 3000-instance stopping
  criterion. The source's Flash bit graphic is replaced by Canvas squares;
  automatic framing keeps the growing worm visible. Click picks a new rule.
- Deep Lorenz (2003): preserves simultaneous Euler integration with h=.01,
  sigma=10, rho=28, beta=8/3, randomized initial state, and a bounded rolling
  trail of circles scaled by z. The modern view can orbit in three dimensions
  and exposes trail length; projection and circle artwork are reconstructed.
- Orbiting Networks (2002): preserves six initial nodes, hold-to-size input,
  first nearby connection, radius-preserving orbits, 0.4–3.96-degree node
  speeds, and vertical cursor modulation (169-y)/50. Connections point to
  earlier nodes to prevent cyclic orbit feedback. Modern additions: node
  limit, adjustable connection reach, pointer capture, keyboard creation.
- Sea Thing (2003): preserves 42 tapered bodies, parent rotational following
  (theta difference / 20), bounded turning, random turning for free bodies,
  constant forward swimming, click-to-disconnect, and camera easing / 200
  toward the last detached body. Canvas circles and pulses reconstruct the
  unavailable timeline graphics. Modern additions: speed/turn controls and
  keyboard selection and disconnection.

Every adaptation supports pause, reduced motion, PNG export and theme-aware
controls. White drawing fields and the dark orbit field remain artwork colors.
Root Gardener's original FLA includes Robert Penner's named easing routine;
that source and attribution remain in the unmodified ZIP. The new renderer
uses its own smoothstep expression rather than copying that routine.

Additional archive SHA-256 checksums:
levDLA.zip d632c971783f6054be05be1ddf17a995ad57911d49d2f4da239b0840bef9a77d
levRootGardener.zip 44899c0e828a1defd9cfeab824102ffc0106e3d6e945e766c906c723bfa17334
levCAWorm.zip 4631f9fe9cf459662945b1b0439b39e1bf1b4cdcee5268983e45dc54ba58b3a8
levLorenzDeep.zip fbcf2638e4d82d9daf5b3612e88b52e7a8c3450990da8b4b8202ee82d0829451
levOrbitingNetworks.zip b7a317b004b81f5104b1378f80e17a3fa9d5bf19729c550c85e34d0905d13941
levSeaThing.zip 0ff8f4dc3d09fb75c0a20006b934afcca5b57381293225c00c3519105016270b

Source archive URL pattern: https://levitated.net/daily/NAME.zip
Page URL pattern: https://levitated.net/daily/NAME.html
Deep Lorenz uses levDeepLorenz.html and levLorenzDeep.zip.

Further behavioral recreations, 2026-10-28
----------------------------------------
The following eight works were re-created from the author’s published
algorithm descriptions. Their original archive license notices were checked
and grant the GNU GPL. These new implementations are GPL-3.0-only. Original
Flash code was not used to implement this batch. The original ZIP files and
their individual notices are preserved unchanged beside these recreations.
Source download links use those local copies. The player labels these as recreations.

- Box Fitting: random samples seed squares that expand by two pixels per
  step and stop at neighbors or the field boundary. New exact rectangle
  collision tests prevent the overlaps described in the original. The 16
  vertical color bands use a new procedural palette; photo-derived colors
  and final slight rotations are not reproduced.
- Quarter Round Mosaic: shuffled grid insertion, neighbor color averaging
  and groups of four quarter circles. Tile geometry, palette and insertion
  order are newly implemented. Grid size and fill pace are adjustable.
- Seeds: angular phyllotaxis at the published 137.5-degree default, with a
  square-root radial distribution. New seed shapes, colors and controls
  expose divergence angle and population.
- Golden Spiral: triangles, squares and pentagons recursively scaled by the
  reciprocal golden ratio. Polygon placement is a new geometric construction;
  this is not an extraction of the original Flash transforms. Scroll and
  zoom controls approach the limiting center; Space selects the next polygon.
- City Lines: ten variable-height platform traces grow, push backward and
  fade. Oscillator constants, timing, line colors and rendering are new.
- Triangulation: recursively choose an interior point D and draw DA, DB, DC,
  partitioning ABC into three children, up to the published depth limit 8.
  New positive barycentric weights keep all split points inside each parent.
- Isoblocks: a bounded grid walker places cubes or grows an existing one;
  cubes are isometrically projected, depth-sorted and colored by x. Projection,
  growth rates, faces and palettes are new; original face labels are omitted.
- Mycelium: place-and-test circular colonies spread, stop at occupied areas,
  and can be revived by clicking inactive nodes. The default budget is the
  published 22 spores/second. Collision geometry, branch sizes and palettes
  are new. New colonies can also be planted in empty space.

All eight share theme-aware controls, pause, reduced motion, touch/keyboard
input, PNG export, bounded work, and procedurally generated previews.

Original pages and corresponding Flash source downloads:
https://levitated.net/daily/levBoxFitting.html
https://levitated.net/daily/levBoxFitting.zip
https://levitated.net/daily/levQuarterRound.html
https://levitated.net/daily/levQuarterRound.zip
https://levitated.net/daily/levSeeds.html
https://levitated.net/daily/levSeeds.zip
https://levitated.net/daily/levGoldenSpiral.html
https://levitated.net/daily/levGoldenSpiral.zip
https://levitated.net/daily/levCityLines.html
https://levitated.net/daily/levCityLines.zip
https://levitated.net/daily/levTriangulation.html
https://levitated.net/daily/levTriangulation.zip
https://levitated.net/daily/levIsoblocks.html
https://levitated.net/daily/levIsoblocks.zip
https://levitated.net/daily/levMyco.html
https://levitated.net/daily/levMyco.zip

Further original archive SHA-256 checksums:
levBoxFitting.zip 3e62bb303ee3034a43f732cb6ca71155a7c6551276ad385df7885a17657800c3
levQuarterRound.zip 2adb447080f335ca8a87d1e19730d2928659f69cef16a631acaa122117fa21c7
levSeeds.zip 47a77b5f13d6c484a4740e12d17143670282688896913ca57915436c27eef4ab
levGoldenSpiral.zip 5d17bddb4a92e26eccf892444e58eb3e15ab24f18cb6d038fc9807ed7e8dd45c
levCityLines.zip 87a04c05bae04b0e721fbab1b71ee5190ff631fe024b8613262c2685b337a569
levTriangulation.zip 2ede5fe92b339c1ba650609f10c4d9322264adb6ac29b5027c681bb6018f393e
levIsoblocks.zip fa4c632f82c4534afff62bc6b0abc01c6c327a7a08c5b20fcc79801f90824cde
levMyco.zip 84a7e9a01b442f64c659399d0dc0031ab787009c2c8567e99eca12ca11164693

Machine-readable checksums: archive-checksums.json
