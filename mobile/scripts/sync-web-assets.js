/**
 * Copia frontend/dist → mobile/assets/web (para Expo asset bundle).
 * Ejecutar desde mobile/: node scripts/sync-web-assets.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const src = path.join(root, 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'assets', 'web');

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) rmrf(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function cpdir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const sf = path.join(from, ent.name);
    const df = path.join(to, ent.name);
    if (ent.isDirectory()) cpdir(sf, df);
    else fs.copyFileSync(sf, df);
  }
}

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('No existe frontend/dist/index.html — ejecuta primero: cd frontend && npm run build:mobile');
  process.exit(1);
}

rmrf(dest);
cpdir(src, dest);
console.log(`OK: ${src} → ${dest}`);
