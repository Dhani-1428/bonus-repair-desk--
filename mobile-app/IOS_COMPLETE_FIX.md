# ✅ COMPLETE iOS FIX - Step by Step

## The Problem
iOS shows blank screen because:
1. ❌ Website server is NOT running (app needs API)
2. ❌ Connection issues
3. ❌ JavaScript errors

## ✅ COMPLETE SOLUTION:

### Step 1: Start Website Server (REQUIRED!)

**I've started it for you, but verify:**

1. Look for a NEW PowerShell window that says "Starting Website Server"
2. You should see: `Local: http://localhost:3000` (or 3003)
3. **This MUST be running for the app to work!**

If not running, open terminal and run:
```powershell
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

### Step 2: Start Expo with Tunnel Mode

**For iOS, tunnel mode works best:**

1. **Stop current Expo server** (Ctrl+C in Expo terminal)

2. **Run:**
   ```powershell
   cd mobile-app
   $env:NODE_OPTIONS = ""
   npx expo start --tunnel
   ```

   OR double-click: `IOS_FIX.bat`

3. **Wait 30-60 seconds** for tunnel connection

4. **You'll see:** `exp://u.expo.dev/xxxxx-xxxxx`

### Step 3: Connect on iPhone

1. **Open Expo Go app** (NOT Camera app!)

2. **Tap "Enter URL manually"**

3. **Type the URL** from terminal: `exp://u.expo.dev/xxxxx-xxxxx`

4. **Tap "Connect"**

### Step 4: Debug if Still Blank

1. **Shake your iPhone**

2. **Tap "Debug Remote JS"**

3. **Check Expo terminal** for red error messages

4. **Common errors:**
   - "Network request failed" → Website server not running
   - "Cannot find module" → Dependencies issue
   - "API error" → Check API URL

### Step 5: Check API URL

Make sure `src/services/api.ts` has:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Your IP
  : 'https://your-website.com/api';
```

## 🚀 QUICK CHECKLIST:

- [ ] Website server running? (Check new PowerShell window)
- [ ] Expo server running? (See "Metro waiting on...")
- [ ] Using tunnel mode? (`npx expo start --tunnel`)
- [ ] Entered URL manually in Expo Go?
- [ ] API URL correct? (`172.20.10.6:3000/api`)
- [ ] Phone and computer on same WiFi?

## 📱 iOS-Specific Tips:

1. **Always use Expo Go app** (not Camera for scanning)
2. **Use manual URL entry** (more reliable)
3. **Use tunnel mode** (works better on iOS)
4. **Shake phone for debug menu** if blank screen
5. **Check terminal for errors** when debugging

## 🔍 If Still Not Working:

**Test in browser first:**
1. In Expo terminal, press `w`
2. App opens in browser
3. If it works in browser → app is fine, just connection issue
4. If blank in browser → JavaScript error (check terminal)

---

**Most important: Make sure website server is running!**
