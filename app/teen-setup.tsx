import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const ALL_SKILLS = [
  'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care',
  'Tech Help', 'Cleaning', 'Errands', 'Car Washing',
  'Photography', 'Cooking',
];

const AVAIL_OPTIONS = [
  { key: 'weekday_after', label: 'Weekdays after school' },
  { key: 'weekday_eve',   label: 'Weekday evenings' },
  { key: 'sat_morning',   label: 'Saturday mornings' },
  { key: 'sat_afternoon', label: 'Saturday afternoons' },
  { key: 'sun_morning',   label: 'Sunday mornings' },
  { key: 'sun_afternoon', label: 'Sunday afternoons' },
  { key: 'school_hols',   label: 'School holidays' },
  { key: 'flexible',      label: 'Flexible / contact me' },
];

const DISTANCES = ['0.5mi', '1mi', '2mi', '5mi+'];

export default function TeenSetup() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [neighborhood, setNeighborhood] = useState('');
  const [bio, setBio]                   = useState(profile?.bio ?? '');

  // Step 2
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile?.skills ?? []);
  const [skillRates, setSkillRates]         = useState<Record<string, string>>({});

  // Step 3
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [distance, setDistance]         = useState('1mi');
  const [minRate, setMinRate]           = useState('');
  const [saving, setSaving]             = useState(false);

  const toggleSkill = (sk: string) => {
    setSelectedSkills(prev =>
      prev.includes(sk) ? prev.filter(x => x !== sk) : [...prev, sk]
    );
  };

  const toggleAvail = (key: string) => {
    setAvailability(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!neighborhood.trim()) {
        Alert.alert('Missing info', 'Please enter your neighborhood.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedSkills.length === 0) {
        Alert.alert('Missing info', 'Please select at least one skill.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const availLabels = AVAIL_OPTIONS
      .filter(o => availability[o.key])
      .map(o => o.label);

    const { error } = await supabase.from('profiles').update({
      neighborhood: neighborhood.trim(),
      bio: bio.trim() || null,
      skills: selectedSkills,
      availability: availLabels,
      hourly_rate: minRate ? parseFloat(minRate) : null,
    }).eq('id', user.id);

    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.replace('/(tabs)' as any);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

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
          {step > 1
            ? <TouchableOpacity onPress={() => setStep(step - 1)}><Text style={s.back}>← Back</Text></TouchableOpacity>
            : <View style={{ width: 48 }} />
          }
          <View style={s.dots}>
            {[1, 2, 3].map(n => (
              <View key={n} style={[s.dot, step >= n && s.dotDone, step === n && s.dotActive]} />
            ))}
          </View>
          <Text style={s.stepText}>{step} of 3</Text>
        </View>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={s.form}>
            <Text style={s.title}>Set up your profile.</Text>
            <Text style={s.subtitle}>Help parents know who you are.</Text>

            {/* Avatar */}
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <Text style={s.avatarLabel}>Add a photo</Text>
            </View>

            {/* Read-only name */}
            <Text style={s.label}>FULL NAME</Text>
            <View style={s.readonlyBox}>
              <Text style={s.readonlyText}>{profile?.full_name ?? '—'}</Text>
            </View>

            {/* Read-only age */}
            <Text style={s.label}>AGE</Text>
            <View style={s.readonlyBox}>
              <Text style={s.readonlyText}>{profile?.age ?? '—'}</Text>
            </View>

            <Text style={s.label}>WHERE ARE YOU BASED?</Text>
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

            <Text style={s.label}>ABOUT YOU <Text style={s.optional}>(optional)</Text></Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 300))}
              placeholder="Tell parents a bit about yourself..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={s.form}>
            <Text style={s.title}>What can you do?</Text>
            <Text style={s.subtitle}>Tap a skill to select it, then enter your rate.</Text>

            <View style={{ gap: 10, marginTop: 8 }}>
              {ALL_SKILLS.map(sk => {
                const on = selectedSkills.includes(sk);
                return (
                  <View key={sk} style={[s.skillCard, on && s.skillCardOn]}>
                    <TouchableOpacity onPress={() => toggleSkill(sk)} activeOpacity={0.7}>
                      <Text style={[s.skillName, on && s.skillNameOn]}>{sk}</Text>
                    </TouchableOpacity>
                    {on && (
                      <View style={s.rateRow}>
                        <Text style={s.ratePre}>$</Text>
                        <TextInput
                          style={s.rateInput}
                          value={skillRates[sk] ?? ''}
                          onChangeText={(t) => setSkillRates(prev => ({ ...prev, [sk]: t.replace(/[^0-9.]/g, '') }))}
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                          keyboardType="decimal-pad"
                          autoComplete="off"
                          textContentType="none"
                          importantForAutofill="no"
                        />
                        <Text style={s.ratePost}>/hr</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <View style={s.form}>
            <Text style={s.title}>When are you free?</Text>
            <Text style={s.subtitle}>Parents use this to find you.</Text>

            <View style={s.toggleCard}>
              {AVAIL_OPTIONS.map((opt, i) => (
                <View key={opt.key} style={[s.toggleRow, i < AVAIL_OPTIONS.length - 1 && s.toggleBorder]}>
                  <Text style={s.toggleLabel}>{opt.label}</Text>
                  <Switch
                    value={!!availability[opt.key]}
                    onValueChange={() => toggleAvail(opt.key)}
                    trackColor={{ true: '#735c00', false: '#e2eae3' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>

            <Text style={s.label}>HOW FAR WILL YOU TRAVEL?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DISTANCES.map(d => {
                const on = distance === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.distBox, on && s.distBoxOn]}
                    onPress={() => setDistance(d)}
                  >
                    <Text style={[s.distText, on && s.distTextOn]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>MINIMUM HOURLY RATE <Text style={s.optional}>(optional)</Text></Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#051b0e' }}>$</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={minRate}
                onChangeText={(t) => setMinRate(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
              />
              <Text style={{ fontSize: 14, color: '#737972' }}>/hr</Text>
            </View>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity
          style={[s.button, saving && { opacity: 0.6 }]}
          onPress={step < 3 ? handleNext : handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.buttonText}>{step < 3 ? 'CONTINUE' : 'COMPLETE PROFILE'}</Text>
          }
        </TouchableOpacity>

        {step === 3 && (
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => router.replace('/(tabs)' as any)}>
            <Text style={{ fontSize: 14, color: '#737972' }}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3fbf4' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  back: { color: '#735c00', fontSize: 14, fontWeight: '600', width: 48 },
  stepText: { fontSize: 13, color: '#9ca3af', width: 48, textAlign: 'right' },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2eae3' },
  dotDone: { backgroundColor: '#c3c8c1' },
  dotActive: { backgroundColor: '#735c00', width: 20 },
  form: { paddingHorizontal: 24 },
  title: { fontSize: 30, fontWeight: '700', fontStyle: 'italic', color: '#051b0e', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#737972', marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#434843', letterSpacing: 1.5, marginBottom: 8, marginTop: 20 },
  optional: { fontWeight: '400', color: '#9ca3af' },
  input: {
    backgroundColor: '#eef6ef', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: '#161d19',
  },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 16 },
  readonlyBox: {
    backgroundColor: '#f3fbf4', borderRadius: 12, borderWidth: 1,
    borderColor: '#e2eae3', padding: 16,
  },
  readonlyText: { fontSize: 16, color: '#9ca3af' },
  avatarWrap: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1a3021', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  avatarLabel: { fontSize: 14, color: '#735c00', fontWeight: '600' },
  skillCard: {
    borderWidth: 1.5, borderColor: '#c3c8c1', borderRadius: 12,
    padding: 14, backgroundColor: '#fff',
  },
  skillCardOn: { borderColor: '#735c00', backgroundColor: '#fffbeb' },
  skillName: { fontSize: 15, fontWeight: '700', color: '#161d19' },
  skillNameOn: { color: '#735c00' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  ratePre: { fontSize: 16, fontWeight: '700', color: '#434843' },
  rateInput: {
    backgroundColor: '#eef6ef', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 16, color: '#161d19', width: 80,
  },
  ratePost: { fontSize: 14, color: '#737972' },
  toggleCard: { borderWidth: 1, borderColor: '#e2eae3', borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  toggleBorder: { borderBottomWidth: 1, borderBottomColor: '#e2eae3' },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#161d19' },
  distBox: {
    flex: 1, borderWidth: 1.5, borderColor: '#c3c8c1',
    borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff',
  },
  distBoxOn: { borderColor: '#735c00', backgroundColor: '#fed65b' },
  distText: { fontSize: 14, fontWeight: '600', color: '#737972' },
  distTextOn: { color: '#051b0e' },
  button: {
    backgroundColor: '#051b0e', marginHorizontal: 24, marginTop: 32,
    borderRadius: 100, paddingVertical: 18, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
