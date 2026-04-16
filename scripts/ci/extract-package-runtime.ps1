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

    # Pass 2: WiX MSIs embed file data inside a Cabinet (.cab) stream; 7-zip may extract the
    # Cabinet itself as a single binary rather than decompressing its contents.  If any .cab
    # files appear in the extracted output, extract them in-place so that the individual
    # binaries (including the bundled CLI) are directly accessible for discovery and hashing.
    $cabFiles = Get-ChildItem -Path $resolvedOutputRoot -Recurse -Filter "*.cab" -ErrorAction SilentlyContinue
    if ($cabFiles) {
        Write-Host "Found $($cabFiles.Count) embedded Cabinet file(s); running pass-2 extraction."
        foreach ($cab in $cabFiles) {
            $cabDir = $cab.DirectoryName
            Write-Host "  Extracting Cabinet: $($cab.FullName)"
            & $sevenZipExe x "$($cab.FullName)" "-o$cabDir" -y | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Cabinet extraction returned exit code $LASTEXITCODE for $($cab.FullName); continuing."
            }
            # Remove the raw Cabinet stream so it doesn't interfere with filename/hash searches.
            Remove-Item -LiteralPath $cab.FullName -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "Extracted files (first 40):"
    Get-ChildItem -Path $resolvedOutputRoot -Recurse -File -ErrorAction SilentlyContinue |
        Select-Object -First 40 | ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }
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
