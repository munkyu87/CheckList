import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme';

const DISPLAY_DURATION = 1800;
const FADE_DURATION = 400;

type Props = {
  onFinish: () => void;
};

export function SplashScreen({ onFinish }: Props) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [onFinish, opacity]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background }, { opacity }]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '20' }]}>
          <Feather name="check-square" size={56} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>ThinkLess</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Record More</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
});
