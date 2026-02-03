# 🚀 Complete Setup Guide - Mobile App with Database

## ✅ **Step-by-Step Setup**

### **Step 1: Start Backend Server** (REQUIRED!)

The backend server connects to the database and provides API endpoints.

**Option A: Use Batch File** (Easiest)
1. Double-click: `START_BACKEND_AND_WAIT.bat`
2. Wait until you see: `✅ Backend server is READY!`

**Option B: Use Command**
```bash
cd mobile-app
npm run start-backend
```

**Wait for:**
```
✅ Backend server is READY!
📱 You can now start Expo with: npm start
```

**Keep this terminal window open!**

---

### **Step 2: Start Expo** (In Another Terminal)

**Open a NEW terminal window:**

```bash
cd mobile-app
npm start
```

**Or:**
```bash
cd mobile-app
npx expo start
```

**You'll see a QR code!**

---

### **Step 3: Connect with Expo Go**

1. **Install Expo Go** on your phone (if not installed)
   - iOS: App Store
   - Android: Google Play

2. **Scan QR code:**
   - Android: Open Expo Go → Tap "Scan QR code"
   - iOS: Open Camera → Point at QR code → Tap notification

3. **App will load on your phone!**

---

## 🔧 **Troubleshooting Connection Timeout**

### **Error: "Connection timeout"**

This means the backend server is not running or not accessible.

**Fix:**

1. **Check if backend is running:**
   ```bash
   # In mobile-app folder
   npm run start-backend
   ```

2. **Wait for "Ready" message:**
   - Should see: `✓ Ready in X seconds`
   - Should see: `○ Local: http://localhost:3000`

3. **Verify backend is accessible:**
   - On phone browser, try: `http://192.168.0.11:3000/api/test-db`
   - If it works → Backend is accessible ✅
   - If timeout → Check IP address or network

4. **Check IP address:**
   - Your IP: `192.168.0.11` (in `src/services/api.ts`)
   - Find your IP: `ipconfig` (look for IPv4 Address)
   - Update if different

---

## 📋 **Complete Workflow**

### **Terminal 1: Backend Server**
```bash
cd mobile-app
npm run start-backend
```
**Wait for:** `✅ Backend server is READY!`

### **Terminal 2: Expo**
```bash
cd mobile-app
npm start
```
**Scan QR code with Expo Go**

---

## ✅ **Verification Checklist**

Before trying to register/login:

- [ ] Backend server is running (`npm run start-backend`)
- [ ] Backend shows "Ready" message
- [ ] Can access `http://192.168.0.11:3000/api/test-db` from phone browser
- [ ] IP address in `api.ts` is correct (`192.168.0.11`)
- [ ] Phone and computer on same WiFi network
- [ ] Expo is running (`npm start`)
- [ ] App is loaded in Expo Go

---

## 🗄️ **Database Connection**

The mobile app connects to the **same database** as the website:

```
Mobile App → Backend API → Database (MySQL)
Website    → Backend API → Database (MySQL)
```

**Database Configuration:**
- Host: `mysql-2d15...` (Aiven)
- Port: `21649`
- User: `avnadmin`
- Database: `defaultdb`
- SSL: `true`

**The backend server handles all database connections!**

---

## 🐛 **Common Issues**

### **Issue 1: "Connection timeout"**
**Solution:**
- Start backend server: `npm run start-backend`
- Wait for "Ready" message
- Check IP address is correct

### **Issue 2: "Backend server is already running"**
**Solution:**
- That's OK! Just start Expo: `npm start`
- Or stop the existing server first

### **Issue 3: "Can't access backend from phone"**
**Solution:**
- Check IP address matches your computer's IP
- Make sure phone and computer on same WiFi
- Check firewall allows port 3000

### **Issue 4: "Registration fails"**
**Solution:**
- Make sure backend is running
- Check backend terminal for errors
- Verify database connection in backend logs

---

## 🎯 **Quick Commands Reference**

```bash
# Start backend server
cd mobile-app
npm run start-backend

# Start Expo (in another terminal)
cd mobile-app
npm start

# Check if backend is running
# Try: http://192.168.0.11:3000/api/test-db in phone browser

# Find your IP address
ipconfig
```

---

## 📱 **Testing Registration/Login**

1. **Start backend:** `npm run start-backend` (wait for Ready)
2. **Start Expo:** `npm start` (in another terminal)
3. **Open app in Expo Go** (scan QR code)
4. **Try to register:**
   - Fill in: Name, Email, Password
   - Click "Sign up"
   - Should work now! ✅

---

## ✅ **Success Indicators**

**Backend is working when:**
- Terminal shows: `✓ Ready in X seconds`
- Can access `http://192.168.0.11:3000/api/test-db` from phone
- No timeout errors in mobile app

**Mobile app is working when:**
- App loads in Expo Go
- Can see login/register screen
- Registration/login works without timeout

---

**Follow these steps and everything will work!** 🎉
