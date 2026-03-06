/**
 * Script to fix customer client IDs
 * Ensures customers with same name but different contact numbers get different client IDs
 * Run this script: node scripts/fix-customer-client-ids.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCustomerClientIds() {
  console.log('🔧 Starting Customer Client IDs Fix Migration...\n');

  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aivencloud.com') ? {
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 10000,
  };

  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!\n');

    // Get all users (tenants)
    const [users] = await connection.execute(
      `SELECT DISTINCT tenantId FROM users WHERE tenantId IS NOT NULL AND role != 'SUPER_ADMIN'`
    );

    if (!users || users.length === 0) {
      console.log('⚠️  No tenants found');
      return;
    }

    console.log(`📊 Found ${users.length} tenant(s) to process\n`);

    let totalCustomers = 0;
    let totalTicketsUpdated = 0;

    // Process each tenant
    for (const user of users) {
      const tenantId = user.tenantId;
      console.log(`\n🔄 Processing tenant: ${tenantId}`);

      try {
        // Get tenant table name
        const tablePrefix = `tenant_${tenantId.replace(/-/g, '_')}`;
        const repairTicketsTable = `${tablePrefix}_repair_tickets`;

        // Check if table exists
        const [tables] = await connection.execute(
          `SELECT TABLE_NAME FROM information_schema.TABLES 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [process.env.DB_NAME, repairTicketsTable]
        );

        if (!tables || tables.length === 0) {
          console.log(`   ⚠️  Table ${repairTicketsTable} does not exist, skipping...`);
          continue;
        }

        // Get all tickets
        const [tickets] = await connection.execute(
          `SELECT id, customerName, contact, clientId, createdAt 
           FROM ?? 
           WHERE customerName IS NOT NULL AND customerName != '' 
           ORDER BY createdAt ASC`,
          [repairTicketsTable]
        );

        if (!tickets || tickets.length === 0) {
          console.log(`   ℹ️  No tickets found`);
          continue;
        }

        console.log(`   📋 Found ${tickets.length} ticket(s)`);

        // Normalize contact for comparison
        const normalizeContact = (contact) => {
          if (!contact) return "";
          return String(contact).replace(/[\s\-\(\)]/g, "").trim();
        };

        // Group tickets by customerName + contact (normalized)
        const customerGroups = new Map();
        
        tickets.forEach((ticket) => {
          if (!ticket.customerName) return;
          
          const normalizedName = String(ticket.customerName).trim().toLowerCase();
          const normalizedContact = normalizeContact(ticket.contact);
          
          // Create unique key: name + contact (or "NO_CONTACT" if contact is empty)
          const groupKey = normalizedContact 
            ? `${normalizedName}::${normalizedContact}`
            : `${normalizedName}::NO_CONTACT`;
          
          if (!customerGroups.has(groupKey)) {
            customerGroups.set(groupKey, []);
          }
          customerGroups.get(groupKey).push(ticket);
        });

        console.log(`   👥 Found ${customerGroups.size} unique customer(s) (name + contact combinations)`);
        totalCustomers += customerGroups.size;

        // Find max client ID number
        let maxClientIdNumber = 0;
        for (const groupTickets of customerGroups.values()) {
          for (const ticket of groupTickets) {
            if (ticket.clientId) {
              const match = String(ticket.clientId).match(/^CLI-(\d{1,4})$/i);
              if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxClientIdNumber) {
                  maxClientIdNumber = num;
                }
              }
            }
          }
        }

        let nextClientIdNumber = maxClientIdNumber + 1;
        const customerClientIdMap = new Map();
        const usedClientIds = new Set();

        // First pass: Try to preserve existing client IDs, but only if unique
        for (const [groupKey, groupTickets] of customerGroups.entries()) {
          const sortedTickets = groupTickets.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
          });

          let existingClientId = null;
          for (const ticket of sortedTickets) {
            if (ticket.clientId) {
              const match = String(ticket.clientId).match(/^CLI-(\d{1,4})$/i);
              if (match) {
                existingClientId = String(ticket.clientId).toUpperCase();
                break;
              }
            }
          }

          // Only use existing client ID if it's not already assigned to another group
          if (existingClientId && !usedClientIds.has(existingClientId)) {
            customerClientIdMap.set(groupKey, existingClientId);
            usedClientIds.add(existingClientId);
          }
        }

        // Second pass: assign new client IDs to groups without unique existing IDs
        for (const [groupKey, groupTickets] of customerGroups.entries()) {
          if (!customerClientIdMap.has(groupKey)) {
            let newClientId;
            let attempts = 0;
            const maxAttempts = 10000;
            
            do {
              newClientId = `CLI-${String(nextClientIdNumber).padStart(4, "0")}`;
              nextClientIdNumber++;
              attempts++;
              
              if (!usedClientIds.has(newClientId)) {
                usedClientIds.add(newClientId);
                break;
              }
            } while (attempts < maxAttempts);

            if (attempts >= maxAttempts) {
              console.error(`   ❌ Failed to generate unique client ID for group: ${groupKey}`);
              continue;
            }

            customerClientIdMap.set(groupKey, newClientId);
          }
        }

        // Third pass: update all tickets with the correct client IDs
        let tenantTicketsUpdated = 0;
        for (const [groupKey, groupTickets] of customerGroups.entries()) {
          const assignedClientId = customerClientIdMap.get(groupKey);
          if (!assignedClientId) continue;

          for (const ticket of groupTickets) {
            // Only update if the client ID is different
            if (!ticket.clientId || ticket.clientId !== assignedClientId) {
              try {
                await connection.execute(
                  `UPDATE ?? SET clientId = ? WHERE id = ?`,
                  [repairTicketsTable, assignedClientId, ticket.id]
                );
                tenantTicketsUpdated++;
              } catch (error) {
                console.error(`   ❌ Error updating ticket ${ticket.id}:`, error.message);
              }
            }
          }
        }

        totalTicketsUpdated += tenantTicketsUpdated;
        console.log(`   ✅ Updated ${tenantTicketsUpdated} ticket(s)`);

        // Show some examples
        if (customerGroups.size > 0) {
          console.log(`   📝 Examples:`);
          let count = 0;
          for (const [groupKey, groupTickets] of customerGroups.entries()) {
            if (count >= 3) break;
            const assignedId = customerClientIdMap.get(groupKey);
            const sample = groupTickets[0];
            console.log(`      - ${sample.customerName} (${sample.contact || 'no contact'}) → ${assignedId}`);
            count++;
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing tenant ${tenantId}:`, error.message);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Total customers processed: ${totalCustomers}`);
    console.log(`   Total tickets updated: ${totalTicketsUpdated}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the migration
fixCustomerClientIds()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
