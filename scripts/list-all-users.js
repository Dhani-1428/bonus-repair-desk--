/**
 * List All Users Script
 * Shows ALL users in the database without any filters
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function listAllUsers() {
  console.log('📋 Listing ALL Users in Database\n');

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
  };

  try {
    console.log('🔌 Connecting to database...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Check for multiple user tables
    console.log('🔍 Checking for user tables...');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%user%'");
    console.log(`Found ${tables.length} table(s) with 'user' in name:`);
    tables.forEach((table, i) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${i + 1}. ${tableName}`);
    });
    console.log('');

    // Get ALL users from users table (no filters)
    console.log('📊 Querying users table (NO FILTERS)...');
    const [users] = await connection.execute(
      `SELECT id, name, email, role, createdAt, updatedAt, tenantId, shopName, contactNumber 
       FROM users 
       ORDER BY createdAt DESC`
    );

    console.log(`\n✅ Total users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in the users table!\n');
      console.log('💡 This might mean:');
      console.log('   1. All users were deleted');
      console.log('   2. Users are in a different table');
      console.log('   3. Database was reset\n');
    } else {
      console.log('👥 All Users:\n');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'}`);
        console.log(`   Email: ${user.email || 'No email'}`);
        console.log(`   Role: ${user.role || 'No role'}`);
        console.log(`   Tenant ID: ${user.tenantId || 'No tenant ID'}`);
        console.log(`   Shop Name: ${user.shopName || 'N/A'}`);
        console.log(`   Contact: ${user.contactNumber || 'N/A'}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
        console.log(`   Updated: ${user.updatedAt || 'N/A'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }

    // Also check if there's a "User" table (capital U)
    const [capitalUserTable] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'User'`,
      [config.database]
    );

    if (capitalUserTable[0].count > 0) {
      console.log('⚠️  Found "User" table (capital U) - checking it too...\n');
      try {
        const [capitalUsers] = await connection.execute(
          `SELECT id, name, email, role, createdAt FROM User ORDER BY createdAt DESC`
        );
        console.log(`Found ${capitalUsers.length} user(s) in "User" table:\n`);
        capitalUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });
        console.log('');
      } catch (error) {
        console.log('   (Could not query User table - may not exist)\n');
      }
    }

    // Check total count with COUNT query
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total count from COUNT query: ${countResult[0].total} users\n`);

    await connection.end();
    console.log('✅ Complete! All users listed.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL Message:', error.sqlMessage);
    }
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

listAllUsers();
