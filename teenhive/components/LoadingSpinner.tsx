import { ds } from '@/lib/design';
import { ActivityIndicator, Text, View } from 'react-native';

type Props = { message?: string };

export default function LoadingSpinner({ message }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <ActivityIndicator size="large" color={ds.c.secondary} />
      {message ? (
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>{message}</Text>
      ) : null}
    </View>
  );
}
