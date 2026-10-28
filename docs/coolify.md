# Coolify deployment

Production uses the existing **general-apps-coolify** GitHub App. Pushes to `main` notify Coolify through the App webhook and deploy to **https://fractalspace.org**. GitHub Actions validates the code independently; deployment does not wait for Actions and needs no Coolify secrets in GitHub.

## Resource settings

Use the existing instance at **https://coolify.homecloud.one**, and a separate **Fractal Space** project, not Shared Infrastructure.

| Setting | Value |
| --- | --- |
| Source | Existing `general-apps-coolify` GitHub App (installation `171489770`) |
| Repository | `kriogenx0/fractal-space` (repository ID `1435103059`) |
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

## GitHub App and automatic deployment

The production application is `fractal-space`, UUID `yxykrbxr17zeyjv80knsm5bx`, in the **Fractal Space** project. Its source is the installed GitHub App, not the Public GitHub source.

- Source: `general-apps-coolify`, App ID `5320962`, installation `171489770`.
- Repository: `kriogenx0/fractal-space`, ID `1435103059`; branch `main`, commit `HEAD`.
- Auto Deploy: **enabled** (Deploy on push / webhooks).
- App webhook: `https://coolify.homecloud.one/webhooks/source/github/events`, subscribed to `push`; HTTPS certificate validation enabled.
- Public `web` service domain: `https://fractalspace.org:8080`. Coolify terminates TLS on public port 443 and routes internally to port 8080.
- Preview deployments remain disabled.

The App already has repository access. Use its existing installation and webhook; no separate repository hook, deploy key, or Actions deployment token is required. An empty repository webhooks list does not indicate a missing App webhook: App webhooks are configured on the App itself.

Run `make test` before pushing. A push to `main` starts Coolify deployment and GitHub CI independently. A green CI result does not prove deployment completed. Verify the Coolify deployment records the pushed SHA, reaches `finished`, and leaves the service healthy before reporting it live.

If pushes stop deploying, check the application's source and repository ID, Auto Deploy, App installation access, and GitHub App webhook deliveries. A successful webhook request only confirms acceptance; inspect the deployment result separately. Avoid adding a second deployment trigger in Actions.

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

Temporarily disable Auto Deploy on this Coolify application and select the previously healthy deployment in Coolify. Restore the prior image/commit and confirm health and public routes. There are no databases, migrations, uploaded files, or persistent volumes to reverse.

## References

- https://coolify.io/docs/applications/builds/docker-compose
- https://coolify.io/docs/applications/sources/github/overview
