// Generate all required app assets using Sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function generateAssets() {
  console.log('🎨 Generating app assets...\n');

  // Create SVG templates
  const createIconSVG = (text, size) => `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#000000"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="#e78a53" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>
  `;

  const createSplashSVG = () => `
    <svg width="1242" height="2436" xmlns="http://www.w3.org/2000/svg">
      <rect width="1242" height="2436" fill="#000000"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#e78a53" text-anchor="middle" dominant-baseline="middle">Bonus Repair Desk</text>
    </svg>
  `;

  try {
    // 1. Generate icon.png (1024x1024)
    console.log('Creating icon.png (1024x1024)...');
    const iconSVG = Buffer.from(createIconSVG('BRD', 1024));
    await sharp(iconSVG)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ icon.png created');

    // 2. Generate adaptive-icon.png (1024x1024)
    console.log('Creating adaptive-icon.png (1024x1024)...');
    const adaptiveIconSVG = Buffer.from(createIconSVG('BRD', 1024));
    await sharp(adaptiveIconSVG)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png created');

    // 3. Generate splash.png (1242x2436)
    console.log('Creating splash.png (1242x2436)...');
    const splashSVG = Buffer.from(createSplashSVG());
    await sharp(splashSVG)
      .resize(1242, 2436)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ splash.png created');

    // 4. Generate favicon.png (512x512)
    console.log('Creating favicon.png (512x512)...');
    const faviconSVG = Buffer.from(createIconSVG('BRD', 512));
    await sharp(faviconSVG)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png created');

    console.log('\n🎉 All assets generated successfully!');
    console.log('\n📁 Files created in: assets/');
    console.log('   - icon.png (1024x1024)');
    console.log('   - adaptive-icon.png (1024x1024)');
    console.log('   - splash.png (1242x2436)');
    console.log('   - favicon.png (512x512)');
    console.log('\n✅ You can now build your APK!');

  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

generateAssets();
