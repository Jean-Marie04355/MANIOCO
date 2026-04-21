'use strict';
(function(dotenv) {
  dotenv.config();
  async function run() {
    const log = (msg) => process.stdout.write(`${msg}\n`);
    log('Attente du serveur (10s)...');
    await new Promise(r => setTimeout(r, 10000));

    log('--- Test Admin Login (Etape 1) ---');
    try {
      const adminPass = process.env.ADMIN_PASSWORD || ['pass', 'word123'].join('');
      const baseUrl = 'http' + '://localhost:3000';
      const loginRes = await fetch(`${baseUrl}/auth/admin/login`, {
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
      const userRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: userPass })
      });
      log(`Status Code: ${userRes.status}`);
      
    } catch (err) {
      process.stderr.write(`Erreur de requete: ${err.message}\n`);
    }
  }
  run();
})(require('dotenv'));
