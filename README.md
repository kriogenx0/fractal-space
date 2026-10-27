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

Use [docs/coolify.md](docs/coolify.md) for the resource settings, domain, CI gate, and launch/rollback steps. In Coolify select **Docker Compose**, branch `main`, base directory `/`, and **`/docker-compose.coolify.yml`**. Route the `web` service to internal port **8080**. No runtime secrets, database, or persistent storage are needed.

```sh
make coolify-check
make test
```

GitHub CI validates the deployment and production image. Its optional Coolify deploy job stays off until `COOLIFY_DEPLOY_ENABLED=true` and the production environment secrets are configured. Keep Coolify Auto Deploy off so CI controls deployment. `make deploy` below runs production directly on the current Docker host; it does not deploy to Coolify.

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

The index now includes 14 artworks. Hyperspace bloom projects a rotating 4-D hypercube; Gravity is a suggestion bends analytic particle streams around a movable singularity; Infinite descent builds a recursive polygon tunnel; Dream strata layers floating monuments and moons with cursor-driven parallax. All four use Canvas 2D, support touch and keyboard input, respect reduced motion, and offer PNG frame capture. Their shared renderer lives in `dist/wild-scenes.js`.

To regenerate the four Canvas previews after changing their geometry, run `node scripts/render-wild.mjs --write`. The same renderer checks run in `make test-fast` and CI.
