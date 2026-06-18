import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: false,
  init: () => {},
  detect: function () {
    let locale = 'pt';
    try {
      if (Platform.OS === 'ios') {
        const settings = NativeModules.SettingsManager?.settings;
        locale = settings?.AppleLocale || settings?.AppleLanguages?.[0] || 'pt';
      } else {
        locale = NativeModules.I18nManager?.localeIdentifier || 'pt';
      }
      const langCode = locale.split('_')[0].toLowerCase();
      if (['en', 'pt', 'es'].includes(langCode)) {
        return langCode;
      }
    } catch (e) {
      console.warn('Failed to detect locale, falling back to pt', e);
    }
    return 'pt'; // Fallback
  },
  cacheUserLanguage: function () {},
};

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: 'v4',
    fallbackLng: 'pt',
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
