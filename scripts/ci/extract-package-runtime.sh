#!/usr/bin/env bash
set -euo pipefail

bundle_root="$1"
runner_os="$2"
output_root="$3"

if [[ ! -d "$bundle_root" ]]; then
  echo "Bundle root not found: $bundle_root" >&2
  exit 1
fi

rm -rf "$output_root"
mkdir -p "$output_root"

case "$runner_os" in
  Linux)
    deb_path="$(find "$bundle_root" -type f -name "*.deb" -print -quit)"
    [[ -n "$deb_path" ]] || { echo "No .deb package found under $bundle_root" >&2; exit 1; }
    echo "Extracting .deb package: $deb_path" >&2
    dpkg-deb -x "$deb_path" "$output_root"
    printf '%s\n' "$output_root"
    ;;
  macOS)
    app_path="$(find "$bundle_root" -type d -name "*.app" -print -quit)"
    [[ -n "$app_path" ]] || { echo "No .app bundle found under $bundle_root" >&2; exit 1; }
    echo "Using macOS app bundle: $app_path" >&2
    printf '%s\n' "$app_path"
    ;;
  *)
    echo "Unsupported runner OS for package extraction: $runner_os" >&2
    exit 1
    ;;
esac