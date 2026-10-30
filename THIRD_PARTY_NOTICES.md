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

- dist/thumbnails/tentacles.svg
- dist/thumbnails/bit-field.svg
- dist/thumbnails/monkey-tree.svg
- dist/thumbnails/oily-stratum.svg
- dist/thumbnails/attractor-sets.svg
- dist/thumbnails/rotational-transformation.svg
- dist/thumbnails/gathering-line.svg
- dist/thumbnails/riley-stack.svg
- scripts/check-levitated-kinetic.mjs
- scripts/check-levitated-geometric.mjs
- dist/thumbnails/ca-twist.svg
- dist/thumbnails/trema-field.svg
- dist/thumbnails/folding-pentagons.svg
- dist/thumbnails/double-helix.svg

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

Further behavioral recreations: Tentacles, Bit Field, Monkey Tree, Oily Stratum, Attractor Sets, Rotational Transformation, Gathering Line, Riley Stack.
These newly implemented Canvas studies follow the published descriptions;
original archives and GPL notices are bundled unchanged. Checksums are in
kinetic-checksums.json. Tentacles credits Robert Hodgin / Flight-404 for
the original code exchange. Bit Field credits Keith Peters / Bit-101 for
the original perspective techniques. Riley Stack credits Bridget Riley as
the artistic reference and Peters Wave as the original algorithmic basis.
No photographs, paintings, or Flash timeline graphics are copied.
https://levitated.net/daily/levFlagellum.html
https://levitated.net/daily/levBitField.html
https://levitated.net/daily/levMonkeyTree.html
https://levitated.net/daily/levOilyStratum.html
https://levitated.net/daily/levAttractorSets.html
https://levitated.net/daily/levRotationalT.html
https://levitated.net/daily/levGatheringLine.html
https://levitated.net/daily/levRileyStack.html

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

Mathematical references
-----------------------
The mathematical experiments in dist/math-scenes.js are MIT licensed.
The Klein bottle parametrization adapts a Three.js example, as noted below. Numerical formulas and limitations are documented
in dist/math-notes.txt. Background references include Niles Johnson's Hopf
fibration explanation, Zachary Treisman's mathematical notes, Karl Sims's
Gray-Scott tutorial, and Alan H. Schoen's 1970 NASA minimal-surfaces report.
No reference code, illustrations, animations, or photographs are bundled.
https://nilesjohnson.net/hopf.html
https://nilesjohnson.net/hopf-articles/Treisman_Guide-to-Hopf-fibration.pdf
https://www.karlsims.com/rd.html
https://ntrs.nasa.gov/citations/19700020472

Klein bottle parametrization — Three.js (MIT)
-------------------------------------------
The classic kleinPoint routine in dist/math-scenes.js adapts the equations
from Three.js ParametricFunctions.klein. Copyright three.js authors.
The complete upstream MIT notice is preserved in
 dist/math/threejs-LICENSE.txt.
https://github.com/mrdoob/three.js/blob/dev/examples/jsm/geometries/ParametricFunctions.js
Mesh topology, surface rendering and controls are new implementations.
No Three.js runtime, textures, or other artwork is bundled.

Möbius strip / Schwarz lantern
-----------------------------
These are original MIT-licensed mathematical implementations. Schwarz
lantern construction reference: John M. Sullivan / Matteo Petrera,
Geometry II, TU Berlin (2010), exercise sheet 1, Exercise 2.
https://page.math.tu-berlin.de/~sullivan/L/10S/Geo2/ex1.pdf
No reference text, diagrams, source code, or other assets are bundled.

Geometric behavioral recreations
--------------------------------
Cellular Automata Twist, Trema Field, Folding Pentagons and Double Helix
follow Jared Tarbell’s published descriptions. New Canvas code, controls
and previews are GPL-3.0-only. Original archives and individual notices
are preserved; geometric-checksums.json records their SHA-256 hashes.
The original page dates span 2001–2003; all four archive notices say 2002.
Trema Field credits Benoit Mandelbrot’s middle-third construction.
See dist/levitated/README.txt for the new geometry and rendering choices.
https://levitated.net/daily/levCATwist.html
https://levitated.net/daily/levTremaFieldWhite.html
https://levitated.net/daily/levFoldingPentagons.html
https://levitated.net/daily/levDoubleHelix.html

SEO generation and share previews
---------------------------------
The SEO authoring/verification tools scripts/seo.mjs, render-social.mjs
and check-seo.mjs are GPL-3.0-only because they process GPL Levitated
templates and previews alongside the original artworks. They are excluded
from the repository's MIT grant. Generated dist/_pages/levitated/** pages
and the matching dist/social/<Levitated-slug>.jpg derivatives retain GPL
terms. Their slugs are the Levitated catalog keys in dist/levitated/experiments.js.
Metadata identifies Jared Tarbell's original work and links to its source
and license. The other generated pages, original-artwork share images,
favicon designs, and site metadata are original MIT-licensed contributions.

Sharp (Apache-2.0) and its dependencies, and DejaVu fonts, are used only in
the optional offline SEO authoring image. Their package notices remain in
that image. No Sharp runtime or font files are bundled into the web app.

Ball drop in dist/ball-drop.js is an original MIT-licensed constant-gravity
and restitution model. Planetary gravity references are identified in
dist/math-notes.txt. No third-party implementation code is used.

Liquid cursor in dist/liquid-cursor.js is an original MIT-licensed implicit
surface and Canvas renderer. No third-party implementation code is used.

Spectrum analyzer in dist/spectrum-engine.js and dist/spectrum.js is an original
MIT-licensed Web Audio implementation. No third-party implementation code is used.

Orbit Breach in dist/orbit-breach-engine.js and dist/orbit-breach.js is an
original MIT-licensed game and Canvas renderer by Alex Vaos. Inspiration:
Super Hexagon by Terry Cavanagh, https://superhexagon.com/.

Chladni study and Coupled oscillators in dist/wave-studies.js are original
MIT-licensed JavaScript implementations by Alex Vaos. Mathematical references
and model differences are documented in dist/math-notes.txt; no reference-site
source code or assets are bundled. The Levitated GPL exceptions are unchanged.

Standing-wave resonance and Brachistochrone race in dist/resonance-race.js
are original MIT-licensed JavaScript implementations by Alex Vaos. oPhysics,
PhET and myPhysicsLab references and model differences are documented in
dist/math-notes.txt. No source-site code, graphics or assets are bundled.
