import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Logs a non-fatal error to Crashlytics.
 * @param error The Error object to log.
 */
export const logCrashError = (error: Error) => {
  try {
    crashlytics().recordError(error);
  } catch (e) {
    console.warn('Crashlytics [logCrashError] falhou:', e);
  }
};

/**
 * Logs a custom message to Crashlytics (helps when tracking events leading up to a crash).
 * @param message The message to log.
 */
export const logCrashMessage = (message: string) => {
  try {
    crashlytics().log(message);
  } catch (e) {
    console.warn('Crashlytics [logCrashMessage] falhou:', e);
  }
};

/**
 * Sets the user ID for Crashlytics to associate crashes with a specific user.
 * @param id The user ID.
 */
export const setCrashlyticsUser = async (id: string) => {
  try {
    await crashlytics().setUserId(id);
  } catch (e) {
    console.warn('Crashlytics [setCrashlyticsUser] falhou:', e);
  }
};

/**
 * Sets custom key/value pairs that are sent along with the crash report.
 * @param attributes Object containing custom key/value pairs.
 */
export const setCrashlyticsAttributes = async (attributes: Record<string, string>) => {
  try {
    await crashlytics().setAttributes(attributes);
  } catch (e) {
    console.warn('Crashlytics [setCrashlyticsAttributes] falhou:', e);
  }
};

/**
 * Forces a crash to test Crashlytics integration.
 * REMOVE OR COMMENT OUT IN PRODUCTION!
 */
export const testCrash = () => {
  crashlytics().crash();
};
