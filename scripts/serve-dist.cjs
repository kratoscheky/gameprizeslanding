const http = require('http');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..', 'dist');
const port = process.env.PORT || 5000;

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(root, decodeURIComponent(urlPath));
  if (!filePath.startsWith(root)) return res.writeHead(403).end('Forbidden');
  fs.stat(filePath, (err, stat) => {
    if (err) return res.writeHead(404).end('Not found');
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => console.log(`Serving dist at http://localhost:${port}`));
