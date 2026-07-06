import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { trackSignUp } from '@/lib/analytics';

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

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 3
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [agreed4, setAgreed4] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ageError, setAgeError] = useState('');

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
      if (!agreedToTerms) {
        Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum)) {
        Alert.alert('Missing info', 'Please enter your age.');
        return;
      }
      if (isTeen && ageNum < 13) {
        Alert.alert('Error', 'You must be at least 13 years old to use Teen Hive.');
        return;
      }
      if (!isTeen && ageNum < 18) {
        Alert.alert('Error', 'Parents must be 18 or older.');
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: 'teenhive://verify-email',
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            role: role ?? 'teen',
          },
        },
      });

      if (authError) {
        const isNetwork = authError.message.toLowerCase().includes('fetch') || authError.message.toLowerCase().includes('network');
        Alert.alert('Signup failed', isNetwork ? 'Network error — your Supabase project may be paused. Visit the Supabase dashboard to resume it, then try again.' : authError.message);
        return;
      }
      if (!data.user) { Alert.alert('Signup failed', 'Could not create account.'); return; }

      trackSignUp(data.user.id, (role ?? 'teen') as 'teen' | 'parent');

      // Use SECURITY DEFINER RPC so profile data saves even before email is confirmed
      await supabase.rpc('init_profile', {
        user_id: data.user.id,
        age_val: parseInt(age, 10) || null,
        bio_val: bio.trim() || null,
        neighborhood_val: neighborhood.trim() || null,
        hourly_rate_val: isTeen && hourlyRate ? parseFloat(hourlyRate) : null,
        skills_val: isTeen ? skills : [],
        availability_val: isTeen ? avail : [],
      });

      // Always show how-it-works first; it then routes to verify-email or tabs
      router.replace({
        pathname: '/how-it-works',
        params: { role: role ?? 'teen', email: !data.session ? email.trim() : '' },
      } as any);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
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
            <View style={s.passwordWrap}>
              <TextInput
                style={[s.input, { flex: 1, backgroundColor: 'transparent' }]}
                value={password}
                onChangeText={(t) => setPassword(t)}
                placeholder="At least 8 characters"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                returnKeyType="next"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#737972" />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>CONFIRM PASSWORD</Text>
            <View style={s.passwordWrap}>
              <TextInput
                style={[s.input, { flex: 1, backgroundColor: 'transparent' }]}
                value={confirmPassword}
                onChangeText={(t) => setConfirmPassword(t)}
                placeholder="Repeat password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                returnKeyType="done"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#737972" />
              </TouchableOpacity>
            </View>

            {/* TOS agreement — required to proceed */}
            <TouchableOpacity style={[s.checkRow, { marginTop: 24 }]} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[s.checkbox, agreedToTerms && s.checkboxChecked]}>
                {agreedToTerms && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.checkText}>
                I agree to the{' '}
                <Text style={{ fontFamily: ds.f.sansSemiBold, color: '#735c00' }} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
                {' and '}
                <Text style={{ fontFamily: ds.f.sansSemiBold, color: '#735c00' }} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
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
              onChangeText={(t) => {
                const v = t.replace(/\D/g, '');
                setAge(v);
                if (!v) { setAgeError(''); return; }
                const n = parseInt(v, 10);
                if (isTeen && n < 13) setAgeError('You must be at least 13 to use Teen Hive');
                else if (!isTeen && n < 18) setAgeError('Parents must be 18 or older');
                else setAgeError('');
              }}
              placeholder={isTeen ? 'e.g. 16' : 'e.g. 35'}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={3}
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
              returnKeyType="next"
            />
            {ageError ? <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: '#ef4444', marginTop: 6 }}>{ageError}</Text> : null}

            <Text style={s.label}>NEIGHBORHOOD <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>(optional)</Text></Text>
            <TextInput
              style={s.input}
              value={neighborhood}
              onChangeText={(t) => setNeighborhood(t)}
              placeholder="e.g. Maplewood, NJ"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoComplete="off"
              textContentType="addressCityAndState"
              importantForAutofill="no"
              returnKeyType="next"
            />
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: '#737972', marginTop: 6 }}>Helps us show you nearby jobs — you can add this later from Edit Profile</Text>

            <Text style={s.label}>{isTeen ? 'ABOUT YOU' : 'ABOUT YOUR FAMILY'} <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af' }}>(optional)</Text></Text>
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
                <Text style={s.label}>HOURLY RATE <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af' }}>(optional)</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6ef', borderRadius: 12 }}>
                  <Text style={{ paddingLeft: 16, fontSize: 16, color: '#051b0e', fontFamily: ds.f.serifBold }}>$</Text>
                  <TextInput
                    style={[s.input, { flex: 1, backgroundColor: 'transparent' }]}
                    value={hourlyRate}
                    onChangeText={(t) => setHourlyRate(t.replace(/[^0-9.]/g, ''))}
                    placeholder="15"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    returnKeyType="done"
                  />
                  <Text style={{ paddingRight: 16, fontSize: 13, color: '#737972', fontFamily: ds.f.sans }}>/hr</Text>
                </View>

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
                <Text style={s.label}>NUMBER OF KIDS <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af' }}>(optional)</Text></Text>
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

                <Text style={s.label}>KIDS' AGE GROUPS <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af' }}>(optional)</Text></Text>
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

                <Text style={s.label}>HOME TYPE <Text style={{ fontFamily: ds.f.sans, color: '#9ca3af' }}>(optional)</Text></Text>
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
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: '#737972', lineHeight: 20 }}>
                By creating an account you agree to our{' '}
                <Text style={{ fontFamily: ds.f.sansSemiBold, color: '#735c00' }} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
                {' and '}
                <Text style={{ fontFamily: ds.f.sansSemiBold, color: '#735c00' }} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>.
              </Text>
            </View>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity
          style={[s.button, (loading || (step === 3 && !allChecked) || (step === 1 && !agreedToTerms)) && { opacity: 0.5 }]}
          onPress={step < 3 ? handleNext : handleSignup}
          disabled={loading || (step === 3 && !allChecked) || (step === 1 && !agreedToTerms)}
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
  back: { fontFamily: ds.f.sansSemiBold, color: '#735c00', fontSize: 14 },
  logo: { fontFamily: ds.f.serifBold, fontSize: 20, color: '#051b0e' },
  stepText: { fontFamily: ds.f.sansSemiBold, fontSize: 11, color: '#735c00', letterSpacing: 2, textTransform: 'uppercase' },
  progressBg: {
    height: 3, backgroundColor: '#e8f0e9',
    marginHorizontal: 24, borderRadius: 2, marginBottom: 32,
  },
  progressFill: { height: 3, backgroundColor: '#735c00', borderRadius: 2 },
  form: { paddingHorizontal: 24 },
  title: { fontFamily: ds.f.serifBold, fontSize: 38, color: '#051b0e', marginBottom: 8, lineHeight: 44, letterSpacing: -0.5 },
  subtitle: { fontFamily: ds.f.sansMedium, fontSize: 15, color: '#737972', marginBottom: 32, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12 },
  label: {
    fontFamily: ds.f.sansSemiBold, fontSize: 11, color: '#434843',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 20,
  },
  input: {
    fontFamily: ds.f.sansMedium,
    backgroundColor: '#eef6ef',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
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
    paddingHorizontal: 16, paddingVertical: 9,
    backgroundColor: '#ffffff',
  },
  chipOn: { borderColor: '#735c00', backgroundColor: '#fed65b' },
  chipText: { fontFamily: ds.f.sansMedium, fontSize: 13, color: '#434843' },
  chipTextOn: { fontFamily: ds.f.sansBold, color: '#051b0e' },
  button: {
    backgroundColor: '#051b0e',
    marginHorizontal: 24, marginTop: 32,
    borderRadius: 9999, paddingVertical: 18, alignItems: 'center',
  },
  buttonText: { fontFamily: ds.f.sansBold, color: '#ffffff', fontSize: 15, letterSpacing: 1.5 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, marginTop: 4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: '#c3c8c1', alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#735c00', borderColor: '#735c00' },
  checkmark: { fontFamily: ds.f.sansBold, color: 'white', fontSize: 13 },
  checkText: { fontFamily: ds.f.sansMedium, flex: 1, fontSize: 14, color: '#434843', lineHeight: 21 },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef6ef',
    borderRadius: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
});
