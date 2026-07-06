import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsField, dsLabel } from '@/lib/design';
import { rateLimit } from '@/lib/rateLimiter';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands', 'Car Washing'];

const AVAILABILITY_OPTIONS = [
  'Weekday mornings',
  'After school (M–F)',
  'Weekday evenings',
  'Saturday',
  'Sunday',
  'School breaks',
];

const TRAVEL_OPTIONS = ['0.5 mi', '1 mi', '2 mi', '5 mi+'];

export default function PostService() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [travelDistance, setTravelDistance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleAvailability(slot: string) {
    setSelectedAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  function toggleCategory(c: string) {
    setCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  const submit = async () => {
    if (!title.trim() || categories.length === 0) {
      Alert.alert('Required fields', 'Fill in a title and select at least one category.');
      return;
    }
    if (!user) return;

    try {
      rateLimit(user.id, 'postTeenService');
    } catch (e: any) {
      Alert.alert('Slow down', e.message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('teen_services').insert({
      teen_id: user.id,
      title: title.trim(),
      category: categories.join(', '),
      description: description.trim() || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      availability: selectedAvailability.length > 0 ? selectedAvailability : null,
      travel_distance: travelDistance || null,
      is_active: true,
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Posted!', `"${title}" is now visible to parents in your area.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ds.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header nav */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 32, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Headline */}
        <View style={{ paddingHorizontal: 24, marginBottom: 36 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 42, color: ds.c.primary, lineHeight: 48, letterSpacing: -0.5, marginBottom: 10 }}>
            Offer Your{'\n'}Services.
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22 }}>
            Let parents in your neighborhood find you.
          </Text>
        </View>

        {/* Form card */}
        <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 32, padding: 28 }}>

          {/* Title */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Service Title</Text>
          <View style={{ ...dsField, marginBottom: 24 }}>
            <Ionicons name="create-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              placeholder="e.g. Weekend Dog Walker, Math Tutor"
              placeholderTextColor={ds.c.outlineVariant}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          {/* Category — multi-select */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 4 }}>Categories</Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Select all that apply</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map((c) => {
              const selected = categories.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999,
                    backgroundColor: selected ? ds.c.primary : ds.c.surfaceContainerHigh,
                    borderWidth: selected ? 0 : 1,
                    borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => toggleCategory(c)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: selected ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant }}>Description</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant }}>{description.length}/300</Text>
          </View>
          <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <TextInput
              style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 90, textAlignVertical: 'top' }}
              placeholder="Describe your experience, references, what you offer..."
              placeholderTextColor={ds.c.outlineVariant}
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 300))}
              multiline
            />
          </View>

          {/* Hourly Rate */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Hourly Rate</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 24, color: ds.c.primary }}>$</Text>
            <View style={{ ...dsField, width: 90 }}>
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, textAlign: 'center' }}
                placeholder="15"
                placeholderTextColor={ds.c.outlineVariant}
                value={hourlyRate}
                onChangeText={(t) => setHourlyRate(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>/hr</Text>
          </View>

          {/* Availability */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Availability</Text>
          <View style={{ gap: 8, marginBottom: 24 }}>
            {AVAILABILITY_OPTIONS.map((slot) => {
              const checked = selectedAvailability.includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: checked ? ds.c.secondaryContainer : ds.c.surfaceContainerHigh,
                    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: checked ? 0 : 1, borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => toggleAvailability(slot)}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                    borderColor: checked ? ds.c.primary : ds.c.outlineVariant,
                    backgroundColor: checked ? ds.c.primary : 'transparent',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    {checked && <Text style={{ fontFamily: ds.f.sansBold, color: ds.c.white, fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: checked ? ds.c.primary : ds.c.onSurface }}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Travel Distance */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>How far will you travel?</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
            {TRAVEL_OPTIONS.map((dist) => (
              <TouchableOpacity
                key={dist}
                style={{
                  flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9999,
                  backgroundColor: travelDistance === dist ? ds.c.primary : ds.c.surfaceContainerHigh,
                  borderWidth: travelDistance === dist ? 0 : 1, borderColor: ds.c.outlineVariant,
                }}
                onPress={() => setTravelDistance(dist)}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: travelDistance === dist ? ds.c.white : ds.c.onSurfaceVariant }}>
                  {dist}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <GradientButton label="Post Service" onPress={submit} loading={submitting} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
