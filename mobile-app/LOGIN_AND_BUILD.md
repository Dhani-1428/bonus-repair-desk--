# 🔐 Login & Build APK - Step by Step

## Quick Steps to Get Your APK

### Step 1: Login to Expo (Required First Time)

Open PowerShell or Command Prompt in the `mobile-app` folder and run:

```powershell
eas login
```

**What happens:**
- It will ask for your email/username
- If you don't have an account, create one at: https://expo.dev/signup (it's FREE!)
- It will open a browser for you to confirm login
- Once logged in, you're ready to build!

### Step 2: Build Your APK

After logging in, run:

```powershell
eas build --platform android --profile preview
```

**This takes 10-20 minutes** - grab a coffee! ☕

### Step 3: Download Your APK

When build completes, you'll see:
- **A download URL** in the terminal - copy and open it!
- **OR** go to https://expo.dev → Login → Builds → Download APK

### Step 4: Install on Android Phone

1. Transfer APK to your phone (email, USB, cloud)
2. Enable "Install from unknown sources" in phone settings
3. Tap the APK file → Install → Open

---

## 🚀 All-in-One Commands

Copy and paste these one by one:

```powershell
cd mobile-app
eas login
eas build --platform android --profile preview
```

---

## ✅ That's It!

Your APK will be ready to download and install!
