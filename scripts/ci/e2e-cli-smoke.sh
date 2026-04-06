#!/usr/bin/env bash
set -euo pipefail

cli_path="$1"
wind_path="$2"
output_path="$3"

[[ -f "$cli_path" ]] || { echo "CLI binary not found: $cli_path"; exit 1; }
[[ -f "$wind_path" ]] || { echo "Input .wind file not found: $wind_path"; exit 1; }

echo "Running CLI smoke checks with: $cli_path"
"$cli_path" --version

validate_output=$("$cli_path" validate "$wind_path" --json)
echo "validate --json => $validate_output"

mkdir -p "$(dirname "$output_path")"
plan_output=$("$cli_path" plan "$wind_path" --json --output "$output_path")
echo "plan --json => $plan_output"

[[ -f "$output_path" ]] || { echo "Expected planned G-code output was not generated: $output_path"; exit 1; }
[[ -s "$output_path" ]] || { echo "Generated G-code is empty: $output_path"; exit 1; }

echo "CLI smoke checks passed, generated: $output_path"
