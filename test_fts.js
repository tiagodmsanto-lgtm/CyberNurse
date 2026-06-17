const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./assets/cybernurse.db');

db.all("SELECT m.name FROM medications m JOIN medications_fts fts ON m.rowid = fts.rowid WHERE medications_fts MATCH 'Los*' LIMIT 5", (err, rows) => {
    if (err) {
        console.error("Error FTS:", err);
    } else {
        console.log("FTS rows:", rows);
    }
});
