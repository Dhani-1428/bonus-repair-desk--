# 🚀 Quick Start Guide

## Starting the Mobile App

### 1. **Start Backend Server First** (IMPORTANT!)

The mobile app needs the backend server to be running:

```bash
# In the main project directory
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

✅ Backend should be running on: `http://localhost:3000`

### 2. **Start Mobile App**

```bash
# In the mobile-app directory
cd mobile-app
npx expo start
```

### 3. **Connect Your Phone**

**Option A: Scan QR Code**
- Open Expo Go app on your phone
- Scan the QR code shown in terminal
- App will load on your phone

**Option B: Manual Connection**
- If QR code doesn't work, look for the connection URL in terminal
- It will look like: `exp://172.20.10.6:8081`
- Open Expo Go app
- Tap "Enter URL manually"
- Enter the URL

### 4. **Check IP Address**

If connection fails, make sure your IP address is correct:

1. Find your computer's IP:
   - Windows: Open Command Prompt → `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Update in `mobile-app/src/services/api.ts`:
   - Line 5: Replace `172.20.10.6` with your current IP
   - Save the file
   - Restart Expo: `npx expo start --clear`

## 📱 Testing Login/Register

1. **Make sure backend is running** (Step 1 above)
2. Open the app on your phone
3. Try to **Register** a new account:
   - Fill in: Name, Email, Password
   - Click "Sign up"
4. Or **Login** with existing account:
   - Enter email and password
   - Click "Log in"

## 🔍 Troubleshooting

### App won't connect?
- ✅ Check backend server is running
- ✅ Verify IP address is correct
- ✅ Make sure phone and computer are on same WiFi
- ✅ Try restarting Expo: `npx expo start --clear`

### Login/Register not working?
- ✅ Check backend server logs for errors
- ✅ Check mobile app console for `[API]` logs
- ✅ Verify IP address matches your computer
- ✅ Make sure backend is accessible from phone

### Can't see QR code?
- Try: `npx expo start --tunnel` (slower but more reliable)
- Or manually enter the connection URL in Expo Go

## 📊 Current Configuration

- **Backend URL:** `http://172.20.10.6:3000/api`
- **Expo SDK:** 54.0.0
- **React Native:** 0.81.5

## ✅ Checklist Before Starting

- [ ] Backend server is running (`npm run dev`)
- [ ] IP address is correct in `api.ts`
- [ ] Phone and computer on same WiFi
- [ ] Expo Go app installed on phone
- [ ] Ready to scan QR code or enter URL

---

**Need help?** Check `FIX_LOGIN_REGISTER.md` for detailed troubleshooting.
