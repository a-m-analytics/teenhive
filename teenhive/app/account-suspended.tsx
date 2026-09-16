import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export default function AccountSuspended() {
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#051b0e', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

      <View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 2, borderColor: '#ef4444',
        justifyContent: 'center', alignItems: 'center', marginBottom: 40,
      }}>
        <Ionicons name="ban-outline" size={48} color="#ef4444" />
      </View>

      <Text style={{
        fontFamily: ds.f.serifBold, fontSize: 34, color: '#f3fbf4',
        textAlign: 'center', letterSpacing: -0.5, marginBottom: 16, lineHeight: 40,
      }}>
        Account Suspended
      </Text>

      <Text style={{
        fontFamily: ds.f.sans, fontSize: 15, color: '#6b7280',
        textAlign: 'center', marginBottom: 48, lineHeight: 24,
      }}>
        Your account has been suspended. If you believe this is a mistake, please contact us.
      </Text>

      <TouchableOpacity
        onPress={() => Linking.openURL('mailto:contactteenhive@gmail.com?subject=Account%20Suspension%20Appeal')}
        style={{
          backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 9999,
          paddingVertical: 16, paddingHorizontal: 32, marginBottom: 20,
        }}
      >
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: '#ef4444' }}>
          Contact contactteenhive@gmail.com
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signOut}
        style={{ paddingVertical: 12 }}
      >
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: '#4b5563' }}>Sign out</Text>
      </TouchableOpacity>

    </View>
  );
}
