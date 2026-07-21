const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const errors = [];

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'legacy' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (!predicate || predicate(full)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function checkJson() {
  for (const file of walk(root, file => file.endsWith('.json'))) {
    try {
      JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`${rel(file)}: invalid JSON (${error.message})`);
    }
  }
}

function checkJsSyntax() {
  const dirs = ['app', 'engine', 'coach', 'tools', 'api'];
  for (const dir of dirs) {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const file of walk(fullDir, file => file.endsWith('.js'))) {
      try {
        new vm.Script(fs.readFileSync(file, 'utf8'), { filename: rel(file) });
      } catch (error) {
        errors.push(`${rel(file)}: JavaScript syntax error (${error.message})`);
      }
    }
  }

  const localServer = path.join(root, 'local-server.js');
  if (fs.existsSync(localServer)) {
    try {
      new vm.Script(fs.readFileSync(localServer, 'utf8'), { filename: rel(localServer) });
    } catch (error) {
      errors.push(`${rel(localServer)}: JavaScript syntax error (${error.message})`);
    }
  }
}

function localAssetPath(value, fromFile) {
  if (!value || value.startsWith('#')) return null;
  if (/^(https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value)) return null;
  const clean = value.split('#')[0].split('?')[0];
  if (!clean) return null;
  return clean.startsWith('/')
    ? path.join(root, clean.slice(1))
    : path.resolve(path.dirname(fromFile), clean);
}

function checkHtmlAssets() {
  const htmlFiles = walk(root, file => file.endsWith('.html'));
  const attrPattern = /\b(?:src|href)=["']([^"']+)["']/g;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = attrPattern.exec(html))) {
      const target = localAssetPath(match[1], file);
      if (target && !fs.existsSync(target)) {
        errors.push(`${rel(file)}: missing asset ${match[1]}`);
      }
    }
  }
}

function checkRequiredEntrypoints() {
  [
    'index.html',
    'app/index.html',
    'app/editor.html',
    'app/assets/safety.js',
    'app/assets/telemetry.js',
    'app/privacy.html',
    'api/ai/generate.js',
    'api/ai/gemini-service.js',
    'api/ai/task-prompts.js',
    'api/ai/request-guard.js',
    'api/telemetry/client-error.js',
    'local-server.js',
    'engine/renderers/cv.js',
    'knowledge-base/registry.json'
  ].forEach(file => {
    if (!fs.existsSync(path.join(root, file))) errors.push(`missing required file: ${file}`);
  });
}


function checkProductionSafety() {
  const clientFiles = [
    'app/assets/ai-client.js',
    'app/assets/ai-settings.js',
    'app/assets/editor.js',
    'vercel.json',
    '_headers'
  ];
  const forbidden = [
    /cv_studio_ai_key/i,
    /api\.openai\.com/i,
    /api\.anthropic\.com/i,
    /openrouter\.ai/i,
    /generativelanguage\.googleapis\.com/i
  ];
  for (const file of clientFiles) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(content)) errors.push(`${file}: forbidden browser-side AI key/provider reference (${pattern})`);
    }
  }

  const aiClient = fs.readFileSync(path.join(root, 'app/assets/ai-client.js'), 'utf8');
  if (!aiClient.includes("task: 'summary'") || !aiClient.includes("X-CV-Session")) {
    errors.push('app/assets/ai-client.js: task-based same-origin AI client guard is missing');
  }

  const storage = fs.readFileSync(path.join(root, 'engine/career-storage.js'), 'utf8');
  if (!storage.includes('downloadBackup') || !storage.includes('RECOVERY_KEY')) {
    errors.push('engine/career-storage.js: backup/recovery protection is missing');
  }

  const editor = fs.readFileSync(path.join(root, 'app/assets/editor.js'), 'utf8');
  if (/application\/msword/.test(editor)) {
    errors.push('app/assets/editor.js: fake .doc fallback must not ship');
  }
}

checkRequiredEntrypoints();
checkJson();
checkJsSyntax();
checkHtmlAssets();
checkProductionSafety();

if (errors.length) {
  console.error(`Production check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Production check passed.');
