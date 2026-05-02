const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.sqlite');

db.all("SELECT name, profilePhoto FROM store WHERE name LIKE '%GARI VIP%'", (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- TARGET STORE ---');
  rows.forEach(row => {
    console.log(`Store: ${row.name} | Photo: ${row.profilePhoto ? row.profilePhoto.substring(0, 50) + '...' : 'null'}`);
  });
  db.close();
});
