import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import OfflineBanner from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

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
        if (!isMe && !msg.read) existing.unread_count += 1;
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  const onRefresh = () => { setRefreshing(true); fetchConversations(); };

  const filtered = conversations.filter((c) =>
    c.other_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <OfflineBanner />
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 24 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Direct</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>
          Messages
        </Text>
      </View>

      {/* Search */}
      <View style={{ marginHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}>
        <Ionicons name="search-outline" size={16} color={ds.c.onSurfaceVariant} />
        <TextInput
          style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
          placeholder="Search conversations..."
          placeholderTextColor={ds.c.outlineVariant}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={search ? 'No conversations match.' : 'No messages yet'}
          subtitle={search ? 'Try a different name.' : 'Accept an application to start chatting!'}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ds.c.secondary} />}>
          {filtered.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: ds.c.surfaceContainerLow,
              }}
              onPress={() => router.push(`/chat?id=${conv.other_id}&name=${encodeURIComponent(conv.other_name)}` as any)}
            >
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 17, color: ds.c.primary }}>
                  {getInitials(conv.other_name)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontFamily: conv.unread_count > 0 ? ds.f.sansBold : ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>
                    {conv.other_name}
                  </Text>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant }}>
                    {timeAgo(conv.last_message_at)}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: ds.f.sans, fontSize: 13, color: conv.unread_count > 0 ? ds.c.onSurfaceVariant : ds.c.outlineVariant }}
                >
                  {conv.last_message}
                </Text>
              </View>

              {conv.unread_count > 0 && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ds.c.secondary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.white }}>
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
