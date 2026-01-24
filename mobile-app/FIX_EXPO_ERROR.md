# Fix for Expo "node:sea" Directory Error

## The Problem
Expo is trying to create a directory with `node:sea` which contains a colon `:`. Windows doesn't allow colons in directory names, causing the error.

## Solution 1: Use Web Mode (Easiest - Test First!)

Try running the app in web browser first:

```powershell
cd mobile-app
npm start -- --web
```

This will open the app in your browser and you can test it there first!

## Solution 2: Use Tunnel Mode

Tunnel mode bypasses local file system issues:

```powershell
cd mobile-app
npx expo start --tunnel
```

## Solution 3: Update Expo CLI

The latest Expo CLI might have a fix:

```powershell
cd mobile-app
npm install -g @expo/cli@latest
npm start
```

## Solution 4: Use the Fix Script

I created a script that should work:

```powershell
cd mobile-app
.\start-expo.ps1
```

## Solution 5: Downgrade Expo (If nothing else works)

If all else fails, we can try Expo 49:

```powershell
cd mobile-app
npm install expo@~49.0.0
npm start
```

## Quick Test: Web Browser

**Easiest way to test right now:**

```powershell
cd mobile-app
npm start -- --web
```

Then press `w` when prompted, or it will open automatically in your browser!

---

**Try Solution 1 (Web Mode) first - it's the quickest way to see if the app works!**
