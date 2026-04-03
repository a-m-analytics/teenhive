import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    router.replace('/(tabs)' as any);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={s.title}>Welcome Back</Text>
        <Text style={s.subtitle}>Sign in to Neighborly Jobs</Text>

        {/* Error */}
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <Text style={s.label}>Email</Text>
        <TextInput
          style={[s.input, error && !email && s.inputError]}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={v => { setEmail(v); setError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        {/* Password */}
        <Text style={s.label}>Password</Text>
        <View style={[s.passwordRow, error && !password && s.inputError]}>
          <TextInput
            style={s.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={v => { setPassword(v); setError(''); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
            <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          style={s.forgotBtn}
          onPress={() => router.push('/forgot-password')}
        >
          <Text style={s.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Log In */}
        <TouchableOpacity
          style={[s.loginBtn, loading && s.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.loginBtnText}>Log In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Google */}
        <TouchableOpacity
          style={s.googleBtn}
          onPress={() => Alert.alert('Coming Soon', 'Google sign-in is coming soon!')}
          activeOpacity={0.8}
        >
          <Text style={s.googleIcon}>G</Text>
          <Text style={s.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={s.signupRow}>
          <Text style={s.signupPrompt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/index' as any)}>
            <Text style={s.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },

  backBtn: { marginBottom: 24 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },

  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 28 },

  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '500' },

  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 4 },
  inputError: { borderColor: '#f87171' },

  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc', marginBottom: 4 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a' },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 24 },
  forgotText: { color: '#22c55e', fontSize: 14, fontWeight: '600' },

  loginBtn: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 14, marginBottom: 32, backgroundColor: '#fff' },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupPrompt: { color: '#64748b', fontSize: 15 },
  signupLink: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
});
