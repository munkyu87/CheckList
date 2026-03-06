import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useAnimationEnabled } from '../contexts/AnimationContext';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LeafConfig = {
  x: number;
  size: number;
  duration: number;
  delay: number;
  char: string;
};

const LEAF_COUNT = 10;
const LEAF_CHARS = ['🍃', '🍂', '🍃'];

export function ForestLayer() {
  const { mode } = useTheme();
  const { animationEnabled } = useAnimationEnabled();

  const leaves = useMemo<LeafConfig[]>(() => {
    return new Array(LEAF_COUNT).fill(null).map((_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      size: 14 + Math.random() * 8,
      duration: 20000 + Math.random() * 8000,
      delay: i * 1600,
      char: LEAF_CHARS[i % LEAF_CHARS.length],
    }));
  }, []);

  if (mode !== 'forest' || !animationEnabled) return null;

  return (
    <>
      {leaves.map((leaf, index) => (
        <AnimatedLeaf key={index} config={leaf} />
      ))}
    </>
  );
}

function AnimatedLeaf({ config }: { config: LeafConfig }) {
  const translateY = useMemo(() => new Animated.Value(-40), []);
  const translateX = useMemo(() => new Animated.Value(0), []);
  const rotate = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const horizontalOffset = 45 + Math.random() * 35 * (Math.random() > 0.5 ? 1 : -1);

    const fall = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT + 40,
            duration: config.duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: horizontalOffset,
            duration: config.duration,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: config.duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -40, duration: 0, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    fall.start();
    return () => fall.stop();
  }, [config.delay, config.duration, translateY, translateX, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '20deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.leaf,
        {
          left: config.x,
          transform: [{ translateY }, { translateX }, { rotate: spin }],
        },
      ]}
    >
      <Text style={{ fontSize: config.size }}>{config.char}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
    opacity: 0.75,
  },
});
