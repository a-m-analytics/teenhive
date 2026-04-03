import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = ['Applied', 'Active', 'Completed'];

const CAT_COLORS: Record<string, string> = {
  'Yard Work': '#22c55e', Babysitting: '#ec4899', Tutoring: '#3b82f6',
  'Pet Care': '#f59e0b', 'Tech Help': '#8b5cf6', Cleaning: '#06b6d4', Errands: '#f97316',
};

type AppWithJob = {
  id: string;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    category: string;
    pay_rate: number;
    pay_type: string;
    date: string | null;
    parent_id: string;
    parent: { full_name: string };
  } | null;
};

export default function MyJobsTab() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('Applied');
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeen = profile?.role !== 'parent';

  const fetchApps = useCallback(async () => {
    if (!user || !isTeen) return;
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, created_at,
        job:jobs(
          id, title, category, pay_rate, pay_type, date,
          parent:profiles!parent_id(full_name)
        )
      `)
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setApps(data as AppWithJob[]);
    setLoading(false);
  }, [user, isTeen]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  if (!isTeen) {
    return <Redirect href={'/my-listings' as any} />;
  }

  const applied = apps.filter(a => a.status === 'pending');
  const active = apps.filter(a => a.status === 'accepted');
  const completed = apps.filter(a => a.status === 'completed');

  const renderCard = (a: AppWithJob, showMsg: boolean) => {
    const job = a.job;
    if (!job) return null;
    const color = CAT_COLORS[job.category] || '#22c55e';
    const payLabel = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
    const appliedDate = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <View key={a.id} style={s.card}>
        <View style={s.cardTop}>
          <View style={[s.pill, { backgroundColor: color + '20' }]}>
            <Text style={[s.pillText, { color }]}>{job.category}</Text>
          </View>
          {a.status === 'pending' && <View style={s.pendingBadge}><Text style={s.pendingText}>Pending</Text></View>}
          {a.status === 'accepted' && <View style={s.acceptedBadge}><Text style={s.acceptedText}>Accepted ✓</Text></View>}
          {a.status === 'completed' && <Text style={s.earned}>{payLabel}</Text>}
        </View>
        <Text style={s.cardTitle}>{job.title}</Text>
        <Text style={s.cardSub}>{job.parent.full_name} · {payLabel}</Text>
        {a.status === 'pending' && <Text style={s.cardDate}>Applied {appliedDate}</Text>}
        {showMsg && (
          <TouchableOpacity style={s.msgBtn} onPress={() => router.push(`/chat?id=1&name=${job.parent.full_name}`)}>
            <Text style={s.msgBtnText}>💬 Message {job.parent.full_name.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const current = tab === 'Applied' ? applied : tab === 'Active' ? active : completed;
  const emptyMessages: Record<string, string> = {
    Applied: 'No pending applications.',
    Active: 'No active jobs yet. Keep applying!',
    Completed: 'No completed jobs yet.',
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>My Jobs</Text>

      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t}</Text>
            {t === 'Applied' && applied.length > 0 && (
              <View style={s.dot}><Text style={s.dotText}>{applied.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {current.length === 0
            ? <Text style={s.empty}>{emptyMessages[tab]}</Text>
            : current.map(a => renderCard(a, tab === 'Active'))
          }
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', paddingTop: 56 },
  header: { fontSize: 24, fontWeight: '800', color: '#0f172a', paddingHorizontal: 20, marginBottom: 16 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#e2f5e9', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextOn: { color: '#22c55e' },
  dot: { backgroundColor: '#22c55e', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 15, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  pendingBadge: { backgroundColor: '#fef9c3', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { color: '#ca8a04', fontSize: 12, fontWeight: '700' },
  acceptedBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  acceptedText: { color: '#16a34a', fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  msgBtn: { marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#22c55e' },
  msgBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  earned: { fontSize: 14, fontWeight: '800', color: '#22c55e' },
});
