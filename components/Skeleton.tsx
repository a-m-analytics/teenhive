import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, View, ViewStyle } from 'react-native';

type Props = { width?: DimensionValue; height: number; borderRadius?: number; style?: ViewStyle };

export function Skeleton({ width, height, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: '#e2eae3', borderRadius, height, width: (width ?? '100%') as DimensionValue, opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#051b0e', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width="60%" height={20} borderRadius={10} />
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
      <Skeleton width="40%" height={14} borderRadius={7} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={80} height={28} borderRadius={14} />
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</>;
}
