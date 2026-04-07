import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export default function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <View style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: '#fef2f2', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name="alert-circle-outline" size={18} color={ds.c.error} />
      <Text style={{ flex: 1, fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.error, lineHeight: 18 }}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.error }}>Retry</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => { setDismissed(true); onDismiss?.(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={ds.c.error} />
      </TouchableOpacity>
    </View>
  );
}
