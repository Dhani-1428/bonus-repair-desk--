@echo off
echo ========================================
echo 🚀 STARTING BACKEND SERVER
echo ========================================
echo.
cd /d "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
echo Current directory: %CD%
echo.
echo Starting backend server...
echo This will keep running until you press Ctrl+C
echo.
echo Waiting for server to start...
echo.
npm run dev
pause
