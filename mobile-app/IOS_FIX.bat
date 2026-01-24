@echo off
title iOS Fix - Tunnel Mode
color 0B
cls
echo.
echo ========================================
echo   iOS FIX - TUNNEL MODE
echo ========================================
echo.
echo This will start Expo in tunnel mode
echo which works BEST for iOS devices!
echo.
echo ========================================
echo.
cd /d "%~dp0"
set NODE_OPTIONS=

if exist .expo rmdir /s /q .expo 2>nul

echo Starting Expo in TUNNEL mode for iOS...
echo.
echo Wait 30-60 seconds for tunnel connection...
echo.
echo You'll get a URL like: exp://u.expo.dev/xxxxx
echo.
echo ON YOUR iPHONE:
echo 1. Open Expo Go app
echo 2. Tap "Enter URL manually"
echo 3. Paste the URL from below
echo 4. Tap "Connect"
echo.
echo ========================================
echo.

npx expo start --tunnel --clear

pause
