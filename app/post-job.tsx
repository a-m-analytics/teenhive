import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];

export default function PostJob() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pay, setPay] = useState('');

  const submit = () => {
    if (!title || !category || !pay) return Alert.alert('Fill in title, category, and pay');
    Alert.alert('Job Posted!', `"${title}" is now live.`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Post a Job</Text>
      <Text style={s.label}>Job Title</Text>
      <TextInput style={s.input} placeholder="e.g. Lawn Mowing" value={title} onChangeText={setTitle} />
      <Text style={s.label}>Category</Text>
      <View style={s.chips}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[s.chip, category === c && s.chipSelected]} onPress={() => setCategory(c)}>
            <Text style={[s.chipText, category === c && s.chipTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, s.textArea]} placeholder="Describe the job..." value={description} onChangeText={setDescription} multiline />
      <Text style={s.label}>Pay Rate</Text>
      <TextInput style={s.input} placeholder="e.g. $15/hr" value={pay} onChangeText={setPay} />
      <TouchableOpacity style={s.btn} onPress={submit}>
        <Text style={s.btnText}>Post Job</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: '#fafafa' },
  textArea: { height: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
