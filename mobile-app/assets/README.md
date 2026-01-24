# Assets Directory

Place your app assets here:

## Required Assets

1. **icon.png** - App icon (1024x1024px)
   - Used as the main app icon for iOS and Android

2. **splash.png** - Splash screen image (1242x2436px recommended)
   - Shown when app is launching

3. **adaptive-icon.png** - Android adaptive icon (1024x1024px)
   - Used for Android adaptive icons

4. **favicon.png** - Web favicon (48x48px)
   - Used when running on web

## Generating Assets

You can use online tools or Expo's asset generator:

```bash
# Install expo-asset-generator
npm install -g expo-asset-generator

# Generate all assets from a single source image
expo-asset-generator --input your-logo.png
```

Or use online tools like:
- [App Icon Generator](https://www.appicon.co/)
- [Icon Kitchen](https://icon.kitchen/)
- [MakeAppIcon](https://makeappicon.com/)

## Current Setup

The app is configured to use dark theme with black background. Make sure your icons work well on dark backgrounds.
