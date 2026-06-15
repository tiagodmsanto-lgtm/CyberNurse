// ─────────────────────────────────────────────
// Medication CRUD service — expo-sqlite sync API
// ─────────────────────────────────────────────

import type { SQLiteBindValue } from 'expo-sqlite';
import type { Medication } from '../models/Medication';
import { getDatabase, generateId } from './database';

// ─── Row ↔ Model mapping ──────────────────────

/** Shape of a raw row returned by SQLite (booleans stored as 0/1) */
interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  form: string;
  color: string;
  photoUri: string | null;
  instructions: string | null;
  createdAt: number;
  updatedAt: number;
  isActive: number; // 0 | 1
}

/** Converts a raw DB row into a typed Medication object */
function rowToMedication(row: MedicationRow): Medication {
  return {
    ...row,
    form: row.form as Medication['form'],
    isActive: row.isActive === 1,
  };
}

// ─── READ ──────────────────────────────────────

/** Returns all active medications ordered by name */
export function getAllMedications(): Medication[] {
  const db = getDatabase();
  const rows = db.getAllSync<MedicationRow>(
    'SELECT * FROM medications WHERE isActive = 1 ORDER BY name ASC',
  );
  return rows.map(rowToMedication);
}

/** Returns a single medication by ID, or null if not found */
export function getMedicationById(id: string): Medication | null {
  const db = getDatabase();
  const row = db.getFirstSync<MedicationRow>(
    'SELECT * FROM medications WHERE id = ?',
    [id],
  );
  return row ? rowToMedication(row) : null;
}

// ─── CREATE ────────────────────────────────────

/** Fields required to create a new medication (id + timestamps auto-generated) */
type CreateMedicationInput = Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Inserts a new medication and returns the complete object
 * with generated `id`, `createdAt`, and `updatedAt`.
 */
export function createMedication(input: CreateMedicationInput): Medication {
  const db = getDatabase();
  const now = Date.now();
  const id = generateId();

  db.runSync(
    `INSERT INTO medications
       (id, name, dosage, form, color, photoUri, instructions, createdAt, updatedAt, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.dosage,
      input.form,
      input.color,
      input.photoUri ?? null,
      input.instructions ?? null,
      now,
      now,
      input.isActive ? 1 : 0,
    ],
  );

  // Return the full object so callers can update state immediately
  return {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── UPDATE ────────────────────────────────────

/**
 * Partially updates a medication.
 * Only the provided fields are changed; `updatedAt` is always refreshed.
 */
export function updateMedication(
  id: string,
  updates: Partial<Omit<Medication, 'id' | 'createdAt'>>,
): void {
  const db = getDatabase();

  // Build dynamic SET clause from provided keys
  const fields: string[] = [];
  const values: SQLiteBindValue[] = [];

  const entries = Object.entries(updates) as Array<
    [string, string | number | boolean | null]
  >;

  for (const [key, value] of entries) {
    if (key === 'updatedAt') continue; // we set this ourselves
    fields.push(`${key} = ?`);
    // SQLite stores booleans as integers
    values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
  }

  // Always bump the updatedAt timestamp
  fields.push('updatedAt = ?');
  values.push(Date.now());

  // Bind the WHERE id
  values.push(id);

  db.runSync(
    `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

// ─── DELETE / ARCHIVE ──────────────────────────

/**
 * Hard-deletes a medication and all related records
 * (schedules, doses, stock) via CASCADE.
 */
export function deleteMedication(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM medications WHERE id = ?', [id]);
}

/**
 * Soft-deletes a medication by setting `isActive = 0`.
 * Data is preserved for history / reporting.
 */
export function archiveMedication(id: string): void {
  updateMedication(id, { isActive: false });
}
