const fs = require('fs');
const path = require('path');

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.join(__dirname, 'frontend', 'src');
const files = walkDir(srcDir);
let totalFixed = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix 1: catch { ... console.error("text"); } -> catch (error) { ... console.error("text", error); }
  // Pattern: } catch {
  content = content.replace(
    /\}\s*catch\s*\{/g,
    '} catch (error) {'
  );

  // Fix 2: catch (error) { ... console.error("text"); } -> console.error("text", error);
  // Need to handle nested braces properly
  const catchPattern = /catch\s*\(\s*(error|err|e|error:\s*any)\s*\)\s*\{/g;
  let match;
  let iterations = 0;
  
  while ((match = catchPattern.exec(content)) !== null && iterations < 100) {
    iterations++;
    let varName = match[1].replace(/:\s*any/, '').trim();
    
    const startIdx = match.index + match[0].length;
    let braceCount = 1;
    let i = startIdx;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    const catchBody = content.substring(startIdx, i - 1);
    
    const fixedBody = catchBody.replace(
      /console\.error\("([^"]+)"\);/g,
      (fullMatch, msg) => `console.error("${msg}", ${varName});`
    );
    
    if (fixedBody !== catchBody) {
      content = content.substring(0, startIdx) + fixedBody + content.substring(i - 1);
      catchPattern.lastIndex = 0;
    }
  }
  
  // Fix 3: .catch(() => console.error("text"))
  content = content.replace(
    /\.catch\(\(\)\s*=>\s*console\.error\("([^"]+)"\)\)/g,
    (fullMatch, msg) => `.catch((err) => console.error("${msg}", err))`
  );

  // Fix 4: .catch(err => console.error("text"))
  content = content.replace(
    /\.catch\(\s*(err|error|e)\s*=>\s*console\.error\("([^"]+)"\)\s*\)/g,
    (fullMatch, varName, msg) => `.catch(${varName} => console.error("${msg}", ${varName}))`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log('Fixed:', path.relative(srcDir, filePath));
  }
}

console.log(`\nDone! Fixed ${totalFixed} files.`);

// Verify
let remaining = 0;
for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/console\.error\("[^"]+"\);/g);
  if (matches) {
    remaining += matches.length;
    console.log(`  Still has issues: ${path.relative(srcDir, filePath)} (${matches.length})`);
  }
}
console.log(`\nRemaining: ${remaining}`);
