import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en-US.json';
import es from './es-MX.json';

export type AppLocale = 'en-US' | 'es-MX';
export const DEFAULT_LOCALE: AppLocale = 'en-US';
export const LOCALE_KEY = 'hailex.preferences.locale';

export function validLocale(value: unknown): value is AppLocale {
  return value === 'en-US' || value === 'es-MX';
}

function storedLocale(): AppLocale {
  try {
    const value = localStorage.getItem(LOCALE_KEY);
    return validLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

void i18n.use(initReactI18next).init({
  resources: { 'en-US': { translation: en }, 'es-MX': { translation: es } },
  lng: storedLocale(),
  fallbackLng: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export function setLocale(locale: AppLocale, persist = true) {
  if (!validLocale(locale)) return;
  document.documentElement.lang = locale;
  void i18n.changeLanguage(locale);
  if (persist) {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Preferences are optional when browser storage is unavailable.
    }
  }
}

document.documentElement.lang = storedLocale();
window.addEventListener('storage', (event) => {
  if (event.key === LOCALE_KEY)
    setLocale(validLocale(event.newValue) ? event.newValue : DEFAULT_LOCALE, false);
});

export default i18n;
