import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  checked: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
};

const DEFAULT_SIZE = 24;

export function Checkbox({ checked, onPress, disabled = false, size = DEFAULT_SIZE }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          width: size,
          height: size,
          borderRadius: size / 6,
          borderWidth: 2,
          borderColor: checked ? theme.primary : theme.borderLight,
          backgroundColor: checked ? theme.primary : theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        check: {
          color: '#fff',
          fontSize: size * 0.65,
          fontWeight: '700',
          marginTop: -1,
        },
      }),
    [theme, checked, size]
  );

  const content = (
    <View style={styles.outer}>
      {checked ? <Text style={styles.check}>✓</Text> : null}
    </View>
  );

  if (disabled || !onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}
