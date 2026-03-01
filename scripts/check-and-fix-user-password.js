/**
 * Check and Fix User Password Script (Non-Interactive)
 * Usage: node scripts/check-and-fix-user-password.js [email] [newPassword]
 * If no arguments provided, it will list all users and check their password format
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  console.log('🔐 User Password Check and Fix Script\n');

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

    // List all users
    console.log('📋 All users in database:\n');
    const [users] = await connection.execute(
      `SELECT id, name, email, role, createdAt, password FROM users ORDER BY createdAt DESC`
    );

    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
      await connection.end();
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Check password format
      const passwordHash = user.password;
      const isBcryptHash = passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'));
      console.log(`   Password format: ${isBcryptHash ? '✅ Valid bcrypt' : '❌ Invalid (needs fixing)'}`);
      console.log('');
    });

    // If email provided, fix that specific user
    if (email) {
      console.log(`\n🔧 Fixing user: ${email}\n`);
      
      const [targetUsers] = await connection.execute(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
        [email.trim()]
      );

      if (targetUsers.length === 0) {
        console.log(`❌ User with email "${email}" not found!\n`);
        await connection.end();
        return;
      }

      const user = targetUsers[0];
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      
      const passwordHash = user.password;
      const isBcryptHash = passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'));
      
      if (!isBcryptHash) {
        console.log('⚠️  Password is not in bcrypt format - needs to be fixed!\n');
      }

      if (newPassword) {
        console.log('🔧 Setting new password...');
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        
        await connection.execute(
          `UPDATE users SET password = ? WHERE email = ?`,
          [hashedPassword, user.email]
        );
        
        console.log('✅ Password updated successfully!');
        console.log(`   Email: ${user.email}`);
        console.log(`   New password: ${newPassword.trim()}\n`);
        
        // Verify the new password
        const [updatedUser] = await connection.execute(
          `SELECT password FROM users WHERE email = ?`,
          [user.email]
        );
        const isValid = await bcrypt.compare(newPassword.trim(), updatedUser[0].password);
        console.log(`   Verification: ${isValid ? '✅ Password works correctly' : '❌ Error - password not working'}\n`);
      } else {
        console.log('\n💡 To reset password, run:');
        console.log(`   node scripts/check-and-fix-user-password.js "${user.email}" "your-new-password"\n`);
      }
    } else {
      console.log('\n💡 Usage:');
      console.log('   List all users: node scripts/check-and-fix-user-password.js');
      console.log('   Fix user password: node scripts/check-and-fix-user-password.js "email@example.com" "newpassword"\n');
    }

    await connection.end();
    console.log('✅ Check complete! All data is safe.\n');

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

checkAndFixPassword();
