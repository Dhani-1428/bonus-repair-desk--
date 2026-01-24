# 📱 Get Your APK File - Complete Guide

## ✅ Everything is Ready!

Your app is configured and ready to build. Here's how to get your APK:

---

## 🚀 Quick Start (3 Steps)

### Step 1: Login to Expo (One-Time Setup)

Open PowerShell in the `mobile-app` folder:

```powershell
cd mobile-app
eas login
```

**What happens:**
- Enter your email (or create account at https://expo.dev/signup)
- Browser opens → Click "Allow" to login
- ✅ You're logged in!

### Step 2: Build APK

```powershell
eas build --platform android --profile preview
```

**Wait 10-20 minutes** - the build happens in the cloud!

### Step 3: Download APK

When done, you'll see:
```
✅ Build finished!
📥 Download: https://expo.dev/artifacts/...
```

**Click the link** or go to https://expo.dev → Builds → Download

---

## 📥 Install APK on Android Phone

1. **Transfer APK to phone:**
   - Email it to yourself
   - Use USB cable
   - Upload to Google Drive/Dropbox

2. **Enable Unknown Sources:**
   - Settings → Security → "Install unknown apps"
   - Enable for your file manager

3. **Install:**
   - Open file manager
   - Find APK file
   - Tap → Install → Open

---

## 🎯 Alternative: Use Batch File

**Double-click:** `BUILD_APK.bat`

It will guide you through login and build!

---

## ⚠️ Before Building

**Update production API URL** in `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'
  : 'https://your-actual-website.com/api'; // ← Change this!
```

---

## 📋 Summary

1. ✅ Run `eas login` (one-time)
2. ✅ Run `eas build --platform android --profile preview`
3. ✅ Wait 10-20 minutes
4. ✅ Download APK from link
5. ✅ Install on Android phone

**That's it! Your APK will be ready!** 🎉
