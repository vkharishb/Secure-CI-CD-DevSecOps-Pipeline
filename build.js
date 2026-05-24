'use strict';

const fs = require('fs');
const path = require('path');

// Since build.js is now in project root
const ROOT = __dirname;

const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.log(`⚠️ Skipping missing folder: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

console.log('🔨 Building...');

// Clean dist folder
fs.rmSync(DIST, { recursive: true, force: true });

// Copy app source
copyDir(SRC, DIST);

// Copy static files
copyDir(PUBLIC, path.join(DIST, 'public'));

console.log('✅ Build complete → dist/');