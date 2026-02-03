# 🔍 Test Backend Connection

## Quick Test Steps

### Step 1: Start Backend Server

**Option A: Use the batch file**
- Double-click: `START_BACKEND_SERVER.bat` (in main project folder)
- Wait for "Ready" message

**Option B: Manual start**
```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

### Step 2: Test from Phone Browser

**On your phone's browser, open:**
```
http://192.168.0.11:3000/api/test-db
```

**If you see JSON response:**
- ✅ Backend is running
- ✅ IP is correct
- ✅ Network is working
- ✅ App should work!

**If you see "Can't connect" or timeout:**
- ❌ Backend not running
- ❌ Wrong IP address
- ❌ Network issue
- ❌ Firewall blocking

### Step 3: Test API Endpoint

**Try the register endpoint:**
```
http://192.168.0.11:3000/api/auth/register
```

**Should show an error (that's OK - means server is responding):**
- If you see JSON error → ✅ Server is working!
- If timeout → ❌ Server not accessible

---

## 🔧 Common Issues

### Issue: "Can't connect" from phone browser

**Check:**
1. Backend server is running (see terminal)
2. IP address is correct (`192.168.0.11`)
3. Phone and computer on same WiFi
4. Firewall allows port 3000

### Issue: Backend won't start

**Check:**
1. Port 3000 is not already in use
2. Database credentials are correct
3. No errors in terminal

### Issue: Phone can't reach computer

**Solutions:**
1. Make sure same WiFi network
2. Check firewall settings
3. Try restarting both devices
4. Try using computer's IP from `ipconfig`

---

## ✅ Success Checklist

- [ ] Backend server is running (`npm run dev`)
- [ ] Terminal shows "Ready" or "compiled successfully"
- [ ] Can access `http://192.168.0.11:3000/api/test-db` from phone browser
- [ ] IP address in `api.ts` is `192.168.0.11`
- [ ] Phone and computer on same WiFi
- [ ] Firewall allows port 3000
- [ ] Restarted Expo after changes

---

**If all checklist items are ✅, the app should work!**
