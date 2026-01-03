# Migration Instructions - Add Company Info Columns to Users Table

If you're seeing that the `address`, `companyEmail`, and `website` columns are missing from the `users` table, follow these steps:

## Option 1: Run the SQL Migration Script (Recommended)

1. Connect to your MySQL database
2. Run the SQL script:

```bash
mysql -u your_username -p admin_panel_db < scripts/add-company-info-columns.sql
```

Or manually execute the SQL commands in your MySQL client:

```sql
USE admin_panel_db;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address VARCHAR(500) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS companyEmail VARCHAR(255) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;
```

## Option 2: Run the Node.js Migration Script

1. Make sure you have your `.env.local` file configured with database credentials
2. Run the migration script:

```bash
node scripts/add-company-info-columns.js
```

This script will:
- Check if the columns already exist
- Add only the missing columns
- Verify the migration was successful

## Option 3: Automatic Migration (Already Implemented)

The registration API automatically adds these columns when a new user registers. However, if you have existing users, you should run one of the migration scripts above.

## Verify the Migration

After running the migration, verify the columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'admin_panel_db' 
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
ORDER BY COLUMN_NAME;
```

You should see:
- `address` (VARCHAR(500), NULL)
- `companyEmail` (VARCHAR(255), NULL)
- `website` (VARCHAR(255), NULL)

## Notes

- These columns are optional (NULL allowed)
- Existing users will have NULL values for these fields until they update their profile
- New users registering will have these fields saved automatically

