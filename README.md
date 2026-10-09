# Collect QR

[![ci](https://github.com/Prompt-Consultoria/collect-settings-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Prompt-Consultoria/collect-settings-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![engine: npm collect-settings](https://img.shields.io/npm/v/collect-settings?label=engine%20(npm%20collect-settings))](https://www.npmjs.com/package/collect-settings)

A browser app that builds the **configuration QR code for ODK Collect and
KoboCollect** in one go: server, interviewer account, project name and colour,
automatic sending and form updates, and the admin locks that turn a tablet
into a "open the app, pick the form, fill it in" device.

**Live app:** <https://prompt-consultoria.github.io/collect-settings-app/>
(English / Português)

## Everything runs in your browser

The QR code is produced by [`collect-settings`](https://github.com/Prompt-Consultoria/collect-settings),
a Rust library compiled to **WebAssembly**. Passwords and the admin password
are only used to assemble the code, on your device: **nothing is uploaded to
any server.** The app is a static site.

## What it does

1. **Server** — KoboToolbox (global or EU) or any OpenRosa server by URL. For
   KoboToolbox the device must point at the KoboCAT host (`kc.…`), and the app
   warns if you paste the web interface (`kf.`/`eu.`) instead.
2. **Account** — one interviewer account, or several (one QR code per
   tablet, pasted from a spreadsheet).
3. **Project** — name, letter and colour shown at the top of the app.
4. **Admin password** — protects the settings menu; generate one in a click.
5. **Behaviour** — presets for the field device (auto send, mirror the server
   every 15 minutes, everything locked except sending) plus every one of the
   39 admin switches if you want to adjust them.
6. **Output** — scalable SVG, PNG, a printable confidential card per account,
   the raw QR text, and the settings JSON. Paste the text of an existing QR
   code to load and edit it.

The format is the one documented by ODK
([collect-import-export](https://docs.getodk.org/collect-import-export/)):
JSON with `general`, `admin` and `project` sections, zlib-compressed and
base64-encoded. Keys left out reset to the app defaults when scanned.

## Build & run locally

No Rust toolchain needed — the engine is the published
[`collect-settings` npm package](https://www.npmjs.com/package/collect-settings),
vendored into `web/pkg/` at build time and self-hosted with the site:

```bash
./build.sh                          # fetches collect-settings@<version> from npm into web/pkg
python3 -m http.server -d web 8080  # then open http://localhost:8080
```

To upgrade the engine, bump `VERSION` in `build.sh`. The stylesheet is
Tailwind 4 compiled once into `web/styles.css` (`npm install && npm run css`
only when editing `web/input.css`). To test an unreleased engine build, run
`bindings/js/build.sh` in the `collect-settings` repo and copy its `pkg/` over
`web/pkg/`.

## License

MIT.
