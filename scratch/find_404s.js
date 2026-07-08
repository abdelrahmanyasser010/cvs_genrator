const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = 'd:/android tog/cvs_genrator';

// Collect all URLs referenced in html and js files
const urlsToCheck = new Set();
urlsToCheck.add('/app/editor.html');
urlsToCheck.add('/app/wizard.html');
urlsToCheck.add('/app/onboarding.html');
urlsToCheck.add('/app/index.html');
urlsToCheck.add('/index.html');
urlsToCheck.add('/favicon.ico');

function scanFile(filePath, basePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  // Match src="...", href="...", url('...'), fetch('...'), link(...)
  const regex = /(?:src|href|url)\s*[=\(]\s*["']?([^"'\)\s>]+)["']?/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let u = match[1];
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('#') || u.startsWith('blob:') || u.startsWith('mailto:')) continue;
    if (u.startsWith('//')) continue;
    
    let resolved;
    if (u.startsWith('/')) {
      resolved = u;
    } else {
      resolved = path.posix.join(basePath, u);
    }
    urlsToCheck.add(resolved);
  }
}

scanFile(path.join(rootDir, 'app/editor.html'), '/app');
scanFile(path.join(rootDir, 'app/wizard.html'), '/app');
scanFile(path.join(rootDir, 'app/onboarding.html'), '/app');
scanFile(path.join(rootDir, 'app/assets/editor.js'), '/app/assets');
scanFile(path.join(rootDir, 'app/assets/wizard.js'), '/app/assets');
scanFile(path.join(rootDir, 'app/assets/style.css'), '/app/assets');
scanFile(path.join(rootDir, 'app/assets/editor.css'), '/app/assets');

// Also check all files in knowledge-base
const professions = ['developer', 'teacher', 'accountant', 'doctor', 'dentist', 'pharmacist', 'nurse', 'lawyer', 'hr', 'marketing', 'sales', 'customer_service', 'graphic_designer', 'ui_ux_designer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'data_analyst', 'project_manager', 'business_analyst', 'speech_therapist'];

professions.forEach(p => {
  urlsToCheck.add(`/knowledge-base/en/${p}/knowledge.json`);
  urlsToCheck.add(`/knowledge-base/ar/${p}/knowledge.json`);
  urlsToCheck.add(`/knowledge-base/en/${p}/professional_summaries.json`);
  urlsToCheck.add(`/knowledge-base/ar/${p}/professional_summaries.json`);
  urlsToCheck.add(`/knowledge-base/skills/en/${p}.json`);
  urlsToCheck.add(`/knowledge-base/skills/ar/${p}.json`);
});

urlsToCheck.add('/knowledge-base/registry.json');
urlsToCheck.add('/app/assets/i18n/ar.json');
urlsToCheck.add('/app/assets/i18n/en.json');
urlsToCheck.add('/app/assets/i18n/ar-EG.json');
urlsToCheck.add('/app/assets/i18n/en-US.json');

console.log(`Checking ${urlsToCheck.size} URLs...`);

let pending = urlsToCheck.size;
let found404 = 0;

urlsToCheck.forEach(u => {
  http.get('http://localhost:3000' + u, (res) => {
    if (res.statusCode === 404) {
      console.log(`[404] ${u}`);
      found404++;
    } else if (res.statusCode !== 200) {
      console.log(`[${res.statusCode}] ${u}`);
    }
    pending--;
    if (pending === 0) {
      console.log(`Done. Found ${found404} 404s.`);
    }
  }).on('error', (err) => {
    console.log(`[ERR] ${u}: ${err.message}`);
    pending--;
    if (pending === 0) {
      console.log(`Done. Found ${found404} 404s.`);
    }
  });
});
