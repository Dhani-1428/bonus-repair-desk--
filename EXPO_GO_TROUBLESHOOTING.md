# Expo Go Connection Troubleshooting Guide

## Current Configuration
- **API Base URL**: `http://192.168.0.10:3000/api`
- **Backend Server**: Next.js with `-H 0.0.0.0` flag

## Step-by-Step Troubleshooting

### 1. Verify Backend Server is Running

**Check if server is running:**
```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

**Expected output:**
```
- Local:        http://localhost:3000
- Network:      http://192.168.0.10:3000
```

**If you see "Network" URL, server is accessible from your network!**

### 2. Verify Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Common IP ranges:**
- `192.168.0.x` (your current setting)
- `192.168.1.x`
- `10.0.0.x`

**Update `mobile-app/src/services/api.ts` line 5 if IP is different!**

### 3. Test Connection from Phone Browser

**On your phone's browser (Chrome/Safari), try:**
```
http://192.168.0.10:3000/api/auth/login
```

**Expected results:**
- ✅ **Loads (even with error)**: Connection works! Proceed to step 4.
- ❌ **Doesn't load**: Connection issue. Check:
  - Backend server is running
  - IP address is correct
  - Phone and computer on same WiFi
  - Firewall allows port 3000

### 4. Check Windows Firewall

**Allow port 3000:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. TCP, Specific local ports: `3000`
6. Allow the connection
7. Apply to all profiles
8. Name it "Next.js Dev Server"

### 5. Verify Same WiFi Network

**Both devices must be on the same WiFi:**
- Check WiFi name on computer
- Check WiFi name on phone
- They must match exactly!

**Note:** Some routers have "Guest Network" isolation - make sure both devices are on the main network, not guest network.

### 6. Restart Everything

**Complete restart sequence:**
1. Stop backend server (Ctrl+C)
2. Stop Expo server (Ctrl+C)
3. Restart backend: `npm run dev`
4. Wait for "Network" URL to appear
5. Restart Expo: `cd mobile-app && npm run dev`
6. Reload app in Expo Go

### 7. Alternative: Use Tunnel Mode

**If LAN connection doesn't work, use Expo tunnel:**
```bash
cd mobile-app
expo start --tunnel
```

This creates a tunnel that works even on different networks, but may be slower.

## Quick Diagnostic Commands

**Check if port 3000 is listening:**
```bash
netstat -an | findstr :3000
```

**Test backend from computer:**
```bash
curl http://192.168.0.10:3000/api/auth/login
```

**Check network connectivity:**
```bash
ping 192.168.0.10
```

## Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution:** 
- Verify backend is running with `npm run dev`
- Check IP address matches `ipconfig` output
- Test in phone browser first

### Issue: "Connection timeout"
**Solution:**
- Check Windows Firewall settings
- Verify both devices on same WiFi
- Try tunnel mode: `expo start --tunnel`

### Issue: "Network request failed"
**Solution:**
- Restart backend server
- Restart Expo server
- Reload app in Expo Go (shake device → Reload)

### Issue: IP address keeps changing
**Solution:**
- Set static IP on your computer
- Or update `api.ts` each time IP changes
- Or use tunnel mode (slower but more reliable)

## Still Not Working?

1. **Check backend logs** - Look for any errors when starting `npm run dev`
2. **Check Expo logs** - Look for network-related errors
3. **Try different IP** - Your router might assign different IPs
4. **Use tunnel mode** - `expo start --tunnel` (works but slower)
5. **Test with Postman/curl** - Verify backend API works from computer

## Success Indicators

✅ Backend shows "Network: http://192.168.0.10:3000"  
✅ Phone browser can access `http://192.168.0.10:3000/api/auth/login`  
✅ Expo Go app loads without network errors  
✅ Login attempt shows detailed logs in console  
