const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  // Strip query strings
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const mime = MIME[path.extname(filePath)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Thea's Gymnastics: http://localhost:${PORT}`));
