import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ResetPassword() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // By the time the user lands here, _layout has already processed the
    // deep-link URL and established a recovery session via setSession /
    // exchangeCodeForSession. We just verify there is an active session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });
  }, []);

  const handleSave = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setStatus('done');
  };

  if (status === 'loading') {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#735c00" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
        <Text style={s.title}>Link expired.</Text>
        <Text style={[s.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
          This reset link is no longer valid. Please request a new one.
        </Text>
        <TouchableOpacity style={s.button} onPress={() => router.replace('/forgot-password' as any)}>
          <Text style={s.buttonText}>REQUEST NEW LINK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'done') {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
        <View style={s.iconCircle}>
          <Text style={s.iconText}>✓</Text>
        </View>
        <Text style={s.title}>Password updated.</Text>
        <Text style={[s.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
          You can now sign in with your new password.
        </Text>
        <TouchableOpacity style={s.button} onPress={() => router.replace('/login' as any)}>
          <Text style={s.buttonText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topBar}>
          <View style={{ width: 48 }} />
          <Text style={s.logo}>TeenHive</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={s.hero}>
          <Text style={s.title}>Choose a new{'\n'}password.</Text>
          <Text style={s.subtitle}>Make it something you'll remember.</Text>
        </View>

        <View style={s.form}>
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>NEW PASSWORD</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            placeholder="At least 8 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry={true}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
          />

          <Text style={[s.label, { marginTop: 20 }]}>CONFIRM PASSWORD</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={(t) => { setConfirm(t); setError(''); }}
            placeholder="Repeat your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={true}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <TouchableOpacity
            style={[s.button, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.buttonText}>{saving ? 'Saving...' : 'SET NEW PASSWORD'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3fbf4' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
  },
  logo: { fontSize: 18, fontWeight: '700', fontStyle: 'italic', color: '#051b0e' },
  hero: { paddingHorizontal: 24, marginBottom: 32, marginTop: 8 },
  title: { fontSize: 40, fontWeight: '700', fontStyle: 'italic', color: '#051b0e', lineHeight: 46, letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#737972' },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#434843', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#eef6ef', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: '#161d19',
  },
  button: {
    backgroundColor: '#051b0e', borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 28,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 20 },
  errorText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#eef6ef', justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  iconText: { fontSize: 36, color: '#051b0e', fontWeight: '700' },
});
