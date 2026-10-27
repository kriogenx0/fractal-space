#!/usr/bin/env bash
set -euo pipefail

# A real deployment trigger. CI calls this only after tests and explicit opt-in.
: "${COOLIFY_WEBHOOK:?Set the production environment COOLIFY_WEBHOOK secret}"
: "${COOLIFY_TOKEN:?Set the production environment COOLIFY_TOKEN secret}"
: "${GITHUB_REPOSITORY:?Run this trigger from GitHub Actions}"
: "${GITHUB_SHA:?Run this trigger from GitHub Actions}"
: "${GH_TOKEN:?Set the GitHub Actions read-only token}"

case "$COOLIFY_WEBHOOK" in
  https://*/api/v1/deploy\?*) ;;
  *) printf '%s\n' 'COOLIFY_WEBHOOK must be the HTTPS deployment webhook copied from Coolify.' >&2; exit 1 ;;
esac
# Coolify deploys the configured branch. Do not let an older successful run
# trigger deployment of a newer main commit that has not passed CI yet.
latest="$(gh api "repos/$GITHUB_REPOSITORY/commits/main" --jq .sha)"
if [ "$latest" != "$GITHUB_SHA" ]; then
  printf '%s\n' 'Skipping this superseded run; main has moved. The latest commit must pass CI.'
  exit 0
fi
curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 60 \
  --request POST --header "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_WEBHOOK"
printf '\n%s\n' 'Deployment requested. Verify the deployed commit, Docker health, and public HTTPS in Coolify.'
