const fs = require('fs');
const http = require('http');
const path = require('path');
const { generateWithGemini } = require('./api/ai/gemini-service');
const { checkRequest } = require('./api/ai/request-guard');

const ROOT = __dirname;
let PORT = Number(process.env.PORT || 5500);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

loadEnvFile();

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

function staticPath(urlPath) {
  let decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded === '/app') decoded = '/app/index.html';
  else if (decoded === '/app/wizard.html' || decoded === '/wizard.html') decoded = '/app/onboarding.html';
  else if (decoded === '/editor.html') decoded = '/app/editor.html';
  else if (decoded === '/favicon.ico' && !fs.existsSync(path.join(ROOT, 'favicon.ico'))) return 'FAVICON';
  else if (decoded.endsWith('/')) decoded += 'index.html';
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let target = path.join(ROOT, normalized === '/' ? 'index.html' : normalized);
  if (target === 'FAVICON') return target;
  if (!target.startsWith(ROOT)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const idxPath = path.join(target, 'index.html');
    if (fs.existsSync(idxPath)) target = idxPath;
  }
  return target;
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/ai/generate')) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
    try {
      const payload = await readBody(req);
      const guard = checkRequest(req, payload);
      if (!guard.ok) return sendJson(res, guard.status, guard.body, guard.headers || {});
      const result = await generateWithGemini(payload);
      return sendJson(res, result.status, result.body, guard.headers || {});
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'AI request failed.' });
    }
  }

  if (req.url.startsWith('/api/telemetry/client-error')) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
    try {
      const payload = await readBody(req);
      const clean = {
        type: String(payload.type || '').slice(0, 30),
        message: String(payload.message || '').slice(0, 500),
        stack: String(payload.stack || '').slice(0, 1800),
        path: String(payload.path || '').slice(0, 180),
        viewport: String(payload.viewport || '').slice(0, 40),
        build: String(payload.build || '').slice(0, 40)
      };
      console.error('[CLIENT_ERROR]', JSON.stringify(clean));
      return sendJson(res, 202, { accepted: true });
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid error report.' });
    }
  }

  const target = staticPath(req.url);
  if (target === 'FAVICON') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(target).pipe(res);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE' && PORT < 5600) {
    const oldPort = PORT;
    PORT += 1;
    console.log(`Port ${oldPort} is busy, trying ${PORT}...`);
    server.listen(PORT);
    return;
  }
  throw error;
});

server.listen(PORT, () => {
  const aiState = process.env.GEMINI_API_KEY ? 'Gemini AI enabled' : 'Gemini AI not configured';
  console.log(`CV Studio running at http://localhost:${PORT}/app/onboarding.html`);
  console.log(aiState);
});
