'use strict';
// Servidor proprio do projeto: serve os arquivos estaticos de docs/.
// Sem dependencias externas. Porta via env PORT (padrao 5174).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC = path.join(__dirname, 'docs');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}

function handle(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://x');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC)) {
      return send(res, 403, 'text/plain; charset=utf-8', 'negado');
    }
    fs.readFile(file, (err, data) => {
      if (err) return send(res, 404, 'text/plain; charset=utf-8', 'nao encontrado');
      const ext = path.extname(file).toLowerCase();
      send(res, 200, TYPES[ext] || 'application/octet-stream', data);
    });
  } catch (e) {
    send(res, 400, 'text/plain; charset=utf-8', 'requisicao invalida');
  }
}

const server = http.createServer(handle);

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    const host = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Remember Kanban a servir em http://${host}:${PORT}`);
  });
}

module.exports = { server, handle };
