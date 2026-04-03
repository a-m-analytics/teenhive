import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILLS = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands', 'Car Washing'];
const AVAIL_OPTIONS = ['Weekdays after school', 'Weekends', 'School holidays', 'Flexible'];
const SAFETY_ALL = [
  'I will keep all communication in-app until both parties agree to share contact info',
  'I will never ask for or share personal addresses until a job is confirmed',
  'I agree to treat all users with respect',
];
const SAFETY_PARENT = ['I confirm I am an adult (18+) and will never ask teens to meet in private locations'];
const SAFETY_TEEN = ['I will tell a trusted adult about any job I accept'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validateName(n: string) { return n.trim().split(/\s+/).length >= 2; }
function passwordStrength(p: string): { label: string; color: string; pct: number } {
  const hasLen = p.length >= 8;
  const hasNum = /\d/.test(p);
  const hasSpec = /[!@#$%^&*]/.test(p);
  const score = [hasLen, hasNum, hasSpec].filter(Boolean).length;
  if (score === 0) return { label: 'Weak', color: '#ef4444', pct: 0.15 };
  if (score === 1) return { label: 'Weak', color: '#ef4444', pct: 0.33 };
  if (score === 2) return { label: 'Fair', color: '#f59e0b', pct: 0.66 };
  return { label: 'Strong', color: '#22c55e', pct: 1 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <Text style={s.fieldError}>⚠ {msg}</Text>;
}

function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity style={s.checkRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.checkBox, checked && s.checkBoxOn]}>
        {checked && <Text style={s.checkMark}>✓</Text>}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function Signup() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const isTeen = role === 'teen';
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errs1, setErrs1] = useState<Record<string, string>>({});

  // Step 2
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [avail, setAvail] = useState<string[]>([]);
  const [rate, setRate] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [errs2, setErrs2] = useState<Record<string, string>>({});

  // Step 3
  const [safetyChecks, setSafetyChecks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const strength = passwordStrength(password);
  const hasLen = password.length >= 8;
  const hasNum = /\d/.test(password);
  const hasSpec = /[!@#$%^&*]/.test(password);

  // ── Step 1 validation ──
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!validateName(name)) e.name = 'Enter your first and last name.';
    if (!validateEmail(email)) e.email = 'Enter a valid email address.';
    if (password.length < 8 || !hasNum || !hasSpec) e.password = 'Password must meet all requirements.';
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    setErrs1(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 2 validation ──
  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const ageNum = parseInt(age, 10);
    if (isTeen) {
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 17) e.age = 'You must be between 13 and 17 to sign up as a teen.';
      if (bio.trim().length < 20) e.bio = 'Bio must be at least 20 characters.';
      if (skills.length === 0) e.skills = 'Select at least one skill.';
    } else {
      if (isNaN(ageNum) || ageNum < 18) e.age = 'You must be 18 or older to sign up as a parent.';
      if (!neighborhood.trim()) e.neighborhood = 'Enter your neighborhood or area.';
      if (bio.trim().length < 20) e.bio = 'Bio must be at least 20 characters.';
    }
    setErrs2(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 3 submit ──
  const allSafetyItems = [...SAFETY_ALL, ...(isTeen ? SAFETY_TEEN : SAFETY_PARENT)];
  const allChecked = allSafetyItems.every(item => safetyChecks.includes(item));

  const handleSubmit = async () => {
    if (!allChecked) return;
    setSubmitError('');
    setLoading(true);
    const { error } = await signUp(email, password, {
      role: role ?? 'teen',
      full_name: name,
      age: parseInt(age, 10),
      bio,
      neighborhood: isTeen ? undefined : neighborhood,
      hourly_rate: isTeen && rate ? parseFloat(rate) : undefined,
      skills: isTeen ? skills : undefined,
      availability: isTeen ? avail : undefined,
    });
    setLoading(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace('/(tabs)' as any), 1200);
  };

  const toggleSkill = (sk: string) => setSkills(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);
  const toggleAvail = (a: string) => setAvail(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  const toggleSafety = (item: string) => setSafetyChecks(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);

  // ── Progress bar ──
  const progressPct = step === 1 ? 0.33 : step === 2 ? 0.66 : 1;

  // ── Success screen ──
  if (done) {
    return (
      <View style={s.successScreen}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitle}>Account Created!</Text>
        <Text style={s.successSub}>Taking you to Neighborly Jobs...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress */}
      <View style={s.progressWrap}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progressPct * 100}%` as any }]} />
        </View>
        <Text style={s.stepLabel}>Step {step} of 3</Text>
      </View>

      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <Text style={s.title}>Basic Info</Text>
            <Text style={s.sub}>Signing up as a {isTeen ? 'Teen' : 'Parent'}</Text>

            <Text style={s.label}>Full Name</Text>
            <TextInput style={[s.input, errs1.name && s.inputErr]} placeholder="First and last name" placeholderTextColor="#94a3b8" value={name} onChangeText={v => { setName(v); setErrs1(e => ({ ...e, name: '' })); }} />
            <FieldError msg={errs1.name} />

            <Text style={s.label}>Email</Text>
            <TextInput style={[s.input, errs1.email && s.inputErr]} placeholder="you@example.com" placeholderTextColor="#94a3b8" value={email} onChangeText={v => { setEmail(v); setErrs1(e => ({ ...e, email: '' })); }} autoCapitalize="none" keyboardType="email-address" />
            <FieldError msg={errs1.email} />

            <Text style={s.label}>Password</Text>
            <View style={[s.pwRow, errs1.password && s.inputErr]}>
              <TextInput style={s.pwInput} placeholder="Create a password" placeholderTextColor="#94a3b8" value={password} onChangeText={v => { setPassword(v); setErrs1(e => ({ ...e, password: '' })); }} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}><Text style={s.eyeIcon}>{showPw ? '🙈' : '👁'}</Text></TouchableOpacity>
            </View>
            {password.length > 0 && (
              <>
                <View style={s.strengthRow}>
                  <View style={s.strengthBar}><View style={[s.strengthFill, { width: `${strength.pct * 100}%` as any, backgroundColor: strength.color }]} /></View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
                <View style={s.reqList}>
                  <Text style={[s.req, hasLen && s.reqMet]}>{'  '}{hasLen ? '✓' : '○'} 8+ characters</Text>
                  <Text style={[s.req, hasNum && s.reqMet]}>{'  '}{hasNum ? '✓' : '○'} One number</Text>
                  <Text style={[s.req, hasSpec && s.reqMet]}>{'  '}{hasSpec ? '✓' : '○'} One special character (!@#$%)</Text>
                </View>
              </>
            )}
            <FieldError msg={errs1.password} />

            <Text style={s.label}>Confirm Password</Text>
            <View style={[s.pwRow, errs1.confirm && s.inputErr]}>
              <TextInput style={s.pwInput} placeholder="Repeat password" placeholderTextColor="#94a3b8" value={confirm} onChangeText={v => { setConfirm(v); setErrs1(e => ({ ...e, confirm: '' })); }} secureTextEntry={!showConfirm} />
              <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn}><Text style={s.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text></TouchableOpacity>
            </View>
            <FieldError msg={errs1.confirm} />

            <TouchableOpacity style={s.nextBtn} onPress={() => validateStep1() && setStep(2)}>
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <Text style={s.title}>Your Profile</Text>
            <Text style={s.sub}>{isTeen ? 'Tell parents what you can do' : 'Tell teens about your family'}</Text>

            <Text style={s.label}>Your Age</Text>
            <TextInput style={[s.input, errs2.age && s.inputErr]} placeholder={isTeen ? '13–17' : '18+'} placeholderTextColor="#94a3b8" value={age} onChangeText={v => { setAge(v); setErrs2(e => ({ ...e, age: '' })); }} keyboardType="number-pad" />
            <FieldError msg={errs2.age} />

            {!isTeen && (
              <>
                <Text style={s.label}>Neighborhood / Area</Text>
                <TextInput style={[s.input, errs2.neighborhood && s.inputErr]} placeholder="e.g. Maplewood, NJ" placeholderTextColor="#94a3b8" value={neighborhood} onChangeText={v => { setNeighborhood(v); setErrs2(e => ({ ...e, neighborhood: '' })); }} />
                <FieldError msg={errs2.neighborhood} />
              </>
            )}

            <View style={s.bioLabelRow}>
              <Text style={s.label}>{isTeen ? 'What can you do?' : 'About your family'}</Text>
              <Text style={s.counter}>{bio.length}/200</Text>
            </View>
            <TextInput style={[s.textArea, errs2.bio && s.inputErr]} placeholder={isTeen ? 'Describe your experience and why you\'re reliable...' : 'Tell teens what kind of jobs you post and about your household...'} placeholderTextColor="#94a3b8" value={bio} onChangeText={v => { setBio(v.slice(0, 200)); setErrs2(e => ({ ...e, bio: '' })); }} multiline />
            <FieldError msg={errs2.bio} />

            {isTeen && (
              <>
                <Text style={s.label}>Skills <Text style={s.required}>(pick at least 1)</Text></Text>
                <View style={s.chipGrid}>
                  {SKILLS.map(sk => (
                    <TouchableOpacity key={sk} style={[s.chip, skills.includes(sk) && s.chipOn]} onPress={() => { toggleSkill(sk); setErrs2(e => ({ ...e, skills: '' })); }}>
                      <Text style={[s.chipText, skills.includes(sk) && s.chipTextOn]}>{sk}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FieldError msg={errs2.skills} />

                <Text style={s.label}>Availability</Text>
                <View style={s.chipGrid}>
                  {AVAIL_OPTIONS.map(a => (
                    <TouchableOpacity key={a} style={[s.chip, avail.includes(a) && s.chipOn]} onPress={() => toggleAvail(a)}>
                      <Text style={[s.chipText, avail.includes(a) && s.chipTextOn]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>Hourly Rate</Text>
                <View style={s.rateRow}>
                  <Text style={s.ratePrefix}>$</Text>
                  <TextInput style={s.rateInput} placeholder="15" placeholderTextColor="#94a3b8" value={rate} onChangeText={setRate} keyboardType="number-pad" />
                  <Text style={s.rateSuffix}>/hr</Text>
                </View>
              </>
            )}

            <TouchableOpacity style={s.nextBtn} onPress={() => validateStep2() && setStep(3)}>
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <>
            <View style={s.shieldWrap}>
              <Text style={s.shieldIcon}>🛡️</Text>
            </View>
            <Text style={s.title}>Keep Everyone Safe</Text>
            <Text style={s.sub}>Please read and agree to these before joining</Text>

            <View style={s.safetyCard}>
              {allSafetyItems.map(item => (
                <Checkbox key={item} checked={safetyChecks.includes(item)} onPress={() => toggleSafety(item)} label={item} />
              ))}
            </View>

            <View style={s.emailNotice}>
              <Text style={s.emailNoticeIcon}>📧</Text>
              <Text style={s.emailNoticeText}>We'll send a verification email to <Text style={s.emailBold}>{email}</Text> before you can apply to jobs.</Text>
            </View>

            {submitError ? <Text style={s.fieldError}>⚠ {submitError}</Text> : null}

            <TouchableOpacity
              style={[s.submitBtn, (!allChecked || loading) && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!allChecked || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Create Account</Text>
              }
            </TouchableOpacity>

            {!allChecked && <Text style={s.safetyError}>Please agree to all safety guidelines above.</Text>}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 10 },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 22, color: '#22c55e', fontWeight: '700' },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  stepLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', minWidth: 50, textAlign: 'right' },

  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 24 },

  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 16, marginBottom: 8 },
  required: { fontWeight: '400', color: '#94a3b8' },
  bioLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, marginBottom: 8 },
  counter: { fontSize: 12, color: '#94a3b8' },

  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc' },
  inputErr: { borderColor: '#f87171' },
  textArea: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc', minHeight: 100, textAlignVertical: 'top' },
  fieldError: { color: '#dc2626', fontSize: 13, marginTop: 4, marginBottom: 2 },

  pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc' },
  pwInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a' },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthBar: { flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 44 },
  reqList: { marginTop: 6, gap: 3 },
  req: { fontSize: 13, color: '#94a3b8' },
  reqMet: { color: '#22c55e', fontWeight: '600' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc' },
  chipOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: '#fff' },

  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratePrefix: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  rateInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 20, fontWeight: '700', width: 80, textAlign: 'center', color: '#22c55e', backgroundColor: '#f8fafc' },
  rateSuffix: { fontSize: 15, color: '#64748b' },

  nextBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  shieldWrap: { alignItems: 'center', marginBottom: 8, marginTop: 8 },
  shieldIcon: { fontSize: 56 },
  safetyCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 14, marginBottom: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  checkBoxOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  checkLabel: { flex: 1, fontSize: 14, color: '#0f172a', lineHeight: 21 },

  emailNotice: { flexDirection: 'row', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
  emailNoticeIcon: { fontSize: 18 },
  emailNoticeText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
  emailBold: { fontWeight: '700', color: '#0f172a' },

  submitBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 17, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  safetyError: { color: '#dc2626', fontSize: 13, textAlign: 'center', marginTop: 10 },

  successScreen: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', gap: 12 },
  successIcon: { fontSize: 72 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  successSub: { fontSize: 15, color: '#64748b' },
});
