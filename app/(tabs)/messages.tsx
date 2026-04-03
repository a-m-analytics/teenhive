import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CONVOS = [
  { id: '1', name: 'Sarah M.', initials: 'SM', preview: 'Sounds great, see you Saturday!', time: '2m ago', unread: true },
  { id: '2', name: 'Tom B.', initials: 'TB', preview: 'Can you come by at 4pm?', time: '1h ago', unread: true },
  { id: '3', name: 'Jordan M.', initials: 'JM', preview: 'I accepted the job!', time: '3h ago', unread: false },
  { id: '4', name: 'Lisa K.', initials: 'LK', preview: 'Thanks for applying!', time: 'Yesterday', unread: false },
];

export default function MessagesTab() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <Text style={s.header}>Messages</Text>
      <FlatList
        data={CONVOS}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => router.push(`/chat?id=${item.id}&name=${item.name}`)}>
            <View style={s.circle}>
              <Text style={s.initials}>{item.initials}</Text>
            </View>
            <View style={s.content}>
              <View style={s.rowTop}>
                <Text style={[s.name, item.unread && s.nameBold]}>{item.name}</Text>
                <Text style={s.time}>{item.time}</Text>
              </View>
              <Text style={[s.preview, item.unread && s.previewBold]} numberOfLines={1}>{item.preview}</Text>
            </View>
            {item.unread && <View style={s.dot} />}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.divider} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  header: { fontSize: 24, fontWeight: '800', color: '#0f172a', paddingHorizontal: 20, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  circle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  initials: { color: '#16a34a', fontWeight: '700', fontSize: 17 },
  content: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontWeight: '500', fontSize: 15, color: '#0f172a' },
  nameBold: { fontWeight: '700' },
  time: { fontSize: 12, color: '#94a3b8' },
  preview: { fontSize: 13, color: '#94a3b8' },
  previewBold: { color: '#64748b', fontWeight: '500' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 84 },
});
