/**
 * MediVault — server.js
 * Reads config from .env file automatically
 * Run: node server.js
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ── Load .env file ───────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── /api/config → Ganache contract config ──────────────────────
  if (req.url === '/api/config') {
    const cfgPath = path.join(__dirname, 'contract-config.json');
    if (fs.existsSync(cfgPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(cfgPath, 'utf8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Contract not deployed. Run: node deploy.js' }));
    }
    return;
  }

  // ── /api/config-sepolia → Sepolia contract config ──────────────
  if (req.url === '/api/config-sepolia') {
    const cfgPath = path.join(__dirname, 'contract-config-sepolia.json');
    if (fs.existsSync(cfgPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(cfgPath, 'utf8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sepolia contract not deployed. Run: node deploy-sepolia.js' }));
    }
    return;
  }

  // ── Static files ────────────────────────────────────────────────
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (_) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(__dirname, relativePath);
  const safeRelativePath = path.relative(__dirname, filePath);
  const pathSegments = safeRelativePath.split(path.sep);
  if (safeRelativePath === '..' || safeRelativePath.startsWith('..' + path.sep)
      || path.isAbsolute(safeRelativePath)
      || pathSegments.some(segment => segment.startsWith('.')
        || segment === 'node_modules'
        || segment === 'contract-config-sepolia.json')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext      = path.extname(filePath).toLowerCase();
  const type     = mime[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

// ── Auto-fallback if port is busy ───────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const next = Number(PORT) + 1;
    console.log(`\n  Port ${PORT} busy — trying ${next}...`);
    server.listen(next, () => printBanner(next));
  } else {
    console.error('Server error:', err.message);
    process.exit(1);
  }
});

server.listen(PORT, () => printBanner(PORT));

function printBanner(port) {
  console.log('\n  ╔══════════════════════════════════════════════════╗');
  console.log('  ║           MediVault Server Running               ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  App       →  http://localhost:${port}               ║`);
  console.log(`  ║  Dashboard →  http://localhost:${port}/medivault/dashboard.html  ║`);
  console.log(`  ║  Config    →  http://localhost:${port}/api/config    ║`);
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  Ganache   →  ${process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545'}       ║`);
  console.log(`  ║  Sepolia   →  Alchemy (configured in .env)       ║`);
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log('  ║  Press Ctrl+C to stop                            ║');
  console.log('  ╚══════════════════════════════════════════════════╝\n');
}
