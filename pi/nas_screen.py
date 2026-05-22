#!/usr/bin/env python3
"""
KODE NAS — host-side OLED status daemon (v2).

Pushes two lines to the OLED over USB serial every 2 seconds:

  Line 1 (legacy, unchanged v1 layout — back-compat with the existing
          Arduino sketch that reads exactly 7 pipe-delimited fields):
      hostname|ip|disk_free|cpu_temp|cpu_pct|uptime|app_count

  Line 2 (KODE2, app data — Arduino sketches that haven't been updated
          read this line into a buffer and ignore it):
      KODE2|photos=N|ads=N|playing=Title|devices=N

Any KODE2 field whose data source is unavailable (no API key, API down,
container not running) is omitted from the line so a missing Immich key
doesn't break Pi-hole's number.

Config file (optional): /etc/kode-screen.conf — simple key=value lines:
      pihole_password=changeme
      immich_api_key=abc123
      jellyfin_api_key=xyz789

Missing keys = those fields skipped.
"""
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import psutil
import serial

# Line-buffer stdout/stderr so logs reach journald in real time instead of
# being held in Python's default 8 KiB buffer while running under systemd.
try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except AttributeError:
    pass  # Python < 3.7

# ===== Configuration ========================================================
SERIAL_PORT = "/dev/ttyUSB0"
BAUD_RATE = 9600
NAS_ROOT = "/"
UPDATE_SEC = 2
CONFIG_PATH = "/etc/kode-screen.conf"

# Caches for app-data calls so we don't hammer the APIs every 2s.
CACHE_TTL = {
    "pihole": 15,
    "immich": 30,
    "jellyfin": 5,    # now-playing wants to be more responsive
    "devices": 15,
    "ports": 60,      # docker port mappings rarely change at runtime
}

# Default container names used by the canonical KODE OS install.
CONTAINERS = {
    "pihole": "pihole",
    "immich": "immich-server",
    "jellyfin": "jellyfin",
}

# Internal ports (container-side). Used by `docker port` to discover the
# host-side mapping.
INTERNAL_PORTS = {
    "pihole": 80,
    "immich": 2283,
    "jellyfin": 8096,
}

# ===== Config loader ========================================================
def load_config(path: str = CONFIG_PATH) -> dict:
    cfg = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                cfg[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return cfg

# ===== Cache decorator ======================================================
class _Cache:
    def __init__(self):
        self.store = {}  # key -> (timestamp, value)

    def get(self, key: str, ttl: int):
        entry = self.store.get(key)
        if entry and (time.time() - entry[0]) < ttl:
            return entry[1]
        return None

    def set(self, key: str, value):
        self.store[key] = (time.time(), value)

CACHE = _Cache()

# ===== Legacy v1 gatherers (unchanged) ======================================
def get_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "0.0.0.0"
    finally:
        s.close()

def get_disk_free_gb(path: str = NAS_ROOT) -> int:
    _, _, free = shutil.disk_usage(path)
    return free // (1024 ** 3)

def get_cpu_temp_c() -> int:
    for p in [
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/class/hwmon/hwmon0/temp1_input",
    ]:
        try:
            raw = int(Path(p).read_text().strip())
            return raw // 1000
        except (FileNotFoundError, ValueError):
            continue
    return 0

def get_cpu_percent() -> int:
    return int(psutil.cpu_percent(interval=0.5))

def get_uptime_days() -> int:
    return int((time.time() - psutil.boot_time()) / 86400)

def get_app_count() -> int:
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True, text=True, timeout=2,
        )
        names = [n for n in result.stdout.strip().split("\n") if n]
        return len([n for n in names if not n.startswith("casaos-")])
    except (subprocess.SubprocessError, FileNotFoundError):
        return 0

# ===== KODE2 gatherers =======================================================
def get_devices_online() -> int:
    """Count of LAN neighbors on the wireless interface. Filters out docker
    bridges (172.x.x.x by convention) and STALE entries older than ~10min."""
    cached = CACHE.get("devices", CACHE_TTL["devices"])
    if cached is not None:
        return cached

    count = 0
    seen = set()
    for iface in ("wlan0", "eth0"):
        try:
            result = subprocess.run(
                ["ip", "neigh", "show", "dev", iface],
                capture_output=True, text=True, timeout=2,
            )
            for line in result.stdout.strip().split("\n"):
                if not line:
                    continue
                parts = line.split()
                if not parts:
                    continue
                ip = parts[0]
                if ip.startswith(("172.", "169.254.", "127.")):
                    continue
                # ignore FAILED entries — that's gone-away devices
                if "FAILED" in line:
                    continue
                if ip not in seen:
                    seen.add(ip)
                    count += 1
        except (subprocess.SubprocessError, FileNotFoundError):
            continue

    CACHE.set("devices", count)
    return count

def get_app_host_port(container: str, internal: int):
    """Use `docker port` to discover the host-side mapping for a container's
    internal port. Returns int or None."""
    key = f"port:{container}:{internal}"
    cached = CACHE.get(key, CACHE_TTL["ports"])
    if cached is not None:
        return cached

    try:
        result = subprocess.run(
            ["docker", "port", container, str(internal)],
            capture_output=True, text=True, timeout=2,
        )
        # docker port output like "0.0.0.0:8800" or "0.0.0.0:8800\n:::8800"
        first = (result.stdout.strip().split("\n") or [""])[0]
        if first and ":" in first:
            port = int(first.rsplit(":", 1)[-1])
            CACHE.set(key, port)
            return port
    except (subprocess.SubprocessError, FileNotFoundError, ValueError):
        pass
    return None

def _http_get(url: str, headers: dict = None, timeout: float = 3.0):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, ConnectionError, socket.timeout):
        return None

def _http_post_json(url: str, body: dict, headers: dict = None, timeout: float = 3.0):
    data = json.dumps(body).encode("utf-8")
    merged = {"Content-Type": "application/json"}
    if headers:
        merged.update(headers)
    req = urllib.request.Request(url, data=data, headers=merged, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, ConnectionError, socket.timeout):
        return None

# Pi-hole v6 session state
_PIHOLE_SID = {"sid": None, "csrf": None, "expires": 0}

def _pihole_login(password: str, base_url: str) -> bool:
    """Acquire a Pi-hole v6 session ID; cache for 10 min."""
    now = time.time()
    if _PIHOLE_SID["sid"] and _PIHOLE_SID["expires"] > now + 30:
        return True
    body = _http_post_json(f"{base_url}/api/auth", {"password": password})
    if not body:
        return False
    try:
        data = json.loads(body)
        session = data.get("session") or {}
        sid = session.get("sid")
        if not sid:
            return False
        _PIHOLE_SID["sid"] = sid
        _PIHOLE_SID["csrf"] = session.get("csrf")
        # Pi-hole sessions default to 1800s (30 min); refresh well before.
        _PIHOLE_SID["expires"] = now + 600
        return True
    except (json.JSONDecodeError, AttributeError):
        return False

def get_pihole_ads_today(password: str):
    cached = CACHE.get("pihole", CACHE_TTL["pihole"])
    if cached is not None:
        return cached
    port = get_app_host_port(CONTAINERS["pihole"], INTERNAL_PORTS["pihole"])
    if not port:
        return None
    base = f"http://127.0.0.1:{port}"
    if not _pihole_login(password, base):
        return None
    sid = _PIHOLE_SID["sid"]
    body = _http_get(f"{base}/api/stats/summary", headers={"sid": sid})
    if not body:
        return None
    try:
        data = json.loads(body)
        # v6 returns {"queries": {..., "blocked": N, ...}, ...}
        blocked = data.get("queries", {}).get("blocked")
        if isinstance(blocked, (int, float)):
            CACHE.set("pihole", int(blocked))
            return int(blocked)
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    return None

def get_immich_photo_count(api_key: str):
    cached = CACHE.get("immich", CACHE_TTL["immich"])
    if cached is not None:
        return cached
    port = get_app_host_port(CONTAINERS["immich"], INTERNAL_PORTS["immich"])
    if not port:
        return None
    body = _http_get(
        f"http://127.0.0.1:{port}/api/server-info/statistics",
        headers={"x-api-key": api_key, "Accept": "application/json"},
    )
    if not body:
        return None
    try:
        data = json.loads(body)
        photos = data.get("photos")
        if isinstance(photos, (int, float)):
            CACHE.set("immich", int(photos))
            return int(photos)
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    return None

def get_jellyfin_now_playing(api_key: str):
    cached = CACHE.get("jellyfin", CACHE_TTL["jellyfin"])
    if cached is not None:
        return cached
    port = get_app_host_port(CONTAINERS["jellyfin"], INTERNAL_PORTS["jellyfin"])
    if not port:
        return None
    body = _http_get(
        f"http://127.0.0.1:{port}/Sessions",
        headers={"X-MediaBrowser-Token": api_key, "Accept": "application/json"},
    )
    if not body:
        return None
    try:
        sessions = json.loads(body)
        for s in sessions:
            now = s.get("NowPlayingItem")
            if now and now.get("Name"):
                title = str(now["Name"])
                # The OLED is narrow; cap the title before it scrolls.
                if len(title) > 22:
                    title = title[:21] + "…"
                CACHE.set("jellyfin", title)
                return title
        CACHE.set("jellyfin", "")  # nothing playing right now
        return ""
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    return None

# ===== Line builders ========================================================
def build_legacy_line() -> str:
    return "|".join([
        "n/a",                              # legacy hostname field, ignored
        get_ip(),
        f"{get_disk_free_gb()}GB",
        str(get_cpu_temp_c()),
        str(get_cpu_percent()),
        f"{get_uptime_days()}d",
        str(get_app_count()),
    ]) + "\n"

def _sanitize(value: str) -> str:
    """Make a value safe for the pipe-delimited KODE2 line by stripping
    pipes and newlines from the value."""
    return re.sub(r"[|\r\n]+", " ", str(value))

def build_kode2_line(cfg: dict) -> str:
    parts = ["KODE2"]

    photos = None
    if cfg.get("immich_api_key"):
        photos = get_immich_photo_count(cfg["immich_api_key"])
    if photos is not None:
        parts.append(f"photos={photos}")

    ads = None
    if cfg.get("pihole_password"):
        ads = get_pihole_ads_today(cfg["pihole_password"])
    if ads is not None:
        parts.append(f"ads={ads}")

    playing = None
    if cfg.get("jellyfin_api_key"):
        playing = get_jellyfin_now_playing(cfg["jellyfin_api_key"])
    if playing is not None and playing != "":
        parts.append(f"playing={_sanitize(playing)}")

    devices = get_devices_online()
    parts.append(f"devices={devices}")

    return "|".join(parts) + "\n"

# ===== Main loop ============================================================
def main():
    cfg = load_config()
    print(f"Loaded config from {CONFIG_PATH}: {len(cfg)} keys")

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except serial.SerialException as e:
        print(f"Could not open {SERIAL_PORT}: {e}", file=sys.stderr)
        sys.exit(1)

    time.sleep(2)  # let Arduino finish post-reset boot
    print(f"Connected to {SERIAL_PORT}. Sending updates every {UPDATE_SEC}s.")

    cfg_mtime = 0
    try:
        cfg_mtime = os.stat(CONFIG_PATH).st_mtime
    except OSError:
        pass

    while True:
        # Hot-reload config if the file changed.
        try:
            new_mtime = os.stat(CONFIG_PATH).st_mtime
            if new_mtime != cfg_mtime:
                cfg = load_config()
                cfg_mtime = new_mtime
                print(f"Reloaded config ({len(cfg)} keys)")
        except OSError:
            pass

        legacy = build_legacy_line()
        kode2 = build_kode2_line(cfg)

        try:
            ser.write(legacy.encode("ascii", errors="replace"))
            ser.write(kode2.encode("utf-8", errors="replace"))
            print(legacy.strip())
            print(kode2.strip())
        except serial.SerialException as e:
            print(f"Write failed: {e}", file=sys.stderr)
            time.sleep(2)

        time.sleep(UPDATE_SEC)

if __name__ == "__main__":
    main()
