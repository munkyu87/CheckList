import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { STORAGE_KEYS } from '../constants';
import type { ThemeColors, ThemeMode } from './colors';
import { lightTheme, sakuraTheme, oceanTheme, midnightTheme, forestTheme } from './colors';

/** 테마별 카드 그림자 */
function getCardShadow(mode: ThemeMode): ViewStyle {
  if (mode === 'midnight') {
    return {
      shadowColor: '#5b21b6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    };
  }
  if (mode === 'sakura') {
    return {
      shadowColor: '#9d6b7c',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 4,
    };
  }
  if (mode === 'ocean') {
    return {
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    };
  }
  if (mode === 'forest') {
    return {
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  };
}

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ThemeColors;
  isDark: boolean;
  /** 카드 스타일 컴포넌트에 적용할 그림자 (다크/벚꽃에서만) */
  cardShadow: ViewStyle;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeMode {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    const value = storage.getString(STORAGE_KEYS.APP_THEME);
    if (value === 'dark') return 'midnight';
    if (value === 'light' || value === 'sakura' || value === 'ocean' || value === 'midnight' || value === 'forest') return value as ThemeMode;
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
      const next =
        prev === 'light'
          ? 'sakura'
          : prev === 'sakura'
            ? 'ocean'
            : prev === 'ocean'
              ? 'midnight'
              : prev === 'midnight'
                ? 'forest'
                : 'light';
      setStoredTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme:
        mode === 'midnight'
          ? midnightTheme
          : mode === 'sakura'
            ? sakuraTheme
            : mode === 'ocean'
              ? oceanTheme
              : mode === 'forest'
                ? forestTheme
                : lightTheme,
      isDark: mode === 'midnight',
      cardShadow: getCardShadow(mode),
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
