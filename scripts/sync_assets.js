const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicAssetsDir = path.join(rootDir, 'client', 'public', 'assets');

const folders = ['Character', 'Farm Animals', 'Objects', 'Tileset'];

for (const f of folders) {
  const src = path.join(rootDir, f);
  const dest = path.join(publicAssetsDir, f);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`[Sync] Copied ${f} -> client/public/assets/${f}`);
  }
}

console.log('[Sync] Asset sync complete.');
