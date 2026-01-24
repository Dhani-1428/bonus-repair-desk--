# Start Expo with QR code (using tunnel to bypass Windows path issue)
Write-Host "=== Starting Expo with QR Code ===" -ForegroundColor Cyan
Write-Host ""

cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)\mobile-app"

# Clear problematic cache
if (Test-Path ".expo\metro\externals") {
    Remove-Item ".expo\metro\externals" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting Expo in tunnel mode..." -ForegroundColor Yellow
Write-Host "This will generate a QR code you can scan!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Tunnel mode may take 30-60 seconds to start" -ForegroundColor Cyan
Write-Host ""

# Use tunnel mode which bypasses local file system issues
npx expo start --tunnel --clear
