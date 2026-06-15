import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type BlockedUser = {
  blocked_id: string;
  blocked: { id: string; full_name: string; role: string } | null;
};

function getInitials(name: string) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('blocks')
      .select('blocked_id, blocked:profiles!blocked_id(id, full_name, role)')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        if (data) setBlocks(data as unknown as BlockedUser[]);
        setLoading(false);
      });
  }, [user]);

  const handleUnblock = (blockedId: string, name: string) => {
    Alert.alert('Unblock User', `Unblock ${name}? They will appear in your feed again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          await supabase.from('blocks').delete().eq('blocker_id', user!.id).eq('blocked_id', blockedId);
          setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={ds.c.primary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, letterSpacing: -0.3 }}>Blocked Users</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ds.c.secondary} style={{ marginTop: 40 }} />
      ) : blocks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Ionicons name="ban-outline" size={40} color={ds.c.outlineVariant} style={{ marginBottom: 12 }} />
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurfaceVariant }}>No blocked users</Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, marginTop: 6 }}>Block someone from their profile to see them here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, marginBottom: 20 }}>
            Blocked users won't appear in your feed.
          </Text>
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, overflow: 'hidden' }}>
            {blocks.map((b, i) => {
              const name = b.blocked?.full_name ?? 'Unknown User';
              return (
                <View
                  key={b.blocked_id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 20, paddingVertical: 16,
                    borderBottomWidth: i < blocks.length - 1 ? 1 : 0,
                    borderBottomColor: ds.c.surfaceContainerHigh,
                  }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.onSurfaceVariant }}>{getInitials(name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>{name}</Text>
                    {b.blocked?.role ? (
                      <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, textTransform: 'capitalize' }}>
                        {b.blocked.role}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 }}
                    onPress={() => handleUnblock(b.blocked_id, name)}
                  >
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurface }}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
