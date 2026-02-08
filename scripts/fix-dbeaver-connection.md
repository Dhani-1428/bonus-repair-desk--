# Fixing DBeaver "Table Not Found" Error

## Problem
DBeaver shows error: `Navigator node 'node://General/datasources/mysql8-.../table/tenant_..._repair_tickets' not found`

## Possible Causes

1. **Table doesn't exist** - The tenant table was never created
2. **Connection changed** - DBeaver's connection view is outdated
3. **Table was deleted** - The table was manually deleted from the database
4. **Wrong database** - Connection is pointing to a different database

## Solutions

### Solution 1: Refresh DBeaver Connection
1. In DBeaver, right-click on your MySQL connection
2. Select "Refresh" or "Disconnect" then "Connect"
3. Expand the database and check if the table appears

### Solution 2: Check if Table Exists
Run this SQL query in DBeaver:

```sql
-- Check if the table exists
SHOW TABLES LIKE 'tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_%';
```

Replace `1c92f2be-8821-43d7-849d-37e6ca185b29` with your actual tenantId.

### Solution 3: Recreate the Table
If the table doesn't exist, it will be automatically created when:
- A user creates their first repair ticket
- The API is called and detects missing tables

You can also manually trigger table creation by:
1. Logging into the application as that user
2. Creating a new repair ticket
3. The system will automatically create the tenant tables

### Solution 4: Close and Reopen DBeaver Editor
1. Close the table editor tab in DBeaver
2. Navigate to the table in the database navigator
3. Double-click to reopen it

### Solution 5: Check Database Connection
1. Verify you're connected to the correct database (`admin_panel_db`)
2. Check if you have the right permissions to view tables
3. Try reconnecting to the database

## Finding Your Tenant ID

To find the correct tenantId for a user:

```sql
SELECT id, name, email, tenantId 
FROM users 
WHERE email = 'user@example.com';
```

Then use that tenantId to construct the table name:
- Format: `tenant_{tenantId_with_dashes_replaced_by_underscores}_repair_tickets`
- Example: `tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_repair_tickets`
