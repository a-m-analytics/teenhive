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

const HOME_TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Other'];
const KIDS_AGES = ['Under 2', '2–5', '6–9', '10–12', '13+'];

export default function ParentSetup() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [numKids, setNumKids] = useState('');
  const [kidsAges, setKidsAges] = useState<string[]>([]);
  const [hasPets, setHasPets] = useState<boolean | null>(null);
  const [petsDescription, setPetsDescription] = useState('');
  const [homeType, setHomeType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setNeighborhood(profile.neighborhood ?? '');
    setBio(profile.bio ?? '');
    // Load extra fields from DB
    const loadExtra = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('num_kids, kids_ages, has_pets, pets_description, home_type')
        .eq('id', profile.id)
        .single();
      if (data) {
        setNumKids(data.num_kids != null ? String(data.num_kids) : '');
        setKidsAges(data.kids_ages ?? []);
        setHasPets(data.has_pets ?? null);
        setPetsDescription(data.pets_description ?? '');
        setHomeType(data.home_type ?? '');
      }
    };
    loadExtra();
  }, [profile?.id]);

  const toggleKidsAge = (age: string) => {
    setKidsAges((prev) => prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      neighborhood: neighborhood.trim() || null,
      bio: bio.trim() || null,
      num_kids: numKids ? parseInt(numKids, 10) : null,
      kids_ages: kidsAges.length > 0 ? kidsAges : null,
      has_pets: hasPets,
      pets_description: petsDescription.trim() || null,
      home_type: homeType || null,
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
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Neighborhood / Area</Text>
          <View style={{ ...dsField, marginBottom: 4 }}>
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
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, marginBottom: 20 }}>
            Used to show teens nearby jobs
          </Text>

          {/* Bio */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
            About Your Family <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <TextInput
              style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 100, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 300))}
              placeholder="Tell teens about your household, routine, what you're looking for..."
              placeholderTextColor={ds.c.outlineVariant}
              multiline
            />
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, textAlign: 'right', marginTop: 4 }}>{bio.length}/300</Text>
          </View>

          {/* Home Type */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>
            Home Type <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {HOME_TYPES.map((ht) => {
              const on = homeType === ht;
              return (
                <TouchableOpacity
                  key={ht}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999,
                    backgroundColor: on ? ds.c.primary : ds.c.surfaceContainerLow,
                    borderWidth: on ? 0 : 1, borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => setHomeType(on ? '' : ht)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: on ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {ht}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Number of kids */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
            Number of Kids <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ ...dsField, marginBottom: 20 }}>
            <Ionicons name="happy-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              value={numKids}
              onChangeText={(t) => setNumKids(t.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 2"
              placeholderTextColor={ds.c.outlineVariant}
              keyboardType="number-pad"
            />
          </View>

          {/* Kids' Ages */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>
            Kids' Age Groups <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(select all that apply)</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {KIDS_AGES.map((age) => {
              const on = kidsAges.includes(age);
              return (
                <TouchableOpacity
                  key={age}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999,
                    backgroundColor: on ? ds.c.primaryContainer : ds.c.surfaceContainerLow,
                    borderWidth: on ? 0 : 1, borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => toggleKidsAge(age)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: on ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {age}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pets */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>
            Pets at Home <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: ds.c.outlineVariant }}>(optional)</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: hasPets ? 12 : 24 }}>
            {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(({ label, val }) => {
              const on = hasPets === val;
              return (
                <TouchableOpacity
                  key={label}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center',
                    backgroundColor: on ? ds.c.primary : ds.c.surfaceContainerLow,
                    borderWidth: on ? 0 : 1, borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => setHasPets(on ? null : val)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: on ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {hasPets && (
            <View style={{ ...dsField, marginBottom: 24 }}>
              <Ionicons name="paw-outline" size={18} color={ds.c.onSurfaceVariant} />
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
                value={petsDescription}
                onChangeText={setPetsDescription}
                placeholder="e.g. 1 dog, 2 cats (friendly)"
                placeholderTextColor={ds.c.outlineVariant}
              />
            </View>
          )}

          <GradientButton label="Save Changes" onPress={handleSave} loading={saving} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
