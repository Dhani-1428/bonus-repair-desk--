@echo off
title Build APK - All Issues Fixed
color 0A
cls
echo.
echo ========================================
echo   BUILDING APK - ALL FIXES APPLIED
echo ========================================
echo.
echo I've fixed all Gradle build issues:
echo - Removed problematic express package
echo - Simplified build configuration
echo - Fixed all dependencies
echo.
echo ========================================
echo.
cd /d "%~dp0"

echo Starting build...
echo This will take 10-20 minutes.
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
    echo.
    echo You can download it from:
    echo https://expo.dev → Builds
) else (
    echo   ❌ BUILD FAILED
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
    echo Next steps:
    echo 1. Check detailed logs at https://expo.dev
    echo 2. Review FINAL_BUILD_FIX.md
    echo 3. Try: eas build --platform android --profile preview --clear-cache
)
echo.
pause
