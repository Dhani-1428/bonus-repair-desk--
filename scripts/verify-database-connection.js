/**
 * Verify Database Connection and List All Users
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyConnection() {
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

  console.log('🔍 Verifying Database Connection\n');
  console.log('Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Check current database
    const [dbResult] = await connection.execute('SELECT DATABASE() as dbName');
    console.log(`Current database: ${dbResult[0].dbName}\n`);

    // Get all users
    const [users] = await connection.execute(
      `SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC`
    );

    console.log(`📊 Total users in ${dbResult[0].dbName}: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Users:\n');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in this database!\n');
      console.log('💡 Check if you need to switch to admin_panel_db database\n');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyConnection();
