/**
 * Script to call the migration API endpoint
 * This uses the Next.js API route which has access to the database connection
 * Run this script: node scripts/run-migration-api.js
 */

const http = require('http');

// Get the port from environment or default to 3000
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

async function runMigration() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: '/api/migrate/users-table',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('[Migration] ✅ Success:', result.message);
            if (result.addedColumns && result.addedColumns.length > 0) {
              console.log('[Migration] Added columns:', result.addedColumns.join(', '));
            }
            if (result.allColumns) {
              console.log('[Migration] All company info columns:');
              console.table(result.allColumns);
            }
            resolve(result);
          } else {
            console.error('[Migration] ❌ Error:', result.error || result.message);
            reject(new Error(result.error || 'Migration failed'));
          }
        } catch (error) {
          console.error('[Migration] ❌ Error parsing response:', error);
          console.error('[Migration] Response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[Migration] ❌ Request error:', error.message);
      console.error('[Migration] Make sure your Next.js server is running on port', port);
      reject(error);
    });

    req.end();
  });
}

// Run migration
console.log('[Migration] Calling migration API endpoint...');
console.log('[Migration] Make sure your Next.js server is running on http://' + host + ':' + port);
console.log('');

runMigration()
  .then(() => {
    console.log('[Migration] ✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] ❌ Migration failed:', error.message);
    process.exit(1);
  });

