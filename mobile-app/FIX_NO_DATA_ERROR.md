# Fix: "No Usable Data Found" Error

## The Problem
The QR code isn't working because:
1. Expo server might not be fully started
2. The connection URL format might be wrong
3. Network/firewall blocking connection

## ✅ SOLUTION 1: Test in Web Browser First (Easiest!)

**This works immediately - no QR code needed!**

1. **Double-click:** `START_WEB_VERSION.bat`
   OR
2. **Run in terminal:**
   ```powershell
   cd mobile-app
   $env:NODE_OPTIONS = ""
   npx expo start --web
   ```
3. **Press `w`** when prompted
4. **App opens in your browser!**

This proves the app works, then we fix the mobile connection.

## ✅ SOLUTION 2: Use Manual URL Entry

Instead of scanning QR code:

1. **Start Expo server:**
   ```powershell
   cd mobile-app
   $env:NODE_OPTIONS = ""
   npx expo start
   ```

2. **Look for the URL in terminal** - You'll see:
   ```
   exp://192.168.1.100:8081
   ```
   OR
   ```
   exp://172.20.10.6:8081
   ```

3. **Open Expo Go app** on your phone

4. **Tap "Enter URL manually"** (or "Connect manually")

5. **Type the URL** exactly as shown (e.g., `exp://172.20.10.6:8081`)

6. **Tap "Connect"**

## ✅ SOLUTION 3: Use Tunnel Mode (Most Reliable)

Tunnel mode creates a public URL that always works:

1. **Run:**
   ```powershell
   cd mobile-app
   $env:NODE_OPTIONS = ""
   npx expo start --tunnel
   ```

2. **Wait 30-60 seconds** for tunnel to connect

3. **You'll see a URL like:** `exp://u.expo.dev/...`

4. **Scan that QR code** - tunnel URLs always work!

## ✅ SOLUTION 4: Check These Things

1. **Is server actually running?**
   - Look for "Metro waiting on..." in terminal
   - If you see errors, server isn't running

2. **Same WiFi network?**
   - Phone and computer must be on same WiFi
   - Try turning WiFi off/on on phone

3. **Firewall blocking?**
   - Windows Firewall might be blocking port 8081
   - Try tunnel mode (bypasses firewall)

4. **Website server running?**
   - Run `npm run dev` in main folder
   - App needs the API to work

## 🚀 QUICKEST FIX:

**Test in browser first:**
```powershell
cd mobile-app
.\START_WEB_VERSION.bat
```

If that works, then use tunnel mode for mobile:
```powershell
cd mobile-app
$env:NODE_OPTIONS = ""
npx expo start --tunnel
```

---

**Try the web version first - it will work immediately and prove the app is fine!**
