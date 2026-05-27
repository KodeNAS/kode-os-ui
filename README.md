# KODE OS UI

The web interface for **pebble v1**, a small home NAS appliance from KODE NAS.

KODE OS is a derivative work of [CasaOS](https://github.com/IceWhaleTech/CasaOS)
by IceWhale Technology Co., Ltd., licensed under
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0). See
[`LICENSE-CASAOS`](./LICENSE-CASAOS), [`NOTICE.md`](./NOTICE.md), and
[`CHANGES.md`](./CHANGES.md) for license and modification details.

---

## What this repo is

This is the Vue 2 dashboard the buyer signs into after the wizard. It ships
*inside* the [KODE OS image](https://github.com/KodeNAS/kode-os) — the image
build clones this repo, runs `pnpm build`, and overlays the production
artifacts onto `/var/lib/casaos/www/`.

This repo is separate from `kode-os` so the UI can be iterated without
re-flashing the OS. For ad-hoc UI fixes on a running pebble:
`sudo kode-os update` on the pebble pulls + rebuilds everything in place.

If you're a buyer looking for "how do I install KODE OS" — you're in the
wrong repo. Head to [`KodeNAS/kode-os`](https://github.com/KodeNAS/kode-os)
and download the latest image.

---

## Local development

Prerequisites:
- Node 18 (see [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#usage))
- pnpm 9+ (see [pnpm installation](https://pnpm.io/installation))
- A running pebble somewhere reachable on your network — the dev server
  proxies API calls to it.

### Environment variables

Point the dev UI at your pebble:

1. Copy `.env.dev` to `.env.dev.local` (gitignored).
2. Set `VUE_APP_DEV_IP` to the IP address of your local pebble.

### Run the dev server

```bash
pnpm install
pnpm dev
```

Vite will start on `http://localhost:8080` and proxy `/v1/...` / `/v2/...`
API calls to `VUE_APP_DEV_IP`. Sign in with the admin account you created
in your pebble's wizard.

---

## Building for the pebble

```bash
pnpm install
pnpm build
```

Production artifacts land in `build/sysroot/var/lib/casaos/www/`. The
KODE OS image build (in the `kode-os` repo, `image-build/build.sh`) does
this natively on the host, then rsyncs the artifacts into the pi-gen
stage — running the Vue build inside the chroot under qemu-user emulation
takes ~30 min, native is ~80s.

You can also `pnpm build` then push the artifact to a running pebble via
`scripts/deploy-to-pi.sh` (uses `PI_HOST=kode@pebble.local` by default).

---

## Testing

```bash
pnpm test
```

---

## Contributing

Issues, bug reports, and pull requests welcome. See the
[`kode-os` CONTRIBUTING guide](https://github.com/KodeNAS/kode-os/blob/main/CONTRIBUTING.md)
— same contribution rules apply across the project.

Some changes belong upstream in
[CasaOS-UI](https://github.com/IceWhaleTech/CasaOS-UI) rather than here —
we try to keep the diff against upstream small on purpose. If you're
fixing a CasaOS bug rather than a KODE-specific feature, send the PR
upstream first.
