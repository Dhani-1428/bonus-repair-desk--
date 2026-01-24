# Build APK Script - Interactive
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  BUILDING ANDROID APK" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Green

cd $PSScriptRoot

# Check if logged in
Write-Host "Checking Expo login status..." -ForegroundColor Cyan
$loginCheck = eas whoami 2>&1

if ($LASTEXITCODE -ne 0 -or $loginCheck -match "Not logged in") {
    Write-Host "`n⚠️  You need to login to Expo first!" -ForegroundColor Yellow
    Write-Host "`nThis will open a browser for you to login." -ForegroundColor White
    Write-Host "OR you can create a free account at: https://expo.dev/signup`n" -ForegroundColor Gray
    
    $response = Read-Host "Press ENTER to login now (or type 'skip' to do it manually)"
    
    if ($response -ne "skip") {
        Write-Host "`nOpening login page..." -ForegroundColor Cyan
        eas login
    } else {
        Write-Host "`nTo login manually, run: eas login" -ForegroundColor Yellow
        Write-Host "Then run this script again.`n" -ForegroundColor Yellow
        exit
    }
}

Write-Host "`n✅ Logged in! Starting build...`n" -ForegroundColor Green
Write-Host "This will take 10-20 minutes. Please wait...`n" -ForegroundColor Yellow
Write-Host "You'll get a download link when it's done!`n" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Green

# Start the build
eas build --platform android --profile preview

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE!" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Your APK download link is shown above!" -ForegroundColor Cyan
Write-Host "Or check: https://expo.dev → Builds`n" -ForegroundColor Cyan
