import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  data?: Record<string, any>;
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

function typeIcon(type: string): { name: any; bg: string } {
  const map: Record<string, { name: any; bg: string }> = {
    application: { name: 'briefcase-outline', bg: ds.c.primaryContainer },
    accepted:    { name: 'checkmark-circle-outline', bg: '#1a5c2a' },
    message:     { name: 'chatbubble-outline', bg: ds.c.secondary },
    review:      { name: 'star-outline', bg: '#7a5800' },
    invite:      { name: 'mail-outline', bg: ds.c.primaryContainer },
  };
  return map[type] ?? { name: 'notifications-outline', bg: ds.c.onSurfaceVariant };
}

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, created_at, read, data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchNotifications(); }, [fetchNotifications]));

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleNotificationPress(n: Notification) {
    // Mark as read
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    // Navigate based on type + data
    const jobId = n.data?.job_id;
    const teenId = n.data?.teen_id;
    const senderId = n.data?.sender_id;
    const senderName = n.data?.sender_name;

    if (n.type === 'application' || n.type === 'invite' || n.type === 'job_invitation') {
      if (jobId) router.push(`/job-detail?id=${jobId}` as any);
      else router.push('/(tabs)/jobs' as any);
    } else if (n.type === 'accepted') {
      router.push('/(tabs)/jobs' as any);
    } else if (n.type === 'message') {
      if (senderId) router.push(`/chat?id=${senderId}&name=${encodeURIComponent(senderName ?? 'User')}` as any);
      else router.push('/(tabs)/messages' as any);
    } else if (n.type === 'review') {
      if (teenId) router.push(`/teen-profile?id=${teenId}` as any);
    } else if (jobId) {
      router.push(`/job-detail?id=${jobId}` as any);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <Ionicons name="chevron-back" size={18} color={ds.c.secondary} />
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Activity</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, lineHeight: 38, letterSpacing: -0.3 }}>
              Notifications
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={{ paddingBottom: 4 }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="You're all caught up!"
          subtitle="Notifications will appear here"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ds.c.secondary} />}>
          {notifications.map((n) => {
            const icon = typeIcon(n.type);
            return (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.75}
                onPress={() => handleNotificationPress(n)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: n.read ? ds.c.surfaceContainerLow : ds.c.surfaceContainer,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 8,
                  gap: 14,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: icon.bg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  <Ionicons name={icon.name} size={18} color={ds.c.white} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontFamily: n.read ? ds.f.sansMedium : ds.f.sansBold, fontSize: 15, color: ds.c.onSurface, flex: 1, marginRight: 8 }}>
                      {n.title}
                    </Text>
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.outlineVariant, marginTop: 2 }}>
                      {timeAgo(n.created_at)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 19 }}>
                    {n.body}
                  </Text>
                </View>

                {!n.read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ds.c.secondary, marginTop: 6, flexShrink: 0 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
