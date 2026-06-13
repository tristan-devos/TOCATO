import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en';
import fr from '@/locales/fr';

export const LANGUAGE_KEY = 'tocato-language';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'fr';
const defaultLang: 'fr' | 'en' = deviceLang === 'en' ? 'en' : 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: defaultLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      await i18n.changeLanguage(saved);
    }
  } catch {}
}

export async function changeLanguage(lang: 'fr' | 'en'): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

export default i18n;
