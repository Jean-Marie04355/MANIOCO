const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.sqlite');

db.all("SELECT name, profilePhoto FROM store", (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- STORES ---');
  rows.forEach(row => {
    console.log(`Store: ${row.name} | Photo: ${row.profilePhoto}`);
  });
  
  db.all("SELECT text, image FROM messages ORDER BY createdAt DESC LIMIT 5", (err, rows) => {
    if (err) console.error(err);
    console.log('\n--- LAST MESSAGES ---');
    rows.forEach(row => {
        console.log(`Msg: ${row.text || 'Image'} | Image: ${row.image ? row.image.substring(0, 50) + '...' : 'null'}`);
    });
    db.close();
  });
});
