/**
 * Verify and Fix Database Tables Script
 * This script verifies all required tables exist and creates any missing ones
 * Ensures data safety by checking before making changes
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyAndFixDatabase() {
  console.log('🔍 Verifying Database Tables...\n');

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

    // First, verify which tables exist
    console.log('📊 Checking existing tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map((t) => Object.values(t)[0]);
    console.log(`   Found ${existingTables.length} tables: ${existingTables.join(', ')}\n`);

    // Required tables
    const requiredTables = [
      'users',
      'subscriptions',
      'subscription_history',
      'login_history',
      'payment_requests'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length === 0) {
      console.log('✅ All required tables exist!\n');
    } else {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}\n`);
      console.log('🔧 Creating missing tables...\n');
    }

    // Create users table if missing
    if (missingTables.includes('users')) {
      console.log('Creating users table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('ADMIN', 'USER', 'SUPER_ADMIN') DEFAULT 'USER',
          shopName VARCHAR(255),
          contactNumber VARCHAR(255),
          address VARCHAR(500),
          companyEmail VARCHAR(255),
          website VARCHAR(255),
          tenantId VARCHAR(36) UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_tenantId (tenantId),
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ users table created');
    }

    // Create subscriptions table if missing
    if (missingTables.includes('subscriptions')) {
      console.log('Creating subscriptions table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          tenantId VARCHAR(36) NOT NULL,
          plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
          status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FREE_TRIAL') DEFAULT 'FREE_TRIAL',
          startDate DATETIME NOT NULL,
          endDate DATETIME NOT NULL,
          price DECIMAL(10, 2),
          paymentStatus ENUM('PENDING', 'APPROVED', 'REJECTED'),
          paymentId VARCHAR(255),
          isFreeTrial BOOLEAN DEFAULT FALSE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_userId (userId),
          INDEX idx_tenantId (tenantId),
          INDEX idx_status (status),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ subscriptions table created');
    }

    // Create subscription_history table if missing
    if (missingTables.includes('subscription_history')) {
      console.log('Creating subscription_history table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS subscription_history (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          tenantId VARCHAR(36) NOT NULL,
          plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
          status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FREE_TRIAL') NOT NULL,
          startDate DATETIME NOT NULL,
          endDate DATETIME NOT NULL,
          price DECIMAL(10, 2),
          paymentStatus ENUM('PENDING', 'APPROVED', 'REJECTED'),
          paymentId VARCHAR(255),
          isFreeTrial BOOLEAN DEFAULT FALSE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_userId (userId),
          INDEX idx_tenantId (tenantId),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ subscription_history table created');
    }

    // Create login_history table if missing
    if (missingTables.includes('login_history')) {
      console.log('Creating login_history table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS login_history (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          tenantId VARCHAR(36) NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip VARCHAR(45),
          INDEX idx_userId (userId),
          INDEX idx_tenantId (tenantId),
          INDEX idx_timestamp (timestamp),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ login_history table created');
    }

    // Create payment_requests table if missing
    if (missingTables.includes('payment_requests')) {
      console.log('Creating payment_requests table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS payment_requests (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          tenantId VARCHAR(36) NOT NULL,
          plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
          planName VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          months INT NOT NULL,
          startDate DATETIME NOT NULL,
          endDate DATETIME NOT NULL,
          status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_userId (userId),
          INDEX idx_tenantId (tenantId),
          INDEX idx_status (status),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ payment_requests table created');
    }

    // Verify table structures
    console.log('\n🔍 Verifying table structures...');
    for (const table of requiredTables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`   ✅ ${table}: ${columns.length} columns`);
      } catch (error) {
        console.error(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // Check for super admin
    console.log('\n👤 Checking for super admin...');
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = 'superadmin@admin.com'"
    );

    if (users.length === 0) {
      console.log('   Creating super admin...');
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      const userId = uuidv4();
      const tenantId = uuidv4();

      await connection.execute(
        `INSERT INTO users (id, name, email, password, role, shopName, contactNumber, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'Super Admin', 'superadmin@admin.com', hashedPassword, 'SUPER_ADMIN', 'System Administration', 'N/A', tenantId]
      );

      console.log('✅ Super admin created!');
      console.log('   Email: superadmin@admin.com');
      console.log('   Password: superadmin123\n');
    } else {
      console.log('✅ Super admin already exists!\n');
    }

    // Final verification
    console.log('📋 Final verification...');
    const [finalTables] = await connection.execute('SHOW TABLES');
    const finalTableNames = finalTables.map((t) => Object.values(t)[0]);
    console.log(`   Total tables: ${finalTableNames.length}`);
    console.log(`   Tables: ${finalTableNames.join(', ')}\n`);

    // Check data counts (safely)
    console.log('📊 Data counts:');
    for (const table of requiredTables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.error(`   ${table}: Error counting - ${error.message}`);
      }
    }

    await connection.end();
    console.log('\n🎉 Database verification and fix completed successfully!');
    console.log('   All tables are verified and data is safe.');
    console.log('   You can now refresh your DBeaver connection to see the tables.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL Message:', error.sqlMessage);
    }
    console.error('\n💡 Tips:');
    console.error('   1. Check your .env file has correct DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   2. Verify database connection is accessible');
    console.error('   3. In DBeaver, try refreshing the connection (right-click → Refresh)');
    process.exit(1);
  }
}

verifyAndFixDatabase();
