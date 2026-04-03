import { currentUser } from '@/lib/user';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTab() {
  const router = useRouter();
  const isTeen = currentUser.role !== 'parent';
  const initials = currentUser.name ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.header}>Profile</Text>
      <View style={s.profileCard}>
        <View style={s.circle}><Text style={s.initials}>{initials}</Text></View>
        <Text style={s.name}>{currentUser.name || 'Your Name'}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{isTeen ? '👦 Teen Worker' : '👨‍👩‍👦 Parent'}</Text>
        </View>
      </View>

      {isTeen && (
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statNum}>15</Text><Text style={s.statLabel}>Jobs Done</Text></View>
          <View style={s.stat}><Text style={s.statNum}>4.8</Text><Text style={s.statLabel}>Rating</Text></View>
          <View style={s.stat}><Text style={s.statNum}>$148</Text><Text style={s.statLabel}>Earned</Text></View>
        </View>
      )}

      <View style={s.section}>
        {[
          { label: '📋 My Reviews', action: () => {} },
          { label: '🔔 Notifications', action: () => router.push('/notifications') },
          { label: '🔒 Privacy Settings', action: () => {} },
          { label: '❓ Help & Support', action: () => {} },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.action}>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={() => router.replace('/')}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', paddingTop: 56 },
  header: { fontSize: 24, fontWeight: '800', color: '#0f172a', paddingHorizontal: 20, marginBottom: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initials: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  roleBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  roleText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, padding: 16, justifyContent: 'space-around', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuLabel: { fontSize: 15, color: '#0f172a' },
  chevron: { fontSize: 20, color: '#94a3b8' },
  signOutBtn: { marginHorizontal: 20, marginTop: 20, borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 12, padding: 14, alignItems: 'center' },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
