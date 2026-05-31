const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('./icon.svg');

const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

(async () => {
  for (const { size, name } of sizes) {
    await sharp(svg).resize(size, size).png().toFile(name);
    console.log(`✓ ${name}`);
  }
  console.log('Icons generated.');
})();
