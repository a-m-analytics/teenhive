import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';

const INVITES = [
  { id: 'i1', title: 'Dog Walking', parent: 'Mike R.' },
  { id: 'i2', title: 'Tech Help', parent: 'Carol S.' },
];
const JOBS = [
  { id: '1', title: 'Lawn Mowing', category: 'Yard Work', distance: '0.2 miles', pay: '$20/hr' },
  { id: '2', title: 'Babysitting', category: 'Childcare', distance: '0.5 miles', pay: '$15/hr' },
  { id: '3', title: 'Math Tutoring', category: 'Tutoring', distance: '0.8 miles', pay: '$25/hr' },
  { id: '4', title: 'Dog Walking', category: 'Pet Care', distance: '0.3 miles', pay: '$12/hr' },
  { id: '5', title: 'Phone Setup Help', category: 'Tech Help', distance: '1.1 miles', pay: '$18/hr' },
];

export default function TeenHome() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.headerRow}>
        <Text style={s.header}>Hi {name} 👋</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}><Text style={s.icon}>🔔</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/messages')}><Text style={s.icon}>💬</Text></TouchableOpacity>
      </View>
      <TextInput style={s.search} placeholder="🔍  Search jobs..." />

      <Text style={s.section}>Invited Jobs 🎉</Text>
      <FlatList horizontal data={INVITES} keyExtractor={i => i.id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item }) => (
          <View style={s.inviteCard}>
            <Text style={s.inviteTitle}>{item.title}</Text>
            <Text style={s.inviteParent}>From {item.parent}</Text>
            <TouchableOpacity style={s.inviteBtn} onPress={() => router.push(`/job-detail?id=${JOBS.find(j => j.title === item.title)?.id ?? '1'}`)}>
              <Text style={s.inviteBtnText}>View & Accept</Text>
            </TouchableOpacity>
          </View>
        )} />

      <Text style={s.section}>Jobs Near You</Text>
      {JOBS.map(job => (
        <View key={job.id} style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.jobTitle}>{job.title}</Text>
            <Text style={s.pay}>{job.pay}</Text>
          </View>
          <View style={s.cardBottom}>
            <Text style={s.tag}>{job.category}</Text>
            <Text style={s.distance}>{job.distance}</Text>
          </View>
          <TouchableOpacity style={s.viewBtn} onPress={() => router.push(`/job-detail?id=${job.id}`)}>
            <Text style={s.viewBtnText}>View Job</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  header: { fontSize: 24, fontWeight: '700', flex: 1 },
  icon: { fontSize: 22, marginLeft: 12 },
  search: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  section: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  inviteCard: { backgroundColor: '#fef9c3', borderRadius: 12, padding: 14, marginRight: 12, width: 160 },
  inviteTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  inviteParent: { fontSize: 12, color: '#666', marginBottom: 10 },
  inviteBtn: { backgroundColor: '#f59e0b', borderRadius: 8, padding: 8, alignItems: 'center' },
  inviteBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  jobTitle: { fontSize: 16, fontWeight: '600' },
  pay: { fontSize: 15, fontWeight: '700', color: '#3b82f6' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tag: { backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 12, color: '#888' },
  viewBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 10, alignItems: 'center' },
  viewBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
