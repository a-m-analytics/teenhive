import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CONVOS = [
  { id: '1', name: 'Sarah M.', initials: 'SM', preview: 'Sounds great, see you Saturday!', time: '2m ago' },
  { id: '2', name: 'Tom B.', initials: 'TB', preview: 'Can you come by at 4pm?', time: '1h ago' },
  { id: '3', name: 'Jordan M.', initials: 'JM', preview: 'I accepted the job!', time: '3h ago' },
  { id: '4', name: 'Lisa K.', initials: 'LK', preview: 'Thanks for applying!', time: 'Yesterday' },
];

export default function Messages() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <Text style={s.header}>Messages</Text>
      <FlatList
        data={CONVOS}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => router.push(`/chat?id=${item.id}&name=${item.name}`)}>
            <View style={s.circle}><Text style={s.initials}>{item.initials}</Text></View>
            <View style={s.text}>
              <View style={s.rowTop}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.time}>{item.time}</Text>
              </View>
              <Text style={s.preview} numberOfLines={1}>{item.preview}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.divider} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 24, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  circle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  initials: { color: '#fff', fontWeight: '700', fontSize: 16 },
  text: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontWeight: '600', fontSize: 15 },
  time: { fontSize: 12, color: '#999' },
  preview: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 82 },
});
