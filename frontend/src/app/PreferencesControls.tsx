import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLocale, validLocale } from '../i18n';

const THEME_KEY = 'hailex.preferences.theme';
type Theme = 'light' | 'dark';

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function PreferencesControls() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY) setTheme(event.newValue === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return (
    <div className="preferences-controls">
      <label>
        <span className="sr-only">{t('language')}</span>
        <select
          aria-label={t('language')}
          value={i18n.language}
          onChange={(event) => {
            if (validLocale(event.target.value)) setLocale(event.target.value);
          }}
        >
          <option value="en-US">English</option>
          <option value="es-MX">Español</option>
        </select>
      </label>
      <label>
        <span className="sr-only">{t('theme')}</span>
        <select
          aria-label={t('theme')}
          value={theme}
          onChange={(event) => {
            const next = event.target.value === 'dark' ? 'dark' : 'light';
            setTheme(next);
            try {
              localStorage.setItem(THEME_KEY, next);
            } catch {
              /* Optional storage. */
            }
          }}
        >
          <option value="light">{t('light')}</option>
          <option value="dark">{t('dark')}</option>
        </select>
      </label>
    </div>
  );
}
