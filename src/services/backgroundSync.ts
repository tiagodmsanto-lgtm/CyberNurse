import * as BackgroundFetch from 'expo-background-fetch';
import { backupDataToCloud, BACKUP_TIMESTAMP_KEY } from './syncService';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BACKGROUND_BACKUP_TASK = 'background-backup-task';

// Inicialização segura para não quebrar o app caso o módulo nativo ainda não tenha sido compilado
let TaskManager: any = null;
try {
  TaskManager = require('expo-task-manager');
} catch (e) {
  console.warn('[Background Sync] expo-task-manager native module is missing. Background sync will not work until you rebuild the app.');
}

if (TaskManager) {
  try {
    TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
      try {
    const now = new Date();
    // Tenta rodar por volta das 3h da manhã
    if (now.getHours() >= 3 && now.getHours() < 6) {
      const user = auth().currentUser;
      if (user) {
        // Verifica se já fez backup hoje
        const lastBackupStr = await AsyncStorage.getItem(BACKUP_TIMESTAMP_KEY);
        let shouldBackup = true;
        if (lastBackupStr) {
          const lastBackupDate = new Date(parseInt(lastBackupStr, 10));
          if (
            lastBackupDate.getDate() === now.getDate() &&
            lastBackupDate.getMonth() === now.getMonth() &&
            lastBackupDate.getFullYear() === now.getFullYear()
          ) {
            shouldBackup = false; // Já fez backup hoje
          }
        }

        if (shouldBackup) {
          await backupDataToCloud();
          console.log('[Background Sync] Backup realizado com sucesso às 3h da manhã.');
          return BackgroundFetch.BackgroundFetchResult.NewData;
        }
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background Sync] Erro no background backup task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
  } catch (e) {
    console.warn('[Background Sync] Falha ao definir tarefa:', e);
  }
}

export async function registerBackgroundBackup() {
  if (!TaskManager) return;
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
      minimumInterval: 60 * 60, // Checa a cada 1 hora
      stopOnTerminate: false, 
      startOnBoot: true,
    });
    console.log('[Background Sync] Tarefa de backup agendada.');
  } catch (err) {
    console.error('[Background Sync] Falha ao registrar tarefa:', err);
  }
}
