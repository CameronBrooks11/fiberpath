param(
    [Parameter(Mandatory = $true)]
    [string]$CliPath,
    [Parameter(Mandatory = $true)]
    [string]$WindPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $CliPath)) {
    throw "CLI binary not found: $CliPath"
}

if (-not (Test-Path -LiteralPath $WindPath)) {
    throw "Input .wind file not found: $WindPath"
}

Write-Host "Running CLI smoke checks with: $CliPath"
& $CliPath --version

$validateOutput = & $CliPath validate $WindPath --json
Write-Host "validate --json => $validateOutput"

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$planOutput = & $CliPath plan $WindPath --json --output $OutputPath
Write-Host "plan --json => $planOutput"

if (-not (Test-Path -LiteralPath $OutputPath)) {
    throw "Expected planned G-code output was not generated: $OutputPath"
}

$size = (Get-Item -LiteralPath $OutputPath).Length
if ($size -le 0) {
    throw "Generated G-code is empty: $OutputPath"
}

Write-Host "CLI smoke checks passed, generated: $OutputPath ($size bytes)"
