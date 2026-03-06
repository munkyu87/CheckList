import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useAnimationEnabled } from '../contexts/AnimationContext';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type BubbleConfig = {
  x: number;
  size: number;
  duration: number;
  delay: number;
};

const BUBBLE_COUNT = 10;

export function BubbleLayer() {
  const { mode } = useTheme();
  const { animationEnabled } = useAnimationEnabled();

  const bubbles = useMemo<BubbleConfig[]>(() => {
    return new Array(BUBBLE_COUNT).fill(null).map((_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      size: 8 + Math.random() * 10,
      duration: 22000 + Math.random() * 10000,
      delay: i * 2200,
    }));
  }, []);

  if (mode !== 'ocean' || !animationEnabled) return null;

  return (
    <>
      {bubbles.map((b, index) => (
        <AnimatedBubble key={index} config={b} />
      ))}
    </>
  );
}

function AnimatedBubble({ config }: { config: BubbleConfig }) {
  const translateY = useMemo(() => new Animated.Value(0), []);
  const translateX = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const horizontalOffset = 30 + Math.random() * 35 * (Math.random() > 0.5 ? 1 : -1);
    const riseDistance = SCREEN_HEIGHT + 60;

    const rise = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -riseDistance,
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
          Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    rise.start();
    return () => rise.stop();
  }, [config.delay, config.duration, translateY, translateX]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          left: config.x,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(186, 230, 253, 0.85)',
  },
});
