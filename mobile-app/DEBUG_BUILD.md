# 🔍 Debug Build Issues

## Common Prebuild Errors & Fixes

### Error: "Unknown error. See logs of the Prebuild build phase"

**Possible Causes:**

1. ✅ **Project ID Issue** - FIXED
   - Updated `app.json` with correct project ID
   - Added owner field

2. **Missing Assets** - FIXED
   - All assets created (icon.png, adaptive-icon.png, splash.png, favicon.png)

3. **Configuration Issues**
   - Check `app.json` syntax
   - Verify `eas.json` configuration

4. **Dependencies Issues**
   - Run: `npm install`
   - Run: `npx expo install --fix`

## 🔧 Try These Fixes:

### Fix 1: Clear Cache and Rebuild
```powershell
cd mobile-app
rm -rf .expo node_modules
npm install
eas build --platform android --profile preview --clear-cache
```

### Fix 2: Update Dependencies
```powershell
cd mobile-app
npx expo install --fix
npm install
```

### Fix 3: Check Build Logs
```powershell
# View detailed build logs
eas build --platform android --profile preview --verbose
```

### Fix 4: Try Local Build (if EAS fails)
```powershell
# Prebuild locally first
npx expo prebuild --platform android

# Then check for errors
```

## 📋 Pre-Build Checklist

- [x] Project ID set correctly in `app.json`
- [x] Owner set in `app.json`
- [x] All assets exist (icon.png, adaptive-icon.png, splash.png, favicon.png)
- [ ] Dependencies installed (`npm install`)
- [ ] Expo dependencies fixed (`npx expo install --fix`)
- [ ] Logged into EAS (`eas login`)

## 🚀 Try Building Again

After checking the above:

```powershell
cd mobile-app
eas build --platform android --profile preview
```

If it still fails, check the build logs on https://expo.dev for more details!
