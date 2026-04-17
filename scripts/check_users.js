const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath);

const log = (msg) => process.stdout.write(`${msg}\n`);

log("--- Liste des utilisateurs en base ---");
db.all("SELECT id, email, role FROM users", [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    // Partial masking of email to satisfy security scanners
    const maskedEmail = row.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    log(`ID: ${row.id} | Email: ${maskedEmail} | Role: ${row.role}`);
  });
  log(`Total: ${rows.length} utilisateur(s)`);
  log("---------------------------------------");
  db.close();
});
