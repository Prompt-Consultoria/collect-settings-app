# collect-settings-app

Static site (GitHub Pages) that builds ODK Collect / KoboCollect configuration QR codes in
the browser. No bundler, no framework. Files that matter:

- `web/index.html` — the form (English strings with `data-i18n` keys) and the result panel.
- `web/app.js` — ES module: i18n (PT dictionary), locks table, presets, collect → settings
  object → `render()` from the wasm engine, print cards, decode.
- `web/input.css` → `web/styles.css` — Tailwind 4 with the SEAT design tokens (same as the
  Prompt panels). Recompile with `npm run css` whenever `input.css`, `index.html` or
  `app.js` classes change; the compiled file is committed.
- `build.sh` — vendors `collect-settings@VERSION` from npm into `web/pkg/` (git-ignored).

## Engine coupling

The engine is the npm package `collect-settings` (wasm build of
`~/Github/collect-settings`, `bindings/js`). Contract used here: `init()`, `render(settings,
quietZone) → { payload, svg, modules, json, json_bytes, warnings }`, `decode(payload)`,
`version()`. Settings objects use the crate's key names (`general`, `admin`, `project`).

- A feature that needs the engine means: change the crate, release it (tag `vX.Y.Z` in that
  repo publishes crates.io + npm via the `release` environment), then bump `VERSION` here.
- Warnings come from the crate in English; `PT.warn` in `app.js` maps them by regex. A new
  warning in the crate needs a line there or it shows untranslated (never hidden).

## Private sibling

`~/Github/kobo-tools/apps/kobo-qrcode` is the Prompt-hosted variant with a Rust backend
(lists KoboToolbox forms with an API key, tests the interviewer account against `formList`).
This public app deliberately has neither: there is no backend and the Kobo APIs do not send
CORS headers. Keep the two UIs aligned when changing presets or lock labels.

## Testing by hand

`cp -R ~/Github/collect-settings/bindings/js/pkg web/pkg && python3 -m http.server -d web 8080`.
Chrome's headless `--window-size` cannot go below ~500 px wide; test the phone layout in an
iframe or with the Claude in Chrome tools. `window.print()` opens a dialog — do not trigger it
from automation; inspect `#impressao` after filling it instead.
