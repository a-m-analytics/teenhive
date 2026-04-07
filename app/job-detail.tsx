import GradientButton from '@/components/GradientButton';
import PressableScale from '@/components/PressableScale';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { applyToJob } from '@/lib/applicationService';
import { rateLimit } from '@/lib/rateLimiter';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';

type Job = {
  id: string; title: string; category: string; description: string;
  pay_rate: number; pay_type: 'hourly' | 'flat'; location_area: string;
  date: string; estimated_hours: number | null; is_recurring: boolean;
  frequency: string | null; parent_id: string;
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

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('jobs').select('*, parent:profiles!parent_id(id, full_name, is_verified)').eq('id', id).single(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('job_id', id),
      user ? supabase.from('applications').select('id, status').eq('job_id', id).eq('teen_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]).then(([jobRes, countRes, appliedRes]) => {
      if (jobRes.data) setJob(jobRes.data as Job);
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
      await applyToJob(job.id, user.id, job.parent_id, note);
      setAlreadyApplied(true);
      setAppStatus('pending');
      setModal(false);
      Alert.alert('Applied!', `Your application was sent to ${job.parent.full_name}.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit application.');
    } finally {
      setApplying(false);
    }
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

          {/* Details grid */}
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 4, marginBottom: 20, overflow: 'hidden' }}>
            {[
              { icon: 'cash-outline' as const, label: 'Pay', value: pay, highlight: true },
              { icon: 'hourglass-outline' as const, label: 'Est. Time', value: job.estimated_hours ? `${job.estimated_hours} hrs` : '—' },
              { icon: 'location-outline' as const, label: 'Location', value: job.location_area || '—' },
              { icon: 'people-outline' as const, label: 'Applicants', value: String(appCount) },
              ...(job.is_recurring ? [{ icon: 'repeat-outline' as const, label: 'Recurring', value: job.frequency ?? 'Yes' }] : []),
            ].map(({ icon, label, value, highlight }, i, arr) => (
              <View
                key={label}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 18, paddingVertical: 14,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: ds.c.surfaceContainerHigh,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={icon} size={16} color={ds.c.onSurfaceVariant} />
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>{label}</Text>
                </View>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: highlight ? ds.c.secondary : ds.c.onSurface }}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {job.description ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>About this Job</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>{job.description}</Text>
            </View>
          ) : null}

          {/* Apply / Status */}
          {alreadyApplied ? (
            <View style={{
              borderWidth: 1.5, borderColor: statusStyle.border,
              borderRadius: 9999, paddingVertical: 16,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: statusStyle.bg,
            }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: statusStyle.textColor }}>{statusStyle.text}</Text>
            </View>
          ) : (
            <GradientButton label="Apply for this Job" onPress={() => setModal(true)} fullWidth />
          )}
        </View>
      </ScrollView>

      {/* Apply sheet */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
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
              />
            </View>

            <GradientButton label="Send Application" onPress={handleApply} loading={applying} fullWidth />
            <TouchableOpacity onPress={() => setModal(false)} style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
