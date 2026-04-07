import PressableScale from '@/components/PressableScale';
import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, type as T } from '@/lib/design';
import { rateLimit } from '@/lib/rateLimiter';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [category, setCategory] = useState('');
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

  const submit = async () => {
    if (!title.trim() || !category) {
      Alert.alert('Required fields', 'Fill in a title and select a category.');
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
      category,
      description: description.trim() || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      availability: selectedAvailability.length > 0 ? selectedAvailability : null,
      travel_distance: travelDistance || null,
      is_active: true,
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Posted', `"${title}" is now visible to parents in your area.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: 'Inter_400Regular' as const,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ ...T.bodyMedium, color: colors.accent }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.ink, letterSpacing: -0.5, lineHeight: 32, marginBottom: 6 }}>
        Offer Your Services
      </Text>
      <Text style={{ ...T.body, color: colors.muted, marginBottom: 28 }}>
        Let parents in your neighborhood find you.
      </Text>

      {/* Service Title */}
      <Text style={{ ...T.label, color: colors.ink, marginBottom: 8 }}>Service Title</Text>
      <TextInput
        style={inputStyle}
        placeholder="e.g. Weekend Dog Walker, Math Tutor"
        placeholderTextColor={colors.placeholder}
        value={title}
        onChangeText={setTitle}
      />

      {/* Category */}
      <Text style={{ ...T.label, color: colors.ink, marginTop: spacing.lg, marginBottom: 10 }}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={{
              borderWidth: 1,
              borderColor: category === c ? colors.accent : colors.borderStrong,
              borderRadius: radius.sm,
              paddingHorizontal: 14,
              paddingVertical: 9,
              backgroundColor: category === c ? colors.accent : colors.white,
            }}
            onPress={() => setCategory(c)}
          >
            <Text style={{ ...T.label, color: category === c ? colors.white : colors.body }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.lg, marginBottom: 8 }}>
        <Text style={{ ...T.label, color: colors.ink }}>Description</Text>
        <Text style={{ ...T.caption, color: colors.placeholder }}>{description.length}/300</Text>
      </View>
      <TextInput
        style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Describe your experience, references, what you offer..."
        placeholderTextColor={colors.placeholder}
        value={description}
        onChangeText={(t) => setDescription(t.slice(0, 300))}
        multiline
      />

      {/* Hourly Rate */}
      <Text style={{ ...T.label, color: colors.ink, marginTop: spacing.lg, marginBottom: 10 }}>Hourly Rate</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, color: colors.ink }}>$</Text>
        <TextInput
          style={[inputStyle, { width: 90, textAlign: 'center', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20 }]}
          placeholder="15"
          placeholderTextColor={colors.placeholder}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="decimal-pad"
        />
        <Text style={{ ...T.body, color: colors.muted }}>/hr</Text>
      </View>

      {/* Availability */}
      <Text style={{ ...T.label, color: colors.ink, marginTop: spacing.lg, marginBottom: 12 }}>Availability</Text>
      <View style={{ gap: 8 }}>
        {AVAILABILITY_OPTIONS.map((slot) => {
          const checked = selectedAvailability.includes(slot);
          return (
            <TouchableOpacity
              key={slot}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                borderWidth: 1,
                borderColor: checked ? colors.accent : colors.borderStrong,
                borderRadius: radius.md,
                padding: spacing.md,
                backgroundColor: checked ? colors.accentLight : colors.white,
              }}
              onPress={() => toggleAvailability(slot)}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 4,
                borderWidth: 1.5,
                borderColor: checked ? colors.accent : colors.borderStrong,
                backgroundColor: checked ? colors.accent : colors.white,
                justifyContent: 'center', alignItems: 'center',
              }}>
                {checked && <Text style={{ color: colors.white, fontSize: 13, lineHeight: 16 }}>✓</Text>}
              </View>
              <Text style={{ ...T.bodyMedium, color: checked ? colors.ink : colors.body }}>{slot}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Travel Distance */}
      <Text style={{ ...T.label, color: colors.ink, marginTop: spacing.lg, marginBottom: 10 }}>Travel Distance</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TRAVEL_OPTIONS.map((dist) => (
          <TouchableOpacity
            key={dist}
            style={{
              flex: 1, borderWidth: 1,
              borderColor: travelDistance === dist ? colors.accent : colors.borderStrong,
              borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center',
              backgroundColor: travelDistance === dist ? colors.accent : colors.white,
            }}
            onPress={() => setTravelDistance(dist)}
          >
            <Text style={{ ...T.label, color: travelDistance === dist ? colors.white : colors.body }}>{dist}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit */}
      <PressableScale
        style={[
          { backgroundColor: colors.accent, borderRadius: radius.md, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 36 },
          submitting && { opacity: 0.7 },
        ]}
        onPress={submit}
      >
        {submitting
          ? <ActivityIndicator color={colors.white} />
          : <Text style={{ ...T.bodySemiBold, color: colors.white, fontSize: 16 }}>Post Service</Text>
        }
      </PressableScale>
    </ScrollView>
  );
}
