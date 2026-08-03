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

Write-Host "=== Renommage du setup ===" -ForegroundColor Cyan
$renamed = $false
Get-ChildItem $dir -Filter "*_x64-setup.exe" | ForEach-Object {
    $new = $_.Name -replace '^AVIPOUL_', 'Avipoul_'
    if ($new -ne $_.Name) {
        Rename-Item $_.FullName $new -Force
        Write-Host "  $($_.Name)  ->  $new" -ForegroundColor Green
        $renamed = $true
    }
}
if (-not $renamed) {
    Write-Host "Aucun setup '_x64-setup.exe' renommé (déjà au bon nom ?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Résultat ===" -ForegroundColor Cyan
Get-ChildItem "$PSScriptRoot\frontend\src-tauri\target\release\bundle" -Recurse -Filter "*.exe" | ForEach-Object { Write-Host "  $($_.FullName)" }
