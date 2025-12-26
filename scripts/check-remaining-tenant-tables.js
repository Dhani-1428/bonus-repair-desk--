/**
 * Check Remaining Tenant Tables
 * 
 * This script checks what tenant tables still exist in the database.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRemainingTenantTables() {
  console.log('🔍 Checking Remaining Tenant Tables...\n');

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aivencloud.com') ? {
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 60000,
  };

  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Get all tables that start with 'tenant_'
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'tenant_%' ORDER BY TABLE_NAME",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log('ℹ️  No tenant tables found.');
    } else {
      console.log(`📊 Found ${tables.length} tenant table(s):\n`);
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
      });
    }

    // Also check users table to see which tenants still have user records
    console.log('\n👥 Checking users table...');
    const [users] = await connection.execute(
      'SELECT id, name, email, tenantId, role FROM users ORDER BY createdAt DESC'
    );

    console.log(`\n📊 Found ${users.length} user(s) in users table:\n`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Tenant ID: ${user.tenantId}`);
      console.log(`      Role: ${user.role}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the script
checkRemainingTenantTables()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

