-- Check if tenant table exists and list all tenant tables
-- Replace '1c92f2be-8821-43d7-849d-37e6ca185b29' with your actual tenantId

-- Step 1: Check if the specific table exists
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'admin_panel_db'
  AND TABLE_NAME = 'tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_repair_tickets';

-- Step 2: List all tenant tables for this tenant
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'admin_panel_db'
  AND TABLE_NAME LIKE 'tenant_1c92f2be_8821_43d7_849d_37e6ca185b29_%'
ORDER BY TABLE_NAME;

-- Step 3: Get the user's tenantId from the users table
SELECT 
    id,
    name,
    email,
    tenantId,
    CONCAT('tenant_', REPLACE(tenantId, '-', '_'), '_repair_tickets') AS expected_repair_tickets_table,
    CONCAT('tenant_', REPLACE(tenantId, '-', '_'), '_team_members') AS expected_team_members_table
FROM users
WHERE tenantId = '1c92f2be-8821-43d7-849d-37e6ca185b29';

-- Step 4: List ALL tenant tables in the database
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'admin_panel_db'
  AND TABLE_NAME LIKE 'tenant_%'
ORDER BY TABLE_NAME;
