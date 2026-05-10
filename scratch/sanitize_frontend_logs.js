const fs = require('fs');
const files = [
  'frontend/src/app/dashboard/admin/notifications/page.tsx',
  'frontend/src/app/dashboard/admin/profile/page.tsx',
  'frontend/src/app/dashboard/admin/tasks/page.tsx',
  'frontend/src/app/dashboard/admin/users/page.tsx',
  'frontend/src/app/dashboard/client/messages/page.tsx',
  'frontend/src/app/dashboard/client/orders/page.tsx',
  'frontend/src/app/dashboard/client/settings/page.tsx',
  'frontend/src/app/dashboard/client/shops/page.tsx',
  'frontend/src/app/dashboard/components/Sidebar.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace console.error("message", err) with console.error("message")
  content = content.replace(/console\.error\((['"][^'"]+['"]),\s*(err|error)\);/g, 'console.error($1);');
  
  // Replace console.error(`Erreur lors de l'action ${action}:`, err) with console.error("Erreur lors de execution action")
  content = content.replace(/console\.error\(\`Erreur lors de l'action \$\{action\}:\`,\s*(err|error)\);/g, "console.error('Erreur lors de execution action');");
  
  // Replace console.error("message", err.stack) with console.error("message") -- although we didn't have this, just in case
  content = content.replace(/console\.error\((['"][^'"]+['"]),\s*(err|error)\.stack\);/g, 'console.error($1);');

  // Remove the 'catch (err)' bindings to avoid unused variable errors. ES2019 allows `catch {`
  content = content.replace(/catch\s*\((err|error)(:\s*any)?\)/g, 'catch');

  fs.writeFileSync(file, content);
});

console.log('Fixed logs successfully');
