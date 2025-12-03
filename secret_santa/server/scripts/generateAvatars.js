const https = require('https');
const fs = require('fs');
const path = require('path');

// Christmas-themed seeds
const seeds = [
  'GiftBox', 'Tree', 'CandyCane', 'Bell', 'Snowflake',
  'Ribbon', 'Stocking', 'Ornament', 'Candle', 'SantaHat',
  'Star', 'Reindeer', 'Wreath', 'Gingerbread', 'Snowman',
  'IceSkate', 'Mittens', 'HotChoco', 'Fireplace', 'Angel',
  'Sleigh', 'Elf', 'Mistletoe', 'PolarBear', 'Penguin',
  'Nutcracker', 'Chimney', 'Cookie', 'Poinsettia', 'Lights'
];

// Avatar styles (different DiceBear collections)
const styles = [
  'shapes',
  'bottts',
  'adventurer',
  'personas',
  'miniavs',
  'avataaars'
];

async function downloadAvatar(style, seed) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=cc0000,ffffff,1e7e34,f5f5f5`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function downloadAllAvatars() {
  const publicDir = path.join(__dirname, '../../public');
  const avatarsDir = path.join(publicDir, 'avatars');
  
  // Create directories
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const avatarList = [];
  let totalDownloaded = 0;

  console.log('🎅 Downloading Christmas avatars from DiceBear...\n');
  console.log(`📊 Styles: ${styles.length}`);
  console.log(`🎄 Seeds per style: ${seeds.length}`);
  console.log(`🎁 Total to download: ${styles.length * seeds.length}\n`);

  for (const style of styles) {
    const styleDir = path.join(avatarsDir, style);
    
    if (!fs.existsSync(styleDir)) {
      fs.mkdirSync(styleDir, { recursive: true });
    }

    console.log(`\n📁 Downloading style: ${style}`);

    for (const seed of seeds) {
      try {
        // Download SVG from DiceBear API
        const svg = await downloadAvatar(style, seed);
        
        // Save to file
        const fileName = `${seed}.svg`;
        const filePath = path.join(styleDir, fileName);
        fs.writeFileSync(filePath, svg);

        // Add to metadata
        avatarList.push({
          name: `${style}-${seed}`,
          path: `/avatars/${style}/${fileName}`,
          style: style,
          seed: seed
        });

        totalDownloaded++;
        process.stdout.write(`   ✅ ${totalDownloaded}/${styles.length * seeds.length} - ${seed}.svg\r`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`\n   ❌ Failed to download ${style}/${seed}:`, error.message);
      }
    }
  }

  // Save metadata JSON
  const metadataPath = path.join(avatarsDir, 'avatars.json');
  fs.writeFileSync(metadataPath, JSON.stringify(avatarList, null, 2));

  console.log(`\n\n✅ Successfully downloaded ${totalDownloaded} avatars!`);
  console.log(`📁 Location: ${avatarsDir}`);
  console.log(`📄 Metadata: ${metadataPath}`);
  console.log(`\n🎄 You can now use these avatars offline!`);
}

downloadAllAvatars().catch(console.error);