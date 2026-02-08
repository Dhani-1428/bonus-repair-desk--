# Fix DBeaver "Table Not Found" Error

## Error Message
```
Navigator node 'node://General/datasources/mysql8-.../database/admin_panel_db/table/tenant_..._repair_tickets' not found
```

## Quick Fixes

### Solution 1: Refresh DBeaver Connection (Most Common)
1. In DBeaver, right-click on your MySQL connection
2. Select **"Refresh"** or **"Disconnect"** then **"Connect"**
3. Expand the database tree: `admin_panel_db` → Tables
4. The table should now appear

### Solution 2: Close and Reopen Table Editor
1. Close the table editor tab showing the error
2. Navigate to the table in the database navigator
3. Right-click the table → **"Open Table"** or double-click it

### Solution 3: Verify Table Exists
Run this SQL query in DBeaver to check if the table exists:

```sql
-- Check if the specific table exists
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'admin_panel_db'
  AND TABLE_NAME = 'tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_repair_tickets';

-- List all tenant tables
SHOW TABLES LIKE 'tenant_%';
```

### Solution 4: Recreate DBeaver Connection
If the table exists but DBeaver can't see it:
1. In DBeaver, right-click your MySQL connection
2. Select **"Edit Connection"**
3. Click **"Test Connection"** to verify it works
4. Click **"OK"** to save
5. Refresh the connection

### Solution 5: Check Database Connection Settings
1. Verify you're connected to the correct database (`admin_panel_db`)
2. Check if you have the right permissions
3. Verify the connection is active (green icon)

### Solution 6: Clear DBeaver Cache
1. Close DBeaver
2. Delete DBeaver cache (location varies by OS):
   - Windows: `%APPDATA%\DBeaverData\workspace6\.metadata`
   - Mac: `~/Library/DBeaverData/workspace6/.metadata`
   - Linux: `~/.dbeaver/workspace6/.metadata`
3. Restart DBeaver and reconnect

## Verify Table Exists in Database

Run this to find your tenant ID and table name:

```sql
-- Get user's tenant ID
SELECT id, name, email, tenantId 
FROM users 
WHERE email = 'your-email@example.com';

-- Then check if the table exists (replace tenantId with dashes replaced by underscores)
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'admin_panel_db' 
  AND TABLE_NAME LIKE 'tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_%';
```

## If Table Doesn't Exist

The table will be automatically created when:
- A user creates their first repair ticket through the application
- The API is called and detects missing tenant tables

You can also manually trigger table creation by logging into the application as that user and creating a ticket.

## Still Having Issues?

1. Check DBeaver logs: **Help** → **Show Log**
2. Verify MySQL server is running
3. Check database connection credentials
4. Try connecting with a different MySQL client to verify the table exists
