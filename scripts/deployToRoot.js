#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

async function main(){
  try{
    const repoRoot = path.resolve(__dirname, '..');
    const dist = path.join(repoRoot, 'dist');
    const targetIndex = path.join(repoRoot, 'index.html');
    const targetAssets = path.join(repoRoot, 'assets');

    // ensure dist exists
    await fs.stat(dist);

    // copy index.html
    await copyRecursive(path.join(dist, 'index.html'), targetIndex);

    // remove existing ./assets (if any) and replace with dist/assets
    try{ await fs.rm(targetAssets, { recursive: true, force: true }); } catch(e){}
    await copyRecursive(path.join(dist, 'assets'), targetAssets);

    console.log('deployToRoot: copied dist/index.html and dist/assets -> ./index.html and ./assets');
  }catch(err){
    console.error('deployToRoot failed:', err.message);
    process.exit(1);
  }
}

main();
