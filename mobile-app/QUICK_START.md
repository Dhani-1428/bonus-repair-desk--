# Quick Start Guide

Get your mobile app running in 5 minutes!

## 1. Install Dependencies

```bash
cd mobile-app
npm install
```

## 2. Update API URL

Edit `src/services/api.ts` line 5:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // Use your local IP for physical devices
  : 'https://your-website.com/api';     // Your production URL
```

**Find your IP:**
- Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4 Address)

## 3. Start the App

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app on your phone

## 4. Test It

1. Open the app
2. Tap "Sign up" to create an account
3. Log in with your credentials
4. Explore the dashboard and features!

## Troubleshooting

**Can't connect to API?**
- Make sure your website server is running
- Use your computer's IP (not localhost) for physical devices
- Check that both devices are on the same WiFi

**Metro bundler issues?**
```bash
npm start -- --reset-cache
```

**Need help?** Check the full README.md for detailed documentation.

---

That's it! Your mobile app is ready to use. 🎉
