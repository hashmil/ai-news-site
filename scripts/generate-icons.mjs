import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#09090b"/>
  <rect x="4" y="4" width="504" height="504" rx="92" fill="none" stroke="#a855f7" stroke-width="4" opacity="0.5"/>
  <!-- Brain left hemisphere -->
  <path d="M256 110 C195 110, 125 165, 125 240 C125 285, 148 310, 178 332 C200 348, 218 372, 228 400 C236 420, 248 432, 256 438"
        fill="none" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
  <path d="M256 155 C215 155, 160 190, 160 245 C160 278, 182 302, 210 318"
        fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
  <!-- Brain right hemisphere -->
  <path d="M256 110 C317 110, 387 165, 387 240 C387 285, 364 310, 334 332 C312 348, 294 372, 284 400 C276 420, 264 432, 256 438"
        fill="none" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
  <path d="M256 155 C297 155, 352 190, 352 245 C352 278, 330 302, 302 318"
        fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
  <!-- Neural nodes -->
  <circle cx="175" cy="210" r="12" fill="#a855f7"/>
  <circle cx="337" cy="210" r="12" fill="#a855f7"/>
  <circle cx="198" cy="295" r="9" fill="#c084fc"/>
  <circle cx="314" cy="295" r="9" fill="#c084fc"/>
  <circle cx="256" cy="170" r="10" fill="#a855f7"/>
  <circle cx="228" cy="365" r="7" fill="#c084fc" opacity="0.8"/>
  <circle cx="284" cy="365" r="7" fill="#c084fc" opacity="0.8"/>
  <circle cx="256" cy="130" r="7" fill="#a855f7" opacity="0.6"/>
  <!-- Connections -->
  <line x1="175" y1="210" x2="256" y2="170" stroke="#a855f7" stroke-width="3" opacity="0.35"/>
  <line x1="337" y1="210" x2="256" y2="170" stroke="#a855f7" stroke-width="3" opacity="0.35"/>
  <line x1="198" y1="295" x2="228" y2="365" stroke="#c084fc" stroke-width="2" opacity="0.3"/>
  <line x1="314" y1="295" x2="284" y2="365" stroke="#c084fc" stroke-width="2" opacity="0.3"/>
  <line x1="175" y1="210" x2="198" y2="295" stroke="#a855f7" stroke-width="2" opacity="0.3"/>
  <line x1="337" y1="210" x2="314" y2="295" stroke="#a855f7" stroke-width="2" opacity="0.3"/>
</svg>`;

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png()
    .toFile(join(PUBLIC, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

writeFileSync(join(PUBLIC, 'favicon.svg'), SVG);
console.log('Updated favicon.svg');
console.log('Done!');
