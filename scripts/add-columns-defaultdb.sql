-- Add company information columns to users table in defaultdb
-- Run this script directly in your MySQL database

-- Make sure you're using the correct database
USE defaultdb;

-- Or if your database is named differently, change it above

-- Add address column (will skip if already exists)
ALTER TABLE users 
ADD COLUMN address VARCHAR(500) DEFAULT NULL;

-- Add companyEmail column (will skip if already exists)
ALTER TABLE users 
ADD COLUMN companyEmail VARCHAR(255) DEFAULT NULL;

-- Add website column (will skip if already exists)
ALTER TABLE users 
ADD COLUMN website VARCHAR(255) DEFAULT NULL;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'defaultdb'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
ORDER BY COLUMN_NAME;

-- Show all columns in users table to confirm
DESCRIBE users;

