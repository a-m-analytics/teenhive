import GradientButton from '@/components/GradientButton';
import PressableScale from '@/components/PressableScale';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { applyToJob, acceptApplication, declineApplication, completeJob } from '@/lib/applicationService';
import { rateLimit } from '@/lib/rateLimiter';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView,
  Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';

type Job = {
  id: string; title: string; category: string; description: string;
  pay_rate: number; pay_type: 'hourly' | 'flat'; location_area: string;
  date: string | null; start_time: string | null; estimated_hours: number | null;
  is_recurring: boolean; recurring_days: string[] | null; frequency: string | null;
  parent_id: string;
  parent: { id: string; full_name: string; is_verified: boolean };
};

function getInitials(name: string) {
  return (name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('jobs').select('*, parent:profiles!parent_id(id, full_name, is_verified, neighborhood)').eq('id', id).single(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('job_id', id),
      user ? supabase.from('applications').select('id, status').eq('job_id', id).eq('teen_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]).then(([jobRes, countRes, appliedRes]) => {
      if (jobRes.data) {
        const j = jobRes.data as Job;
        setJob(j);
        // If viewer is the parent, fetch applicants
        if (user?.id === j.parent_id) {
          supabase
            .from('applications')
            .select('id, status, message, teen_id, teen:profiles!teen_id(id, full_name, age, skills, rating, rating_count, neighborhood, bio)')
            .eq('job_id', id)
            .in('status', ['pending', 'invited'])
            .then(({ data }) => { if (data) setApplicants(data); });
        }
      }
      if (countRes.count != null) setAppCount(countRes.count);
      if (appliedRes.data) {
        setAlreadyApplied(true);
        setAppStatus((appliedRes.data as any)?.status ?? null);
      }
      setLoadingJob(false);
    });
  }, [id, user]);

  const handleApply = async () => {
    if (!user || !job) return;
    try { rateLimit(user.id, 'applyToJob'); } catch (e: any) { Alert.alert('Slow down', e.message); return; }
    setApplying(true);
    try {
      await applyToJob(job.id, user.id, job.parent_id, note, profile?.full_name, job.title);
      setAlreadyApplied(true);
      setAppStatus('pending');
      setModal(false);
      Alert.alert('Application Sent!', "We'll let you know when they respond.", [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleAcceptApplicant = async (appId: string, teenId: string) => {
    if (!job || !user) return;
    const applicant = applicants.find((a) => a.id === appId);
    const teenName = applicant?.teen?.full_name ?? undefined;
    Alert.alert(
      'Accept Application?',
      `Accept ${teenName ?? 'this teen'} for "${job.title}"? Other applicants will be declined.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAcceptingId(appId);
            try {
              await acceptApplication(appId, job.id, teenId, user.id, teenName, job.title);
              setApplicants((prev) => prev.filter((a) => a.id !== appId));
              Alert.alert(
                'Accepted!',
                `${teenName ?? 'The teen'} has been notified. You can now chat.`,
                [
                  {
                    text: 'Go to Chat',
                    onPress: () => router.push(`/chat?id=${teenId}&name=${encodeURIComponent(teenName ?? 'Teen')}` as any),
                  },
                  { text: 'OK', style: 'cancel' },
                ]
              );
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not accept application.');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeclineApplicant = async (appId: string, teenId: string) => {
    try {
      await declineApplication(appId, teenId, job?.title);
      setApplicants((prev) => prev.filter((a) => a.id !== appId));
    } catch {}
  };

  const handleMarkComplete = async () => {
    if (!job || !user) return;
    Alert.alert('Mark Job Complete?', 'Let the parent know you\'ve finished this job.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete',
        onPress: async () => {
          const { data: app } = await supabase.from('applications').select('id').eq('job_id', job.id).eq('teen_id', user.id).eq('status', 'accepted').maybeSingle();
          if (app) {
            await completeJob(job.id, app.id, user.id);
            setAppStatus('completed');
            Alert.alert('Great work!', 'The parent has been notified. Check for a review soon.');
          }
        },
      },
    ]);
  };

  if (loadingJob) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={ds.c.secondary} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant }}>Job not found.</Text>
      </View>
    );
  }

  const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
  const userInitials = profile?.full_name ? getInitials(profile.full_name) : '?';
  const parentInitials = getInitials(job.parent.full_name);

  const statusConfig = {
    accepted: { bg: '#f0fdf4', border: '#86efac', text: 'Application Accepted', textColor: '#16a34a' },
    declined: { bg: '#fef2f2', border: '#fca5a5', text: 'Application Declined', textColor: ds.c.error },
    pending: { bg: ds.c.surfaceContainerLow, border: ds.c.outlineVariant, text: 'Application Sent — Pending', textColor: ds.c.onSurfaceVariant },
  };
  const statusStyle = statusConfig[appStatus as keyof typeof statusConfig] ?? statusConfig.pending;

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* Hero gradient */}
        <LinearGradient colors={ds.gradient} style={{ borderRadius: 0, paddingTop: 56, paddingHorizontal: 24, paddingBottom: 36 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 28 }}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: 'rgba(243,251,244,0.7)' }}>← Back</Text>
          </TouchableOpacity>

          {/* Category label */}
          <View style={{ backgroundColor: ds.c.secondaryContainer, alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{job.category}</Text>
          </View>

          {/* Title */}
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 40, color: ds.c.white, lineHeight: 46, letterSpacing: -0.5, marginBottom: 20 }}>
            {job.title}
          </Text>

          {/* Pay badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cash-outline" size={16} color={ds.c.secondaryContainer} />
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.secondaryContainer }}>{pay}</Text>
            </View>
            {job.estimated_hours ? (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={16} color='rgba(243,251,244,0.7)' />
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: 'rgba(243,251,244,0.8)' }}>{job.estimated_hours}h</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>

          {/* Host info card */}
          <PressableScale
            style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            onPress={() => router.push(`/parent-profile?id=${job.parent_id}` as any)}
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 18, color: ds.c.primary }}>{parentInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface, marginBottom: 2 }}>{job.parent.full_name}</Text>
              {job.parent.is_verified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="shield-checkmark" size={12} color={ds.c.secondary} />
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.secondary, letterSpacing: 0.5 }}>VERIFIED</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>View →</Text>
          </PressableScale>

          {/* Details tiles */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* Pay tile */}
            <View style={{ flex: 1, backgroundColor: ds.c.secondaryContainer, borderRadius: 20, padding: 16 }}>
              <Ionicons name="cash-outline" size={18} color={ds.c.primary} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: 'rgba(5,27,14,0.5)', marginBottom: 2 }}>Pay</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>{pay}</Text>
            </View>
            {/* Date tile */}
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
              <Ionicons name="calendar-outline" size={18} color={ds.c.onSurfaceVariant} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 2 }}>Date</Text>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface }}>
                {job.date ? (() => { try { return new Date(job.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return job.date; } })() : 'TBD'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* Time tile */}
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
              <Ionicons name="time-outline" size={18} color={ds.c.onSurfaceVariant} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 2 }}>Start Time</Text>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface }}>
                {job.start_time ? (() => { try { const [h, m] = job.start_time!.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`; } catch { return job.start_time; } })() : 'TBD'}
              </Text>
            </View>
            {/* Duration tile */}
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
              <Ionicons name="hourglass-outline" size={18} color={ds.c.onSurfaceVariant} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant, marginBottom: 2 }}>Duration</Text>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface }}>
                {job.estimated_hours ? (() => { const h = Math.floor(job.estimated_hours!); const m = Math.round((job.estimated_hours! - h) * 60); return m > 0 ? `${h}h ${m}m` : `${h}h`; })() : 'Flexible'}
              </Text>
            </View>
          </View>

          {/* Location row */}
          {job.location_area ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, gap: 12, marginBottom: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={18} color={ds.c.onSurfaceVariant} />
              </View>
              <View>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant }}>Location</Text>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>{job.location_area}</Text>
              </View>
            </View>
          ) : null}

          {/* Applicants + recurring */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Ionicons name="people-outline" size={14} color={ds.c.onSurfaceVariant} />
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>{appCount} applicant{appCount !== 1 ? 's' : ''}</Text>
            </View>
            {job.is_recurring && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Ionicons name="repeat-outline" size={14} color={ds.c.secondary} />
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>
                  {job.recurring_days?.length ? job.recurring_days.map((d) => d.slice(0,3)).join(' · ') : 'Recurring'}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {job.description ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>About this Job</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>{job.description}</Text>
            </View>
          ) : null}

          {/* ── Applicants — only shown to the job's parent ── */}
          {user?.id === job.parent_id && (
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
                {applicants.length} Applicant{applicants.length !== 1 ? 's' : ''}
              </Text>
              {applicants.length === 0 ? (
                <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>No applications yet</Text>
                </View>
              ) : (
                applicants.map((app) => (
                  <View key={app.id} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary }}>
                          {(app.teen?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface, marginBottom: 2 }}>
                          {app.teen?.full_name ?? 'Unknown'}{app.teen?.age ? `, ${app.teen.age}` : ''}
                        </Text>
                        {app.teen?.neighborhood ? (
                          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{app.teen.neighborhood}</Text>
                        ) : null}
                        {app.teen?.rating_count > 0 && (
                          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.secondary, marginTop: 2 }}>
                            {Number(app.teen.rating).toFixed(1)} ★ ({app.teen.rating_count})
                          </Text>
                        )}
                        {app.status === 'invited' && (
                          <View style={{ backgroundColor: '#ede9fe', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 }}>
                            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 10, color: '#5b21b6' }}>You invited them</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {app.teen?.skills?.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {(app.teen.skills as string[]).slice(0, 4).map((sk: string) => (
                          <View key={sk} style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{sk}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {app.message ? (
                      <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 19, marginBottom: 12 }} numberOfLines={2}>
                        "{app.message}"
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 11, alignItems: 'center' }}
                        onPress={() => router.push(`/teen-profile?id=${app.teen_id}` as any)}
                      >
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface }}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center' }}
                        onPress={() => handleDeclineApplicant(app.id, app.teen_id)}
                      >
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurfaceVariant }}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: acceptingId === app.id ? ds.c.surfaceContainerHigh : ds.c.primary, borderRadius: 9999, paddingVertical: 11, alignItems: 'center', opacity: acceptingId ? 0.7 : 1 }}
                        onPress={() => handleAcceptApplicant(app.id, app.teen_id)}
                        disabled={!!acceptingId}
                      >
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: acceptingId === app.id ? ds.c.onSurfaceVariant : ds.c.white }}>
                          {acceptingId === app.id ? 'Accepting...' : 'Accept'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Apply / Status — hidden from the job's owner */}
          {user?.id !== job.parent_id && (
            alreadyApplied ? (
              <View style={{ gap: 12 }}>
                <View style={{
                  borderWidth: 1.5, borderColor: statusStyle.border,
                  borderRadius: 9999, paddingVertical: 16,
                  justifyContent: 'center', alignItems: 'center',
                  backgroundColor: statusStyle.bg,
                }}>
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: statusStyle.textColor }}>{statusStyle.text}</Text>
                </View>
                {appStatus === 'accepted' && (
                  <TouchableOpacity
                    style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.secondary, paddingVertical: 14, alignItems: 'center' }}
                    onPress={handleMarkComplete}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.secondary }}>Mark Job Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <GradientButton label="Apply for this Job" onPress={() => setModal(true)} fullWidth />
            )
          )}
        </View>
      </ScrollView>

      {/* Apply sheet — teens only */}
      <Modal visible={modal && user?.id !== job?.parent_id} transparent animationType="slide" onRequestClose={() => { Keyboard.dismiss(); setModal(false); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Backdrop — tap to dismiss keyboard */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <View style={{ backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, marginBottom: 4, letterSpacing: -0.3 }}>Apply</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: 24 }}>
              For "{job.title}" with {job.parent.full_name}
            </Text>

            {/* Applicant preview */}
            <View style={{ flexDirection: 'row', gap: 14, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, marginBottom: 20 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary }}>{userInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.onSurface, marginBottom: 2 }}>{profile?.full_name ?? 'You'}</Text>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
                  {profile?.rating ?? 0} rating · {profile?.rating_count ?? 0} reviews
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(profile?.skills ?? []).slice(0, 3).map((sk: string) => (
                    <View key={sk} style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant }}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>Note (optional)</Text>
            <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <TextInput
                style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Introduce yourself or mention your availability..."
                placeholderTextColor={ds.c.outlineVariant}
                value={note}
                onChangeText={setNote}
                multiline
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <GradientButton label="Send Application" onPress={() => { Keyboard.dismiss(); handleApply(); }} loading={applying} fullWidth />
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setModal(false); }} style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
