const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('========================================');
console.log('🚀 STARTING BACKEND SERVER');
console.log('========================================\n');

// Path to main project directory (one level up)
const backendPath = path.join(__dirname, '..');
const backendUrl = 'http://localhost:3000';

console.log('Backend path:', backendPath);
console.log('Backend URL:', backendUrl);
console.log('Starting backend server...\n');

// Function to check if server is running
function checkServer(callback) {
  const req = http.get(backendUrl, (res) => {
    callback(true);
  });
  
  req.on('error', () => {
    callback(false);
  });
  
  req.setTimeout(2000, () => {
    req.destroy();
    callback(false);
  });
}

// Check if server is already running
checkServer((isRunning) => {
  if (isRunning) {
    console.log('✅ Backend server is already running!');
    console.log('📱 You can now start Expo with: npm start\n');
    process.exit(0);
  } else {
    // Start the backend server
    console.log('Starting backend server...\n');
    
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      shell: true,
      stdio: 'inherit'
    });

    backend.on('error', (error) => {
      console.error('❌ Failed to start backend server:', error);
      console.error('\nMake sure you have run "npm install" in the main project folder!');
      process.exit(1);
    });

    backend.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Backend server exited with code ${code}`);
        console.error('Check the error messages above for details.');
      }
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\nStopping backend server...');
      backend.kill();
      process.exit(0);
    });

    console.log('✅ Backend server is starting...');
    console.log('⏳ Waiting for server to be ready...');
    console.log('📱 Once you see "Ready", you can start Expo in another terminal!');
    console.log('📱 Run: npm start (in mobile-app folder)\n');
    console.log('Press Ctrl+C to stop the server\n');
    
    // Check server status every 5 seconds
    let checkCount = 0;
    const statusCheck = setInterval(() => {
      checkCount++;
      checkServer((isRunning) => {
        if (isRunning && checkCount > 2) {
          console.log('\n✅ Backend server is READY!');
          console.log('📱 You can now start Expo with: npm start\n');
          clearInterval(statusCheck);
        }
      });
    }, 5000);
  }
});
