const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath);

const log = (msg) => process.stdout.write(`${msg}\n`);

log("--- Audit OTP : admin@gmail.com ---");
db.get("SELECT email, otpCode, otpExpiresAt FROM users WHERE email = 'admin@gmail.com'", [], (err, row) => {
  if (err) {
    throw err;
  }
  if (row) {
    const maskedEmail = row.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    log(`Email: ${maskedEmail}`);
    log(`OTP Code en base: [${row.otpCode ? '***' : 'null'}]`);
    log(`Expiration en base: ${row.otpExpiresAt}`);
  } else {
    log("Utilisateur non trouvé !");
  }
  db.close();
});
