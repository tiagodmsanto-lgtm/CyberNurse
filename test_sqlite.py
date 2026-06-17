import sqlite3
db = sqlite3.connect('assets/cybernurse.db')
print("FTS match:", db.execute("SELECT name FROM medications_fts WHERE name MATCH 'Los*' LIMIT 5").fetchall())
print("LIKE match:", db.execute("SELECT name FROM medications WHERE name LIKE '%Los%' LIMIT 5").fetchall())
