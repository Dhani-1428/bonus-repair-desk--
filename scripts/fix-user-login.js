/**
 * Fix User Login Issues Script
 * This script helps diagnose and fix login problems while keeping all data safe
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixUserLogin() {
  console.log('🔐 User Login Fix Script\n');
  console.log('This script will help you fix login issues while keeping all data safe.\n');

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

    // List all users (safely - no passwords)
    console.log('📋 Listing all users in database...\n');
    const [users] = await connection.execute(
      `SELECT id, name, email, role, createdAt, tenantId FROM users ORDER BY createdAt DESC`
    );

    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
      await connection.end();
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // Ask which user to fix
    const emailInput = await question('Enter the email address of the account to fix (or press Enter to test all): ');
    const emailToFix = emailInput.trim();

    if (!emailToFix) {
      console.log('\n🔍 Testing all users...\n');
      
      for (const user of users) {
        console.log(`Testing user: ${user.email}`);
        const [userData] = await connection.execute(
          `SELECT password FROM users WHERE email = ?`,
          [user.email]
        );
        
        if (userData.length > 0) {
          const passwordHash = userData[0].password;
          const isBcryptHash = passwordHash && passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$');
          
          console.log(`   Password hash format: ${isBcryptHash ? '✅ Valid bcrypt hash' : '❌ Invalid format'}`);
          console.log(`   Hash length: ${passwordHash.length} characters`);
          console.log(`   Hash preview: ${passwordHash.substring(0, 30)}...`);
          console.log('');
        }
      }
      
      await connection.end();
      return;
    }

    // Find the specific user
    const [targetUsers] = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
      [emailToFix]
    );

    if (targetUsers.length === 0) {
      console.log(`\n❌ User with email "${emailToFix}" not found!\n`);
      await connection.end();
      return;
    }

    const user = targetUsers[0];
    console.log(`\n✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}\n`);

    // Check password format
    const passwordHash = user.password;
    const isBcryptHash = passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'));
    
    console.log('🔍 Password Analysis:');
    console.log(`   Hash format: ${isBcryptHash ? '✅ Valid bcrypt hash' : '❌ Invalid format (may be plain text or corrupted)'}`);
    console.log(`   Hash length: ${passwordHash.length} characters`);
    console.log(`   Hash preview: ${passwordHash.substring(0, 30)}...\n`);

    // Test password
    const testPassword = await question('Enter the password you want to test (or press Enter to skip): ');
    
    if (testPassword.trim()) {
      console.log('\n🧪 Testing password...');
      
      if (isBcryptHash) {
        const isValid = await bcrypt.compare(testPassword, passwordHash);
        if (isValid) {
          console.log('✅ Password is CORRECT! The password works.\n');
          console.log('💡 If you still can\'t login, the issue might be:');
          console.log('   1. Case sensitivity in email (try different cases)');
          console.log('   2. Extra spaces in email');
          console.log('   3. Browser cache issues (try incognito mode)');
          console.log('   4. Application error (check server logs)\n');
        } else {
          console.log('❌ Password is INCORRECT!\n');
          
          const resetChoice = await question('Do you want to reset the password? (yes/no): ');
          if (resetChoice.toLowerCase() === 'yes' || resetChoice.toLowerCase() === 'y') {
            const newPassword = await question('Enter new password: ');
            if (newPassword.trim()) {
              console.log('\n🔧 Resetting password...');
              const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
              
              await connection.execute(
                `UPDATE users SET password = ? WHERE email = ?`,
                [hashedPassword, user.email]
              );
              
              console.log('✅ Password reset successfully!');
              console.log(`   Email: ${user.email}`);
              console.log(`   New password: ${newPassword.trim()}\n`);
              
              // Verify the new password
              const [updatedUser] = await connection.execute(
                `SELECT password FROM users WHERE email = ?`,
                [user.email]
              );
              const isValid = await bcrypt.compare(newPassword.trim(), updatedUser[0].password);
              console.log(`   Verification: ${isValid ? '✅ Password works correctly' : '❌ Error - password not working'}\n`);
            }
          }
        }
      } else {
        console.log('⚠️  Password is not in bcrypt format. It may be stored as plain text or corrupted.\n');
        
        const fixChoice = await question('Do you want to convert it to a proper bcrypt hash? (yes/no): ');
        if (fixChoice.toLowerCase() === 'yes' || fixChoice.toLowerCase() === 'y') {
          const newPassword = await question('Enter the correct password for this account: ');
          if (newPassword.trim()) {
            console.log('\n🔧 Converting password to bcrypt hash...');
            const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
            
            await connection.execute(
              `UPDATE users SET password = ? WHERE email = ?`,
              [hashedPassword, user.email]
            );
            
            console.log('✅ Password converted and saved successfully!');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${newPassword.trim()}\n`);
          }
        }
      }
    } else {
      console.log('\n⏭️  Skipping password test.\n');
      
      if (!isBcryptHash) {
        console.log('⚠️  Warning: Password is not in bcrypt format!\n');
        const fixChoice = await question('Do you want to set a new password? (yes/no): ');
        if (fixChoice.toLowerCase() === 'yes' || fixChoice.toLowerCase() === 'y') {
          const newPassword = await question('Enter new password: ');
          if (newPassword.trim()) {
            console.log('\n🔧 Setting new password...');
            const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
            
            await connection.execute(
              `UPDATE users SET password = ? WHERE email = ?`,
              [hashedPassword, user.email]
            );
            
            console.log('✅ Password set successfully!');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${newPassword.trim()}\n`);
          }
        }
      }
    }

    // Show final user info
    console.log('📊 Final User Status:');
    const [finalUser] = await connection.execute(
      `SELECT id, name, email, role, createdAt FROM users WHERE email = ?`,
      [user.email]
    );
    console.log(`   Name: ${finalUser[0].name}`);
    console.log(`   Email: ${finalUser[0].email}`);
    console.log(`   Role: ${finalUser[0].role}`);
    console.log(`   Created: ${finalUser[0].createdAt}\n`);

    await connection.end();
    console.log('✅ All operations completed!');
    console.log('   Your data is safe - only the password was modified if you chose to reset it.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL Message:', error.sqlMessage);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

fixUserLogin();
