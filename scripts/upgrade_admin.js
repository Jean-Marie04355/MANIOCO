const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur ouverture BDD:', err.message);
  }
});

db.run("UPDATE users SET role = 'super_admin' WHERE email = 'admin@gmail.com'", function(err) {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Parfait ! Row(s) updated: ${this.changes}`);
  db.close();
});
