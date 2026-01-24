# Update App for Production Publishing

## Before Building for Stores:

### 1. Update API URL

Edit `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Development
  : 'https://your-actual-website.com/api'; // CHANGE THIS to your real website!
```

**Replace `your-actual-website.com` with your production website URL!**

### 2. Update App Details

Edit `app.json` - I've already set:
- ✅ Name: "Bonus Repair Desk"
- ✅ Bundle ID: com.bonusrepairdesk.app
- ✅ Package: com.bonusrepairdesk.app

**You may want to change the bundle ID to something unique to you!**

### 3. Create App Icons

Add these files to `assets/` folder:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)

### 4. Test Everything

Before publishing:
- [ ] Test login/registration
- [ ] Test all features
- [ ] Test on real devices
- [ ] Make sure API works with production URL

---

**Then you're ready to build and publish!**
