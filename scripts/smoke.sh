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
for path in / /theme.js /licenses.html /LICENSE.txt /THIRD_PARTY_NOTICES.txt '/levitated.html?work=invader-fractal' '/levitated.html?work=iterative-ik' /levitated/experiments.js /levitated/player.js /levitated/style.css /levitated/README.txt /levitated/COPYING.txt /levitated/levInvaderFractal.zip /levitated/levIterativeIK.zip /thumbnails/invader-fractal.svg /thumbnails/iterative-ik.svg /tandava.html /tandava.js /tandava.css /parallax-scene.js /thumbnails/tandava-parallax.svg '/experiment.html?work=electric-horizon' '/fractal.html?work=mandelbulb' '/wild.html?work=hyperspace-bloom' '/wild.html?work=dream-strata' /wild.js /wild-scenes.js /thumbnails/hyperspace-bloom.svg /thumbnails/dream-strata.svg /app.js /fractal.js /style.css /fractal.css /thumbnails/mandelbulb.jpg /thumbnails/chaos-loom.jpg; do
  curl --max-time 5 -fsS -o /dev/null "$url$path"
done
headers="$(curl -fsSI "$url/fractal.js")"
printf '%s' "$headers" | tr -d '\r' | grep -Eiq '^Content-Type: (application|text)/javascript'
printf '%s' "$headers" | tr -d '\r' | grep -Eiq '^X-Content-Type-Options: nosniff'
[ "$(curl -s -o /dev/null -w '%{http_code}' "$url/missing-experiment.js")" = 404 ]
[ "$(curl -s -o /dev/null -w '%{http_code}' "$url/.git/config")" = 404 ]
[ "$(docker exec "$container" id -u)" != 0 ]
printf '%s\n' 'PASS: production image serves pages, scripts, thumbnails, health, correct MIME types, and 404s as a non-root user.'
