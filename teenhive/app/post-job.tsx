import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsField, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { trackJobPosted } from '@/lib/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const CATEGORIES = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const DAYS = [
  { label: 'Mon', value: 'monday' },
  { label: 'Tue', value: 'tuesday' },
  { label: 'Wed', value: 'wednesday' },
  { label: 'Thu', value: 'thursday' },
  { label: 'Fri', value: 'friday' },
  { label: 'Sat', value: 'saturday' },
  { label: 'Sun', value: 'sunday' },
];

export default function PostJob() {
  const router = useRouter();
  const { user } = useAuth();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const isEditing = !!jobId;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'hr' | 'flat'>('hr');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('');
  const [timeAmPm, setTimeAmPm] = useState<'AM' | 'PM'>('AM');
  const [durationHours, setDurationHours] = useState('');
  const [durationMins, setDurationMins] = useState('0');
  const [location, setLocation] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [numKids, setNumKids] = useState('');
  const [teensNeeded, setTeensNeeded] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load existing job for editing
  useEffect(() => {
    if (!isEditing || !jobId) return;
    supabase.from('jobs').select('*').eq('id', jobId).single().then(({ data }) => {
      if (!data) return;
      setTitle(data.title ?? '');
      setCategory(data.category ?? '');
      setDescription(data.description ?? '');
      setPayAmount(data.pay_rate != null ? String(data.pay_rate) : '');
      setPayType(data.pay_type === 'hourly' ? 'hr' : 'flat');
      setLocation(data.location_area ?? '');
      if (data.estimated_hours != null) {
        const totalMins = Math.round(data.estimated_hours * 60);
        setDurationHours(String(Math.floor(totalMins / 60)));
        setDurationMins(String(totalMins % 60));
      }
      setRecurring(data.is_recurring ?? false);
      setRecurringDays(data.recurring_days ?? []);
      setTeensNeeded(data.teens_needed ?? 1);
      setNumKids(data.kids_count != null ? String(data.kids_count) : '');
      if (data.date) {
        const parts = data.date.split('-');
        if (parts.length === 3) { setDateMonth(parts[1]); setDateDay(parts[2]); }
      }
    });
  }, [isEditing, jobId]);

  const toggleDay = (day: string) => {
    setRecurringDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const submit = async () => {
    if (!title.trim() || !category || !payAmount) {
      Alert.alert('Required fields', 'Fill in title, category, and pay rate.');
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const isoDate = (dateMonth && dateDay)
        ? `${new Date().getFullYear()}-${dateMonth.padStart(2, '0')}-${dateDay.padStart(2, '0')}`
        : null;
      let timeStr: string | null = null;
      if (timeHour && timeMinute) {
        const h = parseInt(timeHour, 10);
        const hour24 = timeAmPm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        timeStr = `${String(hour24).padStart(2, '0')}:${timeMinute.padStart(2, '0')}`;
      }

      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        pay_rate: parseFloat(payAmount),
        pay_type: payType === 'hr' ? 'hourly' : 'flat',
        location_area: location.trim() || null,
        date: isoDate,
        start_time: timeStr,
        estimated_hours: durationHours ? (parseInt(durationHours, 10) + parseInt(durationMins, 10) / 60) : null,
        is_recurring: recurring,
        recurring_days: recurring && recurringDays.length > 0 ? recurringDays : null,
        kids_count: category === 'Babysitting' && numKids ? parseInt(numKids, 10) : null,
        teens_needed: teensNeeded,
      };

      if (isEditing && jobId) {
        const { error } = await supabase.from('jobs').update(payload).eq('id', jobId);
        if (error) throw error;
        Alert.alert('Job Updated!', 'Your changes have been saved.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const { data, error } = await supabase.from('jobs').insert({
          ...payload,
          parent_id: user.id,
          status: 'open',
          created_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;
        if (data) trackJobPosted(data.id, category, parseFloat(payAmount), payType === 'hr' ? 'hourly' : 'flat');
        Alert.alert('Job Posted!', 'Teens near you can now see it.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
        ]);
      }
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
            {isEditing ? 'Edit Job.' : 'Post a Job.'}
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22 }}>
            {isEditing ? 'Update the details below.' : 'Describe it and teens in your area will apply.'}
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

          {/* Date */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Date <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: ds.c.outlineVariant }}>(optional)</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <View style={{ ...dsField, flex: 1 }}>
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, textAlign: 'center' }}
                placeholder="MM"
                placeholderTextColor={ds.c.outlineVariant}
                value={dateMonth}
                onChangeText={(t) => setDateMonth(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 18, color: ds.c.onSurfaceVariant }}>/</Text>
            <View style={{ ...dsField, flex: 1 }}>
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, textAlign: 'center' }}
                placeholder="DD"
                placeholderTextColor={ds.c.outlineVariant}
                value={dateDay}
                onChangeText={(t) => setDateDay(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {/* Start Time */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Start Time <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: ds.c.outlineVariant }}>(optional)</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 6, textAlign: 'center' }}>Hour (1–12)</Text>
              <View style={{ ...dsField }}>
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, textAlign: 'center' }}
                  placeholder="e.g. 3"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={timeHour}
                  onChangeText={(t) => setTimeHour(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 22, color: ds.c.onSurfaceVariant, paddingBottom: 14 }}>:</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 6, textAlign: 'center' }}>Minutes</Text>
              <View style={{ ...dsField }}>
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, textAlign: 'center' }}
                  placeholder="00"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={timeMinute}
                  onChangeText={(t) => setTimeMinute(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            <TouchableOpacity
              style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: 9999, backgroundColor: ds.c.primary }}
              onPress={() => setTimeAmPm(timeAmPm === 'AM' ? 'PM' : 'AM')}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>{timeAmPm}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, marginBottom: 24 }}>Tap AM/PM to toggle</Text>

          {/* Duration */}
          <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Estimated Duration <Text style={{ fontFamily: ds.f.sans, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: ds.c.outlineVariant }}>(optional)</Text></Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 6 }}>Hours</Text>
              <View style={{ ...dsField }}>
                <Ionicons name="time-outline" size={16} color={ds.c.onSurfaceVariant} />
                <TextInput
                  style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
                  placeholder="0"
                  placeholderTextColor={ds.c.outlineVariant}
                  value={durationHours}
                  onChangeText={(t) => setDurationHours(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 6 }}>Minutes</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['0', '15', '30', '45'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: durationMins === m ? ds.c.primary : ds.c.surfaceContainerHigh }}
                    onPress={() => setDurationMins(m)}
                  >
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: durationMins === m ? ds.c.white : ds.c.onSurfaceVariant }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, marginTop: 2 }}>Repeat on selected days</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ true: ds.c.secondary, false: ds.c.outlineVariant }}
              thumbColor={ds.c.white}
            />
          </View>
          {recurring && (
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {DAYS.map((d) => {
                const on = recurringDays.includes(d.value);
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999,
                      backgroundColor: on ? ds.c.primary : ds.c.surfaceContainerHigh,
                      borderWidth: on ? 0 : 1,
                      borderColor: ds.c.outlineVariant,
                    }}
                    onPress={() => toggleDay(d.value)}
                  >
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: on ? ds.c.white : ds.c.onSurfaceVariant }}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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

          <GradientButton label={isEditing ? 'Save Changes' : 'Post Job'} onPress={submit} loading={submitting} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
