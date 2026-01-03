/**
 * Migration script to add company information columns to users table
 * Run this script: node scripts/add-company-info-columns.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_panel_db',
  multipleStatements: true
};

async function addCompanyInfoColumns() {
  let connection;
  
  try {
    console.log('[Migration] Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('[Migration] ✅ Connected to database');

    // Check if columns exist
    console.log('[Migration] Checking existing columns...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
    `, [dbConfig.database]);

    const existingColumns = columns.map((col) => col.COLUMN_NAME);
    console.log('[Migration] Existing columns:', existingColumns);

    // Add address column if it doesn't exist
    if (!existingColumns.includes('address')) {
      console.log('[Migration] Adding address column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN address VARCHAR(500) DEFAULT NULL
      `);
      console.log('[Migration] ✅ Added address column');
    } else {
      console.log('[Migration] ⏭️  address column already exists');
    }

    // Add companyEmail column if it doesn't exist
    if (!existingColumns.includes('companyEmail')) {
      console.log('[Migration] Adding companyEmail column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN companyEmail VARCHAR(255) DEFAULT NULL
      `);
      console.log('[Migration] ✅ Added companyEmail column');
    } else {
      console.log('[Migration] ⏭️  companyEmail column already exists');
    }

    // Add website column if it doesn't exist
    if (!existingColumns.includes('website')) {
      console.log('[Migration] Adding website column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN website VARCHAR(255) DEFAULT NULL
      `);
      console.log('[Migration] ✅ Added website column');
    } else {
      console.log('[Migration] ⏭️  website column already exists');
    }

    // Verify columns
    console.log('[Migration] Verifying columns...');
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
      ORDER BY COLUMN_NAME
    `, [dbConfig.database]);

    console.log('[Migration] ✅ Migration complete! Columns in users table:');
    console.table(verifyColumns);

  } catch (error) {
    console.error('[Migration] ❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] ⚠️  Column already exists, skipping...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('[Migration] Database connection closed');
    }
  }
}

// Run migration
addCompanyInfoColumns()
  .then(() => {
    console.log('[Migration] ✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] ❌ Migration failed:', error);
    process.exit(1);
  });

