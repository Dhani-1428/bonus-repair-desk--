@echo off
echo Starting Expo with Windows fix...
cd /d "%~dp0"
set EXPO_NO_METRO_LAZY=1
set NODE_OPTIONS=
if exist .expo rmdir /s /q .expo
echo.
echo Starting Expo server...
echo You should see a QR code in a few seconds!
echo.
npx expo start --tunnel
pause
