import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useAnimationEnabled } from '../contexts/AnimationContext';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SparkleConfig = {
  x: number;
  y: number;
  size: number;
  delay: number;
  pause: number;
  char: string;
};

const SPARKLE_COUNT = 9;
const CHARS = ['✨', '✦', '·', '⋆'];

export function MidnightLayer() {
  const { mode } = useTheme();
  const { animationEnabled } = useAnimationEnabled();

  const sparkles = useMemo<SparkleConfig[]>(() => {
    return new Array(SPARKLE_COUNT).fill(null).map((_, i) => ({
      x: Math.random() * (SCREEN_WIDTH - 40),
      y: Math.random() * (SCREEN_HEIGHT - 80),
      size: 12 + Math.random() * 10,
      delay: i * 550 + Math.random() * 900,
      pause: 2200 + Math.random() * 3800,
      char: CHARS[i % CHARS.length],
    }));
  }, []);

  if (mode !== 'midnight' || !animationEnabled) return null;

  return (
    <>
      {sparkles.map((s, index) => (
        <AnimatedSparkle key={index} config={s} />
      ))}
    </>
  );
}

function AnimatedSparkle({ config }: { config: SparkleConfig }) {
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const fadeInDuration = 1100;
    const holdDuration = 700;
    const fadeOutDuration = 1400;

    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: fadeInDuration,
          useNativeDriver: true,
        }),
        Animated.delay(holdDuration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: fadeOutDuration,
          useNativeDriver: true,
        }),
        Animated.delay(config.pause),
      ])
    );

    twinkle.start();
    return () => twinkle.stop();
  }, [config.delay, config.pause, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        {
          left: config.x,
          top: config.y,
          opacity,
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
    zIndex: 1,
  },
  sparkleText: {
    color: '#fef3c7',
    textShadowColor: 'rgba(253, 230, 138, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
