const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

const dashboardDir = path.join('frontend', 'src', 'app', 'dashboard');
const files = walkDir(dashboardDir);
let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Fix: console.error("message", err) or console.error("message", error) or console.error("message", e)
  content = content.replace(/console\.error\(("[^"]*"|'[^']*'),\s*(err|error|e)\)/g, (match, msg) => {
    return `console.error(${msg})`;
  });

  // 2. Fix: console.error(`template`, err)
  content = content.replace(/console\.error\((`[^`]*`),\s*(err|error|e)\)/g, (match, msg) => {
    return `console.error(${msg})`;
  });

  // 3. Fix: .catch(err => console.error("message", err))
  content = content.replace(/\.catch\(\s*(err|error|e)\s*=>\s*console\.error\(("[^"]*"|'[^']*'),\s*\1\)\)/g, (match, varName, msg) => {
    return `.catch(() => console.error(${msg}))`;
  });

  // 4. Fix: .catch(console.error)
  content = content.replace(/\.catch\(console\.error\)/g, '.catch(() => { /* error handled silently */ })');

  // 5. Clean trailing colons from messages: console.error("Erreur xyz:")  -> console.error("Erreur xyz")
  content = content.replace(/console\.error\("([^"]*):"\)/g, 'console.error("$1")');
  content = content.replace(/console\.error\('([^']*):'\)/g, "console.error('$1')");

  if (content !== original) {
    fs.writeFileSync(file, content);
    const fixes = (original.length - content.length);
    totalFixes++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nTotal files fixed: ${totalFixes}`);
