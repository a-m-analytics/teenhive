import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(30);
    timer.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timer.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    if (!validateEmail(email.trim())) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    const { error: apiError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'teenhive://reset-password',
    });
    setLoading(false);
    if (apiError) { setError(apiError.message); return; }
    setSent(true);
    startCooldown();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'teenhive://reset-password',
    });
    startCooldown();
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  if (sent) {
    return (
      <View style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.logo}>TeenHive</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={s.successWrap}>
          <View style={s.iconCircle}>
            <Text style={s.iconText}>✉</Text>
          </View>
          <Text style={s.title}>Check your inbox.</Text>
          <Text style={s.subtitle}>We sent a reset link to</Text>
          <Text style={s.emailDisplay}>{email.trim()}</Text>

          <TouchableOpacity
            style={[s.button, cooldown > 0 && { opacity: 0.5 }]}
            onPress={handleResend}
            disabled={cooldown > 0}
          >
            <Text style={s.buttonText}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'RESEND EMAIL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.createRow} onPress={() => router.push('/login' as any)}>
            <Text style={s.createText}>
              Back to{'  '}
              <Text style={s.createLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.logo}>TeenHive</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={s.hero}>
          <Text style={s.title}>Forgot your{'\n'}password?</Text>
          <Text style={s.subtitle}>Enter your email and we'll send you a reset link.</Text>
        </View>

        <View style={s.form}>
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={s.buttonText}>{loading ? 'Sending...' : 'SEND RESET LINK'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.createRow} onPress={() => router.push('/login' as any)}>
          <Text style={s.createText}>
            Remember it?{'  '}
            <Text style={s.createLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3fbf4' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  back: { fontFamily: ds.f.sansSemiBold, color: '#735c00', fontSize: 14, width: 48 },
  logo: { fontFamily: ds.f.serifBold, fontSize: 20, color: '#051b0e' },
  hero: { paddingHorizontal: 24, marginBottom: 32, marginTop: 8 },
  title: { fontFamily: ds.f.serifBold, fontSize: 42, color: '#051b0e', lineHeight: 48, letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontFamily: ds.f.sans, fontSize: 15, color: '#737972', lineHeight: 22 },
  form: { paddingHorizontal: 24 },
  label: { fontFamily: ds.f.sansBold, fontSize: 11, color: '#434843', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    fontFamily: ds.f.sans,
    backgroundColor: '#eef6ef', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: '#161d19',
  },
  button: {
    backgroundColor: '#051b0e', borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 28,
  },
  buttonText: { fontFamily: ds.f.sansBold, color: '#fff', fontSize: 15, letterSpacing: 1 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 20 },
  errorText: { fontFamily: ds.f.sansMedium, fontSize: 13, color: '#ef4444' },
  createRow: { alignItems: 'center', marginTop: 28 },
  createText: { fontFamily: ds.f.sans, fontSize: 14, color: '#737972' },
  createLink: { fontFamily: ds.f.sansBold, color: '#735c00' },

  // Success state
  successWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#eef6ef', justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  iconText: { fontSize: 32 },
  emailDisplay: { fontFamily: ds.f.sansBold, fontSize: 15, color: '#051b0e', marginBottom: 32, marginTop: 6 },
});
