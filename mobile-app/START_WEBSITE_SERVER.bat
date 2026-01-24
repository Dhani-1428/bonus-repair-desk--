@echo off
title Website Server - Required for Mobile App
color 0B
cls
echo.
echo ========================================
echo   STARTING WEBSITE SERVER
echo ========================================
echo.
echo This is REQUIRED for the mobile app to work!
echo.
echo After this starts, open on your phone:
echo   http://172.20.10.6:3000
echo.
echo ========================================
echo.
cd /d "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"

npm run dev

pause
