/**
 * Sirve la web empaquetada en /sr-web/* para el WebView (Expo Go no expone assets/web en file://).
 */
const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const webRoot = path.join(__dirname, 'assets', 'web');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const raw = (req.url || '').split('?')[0];
    if (!raw.startsWith('/sr-web')) {
      return middleware(req, res, next);
    }

    let rel = raw.replace(/^\/sr-web\/?/, '') || 'index.html';
    const filePath = path.normalize(path.join(webRoot, rel));
    if (!filePath.startsWith(webRoot)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(fs.readFileSync(filePath));
    } catch {
      res.statusCode = 500;
      res.end('Error');
    }
  };
};

module.exports = config;
