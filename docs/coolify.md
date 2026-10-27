# Coolify deployment

Repository preparation is complete. Creating a Coolify resource, choosing a public domain, setting secrets, and enabling deployment are separate steps. This repository change does not deploy the application.

## Resource settings

Use the existing instance at **https://coolify.homecloud.one**, and a separate **Fractal Space** project, not Shared Infrastructure.

| Setting | Value |
| --- | --- |
| Source | GitHub App with access to `kriogenx0/fractal-space`, or a repository deploy key |
| Repository | `git@github.com:kriogenx0/fractal-space.git` |
| Branch | `main` |
| Build strategy / pack | Docker Compose |
| Base directory | `/` |
| Compose location | `/docker-compose.coolify.yml` |
| Public service | `web` |
| Internal listening port | `8080` |
| Health endpoint | `GET /healthz`, HTTP 200, body `ok` |
| Runtime secrets | None |
| Database / storage / migrations | None |

Use the normal Compose deployment mode, not Raw. Leave build/start commands at their defaults. Coolify builds the `production` Dockerfile stage, configures networking, and supplies proxy labels. This Compose file deliberately has no host-port binding, source bind mount, image tag shared with another application, or hard-coded proxy/network configuration.

The runtime is non-root with a read-only filesystem and `/tmp` tmpfs. Nginx listens on every container interface at port 8080. The image contains every HTML, JS, CSS, and thumbnail asset. The browser fetches Google Fonts when online and uses the declared fallbacks otherwise. The fractals run on the visitor's GPU/CPU, not on the deployment server.

## Domain and initial launch

1. Grant the existing Coolify GitHub App access to this repository, or use a read-only repository deploy key. Create the application with the settings above.
2. Keep **Auto Deploy disabled**. Reload the Compose definition after the preparation commit is available on `main`.
3. Select the desired public hostname and arrange its DNS to reach the Coolify server. No domain is assumed or hard-coded in this repository.
4. Assign that HTTPS domain to service `web`, including internal port 8080: `https://YOUR_DOMAIN:8080`. Coolify terminates TLS on normal public port 443; visitors do not connect to public port 8080.
5. Confirm the GitHub **CI / test** job passes for the intended commit, and deploy that commit manually for the first launch. Do not open ports 3080 or 8080 on the host; the Coolify proxy routes traffic internally.
6. Verify Docker health and public HTTPS before enabling automatic deployment. Preserve the previously working image/commit for rollback.

## Optional deployment after CI

The workflow already has a gated `deploy` job, disabled by default. To enable it after the first successful launch:

1. Create a GitHub environment named `production`. Add approval rules there if desired.
2. Add its secrets:
   - `COOLIFY_WEBHOOK`: the resource-specific deploy URL copied from Coolify, typically `https://coolify.homecloud.one/api/v1/deploy?uuid=RESOURCE_UUID&force=false`.
   - `COOLIFY_TOKEN`: a Coolify API token allowed to deploy that application.
3. Set repository Actions variable **`COOLIFY_DEPLOY_ENABLED`** to **`true`**. It is intentionally unset during preparation.
4. Keep Coolify's own **Auto Deploy disabled**. A successful GitHub `test` job on `main` is the gate; pull requests never deploy. A manual CI workflow run on `main` also supports deployment when enabled.

The trigger skips a run if its SHA no longer matches the tip of `main`. The webhook asks Coolify to deploy its configured branch; it does not pin a SHA. Verify Coolify's recorded deployment commit matches a passing CI run, especially if another push occurs during deployment. If strict commit pinning is required, use an immutable-image deployment before enabling automation.

A successful webhook response only confirms the request was accepted. Confirm the deployment reaches a healthy terminal state in Coolify before reporting it live. Missing secrets fail the enabled deploy job; they do not silently bypass the CI gate. Disable the variable to pause future CI-triggered deployments.

## Local readiness check

```sh
make coolify-check  # Validate Coolify's Compose file without deploying
make test          # Validate source and smoke-test the production image
```

CI runs these same checks. The smoke test uses the same `production` target as Coolify, with no source mount and the same read-only runtime, tmpfs, and capabilities.

## Verify the live candidate

Set the actual public origin and check:

```sh
SITE_URL=https://YOUR_DOMAIN
curl -fsS "$SITE_URL/healthz"
curl -fsS -o /dev/null "$SITE_URL/"
curl -fsS -o /dev/null "$SITE_URL/fractal.html?work=mandelbulb"
curl -fsSI "$SITE_URL/fractal.js"
curl -fsS -o /dev/null "$SITE_URL/thumbnails/mandelbulb.jpg"
```

Expect `/healthz` to return `ok`; JavaScript should have a JavaScript Content-Type. `/missing-experiment.js` must return 404. Open the index on desktop and phone; check card links, cursor/arrow-key interaction, zoom, and image export. Confirm HTTP redirects to HTTPS without a loop and the deployed SHA matches the intended passing commit.

## Rollback

Disable `COOLIFY_DEPLOY_ENABLED` and select the previously healthy deployment in Coolify. Restore the prior image/commit and confirm health and public routes. There are no databases, migrations, uploaded files, or persistent volumes to reverse.

## References

- https://coolify.io/docs/applications/builds/docker-compose
- https://coolify.io/docs/applications/sources/github/overview
