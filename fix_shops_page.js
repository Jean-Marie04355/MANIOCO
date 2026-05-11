const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'app', 'dashboard', 'client', 'shops', '[id]', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: console.error without error variable
content = content.replace(
  'console.error("Erreur initiation chat");',
  'console.error("Erreur initiation chat", error);'
);

content = content.replace(
  'console.error("Erreur de chargement de la boutique");',
  'console.error("Erreur de chargement de la boutique", error);'
);

// Fix 2: Replace role="button" div with semantic button in ProductCard
content = content.replace(
  /<div \n                       onClick=\{.*?addToCart\(product\).*?\}\n                       onKeyDown=\{.*?\}\n                       role="button"\n                       tabIndex=\{0\}\n                       aria-label=\{`Ajouter \$\{product\.name\} au panier`\}\n                       className="w-14 h-14 rounded-2xl bg-white text-\[#1a2e22\] flex items-center justify-center group-hover:bg-\[#c5a059\] group-hover:text-white transition-all shadow-xl cursor-pointer"\n                    >\n                       <ShoppingCart size=\{20\} \/>\n                    <\/div>/s,
  `<button \n                       type="button"\n                       onClick={(e) => { e.preventDefault(); addToCart(product); }}\n                       aria-label={\`Ajouter \${product.name} au panier\`}\n                       className="w-14 h-14 rounded-2xl bg-white text-[#1a2e22] flex items-center justify-center group-hover:bg-[#c5a059] group-hover:text-white transition-all shadow-xl cursor-pointer"\n                    >\n                       <ShoppingCart size={20} />\n                    </button>`
);

// Simpler approach for role="button" - just do string replacements
const lines = content.split('\n');
const newLines = [];
let skipLines = 0;

for (let i = 0; i < lines.length; i++) {
  if (skipLines > 0) {
    skipLines--;
    continue;
  }
  
  const line = lines[i];
  const trimmed = line.trim();
  
  // Fix the ProductCard add-to-cart div
  if (trimmed === '<div' && i+1 < lines.length && lines[i+1].trim().startsWith('onClick={(e) => { e.preventDefault(); addToCart(product)')) {
    // Check if this block has role="button"
    let hasRole = false;
    for (let j = i; j < Math.min(i+8, lines.length); j++) {
      if (lines[j].includes('role="button"')) {
        hasRole = true;
        break;
      }
    }
    if (hasRole) {
      // Find the closing </div> for this element
      const indent = line.match(/^(\s*)/)[1];
      newLines.push(indent + '<button ');
      newLines.push(indent + '   type="button"');
      // Skip onClick line, keep it
      i++;
      newLines.push(lines[i]); // onClick
      i++; // skip onKeyDown
      i++; // skip role="button"
      i++; // skip tabIndex
      // Continue with remaining attributes
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '</div>') {
          newLines.push(indent + '</button>');
          break;
        }
        newLines.push(l);
        i++;
      }
      continue;
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('File patched successfully!');

// Verify
const updated = fs.readFileSync(filePath, 'utf8');
console.log('Has role="button":', updated.includes('role="button"'));
console.log('Has console.error without var:', 
  (updated.match(/console\.error\("[^"]+"\);/g) || []).length, 'occurrences');
