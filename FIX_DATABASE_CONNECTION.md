# Fix Database Connection Error

## Quick Fix Guide

If you're seeing: **"Database connection failed: Cannot resolve database hostname"**

### Step 1: Check Current Configuration

Visit this URL on your deployed app:
```
https://your-app.vercel.app/api/diagnose-db
```

Or if running locally:
```
http://localhost:3000/api/diagnose-db
```

This will show you exactly which environment variables are missing or incorrect.

### Step 2: Set Environment Variables in Vercel

**If you're using Vercel (Production):**

1. Go to: **https://vercel.com/dashboard**
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Add these 6 variables (exact names, uppercase):

   ```
   DB_HOST = mysql-2d150b00-dhani.d.aivencloud.com
   DB_PORT = 21649
   DB_USER = avnadmin
   DB_PASSWORD = (your Aiven password - get from Aiven console)
   DB_NAME = defaultdb
   DB_SSL = true
   ```

5. **IMPORTANT**: For each variable, make sure **"Production"** is selected in the Environment dropdown
6. Click **"Save"** for each variable

### Step 3: Verify Your Aiven Database Credentials

1. Go to: **https://console.aiven.io/**
2. Log in to your account
3. Click on your **MySQL service**
4. Go to **"Overview"** tab
5. Find **"Connection information"** section
6. Verify:
   - **Host**: Should match your `DB_HOST` value
   - **Port**: Should match your `DB_PORT` value
   - **Database**: Usually `defaultdb`
   - **User**: Usually `avnadmin`
   - **Password**: Click "Show" to reveal it

**If the hostname has changed**, update `DB_HOST` in Vercel with the new hostname.

### Step 4: Redeploy Your Application

**CRITICAL**: Environment variables only load when the app is deployed.

1. Go to **Deployments** tab in Vercel
2. Click the **three dots (⋯)** on your latest deployment
3. Click **"Redeploy"**
4. **Wait for deployment to complete** (this is essential!)

### Step 5: Test the Connection

After redeployment:

1. Visit: `https://your-app.vercel.app/api/test-db-connection`
2. You should see: `"success": true`
3. Try logging in again

### Step 6: If Still Not Working

1. **Check Vercel Logs**:
   - Go to **Deployments** → Latest Deployment → **Functions** tab
   - Look for `[MySQL] Environment check:` logs
   - This shows what environment variables are actually being read

2. **Double-check variable names**:
   - Must be exactly: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`
   - Case-sensitive! All uppercase
   - No spaces before or after names

3. **Verify environment scope**:
   - Each variable must have **Production** selected
   - If you're testing on a preview deployment, also select **Preview**

4. **Test with diagnose endpoint**:
   - Visit `/api/diagnose-db` to see detailed configuration status

## For Local Development

If you're running locally:

1. Create a `.env` file in the project root (same folder as `package.json`)
2. Add these lines:

   ```env
   DB_HOST=mysql-2d150b00-dhani.d.aivencloud.com
   DB_PORT=21649
   DB_USER=avnadmin
   DB_PASSWORD=your-actual-password-here
   DB_NAME=defaultdb
   DB_SSL=true
   ```

3. Replace `your-actual-password-here` with your actual Aiven password
4. Save the file
5. Restart your dev server: `npm run dev`
6. Test: `http://localhost:3000/api/test-db-connection`

## Common Issues

### Issue 1: Hostname Cannot Be Resolved (ENOTFOUND)
**Cause**: The database hostname is incorrect or the database server is down

**Fix**:
- Verify the hostname in Aiven console
- Update `DB_HOST` in Vercel if it has changed
- Redeploy after updating

### Issue 2: Environment Variables Not Set
**Cause**: Variables are missing or not set for the correct environment

**Fix**:
- Add all 6 required variables in Vercel
- Make sure "Production" is selected for each
- Redeploy after adding

### Issue 3: Wrong Database Name
**Cause**: `DB_NAME` doesn't match your actual database

**Fix**:
- Check your Aiven console for the correct database name
- Usually it's `defaultdb` for Aiven
- Update `DB_NAME` in Vercel and redeploy

### Issue 4: SSL Not Enabled
**Cause**: Aiven requires SSL but `DB_SSL` is not set to `true`

**Fix**:
- Set `DB_SSL = true` in Vercel
- Redeploy

## Quick Checklist

- [ ] All 6 variables added in Vercel: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`
- [ ] Each variable has "Production" environment selected
- [ ] Variable names are exactly correct (uppercase, with underscores)
- [ ] Values match your Aiven console (hostname, port, database name)
- [ ] Redeployed after adding/updating variables
- [ ] Tested with `/api/test-db-connection` endpoint
- [ ] Checked `/api/diagnose-db` for detailed status

## Still Need Help?

1. Visit `/api/diagnose-db` for detailed diagnostic information
2. Check Vercel function logs for `[MySQL] Environment check:`
3. Verify your Aiven database service is running and accessible
