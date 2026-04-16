param(
    [Parameter(Mandatory = $true)]
    [string]$BundleRoot,
    [Parameter(Mandatory = $true)]
    [string]$RunnerOs,
    [string]$ReferenceCliPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BundleRoot)) {
    throw "Bundle root not found: $BundleRoot"
}

Write-Host "Searching for bundled CLI under: $BundleRoot"

$candidates = if ($RunnerOs -eq "Windows") {
    Get-ChildItem -Path $BundleRoot -Recurse -File -Filter fiberpath.exe -ErrorAction SilentlyContinue |
        Where-Object {
            # Tauri v2 WiX: resources are stored at <install>\resources\_up_\bundled-cli\
            $_.FullName -match '[\\/]_up_[\\/]bundled-cli[\\/]fiberpath\.exe$' -or
            # Direct bundled-cli path (NSIS or dev layout)
            $_.FullName -match '[\\/]bundled-cli[\\/]fiberpath\.exe$' -or
            # Tauri v2 WiX with explicit resources/ subdirectory prefix
            $_.FullName -match '[\\/]resources[\\/]_up_[\\/]bundled-cli[\\/]fiberpath\.exe$' -or
            $_.FullName -match '[\\/]resources[\\/]bundled-cli[\\/]fiberpath\.exe$'
        }
} else {
    Get-ChildItem -Path $BundleRoot -Recurse -File -Filter fiberpath -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -match '[\\/]bundled-cli[\\/]fiberpath$'
        }
}

if (-not $candidates) {
    if ($RunnerOs -eq "Windows") {
        # Log all extracted files to aid diagnostics if bundled CLI cannot be found.
        Write-Host "Path-based search found no match. Extracted file inventory (all files):"
        Get-ChildItem -Path $BundleRoot -Recurse -File -ErrorAction SilentlyContinue |
            ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }
    }

    if ($RunnerOs -eq "Windows" -and $ReferenceCliPath -and (Test-Path -LiteralPath $ReferenceCliPath)) {
        $referenceHash = (Get-FileHash -LiteralPath $ReferenceCliPath -Algorithm SHA256).Hash
        Write-Host "Probing all extracted files using reference hash $referenceHash (reference size: $((Get-Item $ReferenceCliPath).Length) bytes)"

        $hashMatchedCandidates = Get-ChildItem -Path $BundleRoot -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Length -gt 1MB -and
                (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash -eq $referenceHash
            }

        if ($hashMatchedCandidates) {
            $resolved = $hashMatchedCandidates | Select-Object -First 1
            $materializedDir = Join-Path $BundleRoot ".resolved-bundled-cli"
            $materializedPath = Join-Path $materializedDir "fiberpath.exe"
            New-Item -ItemType Directory -Force -Path $materializedDir | Out-Null
            Copy-Item -LiteralPath $resolved.FullName -Destination $materializedPath -Force
            Write-Host "Resolved bundled CLI path by hash match: $($resolved.FullName)"
            Write-Host "Materialized hash-matched Windows CLI to executable path: $materializedPath"
            Write-Output $materializedPath
            return
        }

        Write-Warning "Hash probe found no match. Large files (>1 MB) in extracted tree:"
        Get-ChildItem -Path $BundleRoot -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Length -gt 1MB } |
            ForEach-Object {
                $h = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
                Write-Warning "  $($_.FullName) ($($_.Length) bytes) SHA256=$h"
            }
    }

    Write-Warning "No bundled CLI path discovered in packaged output for $RunnerOs"
    return
}

$resolved = $candidates | Select-Object -First 1
Write-Host "Resolved bundled CLI path: $($resolved.FullName)"
Write-Output $resolved.FullName
