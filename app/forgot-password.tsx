import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

  const handleSend = () => {
    if (!validateEmail(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setSent(true);
    startCooldown();
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    startCooldown();
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  if (sent) {
    return (
      <View style={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={s.successWrap}>
          <Text style={s.envelopeIcon}>✉️</Text>
          <Text style={s.successTitle}>Check your email!</Text>
          <Text style={s.successSub}>We sent a reset link to</Text>
          <Text style={s.successEmail}>{email}</Text>

          <TouchableOpacity
            style={[s.resendBtn, cooldown > 0 && s.resendBtnDisabled]}
            onPress={handleResend}
            disabled={cooldown > 0}
          >
            <Text style={[s.resendText, cooldown > 0 && s.resendTextDisabled]}>
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.backToLoginBtn} onPress={() => router.push('/login')}>
            <Text style={s.backToLoginText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={s.inner}>
        <Text style={s.lockIcon}>🔒</Text>
        <Text style={s.title}>Reset your password</Text>
        <Text style={s.sub}>Enter your email and we'll send you a reset link</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={[s.input, error && s.inputErr]}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={v => { setEmail(v); setError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        {error ? <Text style={s.fieldError}>⚠ {error}</Text> : null}

        <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
          <Text style={s.sendBtnText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  inner: { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  lockIcon: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc' },
  inputErr: { borderColor: '#f87171' },
  fieldError: { color: '#dc2626', fontSize: 13, marginTop: 6 },
  sendBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  envelopeIcon: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#64748b' },
  successEmail: { fontSize: 16, fontWeight: '700', color: '#22c55e', marginBottom: 32 },
  resendBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
  resendTextDisabled: { color: '#94a3b8' },
  backToLoginBtn: { marginTop: 16 },
  backToLoginText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
});
