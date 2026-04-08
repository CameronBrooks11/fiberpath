#!/usr/bin/env bash
set -euo pipefail

bundle_root="$1"
runner_os="$2"

if [[ ! -d "$bundle_root" ]]; then
  echo "Bundle root not found: $bundle_root" >&2
  exit 1
fi

echo "Searching for bundled CLI under: $bundle_root" >&2

case "$runner_os" in
  Linux|macOS)
    resolved="$(find "$bundle_root" -type f -path "*/bundled-cli/fiberpath" -print -quit)"
    ;;
  *)
    echo "Unsupported runner OS for bundled CLI discovery: $runner_os" >&2
    exit 1
    ;;
esac

if [[ -z "$resolved" ]]; then
  echo "No bundled CLI path discovered in packaged output for $runner_os" >&2
  exit 0
fi

echo "Resolved bundled CLI path: $resolved" >&2
printf '%s\n' "$resolved"
