const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

const log = (msg) => process.stdout.write(`${msg}\n`);
const errLog = (msg) => process.stderr.write(`${msg}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    errLog(`Erreur ouverture BDD: ${err.message}`);
  }
});

db.run("UPDATE users SET role = 'super_admin' WHERE email = 'admin@gmail.com'", function(err) {
  if (err) {
    errLog(err.message);
    return;
  }
  log(`Parfait ! Row(s) updated: ${this.changes}`);
  db.close();
});
