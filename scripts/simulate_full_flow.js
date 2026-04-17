const mongoose = require('mongoose');
require('dotenv').config();

async function simulateFlow() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    await mongoose.connect(mongoUri);
    
    // 1. Trouver un utilisateur actif
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    const activeUser = await User.findOne({ email: 'toto@gmail.com' });
    
    if (!activeUser) {
      console.error("Utilisateur toto@gmail.com non trouvé.");
      return;
    }

    // 2. Créer une commande de test
    const OrderSchema = new mongoose.Schema({
      customerId: String,
      storeId: String,
      totalAmount: Number,
      status: String,
      items: Array
    }, { strict: false, timestamps: true });
    const Order = mongoose.model('Order', OrderSchema);
    
    const newOrder = new Order({
      customerId: activeUser._id,
      storeId: 'mock-store-id',
      totalAmount: 5500,
      status: 'PENDING',
      items: [
        { productName: 'Smartphone X', quantity: 1, price: 5000 },
        { productName: 'Coque Protection', quantity: 1, price: 500 }
      ]
    });
    await newOrder.save();
    console.log(`Commande créée: ${newOrder._id}`);

    // 3. Créer une transaction liée
    const TransactionSchema = new mongoose.Schema({
      orderId: String,
      externalId: String,
      status: String,
      amount: Number
    }, { strict: false });
    const Transaction = mongoose.model('Transaction', TransactionSchema);
    
    const externalTxId = 'fedapay_test_' + Date.now();
    const newTx = new Transaction({
      orderId: newOrder._id,
      externalId: externalTxId,
      status: 'PENDING',
      amount: 5500
    });
    await newTx.save();
    console.log(`Transaction créée: ${newTx._id} (FedaPay ID: ${externalTxId})`);

    // 4. Simuler l'appel Webhook
    console.log("Envoi du webhook de simulation via fetch...");
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
    
    console.log(`Réponse du Webhook: ${response.status}`);
    const data = await response.json().catch(() => ({}));
    console.log(`Données: ${JSON.stringify(data)}`);

    await mongoose.disconnect();
    console.log("Simulation terminée. Vérifiez la console du worker !");
  } catch (error) {
    console.error("Erreur de simulation:", error.message);
  }
}

simulateFlow();
