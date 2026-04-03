import { currentUser } from '@/lib/user';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SKILLS = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands', 'Car Washing'];
const AVAILABILITY = ['Weekdays after school', 'Weekends', 'Summers', 'Flexible'];
const DISTANCES = ['0.5 mi', '1 mi', '2 mi', '5 mi'];
const initials = currentUser.name ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase() : 'ME';

export default function TeenOffer() {
  const router = useRouter();
  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvail, setSelectedAvail] = useState<string[]>([]);
  const [distance, setDistance] = useState('1 mi');

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const submit = () => {
    if (!rate || selectedSkills.length === 0) return Alert.alert('Add your rate and at least one skill');
    Alert.alert('Profile Posted! 🎉', 'Parents can now find and invite you to jobs.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Post Your Services</Text>
      <Text style={s.sub}>Let parents find you for jobs near them</Text>

      <View style={s.profileRow}>
        <View style={s.circle}><Text style={s.initials}>{initials}</Text></View>
        <Text style={s.name}>{currentUser.name || 'Your Name'}</Text>
      </View>

      <Text style={s.label}>Your Hourly Rate</Text>
      <View style={s.rateRow}>
        <Text style={s.ratePrefix}>I charge $</Text>
        <TextInput style={s.rateInput} placeholder="15" value={rate} onChangeText={setRate} keyboardType="number-pad" />
        <Text style={s.rateSuffix}>/hr</Text>
      </View>

      <Text style={s.label}>Your Skills</Text>
      <View style={s.grid}>
        {SKILLS.map(sk => {
          const on = selectedSkills.includes(sk);
          return (
            <TouchableOpacity key={sk} style={[s.chip, on && s.chipOn]} onPress={() => toggle(selectedSkills, setSelectedSkills, sk)}>
              <Text style={[s.chipText, on && s.chipTextOn]}>{sk}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.label}>Availability</Text>
      <View style={s.grid}>
        {AVAILABILITY.map(a => {
          const on = selectedAvail.includes(a);
          return (
            <TouchableOpacity key={a} style={[s.chip, on && s.chipOn]} onPress={() => toggle(selectedAvail, setSelectedAvail, a)}>
              <Text style={[s.chipText, on && s.chipTextOn]}>{a}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.label}>About You <Text style={s.counter}>{bio.length}/200</Text></Text>
      <TextInput style={s.bio} placeholder="Tell parents about yourself, your experience, why you're reliable..." value={bio} onChangeText={t => setBio(t.slice(0, 200))} multiline />

      <Text style={s.label}>How far will you travel?</Text>
      <View style={s.distRow}>
        {DISTANCES.map(d => (
          <TouchableOpacity key={d} style={[s.distBtn, distance === d && s.distBtnOn]} onPress={() => setDistance(d)}>
            <Text style={[s.distText, distance === d && s.distTextOn]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={submit}>
        <Text style={s.submitText}>Post My Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, marginBottom: 20 },
  circle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginTop: 18 },
  counter: { fontWeight: '400', color: '#94a3b8' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratePrefix: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  rateInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 20, fontWeight: '700', width: 72, textAlign: 'center', color: '#22c55e' },
  rateSuffix: { fontSize: 16, color: '#64748b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: '#fff' },
  bio: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top', color: '#0f172a', backgroundColor: '#f8fafc' },
  distRow: { flexDirection: 'row', gap: 10 },
  distBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, alignItems: 'center' },
  distBtnOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  distText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  distTextOn: { color: '#fff' },
  submitBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
