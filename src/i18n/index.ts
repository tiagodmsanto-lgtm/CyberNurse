import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: false,
  init: () => {},
  detect: function () {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const langCode = locales[0].languageCode;
      if (['en', 'pt', 'es'].includes(langCode || '')) {
        return langCode;
      }
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
