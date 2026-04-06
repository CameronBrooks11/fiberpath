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

Write-Host "Inspecting bundle root: $BundleRoot"
Get-ChildItem -Path $BundleRoot -Recurse -File | Select-Object -First 20 | ForEach-Object {
    Write-Host " - $($_.FullName)"
}

switch ($RunnerOs) {
    "Windows" {
        $msi = @(Get-ChildItem -Path $BundleRoot -Recurse -Filter *.msi -File -ErrorAction SilentlyContinue)
        $exe = @(Get-ChildItem -Path $BundleRoot -Recurse -Filter *.exe -File -ErrorAction SilentlyContinue)
        if ($msi.Count -eq 0) {
            throw "No Windows .msi installer found under $BundleRoot"
        }
        Write-Host "Found Windows installers: msi=$($msi.Count), exe=$($exe.Count)"
    }
    "Linux" {
        $deb = @(Get-ChildItem -Path $BundleRoot -Recurse -Filter *.deb -File -ErrorAction SilentlyContinue)
        $appImage = @(Get-ChildItem -Path $BundleRoot -Recurse -Filter *.AppImage -File -ErrorAction SilentlyContinue)
        if ($deb.Count -eq 0) {
            throw "No Linux .deb installer found under $BundleRoot"
        }
        if ($appImage.Count -eq 0) {
            throw "No Linux .AppImage found under $BundleRoot"
        }
        Write-Host "Found Linux artifacts: deb=$($deb.Count), appimage=$($appImage.Count)"
    }
    "macOS" {
        $dmg = @(Get-ChildItem -Path $BundleRoot -Recurse -Filter *.dmg -File -ErrorAction SilentlyContinue)
        $app = @(Get-ChildItem -Path $BundleRoot -Recurse -Directory -Filter *.app -ErrorAction SilentlyContinue)
        if ($dmg.Count -eq 0) {
            throw "No macOS .dmg installer found under $BundleRoot"
        }
        if ($app.Count -eq 0) {
            throw "No macOS .app bundle found under $BundleRoot"
        }
        Write-Host "Found macOS artifacts: dmg=$($dmg.Count), app=$($app.Count)"
    }
    default {
        throw "Unsupported runner OS: $RunnerOs"
    }
}

Write-Host "Artifact presence check passed for $RunnerOs"
