# 🗄️ Database Connection - Mobile App & Website

## ✅ **They're Already Connected to the Same Database!**

### How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Mobile App │  ────>  │  Backend API │  ────>  │  Database   │
│  (React     │  HTTP   │  (Next.js)   │  MySQL  │  (MySQL)    │
│   Native)   │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                              ▲
                              │
                        ┌─────┴─────┐
                        │  Website  │
                        │  (Next.js)│
                        └───────────┘
```

**Both the mobile app and website connect to the same backend API, which connects to the same database!**

---

## 🔌 Current Configuration

### Mobile App
- **API URL:** `http://172.20.10.6:3000/api` (development)
- **Location:** `mobile-app/src/services/api.ts`
- **Connection:** HTTP requests to backend API

### Website
- **API URL:** Same backend server (`localhost:3000/api` or production URL)
- **Location:** `app/api/` directory
- **Connection:** Direct API routes (Next.js)

### Backend API
- **Database:** MySQL (configured in `lib/mysql.ts`)
- **Connection:** Uses environment variables:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `DB_SSL`

---

## ✅ Verification

### 1. **Same API Endpoints**

Both mobile app and website use the same API endpoints:

- ✅ `/api/auth/login` - Login
- ✅ `/api/auth/register` - Register
- ✅ `/api/users` - User management
- ✅ `/api/repairs` - Repair tickets
- ✅ `/api/team-members` - Team management
- ✅ `/api/payments` - Payments/subscriptions

### 2. **Same Database**

Both connect to the same database through:
- **Website:** Direct connection via `lib/mysql.ts`
- **Mobile App:** Indirect connection via backend API (which uses `lib/mysql.ts`)

### 3. **Same Data**

When you:
- Create a user in the mobile app → It's saved to the database
- Create a ticket in the website → It's saved to the same database
- View data in mobile app → It reads from the same database
- View data in website → It reads from the same database

**They share the same data!** ✅

---

## 🔧 Configuration Files

### Mobile App API Configuration
**File:** `mobile-app/src/services/api.ts`
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Development
  : 'https://your-website.com/api'; // Production (update this!)
```

### Backend Database Configuration
**File:** `lib/mysql.ts`
```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: getSSLConfig(),
  // ...
})
```

### Environment Variables
**File:** `.env` (or Vercel environment variables)
```
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_SSL=true
```

---

## 🚀 Production Setup

When you deploy to production:

### 1. **Update Mobile App Production URL**

Edit `mobile-app/src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'
  : 'https://your-actual-domain.com/api'; // ← Update this!
```

### 2. **Backend Uses Same Database**

The backend (website) will use the same database configuration:
- Same environment variables
- Same database connection
- Same data

### 3. **Both Access Same Data**

- Mobile app → Production API → Production Database
- Website → Production API → Production Database

**Same database, same data!** ✅

---

## ✅ Summary

**Current Status:**
- ✅ Mobile app connects to backend API
- ✅ Website uses backend API
- ✅ Backend API connects to database
- ✅ **Both use the same database!**

**No additional configuration needed!** The mobile app and website are already sharing the same database through the backend API.

---

## 🔍 Testing

To verify they're using the same database:

1. **Create a user in mobile app:**
   - Register a new account
   - Check if you can see it in the website

2. **Create a ticket in website:**
   - Create a repair ticket
   - Check if you can see it in the mobile app

3. **Update data in mobile app:**
   - Update user profile
   - Check if changes appear in website

If all work, they're sharing the same database! ✅

---

## 📝 Notes

- The mobile app **does NOT** connect directly to the database
- The mobile app connects to the **backend API**
- The backend API connects to the database
- This is the **correct architecture** for security and maintainability
- Both mobile app and website share the same data through the backend API
