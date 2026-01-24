# 📱 How to Upload Your App to Stores

## ❌ You CANNOT Upload the Folder Directly

You **cannot** upload the `mobile-app` folder to Play Store or App Store.

## ✅ What You NEED to Do:

### Step 1: BUILD the App First

The folder contains **source code**. You need to **build** it into an app file:

**For Android:**
- Build creates: `.aab` file (Android App Bundle)
- This is what you upload to Play Store

**For iOS:**
- Build creates: `.ipa` file (iOS App Archive)
- This is what you upload to App Store

### Step 2: Build Process

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

**This takes 10-30 minutes** and creates the app files in the cloud.

### Step 3: Download the Built Files

After building:
1. Go to https://expo.dev
2. Find your build
3. Download the `.aab` (Android) or `.ipa` (iOS) file

### Step 4: Upload to Stores

**Play Store:**
1. Go to Google Play Console
2. Create new app
3. Upload the `.aab` file
4. Complete store listing
5. Submit for review

**App Store:**
1. Go to App Store Connect
2. Create new app
3. Upload the `.ipa` file (using Transporter or Xcode)
4. Complete store listing
5. Submit for review

## 🚀 Simple Way - Use the Batch File

I created `BUILD_AND_PUBLISH.bat` for you:

1. **Double-click:** `BUILD_AND_PUBLISH.bat`
2. **Follow the prompts**
3. **Wait for build** (10-30 minutes)
4. **Download the file** from expo.dev
5. **Upload to store**

## 📋 Summary

**What you have:** Source code folder (`mobile-app`)
**What you need:** Built app file (`.aab` or `.ipa`)
**How to get it:** Run `eas build` command
**Then:** Upload the built file to stores

---

**The folder itself cannot be uploaded - you must build it first!**
