@echo off
title Expo Server - QR Code Generator
color 0A
echo.
echo ========================================
echo   EXPO SERVER - QR CODE GENERATOR
echo ========================================
echo.
echo Starting Expo server in tunnel mode...
echo.
echo IMPORTANT: 
echo - Wait 30-60 seconds
echo - A QR CODE will appear in this window
echo - Scan THAT QR code with Expo Go app
echo.
echo ========================================
echo.
cd /d "%~dp0"
set NODE_OPTIONS=
set EXPO_NO_METRO_LAZY=1

if exist .expo rmdir /s /q .expo 2>nul

npx expo start --tunnel --clear

pause
