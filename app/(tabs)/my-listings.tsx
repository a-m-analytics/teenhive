import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { completeJob } from '@/lib/applicationService';
import { supabase } from '@/lib/supabase';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';

const TABS = ['Active', 'In Progress', 'Completed'];

type Listing = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: string;
  status: string;
  created_at: string;
  applications: { count: number }[];
  accepted_teen: { id: string; full_name: string } | null;
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function MyListingsTab() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const isParent = profile?.role === 'parent';

  const fetchListings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    if (!isParent) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select(`
        id, title, category, pay_rate, pay_type, status, created_at,
        applications(count),
        accepted_teen:profiles!accepted_teen_id(id, full_name)
      `)
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setListings(data as unknown as Listing[]);
    setLoading(false);
  }, [user, isParent]);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  if (!authLoading && !isParent) return <Redirect href="/(tabs)/my-jobs" />;

  const active = listings.filter((l) => l.status === 'open');
  const inProgress = listings.filter((l) => l.status === 'in_progress');
  const completed = listings.filter((l) => l.status === 'completed');
  const current = tab === 'Active' ? active : tab === 'In Progress' ? inProgress : completed;

  const emptyMsg: Record<string, string> = {
    Active: 'No active listings. Post your first job.',
    'In Progress': 'No jobs in progress.',
    Completed: 'No completed jobs yet.',
  };

  async function markComplete(listing: Listing) {
    Alert.alert('Mark as Complete?', 'This will mark the job done and notify the teen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete',
        onPress: async () => {
          // Get accepted application for this job
          const { data: app } = await supabase
            .from('applications')
            .select('id, teen_id, teen:profiles!teen_id(full_name)')
            .eq('job_id', listing.id)
            .eq('status', 'accepted')
            .maybeSingle();

          if (app?.teen_id && app?.id) {
            await completeJob(listing.id, app.id, app.teen_id);
          }

          fetchListings();

          if (app?.teen_id) {
            const teenName = (app.teen as any)?.full_name ?? 'the teen';
            Alert.alert(
              'Job Complete!',
              `Would you like to leave a review for ${teenName}?`,
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Leave Review',
                  onPress: () => router.push(`/review-modal?jobId=${listing.id}&revieweeId=${app.teen_id}&jobTitle=${encodeURIComponent(listing.title)}` as any),
                },
              ]
            );
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', paddingHorizontal: 24, marginBottom: 20 }}>
        My Listings
      </Text>

      {/* Tabs */}
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
            <Text style={{ fontSize: 13, fontWeight: tab === t ? '700' : '500', color: tab === t ? '#22c55e' : '#888' }}>
              {t}
              {t === 'Active' && active.length > 0 ? `  ${active.length}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 40 }} />
      ) : current.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 20 }}>{emptyMsg[tab]}</Text>
          {tab === 'Active' && (
            <TouchableOpacity
              style={{ backgroundColor: '#22c55e', borderRadius: 8, height: 52, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => router.push('/post-job' as any)}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Post a Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          {current.map((listing) => {
            const appCount = listing.applications?.[0]?.count ?? 0;
            const pay = `$${listing.pay_rate}${listing.pay_type === 'hourly' ? '/hr' : ' flat'}`;
            return (
              <View
                key={listing.id}
                style={{ borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: '#fff' }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', flex: 1 }}>{listing.title}</Text>
                  <TouchableOpacity onPress={() => router.push((`/post-job?id=${listing.id}`) as any)}>
                    <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>{listing.category}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>{pay}</Text>
                </View>

                <Text style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Posted {formatDate(listing.created_at)}</Text>

                {tab === 'Active' && (
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: '#22c55e', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => router.push((`/job-detail?id=${listing.id}`) as any)}
                  >
                    <Text style={{ fontSize: 14, color: '#22c55e', fontWeight: '600' }}>
                      View Applications{appCount > 0 ? `  (${appCount})` : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                {tab === 'In Progress' && (
                  <View>
                    {listing.accepted_teen && (
                      <Text style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
                        Teen: {listing.accepted_teen.full_name}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={{ backgroundColor: '#22c55e', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => markComplete(listing)}
                    >
                      <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>Mark as Complete</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {tab === 'Completed' && (
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => router.push(`/review-modal?jobId=${listing.id}&revieweeId=${listing.accepted_teen?.id ?? ''}&jobTitle=${encodeURIComponent(listing.title)}` as any)}
                  >
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>Leave a Review</Text>
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
