import analytics from '@react-native-firebase/analytics';

/**
 * Logs a screen view to Firebase Analytics.
 * @param screenName The name of the screen viewed.
 * @param screenClass The class of the screen, defaults to screenName.
 */
export const logScreenView = async (screenName: string, screenClass?: string) => {
  try {
    await analytics().logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.warn('Analytics [logScreenView] falhou:', error);
  }
};

/**
 * Logs a custom event to Firebase Analytics.
 * @param eventName The name of the event.
 * @param params Optional parameters for the event.
 */
export const logCustomEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.warn(`Analytics [logCustomEvent - ${eventName}] falhou:`, error);
  }
};

/**
 * Sets the user ID for Firebase Analytics.
 * @param id The user ID to set.
 */
export const setAnalyticsUserId = async (id: string) => {
  try {
    await analytics().setUserId(id);
  } catch (error) {
    console.warn('Analytics [setAnalyticsUserId] falhou:', error);
  }
};

// --- Custom Events para CyberNurse ---

export const logMedicationAdded = async (medicationName: string, timesPerDay: number) => {
  await logCustomEvent('medication_added', {
    medication_name: medicationName,
    times_per_day: timesPerDay,
  });
};

export const logMedicationTaken = async (medicationId: string, verifiedWithCamera: boolean) => {
  await logCustomEvent('medication_taken', {
    medication_id: medicationId,
    camera_verified: verifiedWithCamera,
  });
};
