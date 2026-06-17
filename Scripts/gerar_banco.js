const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Verifica se o pacote sqlite3 está instalado. Se não, avisa o usuário.
let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    console.error("ERRO: O pacote sqlite3 não está instalado no projeto Node.");
    console.log("Por favor, abra o terminal nesta pasta (Scripts) e rode o comando:");
    console.log("npm install sqlite3 --no-save");
    process.exit(1);
}

// Caminhos dos arquivos (assumindo que o script roda na pasta Scripts)
const csvFilePath = path.join(__dirname, 'medicamentos_limpos.csv');
const alimentosCsvPath = path.join(__dirname, 'alimentos_suplementos_limpos.csv');
const dbFilePath = path.join(__dirname, '..', 'assets', 'cybernurse.db');

// Verifica se o CSV existe
if (!fs.existsSync(csvFilePath)) {
    console.error(`ERRO: Arquivo CSV não encontrado em:\n${csvFilePath}`);
    console.log("\nCertifique-se de colocar o arquivo medicamentos_limpos.csv na pasta Scripts, ou rode o clean_meds.py para gerá-lo.");
    process.exit(1);
}

if (!fs.existsSync(alimentosCsvPath)) {
    console.error(`ERRO: Arquivo CSV não encontrado em:\n${alimentosCsvPath}`);
    console.log("\nCertifique-se de colocar o arquivo alimentos_suplementos_limpos.csv na pasta Scripts, ou rode o clean_alimentos.py para gerá-lo.");
    process.exit(1);
}

// Cria a pasta assets se não existir
const assetsDir = path.dirname(dbFilePath);
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Apaga o banco antigo se existir para não duplicar dados
if (fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
}

console.log(`Criando banco de dados em: ${dbFilePath}`);
const db = new sqlite3.Database(dbFilePath);

db.serialize(() => {
    // 1. Criar a tabela medications
    db.run(`
    CREATE TABLE IF NOT EXISTS medications (
      id            TEXT PRIMARY KEY NOT NULL,
      name          TEXT NOT NULL,
      dosage        TEXT NOT NULL,
      form          TEXT NOT NULL,
      color         TEXT NOT NULL DEFAULT '#E53935',
      photoUri      TEXT,
      instructions  TEXT,
      createdAt     INTEGER NOT NULL,
      updatedAt     INTEGER NOT NULL,
      isActive      INTEGER NOT NULL DEFAULT 1
    );
    `);

    // 2. Habilitar FTS5 (Full-Text Search) nativo do SQLite
    db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS medications_fts USING fts5(
        name, 
        dosage, 
        content='medications', 
        content_rowid='rowid'
    );
    `);

    // 2.5 Criar a tabela de alimentos e FTS
    db.run(`
    CREATE TABLE IF NOT EXISTS alimentos (
      id            TEXT PRIMARY KEY NOT NULL,
      name          TEXT NOT NULL,
      category      TEXT NOT NULL,
      createdAt     INTEGER NOT NULL,
      updatedAt     INTEGER NOT NULL,
      isActive      INTEGER NOT NULL DEFAULT 1
    );
    `);

    db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS alimentos_fts USING fts5(
        name, 
        category, 
        content='alimentos', 
        content_rowid='rowid'
    );
    `);

    // 3. Criar as outras tabelas necessárias do CyberNurse
    const tables = [
        `CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY NOT NULL, medicationId TEXT NOT NULL,
            frequencyType TEXT NOT NULL, frequencyValue TEXT NOT NULL DEFAULT '{}',
            times TEXT NOT NULL DEFAULT '[]', startDate INTEGER NOT NULL,
            endDate INTEGER, mealRelation TEXT NOT NULL DEFAULT 'none',
            FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS doses (
            id TEXT PRIMARY KEY NOT NULL, scheduleId TEXT NOT NULL,
            medicationId TEXT NOT NULL, scheduledAt INTEGER NOT NULL,
            takenAt INTEGER, status TEXT NOT NULL DEFAULT 'pending',
            verificationPhoto TEXT, verificationScore REAL,
            verificationMethod TEXT, notes TEXT,
            FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
            FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
        );`,
        `CREATE INDEX IF NOT EXISTS idx_doses_scheduledAt ON doses (scheduledAt);`,
        `CREATE INDEX IF NOT EXISTS idx_doses_status ON doses (status);`,
        `CREATE TABLE IF NOT EXISTS stock (
            id TEXT PRIMARY KEY NOT NULL, medicationId TEXT NOT NULL UNIQUE,
            currentQuantity REAL NOT NULL DEFAULT 0, minThreshold REAL NOT NULL DEFAULT 5,
            expiryDate INTEGER, lastRefillDate INTEGER,
            FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS caregivers (
            id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '', relation TEXT NOT NULL DEFAULT '',
            notifyMissed INTEGER NOT NULL DEFAULT 1
        );`
    ];

    tables.forEach(q => db.run(q));

    // 4. Triggers para manter a tabela de busca FTS atualizada automaticamente
    db.run(`CREATE TRIGGER IF NOT EXISTS medications_ai AFTER INSERT ON medications BEGIN INSERT INTO medications_fts(rowid, name, dosage) VALUES (new.rowid, new.name, new.dosage); END;`);
    db.run(`CREATE TRIGGER IF NOT EXISTS medications_ad AFTER DELETE ON medications BEGIN INSERT INTO medications_fts(medications_fts, rowid, name, dosage) VALUES('delete', old.rowid, old.name, old.dosage); END;`);
    db.run(`CREATE TRIGGER IF NOT EXISTS medications_au AFTER UPDATE ON medications BEGIN INSERT INTO medications_fts(medications_fts, rowid, name, dosage) VALUES('delete', old.rowid, old.name, old.dosage); INSERT INTO medications_fts(rowid, name, dosage) VALUES (new.rowid, new.name, new.dosage); END;`);

    db.run(`CREATE TRIGGER IF NOT EXISTS alimentos_ai AFTER INSERT ON alimentos BEGIN INSERT INTO alimentos_fts(rowid, name, category) VALUES (new.rowid, new.name, new.category); END;`);
    db.run(`CREATE TRIGGER IF NOT EXISTS alimentos_ad AFTER DELETE ON alimentos BEGIN INSERT INTO alimentos_fts(alimentos_fts, rowid, name, category) VALUES('delete', old.rowid, old.name, old.category); END;`);
    db.run(`CREATE TRIGGER IF NOT EXISTS alimentos_au AFTER UPDATE ON alimentos BEGIN INSERT INTO alimentos_fts(alimentos_fts, rowid, name, category) VALUES('delete', old.rowid, old.name, old.category); INSERT INTO alimentos_fts(rowid, name, category) VALUES (new.rowid, new.name, new.category); END;`);

    // Iniciar a transação para inserção massiva (MUITO rápido)
    db.run('BEGIN TRANSACTION;');

    const stmt = db.prepare(`
        INSERT INTO medications (id, name, dosage, form, color, createdAt, updatedAt, isActive) 
        VALUES (?, ?, ?, ?, '#E53935', ?, ?, 1)
    `);

    console.log("Lendo medicamentos_limpos.csv e populando tabelas...");

    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstLine = true;
    let count = 0;
    const now = Date.now();

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    rl.on('line', (line) => {
        if (isFirstLine) { isFirstLine = false; return; }

        const tokens = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (tokens.length >= 4) {
            const nomeComercial = tokens[0] ? tokens[0].replace(/^"|"$/g, '').trim() : "N/A";
            const apresentacao = tokens[2] ? tokens[2].replace(/^"|"$/g, '').trim() : "N/A";
            
            stmt.run([uuidv4(), nomeComercial, apresentacao, 'comprimido', now, now]);
            count++;
            
            if (count % 5000 === 0) {
                console.log(` > Inseridos ${count} medicamentos...`);
            }
        }
    });

    rl.on('close', () => {
        stmt.finalize();
        
        console.log("Lendo alimentos_suplementos_limpos.csv e populando tabelas...");
        const stmtAlimentos = db.prepare(`
            INSERT INTO alimentos (id, name, category, createdAt, updatedAt, isActive) 
            VALUES (?, ?, ?, ?, ?, 1)
        `);
        
        const fileStreamAlimentos = fs.createReadStream(alimentosCsvPath);
        const rlAlimentos = readline.createInterface({ input: fileStreamAlimentos, crlfDelay: Infinity });
        
        let isFirstLineAlimentos = true;
        let countAlimentos = 0;
        
        rlAlimentos.on('line', (line) => {
            if (isFirstLineAlimentos) { isFirstLineAlimentos = false; return; }
            
            const tokens = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (tokens.length >= 2) {
                const nomeProduto = tokens[0] ? tokens[0].replace(/^"|"$/g, '').trim() : "N/A";
                const categoria = tokens[1] ? tokens[1].replace(/^"|"$/g, '').trim() : "N/A";
                
                stmtAlimentos.run([uuidv4(), nomeProduto, categoria, now, now]);
                countAlimentos++;
                
                if (countAlimentos % 5000 === 0) {
                    console.log(` > Inseridos ${countAlimentos} alimentos...`);
                }
            }
        });
        
        rlAlimentos.on('close', () => {
            stmtAlimentos.finalize();
            db.run('COMMIT;', () => {
                console.log(`\n✅ Sucesso! Banco de dados criado em: ${dbFilePath}`);
                console.log(`💊 Total de medicamentos populados: ${count}`);
                console.log(`🍏 Total de alimentos/suplementos populados: ${countAlimentos}`);
                db.close();
                console.log("\nPronto! Você já pode apagar a pasta Scripts se quiser (após carregar o .db no app).");
            });
        });
    });
});
