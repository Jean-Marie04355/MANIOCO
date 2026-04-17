const mongoose = require('mongoose');
require('dotenv').config();

async function testDeletedLogin() {
  try {
    const log = (msg) => process.stdout.write(`${msg}\n`);
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    log(`Test: Tentative de récupération d'un utilisateur supprimé...`);
    
    await mongoose.connect(mongoUri);
    
    const UserSchema = new mongoose.Schema({
      email: String,
      role: String,
      deletedAt: Date
    }, { strict: false });
    
    const UserModel = mongoose.model('User', UserSchema);
    
    const emailToTest = 'client2@gmail.com';
    
    // Simuler NoSqlRepository.findOne({ email }) avec le nouveau filtre
    const query = { email: emailToTest, deletedAt: null };
    const user = await UserModel.findOne(query).exec();
    
    if (user) {
      process.stderr.write(`FAIL: L'utilisateur ${emailToTest.substring(0, 4)}... a été trouvé alors qu'il est supprimé !\n`);
    } else {
      log(`SUCCESS: L'utilisateur ${emailToTest.substring(0, 4)}... n'est plus trouvable (comme prévu).`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    process.stderr.write(`Erreur: ${error.message}\n`);
  }
}

testDeletedLogin();
