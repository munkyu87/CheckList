import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useAnimationEnabled } from '../contexts/AnimationContext';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PetalConfig = {
  x: number;
  size: number;
  duration: number;
  delay: number;
};

const PETAL_COUNT = 10;

export function SakuraLayer() {
  const { mode } = useTheme();
  const { animationEnabled } = useAnimationEnabled();

  const petals = useMemo<PetalConfig[]>(() => {
    return new Array(PETAL_COUNT).fill(null).map((_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      size: 14 + Math.random() * 8,
      duration: 32000 + Math.random() * 10000,
      delay: i * 2200,
    }));
  }, []);

  if (mode !== 'sakura' || !animationEnabled) return null;

  return (
    <>
      {petals.map((p, index) => (
        <AnimatedPetal key={index} config={p} />
      ))}
    </>
  );
}

function AnimatedPetal({ config }: { config: PetalConfig }) {
  const translateY = useMemo(() => new Animated.Value(-40), []);
  const translateX = useMemo(() => new Animated.Value(0), []);
  const rotate = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const horizontalOffset =
      50 + Math.random() * 40 * (Math.random() > 0.5 ? 1 : -1); // 좌우로 좀 더 크게 팔랑

    const fall = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        // 한 번 떨어질 때
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
        // 다음 루프를 위해 위치/회전 초기화
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -40,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    fall.start();

    return () => {
      fall.stop();
    };
  }, [config.delay, config.duration, translateY, translateX, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '25deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.petal,
        {
          left: config.x,
          transform: [{ translateY }, { translateX }, { rotate: spin }],
        },
      ]}
    >
      <Text style={{ fontSize: config.size }}>🌸</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
    opacity: 0.7,
  },
});

