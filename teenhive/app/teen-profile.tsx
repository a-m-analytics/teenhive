import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { trackProfileViewed, trackInviteSent } from '@/lib/analytics';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';

type Teen = {
  id: string; full_name: string; age: number | null; bio: string | null;
  neighborhood: string | null; skills: string[]; availability: string[];
  hourly_rate: number | null; jobs_completed: number; trust_score: number;
};

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getTrustLevel(score: number): { label: string } {
  if (score >= 60) return { label: 'Top Rated' };
  if (score >= 30) return { label: 'Trusted' };
  if (score >= 10) return { label: 'Rising' };
  return { label: 'New' };
}

const REPORT_REASONS = ['Inappropriate behavior', 'Suspicious activity', 'Spam', 'Other'];

export default function TeenProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const isParent = profile?.role === 'parent';
  const [teen, setTeen] = useState<Teen | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [parentJobs, setParentJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('profiles').select('id, full_name, age, bio, neighborhood, skills, availability, hourly_rate, jobs_completed, trust_score').eq('id', id).single().then((teenRes) => {
      if (teenRes.data) setTeen(teenRes.data as Teen);
      setLoading(false);
      if (user && id && user.id !== id) trackProfileViewed(user.id, id, 'teen');
    });
  }, [id]);

  async function openInviteModal() {
    if (!user) return;
    const { data } = await supabase.from('jobs').select('id, title').eq('parent_id', user.id).eq('status', 'open');
    setParentJobs(data ?? []);
    setInviteModal(true);
  }

  async function sendInvite() {
    if (!selectedJobId || !id || !user) return;
    const job = parentJobs.find((j) => j.id === selectedJobId);
    // Check already invited/applied
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', selectedJobId)
      .eq('teen_id', id)
      .maybeSingle();
    if (existing) {
      Alert.alert('Already invited', 'This teen has already been invited or applied.');
      return;
    }
    await supabase.from('applications').insert({ job_id: selectedJobId, teen_id: id, parent_id: user.id, status: 'invited', message: '' });
    const parentName = profile?.full_name ?? 'A parent';
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'job_invitation',
      title: 'You got an invite!',
      body: `${parentName} invited you to: ${job?.title ?? 'a job'}`,
      read: false,
    });
    if (user) trackInviteSent(user.id, id, selectedJobId);
    setInviteModal(false);
    Alert.alert('Invite Sent', `${teen?.full_name} has been invited to "${job?.title}".`);
  }

  async function submitReport() {
    if (!user || !id || !reportReason) return;
    await supabase.from('reports').insert({ reporter_id: user.id, reported_id: id, reason: reportReason, details: reportDetails.trim() || null });
    setReportModal(false);
    setReportReason('');
    setReportDetails('');
    Alert.alert('Report submitted', "We'll review this shortly. Thank you.");
  }

  async function blockUser() {
    if (!user || !id) return;
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: id });
    setMenuVisible(false);
    Alert.alert('User blocked', 'This user will no longer appear in your feed.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ds.c.bg }}>
        <ActivityIndicator size="large" color={ds.c.secondary} />
      </View>
    );
  }

  if (!teen) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ds.c.bg }}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant }}>Profile not found.</Text>
      </View>
    );
  }

  const initials = getInitials(teen.full_name);
  const trust = getTrustLevel(teen.trust_score);

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: (isParent || !user) ? 110 : 60 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={ds.gradient} style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: 'rgba(243,251,244,0.7)' }}>← Back</Text>
            </TouchableOpacity>
            {user && user?.id !== id && (
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="rgba(243,251,244,0.7)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar + name */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 32, color: ds.c.primary }}>{initials}</Text>
            </View>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 36, color: ds.c.white, lineHeight: 42, letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' }}>
              {teen.full_name}
            </Text>
            {teen.age ? (
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 20, color: 'rgba(243,251,244,0.85)', marginBottom: 4 }}>Age {teen.age}</Text>
            ) : null}
            {teen.neighborhood ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location-outline" size={14} color="rgba(243,251,244,0.55)" />
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 16, color: 'rgba(243,251,244,0.55)' }}>{teen.neighborhood}</Text>
              </View>
            ) : null}
          </View>

          {/* Trust + rate badges */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'center' }}>
            <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{trust.label}</Text>
            </View>
            {teen.hourly_rate ? (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>${teen.hourly_rate}/hr</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>

          {/* Stats row */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.secondaryContainer, letterSpacing: -0.3, marginBottom: 2 }}>{String(teen.jobs_completed)}</Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: 'rgba(243,251,244,0.6)', letterSpacing: 0.5 }}>Jobs Done</Text>
            </View>
          </View>

          {/* Bio */}
          {teen.bio ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 10 }}>About</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>{teen.bio}</Text>
            </View>
          ) : null}

          {/* Mastery & Intent (skills + availability) card */}
          {((teen.skills && teen.skills.length > 0) || (teen.availability && teen.availability.length > 0)) && (
            <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 22, marginBottom: 24 }}>
              {teen.skills && teen.skills.length > 0 && (
                <>
                  <Text style={{ ...dsSecondaryLabel, marginBottom: 12 }}>Skills</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: teen.availability?.length > 0 ? 20 : 0 }}>
                    {teen.skills.map((skill) => (
                      <View key={skill} style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 7 }}>
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {teen.availability && teen.availability.length > 0 && (
                <>
                  <Text style={{ ...dsSecondaryLabel, marginBottom: 12 }}>Availability</Text>
                  <View style={{ gap: 8 }}>
                    {teen.availability.map((slot) => (
                      <View key={slot} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ds.c.secondary }} />
                        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurface }}>{slot}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Invite CTA for parents */}
      {isParent && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: ds.c.bg }}>
          <GradientButton label="Invite to Job" onPress={openInviteModal} fullWidth />
        </View>
      )}

      {/* Sign up CTA for guests */}
      {!user && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: ds.c.bg }}>
          <TouchableOpacity
            style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 18, alignItems: 'center' }}
            onPress={() => router.push({ pathname: '/signup', params: { role: 'parent' } } as any)}
          >
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white, letterSpacing: 1 }}>Sign Up to Invite</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, marginBottom: 20, letterSpacing: -0.3 }}>Select a Job</Text>
            {parentJobs.length === 0 ? (
              <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: 20 }}>No open listings. Post a job first.</Text>
            ) : (
              parentJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={{
                    padding: 16, borderRadius: 16, marginBottom: 8,
                    backgroundColor: selectedJobId === job.id ? ds.c.primaryContainer : ds.c.surfaceContainerLow,
                  }}
                  onPress={() => setSelectedJobId(job.id)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: selectedJobId === job.id ? ds.c.white : ds.c.onSurface }}>{job.title}</Text>
                </TouchableOpacity>
              ))
            )}
            <View style={{ marginTop: 8 }}>
              <GradientButton label="Send Invite" onPress={sendInvite} fullWidth />
            </View>
            <TouchableOpacity onPress={() => setInviteModal(false)} style={{ marginTop: 4, alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3-dot menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)}>
          <View style={{ position: 'absolute', top: 80, right: 24, backgroundColor: ds.c.bg, borderRadius: 20, borderWidth: 1, borderColor: ds.c.outlineVariant, overflow: 'hidden', minWidth: 180 }}>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: ds.c.outlineVariant }} onPress={() => { setMenuVisible(false); setReportModal(true); }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurface }}>Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 16 }} onPress={blockUser}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.error }}>Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal visible={reportModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, marginBottom: 20, letterSpacing: -0.3 }}>Report User</Text>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>Reason</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={{
                  padding: 14, borderRadius: 14, marginBottom: 8,
                  backgroundColor: reportReason === r ? ds.c.primaryContainer : ds.c.surfaceContainerLow,
                }}
                onPress={() => setReportReason(r)}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: reportReason === r ? ds.c.white : ds.c.onSurface }}>{r}</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginTop: 12, marginBottom: 8 }}>Details (optional)</Text>
            <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 14, marginBottom: 20 }}>
              <TextInput
                style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 72, textAlignVertical: 'top' }}
                placeholder="Describe what happened..."
                placeholderTextColor={ds.c.outlineVariant}
                value={reportDetails}
                onChangeText={setReportDetails}
                multiline
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit
              />
            </View>
            <GradientButton label="Submit Report" onPress={submitReport} fullWidth />
            <TouchableOpacity onPress={() => setReportModal(false)} style={{ marginTop: 4, alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
