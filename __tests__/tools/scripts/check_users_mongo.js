const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    const log = (msg) => process.stdout.write(`${msg}\n`);
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    log(`Connexion à ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    
    const UserSchema = new mongoose.Schema({
      email: String,
      role: String,
      deletedAt: Date
    }, { strict: false });
    
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({});
    
    log("\n--- Liste des utilisateurs dans MongoDB ---");
    users.forEach(u => {
      const status = u.deletedAt ? "[SUPPRIMÉ (Soft Delete)]" : "[ACTIF]";
      const maskedEmail = u.email ? u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown';
      log(`ID: ${u._id} | Email: ${maskedEmail} | Role: ${u.role} | Statut: ${status}`);
    });
    log(`Total: ${users.length} utilisateur(s)`);
    log("-------------------------------------------\n");
    
    await mongoose.disconnect();
  } catch (error) {
    process.stderr.write(`Erreur: ${error.message}\n`);
  }
}

checkUsers();
