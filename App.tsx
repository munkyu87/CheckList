/**
 * 체크리스트 앱
 * @format
 */

import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation';
import { SplashScreen, SakuraLayer, BubbleLayer, MidnightLayer, ForestLayer } from './src/components';
import { ThemeProvider, useTheme } from './src/theme';
import { LanguageProvider } from './src/i18n';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from './src/constants';
import { AnimationProvider } from './src/contexts/AnimationContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

function AppContent() {
  const { isDark, theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const barStyle = isDark ? 'light-content' : 'dark-content';

  useEffect(() => {
    try {
      const { createMMKV } = require('react-native-mmkv');
      const storage = createMMKV({ id: 'checklist-app' });
      const seen = storage.getString(STORAGE_KEYS.APP_ONBOARDING_SEEN);
      if (!seen) {
        setShowOnboarding(true);
      }
    } catch {
      // MMKV 사용 불가 시 온보딩을 그냥 한 번 보여주고 끝냄
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDone = () => {
    try {
      const { createMMKV } = require('react-native-mmkv');
      const storage = createMMKV({ id: 'checklist-app' });
      storage.set(STORAGE_KEYS.APP_ONBOARDING_SEEN, '1');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
      <AppNavigator />
      <SakuraLayer />
      <BubbleLayer />
      <MidnightLayer />
      <ForestLayer />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AnimationProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </AnimationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
