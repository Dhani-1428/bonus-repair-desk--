# Troubleshooting Guide

## Common Issues and Solutions

### 1. App Won't Start / Expo Server Issues

**Problem:** Expo server won't start or crashes

**Solutions:**
```bash
# Clear cache and restart
npm start -- --reset-cache

# Or reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### 2. Can't Connect to API

**Problem:** Network errors when trying to login or fetch data

**Solutions:**
1. **Update API URL** in `src/services/api.ts`:
   - For physical devices: Use your computer's local IP (not localhost)
   - Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Example: `http://192.168.1.100:3000/api`

2. **Check if website server is running:**
   ```bash
   # In the main project directory
   npm run dev
   ```

3. **Ensure same WiFi network:**
   - Device and computer must be on same network
   - Check firewall settings

### 3. QR Code Not Working

**Problem:** Can't scan QR code or connect via Expo Go

**Solutions:**
1. **Install Expo Go app:**
   - iOS: App Store
   - Android: Google Play

2. **Use tunnel mode:**
   ```bash
   npm start -- --tunnel
   ```

3. **Manual connection:**
   - Open Expo Go
   - Enter the URL shown in terminal manually

### 4. TypeScript/Compilation Errors

**Problem:** Red screen with errors

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf .expo
npm start -- --clear
```

### 5. Module Not Found Errors

**Problem:** "Cannot find module" errors

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 6. App Crashes on Launch

**Problem:** App opens then immediately closes

**Solutions:**
1. Check console for error messages
2. Verify all required files exist:
   - `App.tsx`
   - `src/context/AuthContext.tsx`
   - `src/context/ThemeContext.tsx`
   - All screen files

3. Check for missing assets:
   - Create placeholder files in `assets/` folder if needed

### 7. Authentication Not Working

**Problem:** Can't login or register

**Solutions:**
1. **Verify API endpoint:**
   - Check `src/services/api.ts` has correct URL
   - Test API in browser: `http://your-ip:3000/api/users`

2. **Check API response format:**
   - API should return `{ user: {...}, token: "..." }`
   - Or adjust `api.ts` to match your API format

### 8. Blank Screen / White Screen

**Problem:** App loads but shows blank screen

**Solutions:**
1. Check React Native debugger:
   - Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
   - Enable "Debug JS Remotely"

2. Check console logs:
   ```bash
   # In terminal where Expo is running
   # Look for error messages
   ```

3. Verify navigation setup in `App.tsx`

## Quick Diagnostic Commands

```bash
# Check if Expo is installed
npx expo --version

# Check Node version (should be 18+)
node --version

# Check if dependencies are installed
ls node_modules

# Clear all caches
npm start -- --clear --reset-cache
```

## Getting Help

If none of these solutions work:

1. **Check the terminal output** - Look for specific error messages
2. **Check device logs** - Enable remote debugging
3. **Verify file structure** - Ensure all files from setup exist
4. **Test API separately** - Use Postman or browser to test API endpoints

## Step-by-Step Fresh Start

If nothing works, try a complete fresh start:

```bash
# 1. Navigate to mobile-app
cd mobile-app

# 2. Remove all caches
rm -rf node_modules .expo package-lock.json

# 3. Reinstall
npm install

# 4. Clear Expo cache
npx expo start --clear

# 5. If using physical device, update API URL first!
# Edit src/services/api.ts with your computer's IP
```
