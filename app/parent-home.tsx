import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import OfflineBanner from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Application = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  teen: { id: string; full_name: string; age: number | null; rating: number; rating_count: number } | null;
  job: { id: string; title: string } | null;
};

type Job = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: string;
  status: string;
  applications: { count: number }[];
};

type Teen = {
  id: string;
  full_name: string;
  age: number | null;
  neighborhood: string | null;
  skills: string[];
  hourly_rate: number | null;
  rating: number | null;
};

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ParentHome() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [featuredTeens, setFeaturedTeens] = useState<Teen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [jobsRes, teensRes] = await Promise.all([
      supabase.from('jobs').select('id').eq('parent_id', user.id),
      supabase.from('profiles').select('id, full_name, age, neighborhood, skills, hourly_rate, rating').eq('role', 'teen').order('rating', { ascending: false }).limit(6),
    ]);

    const jobIds = (jobsRes.data ?? []).map((j: any) => j.id);

    const [appsRes, myJobsRes, notifRes] = await Promise.all([
      jobIds.length > 0
        ? supabase.from('applications').select('id, status, message, created_at, teen:profiles!teen_id(id, full_name, age, rating, rating_count), job:jobs!job_id(id, title)').in('job_id', jobIds).eq('status', 'pending').order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('jobs').select('id, title, category, pay_rate, pay_type, status, applications(count)').eq('parent_id', user.id).eq('status', 'open').order('created_at', { ascending: false }).limit(3),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
    ]);

    if (appsRes.data) setApplications(appsRes.data as unknown as Application[]);
    if (myJobsRes.data) setMyJobs(myJobsRes.data as unknown as Job[]);
    if (teensRes.data) setFeaturedTeens(teensRes.data as Teen[]);
    setUnreadCount((notifRes as any).count ?? 0);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  async function handleAccept(app: Application) {
    if (!app.teen?.id || !app.job?.id) return;
    setProcessing(app.id);
    try {
      await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
      await supabase.from('jobs').update({ status: 'in_progress', accepted_teen_id: app.teen.id }).eq('id', app.job.id);
      await supabase.from('notifications').insert({
        user_id: app.teen.id,
        type: 'accepted',
        title: 'Application Accepted!',
        body: `You were accepted for "${app.job.title}". Message the parent to confirm details.`,
        read: false,
      });
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      Alert.alert('Accepted!', `${app.teen.full_name} has been accepted for "${app.job.title}".`);
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(app: Application) {
    setProcessing(app.id);
    try {
      await supabase.from('applications').update({ status: 'declined' }).eq('id', app.id);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } finally {
      setProcessing(null);
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const onRefresh = () => { setRefreshing(true); fetchData(); };

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
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 32 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: ds.c.primaryContainer, borderRadius: 20, padding: 18, alignItems: 'center' }}
            onPress={() => router.push('/post-job' as any)}
          >
            <Ionicons name="add-circle-outline" size={24} color={ds.c.white} style={{ marginBottom: 6 }} />
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Post a Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18, alignItems: 'center' }}
            onPress={() => router.push('/(tabs)/my-listings' as any)}
          >
            <Ionicons name="list-outline" size={24} color={ds.c.primary} style={{ marginBottom: 6 }} />
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>My Listings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: ds.c.secondaryContainer, borderRadius: 20, padding: 18, alignItems: 'center' }}
            onPress={() => router.push('/browse-teens' as any)}
          >
            <Ionicons name="people-outline" size={24} color={ds.c.primary} style={{ marginBottom: 6 }} />
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>Browse Teens</Text>
          </TouchableOpacity>
        </View>

        {/* Active jobs preview */}
        {myJobs.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 14 }}>
              <View>
                <Text style={{ ...dsSecondaryLabel, marginBottom: 4 }}>Open now</Text>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Your Active Jobs</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-listings' as any)}>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>See all</Text>
              </TouchableOpacity>
            </View>
            {myJobs.map((job) => {
              const appCount = job.applications?.[0]?.count ?? 0;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={{ marginHorizontal: 24, marginBottom: 10, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18 }}
                  onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, flex: 1 }}>{job.title}</Text>
                    {appCount > 0 && (
                      <View style={{ backgroundColor: ds.c.secondary, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>{appCount} applicant{appCount !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginTop: 4 }}>
                    {job.category} · ${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Featured teens */}
        {featuredTeens.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 14 }}>
              <View>
                <Text style={{ ...dsSecondaryLabel, marginBottom: 4 }}>Browse & invite</Text>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Available Teens</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/browse-teens' as any)}>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
              {featuredTeens.map((teen) => (
                <TouchableOpacity
                  key={teen.id}
                  style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 18, width: 160 }}
                  onPress={() => router.push(`/teen-profile?id=${teen.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white }}>{getInitials(teen.full_name)}</Text>
                  </View>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary, marginBottom: 2 }} numberOfLines={1}>{teen.full_name}</Text>
                  {teen.age ? <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginBottom: 6 }}>Age {teen.age}</Text> : null}
                  {teen.skills && teen.skills.length > 0 ? (
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.secondary }} numberOfLines={1}>{teen.skills.slice(0, 2).join(' · ')}</Text>
                  ) : null}
                  {teen.hourly_rate ? (
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary, marginTop: 6 }}>${teen.hourly_rate}/hr</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Applications received */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Pending</Text>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, letterSpacing: -0.3 }}>
            Applications Received
          </Text>
        </View>

        {applications.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No applications yet"
            subtitle="Post a job to start receiving applications"
            buttonText="Post a Job"
            onButtonPress={() => router.push('/post-job' as any)}
          />
        ) : (
          applications.map((app) => {
            const teen = app.teen;
            if (!teen) return null;
            const initials = getInitials(teen.full_name);
            const isProcessing = processing === app.id;
            return (
              <View key={app.id} style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.white }}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface, marginBottom: 2 }}>
                      {teen.full_name}{teen.age ? `, ${teen.age}` : ''}
                    </Text>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.secondary, marginBottom: 2 }}>
                      Applied for: {app.job?.title ?? 'Unknown job'}
                    </Text>
                    {teen.rating_count > 0 && (
                      <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>
                        ★ {Number(teen.rating).toFixed(1)} ({teen.rating_count} review{teen.rating_count !== 1 ? 's' : ''})
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/teen-profile?id=${teen.id}` as any)}>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.secondary }}>View</Text>
                  </TouchableOpacity>
                </View>

                {app.message ? (
                  <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurface, lineHeight: 19 }}>
                      "{app.message}"
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 12, alignItems: 'center', opacity: isProcessing ? 0.5 : 1 }}
                    onPress={() => handleAccept(app)}
                    disabled={isProcessing}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', opacity: isProcessing ? 0.5 : 1 }}
                    onPress={() => handleDecline(app)}
                    disabled={isProcessing}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.error }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
