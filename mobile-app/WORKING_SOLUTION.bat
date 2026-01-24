@echo off
title Expo Mobile App - Working Solution
color 0A
cls
echo.
echo ========================================
echo   MOBILE APP - WORKING SOLUTION
echo ========================================
echo.
echo This will start Expo with TUNNEL mode
echo which creates a public URL that ALWAYS works!
echo.
echo ========================================
echo.
cd /d "%~dp0"
set NODE_OPTIONS=

if exist .expo rmdir /s /q .expo 2>nul

echo Starting Expo in TUNNEL mode...
echo.
echo This may take 30-60 seconds to connect...
echo.
echo You'll see a QR code with: exp://u.expo.dev/...
echo This URL ALWAYS works - scan it!
echo.
echo ========================================
echo.

npx expo start --tunnel --clear

pause
