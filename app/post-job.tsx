import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsField, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const CATEGORIES = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly'];

export default function PostJob() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'hr' | 'flat'>('hr');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState('');
  const [location, setLocation] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState('Weekly');
  const [numKids, setNumKids] = useState('');
  const [teensNeeded, setTeensNeeded] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !category || !payAmount) {
      Alert.alert('Required fields', 'Fill in title, category, and pay rate.');
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('jobs').insert({
        parent_id: user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        pay_rate: parseFloat(payAmount),
        pay_type: payType === 'hr' ? 'hourly' : 'flat',
        location_area: location.trim() || null,
        date: date + (startTime ? ` ${startTime}` : '') || null,
        estimated_hours: hours ? parseFloat(hours) : null,
        is_recurring: recurring,
        frequency: recurring ? frequency : null,
        kids_count: category === 'Babysitting' && numKids ? parseInt(numKids, 10) : null,
        teens_needed: teensNeeded,
        status: 'open',
        created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      Alert.alert('Posted!', 'Your job is now live.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ds.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header nav */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Headline */}
        <View style={{ paddingHorizontal: 24, marginBottom: 36 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 42, color: ds.c.primary, lineHeight: 48, letterSpacing: -0.5, marginBottom: 10 }}>
            Post a Job.
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22 }}>
            Describe it and teens in your area will apply.
          </Text>
        </View>

        {/* Form card */}
        <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 32, padding: 28 }}>

          {/* Job Title */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Job Title</Text>
          <View style={{ ...dsField, marginBottom: 24 }}>
            <Ionicons name="create-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              placeholder="e.g. Lawn Mowing"
              placeholderTextColor={ds.c.outlineVariant}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
                  backgroundColor: category === c ? ds.c.primary : ds.c.surfaceContainerHigh,
                  borderWidth: category === c ? 0 : 1,
                  borderColor: ds.c.outlineVariant,
                }}
                onPress={() => setCategory(c)}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: category === c ? ds.c.white : ds.c.onSurfaceVariant }}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant }}>Description</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant }}>{description.length}/300</Text>
          </View>
          <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <TextInput
              style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 90, textAlignVertical: 'top' }}
              placeholder="Describe the job, requirements, what to bring..."
              placeholderTextColor={ds.c.outlineVariant}
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 300))}
              multiline
            />
          </View>

          {/* Pay Rate */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Pay Rate</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 24, color: ds.c.primary }}>$</Text>
            <View style={{ ...dsField, width: 90 }}>
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, textAlign: 'center' }}
                placeholder="15"
                placeholderTextColor={ds.c.outlineVariant}
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="number-pad"
              />
            </View>
            {(['hr', 'flat'] as const).map((pt) => (
              <TouchableOpacity
                key={pt}
                style={{
                  paddingHorizontal: 16, paddingVertical: 12, borderRadius: 9999,
                  backgroundColor: payType === pt ? ds.c.primary : ds.c.surfaceContainerHigh,
                  borderWidth: payType === pt ? 0 : 1,
                  borderColor: ds.c.outlineVariant,
                }}
                onPress={() => setPayType(pt)}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: payType === pt ? ds.c.white : ds.c.onSurfaceVariant }}>
                  {pt === 'hr' ? '/hr' : 'Flat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date + Time */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Date</Text>
              <View style={{ ...dsField }}>
                <Ionicons name="calendar-outline" size={16} color={ds.c.onSurfaceVariant} />
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
                  placeholder="Apr 12"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Start Time</Text>
              <View style={{ ...dsField }}>
                <Ionicons name="time-outline" size={16} color={ds.c.onSurfaceVariant} />
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
                  placeholder="3:00pm"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
            </View>
          </View>

          {/* Hours */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Estimated Hours</Text>
          <View style={{ ...dsField, marginBottom: 24 }}>
            <Ionicons name="hourglass-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              placeholder="e.g. 2"
              placeholderTextColor={ds.c.outlineVariant}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
            />
          </View>

          {/* Location */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Location</Text>
          <View style={{ ...dsField, marginBottom: 24 }}>
            <Ionicons name="location-outline" size={18} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
              placeholder="Neighborhood only (e.g. Oak Street area)"
              placeholderTextColor={ds.c.outlineVariant}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Recurring toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: recurring ? 16 : 24, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 16, padding: 16 }}>
            <View>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>Recurring job</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, marginTop: 2 }}>Repeat on a schedule</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ true: ds.c.secondary, false: ds.c.outlineVariant }}
              thumbColor={ds.c.white}
            />
          </View>
          {recurring && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 9999, alignItems: 'center',
                    backgroundColor: frequency === f ? ds.c.primary : ds.c.surfaceContainerHigh,
                    borderWidth: frequency === f ? 0 : 1,
                    borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: frequency === f ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Babysitting: kids */}
          {category === 'Babysitting' && (
            <>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Number of Kids</Text>
              <View style={{ ...dsField, marginBottom: 24 }}>
                <Ionicons name="happy-outline" size={18} color={ds.c.onSurfaceVariant} />
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
                  placeholder="e.g. 2"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={numKids}
                  onChangeText={setNumKids}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}

          {/* Teens needed stepper */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 16 }}>Teens Needed</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: ds.c.outlineVariant }}
              onPress={() => setTeensNeeded(Math.max(1, teensNeeded - 1))}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 20, color: ds.c.onSurface }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, minWidth: 40, textAlign: 'center' }}>
              {teensNeeded === 3 ? '3+' : teensNeeded}
            </Text>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: ds.c.outlineVariant }}
              onPress={() => setTeensNeeded(Math.min(3, teensNeeded + 1))}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 20, color: ds.c.onSurface }}>+</Text>
            </TouchableOpacity>
          </View>

          <GradientButton label="Post Job" onPress={submit} loading={submitting} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
