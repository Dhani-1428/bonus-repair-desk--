# 🔐 Login Workflow & API Documentation

## Overview

Your application uses a **full-stack authentication system** with:
- **Frontend**: React/Next.js client-side
- **Backend API**: Next.js API routes (server-side)
- **Database**: MySQL database
- **Mobile App**: React Native app connecting to the same backend

---

## 🔄 Complete Login Flow

### 1. **User Login Request** (Frontend)
**File**: `app/login/page.tsx`

```typescript
User enters email/password → handleSubmit() → calls login() from useAuth hook
```

### 2. **Auth Hook** (Frontend)
**File**: `hooks/use-auth.tsx`

```typescript
login(email, password) → Makes API call to /api/auth/login
```

**What it does:**
- Sends POST request to `/api/auth/login`
- Handles network errors and timeouts
- Stores user data in `sessionStorage`
- Checks subscription status after login
- Redirects to dashboard or subscription page

### 3. **Backend API Endpoint** (Server)
**File**: `app/api/auth/login/route.ts`

**Endpoint**: `POST /api/auth/login`

**What it does:**
1. ✅ Validates email and password
2. ✅ Queries MySQL database for user
3. ✅ Compares password using `bcrypt.compare()`
4. ✅ Logs login history
5. ✅ Returns user data (password excluded)
6. ✅ Sends login notification emails (non-blocking)

**Database Query:**
```sql
SELECT * FROM users WHERE LOWER(email) = LOWER(?)
```

**Password Verification:**
```typescript
const isPasswordValid = await bcrypt.compare(password, user.password)
```

### 4. **Database Connection**
**File**: `lib/mysql.ts`

**Connection Details:**
- Uses MySQL2 library
- Connects to MySQL database
- Environment variables:
  - `DB_HOST` - Database host
  - `DB_USER` - Database username
  - `DB_PASSWORD` - Database password
  - `DB_NAME` - Database name
  - `DB_PORT` - Database port (default: 3306)

---

## 📡 API Endpoints Connected

### Authentication APIs

1. **Login**
   - **Endpoint**: `POST /api/auth/login`
   - **File**: `app/api/auth/login/route.ts`
   - **Purpose**: Authenticate user with email/password
   - **Returns**: User data (without password)

2. **Register**
   - **Endpoint**: `POST /api/auth/register`
   - **File**: `app/api/auth/register/route.ts`
   - **Purpose**: Create new user account
   - **Returns**: User data

### Subscription APIs

3. **Get Subscription**
   - **Endpoint**: `GET /api/subscriptions?userId={id}`
   - **File**: `app/api/subscriptions/route.ts`
   - **Purpose**: Get user's subscription status

4. **Create/Update Subscription**
   - **Endpoint**: `POST /api/subscriptions`
   - **File**: `app/api/subscriptions/route.ts`
   - **Purpose**: Create or update subscription

### Payment APIs

5. **Create Payment Request**
   - **Endpoint**: `POST /api/payments`
   - **File**: `app/api/payments/route.ts`
   - **Purpose**: Submit payment request for approval

6. **Approve Payment**
   - **Endpoint**: `PUT /api/payments` or `GET /api/payments/approve`
   - **File**: `app/api/payments/route.ts` or `app/api/payments/approve/route.ts`
   - **Purpose**: Approve payment and activate subscription

### Data APIs

7. **Repair Tickets**
   - **Endpoint**: `GET /api/repairs?userId={id}`
   - **File**: `app/api/repairs/route.ts`
   - **Purpose**: Get user's repair tickets

8. **Team Members**
   - **Endpoint**: `GET /api/team-members?userId={id}`
   - **File**: `app/api/team-members/route.ts`
   - **Purpose**: Get user's team members

9. **Analytics**
   - **Endpoint**: `GET /api/analytics?userId={id}`
   - **File**: `app/api/analytics/route.ts`
   - **Purpose**: Get analytics data

---

## 🗄️ Database Structure

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255), -- Hashed with bcrypt
  role ENUM('USER', 'SUPER_ADMIN'),
  shopName VARCHAR(255),
  contactNumber VARCHAR(255),
  tenantId VARCHAR(36),
  ...
)
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH'),
  status ENUM('ACTIVE', 'EXPIRED', 'PENDING', 'FREE_TRIAL'),
  startDate DATETIME,
  endDate DATETIME,
  paymentStatus ENUM('PENDING', 'APPROVED', 'REJECTED'),
  ...
)
```

### Login History Table
```sql
CREATE TABLE login_history (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  tenantId VARCHAR(36),
  ip VARCHAR(255),
  createdAt DATETIME
)
```

---

## 📱 Mobile App Connection

**File**: `mobile-app/src/services/api.ts`

**Base URL Configuration:**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.11:3000/api'  // Local development
  : 'https://your-website.com/api'; // Production
```

**Mobile App Login Flow:**
1. User enters credentials in mobile app
2. App calls `apiService.login(email, password)`
3. Makes POST request to `${API_BASE_URL}/auth/login`
4. Same backend API handles authentication
5. Returns user data to mobile app
6. Mobile app stores token in AsyncStorage

**Connected Endpoints:**
- ✅ `/api/auth/login` - Login
- ✅ `/api/auth/register` - Registration
- ✅ `/api/repairs` - Get tickets
- ✅ `/api/team-members` - Team management
- ✅ `/api/subscriptions` - Subscription status
- ✅ `/api/payments` - Payment requests

---

## 🔒 Security Features

1. **Password Hashing**
   - Passwords are hashed using `bcrypt` before storing
   - Never sent or stored in plain text

2. **Password Verification**
   - Uses `bcrypt.compare()` to verify passwords
   - Secure comparison prevents timing attacks

3. **Session Storage**
   - User data stored in `sessionStorage` (client-side)
   - Password never stored in sessionStorage
   - Token-based authentication

4. **Database Security**
   - SQL injection prevention using parameterized queries
   - Case-insensitive email matching
   - Input validation on all endpoints

5. **Error Handling**
   - Generic error messages (don't reveal user existence)
   - Detailed logging on server-side only
   - Network timeout handling

---

## 🔄 Complete Authentication Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Enter email/password
       ▼
┌─────────────────────┐
│  Login Page          │
│  (app/login/page.tsx)│
└──────┬───────────────┘
       │
       │ 2. Call login()
       ▼
┌─────────────────────┐
│  useAuth Hook        │
│  (hooks/use-auth.tsx)│
└──────┬───────────────┘
       │
       │ 3. POST /api/auth/login
       ▼
┌─────────────────────┐
│  API Route           │
│  (/api/auth/login)   │
└──────┬───────────────┘
       │
       │ 4. Query database
       ▼
┌─────────────────────┐
│  MySQL Database      │
│  (lib/mysql.ts)      │
└──────┬───────────────┘
       │
       │ 5. Verify password
       │ 6. Return user data
       ▼
┌─────────────────────┐
│  Store in            │
│  sessionStorage      │
└──────┬───────────────┘
       │
       │ 7. Check subscription
       ▼
┌─────────────────────┐
│  Redirect to         │
│  Dashboard/          │
│  Subscription        │
└─────────────────────┘
```

---

## 🧪 Testing the API

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Expected Response

```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "shopName": "Shop Name",
    "tenantId": "tenant-id"
  }
}
```

---

## ✅ Summary

**Yes, your app has a complete backend API connected!**

- ✅ **Backend API**: Next.js API routes (`/api/*`)
- ✅ **Database**: MySQL database
- ✅ **Authentication**: Secure password hashing with bcrypt
- ✅ **Session Management**: sessionStorage for web, AsyncStorage for mobile
- ✅ **Mobile App**: Connects to same backend API
- ✅ **All Features**: Login, Register, Subscriptions, Payments, Tickets, etc.

**All API endpoints are server-side and connect to your MySQL database!**
