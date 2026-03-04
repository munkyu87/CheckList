import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
import type { ThemeColors, ThemeMode } from './colors';
import { darkTheme, lightTheme, sakuraTheme } from './colors';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeMode {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    const value = storage.getString(STORAGE_KEYS.APP_THEME);
    if (value === 'light' || value === 'dark' || value === 'sakura') return value as ThemeMode;
  } catch {
    // MMKV 없으면 기본값
  }
  return 'light';
}

function setStoredTheme(mode: ThemeMode): void {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    storage.set(STORAGE_KEYS.APP_THEME, mode);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    setStoredTheme(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'sakura' : 'light';
      setStoredTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: mode === 'dark' ? darkTheme : mode === 'sakura' ? sakuraTheme : lightTheme,
      isDark: mode === 'dark',
      setThemeMode,
      toggleTheme,
    }),
    [mode, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
