# Fix for Expo Windows issue and start server
Write-Host "Starting Expo with workaround..." -ForegroundColor Cyan

cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)\mobile-app"

# Clear cache
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Create necessary directories
New-Item -ItemType Directory -Path ".expo" -Force | Out-Null
New-Item -ItemType Directory -Path ".expo\metro" -Force | Out-Null
New-Item -ItemType Directory -Path ".expo\metro\externals" -Force | Out-Null

# Try starting with tunnel mode (bypasses local file issues)
Write-Host "Starting Expo server..." -ForegroundColor Yellow
Write-Host "This may take a moment..." -ForegroundColor Yellow
Write-Host ""

npx expo start --tunnel --clear
