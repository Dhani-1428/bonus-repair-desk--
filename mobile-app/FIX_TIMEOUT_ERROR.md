# 🔧 Fix "Network Request Timed Out" Error

## ✅ **Fixes Applied**

1. **Added Timeout Handling** - 30 second timeout with better error messages
2. **Improved Error Messages** - Clear instructions on what to check
3. **Better Diagnostics** - Logs show exactly what's being attempted

## 🚨 **Quick Fix Steps**

### Step 1: **Check Backend Server is Running** (MOST IMPORTANT!)

The timeout usually means the backend server isn't running or isn't accessible.

**Start the backend server:**
```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

**Verify it's running:**
- Should show: `Local: http://localhost:3000`
- Check the terminal for any errors
- Make sure it says "Ready" or "compiled successfully"

### Step 2: **Verify IP Address**

The app is trying to connect to: `http://172.20.10.6:3000/api`

**Check if this is correct:**
1. Open Command Prompt
2. Run: `ipconfig`
3. Look for "IPv4 Address" (e.g., `192.168.1.100` or `172.20.10.6`)

**If IP changed, update it:**
1. Open: `mobile-app/src/services/api.ts`
2. Line 5: Update the IP address
3. Save the file
4. Restart Expo: `npx expo start --clear`

### Step 3: **Test Backend Connection**

Test if backend is reachable from your phone:

1. **On your phone's browser**, try to open:
   ```
   http://172.20.10.6:3000/api/test-db
   ```
   (Replace `172.20.10.6` with your actual IP)

2. **If it works:**
   - Backend is accessible ✅
   - The issue might be with the app

3. **If it doesn't work:**
   - Backend is not accessible ❌
   - Check IP address
   - Check firewall settings
   - Make sure phone and computer are on same WiFi

### Step 4: **Check Network Connection**

**Requirements:**
- ✅ Phone and computer must be on **same WiFi network**
- ✅ Firewall should allow port 3000
- ✅ Backend server must be running

**Test network:**
- Try accessing `http://YOUR_IP:3000` from phone browser
- If you can't access it, the network is the issue

## 🔍 **Common Causes**

### Cause 1: Backend Server Not Running
**Solution:** Start it with `npm run dev`

### Cause 2: Wrong IP Address
**Solution:** Update IP in `api.ts` to match your current IP

### Cause 3: Different WiFi Networks
**Solution:** Make sure phone and computer are on same network

### Cause 4: Firewall Blocking
**Solution:** Allow port 3000 in Windows Firewall

### Cause 5: Backend Taking Too Long
**Solution:** Check backend logs for slow database queries

## 📋 **Step-by-Step Checklist**

- [ ] Backend server is running (`npm run dev`)
- [ ] Backend shows "Ready" or "compiled successfully"
- [ ] IP address in `api.ts` matches your computer's IP
- [ ] Phone and computer are on same WiFi network
- [ ] Can access `http://YOUR_IP:3000` from phone browser
- [ ] Firewall allows port 3000
- [ ] Restarted Expo after changing IP (`npx expo start --clear`)

## 🐛 **Debug Steps**

1. **Check Expo console:**
   - Look for `[API] Attempting registration to: ...`
   - Look for `[API] Register error: ...`
   - These logs show what's happening

2. **Check backend console:**
   - Look for incoming requests
   - Check for any errors
   - Verify database connection

3. **Test API directly:**
   - Open phone browser
   - Go to: `http://YOUR_IP:3000/api/test-db`
   - If this works, API is accessible

## ✅ **After Fixing**

Once you've fixed the issue:
1. Restart Expo: `npx expo start --clear`
2. Try registering again
3. Check console logs for success messages

## 📞 **Still Having Issues?**

If timeout persists after checking all above:

1. **Share these details:**
   - Is backend server running? (Yes/No)
   - What IP address is in `api.ts`?
   - Can you access `http://YOUR_IP:3000` from phone browser?
   - Are phone and computer on same WiFi?

2. **Try tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```
   (Slower but more reliable for network issues)

3. **Check backend logs:**
   - Look for any errors in backend terminal
   - Check if database is connected
   - Verify API endpoints are working

---

**The timeout error is almost always because the backend server isn't running or isn't accessible. Start with Step 1!**
