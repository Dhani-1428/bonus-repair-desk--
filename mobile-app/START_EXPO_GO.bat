@echo off
echo ========================================
echo 📱 STARTING EXPO FOR EXPO GO
echo ========================================
echo.
echo This will start Expo so you can:
echo   1. Scan QR code with Expo Go app
echo   2. Or enter URL manually in Expo Go
echo.
echo Make sure backend server is running first!
echo (Run START_BACKEND_ONLY.bat if needed)
echo.
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
npx expo start
pause
