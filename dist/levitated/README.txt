Levitated -> JavaScript / Fractal Space

Original experiments by Jared Tarbell, Copyright (C) 2003.
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
experiments.js, player.js, and style.css in this directory, together with
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
