const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(file)) {
  console.error('dist/index.html not found, skipping stripCrossorigin');
  process.exit(0);
}
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\s+crossorigin(?=(\s|>|=))/g, '');
fs.writeFileSync(file, content, 'utf8');
console.log('Removed crossorigin attributes from dist/index.html');
