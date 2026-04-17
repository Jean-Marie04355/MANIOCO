const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath);

console.log("--- Audit OTP : admin@gmail.com ---");
db.get("SELECT email, otpCode, otpExpiresAt FROM users WHERE email = 'admin@gmail.com'", [], (err, row) => {
  if (err) {
    throw err;
  }
  if (row) {
    console.log(`Email: ${row.email}`);
    console.log(`OTP Code en base: [${row.otpCode}]`);
    console.log(`Expiration en base: ${row.otpExpiresAt}`);
  } else {
    console.log("Utilisateur non trouvé !");
  }
  db.close();
});
