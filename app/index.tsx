import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (user && profile) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={s.container}>
      <View style={s.hero}>
        <View style={s.logoCircle}><Text style={s.logoEmoji}>🏘️</Text></View>
        <Text style={s.appName}>Neighborly Jobs</Text>
        <Text style={s.tagline}>Find local jobs.{'\n'}Build your reputation.</Text>
      </View>
      <View style={s.buttons}>
        <TouchableOpacity style={s.btnTeen} onPress={() => router.push('/signup?role=teen')}>
          <Text style={s.btnEmoji}>👦</Text>
          <Text style={s.btnTitle}>I'm a Teen</Text>
          <Text style={s.btnSub}>Find jobs in your neighborhood</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnParent} onPress={() => router.push('/signup?role=parent')}>
          <Text style={s.btnEmoji}>👨‍👩‍👦</Text>
          <Text style={s.btnTitle}>I'm a Parent</Text>
          <Text style={s.btnSub}>Post jobs for local teens</Text>
        </TouchableOpacity>
        <View style={s.loginRow}>
          <Text style={s.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={s.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'space-between', padding: 28, paddingTop: 90 },
  hero: { alignItems: 'center', gap: 12 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 36, fontWeight: '800', color: '#0f172a' },
  tagline: { fontSize: 17, color: '#64748b', textAlign: 'center', lineHeight: 26 },
  buttons: { gap: 14, paddingBottom: 40 },
  btnTeen: { backgroundColor: '#22c55e', padding: 20, borderRadius: 16, alignItems: 'center', gap: 4 },
  btnParent: { backgroundColor: '#0f172a', padding: 20, borderRadius: 16, alignItems: 'center', gap: 4 },
  btnEmoji: { fontSize: 28 },
  btnTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  loginPrompt: { color: '#64748b', fontSize: 14 },
  loginLink: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
});
