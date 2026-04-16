const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    console.log(`Connexion à ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    
    const UserSchema = new mongoose.Schema({
      email: String,
      role: String,
      deletedAt: Date
    }, { strict: false });
    
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({});
    
    console.log("\n--- Liste des utilisateurs dans MongoDB ---");
    users.forEach(u => {
      const status = u.deletedAt ? "[SUPPRIMÉ (Soft Delete)]" : "[ACTIF]";
      console.log(`ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | Statut: ${status}`);
    });
    console.log(`Total: ${users.length} utilisateur(s)`);
    console.log("-------------------------------------------\n");
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Erreur:", error);
  }
}

checkUsers();
