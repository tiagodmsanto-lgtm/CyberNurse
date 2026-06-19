// ─────────────────────────────────────────────
// Database service — expo-sqlite synchronous API
// ─────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

// ─── Singleton database instance ───────────────
let db: SQLite.SQLiteDatabase | null = null;
let initError: any = null;

/**
 * Returns the singleton database handle.
 * Throws if `initDatabase()` has not been called yet.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error(
      `[CyberNurse] Database not initialised. Error: ${initError?.message || initError || 'Unknown'}`
    );
  }
  return db;
}

/**
 * Opens (or creates) the SQLite database and runs all
 * CREATE TABLE IF NOT EXISTS migrations.
 *
 * Call this **once** during app startup (e.g. in the root layout).
 */
import { Platform } from 'react-native';

export async function initDatabase(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
    console.warn('expo-sqlite synchronous API is not supported on Web. Using an in-memory mock.');
    // In-memory data store for Web
    const webData = {
      medications: [] as any[],
      schedules: [] as any[],
      doses: [] as any[],
      stock: [] as any[],
    };

    const mockDb = {
      execSync: () => {},
      closeSync: () => {},
      runSync: (query: string, params: any[] = []) => {
        const sql = query.trim().toUpperCase();
        if (sql.startsWith('INSERT INTO MEDICATIONS')) {
          webData.medications.push({
            id: params[0], name: params[1], dosage: params[2], form: params[3], color: params[4],
            photoUri: params[5], instructions: params[6], createdAt: params[7], updatedAt: params[8],
            isActive: params[9]
          });
        } else if (sql.startsWith('INSERT INTO SCHEDULES')) {
          webData.schedules.push({
            id: params[0], medicationId: params[1], frequencyType: params[2], frequencyValue: params[3],
            times: params[4], startDate: params[5], endDate: params[6], mealRelation: params[7]
          });
        } else if (sql.startsWith('INSERT INTO STOCK')) {
          webData.stock.push({
            id: params[0], medicationId: params[1], currentQuantity: params[2], minThreshold: params[3],
            expiryDate: params[4], lastRefillDate: params[5]
          });
        } else if (sql.startsWith('INSERT INTO DOSES')) {
          webData.doses.push({
            id: params[0], scheduleId: params[1], medicationId: params[2], scheduledAt: params[3],
            status: params[4], verificationPhoto: params[5], verificationScore: params[6],
            verificationMethod: params[7], notes: params[8]
          });
        } else if (sql.startsWith('UPDATE MEDICATIONS SET ISACTIVE')) {
          // archiveMedication
          const med = webData.medications.find(m => m.id === params[0]);
          if (med) med.isActive = 0;
        } else if (sql.startsWith('UPDATE DOSES SET STATUS = \'TAKEN\'')) {
          // verifyDoseInDb
          const dose = webData.doses.find(d => d.id === params[4]);
          if (dose) {
            dose.status = 'taken'; dose.takenAt = params[0]; dose.verificationPhoto = params[1];
            dose.verificationScore = params[2]; dose.verificationMethod = params[3];
          }
        } else if (sql.startsWith('UPDATE DOSES SET STATUS = ?')) {
          // updateDoseStatusInDb
          const dose = webData.doses.find(d => d.id === params[2]);
          if (dose) {
            dose.status = params[0]; dose.takenAt = params[1];
          }
        } else if (sql.startsWith('UPDATE STOCK SET CURRENTQUANTITY')) {
          // verifyDoseInDb stock decrease
          const stock = webData.stock.find(s => s.medicationId === params[0]);
          if (stock && stock.currentQuantity > 0) stock.currentQuantity -= 1;
        } else if (sql.startsWith('DELETE FROM MEDICATIONS')) {
          webData.medications = webData.medications.filter(m => m.id !== params[0]);
          webData.schedules = webData.schedules.filter(s => s.medicationId !== params[0]);
          webData.stock = webData.stock.filter(s => s.medicationId !== params[0]);
          webData.doses = webData.doses.filter(d => d.medicationId !== params[0]);
        }
        return { changes: 1, lastInsertRowId: 1 };
      },
      getAllSync: (query: string, params: any[] = []) => {
        const sql = query.trim().toUpperCase();
        if (sql.includes('FROM MEDICATIONS WHERE ISACTIVE = 1')) {
          return webData.medications.filter(m => m.isActive === 1).sort((a, b) => a.name.localeCompare(b.name));
        } else if (sql.includes('FROM SCHEDULES WHERE MEDICATIONID')) {
          return webData.schedules.filter(s => s.medicationId === params[0]);
        } else if (sql.includes('FROM STOCK')) {
          return webData.stock;
        } else if (sql.includes('FROM DOSES D') && sql.includes('JOIN MEDICATIONS M')) {
          // getDosesByDateRange
          const start = params[0], end = params[1];
          return webData.doses
            .filter(d => d.scheduledAt >= start && d.scheduledAt <= end)
            .map(d => {
              const m = webData.medications.find(med => med.id === d.medicationId);
              return { ...d, medicationName: m?.name, dosage: m?.dosage, color: m?.color, form: m?.form };
            })
            .sort((a, b) => a.scheduledAt - b.scheduledAt);
        } else if (sql.includes('WHERE NAME LIKE')) {
          // Mock search response for Web testing
          return [
            { id: '1', name: 'Losartana Potássica', dosage: '50mg', form: 'comprimido', category: 'Medicamento' },
            { id: '2', name: 'Paracetamol', dosage: '750mg', form: 'comprimido', category: 'Medicamento' },
            { id: '3', name: 'Dipirona', dosage: '500mg', form: 'comprimido', category: 'Medicamento' },
            { id: '4', name: 'Amoxicilina', dosage: '500mg', form: 'capsula', category: 'Medicamento' }
          ].filter(item => item.name.toUpperCase().includes(params[0].replace(/%/g, '').toUpperCase()));
        } else if (sql.includes('MATCH ?')) {
           return []; // Web doesn't support FTS, let it fallback to LIKE
        }
        return [];
      },
      getFirstSync: (query: string, params: any[] = []) => {
        const sql = query.trim().toUpperCase();
        if (sql.includes('FROM MEDICATIONS WHERE ID')) {
          return webData.medications.find(m => m.id === params[0]) || null;
        } else if (sql.includes('FROM STOCK WHERE MEDICATIONID')) {
          return webData.stock.find(s => s.medicationId === params[0]) || null;
        } else if (sql.includes('FROM DOSES WHERE SCHEDULEID = ? AND SCHEDULEDAT')) {
          return webData.doses.find(d => d.scheduleId === params[0] && d.scheduledAt === params[1]) || null;
        } else if (sql.includes('FROM DOSES D') && sql.includes('WHERE D.ID')) {
          const d = webData.doses.find(dose => dose.id === params[0]);
          if (!d) return null;
          const m = webData.medications.find(med => med.id === d.medicationId);
          return { ...d, medicationName: m?.name, dosage: m?.dosage, color: m?.color, form: m?.form };
        } else if (sql.includes('SELECT MEDICATIONID FROM DOSES WHERE ID')) {
           return webData.doses.find(d => d.id === params[0]) || null;
        }
        return null;
      },
    };
    db = mockDb as unknown as SQLite.SQLiteDatabase;
    return;
  }

  const dbName = 'cybernurse.db';
  const dbDir = FileSystem.documentDirectory + 'SQLite/';
  const dbPath = dbDir + dbName;

  const dirInfo = await FileSystem.getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }

  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  // Se o arquivo não existir ou for muito pequeno (< 1MB), significa que está vazio
  if (!dbInfo.exists || (dbInfo.exists && dbInfo.size && dbInfo.size < 1000000)) {
    console.log('Banco de dados não encontrado ou vazio, copiando dos assets...');
    try {
      if (dbInfo.exists) {
        await FileSystem.deleteAsync(dbPath);
      }
      // Se tivermos gerado o cybernurse.db na pasta assets, nós copiamos para o local da aplicação
      const asset = Asset.fromModule(require('../../assets/cybernurse.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri,
        to: dbPath,
      });
      console.log('Banco de dados pré-populado carregado com sucesso!');
    } catch (e) {
      console.warn('Nenhum banco pré-populado encontrado nos assets, iniciando vazio.', e);
    }
  }

  db = SQLite.openDatabaseSync(dbName);

  // Enable WAL mode for better concurrent read performance
  db.execSync('PRAGMA journal_mode = WAL;');
  // Enable foreign-key enforcement
  db.execSync('PRAGMA foreign_keys = ON;');

  createTables();
  } catch (e: any) {
    initError = e;
    console.error("InitDB Error: ", e);
    throw e;
  }
}

// ─── Schema creation ───────────────────────────

function createTables(): void {
  const database = getDatabase();

  database.execSync(`
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

  database.execSync(`
    CREATE TABLE IF NOT EXISTS alimentos (
      id            TEXT PRIMARY KEY NOT NULL,
      name          TEXT NOT NULL,
      category      TEXT NOT NULL,
      createdAt     INTEGER NOT NULL,
      updatedAt     INTEGER NOT NULL,
      isActive      INTEGER NOT NULL DEFAULT 1
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS schedules (
      id              TEXT PRIMARY KEY NOT NULL,
      medicationId    TEXT NOT NULL,
      frequencyType   TEXT NOT NULL,
      frequencyValue  TEXT NOT NULL DEFAULT '{}',
      times           TEXT NOT NULL DEFAULT '[]',
      startDate       INTEGER NOT NULL,
      endDate         INTEGER,
      mealRelation    TEXT NOT NULL DEFAULT 'none',
      FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS doses (
      id                  TEXT PRIMARY KEY NOT NULL,
      scheduleId          TEXT NOT NULL,
      medicationId        TEXT NOT NULL,
      scheduledAt         INTEGER NOT NULL,
      takenAt             INTEGER,
      status              TEXT NOT NULL DEFAULT 'pending',
      verificationPhoto   TEXT,
      verificationScore   REAL,
      verificationMethod  TEXT,
      notes               TEXT,
      FOREIGN KEY (scheduleId)    REFERENCES schedules(id)    ON DELETE CASCADE,
      FOREIGN KEY (medicationId)  REFERENCES medications(id)  ON DELETE CASCADE
    );
  `);

  // Index for quick "today's doses" lookups
  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_doses_scheduledAt
    ON doses (scheduledAt);
  `);

  // Index for filtering doses by status
  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_doses_status
    ON doses (status);
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS stock (
      id              TEXT PRIMARY KEY NOT NULL,
      medicationId    TEXT NOT NULL UNIQUE,
      currentQuantity REAL NOT NULL DEFAULT 0,
      minThreshold    REAL NOT NULL DEFAULT 5,
      expiryDate      INTEGER,
      lastRefillDate  INTEGER,
      FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS caregivers (
      id           TEXT PRIMARY KEY NOT NULL,
      name         TEXT NOT NULL,
      phone        TEXT NOT NULL DEFAULT '',
      email        TEXT NOT NULL DEFAULT '',
      relation     TEXT NOT NULL DEFAULT '',
      notifyMissed INTEGER NOT NULL DEFAULT 1
    );
  `);
  database.execSync(`
    CREATE TABLE IF NOT EXISTS diet_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      mealName TEXT NOT NULL,
      isCompleted INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'meal'
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS hydration_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      amountMl REAL NOT NULL
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      weight REAL,
      fatPercentage REAL,
      leanMass REAL,
      bodyWater REAL,
      waist REAL,
      abdomen REAL,
      arm REAL,
      thigh REAL
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS vitals_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS symptoms_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      symptom TEXT NOT NULL,
      severity INTEGER NOT NULL,
      medicationId TEXT,
      notes TEXT
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS performance_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date INTEGER NOT NULL,
      trainingLoad INTEGER,
      sleepHours REAL,
      sleepQuality INTEGER,
      fatigueLevel INTEGER,
      caloriesConsumed REAL,
      caloriesBurned REAL
    );
  `);

  try {
    database.execSync('ALTER TABLE caregivers ADD COLUMN type TEXT NOT NULL DEFAULT \'personal\';');
  } catch (e) {
    // Column might already exist
  }
  try {
    database.execSync('ALTER TABLE caregivers ADD COLUMN profession TEXT;');
  } catch (e) {
    // Column might already exist
  }
}

// ─── Utility helpers ───────────────────────────

/**
 * Generates a UUID v4 string without any external library.
 * Uses `Math.random()` — sufficient for local IDs; not cryptographic.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older JS engines if crypto is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
}
