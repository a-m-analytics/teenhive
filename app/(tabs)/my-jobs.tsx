import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

const TABS = ['Applied', 'Active', 'Completed'];

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
    parent: { id: string; full_name: string } | null;
  } | null;
};

export default function MyJobsTab() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('Applied');
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const isTeen = profile?.role !== 'parent';

  const fetchApps = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    if (!isTeen) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, job:jobs!job_id(id, title, category, pay_rate, pay_type, date, parent:profiles!parent_id(id, full_name))')
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setApps(data as unknown as AppWithJob[]);
    setLoading(false);
  }, [user, isTeen]);

  useFocusEffect(useCallback(() => { fetchApps(); }, [fetchApps]));

  if (!authLoading && !isTeen) return <Redirect href={'/(tabs)/my-listings' as any} />;

  const applied = apps.filter((a) => a.status === 'pending');
  const active = apps.filter((a) => a.status === 'accepted');
  const completed = apps.filter((a) => a.status === 'completed');
  const current = tab === 'Applied' ? applied : tab === 'Active' ? active : completed;

  const emptyMsg: Record<string, string> = {
    Applied: 'No pending applications yet.',
    Active: 'No active jobs yet.',
    Completed: 'No completed jobs yet.',
  };

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
      {/* Page title */}
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', paddingHorizontal: 24, marginBottom: 20 }}>
        My Jobs
      </Text>

      {/* Underline tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 20 }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: tab === t ? '#22c55e' : 'transparent',
            }}
            onPress={() => setTab(t)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: tab === t ? '700' : '500',
                color: tab === t ? '#22c55e' : '#888',
              }}
            >
              {t}
              {t === 'Applied' && applied.length > 0 ? `  ${applied.length}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {current.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#aaa', fontSize: 15, marginTop: 48 }}>
              {emptyMsg[tab]}
            </Text>
          ) : (
            current.map((a) => {
              const job = a.job;
              if (!job) return null;
              const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
              const dateApplied = formatDate(a.created_at);

              // Status badge styles
              let badgeBg = '#fef9c3';
              let badgeColor = '#92400e';
              let badgeLabel = 'Pending';
              if (a.status === 'accepted') {
                badgeBg = '#dcfce7';
                badgeColor = '#166534';
                badgeLabel = 'Active';
              } else if (a.status === 'completed') {
                badgeBg = '#f3f4f6';
                badgeColor = '#6b7280';
                badgeLabel = 'Completed';
              }

              return (
                <View
                  key={a.id}
                  style={{
                    marginHorizontal: 24,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#f0f0f0',
                    borderRadius: 12,
                    padding: 16,
                    backgroundColor: '#fff',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 }}>
                      {job.title}
                    </Text>
                    <View
                      style={{
                        backgroundColor: badgeBg,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: badgeColor }}>
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                    {job.parent?.full_name ?? 'Unknown parent'}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>{pay}</Text>
                    <Text style={{ fontSize: 13, color: '#888' }}>· Applied {dateApplied}</Text>
                  </View>

                  {a.status === 'accepted' && (
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: '#22c55e',
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() =>
                        router.push((`/chat?id=${job.parent?.id ?? ''}&name=${job.parent?.full_name ?? ''}`) as any)
                      }
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#22c55e' }}>Message</Text>
                    </TouchableOpacity>
                  )}

                  {a.status === 'completed' && (
                    <>
                      <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                        Completed · {job.pay_type === 'flat' ? `Earned $${job.pay_rate}` : `$${job.pay_rate}/hr`}
                      </Text>
                      <TouchableOpacity
                        style={{
                          marginTop: 10,
                          borderWidth: 1,
                          borderColor: '#22c55e',
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          height: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={() => router.push((`/review-modal?targetId=${job.parent?.id ?? ''}&jobTitle=${job.title}`) as any)}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#22c55e' }}>Leave Review</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
