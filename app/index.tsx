import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <View style={s.hero}>
        <Text style={s.appName}>Neighborly Jobs</Text>
        <Text style={s.tagline}>Find local jobs. Build your reputation.</Text>
      </View>
      <View style={s.buttons}>
        <TouchableOpacity style={s.btnTeen} onPress={() => router.push('/signup?role=teen')}>
          <Text style={s.btnText}>I'm a Teen</Text>
          <Text style={s.btnSub}>Find jobs near you</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnParent} onPress={() => router.push('/signup?role=parent')}>
          <Text style={s.btnText}>I'm a Parent</Text>
          <Text style={s.btnSub}>Post jobs for teens</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between', padding: 28, paddingTop: 100 },
  hero: { alignItems: 'center' },
  appName: { fontSize: 36, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  tagline: { fontSize: 16, color: '#666', textAlign: 'center' },
  buttons: { gap: 16, paddingBottom: 40 },
  btnTeen: { backgroundColor: '#3b82f6', padding: 22, borderRadius: 14, alignItems: 'center' },
  btnParent: { backgroundColor: '#10b981', padding: 22, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  btnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
});
