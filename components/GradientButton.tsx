import { ds, dsPillBtnText } from '@/lib/design';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export default function GradientButton({ label, onPress, loading, disabled, style, fullWidth }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={fullWidth ? { width: '100%' } : undefined}>
      {({ pressed }) => (
        <LinearGradient
          colors={ds.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              borderRadius: 9999,
              paddingVertical: 16,
              paddingHorizontal: 32,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || disabled ? 0.8 : 1,
              flexDirection: 'row',
              gap: 8,
            },
            style,
          ]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={dsPillBtnText}>{label}</Text>
          }
        </LinearGradient>
      )}
    </Pressable>
  );
}
