import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Text, View } from 'react-native';

export default function OfflineBanner() {
  const isConnected = useNetworkStatus();
  if (isConnected) return null;
  return (
    <View style={{ backgroundColor: '#ba1a1a', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' }}>
      <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>No internet connection</Text>
    </View>
  );
}
