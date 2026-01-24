# How to Scan QR Code and Use the App

## Step-by-Step Instructions

### Step 1: Start the Expo Server

The QR code is generated automatically when you run:
```bash
cd mobile-app
npm start
```

**You should see:**
- A QR code in your terminal
- Options like: `Press i for iOS | Press a for Android`
- A URL like: `exp://192.168.1.XXX:8081`

### Step 2: Install Expo Go App on Your Phone

**For iPhone:**
1. Open App Store
2. Search for "Expo Go"
3. Install the app (it's free)

**For Android:**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the app (it's free)

### Step 3: Scan the QR Code

**On iPhone:**
1. Open the **Camera app** (not Expo Go)
2. Point it at the QR code in your terminal
3. Tap the notification that appears
4. It will open in Expo Go

**On Android:**
1. Open the **Expo Go app**
2. Tap "Scan QR code"
3. Point camera at the QR code in terminal
4. App will load automatically

### Step 4: Make Sure You're Connected

**Important Requirements:**
- ✅ Your phone and computer must be on the **same WiFi network**
- ✅ Your website server should be running (in another terminal: `npm run dev`)
- ✅ Update API URL if needed (see below)

### Step 5: Update API URL (If Testing on Phone)

If you're using a physical device, you need to update the API URL:

1. **Find your computer's IP address:**
   ```powershell
   ipconfig | findstr IPv4
   ```
   You'll see something like: `192.168.1.100`

2. **Edit `src/services/api.ts`:**
   Change line 5-6 from:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:3000/api'
   ```
   To:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://192.168.1.100:3000/api'  // Use YOUR IP here
   ```

3. **Restart Expo server:**
   - Press `Ctrl+C` to stop
   - Run `npm start` again

## Troubleshooting

### QR Code Not Appearing?
- Make sure you're in the `mobile-app` directory
- Check that `npm start` is running
- Try: `npm start -- --clear`

### Can't Scan QR Code?
- Make sure terminal window is large enough
- Try copying the URL manually into Expo Go
- Use tunnel mode: `npm start -- --tunnel`

### App Won't Load?
- Check that phone and computer are on same WiFi
- Make sure website server is running (`npm run dev` in main folder)
- Update API URL with your computer's IP (see Step 5)

### Connection Error?
- Update API URL in `src/services/api.ts` with your computer's IP
- Check firewall settings
- Make sure website is running on port 3000

## Alternative: Manual Connection

If QR code doesn't work:

1. Look for a URL in terminal like: `exp://192.168.1.100:8081`
2. Open Expo Go app
3. Tap "Enter URL manually"
4. Paste the URL
5. Tap "Connect"

## Quick Start Command

Just run this in the `mobile-app` folder:
```bash
npm start
```

Then scan the QR code that appears! 📱
