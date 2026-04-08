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
            $_.FullName -match '[\\/]_up_[\\/]bundled-cli[\\/]fiberpath\.exe$' -or
            $_.FullName -match '[\\/]bundled-cli[\\/]fiberpath\.exe$'
        }
} else {
    Get-ChildItem -Path $BundleRoot -Recurse -File -Filter fiberpath -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -match '[\\/]bundled-cli[\\/]fiberpath$'
        }
}

if (-not $candidates) {
    if ($RunnerOs -eq "Windows" -and $ReferenceCliPath -and (Test-Path -LiteralPath $ReferenceCliPath)) {
        $referenceHash = (Get-FileHash -LiteralPath $ReferenceCliPath -Algorithm SHA256).Hash
        Write-Host "No structured bundled CLI path found; probing Windows MSI stream files using reference hash $referenceHash"

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
    }

    Write-Warning "No bundled CLI path discovered in packaged output for $RunnerOs"
    return
}

$resolved = $candidates | Select-Object -First 1
Write-Host "Resolved bundled CLI path: $($resolved.FullName)"
Write-Output $resolved.FullName
