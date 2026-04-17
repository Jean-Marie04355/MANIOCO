'use strict';

async function performUpgrade() {
  const sqlite = require('sqlite3').verbose();
  const nodePath = require('path');
  const dbPath = nodePath.resolve(__dirname, '../data/database.sqlite');

  const log = (msg) => process.stdout.write(`${msg}\n`);
  const errLog = (msg) => process.stderr.write(`${msg}\n`);

  const db = new sqlite.Database(dbPath, (err) => {
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
}

performUpgrade();
