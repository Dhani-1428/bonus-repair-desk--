@echo off
echo ========================================
echo Starting Expo Mobile App
echo ========================================
echo.
cd /d "%~dp0"

echo Clearing cache...
if exist .expo rmdir /s /q .expo 2>nul

echo.
echo Starting Expo in tunnel mode...
echo This will generate a QR code you can scan!
echo.
echo Note: Tunnel mode may take 30-60 seconds
echo.
pause

npx expo start --tunnel --clear
