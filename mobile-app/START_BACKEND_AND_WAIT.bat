@echo off
echo ========================================
echo 🚀 STARTING BACKEND SERVER
echo ========================================
echo.
echo This will:
echo   1. Check if backend is already running
echo   2. Start backend if not running
echo   3. Wait for it to be ready
echo.
echo Keep this window open!
echo.
echo Once you see "Backend server is READY", 
echo open another terminal and run: npm start
echo.
cd /d "%~dp0"
npm run start-backend
pause
