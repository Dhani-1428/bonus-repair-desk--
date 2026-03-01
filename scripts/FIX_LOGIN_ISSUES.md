# Fix Login Issues Guide

If you're getting "Invalid email or password" errors, follow these steps:

## Quick Fix Steps

### Step 1: Find Your Account

Check if your account exists in the database:

```bash
npm run find-user
```

Or search for a specific email:

```bash
node scripts/find-user-account.js "your-email@example.com"
```

### Step 2: Check Password Format

Verify your password is stored correctly:

```bash
npm run fix-password
```

This will show all users and their password format status.

### Step 3: Reset Password

If your account exists but password doesn't work, reset it:

```bash
node scripts/check-and-fix-user-password.js "your-email@example.com" "your-new-password"
```

**Example:**
```bash
node scripts/check-and-fix-user-password.js "user@example.com" "MyNewPassword123"
```

## Common Scenarios

### Scenario 1: Account Not Found

If your account doesn't exist in the database:

1. **Register a new account** through the registration page
2. **Or** use the super admin account to create users:
   - Email: `superadmin@admin.com`
   - Password: `superadmin123`

### Scenario 2: Password Doesn't Work

If your account exists but password is incorrect:

1. Reset the password using the script above
2. Try logging in with the new password
3. Make sure there are no extra spaces in the email field

### Scenario 3: Super Admin Account

If you're trying to use the super admin account:

- **Email:** `superadmin@admin.com`
- **Password:** `superadmin123`

To reset super admin password:
```bash
node scripts/check-and-fix-user-password.js "superadmin@admin.com" "new-password"
```

## Data Safety

✅ **All scripts are safe:**
- No data will be deleted
- Only passwords can be reset (if you choose to)
- All other user data remains intact
- Scripts use `UPDATE` only for passwords, never `DELETE`

## Troubleshooting

### Still Can't Login?

1. **Check email case sensitivity:**
   - The login is case-insensitive, but try different cases
   - Remove any extra spaces before/after email

2. **Check browser:**
   - Clear browser cache
   - Try incognito/private mode
   - Try a different browser

3. **Check server logs:**
   - Look for error messages in the console
   - Check if database connection is working

4. **Verify database:**
   ```bash
   npm run verify-db
   ```

## Available Scripts

- `npm run find-user` - Find user accounts
- `npm run fix-password` - Check and fix password format
- `npm run verify-db` - Verify database tables
- `npm run fix-admin` - Fix super admin account

## Need Help?

If you still can't login:

1. Run: `npm run find-user` to see all accounts
2. Check if your email exists
3. If it exists, reset password using the fix-password script
4. If it doesn't exist, register a new account or contact support
