import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NOTIFS = [
  { id: '1', icon: '🎉', title: 'Job Invite Received', body: 'Mike R. invited you to a Dog Walking job!', time: '5m ago', unread: true },
  { id: '2', icon: '✅', title: 'Application Accepted', body: 'Your application for Lawn Mowing was accepted!', time: '1h ago', unread: true },
  { id: '3', icon: '💬', title: 'New Message', body: 'New message from Sarah M.', time: '2h ago', unread: false },
  { id: '4', icon: '⭐', title: 'New Review', body: 'Sarah M. left you a 5-star review!', time: 'Yesterday', unread: false },
  { id: '5', icon: '📋', title: 'New Application', body: 'Jordan M. applied to your Lawn Mowing job.', time: 'Yesterday', unread: false },
];

export default function Notifications() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.header}>Notifications</Text>
      </View>
      <FlatList
        data={NOTIFS}
        keyExtractor={n => n.id}
        renderItem={({ item }) => (
          <View style={[s.row, item.unread && s.rowUnread]}>
            <View style={s.iconCircle}><Text style={s.icon}>{item.icon}</Text></View>
            <View style={s.content}>
              <Text style={[s.title, item.unread && s.titleBold]}>{item.title}</Text>
              <Text style={s.body}>{item.body}</Text>
            </View>
            <View style={s.rightCol}>
              <Text style={s.time}>{item.time}</Text>
              {item.unread && <View style={s.dot} />}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={s.divider} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  back: { fontSize: 24, color: '#22c55e', marginRight: 14 },
  header: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  rowUnread: { backgroundColor: '#f0fdf4' },
  iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  title: { fontWeight: '500', fontSize: 14, color: '#0f172a', marginBottom: 2 },
  titleBold: { fontWeight: '700' },
  body: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 11, color: '#94a3b8' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});
