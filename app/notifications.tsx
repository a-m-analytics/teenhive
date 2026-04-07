import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  } catch {
    return '';
  }
}

function typeInitials(type: string): string {
  const map: Record<string, string> = {
    application: 'APP',
    accepted: 'ACC',
    message: 'MSG',
    review: 'REV',
    invite: 'INV',
  };
  return map[type] ?? 'NTF';
}

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, created_at, read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <Text style={{ fontSize: 24, color: '#22c55e' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111', flex: 1 }}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: '#888' }}>No notifications yet.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <View
              key={n.id}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                backgroundColor: n.read ? '#fff' : '#f0fdf4',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#888' }}>{typeInitials(n.type)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: n.read ? '500' : '700', color: '#111', flex: 1, marginRight: 8 }}>
                    {n.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#aaa' }}>{timeAgo(n.created_at)}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#888', lineHeight: 18 }}>{n.body}</Text>
              </View>

              {!n.read && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginLeft: 10, marginTop: 6 }} />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
