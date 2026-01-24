# 📥 Get Your APK File - Download Instructions

## 🚀 Quick Start

### Method 1: Automated (Recommended)

**Double-click:** `BUILD_APK.bat`

This will:
1. Install EAS CLI
2. Login to Expo
3. Build your APK
4. Give you download link

**Takes 10-20 minutes**

### Method 2: Manual Steps

```powershell
cd mobile-app

# Step 1: Install EAS
npm install -g eas-cli

# Step 2: Login
eas login

# Step 3: Build APK
eas build --platform android --profile preview
```

## 📥 How to Download APK

After build completes:

### Option 1: Direct Link
- The terminal will show a download URL
- Copy and open it in browser
- Download the APK file

### Option 2: From Expo Website
1. Go to https://expo.dev
2. Login with your Expo account
3. Click "Builds" in menu
4. Find your latest build
5. Click "Download" button
6. Download the `.apk` file

## 📱 Install APK on Android Phone

1. **Transfer APK to phone:**
   - Email it to yourself
   - Use USB cable
   - Use cloud storage (Google Drive, etc.)

2. **Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install from unknown sources" or "Install unknown apps"
   - Select your file manager app

3. **Install:**
   - Open file manager on phone
   - Find the APK file
   - Tap it
   - Tap "Install"
   - Tap "Open" when done

## ⚠️ Before Building

**Update API URL for production:**

Edit `src/services/api.ts` line 7:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'
  : 'https://your-actual-website.com/api'; // ← Change to your real website!
```

## 🎯 Summary

1. Run `BUILD_APK.bat`
2. Wait 10-20 minutes
3. Get download link from terminal or expo.dev
4. Download APK file
5. Install on Android phone

---

**That's it! Your APK will be ready to download!**
