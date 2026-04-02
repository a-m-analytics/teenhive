import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const APPLICATIONS = [
  { id: '1', teen: 'Jordan M.', job: 'Lawn Mowing', status: 'New', rating: '4.8 ⭐' },
  { id: '2', teen: 'Sam K.', job: 'Babysitting', status: 'New', rating: '4.6 ⭐' },
  { id: '3', teen: 'Alex R.', job: 'Dog Walking', status: 'Reviewed', rating: '5.0 ⭐' },
];

export default function ParentHome() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  return (
    <View style={s.container}>
      <Text style={s.header}>Hi {name} 👋</Text>
      <TouchableOpacity style={s.postBtn} onPress={() => router.push('/post-job')}>
        <Text style={s.postBtnText}>+ Post a Job</Text>
      </TouchableOpacity>
      <Text style={s.section}>Recent Applications</Text>
      <FlatList
        data={APPLICATIONS}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.teenName}>{item.teen}</Text>
              <Text style={s.jobName}>Applied for: {item.job}</Text>
              <Text style={s.rating}>{item.rating}</Text>
            </View>
            <View style={[s.badge, item.status === 'New' && s.badgeNew]}>
              <Text style={s.badgeText}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60, paddingHorizontal: 16 },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 16 },
  postBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  postBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { gap: 3 },
  teenName: { fontSize: 16, fontWeight: '600' },
  jobName: { fontSize: 13, color: '#666' },
  rating: { fontSize: 13 },
  badge: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeNew: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#333' },
});
