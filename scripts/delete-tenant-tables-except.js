/**
 * Delete All Tenant Tables Except Specified Tenant IDs
 * 
 * This script deletes all tenant tables except for the specified tenant IDs.
 * USE WITH CAUTION - This will permanently delete data!
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Tenant IDs to KEEP (all others will be deleted)
const TENANTS_TO_KEEP = [
  'd538eac6-072b-41ee-9f78-070775991051',
  '732f9131-bb1f-482c-85d3-dc7d24caf33f'
];

async function deleteTenantTablesExcept() {
  console.log('🗑️  Delete Tenant Tables Script');
  console.log('================================\n');
  console.log('⚠️  WARNING: This will permanently delete tenant tables!');
  console.log(`✅ Keeping tables for tenant IDs: ${TENANTS_TO_KEEP.join(', ')}\n`);

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

    // Convert tenant IDs to table name prefixes
    const prefixesToKeep = TENANTS_TO_KEEP.map(tenantId => 
      `tenant_${tenantId.replace(/-/g, '_')}`
    );

    console.log('📋 Prefixes to keep:');
    prefixesToKeep.forEach(prefix => console.log(`   - ${prefix}_*`));
    console.log('');

    // Get all tables that start with 'tenant_'
    console.log('🔍 Finding all tenant tables...');
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'tenant_%'",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log('ℹ️  No tenant tables found.');
      return;
    }

    console.log(`✅ Found ${tables.length} tenant table(s)\n`);

    // Separate tables to keep and delete
    const tablesToKeep = [];
    const tablesToDelete = [];

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const shouldKeep = prefixesToKeep.some(prefix => tableName.startsWith(prefix));
      
      if (shouldKeep) {
        tablesToKeep.push(tableName);
      } else {
        tablesToDelete.push(tableName);
      }
    }

    console.log(`📊 Summary:`);
    console.log(`   Tables to KEEP: ${tablesToKeep.length}`);
    if (tablesToKeep.length > 0) {
      tablesToKeep.forEach(t => console.log(`     ✅ ${t}`));
    }
    console.log(`   Tables to DELETE: ${tablesToDelete.length}`);
    if (tablesToDelete.length > 0) {
      tablesToDelete.forEach(t => console.log(`     ❌ ${t}`));
    }
    console.log('');

    if (tablesToDelete.length === 0) {
      console.log('ℹ️  No tables to delete. All tenant tables belong to the specified tenants.');
      return;
    }

    // Confirm before deletion
    console.log('⚠️  READY TO DELETE THE ABOVE TABLES!');
    console.log('⚠️  This action cannot be undone!\n');
    
    // For safety, we'll proceed with deletion
    // In a real scenario, you might want to add a confirmation prompt here
    
    console.log('🗑️  Deleting tables...\n');
    let deletedCount = 0;
    let errorCount = 0;

    for (const tableName of tablesToDelete) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`   ✅ Deleted: ${tableName}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${tableName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Deletion Summary:');
    console.log(`   ✅ Successfully deleted: ${deletedCount} table(s)`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} table(s)`);
    }
    console.log(`   ✅ Kept: ${tablesToKeep.length} table(s)`);
    console.log('\n✅ Script completed!');

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
deleteTenantTablesExcept()
  .then(() => {
    console.log('\n✅ Script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

