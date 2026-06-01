import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning';
type ToastProps = { visible: boolean; message: string; type: ToastType; onDismiss: () => void };

export default function Toast({ visible, message, type, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
    success: { bg: '#22c55e', icon: 'checkmark-circle' as const, textColor: '#fff' },
    error: { bg: '#ba1a1a', icon: 'close-circle' as const, textColor: '#fff' },
    warning: { bg: '#fef9c3', icon: 'warning' as const, textColor: '#735c00' },
  }[type];

  return (
    <Animated.View style={{ position: 'absolute', top: 56, left: 20, right: 20, zIndex: 9999, transform: [{ translateY }], opacity }}>
      <TouchableOpacity activeOpacity={0.9} onPress={onDismiss}>
        <View style={{ backgroundColor: config.bg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
          <Ionicons name={config.icon} size={20} color={config.textColor} />
          <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: config.textColor, lineHeight: 20 }}>{message}</Text>
          <Ionicons name="close" size={16} color={config.textColor} style={{ opacity: 0.7 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function useToast() {
  const [toastProps, setToastProps] = useState<ToastProps>({ visible: false, message: '', type: 'success', onDismiss: () => {} });
  const showToast = (message: string, type: ToastType = 'success') => {
    setToastProps({ visible: true, message, type, onDismiss: () => setToastProps(p => ({ ...p, visible: false })) });
  };
  return { toastProps, showToast };
}
