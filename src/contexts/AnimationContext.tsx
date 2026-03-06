import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../constants';

type AnimationContextValue = {
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
};

const AnimationContext = createContext<AnimationContextValue | null>(null);

function getStoredAnimationEnabled(): boolean {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    const value = storage.getString(STORAGE_KEYS.APP_ANIMATION_ENABLED);
    if (value === '0' || value === 'false') return false;
    if (value === '1' || value === 'true') return true;
  } catch {
    // ignore
  }
  return true;
}

function setStoredAnimationEnabled(enabled: boolean): void {
  try {
    const { createMMKV } = require('react-native-mmkv');
    const storage = createMMKV({ id: 'checklist-app' });
    storage.set(STORAGE_KEYS.APP_ANIMATION_ENABLED, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [animationEnabled, setEnabled] = useState(getStoredAnimationEnabled);

  const setAnimationEnabled = useCallback((enabled: boolean) => {
    setEnabled(enabled);
    setStoredAnimationEnabled(enabled);
  }, []);

  const value = useMemo(
    () => ({ animationEnabled, setAnimationEnabled }),
    [animationEnabled, setAnimationEnabled]
  );

  return (
    <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>
  );
}

export function useAnimationEnabled(): AnimationContextValue {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error('useAnimationEnabled must be used within AnimationProvider');
  return ctx;
}
