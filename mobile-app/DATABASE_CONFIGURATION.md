# 🗄️ Database Configuration - Mobile App

## ✅ **The Mobile App Already Uses the Same Database!**

### How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Mobile App │  ────>  │  Backend API │  ────>  │  Database   │
│             │  HTTP   │  (Next.js)   │  MySQL  │  (Aiven)     │
│  No DB      │         │  Has DB      │         │              │
│  Credentials│         │  Credentials │         │              │
└─────────────┘         └──────────────┘         └─────────────┘
```

**The mobile app connects to the backend API, which connects to the database using these credentials:**

---

## 🔌 Current Database Configuration

Based on your terminal output, the backend is using:

```
DB_HOST: mysql-2d15... (Aiven cloud database)
DB_PORT: 21649
DB_USER: avnadmin
DB_PASSWORD: *** (set)
DB_NAME: defaultdb
DB_SSL: true
```

**This is the same database used by:**
- ✅ Website (Next.js frontend)
- ✅ Backend API (Next.js API routes)
- ✅ Mobile App (through backend API)

---

## 📋 Configuration Files

### Backend Database Connection
**File:** `lib/mysql.ts`

This file uses environment variables to connect to the database:
```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // mysql-2d15...
  port: parseInt(process.env.DB_PORT || "3306"),  // 21649
  user: process.env.DB_USER,        // avnadmin
  password: process.env.DB_PASSWORD, // (from .env)
  database: process.env.DB_NAME,     // defaultdb
  ssl: getSSLConfig(),              // true
  // ...
})
```

### Mobile App API Connection
**File:** `mobile-app/src/services/api.ts`

The mobile app connects to the backend API (not directly to database):
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Backend API URL
  : 'https://your-website.com/api';
```

**The mobile app does NOT need database credentials because it connects through the API!**

---

## ✅ Verification

### 1. **Backend is Using Correct Database**

Check your backend terminal - you should see:
```
[MySQL] Connection config: {
  host: 'mysql-2d15...',
  port: 21649,
  user: 'avnadmin',
  database: 'defaultdb',
  ssl: 'enabled'
}
```

### 2. **Mobile App Connects to Backend**

The mobile app makes API calls to:
- `http://172.20.10.6:3000/api/auth/login`
- `http://172.20.10.6:3000/api/repairs`
- etc.

These API endpoints use the database configured in `lib/mysql.ts`.

### 3. **Same Data Everywhere**

When you:
- Create a user in mobile app → Saved to database via API
- Create a ticket in website → Saved to same database
- View data in mobile app → Reads from same database via API
- View data in website → Reads from same database

**All using the same database!** ✅

---

## 🔧 Environment Variables

The database credentials are stored in environment variables:

### Local Development (`.env` file)
```env
DB_HOST=mysql-2d15...your-full-hostname.aivencloud.com
DB_PORT=21649
DB_USER=avnadmin
DB_PASSWORD=your-actual-password
DB_NAME=defaultdb
DB_SSL=true
```

### Production (Vercel Environment Variables)
Same variables set in Vercel dashboard:
- Settings → Environment Variables
- All 6 variables should be set
- Make sure "Production" environment is selected

---

## 📱 Mobile App Configuration

**The mobile app does NOT need database credentials!**

It only needs:
1. **Backend API URL** (already configured)
   - Development: `http://172.20.10.6:3000/api`
   - Production: `https://your-website.com/api` (update when ready)

2. **Backend Server Running**
   - The backend must be running for mobile app to work
   - Backend connects to database using environment variables

---

## ✅ Summary

**Current Status:**
- ✅ Backend is configured with database credentials
- ✅ Mobile app connects to backend API
- ✅ Backend API connects to database
- ✅ **Mobile app uses the same database through the API!**

**No additional configuration needed for mobile app!**

The mobile app automatically uses the same database because:
1. Mobile app → Backend API (HTTP requests)
2. Backend API → Database (MySQL connection using env vars)
3. Same database for both website and mobile app ✅

---

## 🔍 Testing

To verify everything is connected:

1. **Check backend logs:**
   - Should show: `[MySQL] Connection config: ...`
   - Should show: `[MySQL] New connection established`

2. **Test from mobile app:**
   - Register a new user
   - Check if it appears in website
   - Create a ticket in mobile app
   - Check if it appears in website

3. **Test from website:**
   - Create a ticket
   - Check if it appears in mobile app

If all work, they're using the same database! ✅

---

## 📝 Important Notes

- **Mobile app does NOT connect directly to database**
- **Mobile app connects through backend API**
- **Backend API has database credentials**
- **This is the correct and secure architecture**
- **Both website and mobile app share the same data**

---

## 🚀 Production

When you deploy to production:

1. **Backend (Vercel):**
   - Environment variables already set in Vercel
   - Database credentials are configured
   - API endpoints work automatically

2. **Mobile App:**
   - Update production URL in `api.ts`:
     ```typescript
     const API_BASE_URL = __DEV__ 
       ? 'http://172.20.10.6:3000/api'
       : 'https://your-actual-domain.com/api'; // ← Update this
     ```
   - No database credentials needed
   - Connects to production API
   - Production API uses same database

**Everything is already configured correctly!** ✅
