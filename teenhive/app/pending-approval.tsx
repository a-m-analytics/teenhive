import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export default function PendingApproval() {
  const { user, profile, refreshProfile } = useAuth();
  const guardianName = profile?.guardian_name ?? 'your parent or guardian';
  const guardianEmail = profile?.guardian_email ?? 'their email';

  // Poll every 30 seconds — once approved AuthGate redirects automatically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('parent_consent, account_status')
        .eq('id', user.id)
        .single();
      if (data?.parent_consent === true || data?.account_status === 'active') {
        await refreshProfile();
        // AuthGate will now redirect away from this screen
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: '#051b0e', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

      {/* Icon */}
      <View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderWidth: 2, borderColor: '#22c55e',
        justifyContent: 'center', alignItems: 'center', marginBottom: 40,
      }}>
        <Ionicons name="hourglass-outline" size={48} color="#22c55e" />
      </View>

      <Text style={{
        fontFamily: ds.f.serifBold, fontSize: 34, color: '#f3fbf4',
        textAlign: 'center', letterSpacing: -0.5, marginBottom: 20, lineHeight: 40,
      }}>
        You're almost in!
      </Text>

      <Text style={{
        fontFamily: ds.f.sansSemiBold, fontSize: 16, color: '#86efac',
        textAlign: 'center', marginBottom: 12, lineHeight: 24,
      }}>
        We sent an approval request to {guardianName}
      </Text>

      <Text style={{
        fontFamily: ds.f.sans, fontSize: 15, color: '#6b7280',
        textAlign: 'center', marginBottom: 8, lineHeight: 24,
      }}>
        Ask them to check their email ({guardianEmail}) and click Approve.
      </Text>

      <Text style={{
        fontFamily: ds.f.sans, fontSize: 13, color: '#4b5563',
        textAlign: 'center', marginBottom: 64, lineHeight: 20,
      }}>
        This usually takes just a few minutes.
      </Text>

      <TouchableOpacity
        onPress={() => Linking.openURL('mailto:contactteenhive@gmail.com?subject=Guardian%20Approval%20Help')}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={{
          fontFamily: ds.f.sansMedium, fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 20,
        }}>
          Wrong email?{' '}
          <Text style={{ color: '#22c55e', fontFamily: ds.f.sansSemiBold }}>
            Contact us at contactteenhive@gmail.com
          </Text>
        </Text>
      </TouchableOpacity>

    </View>
  );
}
