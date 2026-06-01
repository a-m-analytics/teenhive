import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  variant?: 'primary' | 'outline' | 'green';
};

export default function GradientButton({ label, onPress, loading, disabled, style, fullWidth, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGreen = variant === 'green';

  const bgColor = isOutline ? 'transparent' : isGreen ? '#22c55e' : '#051b0e';
  const textColor = isOutline ? '#051b0e' : isGreen ? '#051b0e' : '#ffffff';
  const spinnerColor = isOutline ? '#051b0e' : '#ffffff';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          height: 56,
          borderRadius: 100,
          paddingHorizontal: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? '#051b0e' : 'transparent',
          shadowColor: '#051b0e',
          shadowOpacity: disabled ? 0 : 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: disabled ? 0 : 3,
          opacity: disabled ? 0.5 : 1,
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={spinnerColor} size="small" />
        : <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15, color: textColor, letterSpacing: 0.5 }}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
