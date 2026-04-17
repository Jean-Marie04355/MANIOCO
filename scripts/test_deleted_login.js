const mongoose = require('mongoose');
require('dotenv').config();

async function testDeletedLogin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/afrigari';
    console.log(`Test: Tentative de récupération d'un utilisateur supprimé...`);
    
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
      console.error(`FAIL: L'utilisateur ${emailToTest} a été trouvé alors qu'il est supprimé !`);
    } else {
      console.log(`SUCCESS: L'utilisateur ${emailToTest} n'est plus trouvable (comme prévu).`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Erreur:", error);
  }
}

testDeletedLogin();
