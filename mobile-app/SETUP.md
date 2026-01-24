# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

## Step 2: Configure API URL

Edit `src/services/api.ts` and update the API base URL:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:3000/api'  // For physical devices, use your computer's IP
  : 'https://your-website.com/api';   // Production URL
```

**Finding your local IP:**
- **Mac/Linux**: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: Run `ipconfig` and look for IPv4 Address

## Step 3: Start Development Server

```bash
npm start
```

## Step 4: Run on Device/Emulator

- **iOS Simulator** (Mac only): Press `i` or run `npm run ios`
- **Android Emulator**: Press `a` or run `npm run android`
- **Physical Device**: 
  1. Install Expo Go app
  2. Scan QR code from terminal
  3. Make sure device and computer are on same WiFi network

## Step 5: Test Authentication

1. Open the app
2. Tap "Sign up" to create an account
3. Or use existing credentials to log in
4. Verify you can access the dashboard

## Troubleshooting

### Can't connect to API
- Check if your website server is running
- Verify API URL is correct
- For physical devices, ensure you're using your computer's IP (not localhost)
- Check firewall settings

### Metro bundler errors
```bash
npm start -- --reset-cache
```

### iOS build issues
```bash
cd ios && pod install && cd ..
```

### Android build issues
```bash
cd android && ./gradlew clean && cd ..
```

## Next Steps

- Customize app name and icons in `app.json`
- Update theme colors in `src/context/ThemeContext.tsx`
- Add your app icons to `assets/` folder
- Configure push notifications (if needed)
- Set up app signing for production builds
