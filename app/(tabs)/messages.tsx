import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

type Conversation = {
  id: string;
  other_id: string;
  other_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function MessagesTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Get all messages involving this user, grouped by conversation partner
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

    // Group by conversation partner
    const convMap = new Map<string, Conversation>();
    for (const msg of msgs) {
      const isMe = msg.sender_id === user.id;
      const otherId = isMe ? msg.receiver_id : msg.sender_id;
      const otherProfile = isMe ? (msg.receiver as any) : (msg.sender as any);
      const otherName = otherProfile?.full_name ?? 'Unknown';

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          id: otherId,
          other_id: otherId,
          other_name: otherName,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: !isMe && !msg.read ? 1 : 0,
        });
      } else {
        const existing = convMap.get(otherId)!;
        if (!isMe && !msg.read) {
          existing.unread_count += 1;
        }
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  const filtered = conversations.filter((c) =>
    c.other_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
      {/* Header */}
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', paddingHorizontal: 24, marginBottom: 16 }}>
        Messages
      </Text>

      {/* Search */}
      <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 15,
            color: '#111',
            backgroundColor: '#fafafa',
          }}
          placeholder="Search conversations..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 40 }}>
            {search ? 'No conversations match your search.' : 'No messages yet.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtered.map((conv, i) => (
            <TouchableOpacity
              key={conv.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
              }}
              onPress={() => router.push(`/chat?id=${conv.other_id}&name=${encodeURIComponent(conv.other_name)}` as any)}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#555' }}>
                  {getInitials(conv.other_name)}
                </Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 15, fontWeight: conv.unread_count > 0 ? '700' : '500', color: '#111' }}>
                    {conv.other_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#aaa' }}>{timeAgo(conv.last_message_at)}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 13, color: conv.unread_count > 0 ? '#555' : '#aaa', fontWeight: conv.unread_count > 0 ? '500' : '400' }}
                >
                  {conv.last_message}
                </Text>
              </View>

              {/* Unread dot */}
              {conv.unread_count > 0 && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#22c55e',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 10,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '700' }}>
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
