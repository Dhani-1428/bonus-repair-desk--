@echo off
echo ========================================
echo GENERATING QR CODE FOR YOU
echo ========================================
echo.
cd /d "%~dp0"

echo Creating QR code image...
node generate-qr.js

echo.
echo ========================================
echo QR CODE CREATED!
echo ========================================
echo.
echo Open the file: qr-code.png
echo.
echo Scan it with Expo Go app on your phone!
echo.
echo Connection URL: exp://172.20.10.6:8081
echo.
pause
