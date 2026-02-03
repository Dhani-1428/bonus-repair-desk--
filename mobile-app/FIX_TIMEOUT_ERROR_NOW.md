# 🚨 FIX TIMEOUT ERROR - DO THIS NOW!

## ❌ **The Error You're Seeing:**

```
ERROR [API] Request timeout: http://192.168.0.11:3000/api/auth/register
ERROR [API] Register error: Connection timeout
```

## ✅ **THE PROBLEM:**

**The backend server is NOT running!**

The mobile app needs the backend server to connect to the database. Without it, you get timeout errors.

---

## 🔧 **QUICK FIX - 3 STEPS:**

### **Step 1: Check if Backend is Running**

```bash
cd mobile-app
npm run check-backend
```

**If it says "NOT running" → Go to Step 2**

**If it says "RUNNING" → The problem is something else (check IP address)**

---

### **Step 2: Start Backend Server**

**Option A: Use Batch File** (Easiest)
1. Go to `mobile-app` folder
2. Double-click: `START_BACKEND_AND_WAIT.bat`
3. Wait for: `✅ Backend server is READY!`

**Option B: Use Command**
```bash
cd mobile-app
npm run start-backend
```

**Wait until you see:**
```
✅ Backend server is READY!
📱 You can now start Expo with: npm start
```

**KEEP THIS TERMINAL WINDOW OPEN!**

---

### **Step 3: Try the App Again**

1. Make sure backend is running (Step 2)
2. Open the app in Expo Go
3. Try registering again
4. Should work now! ✅

---

## 🔍 **Why This Happens:**

```
Mobile App → Backend API → Database
   ❌          ❌            ❌
   
Without backend:
- Mobile app can't reach API
- API can't reach database
- Everything times out
```

```
Mobile App → Backend API → Database
   ✅          ✅            ✅
   
With backend:
- Mobile app connects to API
- API connects to database
- Everything works!
```

---

## ✅ **Verification:**

After starting backend, verify it's working:

**On your phone's browser, try:**
```
http://192.168.0.11:3000/api/test-db
```

**If you see JSON data:**
- ✅ Backend is running
- ✅ Backend is accessible
- ✅ App should work

**If you see timeout:**
- ❌ Backend not running (start it!)
- ❌ Wrong IP address (check with `ipconfig`)
- ❌ Network issue (check WiFi)

---

## 📋 **Complete Workflow:**

### **Terminal 1: Backend**
```bash
cd mobile-app
npm run start-backend
```
**Wait for:** `✅ Backend server is READY!`

### **Terminal 2: Expo** (if not already running)
```bash
cd mobile-app
npm start
```

### **Phone:**
- Open Expo Go
- App should already be loaded
- Try registering again

---

## 🐛 **Still Not Working?**

### **Check 1: Is Backend Running?**
```bash
cd mobile-app
npm run check-backend
```

### **Check 2: Can You Access Backend from Phone?**
- Open phone browser
- Go to: `http://192.168.0.11:3000/api/test-db`
- If it works → Backend is accessible ✅
- If timeout → Backend not running or wrong IP

### **Check 3: Is IP Address Correct?**
```bash
ipconfig
```
Look for "IPv4 Address" - should match `192.168.0.11`

If different, update `mobile-app/src/services/api.ts` line 5

---

## 🎯 **Most Common Issue:**

**99% of the time, the issue is:**

1. **Backend server is NOT running**
   - Solution: `npm run start-backend`
   - Wait for "Ready" message

2. **Backend was started but then stopped**
   - Solution: Start it again
   - Keep the terminal window open

---

## ✅ **Success Checklist:**

- [ ] Backend server is running (`npm run check-backend` says "RUNNING")
- [ ] Backend shows "Ready" message
- [ ] Can access `http://192.168.0.11:3000/api/test-db` from phone
- [ ] IP address is correct (`192.168.0.11`)
- [ ] Phone and computer on same WiFi
- [ ] Backend terminal window is still open

**If all checked → App should work!**

---

## 🚀 **Quick Command:**

```bash
# Check backend status
npm run check-backend

# Start backend (if not running)
npm run start-backend

# Start Expo (in another terminal)
npm start
```

---

**The timeout error means backend is not running. Start it with `npm run start-backend` and wait for "Ready"!**
