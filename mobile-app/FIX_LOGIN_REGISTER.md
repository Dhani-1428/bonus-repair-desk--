# 🔧 Fix Login & Register Issues

## ✅ **Fixes Applied**

1. **Improved Error Handling** - Better error messages and logging
2. **Better Response Parsing** - Handles JSON and non-JSON responses
3. **Console Logging** - Added logs to help debug issues

## 🔍 **Troubleshooting Steps**

### 1. **Check Your IP Address**

The app is configured to connect to: `http://172.20.10.6:3000/api`

**If your computer's IP changed, update it:**

1. Open `mobile-app/src/services/api.ts`
2. Find line 5: `'http://172.20.10.6:3000/api'`
3. Replace `172.20.10.6` with your current IP address

**To find your IP address:**
- Windows: Open Command Prompt and run: `ipconfig`
- Look for "IPv4 Address" under your active network adapter
- It should look like: `192.168.x.x` or `172.20.x.x`

### 2. **Make Sure Backend Server is Running**

The backend must be running for the app to work:

```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

Server should start on: `http://localhost:3000`

### 3. **Check Console Logs**

The app now logs API calls. Check your terminal/console for:
- `[API] Attempting login to: ...`
- `[API] Login response: ...`
- `[API] Login error: ...`

These logs will help identify the issue.

### 4. **Common Issues**

#### Issue: "Network error"
**Solution:** 
- Make sure backend server is running
- Check if IP address is correct
- Make sure phone and computer are on same WiFi network

#### Issue: "Invalid email or password"
**Solution:**
- Make sure you're using correct credentials
- Try creating a new account first
- Check backend logs for more details

#### Issue: "User with this email already exists"
**Solution:**
- Email is already registered
- Try logging in instead
- Or use a different email

#### Issue: "Request failed with status 500"
**Solution:**
- Check backend server logs
- Database might not be connected
- Check backend terminal for error messages

### 5. **Test API Connection**

You can test if the API is reachable:

1. Open browser on your phone
2. Go to: `http://YOUR_IP:3000/api/test-db`
3. If you see a response, API is reachable
4. If you see an error, check IP address and server status

### 6. **Reset App Data**

If issues persist, try clearing app data:

1. Uninstall the app
2. Reinstall it
3. Try again

Or clear AsyncStorage programmatically (add to app temporarily).

## 📱 **Testing Steps**

1. **Start Backend:**
   ```bash
   npm run dev
   ```

2. **Update IP Address** (if needed):
   - Edit `mobile-app/src/services/api.ts`
   - Update line 5 with your current IP

3. **Start Mobile App:**
   ```bash
   cd mobile-app
   npm start
   ```

4. **Try to Register:**
   - Fill in name, email, password
   - Click "Sign up"
   - Check console for logs

5. **Try to Login:**
   - Use the email/password you just registered
   - Click "Log in"
   - Check console for logs

## 🐛 **Debug Mode**

The app now logs all API calls. Check your terminal/console for:
- `[API] Attempting login to: ...`
- `[API] Login response: ...`
- `[API] Login error: ...`

These will help identify exactly what's going wrong.

## ✅ **Expected Behavior**

**Successful Login:**
- Console shows: `[API] Login response: { message: "Login successful", user: {...} }`
- App navigates to dashboard
- User is logged in

**Successful Registration:**
- Console shows: `[API] Register response: { message: "User registered successfully", user: {...} }`
- App navigates to dashboard
- User is logged in

## 📞 **Still Having Issues?**

1. Check backend server is running
2. Verify IP address is correct
3. Check console logs for error messages
4. Make sure phone and computer are on same network
5. Try accessing API from phone browser first
