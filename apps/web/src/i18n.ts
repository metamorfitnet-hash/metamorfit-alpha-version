import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../public/locales/en/translation.json';
import esTranslation from '../public/locales/es/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
};

// Read persisted locale synchronously before i18n initialises.
// This runs only in the browser (typeof window guard), so SSR always defaults to 'en'
// and hydration is consistent. The value is written by LocaleToggle and OnboardingContainer.
const _savedLng =
  typeof window !== 'undefined'
    ? ((localStorage.getItem('i18nextLng') || 'en').substring(0, 2) as 'en' | 'es')
    : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: _savedLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from xss
    },
  });

export default i18n;
