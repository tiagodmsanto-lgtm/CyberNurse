// ─────────────────────────────────────────────
// Database service — expo-sqlite synchronous API
// ─────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';

// ─── Singleton database instance ───────────────
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the singleton database handle.
 * Throws if `initDatabase()` has not been called yet.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error(
      '[CyberNurse] Database not initialised. Call initDatabase() first.',
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
export function initDatabase(): void {
  db = SQLite.openDatabaseSync('cybernurse.db');

  // Enable WAL mode for better concurrent read performance
  db.execSync('PRAGMA journal_mode = WAL;');
  // Enable foreign-key enforcement
  db.execSync('PRAGMA foreign_keys = ON;');

  createTables();
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
}

// ─── Utility helpers ───────────────────────────

/**
 * Generates a UUID v4 string without any external library.
 * Uses `Math.random()` — sufficient for local IDs; not cryptographic.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
}
