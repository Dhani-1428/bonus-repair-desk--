# 📱 Publish to Play Store & App Store - Complete Guide

## 🎯 Overview

This guide will help you publish your Bonus Repair Desk mobile app to:
- **Google Play Store** (Android)
- **Apple App Store** (iOS)

## 📋 Prerequisites

### For Android (Play Store):
- ✅ Google Play Developer Account ($25 one-time fee)
- ✅ App signing key (we'll create this)
- ✅ App icon and screenshots

### For iOS (App Store):
- ✅ Apple Developer Account ($99/year)
- ✅ Mac computer (required for iOS builds)
- ✅ Xcode installed (on Mac)

## 🚀 Step 1: Install EAS CLI

EAS (Expo Application Services) makes building and publishing easy:

```powershell
npm install -g eas-cli
```

## 🔐 Step 2: Login to Expo

```powershell
eas login
```

Create a free Expo account if you don't have one.

## ⚙️ Step 3: Configure Your App

### Update app.json

I've already created `eas.json` for you. Now update `app.json` with your details:

```json
{
  "expo": {
    "name": "Bonus Repair Desk",
    "slug": "bonus-repair-desk",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.bonusrepairdesk.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.bonusrepairdesk.app",
      "versionCode": 1
    }
  }
}
```

## 📦 Step 4: Build for Android (Play Store)

### Option A: Build APK (For Testing)

```powershell
cd mobile-app
eas build --platform android --profile preview
```

This creates an APK you can test before publishing.

### Option B: Build AAB (For Play Store)

```powershell
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) required for Play Store.

**Wait 10-20 minutes** for the build to complete.

## 🍎 Step 5: Build for iOS (App Store)

**Note:** iOS builds require a Mac. If you don't have a Mac, you can:
- Use a cloud Mac service (MacStadium, AWS Mac instances)
- Use Expo's build service (requires Apple Developer account)

```powershell
eas build --platform ios --profile production
```

**Wait 15-30 minutes** for the build to complete.

## 📤 Step 6: Submit to Play Store

### 6.1: Create Play Store Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in:
   - App name: "Bonus Repair Desk"
   - Default language: English
   - App type: App
   - Free or Paid: Choose

### 6.2: Upload AAB

1. Go to "Production" → "Create new release"
2. Upload the AAB file from EAS build
3. Add release notes
4. Review and publish

### 6.3: Complete Store Listing

- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2)
- Short description (80 chars)
- Full description (4000 chars)
- Privacy policy URL

## 🍎 Step 7: Submit to App Store

### 7.1: Create App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in:
   - Name: "Bonus Repair Desk"
   - Primary language: English
   - Bundle ID: com.bonusrepairdesk.app
   - SKU: bonus-repair-desk-001

### 7.2: Upload IPA

1. Download the IPA from EAS build
2. Use **Transporter** app (Mac) or **Xcode** to upload
3. Or use EAS Submit:
   ```powershell
   eas submit --platform ios
   ```

### 7.3: Complete App Store Listing

- App icon (1024x1024 PNG)
- Screenshots (various sizes for different devices)
- Description
- Keywords
- Support URL
- Privacy policy URL

## 🎨 Step 8: Create App Assets

You need these images:

### Required Sizes:

**Android:**
- Icon: 512x512 PNG
- Adaptive icon: 1024x1024 PNG (foreground)
- Feature graphic: 1024x500 PNG
- Screenshots: 16:9 or 9:16 ratio

**iOS:**
- Icon: 1024x1024 PNG
- Screenshots: 
  - iPhone 6.7": 1290x2796
  - iPhone 6.5": 1284x2778
  - iPad Pro: 2048x2732

## 🔧 Step 9: Update API URL for Production

Before building, update `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Development
  : 'https://your-production-website.com/api'; // Production - UPDATE THIS!
```

Replace `your-production-website.com` with your actual website URL.

## 📝 Step 10: Build Checklist

Before building:

- [ ] Update app name in `app.json`
- [ ] Update bundle ID/package name (must be unique)
- [ ] Update API URL to production
- [ ] Create app icons (all required sizes)
- [ ] Create splash screen
- [ ] Test app thoroughly
- [ ] Update version number
- [ ] Prepare store descriptions
- [ ] Prepare screenshots
- [ ] Create privacy policy page

## 🚀 Quick Build Commands

```powershell
# Android APK (testing)
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production

# iOS (App Store)
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## 💰 Costs

- **Google Play**: $25 one-time registration fee
- **Apple App Store**: $99/year developer fee
- **EAS Build**: Free tier available, paid plans for more builds

## 📚 Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Play Store Guide](https://support.google.com/googleplay/android-developer)
- [App Store Guide](https://developer.apple.com/app-store/)

---

**Ready to publish? Start with Step 1!**
