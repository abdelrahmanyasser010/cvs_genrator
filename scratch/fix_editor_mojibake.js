const fs = require('fs');

const target = 'd:/android tog/cvs_genrator/app/assets/editor.js';
let content = fs.readFileSync(target, 'utf8');

const replacements = [
  [/â”€/g, '─'],
  [/ًں‘¤/g, '👤'],
  [/ًں“‌/g, '📝'],
  [/ًں’¼/g, '💼'],
  [/ًںڑ€/g, '🚀'],
  [/âڑ،/g, '⚡'],
  [/ًںژ“/g, '🎓'],
  [/ًںŒچ/g, '🌐'],
  [/ًںڈ†/g, '🏆'],
  [/â­گ/g, '⭐'],
  [/ًں¤‌/g, '🤝'],
  [/â–¼/g, '▼'],
  [/â–²/g, '▲'],
  [/âœ¨/g, '✨'],
  [/âœ‚ï¸ڈ/g, '✂️'],
  [/ًںژ¯/g, '🎯'],
  [/ًںŒگ/g, '🌐'],
  [/ًں’،/g, '💡'],
  [/âœ•/g, '✕'],
  [/ًں“‹/g, '📋'],
  [/âک…/g, '★'],
  [/âک†/g, '☆'],
  [/ًںں¢/g, '🟢'],
  [/ًںں،/g, '🟡'],
  [/ًں”´/g, '🔴'],
  [/âœ“/g, '✓'],
  [/â€¦/g, '…'],
  [/2â€“3/g, '2–3'],
  [/2022 â€“ Present/g, '2022 – Present'],
  [/â€”/g, '—']
];

replacements.forEach(([regex, replacement]) => {
  content = content.replace(regex, replacement);
});

fs.writeFileSync(target, content, 'utf8');
console.log('Successfully updated editor.js!');

// Check remaining potential mojibake
const lines = content.split('\n');
let remaining = 0;
lines.forEach((l, i) => {
  if (/[\u00e2\u00ef\u0153]|ًں|â|ک…|ک†|œ…|œ•|œ¨|œ‚|€/i.test(l)) {
    console.log(`Remaining L${i+1}: ${l.trim()}`);
    remaining++;
  }
});
console.log(`Remaining mojibake lines: ${remaining}`);
