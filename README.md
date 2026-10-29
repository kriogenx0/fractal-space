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

The public index now includes 51 artworks. Hyperspace bloom projects a rotating 4-D hypercube; Gravity is a suggestion bends analytic particle streams around a movable singularity; Infinite descent builds a recursive polygon tunnel. All three use Canvas 2D, support touch and keyboard input, respect reduced motion, and offer PNG frame capture. Their shared renderer lives in `dist/wild-scenes.js`.

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

Every page follows the system’s light/dark preference and has a Theme menu for System, Light, or Dark. Explicit choices persist across navigation and synchronize across tabs. A blocked storage API does not prevent switching themes. The shared theme applies before styles load and covers navigation, controls, help dialogs, credits, error states, and license text. Canvas artworks, PNG exports, and thumbnails retain their original colors, including Levitated’s white drawing fields and Tandava’s dark sky.

## Kinetic Levitated recreations

Tentacles, Bit Field, Monkey Tree, Oily Stratum, Attractor Sets, Rotational Transformation, Gathering Line, and Riley Stack add eight new interactive Canvas interpretations. Their original GPL archives and notices, source credits, and behavioral differences are documented in `dist/levitated/README.txt`. Regenerate previews with `node scripts/check-levitated-kinetic.mjs --write`. Mandelbulb remains first; Dream Strata stays out of the main list; Invader Fractal and Tandava remain last.

## Mathematical explorations

The collection prioritizes mathematical constructions: fractals, chaos,
topology, implicit surfaces, and emergent systems. Thirteen MIT-licensed
experiments live in `dist/math-scenes.js`, with a shared `math.html` / `math.js`
player: Newton basins, Hopf fibers, Torus knots, Gyroid,
Reaction–diffusion, Clifford attractor, Klein bottle, Torus, Möbius strip, Schwarz lantern, Sierpiński triangle, Koch snowflake, and Double pendulum.
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
