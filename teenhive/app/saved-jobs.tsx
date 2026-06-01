import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={ds.c.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Jobs</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={ds.c.secondary} />
        </View>
      ) : saved.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="bookmark-outline" size={36} color={ds.c.secondary} />
          </View>
          <Text style={s.emptyTitle}>No saved jobs yet.</Text>
          <Text style={s.emptySubtitle}>
            Bookmark jobs from the home feed to keep track of ones you're interested in.
          </Text>
          <TouchableOpacity style={s.browseBtn} onPress={() => router.back()}>
            <Text style={s.browseBtnText}>BROWSE JOBS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}
        >
          <Text style={s.countText}>{saved.length} saved {saved.length === 1 ? 'job' : 'jobs'}</Text>
          {saved.map((item) => {
            const job = item.job;
            if (!job) return null;
            const isOpen = job.status === 'open';
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.card, !isOpen && { opacity: 0.55 }]}
                onPress={() => isOpen && router.push(`/job-detail?id=${job.id}` as any)}
                activeOpacity={isOpen ? 0.7 : 1}
              >
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.jobTitle} numberOfLines={2}>{job.title}</Text>
                    <View style={s.parentRow}>
                      <Text style={s.parentName}>{job.parent?.full_name ?? 'Parent'}</Text>
                      {job.parent?.is_verified && (
                        <>
                          <Text style={s.dot}>·</Text>
                          <Ionicons name="shield-checkmark" size={13} color={ds.c.secondary} />
                          <Text style={s.verifiedText}>Verified</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => unsave(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="bookmark" size={20} color={ds.c.secondary} />
                  </TouchableOpacity>
                </View>

                <View style={s.tagRow}>
                  <View style={s.categoryChip}>
                    <Text style={s.categoryChipText}>{job.category}</Text>
                  </View>
                  <View style={s.payChip}>
                    <Text style={s.payText}>
                      ${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}
                    </Text>
                  </View>
                  {job.location_area ? (
                    <View style={s.locationChip}>
                      <Ionicons name="location-outline" size={11} color={ds.c.onSurfaceVariant} />
                      <Text style={s.locationText}>{job.location_area}</Text>
                    </View>
                  ) : null}
                </View>

                {!isOpen && (
                  <View style={s.closedBadge}>
                    <Text style={s.closedBadgeText}>No longer accepting applications</Text>
                  </View>
                )}

                {isOpen && (
                  <TouchableOpacity
                    style={s.applyBtn}
                    onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
                  >
                    <Text style={s.applyBtnText}>VIEW & APPLY</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: ds.c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary },

  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: ds.c.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontFamily: ds.f.serifBold, fontSize: 24, color: ds.c.primary, marginBottom: 10 },
  emptySubtitle: {
    fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant,
    textAlign: 'center', lineHeight: 21, marginBottom: 32,
  },
  browseBtn: {
    backgroundColor: ds.c.primary, borderRadius: 100,
    paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center',
  },
  browseBtnText: { fontFamily: ds.f.sansBold, fontSize: 13, color: '#fff', letterSpacing: 1 },

  countText: {
    fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant,
    marginBottom: 14,
  },

  card: {
    backgroundColor: ds.c.surfaceContainerLow,
    borderRadius: 20, padding: 18, marginBottom: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  jobTitle: {
    fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary,
    marginBottom: 4, lineHeight: 22,
  },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  parentName: { fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant },
  dot: { fontFamily: ds.f.sans, fontSize: 13, color: ds.c.outlineVariant },
  verifiedText: { fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.secondary },
  removeBtn: { marginLeft: 8, padding: 4 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  categoryChip: {
    backgroundColor: ds.c.surfaceContainerHigh,
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
  },
  categoryChipText: { fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant },
  payChip: {
    backgroundColor: ds.c.secondaryContainer,
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
  },
  payText: { fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.secondary },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: ds.c.surfaceContainerHigh,
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5,
  },
  locationText: { fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant },

  closedBadge: {
    marginTop: 12, backgroundColor: '#fef2f2', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  closedBadgeText: { fontFamily: ds.f.sansMedium, fontSize: 12, color: '#ef4444' },

  applyBtn: {
    marginTop: 14, backgroundColor: ds.c.primary,
    borderRadius: 100, paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { fontFamily: ds.f.sansBold, fontSize: 13, color: '#fff', letterSpacing: 1 },
});
