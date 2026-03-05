/**
 * 체크리스트 앱
 * @format
 */

import React, { useState } from 'react';
import { AppNavigator } from './src/navigation';
import { SplashScreen, SakuraLayer, BubbleLayer, MidnightLayer, ForestLayer } from './src/components';
import { ThemeProvider, useTheme } from './src/theme';
import { LanguageProvider } from './src/i18n';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const { isDark, theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const barStyle = isDark ? 'light-content' : 'dark-content';

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
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
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
