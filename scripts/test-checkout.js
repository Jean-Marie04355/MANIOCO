
async function testPayment() {
  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  
  try {
    console.log('--- Étape 0 : Création d\'un utilisateur Vendeur ---');
    const userResponse = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vendeur Test',
        email: `vendeur_${timestamp}@test.com`,
        password: 'password123',
        role: 'vendeur'
      })
    });
    const user = await userResponse.json();
    if (!user.id) throw new Error('Erreur création utilisateur : ' + JSON.stringify(user));
    console.log('Utilisateur créé:', user.id);

    console.log('\n--- Étape 1 : Création d\'une boutique de test ---');
    const storeResponse = await fetch(`${baseUrl}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ma Boutique Test ' + timestamp,
        ownerId: user.id,
        localisation: 'Cotonou',
        description: 'Une boutique pour tester FedaPay',
        phone: '22900000000',
        payoutAccountId: 'acc_p8p8p8' // Compte de test (sandbox) FedaPay
      })
    });
    
    const store = await storeResponse.json();
    if (!store.id) throw new Error('Erreur création boutique : ' + JSON.stringify(store));
    console.log('Boutique créée:', store.id);

    console.log('\n--- Étape 2 : Création d\'une commande et initiation paiement ---');
    const orderResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user.id, // On utilise le même user pour simplifier
        storeId: store.id,
        totalAmount: 1000,
        items: [
          {
            productId: 'prod-789',
            productName: 'Article Test',
            quantity: 1,
            price: 1000
          }
        ]
      })
    });

    const result = await orderResponse.json();
    console.log('\n--- RÉSULTAT DU TEST ---');
    if (result.paymentUrl) {
      console.log('✅ SUCCÈS ! Lien de paiement généré :');
      console.log('--------------------------------------------');
      console.log(result.paymentUrl);
      console.log('--------------------------------------------');
      console.log('\nOuvrez ce lien dans votre navigateur pour tester le paiement (en mode Sandbox).');
    } else {
      console.log('❌ ÉCHEC :', result);
    }

  } catch (error) {
    console.error('Erreur pendant le test:', error.message);
  }
}

testPayment();
