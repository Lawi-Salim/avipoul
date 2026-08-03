# Build local de l'installateur AVIPOUL (Tauri) puis renommage du setup
# Usage : powershell -ExecutionPolicy Bypass -File build-installer.ps1
$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\frontend"

Write-Host "=== Build frontend + Tauri (v1.1.0) ===" -ForegroundColor Cyan
npm run tauri:build

$dir = "$PSScriptRoot\frontend\src-tauri\target\release\bundle\nsis"
if (-not (Test-Path $dir)) {
    Write-Error "Dossier NSIS introuvable : $dir"
}

$version = (Get-Content "$PSScriptRoot\frontend\src-tauri\tauri.conf.json" | ConvertFrom-Json).version

Write-Host "=== Renommage du setup ===" -ForegroundColor Cyan
$renamed = $false
Get-ChildItem $dir -Filter "*_x64-setup.exe" |
    Where-Object { $_.Name -like "AVIPOUL_${version}_*" } |
    ForEach-Object {
        $new = $_.Name -replace '^AVIPOUL_', 'Avipoul_'
        $dest = Join-Path $dir $new
        if (Test-Path -LiteralPath $dest) {
            Remove-Item -LiteralPath $dest -Force
        }
        Rename-Item $_.FullName $new -Force
        Write-Host "  $($_.Name)  ->  $new" -ForegroundColor Green
        $renamed = $true
    }
if (-not $renamed) {
    Write-Host "Aucun setup 'AVIPOUL_${version}_*_x64-setup.exe' trouvé (déjà au bon nom ?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Résultat ===" -ForegroundColor Cyan
Get-ChildItem "$PSScriptRoot\frontend\src-tauri\target\release\bundle" -Recurse -Filter "*.exe" | ForEach-Object { Write-Host "  $($_.FullName)" }
