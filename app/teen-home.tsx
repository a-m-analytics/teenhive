import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import OfflineBanner from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Job = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: string;
  location_area: string | null;
  created_at: string;
  parent: { full_name: string } | null;
};

type Invite = {
  id: string;
  job_id: string;
  job: { id: string; title: string; category: string; pay_rate: number; pay_type: string } | null;
  parent: { full_name: string } | null;
};

function formatPay(rate: number, type: string) {
  return `$${rate}${type === 'hourly' ? '/hr' : ' flat'}`;
}

export default function TeenHome() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [jobsRes, invitesRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, title, category, pay_rate, pay_type, location_area, created_at, parent:profiles!parent_id(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('applications')
        .select('id, job_id, job:jobs!job_id(id, title, category, pay_rate, pay_type), parent:profiles!parent_id(full_name)')
        .eq('teen_id', user.id)
        .eq('status', 'invited'),
    ]);

    if (jobsRes.data) setJobs(jobsRes.data as unknown as Job[]);
    if (invitesRes.data) setInvites(invitesRes.data as unknown as Invite[]);

    // Unread notifications count
    const notifRes = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setUnreadCount((notifRes as any).count ?? 0);

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ds.c.secondary} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Welcome back</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>
                Hi, {firstName}.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, paddingTop: 8 }}>
              <TouchableOpacity
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={20} color={ds.c.onSurfaceVariant} />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: ds.c.error }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => router.push('/(tabs)/messages' as any)}
              >
                <Ionicons name="chatbubble-outline" size={20} color={ds.c.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Invites */}
        {invites.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
              <Text style={{ ...dsSecondaryLabel, marginBottom: 4 }}>You've been invited</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Invites</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
              {invites.map((invite) => {
                if (!invite.job) return null;
                return (
                  <TouchableOpacity
                    key={invite.id}
                    style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 24, padding: 20, width: 180 }}
                    onPress={() => router.push(`/job-detail?id=${invite.job?.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: 'rgba(5,27,14,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Invited by</Text>
                    <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, lineHeight: 22, marginBottom: 4 }}>{invite.job.title}</Text>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: 'rgba(5,27,14,0.55)', marginBottom: 12 }}>{invite.parent?.full_name}</Text>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary }}>
                      {formatPay(invite.job.pay_rate, invite.job.pay_type)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Jobs near you */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Available Now</Text>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, letterSpacing: -0.3 }}>Jobs Near You</Text>
        </View>

        {jobs.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No jobs near you yet"
            subtitle="Check back soon or post your services to get invited"
            buttonText="Post My Services"
            onButtonPress={() => router.push('/post-service' as any)}
          />
        ) : (
          jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}
              onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>{job.title}</Text>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>{formatPay(job.pay_rate, job.pay_type)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.category}</Text>
                </View>
                {job.location_area ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="location-outline" size={12} color={ds.c.onSurfaceVariant} />
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.location_area}</Text>
                  </View>
                ) : null}
                {job.parent ? (
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>· {job.parent.full_name}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
