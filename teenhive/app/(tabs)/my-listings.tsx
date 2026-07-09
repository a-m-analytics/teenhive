import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { acceptApplication, completeJob, declineApplication } from '@/lib/applicationService';
import { ds, dsSecondaryLabel } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TABS = ['Active', 'In Progress', 'Completed'];

type Applicant = {
  id: string;
  job_id: string;
  teen_id: string;
  status: string;
  created_at: string;
  teen: { id: string; full_name: string; rating: number; jobs_completed: number } | null;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: string;
  status: string;
  created_at: string;
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    accepted: { bg: '#d1fae5', color: '#065f46', label: 'Accepted' },
    declined: { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
    invited:  { bg: '#ede9fe', color: '#5b21b6', label: 'Invited' },
  };
  const s = map[status] ?? { bg: ds.c.surfaceContainerHigh, color: ds.c.onSurfaceVariant, label: status };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function MyListingsTab() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [acceptedTeens, setAcceptedTeens] = useState<Record<string, { id: string; full_name: string }>>({});
  const [loading, setLoading] = useState(true);
  const isParent = profile?.role === 'parent';

  // NOTE: isParent is intentionally NOT in fetchListings deps.
  // When the screen first focuses, profile may not be loaded yet (isParent=false).
  // useFocusEffect won't re-run while screen stays focused, so if we bail on
  // !isParent we'll never load. The query filters by user.id anyway.
  const fetchListings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    // Don't use accepted_teen:profiles!accepted_teen_id — column may not exist yet
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, category, pay_rate, pay_type, status, created_at')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setListings(data as unknown as Listing[]);
      // Fetch applicant details for all listed jobs
      const jobIds = data.map((j: any) => j.id);
      if (jobIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, teen_id, status, created_at, teen:profiles!teen_id(id, full_name, rating, jobs_completed)')
          .in('job_id', jobIds)
          .in('status', ['pending', 'accepted', 'invited', 'completed']);
        if (apps) {
          setApplicants(apps.filter((a: any) => a.status !== 'completed') as unknown as Applicant[]);
          // Build map of job_id → accepted/completed teen (for review button)
          const map: Record<string, { id: string; full_name: string }> = {};
          for (const a of apps as any[]) {
            if ((a.status === 'accepted' || a.status === 'completed') && a.teen) map[a.job_id] = a.teen;
          }
          setAcceptedTeens(map);
        }
      }
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  if (authLoading || loading) return <LoadingScreen />;
  // Non-parents see empty state; AuthGate handles unauthenticated redirect
  if (!user || !isParent) return <LoadingScreen />;

  const active = listings.filter((l) => l.status === 'open');
  const inProgress = listings.filter((l) => l.status === 'in_progress');
  const completed = listings.filter((l) => l.status === 'completed');
  const current = tab === 'Active' ? active : tab === 'In Progress' ? inProgress : completed;

  const tabCounts: Record<string, number> = {
    Active: active.length,
    'In Progress': inProgress.length,
    Completed: completed.length,
  };

  const emptyMsg: Record<string, string> = {
    Active: 'No active listings',
    'In Progress': 'No jobs in progress',
    Completed: 'No completed jobs yet',
  };

  async function acceptApplicant(app: Applicant, listing: Listing) {
    const teenName = app.teen?.full_name ?? 'this teen';
    Alert.alert(
      'Accept Applicant?',
      `Accept ${teenName} for "${listing.title}"? All other applicants will be declined.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            await acceptApplication(app.id, listing.id, app.teen_id, user!.id, teenName, listing.title);
            fetchListings();
          },
        },
      ]
    );
  }

  async function declineApplicant(appId: string, teenId: string, jobTitle: string) {
    await declineApplication(appId, teenId, jobTitle);
    fetchListings();
  }

  async function deleteListing(listing: Listing) {
    Alert.alert(
      'Delete Job',
      `Delete "${listing.title}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('jobs').delete().eq('id', listing.id);
            fetchListings();
          },
        },
      ]
    );
  }

  async function markComplete(listing: Listing) {
    Alert.alert('Mark as Complete?', 'This will mark the job done and notify the teen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete',
        onPress: async () => {
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
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 }}>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Your jobs</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, letterSpacing: -0.5 }}>My Listings</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => {
          const isActive = tab === t;
          const count = tabCounts[t];
          return (
            <TouchableOpacity
              key={t}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
                backgroundColor: isActive ? ds.c.primary : ds.c.surfaceContainerLow,
              }}
              onPress={() => setTab(t)}
            >
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: isActive ? ds.c.white : ds.c.onSurfaceVariant }}>
                {t}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {current.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title={tab === 'Active' ? 'No jobs posted yet' : emptyMsg[tab]}
          subtitle={tab === 'Active' ? 'Post your first job to find local teens' : ''}
          buttonText={tab === 'Active' ? 'Post a Job' : undefined}
          onButtonPress={tab === 'Active' ? () => router.push('/post-job' as any) : undefined}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {current.map((listing) => {
            const jobApplicants = applicants.filter((a) => a.job_id === listing.id);
            const pendingApps = jobApplicants.filter((a) => a.status === 'pending' || a.status === 'invited');
            const pay = `$${listing.pay_rate}${listing.pay_type === 'hourly' ? '/hr' : ' flat'}`;
            return (
              <View
                key={listing.id}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>
                    {listing.title}
                  </Text>
                  <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>{pay}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{listing.category}</Text>
                  </View>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>
                    Posted {formatDate(listing.created_at)}
                  </Text>
                </View>

                {tab === 'Active' && (
                  <View>
                    {/* Applicants list */}
                    {pendingApps.length > 0 && (
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurfaceVariant, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
                          Applicants ({pendingApps.length})
                        </Text>
                        {pendingApps.map((app) => (
                          <View key={app.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: ds.c.surfaceContainerHigh }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>
                                {app.teen?.full_name ?? 'Unknown'}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <StatusBadge status={app.status} />
                                {(app.teen?.jobs_completed ?? 0) > 0 && (
                                  <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant }}>
                                    {app.teen!.jobs_completed} jobs done
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              {app.status === 'pending' ? (
                                <>
                                  <TouchableOpacity
                                    style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 }}
                                    onPress={() => acceptApplicant(app, listing)}
                                  >
                                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>Accept</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 }}
                                    onPress={() => declineApplicant(app.id, app.teen_id, listing.title)}
                                  >
                                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurfaceVariant }}>Decline</Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <View style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, opacity: 0.5 }}>
                                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurfaceVariant }}>Awaiting Teen</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {pendingApps.length === 0 && (
                      <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.outlineVariant, marginBottom: 14 }}>
                        No applications yet
                      </Text>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => router.push(`/browse-teens?jobId=${listing.id}&jobTitle=${encodeURIComponent(listing.title)}` as any)}
                      >
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Invite a Teen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => router.push(`/post-job?jobId=${listing.id}` as any)}
                      >
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => deleteListing(listing)}
                      >
                        <Ionicons name="trash-outline" size={16} color={ds.c.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tab === 'In Progress' && (() => {
                  const teen = acceptedTeens[listing.id];
                  return (
                    <View>
                      {teen && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>
                              {teen.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>{teen.full_name}</Text>
                            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Working on this job</Text>
                          </View>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {teen && (
                          <TouchableOpacity
                            style={{ flex: 1, borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                            onPress={() => router.push(`/chat?id=${teen.id}&name=${encodeURIComponent(teen.full_name)}` as any)}
                          >
                            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>Message</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                          onPress={() => markComplete(listing)}
                        >
                          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Mark Complete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {tab === 'Completed' && acceptedTeens[listing.id] && (
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 14, alignItems: 'center' }}
                    onPress={() => router.push(`/review-modal?jobId=${listing.id}&revieweeId=${acceptedTeens[listing.id].id}&jobTitle=${encodeURIComponent(listing.title)}` as any)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface }}>
                      Leave a Review for {acceptedTeens[listing.id].full_name.split(' ')[0]}
                    </Text>
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
