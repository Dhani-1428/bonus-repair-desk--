@echo off
title Build Android APK - Download Ready
color 0A
cls
echo.
echo ========================================
echo   BUILDING ANDROID APK FOR DOWNLOAD
echo ========================================
echo.
echo This will build an APK file you can
echo download and install on any Android phone!
echo.
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Checking EAS CLI...
where eas >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
) else (
    echo EAS CLI is already installed!
)

echo.
echo Step 2: Checking login status...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo You need to login to Expo first!
    echo This will open a browser for you to login.
    echo (Create free account if needed at https://expo.dev/signup)
    echo.
    pause
    call eas login
) else (
    echo Already logged in!
)

echo.
echo Step 3: Building APK...
echo This takes 10-20 minutes. Please wait...
echo.
echo You'll get a download link when it's done!
echo.
echo ========================================
echo.

call eas build --platform android --profile preview

echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Your APK is ready! 
echo.
echo To download:
echo 1. Check the URL shown above for direct download
echo 2. OR go to https://expo.dev
echo 3. Login with your account
echo 4. Go to "Builds" section
echo 5. Download the APK file
echo.
echo Then install on your Android phone!
echo.
pause
