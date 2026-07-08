const fs = require('fs');
const http = require('http');

function testHtml(file, urlPath) {
  const html = fs.readFileSync(file, 'utf8');
  const regex = /<(?:script|link)[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let u = match[1];
    if (u.startsWith('http') || u.startsWith('data:')) continue;
    let full = u.startsWith('/') ? u : (urlPath + '/' + u).replace(/\/\//g, '/');
    http.get('http://localhost:3000' + full, res => {
      if (res.statusCode === 404) {
        console.log(`[404 IN ${file}] ${full}`);
      } else {
        console.log(`[${res.statusCode}] ${full}`);
      }
    }).on('error', err => console.log('Err:', full, err.message));
  }
}

testHtml('d:/android tog/cvs_genrator/app/editor.html', '/app');
testHtml('d:/android tog/cvs_genrator/app/onboarding.html', '/app');
testHtml('d:/android tog/cvs_genrator/app/index.html', '/app');
testHtml('d:/android tog/cvs_genrator/app/templates.html', '/app');
testHtml('d:/android tog/cvs_genrator/index.html', '');
