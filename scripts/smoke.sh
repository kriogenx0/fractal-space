#!/usr/bin/env bash
set -euo pipefail
image="${1:-fractal-space:production}"
command -v curl >/dev/null || { printf '%s\n' 'curl is required.' >&2; exit 1; }
container=''
cleanup() { if [ -n "$container" ]; then docker rm -f "$container" >/dev/null; fi; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Random port, no mounts: test the actual production image and no other app.
container="$(docker run -d --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges --publish 127.0.0.1::8080 "$image")"
port="$(docker port "$container" 8080/tcp)"
url="http://$port"
ready=false
for attempt in {1..30}; do
  if curl --max-time 2 -fsS "$url/healthz" >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then docker logs "$container"; printf '%s\n' 'Container did not become ready.' >&2; exit 1; fi
[ "$(curl -fsS "$url/healthz")" = ok ]
for path in /spectrum.html /spectrum.js /spectrum-engine.js /spectrum.css /thumbnails/spectrum-analyzer.svg /social/spectrum-analyzer.jpg /index-filters.js /liquid-cursor.js '/math.html?work=liquid-cursor' /thumbnails/liquid-cursor.svg /social/liquid-cursor.jpg /ball-drop.js '/math.html?work=ball-drop' /thumbnails/ball-drop.svg /social/ball-drop.jpg /ripple-plane.js '/math.html?work=ripple-plane' /thumbnails/ripple-plane.svg /social/ripple-plane.jpg /mountain-terrain.js '/math.html?work=mountain-terrain' /thumbnails/mountain-terrain.svg /social/mountain-terrain.jpg /levitated/geometric-experiments.js /levitated/geometric-checksums.json '/levitated.html?work=ca-twist' /thumbnails/ca-twist.svg /levitated/levCATwist.zip /levitated/levCATwist-notice.txt '/levitated.html?work=trema-field' /thumbnails/trema-field.svg /levitated/levTremaFieldWhite.zip /levitated/levTremaFieldWhite-notice.txt '/levitated.html?work=folding-pentagons' /thumbnails/folding-pentagons.svg /levitated/levFoldingPentagons.zip /levitated/levFoldingPentagons-notice.txt '/levitated.html?work=double-helix' /thumbnails/double-helix.svg /levitated/levDoubleHelix.zip /levitated/levDoubleHelix-notice.txt /fibonacci-sculpture.js '/math.html?work=fibonacci-sculpture' /thumbnails/fibonacci-sculpture.svg /orbit-ink.js '/math.html?work=orbit-ink' /thumbnails/orbit-ink.svg /math-extra.js '/math.html?work=orbital-gravity' /thumbnails/orbital-gravity.svg '/math.html?work=wave-interference' /thumbnails/wave-interference.svg '/math.html?work=rossler-attractor' /thumbnails/rossler-attractor.svg '/math.html?work=magnetic-pendulums' /thumbnails/magnetic-pendulums.svg '/math.html?work=double-pendulum' /thumbnails/double-pendulum.svg '/math.html?work=koch-snowflake' /thumbnails/koch-snowflake.svg '/math.html?work=sierpinski-triangle' /thumbnails/sierpinski-triangle.svg '/math.html?work=mobius-strip' '/math.html?work=schwarz-lantern' /thumbnails/mobius-strip.svg /thumbnails/schwarz-lantern.svg '/math.html?work=klein-bottle' '/math.html?work=torus' /thumbnails/klein-bottle.svg /thumbnails/torus.svg /math/threejs-LICENSE.txt /math.html /math.js /math-scenes.js /math.css /math-notes.txt '/math.html?work=newton-basins' /thumbnails/newton-basins.svg '/math.html?work=hopf-fibers' /thumbnails/hopf-fibers.svg '/math.html?work=torus-knots' /thumbnails/torus-knots.svg '/math.html?work=gyroid-field' /thumbnails/gyroid-field.svg '/math.html?work=reaction-diffusion' /thumbnails/reaction-diffusion.svg '/math.html?work=clifford-attractor' /thumbnails/clifford-attractor.svg /levitated/kinetic-experiments.js /levitated/kinetic-checksums.json /levitated/levFlagellum.zip /levitated/levFlagellum-notice.txt /levitated/levBitField.zip /levitated/levBitField-notice.txt /levitated/levMonkeyTree.zip /levitated/levMonkeyTree-notice.txt /levitated/levOilyStratum.zip /levitated/levOilyStratum-notice.txt /levitated/levAttractorSets.zip /levitated/levAttractorSets-notice.txt /levitated/levRotationalT.zip /levitated/levRotationalT-notice.txt /levitated/levGatheringLine.zip /levitated/levGatheringLine-notice.txt /levitated/levRileyStack.zip /levitated/levRileyStack-notice.txt '/levitated.html?work=tentacles' /thumbnails/tentacles.svg '/levitated.html?work=bit-field' /thumbnails/bit-field.svg '/levitated.html?work=monkey-tree' /thumbnails/monkey-tree.svg '/levitated.html?work=oily-stratum' /thumbnails/oily-stratum.svg '/levitated.html?work=attractor-sets' /thumbnails/attractor-sets.svg '/levitated.html?work=rotational-transformation' /thumbnails/rotational-transformation.svg '/levitated.html?work=gathering-line' /thumbnails/gathering-line.svg '/levitated.html?work=riley-stack' /thumbnails/riley-stack.svg /levitated/levBoxFitting.zip /levitated/levBoxFitting-notice.txt /levitated/levQuarterRound.zip /levitated/levQuarterRound-notice.txt /levitated/levSeeds.zip /levitated/levSeeds-notice.txt /levitated/levGoldenSpiral.zip /levitated/levGoldenSpiral-notice.txt /levitated/levCityLines.zip /levitated/levCityLines-notice.txt /levitated/levTriangulation.zip /levitated/levTriangulation-notice.txt /levitated/levIsoblocks.zip /levitated/levIsoblocks-notice.txt /levitated/levMyco.zip /levitated/levMyco-notice.txt /levitated/archive-checksums.json '/levitated.html?work=box-fitting' /thumbnails/box-fitting.svg '/levitated.html?work=quarter-round' /thumbnails/quarter-round.svg '/levitated.html?work=seeds' /thumbnails/seeds.svg '/levitated.html?work=golden-spiral' /thumbnails/golden-spiral.svg '/levitated.html?work=city-lines' /thumbnails/city-lines.svg '/levitated.html?work=triangulation' /thumbnails/triangulation.svg '/levitated.html?work=isoblocks' /thumbnails/isoblocks.svg '/levitated.html?work=mycelium' /thumbnails/mycelium.svg '/levitated.html?work=dla' /thumbnails/dla.svg '/levitated.html?work=root-gardener' /thumbnails/root-gardener.svg '/levitated.html?work=ca-worm' /thumbnails/ca-worm.svg '/levitated.html?work=deep-lorenz' /thumbnails/deep-lorenz.svg '/levitated.html?work=orbiting-networks' /thumbnails/orbiting-networks.svg '/levitated.html?work=sea-thing' /thumbnails/sea-thing.svg /levitated/levDLA.zip /levitated/levDLA-notice.txt /levitated/levRootGardener.zip /levitated/levRootGardener-notice.txt /levitated/levCAWorm.zip /levitated/levCAWorm-notice.txt /levitated/levLorenzDeep.zip /levitated/levLorenzDeep-notice.txt /levitated/levOrbitingNetworks.zip /levitated/levOrbitingNetworks-notice.txt /levitated/levSeaThing.zip /levitated/levSeaThing-notice.txt / /theme.js /theme.css /licenses.html /LICENSE.txt /THIRD_PARTY_NOTICES.txt '/levitated.html?work=invader-fractal' '/levitated.html?work=iterative-ik' /levitated/experiments.js /levitated/studies.js /levitated/archive-experiments.js /levitated/player.js /levitated/style.css /levitated/README.txt /levitated/COPYING.txt /levitated/levInvaderFractal.zip /levitated/levIterativeIK.zip /thumbnails/invader-fractal.svg /thumbnails/iterative-ik.svg /tandava.html /tandava.js /tandava.css /parallax-scene.js /thumbnails/tandava-parallax.svg '/experiment.html?work=electric-horizon' '/fractal.html?work=mandelbulb' '/wild.html?work=hyperspace-bloom' '/wild.html?work=dream-strata' /wild.js /wild-scenes.js /thumbnails/hyperspace-bloom.svg /thumbnails/dream-strata.svg /app.js /fractal.js /style.css /fractal.css /thumbnails/mandelbulb.jpg /thumbnails/chaos-loom.jpg; do
  curl --max-time 5 -fsS -o /dev/null "$url$path"
done
# The homepage must be a document, not an index.html redirect cycle.
curl --max-time 5 -fsS "$url/" | cmp -s dist/index.html -
curl --max-time 5 -fsS "$url/?utm_source=smoke" | cmp -s dist/index.html -
curl -fsSI "$url/index.html?utm_source=smoke" | tr -d '\r' | grep -Fq 'Location: /?utm_source=smoke'
# Validate every public query URL against its pre-rendered HTML without executing JS.
for page in dist/_pages/*/*.html; do
  route="$(sed -n 's|^<link rel="canonical" href="https://fractalspace.org\([^" ]*\)".*|\1|p' "$page")"
  [ -n "$route" ]
  curl --max-time 5 -fsS "$url$route" | cmp -s "$page" -
done
curl --max-time 5 -fsS "$url/math.html?utm_source=smoke&work=klein-bottle" | cmp -s dist/_pages/math/klein-bottle.html -
curl --max-time 5 -fsS -A 'Googlebot' "$url/levitated.html?work=trema-field" | cmp -s dist/_pages/levitated/trema-field.html -
curl --max-time 5 -fsS "$url/math.html" | cmp -s dist/_pages/math/newton-basins.html -
curl --max-time 5 -fsS "$url/math.html?WORK=fibonacci-sculpture" | cmp -s dist/_pages/math/newton-basins.html -
for path in /robots.txt /sitemap.xml /favicon.svg /favicon-32.png /apple-touch-icon.png /social/fractal-space.jpg /social/klein-bottle.jpg /social/trema-field.jpg; do
  curl --max-time 5 -fsS -o /dev/null "$url$path"
done
for path in '/math.html?work=missing' '/fractal.html?work=MANDELBULB' '/levitated.html?work=../../LICENSE' /_pages/math/klein-bottle.html /seo-routes.conf; do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$url$path")" = 404 ]
done
[ "$(curl -s -o /dev/null -w '%{http_code}' "$url/index.html")" = 301 ]
curl -fsSI "$url/social/klein-bottle.jpg" | tr -d '\r' | grep -Eiq '^Content-Type: image/jpeg'
curl -fsSI "$url/sitemap.xml" | tr -d '\r' | grep -Eiq '^Content-Type: (application|text)/xml'
headers="$(curl -fsSI "$url/fractal.js")"
printf '%s' "$headers" | tr -d '\r' | grep -Eiq '^Content-Type: (application|text)/javascript'
printf '%s' "$headers" | tr -d '\r' | grep -Eiq '^X-Content-Type-Options: nosniff'
[ "$(curl -s -o /dev/null -w '%{http_code}' "$url/missing-experiment.js")" = 404 ]
[ "$(curl -s -o /dev/null -w '%{http_code}' "$url/.git/config")" = 404 ]
[ "$(docker exec "$container" id -u)" != 0 ]
printf '%s\n' 'PASS: production image serves all pre-rendered query pages, crawler/browser metadata, sitemap, icons, share images, health, correct MIME types, canonical redirects and real 404s as a non-root user.'
