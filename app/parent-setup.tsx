import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '@/components/Text';

const JOB_TYPES = [
  'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care',
  'Tech Help', 'Cleaning', 'Errands', 'Car Washing',
  'Cooking / Meal Prep', 'Grocery Runs',
];

const KID_AGES = ['Under 2', '2–4', '5–7', '8–10', '11–13', '14+', 'No kids'];

const FREQ_OPTIONS = [
  { key: 'one_off', label: 'One-off jobs', sub: 'I need help occasionally' },
  { key: 'weekly', label: 'Weekly', sub: 'Regular weekly help' },
  { key: 'biweekly', label: 'Every two weeks', sub: '' },
  { key: 'monthly', label: 'Monthly', sub: '' },
  { key: 'as_needed', label: 'As needed', sub: 'Varies week to week' },
];

const TIMING_OPTIONS = [
  { key: 'weekday_morning', label: 'Weekday mornings' },
  { key: 'weekday_after', label: 'Weekday afternoons' },
  { key: 'weekday_eve', label: 'Weekday evenings' },
  { key: 'weekends', label: 'Weekends' },
  { key: 'school_holidays', label: 'School holidays' },
  { key: 'flexible', label: 'Flexible' },
];

export default function ParentSetup() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1 — Family info
  const [neighborhood, setNeighborhood] = useState('');
  const [bio, setBio] = useState('');
  const [numKids, setNumKids] = useState('');
  const [kidAges, setKidAges] = useState<string[]>([]);
  const [hasPets, setHasPets] = useState(false);
  const [petDesc, setPetDesc] = useState('');
  const [errs1, setErrs1] = useState<Record<string, string>>({});

  // Step 2 — What you need
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [jobErr, setJobErr] = useState('');
  const [frequency, setFrequency] = useState('');
  const [freqErr, setFreqErr] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // Step 3 — Timing & preferences
  const [timing, setTiming] = useState<Record<string, boolean>>({});
  const [maxRate, setMaxRate] = useState('');
  const [preferVerified, setPreferVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const v1 = () => {
    const e: Record<string, string> = {};
    if (!neighborhood.trim()) e.neighborhood = 'Enter your neighborhood or area.';
    setErrs1(e);
    return !Object.keys(e).length;
  };

  const v2 = () => {
    let ok = true;
    if (!jobTypes.length) { setJobErr('Select at least one job type.'); ok = false; } else setJobErr('');
    if (!frequency) { setFreqErr('Select how often you need help.'); ok = false; } else setFreqErr('');
    return ok;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const timingLabels = TIMING_OPTIONS.filter(o => timing[o.key]).map(o => o.label);
    const bioFull = [bio.trim(), extraNotes.trim()].filter(Boolean).join('\n\n');

    const { error } = await supabase
      .from('profiles')
      .update({
        neighborhood: neighborhood.trim(),
        bio: bioFull || null,
        skills: jobTypes,           // reuse skills field to store job type preferences
        availability: timingLabels, // reuse availability field for timing preferences
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.replace('/(tabs)' as any);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        {step > 1
          ? <TouchableOpacity onPress={() => setStep(n => n - 1)}><Text style={s.backText}>← Back</Text></TouchableOpacity>
          : <View style={{ width: 48 }} />
        }
        <View style={s.dots}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[s.dot, step >= n && s.dotOn, step === n && s.dotCurrent]} />
          ))}
        </View>
        <Text style={s.stepCount}>{step} of 3</Text>
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── STEP 1 — Family Info ── */}
        {step === 1 && (
          <>
            <Text style={s.title}>Set up your profile</Text>
            <Text style={s.subtitle}>Help teens understand your family</Text>

            {/* Avatar */}
            <TouchableOpacity style={s.avatarWrap} onPress={() => Alert.alert('Coming soon', 'Photo upload coming soon.')}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <Text style={s.avatarChange}>Change photo</Text>
            </TouchableOpacity>

            {/* Name read-only */}
            <Text style={s.label}>Full name</Text>
            <View style={s.readonly}><Text style={s.readonlyText}>{profile?.full_name ?? '—'}</Text></View>

            {/* Neighborhood */}
            <Text style={s.label}>Your neighborhood</Text>
            <TextInput
              style={[s.input, errs1.neighborhood && s.inputErr]}
              placeholder="e.g. Maplewood, NJ"
              placeholderTextColor="#aaa"
              value={neighborhood}
              onChangeText={v => { setNeighborhood(v); setErrs1(e => ({ ...e, neighborhood: '' })); }}
            />
            {errs1.neighborhood ? <Text style={s.err}>{errs1.neighborhood}</Text> : null}

            {/* About family */}
            <View style={s.labelRow}>
              <Text style={s.label}>About your family</Text>
              <Text style={s.counter}>{bio.length}/200</Text>
            </View>
            <TextInput
              style={s.textArea}
              placeholder="Tell teens a bit about your household, your routine, what you value in a helper..."
              placeholderTextColor="#aaa"
              value={bio}
              onChangeText={v => setBio(v.slice(0, 200))}
              multiline
            />

            {/* Number of kids */}
            <Text style={s.label}>How many kids do you have?</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 2"
              placeholderTextColor="#aaa"
              value={numKids}
              onChangeText={setNumKids}
              keyboardType="number-pad"
            />

            {/* Kid ages */}
            <Text style={s.label}>Ages of your kids</Text>
            <View style={s.chips}>
              {KID_AGES.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[s.chip, kidAges.includes(a) && s.chipOn]}
                  onPress={() => setKidAges(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                >
                  <Text style={[s.chipText, kidAges.includes(a) && s.chipTextOn]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pets */}
            <View style={s.toggleCard}>
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>We have pets</Text>
                <Switch value={hasPets} onValueChange={setHasPets} trackColor={{ true: '#22c55e', false: '#e5e5e5' }} thumbColor="#fff" />
              </View>
            </View>
            {hasPets && (
              <TextInput
                style={[s.input, { marginTop: 8 }]}
                placeholder="Describe your pets (type, size, temperament)"
                placeholderTextColor="#aaa"
                value={petDesc}
                onChangeText={setPetDesc}
              />
            )}

            <TouchableOpacity style={s.btn} onPress={() => v1() && setStep(2)}>
              <Text style={s.btnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2 — What You Need ── */}
        {step === 2 && (
          <>
            <Text style={s.title}>What do you need help with?</Text>
            <Text style={s.subtitle}>Select all that apply</Text>

            <View style={s.jobGrid}>
              {JOB_TYPES.map(jt => {
                const on = jobTypes.includes(jt);
                return (
                  <TouchableOpacity
                    key={jt}
                    style={[s.jobCard, on && s.jobCardOn]}
                    onPress={() => { setJobTypes(p => p.includes(jt) ? p.filter(x => x !== jt) : [...p, jt]); setJobErr(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.jobCardText, on && s.jobCardTextOn]}>{jt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {jobErr ? <Text style={s.err}>{jobErr}</Text> : null}

            {/* Frequency */}
            <Text style={s.label}>How often do you need help?</Text>
            <View style={s.freqCard}>
              {FREQ_OPTIONS.map((opt, i) => {
                const on = frequency === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.freqRow, i < FREQ_OPTIONS.length - 1 && s.freqRowBorder, on && s.freqRowOn]}
                    onPress={() => { setFrequency(opt.key); setFreqErr(''); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.freqLabel, on && s.freqLabelOn]}>{opt.label}</Text>
                      {opt.sub ? <Text style={s.freqSub}>{opt.sub}</Text> : null}
                    </View>
                    <View style={[s.radio, on && s.radioOn]}>
                      {on && <View style={s.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {freqErr ? <Text style={s.err}>{freqErr}</Text> : null}

            {/* Extra notes */}
            <View style={s.labelRow}>
              <Text style={s.label}>Anything else teens should know?</Text>
              <Text style={s.counter}>{extraNotes.length}/200</Text>
            </View>
            <TextInput
              style={s.textArea}
              placeholder="Parking, entrance instructions, house rules, allergies in the home..."
              placeholderTextColor="#aaa"
              value={extraNotes}
              onChangeText={v => setExtraNotes(v.slice(0, 200))}
              multiline
            />

            <TouchableOpacity style={s.btn} onPress={() => v2() && setStep(3)}>
              <Text style={s.btnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3 — Timing & Preferences ── */}
        {step === 3 && (
          <>
            <Text style={s.title}>When do you need help?</Text>
            <Text style={s.subtitle}>Teens will see this on your profile</Text>

            <View style={s.toggleCard}>
              {TIMING_OPTIONS.map((opt, i) => (
                <View key={opt.key} style={[s.toggleRow, i < TIMING_OPTIONS.length - 1 && s.toggleRowBorder]}>
                  <Text style={s.toggleLabel}>{opt.label}</Text>
                  <Switch
                    value={!!timing[opt.key]}
                    onValueChange={() => setTiming(p => ({ ...p, [opt.key]: !p[opt.key] }))}
                    trackColor={{ true: '#22c55e', false: '#e5e5e5' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>

            {/* Max rate */}
            <Text style={s.label}>Max hourly budget</Text>
            <View style={s.rateInputRow}>
              <Text style={s.ratePre}>$</Text>
              <TextInput
                style={s.rateInput}
                placeholder="0"
                placeholderTextColor="#aaa"
                value={maxRate}
                onChangeText={setMaxRate}
                keyboardType="number-pad"
              />
              <Text style={s.ratePost}>/hr</Text>
              <Text style={s.rateNote}>(optional — helps teens gauge fit)</Text>
            </View>

            {/* Prefer verified */}
            <View style={[s.toggleCard, { marginTop: 16 }]}>
              <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleLabel}>Prefer verified teens only</Text>
                  <Text style={s.freqSub}>Only show teens with ID verification</Text>
                </View>
                <Switch
                  value={preferVerified}
                  onValueChange={setPreferVerified}
                  trackColor={{ true: '#22c55e', false: '#e5e5e5' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.btn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Complete Profile</Text>}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, gap: 12 },
  backText: { fontSize: 15, color: '#666', width: 48 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e5e5' },
  dotOn: { backgroundColor: '#ccc' },
  dotCurrent: { backgroundColor: '#22c55e', width: 20 },
  stepCount: { fontSize: 13, color: '#aaa', width: 48, textAlign: 'right' },

  body: { paddingHorizontal: 24, paddingBottom: 32 },

  title: { fontSize: 26, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 28 },

  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  avatarChange: { fontSize: 14, color: '#22c55e', fontWeight: '500' },

  label: { fontSize: 14, fontWeight: '600', color: '#111', marginTop: 16, marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, marginBottom: 8 },
  counter: { fontSize: 12, color: '#aaa' },

  readonly: { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 8, padding: 16, backgroundColor: '#fafafa', marginBottom: 2 },
  readonlyText: { fontSize: 16, color: '#888' },

  input: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 16, fontSize: 16, color: '#111', marginBottom: 2 },
  inputErr: { borderColor: '#ef4444' },
  textArea: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 16, fontSize: 15, color: '#111', minHeight: 100, textAlignVertical: 'top', marginBottom: 2 },
  err: { fontSize: 13, color: '#ef4444', marginTop: 4, marginBottom: 4 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  chipOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#666' },
  chipTextOn: { color: '#fff' },

  toggleCard: { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, overflow: 'hidden', marginBottom: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#111', flex: 1 },

  jobGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  jobCard: { width: '47%', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 14 },
  jobCardOn: { borderColor: '#22c55e', borderWidth: 1.5 },
  jobCardText: { fontSize: 14, fontWeight: '600', color: '#666' },
  jobCardTextOn: { color: '#22c55e' },

  freqCard: { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  freqRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  freqRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  freqRowOn: { backgroundColor: '#f9fffe' },
  freqLabel: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 2 },
  freqLabelOn: { color: '#22c55e', fontWeight: '600' },
  freqSub: { fontSize: 12, color: '#888' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioOn: { borderColor: '#22c55e' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },

  rateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratePre: { fontSize: 18, fontWeight: '600', color: '#111' },
  rateInput: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '600', width: 72, textAlign: 'center', color: '#111' },
  ratePost: { fontSize: 14, color: '#888' },
  rateNote: { flex: 1, fontSize: 12, color: '#aaa' },

  btn: { backgroundColor: '#22c55e', borderRadius: 8, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
