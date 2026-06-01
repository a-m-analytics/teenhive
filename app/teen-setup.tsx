import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsField, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const ALL_SKILLS = [
  'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care',
  'Tech Help', 'Cleaning', 'Errands', 'Car Washing',
  'Photography', 'Cooking',
];

export default function TeenSetup() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate ? String(profile.hourly_rate) : '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setNeighborhood(profile.neighborhood ?? '');
      setBio(profile.bio ?? '');
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
      setSkills(profile.skills ?? []);
    }
  }, [profile?.id]);

  const toggleSkill = (sk: string) => {
    setSkills((prev) => prev.includes(sk) ? prev.filter((s) => s !== sk) : [...prev, sk]);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      neighborhood: neighborhood.trim() || null,
      bio: bio.trim() || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      skills,
    }).eq('id', user.id);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Saved!', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ds.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 32, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={22} color={ds.c.secondary} />
          </TouchableOpacity>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, letterSpacing: -0.3, flex: 1, textAlign: 'center' }}>
            Edit Profile
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={{ paddingHorizontal: 24 }}>

          {/* Full Name */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Full Name</Text>
          <View style={{ ...dsField, marginBottom: 20 }}>
            <Ionicons name="person-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={ds.c.outlineVariant}
              autoCapitalize="words"
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
            />
          </View>

          {/* Neighborhood */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Neighborhood</Text>
          <View style={{ ...dsField, marginBottom: 20 }}>
            <Ionicons name="location-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="e.g. Maplewood, NJ"
              placeholderTextColor={ds.c.outlineVariant}
              autoCapitalize="words"
              autoComplete="off"
              textContentType="oneTimeCode"
              importantForAutofill="no"
            />
          </View>

          {/* Bio */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
            Bio <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <TextInput
              style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 100, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 300))}
              placeholder="Tell parents a bit about yourself..."
              placeholderTextColor={ds.c.outlineVariant}
              multiline
            />
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, textAlign: 'right', marginTop: 4 }}>{bio.length}/300</Text>
          </View>

          {/* Hourly Rate */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
            Hourly Rate <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ ...dsField, marginBottom: 24 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary }}>$</Text>
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary }}
              value={hourlyRate}
              onChangeText={(t) => setHourlyRate(t.replace(/[^0-9.]/g, ''))}
              placeholder="15"
              placeholderTextColor={ds.c.outlineVariant}
              keyboardType="decimal-pad"
            />
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>/hr</Text>
          </View>

          {/* Skills */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
            {ALL_SKILLS.map((sk) => {
              const on = skills.includes(sk);
              return (
                <TouchableOpacity
                  key={sk}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999,
                    backgroundColor: on ? ds.c.primary : ds.c.surfaceContainerLow,
                    borderWidth: on ? 0 : 1,
                    borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => toggleSkill(sk)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: on ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {sk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <GradientButton label="Save Changes" onPress={handleSave} loading={saving} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
