# 📱 Build APK - Simple Steps

## Quick Build for APK Download

### Step 1: Install EAS CLI
```powershell
cd mobile-app
npm install -g eas-cli
```

### Step 2: Login to Expo
```powershell
eas login
```
(Create free Expo account if needed)

### Step 3: Build APK
```powershell
eas build --platform android --profile preview
```

**Wait 10-20 minutes** for build to complete.

### Step 4: Download APK

After build completes, you'll see:
- A download URL in the terminal
- OR go to https://expo.dev → Builds → Download APK

## 🚀 Even Easier - Use the Batch File

**Just double-click:** `BUILD_APK.bat`

It does everything automatically!

## 📥 After Building

1. **Get the download link** from terminal or expo.dev
2. **Open link on your phone** (or computer)
3. **Download the APK file**
4. **Install on Android phone:**
   - Enable "Install from unknown sources" in settings
   - Tap the downloaded APK file
   - Tap "Install"

## ⚠️ Important Before Building

Update production API URL in `src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'
  : 'https://your-production-website.com/api'; // ← Change this!
```

---

**Run BUILD_APK.bat to start building your APK!**
