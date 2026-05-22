# CHANGES

This file tracks divergences from upstream IceWhaleTech/CasaOS-UI, kept
per Apache 2.0 best practice (§4.1 of the project brief).

## [Unreleased]

### Fixed
- Removed `@icewhale/icewhale-files-openapi` from `package.json`. The package
  was unpublished from npm and blocked `pnpm install`. It had no imports in
  `src/`, so removal is a no-op for runtime behavior.

### Added
- `LICENSE-CASAOS` — Apache 2.0 text from the parent CasaOS repo (upstream
  CasaOS-UI ships no LICENSE file of its own).
- `NOTICE.md` — attribution required by Apache 2.0.
- `CHANGES.md` — this file.
- KODE OS section in `README.md` above the upstream content.
- `scripts/deploy-to-pi.sh` — builds the UI and rsyncs it into
  `/var/lib/casaos/www/` on the pebble, then restarts `casaos-gateway` and
  `casaos`. Host overridable via `PI_HOST` env var.
- `scripts/setup-pi-sudoers.sh` — one-time bootstrap that installs a narrow
  `/etc/sudoers.d/kode-os-deploy` entry on the pebble so the deploy user can
  run the specific `rsync` and `systemctl restart` commands needed by
  `deploy-to-pi.sh` and `deploy-screen-to-pi.sh` without a password prompt.
  Re-runnable; uses `visudo -c` to validate syntax before installing.
- `pi/nas_screen.py` — v2 of the OLED status daemon. Emits the legacy
  7-field line plus a new `KODE2|key=value|...` line every 2 s with
  `devices`, `photos`, `ads`, `playing` fields drawn from `ip neigh show`,
  Immich, Pi-hole v6, and Jellyfin respectively. Container port mappings
  resolved at runtime via `docker port` (no auth needed). API credentials
  read from `/etc/kode-screen.conf` (hot-reloaded on mtime change); missing
  keys cause the corresponding field to be omitted.
- `pi/kode-screen.conf.example` — template config with comments pointing at
  where to generate each app's credentials.
- `scripts/deploy-screen-to-pi.sh` — scp + systemctl restart helper to push
  daemon updates to the pebble.
- `src/service/kodeApps.js` — `resolveAppUrl(appKey, host)` helper that
  queries the CasaOS app-management API at runtime to discover the host
  port + URL for an app, instead of hardcoding ports. All five first-boot
  walkthroughs and the Add-device wizard's PhoneStep / TVStep call this
  on mount, falling back to a hardcoded URL if the API is unreachable.

### Changed
- All user-visible CasaOS strings rebranded to KODE OS across 31 i18n files,
  `public/index.html`, and `public/site.webmanifest`. i18n keys are kept
  intact so existing `$t()` call sites continue to work.
- Logo and favicon assets replaced with KODE NAS brand assets. Upstream
  filenames preserved (`casa-dark.svg`, `casa-white.svg`, `logo.svg`, etc.)
  so no Vue component changes are required.

### Known issues / TODOs
- `public/img/icon/android-chrome-192x192.png` and `android-chrome-512x512.png`
  are placeholders — currently copies of the 180px apple-touch-icon. Need a
  proper 192px and 512px export of the brand mark for crisp PWA install icons.
- `src/assets/img/logo/logo.svg` uses `fill="currentColor"`. When rendered
  via `<img>` this falls back to black; revisit if the brand bar needs an
  explicit color.
- Blog news feed URL in i18n strings still points to `blog.casaos.io`.
  Replace with KODE blog URL once available.
- No dedicated About view exists in upstream CasaOS-UI, so the Apache 2.0
  attribution lives in `BrandBar.vue` (always-visible footer). A proper
  About modal with version, license, and acknowledgements should be built
  in Phase 2 as part of the settings redesign.
