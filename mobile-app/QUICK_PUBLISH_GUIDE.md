# 🚀 Quick Publish Guide - Play Store & App Store

## Simple 3-Step Process

### Step 1: Install EAS and Login

```powershell
cd mobile-app
npm install -g eas-cli
eas login
```

### Step 2: Build Your App

**For Android (Play Store):**
```powershell
eas build --platform android --profile production
```

**For iOS (App Store):**
```powershell
eas build --platform ios --profile production
```

**Wait 10-30 minutes** for build to complete.

### Step 3: Submit to Stores

**Android:**
```powershell
eas submit --platform android
```

**iOS:**
```powershell
eas submit --platform ios
```

## 📋 Before Building - Update These:

1. **App Name** in `app.json` (already set to "Bonus Repair Desk")
2. **Bundle ID** in `app.json` (already set)
3. **API URL** in `src/services/api.ts` - Change to your production website URL
4. **App Icons** - Add to `assets/` folder:
   - `icon.png` (1024x1024)
   - `splash.png` (1242x2436)
   - `adaptive-icon.png` (1024x1024)

## 🎨 Create App Icons

You need:
- **icon.png**: 1024x1024 pixels
- **splash.png**: 1242x2436 pixels (or use a tool)
- **adaptive-icon.png**: 1024x1024 pixels

Use online tools:
- [App Icon Generator](https://www.appicon.co/)
- [Icon Kitchen](https://icon.kitchen/)

## 💰 Costs

- **Google Play**: $25 one-time
- **Apple App Store**: $99/year
- **EAS Build**: Free tier available

## ⚡ Quick Start

**Just run:**
```powershell
cd mobile-app
.\BUILD_AND_PUBLISH.bat
```

Follow the prompts!

---

**That's it! Your app will be built and ready to publish!**
