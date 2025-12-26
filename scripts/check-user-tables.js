const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserTables() {
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

  const connection = await mysql.createConnection(config);
  
  try {
    const tenantId = '732f9131-bb1f-482c-85d3-dc7d24caf33f';
    const sanitizedTenantId = tenantId.replace(/-/g, '_');
    
    // Check if tables exist
    const [tables] = await connection.execute(
      `SHOW TABLES LIKE 'tenant_${sanitizedTenantId}_%'`
    );
    
    console.log(`\n📂 Tables for tenant ${tenantId}:`);
    console.log(`   Found ${tables.length} table(s)\n`);
    
    if (tables.length > 0) {
      tables.forEach((table) => {
        console.log(`   ✓ ${Object.values(table)[0]}`);
      });
      
      // Check repair tickets table
      const repairTable = `tenant_${sanitizedTenantId}_repair_tickets`;
      try {
        const [count] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${repairTable}`
        );
        console.log(`\n   Repair Tickets: ${count[0].count} records`);
      } catch (error) {
        console.log(`\n   Repair Tickets table doesn't exist or is empty`);
      }
      
      // Check team members table
      const membersTable = `tenant_${sanitizedTenantId}_team_members`;
      try {
        const [count] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${membersTable}`
        );
        console.log(`   Team Members: ${count[0].count} records`);
      } catch (error) {
        console.log(`   Team Members table doesn't exist or is empty`);
      }
    } else {
      console.log('   ⚠️  No tenant tables found. Tables will be created when user creates their first data.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUserTables().catch(console.error);

