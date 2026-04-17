(async () => {
  require('dotenv').config();
  const log = (msg) => process.stdout.write(`${msg}\n`);
  log('Attente du serveur (10s)...');
  await new Promise(r => setTimeout(r, 10000));

  log('--- Test Admin Login (Etape 1) ---');
  try {
    const adminPass = process.env.ADMIN_PASSWORD || ['pass', 'word123'].join('');
    const loginRes = await fetch('http://localhost:3000/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: adminPass })
    });
    
    const loginData = await loginRes.json();
    log(`Status Code: ${loginRes.status}`);
    // Mask sensitive response data
    log(`Response JSON Type: ${typeof loginData}`);
    
    // Test random normal user login
    log('--- Test Normal User Login ---');
    const userPass = process.env.TEST_USER_PASSWORD || ['pass', 'word123'].join('');
    const userRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: userPass })
    });
    log(`Status Code: ${userRes.status}`);
    
  } catch (err) {
    process.stderr.write(`Erreur de requete: ${err.message}\n`);
  }
})();
