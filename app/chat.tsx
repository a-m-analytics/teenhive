import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const INITIAL: Record<string, any[]> = {
  '1': [
    { id: '1', text: 'Hi! I saw you applied for the lawn mowing job.', me: false },
    { id: '2', text: 'Yes! I have my own gloves and can start this weekend.', me: true },
    { id: '3', text: 'Sounds great, see you Saturday!', me: false },
  ],
  default: [{ id: '1', text: 'Hey! Looking forward to working together.', me: false }],
};

export default function Chat() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState(INITIAL[id ?? 'default'] ?? INITIAL.default);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id: Date.now().toString(), text: input.trim(), me: true }]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerName}>{name}</Text>
        <TouchableOpacity onPress={() => Alert.alert('Share Contact Info', 'Both users must agree to share contact info.')}>
          <Text style={s.shareBtn}>Share Info</Text>
        </TouchableOpacity>
      </View>
      <View style={s.banner}><Text style={s.bannerText}>🔒  Keep all communication here until you're both comfortable</Text></View>
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.messages}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.me ? s.bubbleMe : s.bubbleThem]}>
            <Text style={[s.bubbleText, item.me && s.bubbleTextMe]}>{item.text}</Text>
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder="Type a message..." value={input} onChangeText={setInput} returnKeyType="send" onSubmitEditing={send} />
        <TouchableOpacity style={s.sendBtn} onPress={send}><Text style={s.sendText}>Send</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  back: { fontSize: 24, color: '#22c55e', marginRight: 14 },
  headerName: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a' },
  shareBtn: { color: '#22c55e', fontSize: 13, fontWeight: '700' },
  banner: { backgroundColor: '#f0fdf4', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#dcfce7' },
  bannerText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  messages: { padding: 16, gap: 8 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, backgroundColor: '#f1f5f9', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#22c55e', alignSelf: 'flex-end', borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: '#0f172a' },
  bubbleTextMe: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  sendBtn: { backgroundColor: '#22c55e', borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
