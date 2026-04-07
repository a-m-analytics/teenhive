import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';

const TEENS = [
  { id: '1', name: 'Jordan M.', age: 16, skills: ['Yard Work', 'Errands', 'Cleaning'], rating: 4.8, initials: 'JM' },
  { id: '2', name: 'Sam K.', age: 15, skills: ['Babysitting', 'Pet Care', 'Tutoring'], rating: 4.6, initials: 'SK' },
  { id: '3', name: 'Alex R.', age: 17, skills: ['Tech Help', 'Tutoring', 'Errands'], rating: 5.0, initials: 'AR' },
];
const POSTED = [
  { id: '1', title: 'Lawn Mowing', pay: '$20/hr', apps: 3 },
  { id: '2', title: 'Babysitting', pay: '$15/hr', apps: 1 },
];
const APPS = [
  { id: '1', teen: 'Jordan M.', initials: 'JM', skills: ['Yard Work', 'Errands'], rating: 4.8, job: 'Lawn Mowing' },
  { id: '2', teen: 'Sam K.', initials: 'SK', skills: ['Babysitting'], rating: 4.6, job: 'Babysitting' },
  { id: '3', teen: 'Alex R.', initials: 'AR', skills: ['Tech Help'], rating: 5.0, job: 'Lawn Mowing' },
];

export default function ParentHome() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const [dismissed, setDismissed] = useState<string[]>([]);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.headerRow}>
        <Text style={s.header}>Hi {name} 👋</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}><Text style={s.bell}>🔔</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/messages')}><Text style={s.bell}>💬</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={s.postBtn} onPress={() => router.push('/post-job')}>
        <Text style={s.postBtnText}>+ Post a Job</Text>
      </TouchableOpacity>

      <Text style={s.section}>Browse Teens</Text>
      <FlatList horizontal data={TEENS} keyExtractor={t => t.id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item }) => (
          <View style={s.teenCard}>
            <View style={s.circle}><Text style={s.initials}>{item.initials}</Text></View>
            <Text style={s.teenName}>{item.name}, {item.age}</Text>
            <Text style={s.rating}>⭐ {item.rating}</Text>
            <View style={s.skillsRow}>{item.skills.map(sk => <Text key={sk} style={s.tag}>{sk}</Text>)}</View>
            <TouchableOpacity style={s.viewBtn} onPress={() => router.push(`/teen-profile?id=${item.id}&parentName=${name}`)}>
              <Text style={s.viewBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        )} />

      <Text style={s.section}>Your Posted Jobs</Text>
      {POSTED.map(j => (
        <View key={j.id} style={s.jobRow}>
          <View><Text style={s.jobTitle}>{j.title}</Text><Text style={s.jobSub}>{j.apps} applications · {j.pay}</Text></View>
          <Text style={s.active}>Active</Text>
        </View>
      ))}

      <Text style={s.section}>Applications Received</Text>
      {APPS.filter(a => !dismissed.includes(a.id)).map(a => (
        <View key={a.id} style={s.appCard}>
          <View style={s.appTop}>
            <View style={s.circleSmall}><Text style={s.initialsSmall}>{a.initials}</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.teenName}>{a.teen} · ⭐ {a.rating}</Text>
              <Text style={s.jobSub}>Applied for: {a.job}</Text>
              <View style={s.skillsRow}>{a.skills.map(sk => <Text key={sk} style={s.tag}>{sk}</Text>)}</View>
            </View>
          </View>
          <View style={s.appBtns}>
            <TouchableOpacity style={s.acceptBtn} onPress={() => { Alert.alert('Accepted!'); setDismissed(d => [...d, a.id]); }}>
              <Text style={s.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.declineBtn} onPress={() => setDismissed(d => [...d, a.id])}>
              <Text style={s.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 24, fontWeight: '700', flex: 1 },
  bell: { fontSize: 22, marginLeft: 12 },
  postBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 10, marginTop: 8 },
  teenCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginRight: 12, width: 160, alignItems: 'center' },
  circle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  initials: { color: '#fff', fontWeight: '700', fontSize: 18 },
  circleSmall: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  initialsSmall: { color: '#fff', fontWeight: '700', fontSize: 14 },
  teenName: { fontWeight: '600', fontSize: 14, textAlign: 'center' },
  rating: { fontSize: 12, color: '#555', marginVertical: 4 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 8 },
  tag: { backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontSize: 11, fontWeight: '600' },
  viewBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  jobRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontWeight: '600', fontSize: 15 },
  jobSub: { fontSize: 12, color: '#888', marginTop: 2 },
  active: { color: '#10b981', fontWeight: '600', fontSize: 12 },
  appCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  appTop: { flexDirection: 'row', marginBottom: 10 },
  appBtns: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#10b981', padding: 10, borderRadius: 8, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  declineBtn: { flex: 1, backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, alignItems: 'center' },
  declineText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});
