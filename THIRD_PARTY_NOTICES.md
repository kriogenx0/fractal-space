Fractal Space — license scope and third-party notices

Original Fractal Space code and documentation
-------------------------------------------
Copyright (c) 2026 Alex Vaos. Licensed under the MIT License in LICENSE
(repository root), also served as LICENSE.txt. This includes the original
Canvas/WebGL experiments, site UI, procedural previews, development and
Docker configuration, and verification scripts, except the files below.
The MIT grant covers original contributions; it does not relicense any
third-party material or remove existing notices.

Levitated adaptations — GPL exception
------------------------------------
The following files are excluded from the MIT grant and retain their GPL
terms and author notices:
- dist/levitated.html
- dist/levitated/** (including the original source archives and notices)
- dist/thumbnails/invader-fractal.svg
- dist/thumbnails/iterative-ik.svg
- dist/thumbnails/dla.svg
- dist/thumbnails/root-gardener.svg
- dist/thumbnails/ca-worm.svg
- dist/thumbnails/deep-lorenz.svg
- dist/thumbnails/orbiting-networks.svg
- dist/thumbnails/sea-thing.svg
- scripts/check-levitated.mjs
- scripts/check-levitated-studies.mjs
- dist/thumbnails/box-fitting.svg
- dist/thumbnails/quarter-round.svg
- dist/thumbnails/seeds.svg
- dist/thumbnails/golden-spiral.svg
- dist/thumbnails/city-lines.svg
- dist/thumbnails/triangulation.svg
- dist/thumbnails/isoblocks.svg
- dist/thumbnails/mycelium.svg
- scripts/check-levitated-player.mjs
- scripts/check-levitated-archive.mjs

Original experiments: Copyright (C) 2001–2003 Jared Tarbell / Levitated.
Each archive retains its original copyright year and GPL notice.
The original archives contain an unversioned GNU GPL grant. The JavaScript
adaptations are distributed under GPL-3.0-only; full text is in
 dist/levitated/COPYING.txt.
Original notices: dist/levitated/*-notice.txt (one per original archive).
Source, changes, and archive checksums: dist/levitated/README.txt.
https://levitated.net/daily/levInvaderFractal.html
https://levitated.net/daily/levIterativeIK.html
https://levitated.net/daily/levDLA.html
https://levitated.net/daily/levRootGardener.html
https://levitated.net/daily/levCAWorm.html
https://levitated.net/daily/levDeepLorenz.html
https://levitated.net/daily/levOrbitingNetworks.html
https://levitated.net/daily/levSeaThing.html

Additional behavioral recreations: Box Fitting, Quarter Round Mosaic, Seeds,
Golden Spiral, City Lines, Triangulation, Isoblocks, and Mycelium. These follow
Jared Tarbell’s published algorithm descriptions with new geometry, palettes,
controls, and Canvas rendering. Their new implementations and previews are
also GPL-3.0-only. They are labeled as recreations in the player; see the
port notes for differences and original Flash source links. The unmodified original
Flash ZIP files and their notices are bundled separately from this new code;
archive-checksums.json records their verified SHA-256 hashes.

https://levitated.net/daily/levBoxFitting.html
https://levitated.net/daily/levQuarterRound.html
https://levitated.net/daily/levSeeds.html
https://levitated.net/daily/levGoldenSpiral.html
https://levitated.net/daily/levCityLines.html
https://levitated.net/daily/levTriangulation.html
https://levitated.net/daily/levIsoblocks.html
https://levitated.net/daily/levMyco.html

References and externally loaded resources
-----------------------------------------
Tandava parallax re-creates the observable starfield behavior from
https://tandavacult.com/ and credits that reference in the experiment.
Electric horizon is an original implementation inspired by the interactive
3-D presentation at https://goawayrobot.com/.
The MIT License here covers our original implementation and changes, not
those websites, their original source, branding, images, or other assets.

Google Fonts are requested from Google's servers by the browser. Their
font files are not bundled here and remain under their respective licenses.
Any third-party software in container base images retains its own license;
this project's MIT grant does not relicense Node.js, Nginx, Alpine, or fonts.
