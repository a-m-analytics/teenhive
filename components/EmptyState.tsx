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
    <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 }}>
      {icon && (
        <Ionicons name={icon} size={52} color="#e8f0e9" style={{ marginBottom: 20 }} />
      )}
      <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 20, color: '#051b0e', textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: '#737972', textAlign: 'center', lineHeight: 22, marginBottom: buttonText ? 28 : 0 }}>
          {subtitle}
        </Text>
      ) : null}
      {buttonText && onButtonPress ? (
        <TouchableOpacity
          activeOpacity={0.75}
          style={{ backgroundColor: '#051b0e', borderRadius: 100, height: 52, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' }}
          onPress={onButtonPress}
        >
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14, color: '#ffffff' }}>{buttonText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
