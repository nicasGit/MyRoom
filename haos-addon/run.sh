#!/bin/sh
set -eu
if [ -f /data/options.json ]; then
  PUBLIC_ORIGIN="$(jq -er '.public_origin' /data/options.json)"
  export PUBLIC_ORIGIN
  ADMIN_TOKEN="$(jq -r '.admin_token // ""' /data/options.json)"
  export ADMIN_TOKEN
  DEBUG_WITHOUT_ADMIN_TOKEN="$(jq -r '.debug_without_admin_token // false' /data/options.json)"
  export DEBUG_WITHOUT_ADMIN_TOKEN
fi
: "${PUBLIC_ORIGIN:?Configure public_origin / PUBLIC_ORIGIN}"
export DATA_DIR=/data/myroom
node /app/server/dist/index.js &
server_pid=$!
nginx -g 'daemon off;' &
nginx_pid=$!
stop() { kill "$server_pid" "$nginx_pid" 2>/dev/null || true; }
trap stop INT TERM EXIT
while kill -0 "$server_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do sleep 1; done
exit 1
