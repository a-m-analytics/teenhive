import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const SKILLS = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands', 'Car Washing'];
const AVAIL  = ['Weekdays after school', 'Weekends', 'School holidays', 'Flexible'];
const KIDS_AGES  = ['Under 5', '5–8', '9–12', '13+'];
const HOME_TYPES = ['House', 'Apartment', 'Townhouse', 'Farm / Rural'];

export default function Signup() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { signUp } = useAuth();
  const isTeen = role === 'teen';
  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [age, setAge]               = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [bio, setBio]               = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [numberOfKids, setNumberOfKids] = useState('');
  const [skills, setSkills]         = useState<string[]>([]);
  const [avail, setAvail]           = useState<string[]>([]);
  const [kidsAges, setKidsAges]     = useState<string[]>([]);
  const [homeType, setHomeType]     = useState('');
  const [hasPets, setHasPets]       = useState<boolean | null>(null);

  // Step 3
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [agreed4, setAgreed4] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = agreed1 && agreed2 && agreed3 && (isTeen || agreed4);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
        Alert.alert('Missing info', 'Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum)) {
        Alert.alert('Missing info', 'Please enter your age.');
        return;
      }
      if (isTeen && (ageNum < 13 || ageNum > 17)) {
        Alert.alert('Error', 'Teens must be between 13 and 17 years old.');
        return;
      }
      if (!isTeen && ageNum < 18) {
        Alert.alert('Error', 'Parents must be 18 or older.');
        return;
      }
      if (!neighborhood.trim()) {
        Alert.alert('Missing info', 'Please enter your neighborhood.');
        return;
      }
      if (isTeen && skills.length === 0) {
        Alert.alert('Missing info', 'Please select at least one skill.');
        return;
      }
      setStep(3);
    }
  };

  const handleSignup = async () => {
    if (!allChecked) {
      Alert.alert('Please agree', 'Check all boxes to continue.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email.trim(), password, {
        role: role ?? 'teen',
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        age: parseInt(age, 10),
        neighborhood: neighborhood.trim(),
        bio: bio.trim() || undefined,
        hourly_rate: isTeen && hourlyRate ? parseFloat(hourlyRate) : undefined,
        skills: isTeen ? skills : undefined,
        availability: isTeen ? avail : undefined,
      });
      if (error) { Alert.alert('Signup failed', error); return; }
      router.replace(isTeen ? '/teen-setup' as any : '/(tabs)' as any);
    } catch (e: any) {
      Alert.alert('Signup failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.logo}>TeenHive</Text>
          <Text style={s.stepText}>STEP {step < 10 ? '0' + step : step} OF 03</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }]} />
        </View>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={s.form}>
            <Text style={s.title}>Let's get you set up.</Text>
            <Text style={s.subtitle}>This takes about 2 minutes.</Text>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>FIRST NAME</Text>
                <TextInput
                  style={s.input}
                  value={firstName}
                  onChangeText={(t) => setFirstName(t)}
                  placeholder="First"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  returnKeyType="next"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>LAST NAME</Text>
                <TextInput
                  style={s.input}
                  value={lastName}
                  onChangeText={(t) => setLastName(t)}
                  placeholder="Last"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  returnKeyType="next"
                />
              </View>
            </View>

            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={(t) => setEmail(t)}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="next"
            />

            <Text style={s.label}>PASSWORD</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={(t) => setPassword(t)}
              placeholder="At least 8 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry={true}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="next"
            />

            <Text style={s.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={s.input}
              value={confirmPassword}
              onChangeText={(t) => setConfirmPassword(t)}
              placeholder="Repeat password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={true}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="done"
            />
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={s.form}>
            <Text style={s.title}>{isTeen ? 'About you.' : 'Your family.'}</Text>
            <Text style={s.subtitle}>{isTeen ? 'Help parents know who you are.' : 'Help teens understand your needs.'}</Text>

            <Text style={s.label}>AGE</Text>
            <TextInput
              style={s.input}
              value={age}
              onChangeText={(t) => setAge(t.replace(/\D/g, ''))}
              placeholder={isTeen ? 'e.g. 15' : 'e.g. 35'}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={2}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="next"
            />

            <Text style={s.label}>NEIGHBORHOOD</Text>
            <TextInput
              style={s.input}
              value={neighborhood}
              onChangeText={(t) => setNeighborhood(t)}
              placeholder="e.g. Maplewood, NJ"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="next"
            />

            <Text style={s.label}>{isTeen ? 'ABOUT YOU' : 'ABOUT YOUR FAMILY'} <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</Text></Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={bio}
              onChangeText={(t) => setBio(t)}
              placeholder={isTeen ? 'Tell parents a bit about yourself...' : 'Tell teens about your family...'}
              placeholderTextColor="#9ca3af"
              multiline={true}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />

            {isTeen && (
              <>
                <Text style={s.label}>HOURLY RATE <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</Text></Text>
                <TextInput
                  style={s.input}
                  value={hourlyRate}
                  onChangeText={(t) => setHourlyRate(t.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 15"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  returnKeyType="done"
                />

                <Text style={s.label}>YOUR SKILLS</Text>
                <View style={s.chips}>
                  {SKILLS.map(sk => {
                    const on = skills.includes(sk);
                    return (
                      <TouchableOpacity
                        key={sk}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => toggleArr(skills, sk, setSkills)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{sk}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={s.label}>AVAILABILITY</Text>
                <View style={s.chips}>
                  {AVAIL.map(a => {
                    const on = avail.includes(a);
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => toggleArr(avail, a, setAvail)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{a}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {!isTeen && (
              <>
                <Text style={s.label}>NUMBER OF KIDS <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</Text></Text>
                <TextInput
                  style={s.input}
                  value={numberOfKids}
                  onChangeText={(t) => setNumberOfKids(t.replace(/\D/g, ''))}
                  placeholder="e.g. 2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={2}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  returnKeyType="next"
                />

                <Text style={s.label}>KIDS' AGE GROUPS <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</Text></Text>
                <View style={s.chips}>
                  {KIDS_AGES.map(a => {
                    const on = kidsAges.includes(a);
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => toggleArr(kidsAges, a, setKidsAges)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{a}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={s.label}>HOME TYPE <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</Text></Text>
                <View style={s.chips}>
                  {HOME_TYPES.map(h => {
                    const on = homeType === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => setHomeType(h)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{h}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={s.label}>PETS?</Text>
                <View style={s.row}>
                  {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(opt => {
                    const on = hasPets === opt.val;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={[s.chip, on && s.chipOn, { flex: 1, alignItems: 'center' }]}
                        onPress={() => setHasPets(opt.val)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <View style={s.form}>
            <Text style={s.title}>Almost done.</Text>
            <Text style={s.subtitle}>A few things to keep everyone safe.</Text>

            {[
              { state: agreed1, set: setAgreed1, text: 'I will keep all communication in-app until both parties agree to meet in person.' },
              { state: agreed2, set: setAgreed2, text: 'I will never share personal addresses until a job is confirmed.' },
              { state: agreed3, set: setAgreed3, text: 'I agree to treat all users with respect.' },
              ...(!isTeen ? [{ state: agreed4, set: setAgreed4, text: 'I confirm I am an adult (18+) and will supervise all interactions.' }] : []),
            ].map(({ state, set, text }, i) => (
              <TouchableOpacity key={i} style={s.checkRow} onPress={() => set(!state)}>
                <View style={[s.checkbox, state && s.checkboxChecked]}>
                  {state && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkText}>{text}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ backgroundColor: '#eef6ef', borderRadius: 12, padding: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: '#737972', lineHeight: 20 }}>
                By creating an account you agree to our{' '}
                <Text style={{ color: '#735c00', fontWeight: '600' }} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
                {' and '}
                <Text style={{ color: '#735c00', fontWeight: '600' }} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>.
              </Text>
            </View>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity
          style={[s.button, (loading || (step === 3 && !allChecked)) && { opacity: 0.5 }]}
          onPress={step < 3 ? handleNext : handleSignup}
          disabled={loading || (step === 3 && !allChecked)}
        >
          <Text style={s.buttonText}>
            {loading ? 'Creating account...' : step < 3 ? 'NEXT STEP' : 'CREATE ACCOUNT'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3fbf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  back: { color: '#735c00', fontSize: 14, fontWeight: '600' },
  logo: { fontSize: 18, fontWeight: '700', fontStyle: 'italic', color: '#051b0e' },
  stepText: { fontSize: 11, color: '#735c00', fontWeight: '700', letterSpacing: 1 },
  progressBg: {
    height: 3, backgroundColor: '#e8f0e9',
    marginHorizontal: 24, borderRadius: 2, marginBottom: 32,
  },
  progressFill: { height: 3, backgroundColor: '#735c00', borderRadius: 2 },
  form: { paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', fontStyle: 'italic', color: '#051b0e', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#737972', marginBottom: 32 },
  row: { flexDirection: 'row', gap: 12 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#434843',
    letterSpacing: 1.5, marginBottom: 8, marginTop: 20,
  },
  input: {
    backgroundColor: '#eef6ef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#161d19',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: '#c3c8c1', borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  chipOn: { borderColor: '#735c00', backgroundColor: '#fed65b' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#434843' },
  chipTextOn: { color: '#051b0e' },
  button: {
    backgroundColor: '#051b0e',
    marginHorizontal: 24, marginTop: 32,
    borderRadius: 100, paddingVertical: 18, alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, marginTop: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#c3c8c1', alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#735c00', borderColor: '#735c00' },
  checkmark: { color: 'white', fontSize: 13, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 14, color: '#434843', lineHeight: 20 },
});
