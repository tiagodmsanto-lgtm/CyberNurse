// ─────────────────────────────────────────────
// Medication CRUD service — expo-sqlite sync API
// ─────────────────────────────────────────────

import type { SQLiteBindValue } from 'expo-sqlite';
import type { Medication } from '../models/Medication';
import type { Schedule } from '../models/Schedule';
import type { Dose } from '../models/Dose';
import type { Stock } from '../models/Stock';
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
    'SELECT m.* FROM medications m WHERE m.isActive = 1 AND EXISTS (SELECT 1 FROM schedules s WHERE s.medicationId = m.id) ORDER BY m.name ASC',
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

// ─── SEARCH (FTS) ──────────────────────────────

export function searchMedications(query: string, limit: number = 10): any[] {
  if (!query || query.length < 3) return [];
  const db = getDatabase();
  const safeQuery = query.replace(/"/g, '""').trim() + '*';
  try {
    const rows = db.getAllSync(
      `SELECT m.* 
       FROM medications m
       JOIN medications_fts fts ON m.rowid = fts.rowid
       WHERE medications_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      [safeQuery, limit]
    );
    if (rows.length > 0) return rows;
  } catch (e) {
    console.warn('FTS search failed', e);
  }

  // Fallback to LIKE
  try {
    const likeQuery = `%${query.trim()}%`;
    return db.getAllSync(
      `SELECT * FROM medications WHERE name LIKE ? LIMIT ?`,
      [likeQuery, limit]
    );
  } catch(e2) {
    return [];
  }
}

export function searchAlimentos(query: string, limit: number = 10): any[] {
  if (!query || query.length < 3) return [];
  const db = getDatabase();
  const safeQuery = query.replace(/"/g, '""').trim() + '*';
  try {
    const rows = db.getAllSync(
      `SELECT a.* 
       FROM alimentos a
       JOIN alimentos_fts fts ON a.rowid = fts.rowid
       WHERE alimentos_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      [safeQuery, limit]
    );
    if (rows.length > 0) return rows;
  } catch (e) {
    console.warn('FTS search alimentos failed', e);
  }

  // Fallback to LIKE
  try {
    const likeQuery = `%${query.trim()}%`;
    return db.getAllSync(
      `SELECT * FROM alimentos WHERE name LIKE ? LIMIT ?`,
      [likeQuery, limit]
    );
  } catch(e2) {
    return [];
  }
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

// ─── SCHEDULES, DOSES & STOCK SERVICES ───────────

export interface ScheduleRow {
  id: string;
  medicationId: string;
  frequencyType: string;
  frequencyValue: string;
  times: string;
  startDate: number;
  endDate: number | null;
  mealRelation: string;
}

export function getSchedulesByMedicationId(medicationId: string): Schedule[] {
  const db = getDatabase();
  const rows = db.getAllSync<ScheduleRow>(
    'SELECT * FROM schedules WHERE medicationId = ?',
    [medicationId]
  );
  return rows.map(row => ({
    ...row,
    frequencyType: row.frequencyType as Schedule['frequencyType'],
    times: JSON.parse(row.times),
    mealRelation: row.mealRelation as Schedule['mealRelation'],
  }));
}

export function getStockByMedicationId(medicationId: string): Stock | null {
  const db = getDatabase();
  const row = db.getFirstSync<Stock>(
    'SELECT * FROM stock WHERE medicationId = ?',
    [medicationId]
  );
  return row || null;
}

export function getAllStock(): Stock[] {
  const db = getDatabase();
  const rows = db.getAllSync<Stock>('SELECT * FROM stock');
  return rows;
}

export interface DoseWithMedication extends Dose {
  medicationName: string;
  dosage: string;
  color: string;
  form: string;
}

export function getDosesByDateRange(start: number, end: number): DoseWithMedication[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    `SELECT d.*, m.name as medicationName, m.dosage as dosage, m.color as color, m.form as form
     FROM doses d
     JOIN medications m ON d.medicationId = m.id
     WHERE d.scheduledAt >= ? AND d.scheduledAt <= ? AND m.isActive = 1
     ORDER BY d.scheduledAt ASC`,
    [start, end]
  );
  return rows;
}

export function getDoseWithMedicationById(doseId: string): DoseWithMedication | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    `SELECT d.*, m.name as medicationName, m.dosage as dosage, m.color as color, m.form as form
     FROM doses d
     JOIN medications m ON d.medicationId = m.id
     WHERE d.id = ? AND m.isActive = 1`,
    [doseId]
  );
  return row || null;
}

export function generateDosesForDay(date: Date): void {
  const db = getDatabase();
  const medications = getAllMedications();
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Envolvemos a geração de doses em uma transação para evitar que cada 
  // insert cause um flush no disco (o que causa o travamento de N+1 Queries)
  const generateLogic = () => {
    for (const med of medications) {    
      const schedulesRows = db.getAllSync<ScheduleRow>(
        'SELECT * FROM schedules WHERE medicationId = ?',
        [med.id]
      );
      
      for (const sched of schedulesRows) {
        if (sched.startDate > endOfDay.getTime()) continue;
        if (sched.endDate && sched.endDate < startOfDay.getTime()) continue;
        
        let shouldGenerate = false;
        if (sched.frequencyType === 'daily') {
          shouldGenerate = true;
        } else if (sched.frequencyType === 'specific_days') {
          try {
            const val = JSON.parse(sched.frequencyValue);
            if (Array.isArray(val.days) && val.days.includes(dayOfWeek)) {
              shouldGenerate = true;
            }
          } catch (e) {
            console.error('Failed to parse frequencyValue for schedule', sched.id, e);
          }
        } else if (sched.frequencyType === 'interval') {
          shouldGenerate = true; 
        }
        
        if (!shouldGenerate) continue;
        
        let timesList: string[] = [];
        try {
          timesList = JSON.parse(sched.times);
        } catch (e) {
          console.error('Failed to parse times for schedule', sched.id, e);
          continue;
        }
        
        let timesToGenerate: string[] = [];
        if (sched.frequencyType === 'interval') {
          try {
             const val = JSON.parse(sched.frequencyValue);
             const hours = val.hours || 8;
             const firstTime = timesList[0] || "08:00";
             const [h, m] = firstTime.split(':').map(Number);
             
             const baseDate = new Date(sched.startDate);
             baseDate.setHours(h, m, 0, 0);
             let currentDoseTime = baseDate.getTime();
             
             const targetDayStart = startOfDay.getTime();
             const targetDayEnd = endOfDay.getTime();
             
             if (currentDoseTime <= targetDayEnd) {
                 const intervalMs = hours * 60 * 60 * 1000;
                 if (currentDoseTime < targetDayStart) {
                     const diff = targetDayStart - currentDoseTime;
                     const periods = Math.ceil(diff / intervalMs);
                     currentDoseTime += periods * intervalMs;
                 }
                 
                 while (currentDoseTime <= targetDayEnd) {
                     const d = new Date(currentDoseTime);
                     const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                     timesToGenerate.push(timeStr);
                     currentDoseTime += intervalMs;
                 }
             }
          } catch (e) {
             console.error('Failed to parse interval data for schedule', sched.id, e);
          }
        } else {
          timesToGenerate = timesList;
        }
        
        for (const timeStr of timesToGenerate) {
          const [hourStr, minStr] = timeStr.split(':');
          const hour = parseInt(hourStr, 10);
          const min = parseInt(minStr, 10);
          
          const scheduledTime = new Date(date);
          scheduledTime.setHours(hour, min, 0, 0);
          const scheduledAt = scheduledTime.getTime();
          
          const existing = db.getFirstSync<{ id: string }>(
            'SELECT id FROM doses WHERE scheduleId = ? AND scheduledAt = ?',
            [sched.id, scheduledAt]
          );
          
          if (!existing) {
            const doseId = generateId();
            db.runSync(
              `INSERT INTO doses 
                 (id, scheduleId, medicationId, scheduledAt, status, verificationPhoto, verificationScore, verificationMethod, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                doseId,
                sched.id,
                med.id,
                scheduledAt,
                'pending',
                null,
                null,
                null,
                null
              ]
            );
          }
        }
      }
    }
  };

  if (typeof db.withTransactionSync === 'function') {
    db.withTransactionSync(generateLogic);
  } else {
    generateLogic();
  }
}

export function verifyDoseInDb(
  doseId: string,
  photoUri: string,
  score: number,
  method: 'ai' | 'manual' | 'fallback'
): void {
  const db = getDatabase();
  const now = Date.now();
  
  const dose = db.getFirstSync<{ medicationId: string }>(
    'SELECT medicationId FROM doses WHERE id = ?',
    [doseId]
  );
  
  if (!dose) return;
  
  db.runSync(
    `UPDATE doses 
     SET status = 'taken', takenAt = ?, verificationPhoto = ?, verificationScore = ?, verificationMethod = ?
     WHERE id = ?`,
    [now, photoUri, score, method, doseId]
  );
  
  db.runSync(
    `UPDATE stock 
     SET currentQuantity = MAX(0, currentQuantity - 1) 
     WHERE medicationId = ?`,
    [dose.medicationId]
  );
}

export function updateDoseStatusInDb(
  doseId: string,
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'refused',
  takenAt?: number
): void {
  const db = getDatabase();
  db.runSync(
    'UPDATE doses SET status = ?, takenAt = ? WHERE id = ?',
    [status, status === 'taken' ? (takenAt ?? Date.now()) : null, doseId]
  );
}
