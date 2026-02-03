@echo off
echo ========================================
echo 🚀 STARTING BACKEND SERVER ONLY
echo ========================================
echo.
echo This starts the backend API server
echo Keep this window open while using the app
echo.
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
npm run start-backend
pause
