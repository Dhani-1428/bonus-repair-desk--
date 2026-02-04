# 🚀 How to Run the Backend Server

## Overview

Your backend is a **Next.js application** that runs both the frontend and API routes. The backend includes:
- ✅ API endpoints (`/api/*`)
- ✅ Database connection (MySQL)
- ✅ Authentication system
- ✅ All server-side logic

---

## 🎯 Quick Start

### **Method 1: Simple Command** (Recommended)

```bash
# Navigate to project root
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"

# Start the backend server
npm run dev
```

**That's it!** The backend will start on `http://localhost:3000`

---

## 📋 Prerequisites

Before running the backend, make sure you have:

1. **Node.js installed** (version 18.x or higher)
   ```bash
   node --version
   ```

2. **Dependencies installed**
   ```bash
   npm install
   ```

3. **Database configured** (MySQL)
   - Set up environment variables (`.env` file)
   - Database should be accessible

---

## 🔧 Environment Variables

Create a `.env` file in the project root with:

```env
# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306

# Optional: SSL Configuration
DB_SSL=false

# Email Configuration (for sending emails)
EMAIL_PASSWORD=your-gmail-app-password

# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🚀 Starting the Backend

### **Development Mode** (Recommended for development)

```bash
npm run dev
```

**What happens:**
- ✅ Starts Next.js development server
- ✅ Runs on `http://localhost:3000`
- ✅ Hot reload enabled (auto-refreshes on code changes)
- ✅ Shows detailed error messages
- ✅ API routes available at `/api/*`

**You'll see:**
```
▲ Next.js 16.0.10
- Local:        http://localhost:3000
- Ready in X seconds
```

### **Production Mode** (For production deployment)

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 📡 Backend API Endpoints

Once the backend is running, these endpoints are available:

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### **Subscriptions**
- `GET /api/subscriptions?userId={id}` - Get user subscription
- `POST /api/subscriptions` - Create/update subscription

### **Payments**
- `GET /api/payments` - Get payment requests
- `POST /api/payments` - Create payment request
- `PUT /api/payments` - Approve/reject payment

### **Repair Tickets**
- `GET /api/repairs?userId={id}` - Get tickets
- `POST /api/repairs/create` - Create ticket
- `PUT /api/repairs/{id}` - Update ticket
- `DELETE /api/repairs/{id}` - Delete ticket

### **Team Members**
- `GET /api/team-members?userId={id}` - Get team members
- `POST /api/team-members` - Add team member

### **Analytics**
- `GET /api/analytics?userId={id}` - Get analytics data

### **Test Endpoints**
- `GET /api/test-db` - Test database connection
- `GET /api/test-db-connection` - Test database connection

---

## 🗄️ Database Connection

The backend connects to MySQL database using:

**File**: `lib/mysql.ts`

**Connection Details:**
- Uses `mysql2` library
- Connection pooling for performance
- SSL support for cloud databases
- Automatic reconnection on errors

**To verify database connection:**
```bash
# Visit in browser or use curl
http://localhost:3000/api/test-db
```

---

## 🔍 Verifying Backend is Running

### **Check 1: Server Status**

Visit: `http://localhost:3000`

You should see the website homepage.

### **Check 2: API Endpoint**

Visit: `http://localhost:3000/api/test-db`

You should see JSON response with database status.

### **Check 3: Terminal Output**

Look for:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

---

## 🐛 Troubleshooting

### **Error: Port 3000 already in use**

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### **Error: Database connection failed**

**Solution:**
1. Check environment variables in `.env` file
2. Verify database is running
3. Test connection: `http://localhost:3000/api/test-db`
4. Check database credentials

### **Error: Module not found**

**Solution:**
```bash
# Reinstall dependencies
npm install
```

### **Error: Cannot find module 'mysql2'**

**Solution:**
```bash
npm install mysql2
```

---

## 📱 For Mobile App Development

If you're developing the mobile app, you need the backend running:

### **Option 1: Start from mobile-app folder**

```bash
cd mobile-app
npm run start-backend
```

This automatically starts the backend from the main project folder.

### **Option 2: Start manually**

**Terminal 1 (Backend):**
```bash
cd "C:\Users\sheet\Downloads\saa-s-admin-panel (1)"
npm run dev
```

**Terminal 2 (Mobile App):**
```bash
cd mobile-app
npm start
```

---

## 🎯 Complete Workflow

### **For Website Development:**

1. **Start backend:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Website: `http://localhost:3000`
   - API: `http://localhost:3000/api/*`

3. **Start coding!**
   - Frontend changes auto-reload
   - API changes require server restart

### **For Mobile App Development:**

1. **Start backend:**
   ```bash
   npm run dev
   ```
   Or from mobile-app folder:
   ```bash
   cd mobile-app
   npm run start-backend
   ```

2. **Start mobile app:**
   ```bash
   cd mobile-app
   npm start
   ```

3. **Connect phone:**
   - Scan QR code with Expo Go
   - App connects to backend API

---

## 🔐 Security Notes

- ✅ Passwords are hashed with `bcrypt` before storing
- ✅ SQL injection prevention (parameterized queries)
- ✅ Environment variables for sensitive data
- ✅ CORS protection
- ✅ Input validation on all endpoints

---

## 📊 Backend Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Backend +     │
│   Frontend)     │
└────────┬────────┘
         │
         │ API Routes
         │ (/api/*)
         ▼
┌─────────────────┐
│  lib/mysql.ts   │
│  (Database      │
│   Connection)   │
└────────┬────────┘
         │
         │ SQL Queries
         ▼
┌─────────────────┐
│  MySQL Database │
│  (Users,        │
│   Subscriptions,│
│   Tickets, etc.)│
└─────────────────┘
```

---

## ✅ Summary

**To run the backend:**

```bash
npm run dev
```

**That's it!** The backend runs on `http://localhost:3000` and provides:
- ✅ All API endpoints
- ✅ Database connection
- ✅ Authentication
- ✅ All server-side features

**The backend is part of your Next.js application - no separate server needed!**
