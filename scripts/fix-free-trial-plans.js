/**
 * Fix Free Trial Subscriptions
 * 
 * This script updates all FREE_TRIAL subscriptions to use "MONTHLY" as the plan
 * since the plan field is just a placeholder during free trials.
 * The actual plan should only be set when the user purchases a subscription.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixFreeTrialPlans() {
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
    console.log('🔍 Checking FREE_TRIAL subscriptions...\n');
    
    // Get all free trial subscriptions
    const [trials] = await connection.execute(
      `SELECT s.id, s.userId, s.plan, s.status, s.isFreeTrial, u.email 
       FROM subscriptions s
       JOIN users u ON s.userId = u.id
       WHERE s.status = 'FREE_TRIAL' AND s.isFreeTrial = TRUE`
    );
    
    console.log(`Found ${trials.length} FREE_TRIAL subscription(s)\n`);
    
    if (trials.length === 0) {
      console.log('✅ No free trial subscriptions to fix.');
      return;
    }
    
    // Show current plans
    console.log('Current plans for FREE_TRIAL subscriptions:');
    trials.forEach((trial, index) => {
      console.log(`   ${index + 1}. ${trial.email}: ${trial.plan}`);
    });
    
    // Update all free trials to MONTHLY
    const [result] = await connection.execute(
      `UPDATE subscriptions 
       SET plan = 'MONTHLY' 
       WHERE status = 'FREE_TRIAL' AND isFreeTrial = TRUE AND plan != 'MONTHLY'`
    );
    
    console.log(`\n✅ Updated ${result.affectedRows} subscription(s) to MONTHLY plan`);
    console.log('   (Plan is just a placeholder during free trial - actual plan will be set on purchase)\n');
    
    // Verify the update
    const [updated] = await connection.execute(
      `SELECT s.id, s.userId, s.plan, s.status, s.isFreeTrial, u.email 
       FROM subscriptions s
       JOIN users u ON s.userId = u.id
       WHERE s.status = 'FREE_TRIAL' AND s.isFreeTrial = TRUE`
    );
    
    console.log('Updated subscriptions:');
    updated.forEach((trial, index) => {
      console.log(`   ${index + 1}. ${trial.email}: ${trial.plan} ✓`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixFreeTrialPlans().catch(console.error);

