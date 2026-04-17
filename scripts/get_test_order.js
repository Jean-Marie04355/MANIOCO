const mongoose = require('mongoose');
require('dotenv').config();

async function checkOrders() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    await mongoose.connect(mongoUri);
    
    const OrderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.model('Order', OrderSchema);
    
    const TransactionSchema = new mongoose.Schema({}, { strict: false });
    const Transaction = mongoose.model('Transaction', TransactionSchema);

    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(1);
    
    if (orders.length === 0) {
      console.log("Aucune commande trouvée.");
    } else {
      const order = orders[0];
      console.log(`ORDER_ID: ${order._id}`);
      console.log(`CUSTOMER_ID: ${order.customerId}`);
      
      const tx = await Transaction.findOne({ orderId: order._id });
      if (tx) {
        console.log(`TX_EXTERNAL_ID: ${tx.externalId || 'null'}`);
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Erreur:", error);
  }
}

checkOrders();
