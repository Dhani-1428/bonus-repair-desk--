const { spawn } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('🚀 STARTING BACKEND SERVER');
console.log('========================================\n');

// Path to main project directory (one level up)
const backendPath = path.join(__dirname, '..');

console.log('Backend path:', backendPath);
console.log('Starting backend server...\n');

// Start the backend server
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendPath,
  shell: true,
  stdio: 'inherit'
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Backend server exited with code ${code}`);
  }
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nStopping backend server...');
  backend.kill();
  process.exit(0);
});

console.log('✅ Backend server is starting...');
console.log('📱 Keep this terminal open while using the mobile app!');
console.log('Press Ctrl+C to stop the server\n');
