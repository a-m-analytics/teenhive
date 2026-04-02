import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const JOBS = [
  { id: '1', title: 'Lawn Mowing', category: 'Yard Work', distance: '0.2 miles', pay: '$20/hr' },
  { id: '2', title: 'Babysitting', category: 'Childcare', distance: '0.5 miles', pay: '$15/hr' },
  { id: '3', title: 'Math Tutoring', category: 'Tutoring', distance: '0.8 miles', pay: '$25/hr' },
  { id: '4', title: 'Dog Walking', category: 'Pet Care', distance: '0.3 miles', pay: '$12/hr' },
  { id: '5', title: 'Phone Setup Help', category: 'Tech Help', distance: '1.1 miles', pay: '$18/hr' },
];

export default function TeenHome() {
  const { name } = useLocalSearchParams<{ name: string }>();
  return (
    <View style={s.container}>
      <Text style={s.header}>Hi {name} 👋</Text>
      <TextInput style={s.search} placeholder="🔍  Search jobs..." />
      <FlatList
        data={JOBS}
        keyExtractor={j => j.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.jobTitle}>{item.title}</Text>
              <Text style={s.pay}>{item.pay}</Text>
            </View>
            <View style={s.cardBottom}>
              <Text style={s.tag}>{item.category}</Text>
              <Text style={s.distance}>{item.distance}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60, paddingHorizontal: 16 },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 14 },
  search: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  jobTitle: { fontSize: 16, fontWeight: '600' },
  pay: { fontSize: 15, fontWeight: '700', color: '#3b82f6' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  tag: { backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 12, color: '#888', alignSelf: 'center' },
});
