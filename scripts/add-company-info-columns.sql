-- Migration script to add company information columns to users table
-- Run this script if the columns don't exist in your database

USE admin_panel_db;

-- Check and add address column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address VARCHAR(500) DEFAULT NULL;

-- Check and add companyEmail column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS companyEmail VARCHAR(255) DEFAULT NULL;

-- Check and add website column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;

-- Note: vatNumber column is optional and can be added if needed
-- ALTER TABLE users 
-- ADD COLUMN IF NOT EXISTS vatNumber VARCHAR(100) DEFAULT NULL;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'admin_panel_db' 
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
ORDER BY COLUMN_NAME;

