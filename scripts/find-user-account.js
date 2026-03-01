/**
 * Find User Account Script
 * Helps find user accounts by email (case-insensitive search)
 * Can also search by name or partial email
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function findUserAccount() {
  const searchTerm = process.argv[2];

  console.log('🔍 Find User Account Script\n');

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

    let users;

    if (searchTerm) {
      console.log(`🔍 Searching for: "${searchTerm}"\n`);
      
      // Search by email (case-insensitive) or name
      [users] = await connection.execute(
        `SELECT id, name, email, role, createdAt, tenantId 
         FROM users 
         WHERE LOWER(email) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)
         ORDER BY createdAt DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
    } else {
      console.log('📋 Listing all users:\n');
      [users] = await connection.execute(
        `SELECT id, name, email, role, createdAt, tenantId 
         FROM users 
         ORDER BY createdAt DESC`
      );
    }

    if (users.length === 0) {
      console.log('❌ No users found!\n');
      console.log('💡 Possible reasons:');
      console.log('   1. The account was deleted');
      console.log('   2. The email address is different');
      console.log('   3. The account is in a different database\n');
      console.log('💡 To create a new account, you can:');
      console.log('   1. Register a new account through the registration page');
      console.log('   2. Use the super admin account to create users\n');
      await connection.end();
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log('');
    });

    // Check password format for found users
    if (users.length > 0) {
      console.log('🔐 Password Status:\n');
      for (const user of users) {
        const [userData] = await connection.execute(
          `SELECT password FROM users WHERE email = ?`,
          [user.email]
        );
        
        if (userData.length > 0) {
          const passwordHash = userData[0].password;
          const isBcryptHash = passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'));
          
          console.log(`${user.email}:`);
          console.log(`   Format: ${isBcryptHash ? '✅ Valid bcrypt hash' : '❌ Invalid format (needs fixing)'}`);
          console.log('');
        }
      }
    }

    await connection.end();
    console.log('✅ Search complete!\n');
    console.log('💡 If you found your account but can\'t login:');
    console.log('   Run: node scripts/check-and-fix-user-password.js "your-email@example.com" "new-password"\n');

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

findUserAccount();
