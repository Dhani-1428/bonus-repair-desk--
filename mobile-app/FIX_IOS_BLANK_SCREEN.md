# Fix: iOS Shows Blank Screen / Nothing

## Common iOS Issues

### Issue 1: App Loads But Shows Blank Screen

**Cause:** JavaScript errors or missing dependencies

**Fix:**
1. **Check Expo Go console:**
   - Shake your iPhone
   - Tap "Debug Remote JS"
   - Check for error messages

2. **Reload the app:**
   - Shake iPhone
   - Tap "Reload"

3. **Check terminal for errors:**
   - Look at Expo terminal window
   - Check for red error messages

### Issue 2: Connection Issues

**Fix:**
1. **Use Tunnel Mode** (most reliable for iOS):
   ```powershell
   npx expo start --tunnel
   ```

2. **Make sure you're using the correct URL:**
   - Should be: `exp://u.expo.dev/...` (tunnel)
   - OR: `exp://172.20.10.6:8081` (LAN, same WiFi)

3. **Try disconnecting and reconnecting:**
   - Close Expo Go app completely
   - Reopen and connect again

### Issue 3: iOS Camera App Not Working

**If using Camera app to scan:**
- Make sure you're scanning from the TERMINAL window
- NOT from a saved image file
- The QR code must be LIVE from running server

**Better:** Use manual URL entry instead

### Issue 4: App Crashes Immediately

**Fix:**
1. **Check for JavaScript errors** (shake phone → Debug)
2. **Make sure all dependencies are installed:**
   ```powershell
   cd mobile-app
   npm install
   npx expo install --fix
   ```

3. **Clear Expo Go cache:**
   - Delete and reinstall Expo Go app

### Issue 5: "Unable to Connect" Error

**Fix:**
1. **Check WiFi connection:**
   - Phone and computer must be on same WiFi
   - Try turning WiFi off/on on iPhone

2. **Use Tunnel Mode:**
   - Tunnel works even on different networks
   - More reliable for iOS

3. **Check firewall:**
   - Windows Firewall might be blocking
   - Tunnel mode bypasses this

## ✅ STEP-BY-STEP iOS FIX:

### Step 1: Start with Tunnel Mode
```powershell
cd mobile-app
$env:NODE_OPTIONS = ""
npx expo start --tunnel
```

### Step 2: Wait for URL
You'll see: `exp://u.expo.dev/xxxxx-xxxxx`

### Step 3: Connect on iPhone
1. Open **Expo Go** app (NOT Camera app)
2. Tap **"Enter URL manually"**
3. Type: `exp://u.expo.dev/xxxxx-xxxxx` (the URL from terminal)
4. Tap **"Connect"**

### Step 4: If Still Blank
1. **Shake iPhone**
2. Tap **"Debug Remote JS"**
3. Check for errors in terminal
4. Tap **"Reload"**

### Step 5: Check Terminal
Look at Expo terminal for:
- Red error messages
- JavaScript errors
- Connection issues

## 🚀 QUICK TEST:

**Test if app works at all:**
1. In Expo terminal, press **`w`** (web mode)
2. App opens in browser
3. If it works in browser, app is fine - just iOS connection issue

## 📱 iOS-Specific Tips:

1. **Always use Expo Go app** (not Camera app for scanning)
2. **Use manual URL entry** (more reliable than QR)
3. **Use Tunnel mode** (works better on iOS)
4. **Check Debug menu** (shake phone) for errors

---

**Most common fix: Use Tunnel mode + Manual URL entry!**
