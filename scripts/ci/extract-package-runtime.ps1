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
$resolvedOutputRoot = (Resolve-Path -LiteralPath $OutputRoot).Path

Write-Host "Extracting MSI package: $($msi.FullName)"

# Prefer 7-zip for reliable, non-interactive extraction in CI.
# msiexec /a (admin-install) can hang indefinitely in headless environments.
$sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
if ($null -eq $sevenZip) {
    $sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $sevenZipPath) { $sevenZip = $sevenZipPath }
}

if ($sevenZip) {
    $sevenZipExe = if ($sevenZip -is [string]) { $sevenZip } else { $sevenZip.Source }
    Write-Host "Using 7-zip for MSI extraction: $sevenZipExe"
    & $sevenZipExe x "$($msi.FullName)" "-o$resolvedOutputRoot" -y | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "7-zip MSI extraction failed with exit code $LASTEXITCODE"
    }
} else {
    Write-Host "7-zip not found; falling back to msiexec admin-install"
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList @(
        "/a",
        $msi.FullName,
        "TARGETDIR=$resolvedOutputRoot",
        "/quiet",
        "/norestart"
    ) -Wait -PassThru -WindowStyle Hidden

    if ($process.ExitCode -ne 0) {
        throw "MSI extraction failed with exit code $($process.ExitCode)"
    }
}

Write-Host "Extracted package payload to: $resolvedOutputRoot"
Write-Output $resolvedOutputRoot