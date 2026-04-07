import Text from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

type SavedJob = {
  id: string;
  job_id: string;
  job: {
    id: string;
    title: string;
    category: string;
    pay_rate: number;
    pay_type: string;
    location_area: string | null;
    status: string;
    parent: { id: string; full_name: string; is_verified: boolean } | null;
  } | null;
};

export default function SavedJobs() {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_jobs')
      .select('id, job_id, job:jobs(id, title, category, pay_rate, pay_type, location_area, status, parent:profiles!parent_id(id, full_name, is_verified))')
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSaved(data as unknown as SavedJob[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  async function unsave(savedJobId: string) {
    await supabase.from('saved_jobs').delete().eq('id', savedJobId);
    setSaved((prev) => prev.filter((s) => s.id !== savedJobId));
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <Text style={{ fontSize: 24, color: '#22c55e' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111' }}>Saved Jobs</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 40 }} />
      ) : saved.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 20 }}>
            No saved jobs yet. Bookmark jobs from the home feed.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#22c55e', borderRadius: 8, height: 52, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          {saved.map((item) => {
            const job = item.job;
            if (!job) return null;
            const isOpen = job.status === 'open';
            return (
              <TouchableOpacity
                key={item.id}
                style={{
                  borderWidth: 1,
                  borderColor: '#f0f0f0',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: '#fff',
                  opacity: isOpen ? 1 : 0.6,
                }}
                onPress={() => isOpen && router.push(`/job-detail?id=${job.id}` as any)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 }}>{job.title}</Text>
                    <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                      {job.parent?.full_name ?? 'Parent'}
                      {job.parent?.is_verified ? '  ·  Verified' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={() => unsave(item.id)}
                  >
                    <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>{job.category}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#22c55e', fontWeight: '600' }}>
                    ${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}
                  </Text>
                  {job.location_area ? (
                    <Text style={{ fontSize: 13, color: '#aaa' }}>{job.location_area}</Text>
                  ) : null}
                </View>

                {!isOpen && (
                  <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>This job is no longer open</Text>
                )}

                {isOpen && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#22c55e', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}
                    onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>View & Apply</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
