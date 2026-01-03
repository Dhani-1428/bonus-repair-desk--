/**
 * Direct script to add columns to users table
 * This will work with any database name (defaultdb, admin_panel_db, etc.)
 * Run: node scripts/add-columns-direct.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb', // Changed default to defaultdb
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: (process.env.DB_SSL === "true" || process.env.DB_HOST?.includes("aivencloud.com") || process.env.DB_HOST?.includes("cloud")) 
    ? { rejectUnauthorized: false } 
    : undefined
};

async function addColumns() {
  let connection;
  
  try {
    console.log('========================================');
    console.log('  Add Columns to Users Table');
    console.log('========================================\n');
    
    console.log('[Migration] Connecting to database...');
    console.log('[Migration] Host:', dbConfig.host);
    console.log('[Migration] Database:', dbConfig.database);
    console.log('[Migration] User:', dbConfig.user);
    console.log('');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('[Migration] ✅ Connected to database\n');

    // Get current database name
    const [dbResult] = await connection.execute(`SELECT DATABASE() as dbName`);
    const currentDb = dbResult[0]?.dbName || dbConfig.database;
    console.log('[Migration] Current database:', currentDb);
    console.log('');

    // Check if users table exists
    try {
      await connection.execute(`SELECT 1 FROM users LIMIT 1`);
      console.log('[Migration] ✅ Users table exists\n');
    } catch (error) {
      console.error('[Migration] ❌ Users table does not exist!');
      throw new Error('Users table not found. Please create it first.');
    }

    // Check existing columns
    console.log('[Migration] Checking existing columns...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
    `, [currentDb]);

    const existingColumns = columns.map((col) => col.COLUMN_NAME);
    console.log('[Migration] Existing columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'None');
    console.log('');

    const addedColumns = [];

    // Add address column
    if (!existingColumns.includes('address')) {
      console.log('[Migration] Adding address column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN address VARCHAR(500) DEFAULT NULL
      `);
      addedColumns.push('address');
      console.log('[Migration] ✅ Added address column\n');
    } else {
      console.log('[Migration] ⏭️  address column already exists\n');
    }

    // Add companyEmail column
    if (!existingColumns.includes('companyEmail')) {
      console.log('[Migration] Adding companyEmail column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN companyEmail VARCHAR(255) DEFAULT NULL
      `);
      addedColumns.push('companyEmail');
      console.log('[Migration] ✅ Added companyEmail column\n');
    } else {
      console.log('[Migration] ⏭️  companyEmail column already exists\n');
    }

    // Add website column
    if (!existingColumns.includes('website')) {
      console.log('[Migration] Adding website column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN website VARCHAR(255) DEFAULT NULL
      `);
      addedColumns.push('website');
      console.log('[Migration] ✅ Added website column\n');
    } else {
      console.log('[Migration] ⏭️  website column already exists\n');
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
    `, [currentDb]);

    console.log('[Migration] ✅ Migration complete!');
    console.log('[Migration] Columns in users table:');
    if (verifyColumns.length > 0) {
      console.table(verifyColumns);
    } else {
      console.log('  No columns found (this should not happen)');
    }
    
    if (addedColumns.length > 0) {
      console.log(`\n[Migration] ✅ Successfully added ${addedColumns.length} column(s): ${addedColumns.join(', ')}`);
    } else {
      console.log('\n[Migration] ✅ All columns already exist - no changes needed');
    }

    // Show all columns in users table
    console.log('\n[Migration] All columns in users table:');
    const [allColumns] = await connection.execute(`DESCRIBE users`);
    console.table(allColumns);

  } catch (error) {
    console.error('\n[Migration] ❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] ⚠️  Column already exists, skipping...');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[Migration] ❌ Database access denied. Please check your .env.local file:');
      console.error('  - DB_HOST:', process.env.DB_HOST || 'not set');
      console.error('  - DB_USER:', process.env.DB_USER || 'not set');
      console.error('  - DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'not set');
      console.error('  - DB_NAME:', process.env.DB_NAME || 'not set');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n[Migration] Database connection closed');
    }
  }
}

// Run migration
addColumns()
  .then(() => {
    console.log('\n[Migration] ✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[Migration] ❌ Migration failed:', error);
    process.exit(1);
  });

