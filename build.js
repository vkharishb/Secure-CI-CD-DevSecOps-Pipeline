// scripts/build.js
// Simple build step: copies src/ → dist/ and public/ → dist/public/
// Swap this for tsc, esbuild, rollup, etc. as needed.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SRC     = path.join(ROOT, 'src');
const PUBLIC  = path.join(ROOT, 'public');
const DIST    = path.join(ROOT, 'dist');

const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

console.log('🔨  Building…');
fs.rmSync(DIST, { recursive: true, force: true });
copyDir(SRC,    DIST);
copyDir(PUBLIC, path.join(DIST, '..', 'public'));  // keep public at root
console.log('✅  Build complete → dist/');
