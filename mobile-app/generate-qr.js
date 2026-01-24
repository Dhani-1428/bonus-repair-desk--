// Generate QR code for Expo connection
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Your computer's IP and Expo port
const IP = '172.20.10.6';
const PORT = '8081';
const expoUrl = `exp://${IP}:${PORT}`;

console.log('Generating QR code...');
console.log('Connection URL:', expoUrl);

QRCode.toFile(path.join(__dirname, 'qr-code.png'), expoUrl, {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  width: 500,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, function (err) {
  if (err) {
    console.error('Error generating QR code:', err);
  } else {
    console.log('✅ QR code generated! Check qr-code.png');
    console.log('\n📱 Scan this QR code with Expo Go app on your phone!');
    console.log('\nConnection URL:', expoUrl);
  }
});
