# Simple script to start Expo and show QR code
Write-Host "=== Starting Expo Server ===" -ForegroundColor Cyan
Write-Host ""

cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)\mobile-app"

# Kill any existing node processes on port 8081
$port = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($port) {
    $pid = $port.OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped existing process on port 8081" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

# Clear cache
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleared .expo cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Expo server..." -ForegroundColor Yellow
Write-Host "You should see a QR code in a few seconds!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start Expo
npx expo start --clear
