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
