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
experiments.js, studies.js, player.js, and style.css in this directory, together with
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
