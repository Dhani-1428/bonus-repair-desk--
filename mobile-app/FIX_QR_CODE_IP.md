# ✅ FIX: QR Code Shows Wrong IP Address

## The Problem
Your QR code shows: `exp://127.0.0.1:8081`
- This is "localhost" - only works on your computer
- Won't work on your phone!

## ✅ SOLUTION: Use LAN Mode

### Step 1: Stop Current Server
In the Expo terminal window, press **Ctrl+C** to stop

### Step 2: Start with LAN Mode
Run this command:
```powershell
cd mobile-app
npx expo start --lan
```

**OR** double-click: `START_WITH_CORRECT_IP.bat`

### Step 3: New QR Code Appears
You'll see a NEW QR code with:
- `exp://172.20.10.6:8081` ✅ (This works!)
- NOT `exp://127.0.0.1:8081` ❌ (This doesn't work)

### Step 4: Scan the New QR Code
Scan the QR code that shows `172.20.10.6` - this will work!

## Alternative: Manual URL Entry

If QR code still doesn't work:

1. **Copy this URL:** `exp://172.20.10.6:8081`
2. **Open Expo Go app** on your phone
3. **Tap "Enter URL manually"**
4. **Paste:** `exp://172.20.10.6:8081`
5. **Tap "Connect"**

## Quick Fix Command

In your Expo terminal, press **Ctrl+C**, then run:
```powershell
npx expo start --lan
```

**The new QR code will have the correct IP address!** 🎯
