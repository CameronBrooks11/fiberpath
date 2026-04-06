param(
    [Parameter(Mandatory = $true)]
    [string]$BundleRoot,
    [Parameter(Mandatory = $true)]
    [string]$RunnerOs
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
    Write-Warning "No bundled CLI path discovered in packaged output for $RunnerOs"
    return
}

$resolved = $candidates | Select-Object -First 1
Write-Host "Resolved bundled CLI path: $($resolved.FullName)"
Write-Output $resolved.FullName