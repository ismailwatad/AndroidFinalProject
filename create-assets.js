const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Color for the app (primary color)
const primaryColor = { r: 78, g: 205, b: 196 }; // #4ECDC4

async function createAssets() {
  try {
    // Create icon.png (1024x1024)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: primaryColor,
      },
    })
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ Created icon.png');

    // Create splash.png (1242x2436 for iOS)
    await sharp({
      create: {
        width: 1242,
        height: 2436,
        channels: 4,
        background: primaryColor,
      },
    })
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✓ Created splash.png');

    // Create adaptive-icon.png (1024x1024)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: primaryColor,
      },
    })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ Created adaptive-icon.png');

    // Create favicon.png (48x48)
    await sharp({
      create: {
        width: 48,
        height: 48,
        channels: 4,
        background: primaryColor,
      },
    })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Created favicon.png');

    console.log('\n✅ All assets created successfully!');
  } catch (error) {
    console.error('Error creating assets:', error);
  }
}

createAssets();
