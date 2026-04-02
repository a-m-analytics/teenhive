import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function SignupScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = () => {
    if (!name || !email || !password || !confirm) return Alert.alert('Fill in all fields');
    if (password !== confirm) return Alert.alert('Passwords do not match');
    const dest = role === 'teen' ? `/teen-home?name=${name}` : `/parent-home?name=${name}`;
    router.replace(dest as any);
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Create Account</Text>
      <Text style={s.sub}>Signing up as a {role === 'teen' ? 'Teen' : 'Parent'}</Text>
      <TextInput style={s.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={s.input} placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={submit}>
        <Text style={s.btnText}>Create Account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={s.back}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#666', fontSize: 14, marginBottom: 28 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: '#fafafa' },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  back: { color: '#3b82f6', textAlign: 'center', fontSize: 14 },
});
