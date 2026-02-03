# 🚨 FIX CONNECTION TIMEOUT ERROR - STEP BY STEP

## ❌ **Error You're Seeing:**

```
[API] Request timeout: http://172.20.10.6:3000/api/auth/register
Connection timeout. Please check:
1. Backend server is running (npm run dev)
2. IP address is correct: http://172.20.10.6:3000/api
3. Phone and computer are on same WiFi
```

---

## ✅ **QUICK FIX - Follow These Steps:**

### **Step 1: Start Backend Server** (MOST IMPORTANT!)

**Open a NEW terminal window and run:**

```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

**Wait until you see:**
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

**Keep this terminal window open!** The server must stay running.

---

### **Step 2: Check Your IP Address**

**Find your current IP:**

1. Open Command Prompt
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter
4. It might be different from `172.20.10.6`

**Common IP ranges:**
- `192.168.1.x` (home routers)
- `192.168.0.x` (home routers)
- `172.20.10.x` (mobile hotspots)
- `10.0.0.x` (some networks)

---

### **Step 3: Update IP in Mobile App**

**If your IP is different from `172.20.10.6`:**

1. Open: `mobile-app/src/services/api.ts`
2. Find line 5:
   ```typescript
   ? 'http://172.20.10.6:3000/api'
   ```
3. Replace `172.20.10.6` with your actual IP
4. Save the file
5. Restart Expo: `npx expo start --clear`

---

### **Step 4: Test Connection from Phone**

**On your phone's browser, try to open:**
```
http://YOUR_IP:3000/api/test-db
```

**Replace `YOUR_IP` with your actual IP address.**

**If it works:**
- ✅ Backend is accessible
- ✅ IP is correct
- ✅ Network is working

**If it doesn't work:**
- ❌ Check IP address again
- ❌ Make sure backend is running
- ❌ Check firewall settings

---

### **Step 5: Verify Network Connection**

**Requirements:**
- ✅ Phone and computer must be on **same WiFi network**
- ✅ Backend server must be running
- ✅ IP address must be correct
- ✅ Firewall allows port 3000

**Test:**
- Try accessing `http://YOUR_IP:3000` from phone browser
- If you can't access it, there's a network issue

---

## 🔍 **Troubleshooting Checklist**

Go through each item:

- [ ] **Backend server is running** (`npm run dev` in separate terminal)
- [ ] **Backend shows "Ready" or "compiled successfully"**
- [ ] **IP address in `api.ts` matches your computer's IP**
- [ ] **Phone and computer are on same WiFi network**
- [ ] **Can access `http://YOUR_IP:3000` from phone browser**
- [ ] **Firewall allows port 3000**
- [ ] **Restarted Expo after changing IP** (`npx expo start --clear`)

---

## 🐛 **Common Issues & Solutions**

### Issue 1: Backend Not Running
**Solution:** Start it with `npm run dev` in a separate terminal

### Issue 2: Wrong IP Address
**Solution:** 
1. Find your IP: `ipconfig`
2. Update `api.ts` with correct IP
3. Restart Expo

### Issue 3: Different WiFi Networks
**Solution:** Make sure phone and computer are on same network

### Issue 4: Firewall Blocking
**Solution:** 
1. Windows Firewall → Allow an app
2. Allow Node.js or port 3000

### Issue 5: Backend Taking Too Long
**Solution:** 
- Check backend terminal for errors
- Check database connection
- Restart backend server

---

## 📱 **After Fixing**

1. **Restart Expo:**
   ```bash
   cd mobile-app
   npx expo start --clear
   ```

2. **Try registering again:**
   - Fill in the form
   - Click "Sign up"
   - Should work now!

3. **Check console logs:**
   - Look for `[API] Attempting registration to: ...`
   - Should see success message

---

## 🚀 **Quick Test**

**Test if backend is accessible:**

1. **On your phone's browser:**
   - Go to: `http://YOUR_IP:3000/api/test-db`
   - Should show database connection info

2. **If it works:**
   - Backend is accessible ✅
   - Try the app again

3. **If it doesn't work:**
   - Check IP address
   - Check backend is running
   - Check network connection

---

## ⚡ **Most Common Fix**

**99% of the time, the issue is:**

1. **Backend server is NOT running**
   - Solution: Start it with `npm run dev`

2. **Wrong IP address**
   - Solution: Update `api.ts` with correct IP

**Start with these two!**

---

## 📞 **Still Not Working?**

If you've checked everything above:

1. **Share these details:**
   - Is backend server running? (Yes/No)
   - What IP address is in `api.ts`?
   - What IP does `ipconfig` show?
   - Can you access `http://YOUR_IP:3000` from phone browser?

2. **Try tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```
   (Slower but more reliable)

3. **Check backend logs:**
   - Look for any errors in backend terminal
   - Check if database is connected
   - Verify API endpoints are working

---

**The timeout error means the app can't reach the backend. Start with Step 1 - make sure the backend server is running!**
