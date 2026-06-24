import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getDatabase } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKUP_TIMESTAMP_KEY = 'last_backup_timestamp';

/**
 * Faz o backup completo do banco SQLite para o Firestore na conta do usuário logado.
 */
export async function backupDataToCloud(): Promise<void> {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado. Não é possível fazer backup.');
  }

  const userId = currentUser.uid;
  const db = getDatabase();

  try {
    // Strip large base64 fields (photoUri, verificationPhoto) to avoid exceeding Firestore 1MB doc limit
    // and Android SQLite CursorWindow 2MB limit during local caching.
    const medications = db.getAllSync<any>('SELECT * FROM medications').map(m => ({ ...m, photoUri: null }));
    const schedules = db.getAllSync('SELECT * FROM schedules');
    const doses = db.getAllSync<any>('SELECT * FROM doses').map(d => ({ ...d, verificationPhoto: null }));
    const stock = db.getAllSync('SELECT * FROM stock');

    const backupPayload = {
      medications,
      schedules,
      doses,
      stock,
      timestamp: firestore.FieldValue.serverTimestamp(),
    };

    await firestore()
      .collection('users')
      .doc(userId)
      .collection('backups')
      .doc('latest')
      .set(backupPayload);

    await AsyncStorage.setItem(BACKUP_TIMESTAMP_KEY, Date.now().toString());
    console.log('Backup concluído com sucesso para o Firestore.');
  } catch (error) {
    console.error('Erro ao realizar backup na nuvem:', error);
    throw error;
  }
}

/**
 * Restaura o backup do Firestore sobrescrevendo os dados locais no SQLite.
 */
export async function restoreDataFromCloud(): Promise<void> {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado. Não é possível restaurar.');
  }

  const userId = currentUser.uid;
  const db = getDatabase();

  try {
    const backupDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('backups')
      .doc('latest')
      .get();

    if (!backupDoc.exists) {
      throw new Error('Nenhum backup encontrado na nuvem para este usuário.');
    }

    const data = backupDoc.data();
    if (!data) return;

    db.execSync('BEGIN TRANSACTION;');

    // Limpar as tabelas atuais para substituir
    db.runSync('DELETE FROM medications');
    db.runSync('DELETE FROM schedules');
    db.runSync('DELETE FROM doses');
    db.runSync('DELETE FROM stock');

    if (data.medications && Array.isArray(data.medications)) {
      for (const item of data.medications) {
        db.runSync(
          `INSERT INTO medications (id, name, category, dosage, form, color, photoUri, instructions, createdAt, updatedAt, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.name, item.category, item.dosage, item.form, item.color, item.photoUri, item.instructions, item.createdAt, item.updatedAt, item.isActive]
        );
      }
    }

    if (data.schedules && Array.isArray(data.schedules)) {
      for (const item of data.schedules) {
        db.runSync(
          `INSERT INTO schedules (id, medicationId, frequencyType, frequencyValue, times, startDate, endDate, mealRelation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.medicationId, item.frequencyType, item.frequencyValue, item.times, item.startDate, item.endDate, item.mealRelation]
        );
      }
    }

    if (data.doses && Array.isArray(data.doses)) {
      for (const item of data.doses) {
        db.runSync(
          `INSERT INTO doses (id, scheduleId, medicationId, scheduledAt, takenAt, status, verificationPhoto, verificationScore, verificationMethod, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.scheduleId, item.medicationId, item.scheduledAt, item.takenAt, item.status, item.verificationPhoto, item.verificationScore, item.verificationMethod, item.notes]
        );
      }
    }

    if (data.stock && Array.isArray(data.stock)) {
      for (const item of data.stock) {
        db.runSync(
          `INSERT INTO stock (id, medicationId, currentQuantity, minThreshold, expiryDate, lastRefillDate)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.id, item.medicationId, item.currentQuantity, item.minThreshold, item.expiryDate, item.lastRefillDate]
        );
      }
    }

    db.execSync('COMMIT;');
    console.log('Restauração de backup concluída com sucesso.');
  } catch (error) {
    db.execSync('ROLLBACK;');
    console.error('Erro ao restaurar backup da nuvem:', error);
    throw error;
  }
}
