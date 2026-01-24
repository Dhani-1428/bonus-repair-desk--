# Fix and Start Mobile App Script
# Run this script to fix common issues and start the app

Write-Host "=== PanelPro Mobile App - Fix & Start ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Please run this script from the mobile-app directory." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "  Dependencies found ✓" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Checking API configuration..." -ForegroundColor Yellow
$apiFile = "src/services/api.ts"
if (Test-Path $apiFile) {
    $apiContent = Get-Content $apiFile -Raw
    if ($apiContent -match "localhost:3000") {
        Write-Host "  WARNING: API is set to localhost. For physical devices, update to your computer's IP!" -ForegroundColor Yellow
        Write-Host "  Edit: $apiFile" -ForegroundColor Yellow
        Write-Host "  Find your IP: ipconfig | findstr IPv4" -ForegroundColor Yellow
    } else {
        Write-Host "  API configuration found ✓" -ForegroundColor Green
    }
} else {
    Write-Host "  ERROR: API file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "App.tsx",
    "src/context/AuthContext.tsx",
    "src/context/ThemeContext.tsx",
    "src/screens/auth/LoginScreen.tsx"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "ERROR: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Getting your local IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
if ($ipAddress) {
    Write-Host "  Your local IP: $ipAddress" -ForegroundColor Cyan
    Write-Host "  Update API URL to: http://$ipAddress:3000/api" -ForegroundColor Cyan
} else {
    Write-Host "  Could not detect IP address" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Starting Expo development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. A QR code will appear in the terminal" -ForegroundColor White
Write-Host "2. Install 'Expo Go' app on your phone" -ForegroundColor White
Write-Host "3. Scan the QR code with:" -ForegroundColor White
Write-Host "   - iOS: Camera app" -ForegroundColor White
Write-Host "   - Android: Expo Go app" -ForegroundColor White
Write-Host "4. Make sure your phone and computer are on the same WiFi" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Expo
npm start
