@echo off
title Expo Web Version - Test in Browser
color 0B
echo.
echo ========================================
echo   STARTING APP IN WEB BROWSER
echo ========================================
echo.
echo This will open the app in your browser!
echo No QR code needed - just works!
echo.
echo ========================================
echo.
cd /d "%~dp0"
set NODE_OPTIONS=

if exist .expo rmdir /s /q .expo 2>nul

npx expo start --web

pause
