import { currentUser } from '@/lib/user';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const VALID_CODE = '123456';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const displayEmail = email ?? currentUser.name + '@example.com';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(timer.current!); return 0; } return c - 1; });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const resetCooldown = () => {
    setCooldown(60);
    timer.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(timer.current!); return 0; } return c - 1; });
    }, 1000);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const verify = (code: string) => {
    if (code === VALID_CODE) {
      setError('');
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)' as any), 1800);
    } else {
      shake();
      setError('Incorrect code, try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleInput = (text: string, idx: number) => {
    const val = text.slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError('');
    if (val && idx < 5) { inputRefs.current[idx + 1]?.focus(); }
    if (idx === 5 && val) {
      const code = [...next.slice(0, 5), val].join('');
      if (code.length === 6) verify(code);
    }
  };

  const handleBackspace = (key: string, idx: number) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  if (success) {
    return (
      <View style={s.successScreen}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitle}>Email verified!</Text>
        <Text style={s.successSub}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <Text style={s.topIcon}>📬</Text>
        <Text style={s.title}>Verify your email</Text>
        <Text style={s.sub}>We sent a 6-digit code to</Text>
        <Text style={s.email}>{displayEmail}</Text>

        <Animated.View style={[s.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputRefs.current[i] = r; }}
              style={[s.digitBox, error && s.digitBoxErr, d && s.digitBoxFilled]}
              value={d}
              onChangeText={t => handleInput(t, i)}
              onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </Animated.View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.resendBtn, cooldown > 0 && s.resendBtnDisabled]}
          onPress={() => { if (cooldown === 0) resetCooldown(); }}
          disabled={cooldown > 0}
        >
          <Text style={[s.resendText, cooldown > 0 && s.resendDisabled]}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <Text style={s.hint}>Hint for testing: use code 123456</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  topIcon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  sub: { fontSize: 15, color: '#64748b' },
  email: { fontSize: 15, fontWeight: '700', color: '#22c55e', marginBottom: 32 },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  digitBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', fontSize: 24, fontWeight: '800', color: '#0f172a', backgroundColor: '#f8fafc', textAlign: 'center' },
  digitBoxFilled: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  digitBoxErr: { borderColor: '#f87171', backgroundColor: '#fef2f2' },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  resendBtn: { marginTop: 8, paddingVertical: 12 },
  resendBtnDisabled: {},
  resendText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
  resendDisabled: { color: '#94a3b8' },
  hint: { marginTop: 24, fontSize: 12, color: '#94a3b8' },
  successScreen: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', gap: 12 },
  successIcon: { fontSize: 72 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  successSub: { fontSize: 15, color: '#64748b' },
});
