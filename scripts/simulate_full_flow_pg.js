const { Client } = require('pg');
require('dotenv').config();

async function simulateFlowPG() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'afrigari',
    password: process.env.DB_PASS || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    const log = (msg) => process.stdout.write(`${msg}\n`);
    log("Connecté à Postgres.");

    // 1. Trouver un utilisateur actif
    let userRes = await client.query("SELECT id FROM users WHERE email = $1", ['marie@gmail.com']);

    let userId;
    if (userRes.rowCount === 0) {
      log("Utilisateur marie@gmail.com non trouvé. Création...");
      const insertUser = await client.query(`
        INSERT INTO users (email, name, password, role)
        VALUES ($1, $2, $3, $4) RETURNING id
      `, ['marie@gmail.com', 'Marie Test', process.env.TEST_USER_PASSWORD || 'Complex_Fallback_123!', 'CLIENT']); // NOSONAR
      userId = insertUser.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }

    // 2. Créer une commande de test
    const insertOrder = await client.query(`
      INSERT INTO orders ("customerId", "storeId", "totalAmount", status, items)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      userId,
      '123e4567-e89b-12d3-a456-426614174000', // mock uuid pour un store existant ou factice (peut-être ajusté si contrainte de clé étrangère trop stricte, mais TypeORM pardonne souvent sans relation explicite DB-level)
      5500,
      'PENDING',
      JSON.stringify([
        { productName: 'Smartphone X', quantity: 1, price: 5000 },
        { productName: 'Coque Protection', quantity: 1, price: 500 }
      ])
    ]);
    const orderId = insertOrder.rows[0].id;
    log(`Commande créée: ${String(orderId).substring(0, 8)}...`);

    // 3. Créer une transaction liée
    const externalTxId = 'fedapay_test_' + Date.now();
    const insertTx = await client.query(`
      INSERT INTO transactions ("orderId", "externalId", status, amount)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [orderId, externalTxId, 'PENDING', 5500]);
    log(`Transaction créée: ${String(insertTx.rows[0].id).substring(0, 8)}... (FedaPay ID: ${externalTxId})`);

    // 4. Simuler l'appel Webhook
    log("Envoi du webhook de simulation via fetch...");
    const webhookPayload = {
      event: 'transaction.approved',
      entity: {
        id: externalTxId,
        mode: 'mtn_benin',
        status: 'approved'
      }
    };

    const response = await fetch('http://localhost:3000/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    log(`Réponse Webhook de l'API: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    log(`Réponse body: ${JSON.stringify(data)}`);

  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
      console.error("Erreur: Clé étrangère violée. Essayez d'ajouter un storeId valide !");
    } else {
      console.error("Erreur de simulation Postgres:", error);
    }
  } finally {
    await client.end();
    log("Déconnecté de Postgres. Si la requête API a renvoyé 200/201, vérifiez la console du worker !");
  }
}

simulateFlowPG();
