@echo off
echo ========================================
echo STARTING EXPO SERVER AND GETTING QR CODE
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Clearing environment...
set NODE_OPTIONS=
set EXPO_NO_METRO_LAZY=1

echo Step 2: Clearing cache...
if exist .expo rmdir /s /q .expo 2>nul

echo Step 3: Starting Expo server...
echo.
echo IMPORTANT: Wait for the QR code to appear in this window!
echo It will take 30-60 seconds.
echo.
echo ========================================
echo.

npx expo start --clear

pause
