import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance, AndroidCategory, AndroidVisibility, AndroidFlags } from '@notifee/react-native';
import { useAppStore } from '../stores/appStore';

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }

  // Notifee Permissions
  if (Platform.OS === 'android') {
    await notifee.requestPermission();
  }

  if (Platform.OS === 'android') {
    // Canal com som padrão
    await notifee.createChannel({
      id: 'alarms_v5',
      name: 'Alarme Contínuo (Tela Cheia)',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      lightColor: '#E53935',
      sound: 'alarm',
    });

    // Canal com toque customizado (Toque 1)
    await notifee.createChannel({
      id: 'alarms_v5_custom_1',
      name: 'Alarme Contínuo (Toque 1)',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      lightColor: '#E53935',
      sound: 'alarm_1',
    });
  }

  return true;
}

export async function scheduleDoseAlarm(doseId: string, medicationName: string, scheduledAt: number) {
  const now = Date.now();
  if (scheduledAt <= now) {
    console.log(`⚠️ Ignorando agendamento: o horário ${new Date(scheduledAt).toISOString()} está no passado.`);
    return;
  }

  console.log(`⏰ Agendando ALARME NOTIFEE para ${new Date(scheduledAt).toISOString()}`);

  try {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduledAt,
    };

    const alarmSound = useAppStore.getState().alarmSound;
    const channelId = alarmSound === 'alarm_1' ? 'alarms_v5_custom_1' : 'alarms_v5';

    await notifee.createTriggerNotification(
      {
        id: `dose-${doseId}`,
        title: 'ALERTA: Hora do seu medicamento! 💊',
        body: `É hora de tomar: ${medicationName}. Toque para desativar o alarme.`,
        data: { doseId, isAlarm: 'true' },
        android: {
          channelId: channelId,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          loopSound: true,
          flags: [AndroidFlags.FLAG_INSISTENT],
          ongoing: true,
          autoCancel: false,
          // Isso acorda o celular e abre o app mesmo bloqueado!
          fullScreenAction: {
            id: 'default',
          },
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      },
      trigger
    );
    console.log(`✅ Alarme agendado com sucesso para a dose ${doseId}.`);
  } catch (error) {
    console.error('❌ Falha ao agendar alarme da dose:', error);
  }
}

export async function cancelDoseAlarm(doseId: string) {
  try {
    const notificationId = `dose-${doseId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    await notifee.cancelTriggerNotification(notificationId);
    await notifee.cancelNotification(notificationId);
    console.log(`Alarm cancelled for dose ${doseId}`);
  } catch (error) {
    console.error('Failed to cancel dose alarm:', error);
  }
}
