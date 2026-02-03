# 📱 How to Use Expo Go

## 🚀 **Quick Start**

### **Step 1: Start Backend Server** (Required!)

**Option A: Double-click**
- `START_BACKEND_ONLY.bat`

**Option B: Command**
```bash
cd mobile-app
npm run start-backend
```

Wait until you see: `✓ Ready in X seconds`

---

### **Step 2: Start Expo**

**Option A: Double-click**
- `START_EXPO_GO.bat`

**Option B: Command**
```bash
cd mobile-app
npx expo start
```

**Option C: Using npm**
```bash
cd mobile-app
npm start
```

---

### **Step 3: Connect with Expo Go**

After running the command, you'll see:

```
› Metro waiting on exp://192.168.0.11:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**On your phone:**

1. **Install Expo Go app:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR code:**
   - **Android:** Open Expo Go app → Tap "Scan QR code"
   - **iOS:** Open Camera app → Point at QR code → Tap notification

3. **Or enter URL manually:**
   - Open Expo Go app
   - Tap "Enter URL manually"
   - Enter: `exp://192.168.0.11:8081` (or whatever URL is shown)

---

## 📋 **All Commands**

### **Start Backend Only**
```bash
cd mobile-app
npm run start-backend
```

### **Start Expo Only** (for Expo Go)
```bash
cd mobile-app
npx expo start
```
or
```bash
cd mobile-app
npm start
```

### **Start Both at Once**
```bash
cd mobile-app
npm run start-all
```

---

## 🔧 **Expo Start Options**

### **Basic Start**
```bash
npx expo start
```

### **Clear Cache and Start**
```bash
npx expo start --clear
```

### **Tunnel Mode** (if LAN doesn't work)
```bash
npx expo start --tunnel
```

### **LAN Mode** (default, for same WiFi)
```bash
npx expo start --lan
```

---

## ✅ **Checklist**

Before starting Expo:

- [ ] Backend server is running (`npm run start-backend`)
- [ ] Backend shows "Ready" message
- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi network
- [ ] IP address is correct in `src/services/api.ts`

---

## 🐛 **Troubleshooting**

### **Can't see QR code?**
- Try: `npx expo start --tunnel` (slower but more reliable)
- Or manually enter URL in Expo Go

### **"Unable to connect" error?**
- Check backend server is running
- Check IP address is correct
- Make sure phone and computer on same WiFi

### **App loads but shows timeout?**
- Backend server must be running
- Check IP address in `api.ts` matches your computer's IP

---

## 📱 **Expo Go Features**

- ✅ Hot reload (changes appear instantly)
- ✅ Fast refresh
- ✅ Debug menu (shake device)
- ✅ View logs in terminal

---

## 🎯 **Recommended Workflow**

1. **Terminal 1:** Start backend
   ```bash
   cd mobile-app
   npm run start-backend
   ```

2. **Terminal 2:** Start Expo
   ```bash
   cd mobile-app
   npx expo start
   ```

3. **Phone:** Scan QR code with Expo Go

4. **Done!** App should load on your phone

---

## 💡 **Quick Commands Reference**

```bash
# Start backend server
npm run start-backend

# Start Expo (for Expo Go)
npx expo start
# or
npm start

# Start both together
npm run start-all

# Clear cache and start
npx expo start --clear

# Tunnel mode (if LAN doesn't work)
npx expo start --tunnel
```

---

**That's it! Just run `npx expo start` and scan the QR code with Expo Go!** 📱✨
