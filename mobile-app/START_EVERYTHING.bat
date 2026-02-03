@echo off
echo ========================================
echo 🚀 STARTING BACKEND + MOBILE APP
echo ========================================
echo.
echo This will start:
echo   1. Backend server (API)
echo   2. Mobile app (Expo)
echo.
echo Press Ctrl+C to stop both
echo.
cd /d "%~dp0"
npm run start-all
pause
