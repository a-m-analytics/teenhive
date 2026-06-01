import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TABS = ['Invited', 'Applied', 'Active', 'Completed'];

type AppWithJob = {
  id: string;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    category: string;
    pay_rate: number;
    pay_type: string;
    date: string | null;
    parent_id: string;
    parent: { id: string; full_name: string } | null;
  } | null;
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function MyJobsTab() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('Invited');
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const isTeen = profile?.role !== 'parent';

  const fetchApps = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    if (!isTeen) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, job:jobs!job_id(id, title, category, pay_rate, pay_type, date, parent_id, parent:profiles!parent_id(id, full_name))')
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setApps(data as unknown as AppWithJob[]);
    setLoading(false);
  }, [user, isTeen]);

  useFocusEffect(useCallback(() => { fetchApps(); }, [fetchApps]));

  if (!authLoading && !isTeen) return <Redirect href={'/(tabs)/my-listings' as any} />;

  const invited = apps.filter((a) => a.status === 'invited');
  const applied = apps.filter((a) => a.status === 'pending');
  const active = apps.filter((a) => a.status === 'accepted');
  const completed = apps.filter((a) => a.status === 'completed');

  const tabData: Record<string, AppWithJob[]> = {
    Invited: invited,
    Applied: applied,
    Active: active,
    Completed: completed,
  };
  const current = tabData[tab] ?? [];

  const handleAcceptInvite = async (app: AppWithJob) => {
    if (!app.job || !user) return;
    try {
      await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
      await supabase.from('jobs').update({ status: 'in_progress', accepted_teen_id: user.id }).eq('id', app.job.id);
      // Send a welcome message
      await supabase.from('messages').insert({
        sender_id: app.job.parent_id,
        receiver_id: user.id,
        content: 'Hi! Looking forward to working with you!',
        read: false,
      });
      fetchApps();
      Alert.alert('Accepted!', 'You\'ve accepted the invite. Check your messages.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeclineInvite = async (app: AppWithJob) => {
    try {
      await supabase.from('applications').update({ status: 'declined' }).eq('id', app.id);
      fetchApps();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const emptyMsg: Record<string, { title: string; subtitle: string }> = {
    Invited: { title: 'No invites yet', subtitle: 'Parents can invite you to their jobs' },
    Applied: { title: 'No pending applications', subtitle: 'Browse jobs and apply to get started' },
    Active: { title: 'No active jobs', subtitle: 'Accepted jobs will appear here' },
    Completed: { title: 'No completed jobs yet', subtitle: 'Finished jobs will show up here' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 }}>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Your work</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, letterSpacing: -0.5 }}>My Jobs</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => {
          const count = tabData[t]?.length ?? 0;
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
                backgroundColor: active ? ds.c.primary : ds.c.surfaceContainerLow,
              }}
              onPress={() => setTab(t)}
            >
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: active ? ds.c.white : ds.c.onSurfaceVariant }}>
                {t}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : current.length === 0 ? (
        <EmptyState
          icon={tab === 'Invited' ? 'mail-open-outline' : 'briefcase-outline'}
          title={emptyMsg[tab].title}
          subtitle={emptyMsg[tab].subtitle}
          buttonText={tab === 'Applied' ? 'Browse Jobs' : undefined}
          onButtonPress={tab === 'Applied' ? () => router.push('/teen-home' as any) : undefined}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {current.map((a) => {
            const job = a.job;
            if (!job) return null;
            const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;

            return (
              <View
                key={a.id}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>
                    {job.title}
                  </Text>
                  {a.status !== 'invited' && (
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999,
                      backgroundColor: a.status === 'accepted' ? '#dcfce7' : a.status === 'completed' ? ds.c.surfaceContainerHigh : '#fef9c3',
                    }}>
                      <Text style={{
                        fontFamily: ds.f.sansSemiBold, fontSize: 11,
                        color: a.status === 'accepted' ? '#166534' : a.status === 'completed' ? ds.c.onSurfaceVariant : '#92400e',
                      }}>
                        {a.status === 'pending' ? 'Pending' : a.status === 'accepted' ? 'Active' : 'Completed'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant, marginBottom: 6 }}>
                  {job.parent?.full_name ?? 'Unknown parent'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: a.status === 'invited' ? 16 : 4 }}>
                  <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>{pay}</Text>
                  </View>
                  <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.category}</Text>
                  </View>
                </View>

                {/* Invited: accept / decline */}
                {a.status === 'invited' && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                      onPress={() => handleAcceptInvite(a)}
                    >
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                      onPress={() => handleDeclineInvite(a)}
                    >
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.error }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Active: message parent */}
                {a.status === 'accepted' && (
                  <TouchableOpacity
                    style={{ marginTop: 12, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => router.push(`/chat?id=${job.parent?.id ?? ''}&name=${encodeURIComponent(job.parent?.full_name ?? 'Parent')}` as any)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface }}>Message Parent</Text>
                  </TouchableOpacity>
                )}

                {/* Completed: leave review */}
                {a.status === 'completed' && (
                  <TouchableOpacity
                    style={{ marginTop: 12, borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => router.push(`/review-modal?jobId=${job.id}&revieweeId=${job.parent?.id ?? ''}&jobTitle=${encodeURIComponent(job.title)}` as any)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface }}>Leave a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
