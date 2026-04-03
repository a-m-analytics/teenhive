import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly'];
const CAT_COLORS: Record<string, string> = {
  Babysitting: '#ec4899', Tutoring: '#3b82f6', 'Yard Work': '#22c55e',
  'Pet Care': '#f59e0b', 'Tech Help': '#8b5cf6', Cleaning: '#06b6d4', Errands: '#f97316',
};

export default function PostJob() {
  const router = useRouter();
  const { user, profile } = useAuth();
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

  const payLabel = payAmount ? `$${payAmount}${payType === 'hr' ? '/hr' : ' flat'}` : '—';
  const displayName = profile?.full_name ?? '';
  const initials = displayName ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase() : 'P';
  const catColor = CAT_COLORS[category] || '#22c55e';

  const submit = async () => {
    if (!title || !category || !payAmount) return Alert.alert('Required', 'Fill in title, category, and pay rate.');
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      parent_id: user.id,
      title,
      category,
      description,
      pay_rate: parseFloat(payAmount),
      pay_type: payType === 'hr' ? 'hourly' : 'flat',
      location_area: location,
      date: date + (startTime ? ` ${startTime}` : ''),
      estimated_hours: hours ? parseFloat(hours) : null,
      is_recurring: recurring,
      frequency: recurring ? frequency : null,
      kids_count: category === 'Babysitting' && numKids ? parseInt(numKids, 10) : null,
      teens_needed: teensNeeded,
      status: 'open',
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Job Posted! 🎉', `"${title}" is now live and teens can apply.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>Post a Job</Text>

      {/* Title */}
      <Text style={s.label}>Job Title</Text>
      <TextInput style={s.input} placeholder="e.g. Lawn Mowing" value={title} onChangeText={setTitle} />

      {/* Category */}
      <Text style={s.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[s.chip, category === c && { backgroundColor: CAT_COLORS[c], borderColor: CAT_COLORS[c] }]} onPress={() => setCategory(c)}>
            <Text style={[s.chipText, category === c && s.chipTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Description */}
      <View style={s.labelRow}>
        <Text style={s.label}>Description</Text>
        <Text style={s.counter}>{description.length}/300</Text>
      </View>
      <TextInput style={s.textArea} placeholder="Describe the job, what to bring, any requirements..." value={description} onChangeText={t => setDescription(t.slice(0, 300))} multiline />

      {/* Pay rate */}
      <Text style={s.label}>Pay Rate</Text>
      <View style={s.payRow}>
        <Text style={s.payPrefix}>$</Text>
        <TextInput style={s.payInput} placeholder="15" value={payAmount} onChangeText={setPayAmount} keyboardType="number-pad" />
        <TouchableOpacity style={[s.payTypeBtn, payType === 'hr' && s.payTypeBtnOn]} onPress={() => setPayType('hr')}>
          <Text style={[s.payTypeText, payType === 'hr' && s.payTypeTextOn]}>/hr</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.payTypeBtn, payType === 'flat' && s.payTypeBtnOn]} onPress={() => setPayType('flat')}>
          <Text style={[s.payTypeText, payType === 'flat' && s.payTypeTextOn]}>Flat rate</Text>
        </TouchableOpacity>
      </View>

      {/* Date + time */}
      <View style={s.row}>
        <View style={s.halfField}>
          <Text style={s.label}>Date</Text>
          <TextInput style={s.input} placeholder="e.g. Apr 12" value={date} onChangeText={setDate} />
        </View>
        <View style={s.halfField}>
          <Text style={s.label}>Start Time</Text>
          <TextInput style={s.input} placeholder="e.g. 3:00pm" value={startTime} onChangeText={setStartTime} />
        </View>
      </View>

      <Text style={s.label}>Estimated Hours</Text>
      <TextInput style={s.input} placeholder="e.g. 2" value={hours} onChangeText={setHours} keyboardType="number-pad" />

      {/* Location */}
      <Text style={s.label}>Location (neighborhood only)</Text>
      <TextInput style={s.input} placeholder="e.g. Oak Street area, Maplewood NJ" value={location} onChangeText={setLocation} />

      {/* Recurring toggle */}
      <View style={s.toggleRow}>
        <View>
          <Text style={s.label}>Recurring job?</Text>
          <Text style={s.toggleSub}>Repeat this on a schedule</Text>
        </View>
        <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: '#22c55e', false: '#e2e8f0' }} thumbColor="#fff" />
      </View>
      {recurring && (
        <View style={s.freqRow}>
          {FREQUENCIES.map(f => (
            <TouchableOpacity key={f} style={[s.freqBtn, frequency === f && s.freqBtnOn]} onPress={() => setFrequency(f)}>
              <Text style={[s.freqText, frequency === f && s.freqTextOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Kids (babysitting only) */}
      {category === 'Babysitting' && (
        <>
          <Text style={s.label}>Number of kids</Text>
          <TextInput style={s.input} placeholder="e.g. 2" value={numKids} onChangeText={setNumKids} keyboardType="number-pad" />
        </>
      )}

      {/* Teens needed stepper */}
      <Text style={s.label}>How many teens do you need?</Text>
      <View style={s.stepperRow}>
        <TouchableOpacity style={s.stepBtn} onPress={() => setTeensNeeded(Math.max(1, teensNeeded - 1))}>
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.stepVal}>{teensNeeded === 3 ? '3+' : teensNeeded}</Text>
        <TouchableOpacity style={s.stepBtn} onPress={() => setTeensNeeded(Math.min(3, teensNeeded + 1))}>
          <Text style={s.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Preview card */}
      <Text style={s.label}>Preview</Text>
      <View style={s.previewCard}>
        <View style={s.previewHeader}>
          <View style={s.previewParentRow}>
            <View style={s.previewCircle}><Text style={s.previewInitials}>{initials}</Text></View>
            <Text style={s.previewParent}>{displayName || 'You'}</Text>
            <Text>✅</Text>
          </View>
          <Text>🔖</Text>
        </View>
        <Text style={s.previewTitle}>{title || 'Job Title'}</Text>
        {category ? (
          <View style={[s.previewPill, { backgroundColor: catColor + '20' }]}>
            <Text style={[s.previewPillText, { color: catColor }]}>{category}</Text>
          </View>
        ) : <View style={s.previewPillEmpty}><Text style={s.previewPillEmptyText}>Category</Text></View>}
        <View style={s.previewMeta}>
          <Text style={s.previewPay}>{payLabel}</Text>
          {location ? <Text style={s.previewMetaText}>📍 {location}</Text> : null}
          {date ? <Text style={s.previewMetaText}>📅 {date}</Text> : null}
        </View>
        {recurring && <Text style={s.previewRecurring}>🔁 {frequency}</Text>}
        <View style={s.previewApplyBtn}><Text style={s.previewApplyText}>Apply Now</Text></View>
      </View>

      <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Post Job</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 18, marginBottom: 8 },
  counter: { fontSize: 12, color: '#94a3b8' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#f8fafc', color: '#0f172a' },
  textArea: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#f8fafc', color: '#0f172a', height: 110, textAlignVertical: 'top' },

  chipScroll: { marginBottom: 4 },
  chip: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#f8fafc' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: '#fff' },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payPrefix: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  payInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 20, fontWeight: '700', width: 80, textAlign: 'center', color: '#22c55e', backgroundColor: '#f8fafc' },
  payTypeBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  payTypeBtnOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  payTypeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  payTypeTextOn: { color: '#fff' },

  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14 },
  toggleSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  freqRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  freqBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, alignItems: 'center' },
  freqBtnOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  freqText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  freqTextOn: { color: '#fff' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 22, fontWeight: '700', color: '#22c55e' },
  stepVal: { fontSize: 24, fontWeight: '800', color: '#0f172a', minWidth: 32, textAlign: 'center' },

  previewCard: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, marginTop: 8, backgroundColor: '#fafafa' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  previewParentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  previewInitials: { fontSize: 12, fontWeight: '800', color: '#16a34a' },
  previewParent: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  previewTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  previewPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  previewPillText: { fontSize: 12, fontWeight: '700' },
  previewPillEmpty: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10, backgroundColor: '#f1f5f9' },
  previewPillEmptyText: { fontSize: 12, color: '#94a3b8' },
  previewMeta: { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  previewPay: { fontSize: 14, fontWeight: '800', color: '#22c55e' },
  previewMetaText: { fontSize: 13, color: '#64748b' },
  previewRecurring: { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginBottom: 10 },
  previewApplyBtn: { backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  previewApplyText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  submitBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
