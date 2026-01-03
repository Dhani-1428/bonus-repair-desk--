-- Add company information columns to users table
-- Run this script directly in your MySQL database (defaultdb or admin_panel_db)

-- Check current database
SELECT DATABASE() as current_database;

-- Add address column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address VARCHAR(500) DEFAULT NULL;

-- Add companyEmail column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS companyEmail VARCHAR(255) DEFAULT NULL;

-- Add website column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
ORDER BY COLUMN_NAME;

-- Show all columns in users table
DESCRIBE users;

