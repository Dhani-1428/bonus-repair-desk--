@echo off
cls
color 0C
echo.
echo ========================================
echo   STOP CURRENT SERVER FIRST!
echo ========================================
echo.
echo In your Expo terminal window:
echo   1. Press Ctrl+C to stop
echo   2. Then run this file again
echo.
echo OR manually type:
echo   npx expo start --lan
echo.
echo ========================================
echo.
pause

cd /d "%~dp0"
set NODE_OPTIONS=

echo.
echo Starting Expo with LAN mode (correct IP)...
echo.
npx expo start --lan --clear
