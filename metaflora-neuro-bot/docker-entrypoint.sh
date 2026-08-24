#!/bin/sh
set -eu

exec flock \
  --nonblock \
  --no-fork \
  --conflict-exit-code 75 \
  /data/metaflora-neuro-bot.lock \
  sh -c '
    chown -R node:node /data
    exec setpriv --reuid=node --regid=node --init-groups "$@"
  ' sh "$@"
