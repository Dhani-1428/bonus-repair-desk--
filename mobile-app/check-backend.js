const http = require('http');

const BACKEND_URL = 'http://localhost:3000';
const API_URL = 'http://192.168.0.11:3000';

console.log('========================================');
console.log('🔍 CHECKING BACKEND SERVER STATUS');
console.log('========================================\n');

function checkServer(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name} is RUNNING!`);
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} is NOT running`);
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`❌ ${name} is NOT running (timeout)`);
      resolve(false);
    });
  });
}

async function checkBackend() {
  console.log('Checking backend server...\n');
  
  const localRunning = await checkServer(BACKEND_URL + '/api/test-db', 'Backend (localhost)');
  const networkRunning = await checkServer(API_URL + '/api/test-db', 'Backend (network)');
  
  console.log('\n========================================\n');
  
  if (!localRunning && !networkRunning) {
    console.log('❌ BACKEND SERVER IS NOT RUNNING!\n');
    console.log('TO FIX THIS:\n');
    console.log('1. Open a terminal in mobile-app folder');
    console.log('2. Run: npm run start-backend');
    console.log('3. Wait for: "✅ Backend server is READY!"');
    console.log('4. Then try the app again\n');
    console.log('OR double-click: START_BACKEND_AND_WAIT.bat\n');
    process.exit(1);
  } else {
    console.log('✅ Backend server is running!');
    console.log('The app should work now.\n');
    process.exit(0);
  }
}

checkBackend();
