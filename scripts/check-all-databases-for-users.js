/**
 * Check All Databases for Users
 * Searches all databases for user data that might have been lost
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllDatabases() {
  console.log('🔍 Checking All Databases for Users\n');

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aivencloud.com') ? {
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 10000,
  };

  try {
    console.log('🔌 Connecting to database server...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Get all databases
    console.log('📋 Listing all databases...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbNames = databases.map((db) => Object.values(db)[0]).filter(name => 
      !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(name)
    );
    
    console.log(`Found ${dbNames.length} database(s): ${dbNames.join(', ')}\n`);

    const allUsers = [];

    // Check each database for users
    for (const dbName of dbNames) {
      try {
        console.log(`\n🔍 Checking database: ${dbName}`);
        
        // Check if users table exists
        const [tables] = await connection.execute(
          `SELECT TABLE_NAME FROM information_schema.TABLES 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE '%user%'`,
          [dbName]
        );

        if (tables.length > 0) {
          console.log(`   Found ${tables.length} user table(s): ${tables.map(t => Object.values(t)[0]).join(', ')}`);
          
          for (const table of tables) {
            const tableName = Object.values(table)[0];
            try {
              const [users] = await connection.execute(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`${tableName}\``);
              const count = users[0].count;
              console.log(`   ${tableName}: ${count} record(s)`);
              
              if (count > 0) {
                const [userData] = await connection.execute(
                  `SELECT id, name, email, role, createdAt FROM \`${dbName}\`.\`${tableName}\` LIMIT 10`
                );
                console.log(`   Sample users:`);
                userData.forEach((u, i) => {
                  console.log(`      ${i + 1}. ${u.name || 'No name'} (${u.email || 'No email'}) - ${u.role || 'No role'}`);
                  allUsers.push({ ...u, database: dbName, table: tableName });
                });
              }
            } catch (error) {
              console.log(`   ⚠️  Could not query ${tableName}: ${error.message}`);
            }
          }
        } else {
          console.log(`   No user tables found`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error checking ${dbName}: ${error.message}`);
      }
    }

    await connection.end();

    console.log(`\n📊 Summary:`);
    console.log(`   Total users found across all databases: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log(`\n👥 All Users Found:\n`);
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'}`);
        console.log(`   Email: ${user.email || 'No email'}`);
        console.log(`   Role: ${user.role || 'No role'}`);
        console.log(`   Database: ${user.database}`);
        console.log(`   Table: ${user.table}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
        console.log('');
      });
    }

    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

checkAllDatabases();
