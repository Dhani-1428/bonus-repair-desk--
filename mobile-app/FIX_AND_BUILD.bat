@echo off
title Fix Gradle Issues and Build APK
color 0A
cls
echo.
echo ========================================
echo   FIXING GRADLE ISSUES AND BUILDING
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Fixing Expo dependencies...
call npx expo install --fix

echo.
echo Step 2: Installing dependencies...
call npm install

echo.
echo Step 3: Verifying configuration...
if not exist "assets\adaptive-icon.png" (
    echo ERROR: Missing assets! Generating...
    call node generate-assets.js
)

echo.
echo Step 4: Building APK with fixed configuration...
echo This may take 10-20 minutes...
echo.
echo ========================================
echo.

call eas build --platform android --profile preview

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo   ✅ BUILD SUCCEEDED!
    echo ========================================
    echo.
    echo Your APK is ready!
    echo Check the output above for download link.
) else (
    echo   ❌ BUILD FAILED
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
    echo Next steps:
    echo 1. Check build logs at https://expo.dev
    echo 2. Review FIX_GRADLE_BUILD.md
    echo 3. Try: eas build --platform android --profile preview --clear-cache
)
echo.
pause
