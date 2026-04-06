#!/usr/bin/env bash
set -euo pipefail

bundle_root="$1"
runner_os="$2"

if [[ ! -d "$bundle_root" ]]; then
  echo "Bundle root not found: $bundle_root"
  exit 1
fi

echo "Inspecting bundle root: $bundle_root"
find "$bundle_root" -type f | head -20

case "$runner_os" in
  Linux)
    deb_count=$(find "$bundle_root" -type f -name "*.deb" | wc -l | tr -d ' ')
    appimage_count=$(find "$bundle_root" -type f -name "*.AppImage" | wc -l | tr -d ' ')
    [[ "$deb_count" -gt 0 ]] || { echo "No Linux .deb installer found"; exit 1; }
    [[ "$appimage_count" -gt 0 ]] || { echo "No Linux .AppImage found"; exit 1; }
    echo "Found Linux artifacts: deb=$deb_count appimage=$appimage_count"
    ;;
  macOS)
    dmg_count=$(find "$bundle_root" -type f -name "*.dmg" | wc -l | tr -d ' ')
    [[ "$dmg_count" -gt 0 ]] || { echo "No macOS .dmg installer found"; exit 1; }
    echo "Found macOS artifacts: dmg=$dmg_count"
    ;;
  *)
    echo "Unsupported runner OS for shell checker: $runner_os"
    exit 1
    ;;
esac

echo "Artifact presence check passed for $runner_os"
