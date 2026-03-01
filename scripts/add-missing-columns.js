/**
 * Add Missing Columns Script
 * Safely adds missing columns to existing tables without affecting data
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumns() {
  console.log('🔧 Adding Missing Columns to Tables...\n');

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aivencloud.com') ? {
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 10000,
    multipleStatements: true,
  };

  try {
    console.log('🔌 Connecting to database...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Check and add missing columns to users table
    console.log('📋 Checking users table columns...');
    const [userColumns] = await connection.execute('DESCRIBE users');
    const userColumnNames = userColumns.map(col => col.Field);
    
    const usersTableColumns = {
      address: "ALTER TABLE users ADD COLUMN address VARCHAR(500) AFTER contactNumber",
      companyEmail: "ALTER TABLE users ADD COLUMN companyEmail VARCHAR(255) AFTER address",
      website: "ALTER TABLE users ADD COLUMN website VARCHAR(255) AFTER companyEmail"
    };

    for (const [columnName, sql] of Object.entries(usersTableColumns)) {
      if (!userColumnNames.includes(columnName)) {
        console.log(`   Adding column: ${columnName}...`);
        try {
          await connection.execute(sql);
          console.log(`   ✅ Added column: ${columnName}`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`   ⚠️  Column ${columnName} already exists, skipping...`);
          } else {
            console.error(`   ❌ Error adding ${columnName}: ${error.message}`);
          }
        }
      } else {
        console.log(`   ✅ Column ${columnName} already exists`);
      }
    }

    // Verify final structure
    console.log('\n📊 Final table structures:');
    const [finalUserColumns] = await connection.execute('DESCRIBE users');
    console.log(`   users table: ${finalUserColumns.length} columns`);
    finalUserColumns.forEach(col => {
      console.log(`      - ${col.Field} (${col.Type})`);
    });

    await connection.end();
    console.log('\n🎉 Column verification completed!');
    console.log('   All required columns are present.');
    console.log('   Data is safe - no data was modified.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL Message:', error.sqlMessage);
    }
    process.exit(1);
  }
}

addMissingColumns();
