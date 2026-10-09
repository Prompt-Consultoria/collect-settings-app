#!/usr/bin/env bash
# Fetch the published collect-settings npm package (the WASM build of the Rust
# crate) into web/pkg/. The app is a pure static site: no Rust toolchain, no
# bundler. Bump VERSION to upgrade the engine. npm verifies the tarball
# integrity against the registry checksum.
set -euo pipefail
cd "$(dirname "$0")"

VERSION="0.1.1"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
(cd "$tmp" && npm pack "collect-settings@${VERSION}" --silent >/dev/null)
rm -rf web/pkg && mkdir -p web/pkg
tar xzf "$tmp/collect-settings-${VERSION}.tgz" -C web/pkg --strip-components=1

echo "web/pkg <- collect-settings@${VERSION} (npm)."
echo "Serve with: python3 -m http.server -d web 8080"
