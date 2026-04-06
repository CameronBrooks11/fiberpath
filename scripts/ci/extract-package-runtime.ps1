param(
    [Parameter(Mandatory = $true)]
    [string]$BundleRoot,
    [Parameter(Mandatory = $true)]
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BundleRoot)) {
    throw "Bundle root not found: $BundleRoot"
}

$msi = Get-ChildItem -Path $BundleRoot -Recurse -File -Filter *.msi -ErrorAction SilentlyContinue |
    Select-Object -First 1

if (-not $msi) {
    throw "No MSI package found under $BundleRoot"
}

if (Test-Path -LiteralPath $OutputRoot) {
    Remove-Item -LiteralPath $OutputRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $OutputRoot | Out-Null

Write-Host "Extracting MSI package: $($msi.FullName)"
$process = Start-Process -FilePath "msiexec.exe" -ArgumentList @(
    "/a",
    $msi.FullName,
    "/qn",
    "TARGETDIR=$OutputRoot"
) -Wait -PassThru -NoNewWindow

if ($process.ExitCode -ne 0) {
    throw "MSI extraction failed with exit code $($process.ExitCode)"
}

Write-Host "Extracted package payload to: $OutputRoot"
Write-Output $OutputRoot