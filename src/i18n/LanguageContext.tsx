import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
import { defaultLocale, translations, type Locale } from './translations';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLocale(): Locale {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    const value = storage.getString(STORAGE_KEYS.APP_LANGUAGE);
    if (value === 'ko' || value === 'en') return value;
  } catch {
    // ignore
  }
  return defaultLocale;
}

function setStoredLocale(locale: Locale): void {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    storage.set(STORAGE_KEYS.APP_LANGUAGE, locale);
  } catch {
    // ignore
  }
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.keys(params).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(params[k])),
    text
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const str = translations[locale][key] ?? translations[defaultLocale][key] ?? key;
      return interpolate(str, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
