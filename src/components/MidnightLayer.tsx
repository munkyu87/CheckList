import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SparkleConfig = {
  x: number;
  size: number;
  duration: number;
  delay: number;
  char: string;
};

const SPARKLE_COUNT = 12;
const CHARS = ['✨', '✦', '·'];

export function MidnightLayer() {
  const { mode } = useTheme();

  const sparkles = useMemo<SparkleConfig[]>(() => {
    return new Array(SPARKLE_COUNT).fill(null).map((_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      size: 10 + Math.random() * 8,
      duration: 16000 + Math.random() * 6000,
      delay: i * 1100,
      char: CHARS[i % CHARS.length],
    }));
  }, []);

  if (mode !== 'midnight') return null;

  return (
    <>
      {sparkles.map((s, index) => (
        <AnimatedSparkle key={index} config={s} />
      ))}
    </>
  );
}

function AnimatedSparkle({ config }: { config: SparkleConfig }) {
  const translateY = useMemo(() => new Animated.Value(-30), []);
  const translateX = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const horizontalOffset = 25 + Math.random() * 30 * (Math.random() > 0.5 ? 1 : -1);

    const fall = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT + 30,
            duration: config.duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: horizontalOffset,
            duration: config.duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -30, duration: 0, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    fall.start();
    return () => fall.stop();
  }, [config.delay, config.duration, translateY, translateX]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        {
          left: config.x,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      <Text style={[styles.sparkleText, { fontSize: config.size }]}>{config.char}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  sparkleText: {
    color: '#fef3c7',
    textShadowColor: 'rgba(253, 230, 138, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
