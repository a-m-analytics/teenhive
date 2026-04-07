import { currentUser } from '@/lib/user';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '@/components/Text';

const VALID_CODE = '123456';

type PhaseType = 'phone' | 'sms' | 'done';

function StepCard({ num, title, status }: { num: number; title: string; status: 'done' | 'active' | 'soon' }) {
  return (
    <View style={[sc.stepCard, status === 'active' && sc.stepCardActive]}>
      <View style={[sc.stepNum, status === 'done' && sc.stepNumDone, status === 'active' && sc.stepNumActive]}>
        <Text style={sc.stepNumText}>{status === 'done' ? '✓' : num}</Text>
      </View>
      <Text style={[sc.stepTitle, status === 'active' && sc.stepTitleActive]}>{title}</Text>
      {status === 'soon' && <View style={sc.soonBadge}><Text style={sc.soonText}>Soon</Text></View>}
      {status === 'done' && <Text style={sc.doneText}>Verified ✓</Text>}
    </View>
  );
}

export default function ParentVerify() {
  const router = useRouter();
  const [phase, setPhase] = useState<PhaseType>('phone');
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [smsErr, setSmsErr] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (sec: number) => {
    setCooldown(sec);
    timer.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(timer.current!); return 0; } return c - 1; });
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const sendSms = () => {
    if (phone.replace(/\D/g, '').length < 10) { setPhoneErr('Enter a valid 10-digit phone number.'); return; }
    setPhoneErr('');
    setPhase('sms');
    startCooldown(60);
  };

  const handleDigit = (text: string, idx: number) => {
    const val = text.slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setSmsErr('');
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (idx === 5 && val) {
      const code = [...next.slice(0, 5), val].join('');
      if (code.length === 6) verifyCode(code);
    }
  };

  const handleBackspace = (key: string, idx: number) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const verifyCode = (code: string) => {
    if (code === VALID_CODE) {
      // Mark parent as verified
      (currentUser as any).verified = true;
      setPhase('done');
    } else {
      shake();
      setSmsErr('Incorrect code, try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <Text style={s.shieldIcon}>🛡️</Text>
        <Text style={s.title}>Verify your identity</Text>
        <Text style={s.sub}>To keep teens safe, we verify all parents</Text>
      </View>

      <View style={s.stepsRow}>
        <StepCard num={1} title="Email verified" status="done" />
        <StepCard num={2} title="Phone number" status={phase === 'done' ? 'done' : 'active'} />
        <StepCard num={3} title="ID verification" status="soon" />
      </View>

      {phase === 'phone' && (
        <View style={s.body}>
          <Text style={s.label}>Phone Number</Text>
          <View style={[s.phoneRow, phoneErr && s.inputErr]}>
            <Text style={s.countryCode}>+1</Text>
            <View style={s.dividerV} />
            <TextInput
              style={s.phoneInput}
              placeholder="(555) 000-0000"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={v => { setPhone(v); setPhoneErr(''); }}
              keyboardType="phone-pad"
            />
          </View>
          {phoneErr ? <Text style={s.fieldError}>⚠ {phoneErr}</Text> : null}
          <TouchableOpacity style={s.mainBtn} onPress={sendSms}>
            <Text style={s.mainBtnText}>Send SMS Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'sms' && (
        <View style={s.body}>
          <Text style={s.label}>Enter the 6-digit code sent to +1 {phone}</Text>
          <Animated.View style={[s.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={r => { inputRefs.current[i] = r; }}
                style={[s.digitBox, smsErr && s.digitBoxErr, d && s.digitBoxFilled]}
                value={d}
                onChangeText={t => handleDigit(t, i)}
                onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </Animated.View>
          {smsErr ? <Text style={s.fieldError}>{smsErr}</Text> : null}
          <TouchableOpacity
            style={[s.resendBtn, cooldown > 0 && s.resendDisabled]}
            onPress={() => { if (cooldown === 0) { setDigits(['', '', '', '', '', '']); startCooldown(60); } }}
            disabled={cooldown > 0}
          >
            <Text style={[s.resendText, cooldown > 0 && s.resendTextDisabled]}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
          <Text style={s.hint}>Hint for testing: use 123456</Text>
        </View>
      )}

      {phase === 'done' && (
        <View style={s.body}>
          <View style={s.phoneDone}>
            <Text style={s.phoneDoneIcon}>✅</Text>
            <Text style={s.phoneDoneText}>Phone verified!</Text>
          </View>
          <View style={s.idCard}>
            <Text style={s.idIcon}>🪪</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.idTitle}>ID Verification</Text>
              <Text style={s.idSub}>Full identity verification coming soon</Text>
            </View>
            <View style={s.soonBadge2}><Text style={s.soonText2}>Soon</Text></View>
          </View>
          <View style={s.verifiedBanner}>
            <Text style={s.verifiedBannerText}>✓ You're a Verified Parent</Text>
          </View>
          <TouchableOpacity style={s.mainBtn} onPress={() => router.replace('/(tabs)' as any)}>
            <Text style={s.mainBtnText}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  header: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  shieldIcon: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  stepsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 24 },
  body: { flex: 1, paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc' },
  inputErr: { borderColor: '#f87171' },
  countryCode: { fontSize: 16, fontWeight: '700', color: '#0f172a', paddingHorizontal: 14 },
  dividerV: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a' },
  fieldError: { color: '#dc2626', fontSize: 13, marginTop: 6, marginBottom: 4 },
  mainBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  digitBox: { width: 44, height: 54, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', fontSize: 22, fontWeight: '800', color: '#0f172a', backgroundColor: '#f8fafc', textAlign: 'center' },
  digitBoxFilled: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  digitBoxErr: { borderColor: '#f87171', backgroundColor: '#fef2f2' },
  resendBtn: { paddingVertical: 10 },
  resendDisabled: {},
  resendText: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
  resendTextDisabled: { color: '#94a3b8' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  phoneDone: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16 },
  phoneDoneIcon: { fontSize: 24 },
  phoneDoneText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 },
  idIcon: { fontSize: 28 },
  idTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  idSub: { fontSize: 12, color: '#64748b' },
  soonBadge2: { backgroundColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  soonText2: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  verifiedBanner: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  verifiedBannerText: { color: '#16a34a', fontSize: 15, fontWeight: '800' },
});

const sc = StyleSheet.create({
  stepCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  stepCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  stepNumDone: { backgroundColor: '#22c55e' },
  stepNumActive: { backgroundColor: '#22c55e' },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stepTitle: { fontSize: 11, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  stepTitleActive: { color: '#16a34a' },
  soonBadge: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  soonText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  doneText: { fontSize: 10, color: '#16a34a', fontWeight: '700' },
});
