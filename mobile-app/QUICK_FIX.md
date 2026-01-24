# Quick Fix Guide

## If the app won't start, try these steps in order:

### Step 1: Update API URL (IMPORTANT!)

**For Physical Devices:**
1. Find your computer's IP address:
   ```powershell
   ipconfig | findstr IPv4
   ```
   You'll see something like: `192.168.1.100`

2. Edit `src/services/api.ts` and change:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_IP_HERE:3000/api'  // Replace YOUR_IP_HERE
     : 'https://your-website.com/api';
   ```
   Example: `http://192.168.1.100:3000/api`

### Step 2: Make sure your website is running

In a separate terminal, start your website:
```bash
cd ..
npm run dev
```

The website should be running on `http://localhost:3000` (or port 3003 if 3000 is busy)

### Step 3: Clear cache and restart

```bash
cd mobile-app
npm start -- --clear --reset-cache
```

### Step 4: Use the fix script

Run the automated fix script:
```powershell
cd mobile-app
.\fix-and-start.ps1
```

## Common Error Messages

### "Network Error" or "Failed to fetch"
- **Fix:** Update API URL with your computer's IP (see Step 1)
- **Fix:** Make sure website server is running
- **Fix:** Check firewall settings

### "Cannot connect to Expo"
- **Fix:** Make sure phone and computer are on same WiFi
- **Fix:** Try tunnel mode: `npm start -- --tunnel`

### "Module not found"
- **Fix:** Run `npm install` again
- **Fix:** Delete `node_modules` and reinstall

### Blank/White Screen
- **Fix:** Shake device and enable "Debug JS Remotely"
- **Fix:** Check terminal for error messages
- **Fix:** Verify all files exist in `src/` folder

## Still Not Working?

1. **Check the terminal** - What error message do you see?
2. **Check device logs** - Enable remote debugging
3. **Test API separately** - Open `http://YOUR_IP:3000/api/users` in browser

## Need More Help?

Share:
- The exact error message
- How you're running the app (Expo Go, emulator, web)
- What happens when you try to start it
