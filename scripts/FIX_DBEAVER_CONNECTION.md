# Fix DBeaver Connection Issues

If you're seeing errors like "Navigator node 'table/subscription_history' not found" in DBeaver, follow these steps:

## Quick Fix Steps

1. **Refresh the Connection**
   - In DBeaver, right-click on your database connection
   - Select "Refresh" or press `F5`
   - This will reload the database structure

2. **Verify Tables Exist**
   - Run the verification script:
     ```bash
     npm run verify-db
     ```
   - This will confirm all tables exist and show their structure

3. **Reconnect if Needed**
   - Disconnect from the database (right-click → Disconnect)
   - Reconnect (right-click → Connect)
   - Refresh again

## Verify Database Tables

All required tables should exist:
- ✅ `users`
- ✅ `subscriptions`
- ✅ `subscription_history`
- ✅ `login_history`
- ✅ `payment_requests`

## Run Database Fix Scripts

If tables are missing, run:

```bash
# Verify and fix all tables
npm run verify-db

# Add any missing columns
npm run add-columns

# Recreate all tables (if needed - safe, won't delete data)
npm run create-tables
```

## Common Issues

### Issue: "Table not found" in DBeaver but table exists
**Solution:** This is usually a DBeaver cache issue. Refresh the connection (F5).

### Issue: Missing columns
**Solution:** Run `npm run add-columns` to safely add missing columns.

### Issue: Connection view changed
**Solution:** 
1. Close the table editor in DBeaver
2. Refresh the connection
3. Reopen the table from the database navigator

## Data Safety

All scripts use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, so:
- ✅ No existing data will be deleted
- ✅ No existing columns will be removed
- ✅ Only missing tables/columns will be added

## Verify Everything Works

After fixing, verify:
1. All tables are visible in DBeaver
2. You can query tables: `SELECT * FROM subscription_history LIMIT 1;`
3. Application can login successfully

## Still Having Issues?

1. Check your `.env` file has correct database credentials
2. Verify database connection is working: `npm run verify-db`
3. Check DBeaver connection settings match your `.env` file
4. Try disconnecting and reconnecting in DBeaver
