@echo off
title Expo Server - Correct IP Address
color 0A
echo.
echo ========================================
echo   STARTING EXPO WITH CORRECT IP
echo ========================================
echo.
echo This will use your computer's IP address
echo so your phone can connect!
echo.
echo ========================================
echo.
cd /d "%~dp0"
set NODE_OPTIONS=
set EXPO_NO_METRO_LAZY=1

if exist .expo rmdir /s /q .expo 2>nul

echo Starting Expo...
echo.
echo IMPORTANT: Look for the QR code with IP: 172.20.10.6
echo NOT 127.0.0.1 (that won't work on phone!)
echo.
echo ========================================
echo.

npx expo start --lan --clear

pause
