// Simple web server to test the app locally
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files from web-app directory
app.use(express.static(path.join(__dirname, 'web-app')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-app', 'index.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('✅ MOBILE APP TEST SERVER RUNNING!');
  console.log('========================================');
  console.log('');
  console.log(`🌐 Open this link on your phone:`);
  console.log(`   http://172.20.10.6:${PORT}`);
  console.log('');
  console.log(`💻 Or open in browser:`);
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
