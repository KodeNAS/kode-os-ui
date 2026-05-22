#!/usr/bin/env bash
# Build kode-os-ui and deploy it to a pebble running CasaOS.
#
# Usage:
#   ./scripts/deploy-to-pi.sh                  # deploy to kode@pebble.local
#   PI_HOST=kode@10.0.0.42 ./scripts/deploy-to-pi.sh

set -euo pipefail

PI_HOST="${PI_HOST:-kode@pebble.local}"
BUILD_DIR="build/sysroot/var/lib/casaos/www"
STAGE_DIR="/tmp/kode-os-ui"
TARGET_DIR="/var/lib/casaos/www"

cd "$(dirname "$0")/.."

echo "Building kode-os-ui..."
pnpm build

if [[ ! -d "${BUILD_DIR}" ]]; then
  echo "Build output not found at ${BUILD_DIR}" >&2
  exit 1
fi

echo "Syncing build to ${PI_HOST}:${STAGE_DIR}..."
rsync -avz --delete "${BUILD_DIR}/" "${PI_HOST}:${STAGE_DIR}/"

echo "Installing into ${TARGET_DIR} on ${PI_HOST}..."
ssh "${PI_HOST}" "sudo rsync -a ${STAGE_DIR}/ ${TARGET_DIR}/ \
  && sudo systemctl restart casaos-gateway \
  && sudo systemctl restart casaos"

echo "Deployed. Hard-refresh the browser to see changes."
