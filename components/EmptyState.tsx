import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  buttonText?: string;
  onButtonPress?: () => void;
};

export default function EmptyState({ icon, title, subtitle, buttonText, onButtonPress }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 48 }}>
      {icon && (
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name={icon} size={28} color={ds.c.outlineVariant} />
        </View>
      )}
      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 18, color: ds.c.onSurface, textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: buttonText ? 24 : 0 }}>
          {subtitle}
        </Text>
      ) : null}
      {buttonText && onButtonPress ? (
        <TouchableOpacity
          style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 13, paddingHorizontal: 28 }}
          onPress={onButtonPress}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.white }}>{buttonText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
