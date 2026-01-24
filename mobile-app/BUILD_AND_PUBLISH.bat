@echo off
title Build and Publish Mobile App
color 0A
cls
echo.
echo ========================================
echo   BUILD AND PUBLISH MOBILE APP
echo ========================================
echo.
echo This will help you build your app for
echo Google Play Store and Apple App Store
echo.
echo ========================================
echo.
cd /d "%~dp0"

echo Step 1: Installing EAS CLI...
call npm install -g eas-cli

echo.
echo Step 2: Login to Expo...
echo (You'll need to create a free Expo account)
echo.
call eas login

echo.
echo Step 3: Configure build...
echo.
call eas build:configure

echo.
echo ========================================
echo   BUILD OPTIONS
echo ========================================
echo.
echo Choose what to build:
echo.
echo 1. Android APK (for testing)
echo 2. Android AAB (for Play Store)
echo 3. iOS (for App Store - requires Mac)
echo 4. Both Android and iOS
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo Building Android APK...
    call eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo Building Android AAB for Play Store...
    call eas build --platform android --profile production
) else if "%choice%"=="3" (
    echo Building iOS for App Store...
    call eas build --platform ios --profile production
) else if "%choice%"=="4" (
    echo Building for both platforms...
    call eas build --platform all --profile production
) else (
    echo Invalid choice
)

echo.
echo ========================================
echo   BUILD STARTED
echo ========================================
echo.
echo Your build is processing. This takes 10-30 minutes.
echo.
echo Check status at: https://expo.dev
echo.
pause
