const fs = require('fs');
const path = require('path');

function scan(dir, results) {
  fs.readdirSync(dir, {withFileTypes: true}).forEach(d => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('scratch') && !full.includes('.gemini')) {
        scan(full, results);
      }
    } else if (/\.(html|js|css|json|md)$/.test(d.name)) {
      const content = fs.readFileSync(full, 'utf8');
      // Look for non-ascii characters that look like mojibake
      // Typical CP1252 mojibake for UTF-8 starts with â (U+00E2), ً (U+064B or similar Arabic diacritics when UTF-8 bytes U+F0/U+9F etc are interpreted in CP1256!)
      const lines = content.split('\n');
      let fileMatches = [];
      lines.forEach((l, i) => {
        // match anything with â, ً, ï, œ, ڑ, ک, etc when combined with symbols
        if (/[\u00e2\u064b\u0651\u064f\u0650\u064e\u064d\u00ef\u0153]/i.test(l)) {
          // let's check if it's actual Arabic or mojibake. In Arabic, U+064B is Tanwin Fath (ً). But when followed by ں (U+06CC / U+06C9) or ‘ (U+2018), it's mojibake!
          if (/â|ًں|ï¸|âœ|â–|âک|â€|âڑ|âگ/.test(l)) {
            fileMatches.push({line: i+1, text: l.trim()});
          }
        }
      });
      if (fileMatches.length > 0) {
        results[full] = fileMatches;
      }
    }
  });
}

const res = {};
scan('.', res);
console.log(`Found mojibake in ${Object.keys(res).length} files:`);
for (const [f, matches] of Object.entries(res)) {
  console.log(`\n=== ${f} (${matches.length} matches) ===`);
  matches.slice(0, 15).forEach(m => console.log(`  L${m.line}: ${m.text.slice(0, 100)}`));
  if (matches.length > 15) console.log(`  ... and ${matches.length - 15} more`);
}
