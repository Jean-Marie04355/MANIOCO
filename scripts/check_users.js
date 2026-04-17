const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath);

console.log("--- Liste des utilisateurs en base ---");
db.all("SELECT id, email, role FROM users", [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    console.log(`ID: ${row.id} | Email: ${row.email} | Role: ${row.role}`);
  });
  console.log(`Total: ${rows.length} utilisateur(s)`);
  console.log("---------------------------------------");
  db.close();
});
