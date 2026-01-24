# How to Get the QR Code

## Step-by-Step Instructions

### Step 1: Open a NEW Terminal Window

**Important:** You need to run this in a terminal window (not background) so you can see the QR code!

### Step 2: Navigate to mobile-app folder

```powershell
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)\mobile-app"
```

### Step 3: Start Expo

```powershell
npm start
```

**OR use the script I created:**

```powershell
.\start-expo-simple.ps1
```

### Step 4: Wait for QR Code

You should see:
- Text saying "Starting Metro Bundler..."
- Then a **QR code** (square black and white pattern)
- Text like "Metro waiting on exp://..."
- Options: `Press i for iOS | Press a for Android | Press w for web`

### Step 5: If Port is Busy

If you see "Port 8081 is being used", run:

```powershell
# Kill the process
Get-Process | Where-Object {$_.Id -eq 26660} | Stop-Process -Force

# Then start again
npm start
```

## Alternative: Use Web Mode (Easier!)

If QR code is still not showing, test in browser first:

```powershell
cd mobile-app
npm start -- --web
```

Then press `w` when prompted - it will open in your browser!

## Still Not Working?

1. Make sure you're in the `mobile-app` directory
2. Make sure no other Expo server is running
3. Try: `npx expo start --clear`
4. Check for error messages in terminal

---

**The QR code WILL appear in your terminal window - make sure the window is large enough to see it!**
