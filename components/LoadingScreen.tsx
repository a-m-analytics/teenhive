import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

type Props = {
  message?: string;
};

export default function LoadingScreen({ message }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3fbf4', opacity }}>
      <ActivityIndicator size="small" color="#22c55e" />
      {message ? (
        <Text style={{ marginTop: 14, fontFamily: 'Manrope_400Regular', fontSize: 14, color: '#737972', letterSpacing: 0.2 }}>
          {message}
        </Text>
      ) : null}
    </Animated.View>
  );
}
