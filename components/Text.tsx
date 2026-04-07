import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';

const weightToFont: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  normal: 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  bold: 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_800ExtraBold',
};

export default function Text({ style, ...props }: TextProps) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const weight = flat.fontWeight ? String(flat.fontWeight) : '400';
  const fontFamily = flat.fontFamily || weightToFont[weight] || 'Inter_400Regular';
  return <RNText style={[style, { fontFamily }]} {...props} />;
}
