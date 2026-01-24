@echo off
title Build APK with Debug Info
color 0A
cls
echo.
echo ========================================
echo   BUILDING APK WITH DEBUG INFO
echo ========================================
echo.
echo This will show detailed error messages
echo if the build fails.
echo.
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Verifying configuration...
if not exist "assets\icon.png" (
    echo ERROR: Missing assets! Run: node generate-assets.js
    pause
    exit /b 1
)

echo ✅ Configuration verified!
echo.

echo Step 2: Building with verbose output...
echo This will show detailed logs if there are errors.
echo.
echo ========================================
echo.

call eas build --platform android --profile preview --non-interactive

echo.
echo ========================================
echo   BUILD COMPLETE
echo ========================================
echo.
if %errorlevel% equ 0 (
    echo ✅ Build succeeded!
    echo Check the output above for download link.
) else (
    echo ❌ Build failed!
    echo.
    echo Check the error messages above.
    echo.
    echo Common fixes:
    echo 1. Make sure you're logged in: eas login
    echo 2. Check DEBUG_BUILD.md for troubleshooting
    echo 3. Try: npx expo install --fix
    echo 4. Check build logs at https://expo.dev
)
echo.
pause
