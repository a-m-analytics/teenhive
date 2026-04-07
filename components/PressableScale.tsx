import { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scale?: number;
}

export default function PressableScale({ style, children, scale = 0.97, onPress, ...rest }: Props) {
  const anim = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(anim, { toValue: scale, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const pressOut = () =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: anim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
