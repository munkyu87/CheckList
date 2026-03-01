import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

export function ThemeToggleButton() {
  const { theme, isDark, toggleTheme } = useTheme();
  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.icon, { color: theme.text }]}>{isDark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: { fontSize: 18 },
});
