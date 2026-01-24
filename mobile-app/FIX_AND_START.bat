@echo off
echo ========================================
echo FIXING AND STARTING EXPO
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Clearing NODE_OPTIONS...
set NODE_OPTIONS=

echo Step 2: Clearing cache...
if exist .expo rmdir /s /q .expo 2>nul

echo Step 3: Starting Expo in tunnel mode...
echo.
echo This will generate a QR code!
echo Tunnel mode may take 30-60 seconds to start.
echo.
echo ========================================
echo.

npx expo start --tunnel --clear
