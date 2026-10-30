# Fractal Space

An index of interactive browser artworks, built with JavaScript, Canvas 2D, and WebGL. Click a thumbnail to open an experiment. Everything under `dist/` is checked-in application source, not disposable build output.

## Local development

Requires Docker Engine or Docker Desktop with Compose, GNU Make, Bash, and curl. Node.js and Nginx run inside Docker; neither needs to be installed locally.

```sh
make setup
make dev
```

The app opens at **http://127.0.0.1:3080** when ready. `make dev` rebuilds and runs attached; Ctrl+C stops and removes its development containers. `make up` does the same without opening a browser. Edit files in `dist/` and refresh the page: Compose mounts the source read-only into Nginx.

```sh
make dev PORT=3081
make running
make logs
make sh
make down
```

Run `make help` (or just `make`) for all tasks. `make install` aliases `setup`, and `make shell` aliases `sh`. Development commands always use project `fractal-space-dev` and `docker-compose.yml`, independently of shell-level Compose file/project overrides.

## Verification

```sh
make test-fast  # JS syntax, local links/assets, unique and valid experiment routes
make smoke      # Build and test the actual production image without source mounts
make test       # Both checks
```

The smoke test starts a temporary container on a randomly assigned localhost port, checks pages, JavaScript MIME types, thumbnails, health, missing-file responses, and the non-root runtime, then removes that container. It does not disturb the development or production stack. These checks do not replace visual browser testing of Canvas/WebGL rendering.

## Coolify

Use [docs/coolify.md](docs/coolify.md) for the GitHub App connection, resource settings, and verification/rollback steps. In Coolify select **Docker Compose**, branch `main`, base directory `/`, and **`/docker-compose.coolify.yml`**. Route the `web` service to internal port **8080**. No runtime secrets, database, or persistent storage are needed.

```sh
make coolify-check
make test
```

Coolify uses the existing **general-apps-coolify** GitHub App and automatically deploys pushes to `main` at **https://fractalspace.org**. Keep **Auto Deploy enabled** for this resource. GitHub Actions runs validation independently; it does not trigger or gate deployment, and needs no Coolify API credentials. Run `make test` before pushing. `make deploy` below runs production directly on the current Docker host; it does not deploy to Coolify.

## Production container

```sh
make build
# Optional: start production on the current Docker host.
make deploy PORT=3080
```

Production uses `docker-compose.production.yml` and project `fractal-space-production`. It serves the assets copied into the image, with no source bind mount. It listens on container port **8080**, runs as the `nginx` user, and exposes **GET /healthz**. The root filesystem is read-only, with temporary Nginx files in `/tmp`. HTML, JS, CSS, and images revalidate on refresh; missing files return 404 instead of an HTML fallback.

```sh
# Choose another host port, or explicitly expose to a reverse proxy/network.
BIND_ADDRESS=0.0.0.0 make deploy PORT=8080
# Stop production explicitly; make down only stops development.
docker compose -p fractal-space-production -f docker-compose.production.yml down
```

`make clean` removes development containers and development/test images only. It preserves `dist/`, the Git checkout, and the production stack.

## Layout

- `dist/index.html`: thumbnail index.
- `dist/experiment.html` + `dist/app.js`: the original four experiments.
- `dist/fractal.html` + `dist/fractal.js`: six fractal artworks with individual controls.
- `dist/thumbnails/`: preview frames and procedural previews.
- `docker/nginx.conf`: static hosting and health endpoint.
- `bin/development`: implementation of the Make tasks.

The existing `.openai/hosting.json` remains available for Sites hosting. Docker/GitHub deployment is independent of that hosting configuration. Google Fonts are fetched by the browser when online; the CSS provides local font fallbacks.

## New explorations

The public index now includes 65 artworks. Hyperspace bloom projects a rotating 4-D hypercube; Gravity is a suggestion bends analytic particle streams around a movable singularity; Infinite descent builds a recursive polygon tunnel. All three use Canvas 2D, support touch and keyboard input, respect reduced motion, and offer PNG frame capture. Their shared renderer lives in `dist/wild-scenes.js`.

To regenerate the four Canvas previews after changing their geometry, run `node scripts/render-wild.mjs --write`. The same renderer checks run in `make test-fast` and CI.

## Tandava parallax

`dist/tandava.html` is the dedicated experiment based on the actual starfield at https://tandavacult.com/ (reference inspected 2026-10-27). It preserves three star densities, scroll factors 0.04/0.12/0.28, cursor factors 4/10/20, white stars, outlined triangles in the near layer, cursor easing, and the scrolling/fading hero triangle. Depth and drift default to the reference values and can be amplified or isolated per layer. Reduced motion disables autonomous drift, twinkling, pointer parallax, and hero motion while preserving scroll-controlled depth. No band text or image assets are copied.

## Levitated ports

The first eight Levitated experiments—Invader Fractal, Iterative IK, DLA, Root Gardener, Cellular Automata Worm, Deep Lorenz, Orbiting Networks, and Sea Thing—are source-based Canvas adaptations of Jared Tarbell’s 2001–2003 Flash works. Their original source archives include a GNU GPL grant. Unchanged upstream archives, author notices, full GPL v3 text, unminified port source, and adaptation notes ship under `dist/levitated/`; the experiment pages link to all of them. See `dist/levitated/README.txt` for provenance, behavior changes, and checksums. Each supports touch/keyboard controls, reduced motion, pause, PNG export, and the site theme. Regenerate previews with `node scripts/check-levitated.mjs --write` and `node scripts/check-levitated-studies.mjs --write`.

### Tandava reference parity

The standalone experiment now follows the reference’s animation loop on every animation frame, uses its exact 0.05 pointer easing per frame, and keeps the sky unchanged on mobile height-only resizes. Grain uses the reference’s 0.09 overlay opacity. Existing depth/drift controls remain at reference values by default. Mandelbulb stays first in the index. Dream Strata is excluded from the main list. Invader Fractal and Tandava parallax are the final two cards.

## License

Original Fractal Space code and documentation are available under the [MIT License](LICENSE), Copyright (c) 2026 Alex Vaos. The Levitated adaptations, their generated previews, and their verification script are excluded from this MIT grant and retain their GPL terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the exact scope, source credits, and external-resource notices. The website serves the license and notices at `/licenses.html`.

## More Levitated recreations

Box Fitting, Quarter Round Mosaic, Seeds, Golden Spiral, City Lines, Triangulation, Isoblocks, and Mycelium follow the author’s published algorithm descriptions. Their geometry, palettes, rendering, and controls are new implementations, documented in `dist/levitated/README.txt`; the player labels these as behavioral recreations. Unmodified original Flash archives and GPL notices are bundled for reference, with checksums verified by the test suite. Render their previews with `node scripts/check-levitated-archive.mjs --write`.

## Site appearance

Every page follows the system’s light/dark preference and has one theme button that cycles System → Light → Dark → System. The button shows the current mode, with its next action in the accessible label and tooltip. Explicit choices persist across navigation and synchronize across tabs. A blocked storage API does not prevent switching themes. The shared theme applies before styles load and covers navigation, controls, help dialogs, credits, error states, and license text. Canvas artworks, PNG exports, and thumbnails retain their original colors, including Levitated’s white drawing fields and Tandava’s dark sky.

## Kinetic Levitated recreations

Tentacles, Bit Field, Monkey Tree, Oily Stratum, Attractor Sets, Rotational Transformation, Gathering Line, and Riley Stack add eight new interactive Canvas interpretations. Their original GPL archives and notices, source credits, and behavioral differences are documented in `dist/levitated/README.txt`. Regenerate previews with `node scripts/check-levitated-kinetic.mjs --write`. Mandelbulb remains first; Dream Strata stays out of the main list; Invader Fractal and Tandava remain last.

## Mathematical explorations

The collection prioritizes mathematical constructions: fractals, chaos,
topology, implicit surfaces, and emergent systems. Nineteen MIT-licensed
experiments live in `dist/math-scenes.js`, with a shared `math.html` / `math.js`
player: Newton basins, Hopf fibers, Torus knots, Gyroid,
Reaction–diffusion, Clifford attractor, Klein bottle, Torus, Möbius strip, Schwarz lantern, Sierpiński triangle, Koch snowflake, Double pendulum, Orbital gravity, Interference pool, Rössler attractor, Magnetic pendulums, Orbit ink, and Fibonacci sculpture.
Each displays its equation and
has a short explanation under Help. See `dist/math-notes.txt` for formulas,
numerical approximations, controls, references, and implementation details.

Generate previews with `node scripts/check-math.mjs --write`. Checks cover
mathematical invariants, numerical behavior, and the actual controller on
mobile/desktop, including reduced motion. The main index keeps Mandelbulb
first, then the new mathematics cards; Dream Strata remains excluded;
Invader Fractal and Tandava remain the final two cards.

## Klein bottle and torus

`math.html?work=klein-bottle` adds the classic bottle immersion, with neck
width, a cutaway, and glass/solid/wireframe views. The corresponding abstract
mesh reverses one seam; tests check closedness, Euler characteristic zero,
and non-orientability. `math.html?work=torus` adds a separate surface with
adjustable major/minor radii, preserving an open hole, and the same three
views. Its mesh is closed and orientable, also with Euler characteristic zero.
Both share the mathematical player, themed controls, equations, help, PNG
export, reduced motion, drag/arrow orbit, and scroll/pinch zoom.

The Klein bottle parametrization is adapted from the MIT-licensed Three.js
ParametricFunctions example; its copyright notice is included in
`dist/math/threejs-LICENSE.txt`. No Three.js runtime or assets are loaded.

## Möbius strip and Schwarz lantern

The Möbius strip has adjustable width and 1, 3, or 5 half-turns. Its mesh
reverses the width coordinate at the seam, with one boundary loop and no
global orientation. A boundary tracer returns after two circuits.
The Schwarz lantern (Schwarz's polyhedron) compares the actual triangle
area with the cylinder's lateral area, excluding end caps. Ring vertices
and band counts expose the area-convergence paradox. Both support orbit,
zoom, surface styles, precise parameters, pause and reduced motion.
Tests verify boundary loops, seam reversal, odd twist controls, triangle
area against its independent formula, and different convergence regimes.

## Gyroid views

The existing Gyroid experiment (`math.html?work=gyroid-field`) is near the start
of the index. Its level and repeat controls are preserved;
Space cycles solid, wireframe and glass without changing the geometry.
The page explains the trigonometric nodal approximation and open crop
boundaries. Checks cover every view and geometry updates while paused.

## Sierpiński triangle

The standalone two-dimensional triangle supports depths 0–8 and continuous
construction progress. Space advances one full generation, wrapping to the
initial triangle; drag/arrows pan and scroll/pinch zoom. The readout exposes
retained area and the limiting dimension log(3)/log(2). Completed stages have
3^n surviving triangles and area fraction (3/4)^n; partial holes expand about
their centers. Controls work while paused, including with reduced motion.

## Koch snowflake

An original recursive Canvas construction with depths 0–7, continuous peak
growth, and exact generation stepping. The live readout compares perimeter
and area with the initial triangle: perimeter grows by 4/3 per generation,
while area approaches 8/5. Drag/arrows pan; scroll/pinch zoom. The controls
work with reduced motion and while paused. The index keeps Mandelbulb first.

## Double pendulum

Two unit point masses on unit massless rods, integrated with RK4 at 240 Hz.
The amber twin starts 0.01° away in its lower angle. Both leave a bounded
30-second trail. Starting-angle sliders, drag, and arrow keys release from
rest; Space replays the same release, R cycles presets, and P pauses.
Reduced motion starts paused. The readout shows elapsed simulation time,
tip separation, and energy drift normalized by 3mgL.

## Gravity, waves, and attracting fields

Orbital gravity provides six planets, adjustable stellar gravity and launch
speed, fading trails, and drag-to-launch planets. Up to twelve independent
Kepler trajectories use velocity-Verlet integration. Space resets, R cycles
circular/elliptical/escape/infall presets, and scroll/pinch zooms.

Interference pool adds two coherent analytic waves on a 3-D surface; Space
switches the relative phase. Rössler attractor renders a sampled RK4 curve
with adjustable a and c. Magnetic pendulums releases 21 planar bobs between
three smooth attraction wells, with adjustable damping and strength.
Drag releases a group near the cursor. The three renderers and pure helpers
live in `dist/math-extra.js`. All four support pause, reduced motion,
themes, keyboard controls, fullscreen, and PNG export.

## Orbit ink

Draw freehand into a slowly rotating 3-D coordinate system. Each pen sample
is inverse-rotated from the camera-facing depth plane into world space, so
existing strokes remain fixed while new points follow the cursor. Rotation
speed and pen depth are adjustable; arrows orbit, pinch/scroll zooms, and
P pauses rotation while drawing remains available. U, Space or Cmd/Ctrl-Z
undo; Clear drawing is undoable; R resets the view. Colors apply to new
strokes. PNG capture saves the current view. Starts empty, including with
reduced motion. The drawing is capped at 12,000 points / 128 strokes.

## Fibonacci sculpture

Fibonacci-sized squares tile a rectangle; full extrusion turns them into
cubes with edge lengths 1,1,2,3,5,8,... . A lifted quarter-circle spiral
connects the cube tops. Choose 1–12 terms, step with Space, and flatten the
sculpture with Extrusion. Number labels and a live consecutive-term ratio
make the sequence visible. Drag/arrows orbit; scroll/pinch zooms; P pauses.
The view fits each construction while preserving relative dimensions.

## More Levitated geometry

Cellular Automata Twist, Trema Field, Folding Pentagons, and Double Helix are new Canvas recreations of Jared Tarbell’s published descriptions. They add a 16-bit rule-110 cylinder, middle-third cuts represented by circular areas, a shrinking edge-linked pentagon puzzle, and clickable three-bead helix rungs. All use the shared themed player, touch/keyboard controls, pause, reduced motion and PNG export. Original GPL archives, notices and SHA-256 checksums are preserved alongside the GPL-3.0-only recreations. See `dist/levitated/README.txt` for construction choices and differences. Generate their previews with `node scripts/check-levitated-geometric.mjs --write`.

## Search and sharing

Every experiment's existing `*.html?work=...` URL receives its own pre-rendered
HTML from Nginx, including a title, description, canonical, Open Graph/Twitter
metadata, JSON-LD, and text before JavaScript executes. Rendering and controls
still use the original JavaScript. Unknown work names return 404. The default
URL for each player uses that player's normal first artwork and canonicalizes
to its query URL. `/index.html` redirects to `/`. No crawler-specific response
or runtime rendering service is involved.

Run `make seo` after adding experiments, editing catalogs/templates, or
regenerating thumbnails. This optional Docker task rebuilds checked-in
`dist/_pages/`, `seo-routes.conf`, `sitemap.xml`, `robots.txt`, share JPEGs,
and favicon assets. It uses a locked Sharp dependency in an authoring image;
production remains static Nginx. The normal tests reject stale generated files
and smoke-test every experiment URL against its pre-rendered HTML.

The sitemap lists the public index and credits page. Dream Strata keeps its
direct route and metadata but remains absent from the index, collection
structured data, and sitemap. Public card ordering is unchanged. Levitated
page/image derivatives retain their GPL notices and author credit.

Sitemap: <https://fractalspace.org/sitemap.xml>. Search Console ownership and
sitemap submission are managed separately in the domain’s Search Console account.

## Mountain terrain

A seeded 3D landscape built from warped, ridged fractal value noise. Mountain
height and valley depth adjust elevation independently; roughness changes fine
ridges, and landscape depth stretches the front-to-back extent. Changing
relief preserves the landscape seed. New terrain / R regenerates the range
without changing the camera or controls. Space switches shaded alpine,
height-contour and wireframe views. Drag/arrows orbit, scroll/pinch zooms,
P pauses rotation, and Save frame exports a PNG. The 64×64 height grid has
8,192 surface triangles and exposed side walls. All controls work while paused.

## Ripple plane

A 3D wave surface with clickable/tappable droplets. Each impact displaces
a shared damped-wave field, so circular ripples travel outward and interfere.
Wave height, speed, damping, and droplet size are adjustable without clearing
the surface. Clicks use a ray intersection with the displaced mesh; drag
rotates and pinch zooms without dropping water. Arrows move a target, Space
or Enter adds a drop, Shift + arrows orbits, and R clears the water. Pause
freezes propagation while impacts and camera controls remain usable. Two
initial ripples introduce the surface; Clear water starts a flat plane.

### Extended parameter ranges

The experiment controls expose wider domains while preserving their initial settings. Examples: Mandelbulb power 2–24 and 1–24 iterations; Julia detail 16–600; orbital gravity 0.05–8 and launch speed 0–4; terrain height 0–8, valley depth 0–6, roughness 0–2, and depth 0.1–6; ripple height 0–4, speed 0–5, damping 0–6, and droplet radius 0.05–1.2. Orbit ink can turn in either direction at up to 90°/s. Fibonacci sculptures support 20 terms and extrusion up to 3. Torus radii include horn and spindle surfaces. Levitated growth, population, geometry, and timing controls have also been widened.

Construction progress and probabilities retain their 0–1 mathematical domain, and elementary cellular automata retain rules 0–255. Recursive geometry has finite generation limits to bound memory and drawing work; ripple speed remains below the wave solver’s stability limit at every supported grid resolution.

Ball drop adds exact constant-gravity flight and collision-time rebounds, with Earth/Moon/Mars/Jupiter/zero-gravity presets, release height, restitution and playback controls.

Liquid cursor is an original Canvas implicit-surface experiment. The cursor and floating drops share a metaball field, with click/tap planting, keyboard control, reflective shading, and bounded population/raster work.

The index filters (All, Math, Art, Fractals, Geometry, Physics, Levitated) use
space-separated `data-tags` on each card. Tags can overlap, and filtering keeps
the authored card order. A `?tag=physics` URL opens a filtered view; All removes
the tag. Native buttons expose their selected state and a live result count.
Without JavaScript the full collection stays visible. Shared theme colors apply
to the filter row in both light and dark mode.
