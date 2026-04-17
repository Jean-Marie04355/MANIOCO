async function run() {
  console.log('Attente du serveur (10s)...');
  await new Promise(r => setTimeout(r, 10000));

  console.log('--- Test Admin Login (Etape 1) ---');
  try {
    const loginRes = await fetch('http://localhost:3000/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    console.log('Status Code:', loginRes.status);
    console.log('Response JSON:', loginData);
    
    // Test random normal user login
    console.log('--- Test Normal User Login ---');
    const userRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
    });
    console.log('Status Code:', userRes.status);
    
  } catch (err) {
    console.error('Erreur de requete:', err);
  }
}

run();
