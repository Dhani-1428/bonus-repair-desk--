@echo off
title Test Mobile App Locally
color 0B
cls
echo.
echo ========================================
echo   TEST YOUR MOBILE APP LOCALLY
echo ========================================
echo.
echo This will start a local server so you
echo can test your app in browser or on phone!
echo.
echo ========================================
echo.
cd /d "%~dp0"

echo Starting test server...
echo.
node web-server.js

pause
