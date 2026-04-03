import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CAT_COLORS: Record<string, string> = {
  'Yard Work': '#22c55e', Babysitting: '#ec4899', Tutoring: '#3b82f6',
  'Pet Care': '#f59e0b', 'Tech Help': '#8b5cf6', Cleaning: '#06b6d4', Errands: '#f97316',
};

type Job = {
  id: string;
  title: string;
  category: string;
  description: string;
  pay_rate: number;
  pay_type: 'hourly' | 'flat';
  location_area: string;
  date: string;
  estimated_hours: number | null;
  is_recurring: boolean;
  frequency: string | null;
  parent_id: string;
  parent: { full_name: string; is_verified: boolean };
};

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob();
  }, [id]);

  async function fetchJob() {
    const [jobRes, countRes, appliedRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, parent:profiles!parent_id(full_name, is_verified)')
        .eq('id', id)
        .single(),
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', id),
      user
        ? supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('teen_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (jobRes.data) setJob(jobRes.data as Job);
    if (countRes.count != null) setAppCount(countRes.count);
    if (appliedRes.data) setAlreadyApplied(true);
    setLoadingJob(false);
  }

  const handleConfirmApply = async () => {
    if (!user || !job) return;
    setApplying(true);
    const { error } = await supabase.from('applications').insert({
      job_id: job.id,
      teen_id: user.id,
      parent_id: job.parent_id,
      message: note,
    });
    setApplying(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setAlreadyApplied(true);
    setModalVisible(false);
    Alert.alert('Applied! 🎉', `Your profile has been sent to ${job.parent.full_name}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (loadingJob) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={s.loadingScreen}>
        <Text style={{ color: '#94a3b8' }}>Job not found.</Text>
      </View>
    );
  }

  const catColor = CAT_COLORS[job.category] || '#22c55e';
  const parentInitials = job.parent.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const payLabel = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
  const hoursLabel = job.estimated_hours ? `${job.estimated_hours} hr${job.estimated_hours !== 1 ? 's' : ''}` : '—';
  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase()
    : 'ME';

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={[s.categoryBanner, { backgroundColor: catColor + '15' }]}>
        <View style={[s.pill, { backgroundColor: catColor + '25' }]}>
          <Text style={[s.pillText, { color: catColor }]}>{job.category}</Text>
        </View>
        {job.is_recurring && <Text style={s.recurring}>🔁 {job.frequency ?? 'Recurring'}</Text>}
      </View>
      <Text style={s.title}>{job.title}</Text>
      <TouchableOpacity style={s.parentRow} onPress={() => router.push(`/parent-profile?initials=${parentInitials}&chatId=1`)}>
        <View style={[s.parentCircle, { backgroundColor: catColor + '25' }]}>
          <Text style={[s.parentInitials, { color: catColor }]}>{parentInitials}</Text>
        </View>
        <Text style={s.parentName}>{job.parent.full_name}</Text>
        {job.parent.is_verified && <Text style={s.verified}>✅ Verified ›</Text>}
      </TouchableOpacity>
      <View style={s.infoCard}>
        {[['💰 Pay Rate', payLabel], ['⏱ Est. Time', hoursLabel], ['📍 Location', job.location_area || '—']].map(([label, value]) => (
          <View key={label} style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
          </View>
        ))}
        <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={s.infoLabel}>👥 Applicants</Text>
          <Text style={s.infoValue}>{appCount}</Text>
        </View>
      </View>
      {job.description ? (
        <>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.description}>{job.description}</Text>
        </>
      ) : null}

      {alreadyApplied
        ? <View style={s.appliedBadge}><Text style={s.appliedText}>✓ You already applied to this job</Text></View>
        : <TouchableOpacity style={s.applyBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.applyBtnText}>Apply for this Job</Text>
          </TouchableOpacity>
      }

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Send Application</Text>
            <Text style={s.modalSub}>to {job.parent.full_name} for "{job.title}"</Text>

            <View style={s.profilePreview}>
              <View style={s.previewCircle}>
                <Text style={s.previewInitials}>{userInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{profile?.full_name || 'Your Name'}</Text>
                <Text style={s.previewRating}>⭐ {profile?.rating ?? 0} · {profile?.rating_count ?? 0} reviews</Text>
                <View style={s.previewSkills}>
                  {(profile?.skills ?? []).slice(0, 3).map(sk => <Text key={sk} style={s.skillTag}>{sk}</Text>)}
                </View>
              </View>
            </View>

            <Text style={s.noteLabel}>Add a note (optional)</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Hi! I'm available this weekend and have my own equipment..."
              value={note}
              onChangeText={setNote}
              multiline
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity style={[s.confirmBtn, applying && { opacity: 0.7 }]} onPress={handleConfirmApply} disabled={applying}>
              {applying ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>Send Application</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  categoryBanner: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 13, fontWeight: '700' },
  recurring: { fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  parentCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  parentInitials: { fontWeight: '800', fontSize: 14 },
  parentName: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 },
  verified: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  infoCard: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 4, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 28 },
  applyBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  appliedBadge: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#22c55e' },
  appliedText: { color: '#16a34a', fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  profilePreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 16 },
  previewCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  previewInitials: { color: '#fff', fontWeight: '800', fontSize: 16 },
  previewName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  previewRating: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  previewSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: { backgroundColor: '#f0fdf4', color: '#16a34a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  noteLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  noteInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 90, textAlignVertical: 'top', color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 16 },
  confirmBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
});
