import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

type Parent = {
  id: string;
  full_name: string;
  neighborhood: string | null;
  bio: string | null;
  is_verified: boolean;
  jobs_posted: number;
  rating: number;
  rating_count: number;
};

type Job = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string } | null;
};

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const REPORT_REASONS = ['Inappropriate behavior', 'Suspicious activity', 'Spam', 'Other'];

export default function ParentProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [parent, setParent] = useState<Parent | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('profiles').select('id, full_name, neighborhood, bio, is_verified, jobs_posted, rating, rating_count').eq('id', id).single(),
      supabase.from('jobs').select('id, title, category, pay_rate, pay_type').eq('parent_id', id).eq('status', 'open').limit(5),
      supabase.from('reviews').select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name)').eq('reviewee_id', id).order('created_at', { ascending: false }),
    ]).then(([parentRes, jobsRes, reviewsRes]) => {
      if (parentRes.data) setParent(parentRes.data as Parent);
      if (jobsRes.data) setJobs(jobsRes.data as Job[]);
      if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[]);
      setLoading(false);
    });
  }, [id]);

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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}><ActivityIndicator size="large" color="#22c55e" /></View>;
  if (!parent) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}><Text style={{ color: '#888' }}>Profile not found.</Text></View>;

  const initials = getInitials(parent.full_name);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Back + menu */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 16, color: '#22c55e', fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          {user?.id !== id && (
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Text style={{ fontSize: 22, color: '#888', lineHeight: 22 }}>···</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile header */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#555' }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 6 }}>{parent.full_name}</Text>
          {parent.is_verified && (
            <View style={{ backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#16a34a', fontWeight: '600' }}>Verified Parent</Text>
            </View>
          )}
          {parent.neighborhood ? (
            <Text style={{ fontSize: 14, color: '#888' }}>{parent.neighborhood}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginHorizontal: 24, borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          {[
            { label: 'Jobs Posted', value: parent.jobs_posted ?? jobs.length },
            { label: 'Avg Rating', value: parent.rating_count > 0 ? Number(parent.rating).toFixed(1) : '—' },
            { label: 'Reviews', value: parent.rating_count },
          ].map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>{s.value}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {parent.bio ? (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 8 }}>About</Text>
            <Text style={{ fontSize: 15, color: '#444', lineHeight: 22 }}>{parent.bio}</Text>
          </View>
        ) : null}

        {/* Active Listings */}
        {jobs.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 }}>Active Listings</Text>
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={{ borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, padding: 16, marginBottom: 10 }}
                onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{job.title}</Text>
                  <Text style={{ fontSize: 14, color: '#22c55e', fontWeight: '600' }}>
                    ${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}
                  </Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>{job.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 }}>Reviews from Teens</Text>
          {reviews.length === 0 ? (
            <Text style={{ fontSize: 14, color: '#888' }}>No reviews yet.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={{ borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111' }}>{r.reviewer?.full_name ?? 'Anonymous'}</Text>
                  <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>{r.rating}/5</Text>
                </View>
                {r.comment ? <Text style={{ fontSize: 14, color: '#555', lineHeight: 20 }}>{r.comment}</Text> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Message button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#22c55e', borderRadius: 8, height: 52, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push(`/chat?id=${id}&name=${encodeURIComponent(parent.full_name)}` as any)}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Message {parent.full_name.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>

      {/* 3-dot menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)}>
          <View style={{ position: 'absolute', top: 80, right: 24, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden', minWidth: 180 }}>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => { setMenuVisible(false); setReportModal(true); }}>
              <Text style={{ fontSize: 15, color: '#111' }}>Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 14 }} onPress={blockUser}>
              <Text style={{ fontSize: 15, color: '#ef4444' }}>Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 }}>Report User</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 10 }}>Reason</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={{ padding: 14, borderRadius: 8, borderWidth: 1, borderColor: reportReason === r ? '#22c55e' : '#e5e5e5', backgroundColor: reportReason === r ? '#f0fdf4' : '#fff', marginBottom: 8 }}
                onPress={() => setReportReason(r)}
              >
                <Text style={{ fontSize: 14, color: reportReason === r ? '#22c55e' : '#111', fontWeight: '500' }}>{r}</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111', marginTop: 8, marginBottom: 8 }}>Additional details (optional)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, fontSize: 14, color: '#111', minHeight: 70, textAlignVertical: 'top', marginBottom: 16 }}
              placeholder="Describe what happened..."
              placeholderTextColor="#aaa"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
            />
            <TouchableOpacity
              style={{ backgroundColor: reportReason ? '#22c55e' : '#e5e5e5', borderRadius: 8, height: 52, justifyContent: 'center', alignItems: 'center' }}
              onPress={submitReport}
              disabled={!reportReason}
            >
              <Text style={{ color: reportReason ? '#fff' : '#aaa', fontSize: 15, fontWeight: '600' }}>Submit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReportModal(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
