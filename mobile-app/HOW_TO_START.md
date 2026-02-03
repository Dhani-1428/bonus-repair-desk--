# 🚀 How to Start Everything from mobile-app Folder

## ✅ **Now You Can Do Everything from mobile-app Folder!**

I've created scripts so you don't need to go to the main folder anymore.

---

## 🎯 **Quick Start Options**

### **Option 1: Start Everything at Once** (Recommended)

**Double-click:** `START_EVERYTHING.bat`

This starts:
- ✅ Backend server (API)
- ✅ Mobile app (Expo)

**Or run:**
```bash
cd mobile-app
npm run start-all
```

---

### **Option 2: Start Backend Only**

**Double-click:** `START_BACKEND_ONLY.bat`

This starts only the backend server.

**Or run:**
```bash
cd mobile-app
npm run start-backend
```

**Then in another terminal:**
```bash
cd mobile-app
npm start
```

---

### **Option 3: Start Mobile App Only** (if backend already running)

```bash
cd mobile-app
npm start
```

---

## 📋 **Why You Need the Backend**

The mobile app is like a **phone** - it needs a **server** to talk to.

```
Mobile App (your phone)  →  Backend Server (API)  →  Database
```

**The backend server:**
- Connects to the database
- Provides API endpoints (`/api/auth/login`, `/api/repairs`, etc.)
- Handles all data operations

**Without the backend:**
- ❌ Mobile app can't connect to database
- ❌ No API endpoints to call
- ❌ Registration/login won't work

**With the backend:**
- ✅ Mobile app can make API calls
- ✅ Can register/login users
- ✅ Can create/view tickets
- ✅ Everything works!

---

## 🔧 **Available Commands** (all from mobile-app folder)

```bash
# Start backend server only
npm run start-backend

# Start mobile app only
npm start

# Start both at once
npm run start-all
```

---

## ✅ **Recommended Workflow**

1. **Open mobile-app folder**
2. **Double-click:** `START_EVERYTHING.bat`
3. **Wait for both to start:**
   - Backend: "Ready in X seconds"
   - Expo: QR code appears
4. **Use the app!**

---

## 🐛 **Troubleshooting**

### Backend won't start?
- Make sure you're in `mobile-app` folder
- Check if port 3000 is already in use
- Check database credentials in main folder `.env`

### Mobile app won't connect?
- Make sure backend is running first
- Check IP address in `src/services/api.ts`
- Make sure phone and computer on same WiFi

---

## 📝 **What Changed**

✅ Created `start-backend.js` - starts backend from mobile-app folder
✅ Added `npm run start-backend` script
✅ Added `npm run start-all` script (starts both)
✅ Created `START_EVERYTHING.bat` - easy double-click
✅ Created `START_BACKEND_ONLY.bat` - backend only

**Now you can do everything from mobile-app folder!** 🎉

---

## 🎯 **Summary**

**Before:** Had to run commands in two different folders
**Now:** Everything can be done from `mobile-app` folder!

**Just double-click:** `START_EVERYTHING.bat` and you're done! ✅
