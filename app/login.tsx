import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { trackLogIn } from '@/lib/analytics';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      if (authError.toLowerCase().includes('email not confirmed') || authError.toLowerCase().includes('not confirmed')) {
        Alert.alert(
          'Email not verified',
          'Please check your email and click the verification link.',
          [
            { text: 'Resend email', onPress: () => router.push({ pathname: '/verify-email', params: { email: email.trim() } } as any) },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }
      setError(authError);
      return;
    }
    trackLogIn(email.trim());
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
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6ef', borderRadius: 12 }}>
            <TextInput
              style={[s.input, { flex: 1, backgroundColor: 'transparent' }]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 16 }} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#737972" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={s.buttonText}>{loading ? 'Signing in...' : 'SIGN IN'}</Text>
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
  back: { fontFamily: ds.f.sansSemiBold, color: '#735c00', fontSize: 14, width: 48 },
  logo: { fontFamily: ds.f.serifBold, fontSize: 20, color: '#051b0e' },
  hero: { paddingHorizontal: 24, marginBottom: 32, marginTop: 8 },
  title: { fontFamily: ds.f.serifBold, fontSize: 42, color: '#051b0e', lineHeight: 48, letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontFamily: ds.f.sans, fontSize: 15, color: '#737972' },
  form: { paddingHorizontal: 24 },
  label: { fontFamily: ds.f.sansBold, fontSize: 11, color: '#434843', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    fontFamily: ds.f.sans,
    backgroundColor: '#eef6ef', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: '#161d19',
  },
  forgot: { fontFamily: ds.f.sansSemiBold, fontSize: 12, color: '#735c00' },
  button: {
    backgroundColor: '#051b0e', borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 28,
  },
  buttonText: { fontFamily: ds.f.sansBold, color: '#fff', fontSize: 15, letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#e2eae3' },
  dividerText: { fontFamily: ds.f.sans, fontSize: 13, color: '#737972', marginHorizontal: 14 },
  outlineButton: {
    borderWidth: 1.5, borderColor: '#c3c8c1', borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
  },
  outlineButtonText: { fontFamily: ds.f.sansBold, fontSize: 14, color: '#161d19' },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 20 },
  errorText: { fontFamily: ds.f.sansMedium, fontSize: 13, color: '#ef4444' },
  createRow: { alignItems: 'center', marginTop: 28 },
  createText: { fontFamily: ds.f.sans, fontSize: 14, color: '#737972' },
  createLink: { fontFamily: ds.f.sansBold, color: '#735c00' },
});
