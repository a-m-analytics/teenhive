import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) { setError(authError); return; }
    router.replace('/(tabs)' as any);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.logo}>TeenHive</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Headline */}
        <View style={s.hero}>
          <Text style={s.title}>Good to see{'\n'}you.</Text>
          <Text style={s.subtitle}>Sign in to continue.</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="next"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
            <Text style={s.label}>PASSWORD</Text>
            <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
              <Text style={s.forgot}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry={true}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={s.buttonText}>{loading ? 'Signing in...' : 'SIGN IN'}</Text>
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.divider} />
          </View>

          <TouchableOpacity
            style={s.outlineButton}
            onPress={() => Alert.alert('Coming soon', 'Google sign-in is coming soon.')}
          >
            <Text style={s.outlineButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.createRow} onPress={() => router.push('/signup' as any)}>
          <Text style={s.createText}>
            New here?{'  '}
            <Text style={s.createLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
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
  back: { color: '#735c00', fontSize: 14, fontWeight: '600', width: 48 },
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
  forgot: { fontSize: 12, fontWeight: '600', color: '#735c00' },
  button: {
    backgroundColor: '#051b0e', borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 28,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#e2eae3' },
  dividerText: { fontSize: 13, color: '#737972', marginHorizontal: 14 },
  outlineButton: {
    borderWidth: 1.5, borderColor: '#c3c8c1', borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700', color: '#161d19' },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 20 },
  errorText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  createRow: { alignItems: 'center', marginTop: 28 },
  createText: { fontSize: 14, color: '#737972' },
  createLink: { fontWeight: '700', color: '#735c00' },
});
