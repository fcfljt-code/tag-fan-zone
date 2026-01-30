const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// TSG Hoffenheim Icon als SVG
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a55ab"/>
      <stop offset="100%" style="stop-color:#003366"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="102" fill="url(#bgGrad)"/>
  <circle cx="256" cy="200" r="90" fill="white"/>
  <path d="M256 130 L290 160 L275 205 L237 205 L222 160 Z" fill="#1a55ab"/>
  <path d="M222 160 L190 175 L195 215 L237 205 Z" fill="#1a55ab" opacity="0.85"/>
  <path d="M290 160 L322 175 L317 215 L275 205 Z" fill="#1a55ab" opacity="0.85"/>
  <path d="M237 205 L230 250 L256 270 L282 250 L275 205 Z" fill="#1a55ab" opacity="0.7"/>
  <text x="256" y="370" text-anchor="middle" fill="white" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="80">TSG</text>
  <text x="256" y="440" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-weight="700" font-size="48">1899</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'images', 'icons');

async function generateIcons() {
    console.log('Generiere Icons...');

    // Verzeichnis erstellen falls nicht vorhanden
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    // SVG zu Buffer
    const svgBuffer = Buffer.from(iconSVG);

    for (const size of sizes) {
        const filename = `icon-${size}x${size}.png`;
        const outputPath = path.join(iconsDir, filename);

        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath);

        console.log(`  ✓ ${filename} erstellt`);
    }

    // Auch favicon.ico erstellen (als PNG, da ICO komplexer ist)
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(iconsDir, 'favicon.png'));

    console.log('  ✓ favicon.png erstellt');
    console.log('\\nAlle Icons wurden erfolgreich erstellt!');
}

generateIcons().catch(console.error);
