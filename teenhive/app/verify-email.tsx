import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      startCountdown();
      Alert.alert('Sent!', 'Check your email for the verification link.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const role = session.user.user_metadata?.role;
      if (role === 'parent') {
        router.replace('/parent-setup' as any);
      } else {
        router.replace('/teen-setup' as any);
      }
    } else {
      Alert.alert(
        'Not verified yet',
        'Please check your email and click the verification link first.'
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 28 }}>
        <Ionicons name="mail-outline" size={40} color={ds.c.secondary} />
      </View>

      <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, marginBottom: 12, textAlign: 'center', letterSpacing: -0.3 }}>
        Check your email
      </Text>

      <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, textAlign: 'center', marginBottom: 6 }}>
        We sent a verification link to:
      </Text>
      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, marginBottom: 16, textAlign: 'center' }}>
        {email}
      </Text>
      <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: 40 }}>
        Click the link in the email to verify your account, then come back here and tap the button below.
      </Text>

      <TouchableOpacity
        style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 18, alignItems: 'center', width: '100%', marginBottom: 16 }}
        onPress={handleCheckVerification}
      >
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white, letterSpacing: 1 }}>
          I VERIFIED MY EMAIL
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ paddingVertical: 12, marginBottom: 12, opacity: countdown > 0 || resending ? 0.5 : 1 }}
        onPress={handleResend}
        disabled={countdown > 0 || resending}
      >
        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>
          {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending...' : 'Resend email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/login' as any)}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>Back to sign in</Text>
      </TouchableOpacity>

    </View>
  );
}
