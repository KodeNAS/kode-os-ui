#!/usr/bin/env bash
# Deploy the OLED screen daemon to a pebble.
#
# Usage:
#   ./scripts/deploy-screen-to-pi.sh                 # kode@pebble.local
#   PI_HOST=kode@10.0.0.42 ./scripts/deploy-screen-to-pi.sh
#
# Copies pi/nas_screen.py to ~/nas_screen.py on the Pi and restarts
# pebble-screen.service. Leaves /etc/kode-screen.conf alone; the daemon
# hot-reloads that file at runtime when its mtime changes.

set -euo pipefail

PI_HOST="${PI_HOST:-kode@pebble.local}"
LOCAL_DAEMON="pi/nas_screen.py"
REMOTE_DAEMON="/home/kode/nas_screen.py"

cd "$(dirname "$0")/.."

if [[ ! -f "${LOCAL_DAEMON}" ]]; then
  echo "Daemon not found at ${LOCAL_DAEMON}" >&2
  exit 1
fi

echo "Uploading ${LOCAL_DAEMON} to ${PI_HOST}:${REMOTE_DAEMON}..."
scp -q "${LOCAL_DAEMON}" "${PI_HOST}:${REMOTE_DAEMON}"

echo "Restarting pebble-screen.service on ${PI_HOST}..."
ssh "${PI_HOST}" "sudo systemctl restart pebble-screen.service && sudo systemctl is-active pebble-screen.service"

echo "Tailing the daemon journal..."
ssh "${PI_HOST}" "journalctl -u pebble-screen.service -n 12 --no-pager"
