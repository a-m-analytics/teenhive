import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ─── Shared ──────────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Yard Work': '#22c55e', Babysitting: '#ec4899', Tutoring: '#3b82f6',
  'Pet Care': '#f59e0b', 'Tech Help': '#8b5cf6', Cleaning: '#06b6d4', Errands: '#f97316',
};
const PAY_OPTIONS = ['Any', '$10+/hr', '$15+/hr', '$20+/hr'];
const FILTER_CATS = ['All', 'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];

// Static fake teens for "Browse Teens" carousel (teen-for-hire feature not in DB yet)
const TEENS = [
  { id: '1', name: 'Jordan M.', age: 16, skills: ['Yard Work', 'Errands'], rating: 4.8, initials: 'JM' },
  { id: '2', name: 'Sam K.', age: 15, skills: ['Babysitting', 'Pet Care'], rating: 4.6, initials: 'SK' },
  { id: '3', name: 'Alex R.', age: 17, skills: ['Tech Help', 'Tutoring'], rating: 5.0, initials: 'AR' },
];

type DbJob = {
  id: string;
  title: string;
  category: string;
  pay_rate: number;
  pay_type: 'hourly' | 'flat';
  location_area: string | null;
  date: string | null;
  status: string;
  is_recurring: boolean;
  parent_id: string;
  parent: { full_name: string };
};

type DbApplication = {
  id: string;
  status: string;
  job: { title: string; pay_rate: number; pay_type: string; category: string } | null;
  parent: { full_name: string } | null;
};

type DbParentJob = {
  id: string;
  title: string;
  pay_rate: number;
  pay_type: string;
  status: string;
  applications: { id: string; status: string }[];
};

type DbReceivedApp = {
  id: string;
  status: string;
  message: string | null;
  teen_id: string;
  job: { title: string; category: string } | null;
  teen: { full_name: string; age: number | null; skills: string[]; rating: number } | null;
};

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onPress }: { job: DbJob; onPress: () => void }) {
  const color = CAT_COLORS[job.category] || '#22c55e';
  const initials = job.parent.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const payLabel = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
  return (
    <View style={s.jobCard}>
      <View style={s.cardHeader}>
        <View style={s.parentRow}>
          <View style={[s.parentCircle, { backgroundColor: color + '25' }]}>
            <Text style={[s.parentInitials, { color }]}>{initials}</Text>
          </View>
          <Text style={s.parentName}>{job.parent.full_name}</Text>
          <Text>✅</Text>
        </View>
        <TouchableOpacity><Text>🔖</Text></TouchableOpacity>
      </View>
      <Text style={s.jobTitle}>{job.title}</Text>
      <View style={[s.pill, { backgroundColor: color + '20' }]}>
        <Text style={[s.pillText, { color }]}>{job.category}</Text>
      </View>
      <View style={s.jobMeta}>
        <Text style={s.pay}>{payLabel}</Text>
        {job.location_area ? <Text style={s.metaText}>📍 {job.location_area}</Text> : null}
        {job.date ? <Text style={s.metaText}>📅 {job.date}</Text> : null}
      </View>
      <TouchableOpacity style={s.applyBtn} onPress={onPress}>
        <Text style={s.applyBtnText}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Teen Home ────────────────────────────────────────────────────────────────
function TeenHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [myApps, setMyApps] = useState<DbApplication[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [filterPay, setFilterPay] = useState('Any');
  const [pendingCat, setPendingCat] = useState('All');
  const [pendingPay, setPendingPay] = useState('Any');

  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoadingJobs(true);
    const [jobsRes, appsRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, parent:profiles!parent_id(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false }),
      user
        ? supabase
            .from('applications')
            .select('id, status, job:jobs(title, pay_rate, pay_type, category), parent:profiles!parent_id(full_name)')
            .eq('teen_id', user.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    if (jobsRes.data) setJobs(jobsRes.data as DbJob[]);
    if (appsRes.data) setMyApps(appsRes.data as DbApplication[]);
    setLoadingJobs(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openFilter = () => { setPendingCat(filterCat); setPendingPay(filterPay); setShowFilter(true); };
  const applyFilter = () => { setFilterCat(pendingCat); setFilterPay(pendingPay); setShowFilter(false); };
  const clearAll = () => { setPendingCat('All'); setPendingPay('Any'); };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    if (q && !j.title.toLowerCase().includes(q) && !j.category.toLowerCase().includes(q)) return false;
    if (filterCat !== 'All' && j.category !== filterCat) return false;
    if (filterPay === '$10+/hr' && j.pay_rate < 10) return false;
    if (filterPay === '$15+/hr' && j.pay_rate < 15) return false;
    if (filterPay === '$20+/hr' && j.pay_rate < 20) return false;
    return true;
  });

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (filterCat !== 'All') activeFilters.push({ label: filterCat, clear: () => setFilterCat('All') });
  if (filterPay !== 'Any') activeFilters.push({ label: filterPay, clear: () => setFilterPay('Any') });

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.topBar}>
        <View>
          <Text style={s.greeting}>Hi {profile?.full_name?.split(' ')[0] ?? ''} 👋</Text>
          <Text style={s.location}>📍 {profile?.neighborhood ?? 'Your neighborhood'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Text style={s.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={s.trustCard}>
        <View>
          <Text style={s.trustLabel}>Trust Score</Text>
          <Text style={s.trustLevel}>🌟 {profile?.trust_score ?? 0} pts</Text>
        </View>
        <View style={s.trustRight}>
          <Text style={s.trustLabel}>Jobs Completed</Text>
          <Text style={s.trustEarnings}>{profile?.jobs_completed ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.postServicesBtn} onPress={() => router.push('/teen-offer')}>
        <Text style={s.postServicesBtnText}>📋  Post My Services</Text>
      </TouchableOpacity>

      {/* My Applications */}
      {myApps.length > 0 && (
        <>
          <Text style={s.sectionTitle}>My Applications</Text>
          {myApps.map(app => {
            const statusColor = app.status === 'accepted' ? '#22c55e' : app.status === 'declined' ? '#ef4444' : '#f59e0b';
            const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
            const payLabel = app.job ? `$${app.job.pay_rate}${app.job.pay_type === 'hourly' ? '/hr' : ' flat'}` : '';
            return (
              <View key={app.id} style={s.appStatusCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.appStatusTitle}>{app.job?.title ?? '—'}</Text>
                  <Text style={s.appStatusSub}>{app.parent?.full_name ?? '—'} · {payLabel}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[s.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Search + filter */}
      <Text style={s.sectionTitle}>Jobs Near You</Text>
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by title or category..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearX}>✕</Text></TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[s.filterBtn, activeFilters.length > 0 && s.filterBtnActive]} onPress={openFilter}>
          <Text style={s.filterIcon}>⚙️</Text>
          {activeFilters.length > 0 && <View style={s.filterDot} />}
        </TouchableOpacity>
      </View>

      {activeFilters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.activeChipScroll} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
          {activeFilters.map(f => (
            <TouchableOpacity key={f.label} style={s.activeChip} onPress={f.clear}>
              <Text style={s.activeChipText}>{f.label}</Text>
              <Text style={s.activeChipX}> ✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loadingJobs ? (
        <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>
            {jobs.length === 0
              ? 'No jobs near you yet.\nCheck back soon!'
              : 'No jobs match your search.\nTry adjusting your filters.'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={s.resultCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</Text>
          {filtered.map(job => (
            <JobCard key={job.id} job={job} onPress={() => router.push(`/job-detail?id=${job.id}`)} />
          ))}
        </>
      )}

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.filterModal}>
            <View style={s.filterModalHeader}>
              <Text style={s.filterModalTitle}>Filter Jobs</Text>
              <TouchableOpacity onPress={clearAll}><Text style={s.clearAllText}>Clear All</Text></TouchableOpacity>
            </View>
            <Text style={s.filterSection}>Category</Text>
            <View style={s.filterChips}>
              {FILTER_CATS.map(c => (
                <TouchableOpacity key={c} style={[s.fChip, pendingCat === c && s.fChipOn]} onPress={() => setPendingCat(c)}>
                  <Text style={[s.fChipText, pendingCat === c && s.fChipTextOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.filterSection}>Pay Rate</Text>
            <View style={s.filterChips}>
              {PAY_OPTIONS.map(p => (
                <TouchableOpacity key={p} style={[s.fChip, pendingPay === p && s.fChipOn]} onPress={() => setPendingPay(p)}>
                  <Text style={[s.fChipText, pendingPay === p && s.fChipTextOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.applyFilterBtn} onPress={applyFilter}>
              <Text style={s.applyFilterText}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelFilterBtn} onPress={() => setShowFilter(false)}>
              <Text style={s.cancelFilterText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Parent Home ──────────────────────────────────────────────────────────────
function ParentHome() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [postedJobs, setPostedJobs] = useState<DbParentJob[]>([]);
  const [receivedApps, setReceivedApps] = useState<DbReceivedApp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [jobsRes, appsRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, title, pay_rate, pay_type, status, applications!job_id(id, status)')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('applications')
        .select('id, status, message, teen_id, job:jobs(title, category), teen:profiles!teen_id(full_name, age, skills, rating)')
        .eq('parent_id', user.id)
        .eq('status', 'pending'),
    ]);
    if (jobsRes.data) setPostedJobs(jobsRes.data as DbParentJob[]);
    if (appsRes.data) setReceivedApps(appsRes.data as DbReceivedApp[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async (appId: string, teenName: string) => {
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId);
    Alert.alert('Accepted! 🎉', `${teenName.split(' ')[0]} has been notified.`);
    setReceivedApps(prev => prev.filter(a => a.id !== appId));
  };

  const handleDecline = async (appId: string) => {
    await supabase.from('applications').update({ status: 'declined' }).eq('id', appId);
    setReceivedApps(prev => prev.filter(a => a.id !== appId));
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.topBar}>
        <Text style={s.greeting}>Hi {profile?.full_name?.split(' ')[0] ?? ''} 👋</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}><Text style={s.bellIcon}>🔔</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={s.postJobBtn} onPress={() => router.push('/post-job')}>
        <Text style={s.postJobBtnText}>+ Post a Job</Text>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Browse Teens</Text>
      <FlatList horizontal data={TEENS} keyExtractor={t => t.id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingBottom: 4 }}
        renderItem={({ item }) => (
          <View style={s.teenCard}>
            <View style={s.teenCircle}><Text style={s.teenInitials}>{item.initials}</Text></View>
            <Text style={s.teenName}>{item.name}, {item.age}</Text>
            <Text style={s.teenRating}>⭐ {item.rating}</Text>
            <View style={s.skillsRow}>{item.skills.map(sk => <Text key={sk} style={s.skillTag}>{sk}</Text>)}</View>
            <TouchableOpacity style={s.viewProfileBtn} onPress={() => router.push(`/teen-profile?id=${item.id}&parentName=${profile?.full_name ?? ''}`)}>
              <Text style={s.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        )} />

      <Text style={s.sectionTitle}>Your Posted Jobs</Text>
      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 16 }} />
      ) : postedJobs.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>You haven't posted any jobs yet.{'\n'}Post your first job!</Text>
        </View>
      ) : postedJobs.map(j => {
        const appCount = j.applications?.length ?? 0;
        const payLabel = `$${j.pay_rate}${j.pay_type === 'hourly' ? '/hr' : ' flat'}`;
        return (
          <View key={j.id} style={s.postedCard}>
            <View>
              <Text style={s.postedTitle}>{j.title}</Text>
              <Text style={s.postedSub}>{appCount} application{appCount !== 1 ? 's' : ''} · {payLabel}</Text>
            </View>
            <View style={s.activeBadge}><Text style={s.activeBadgeText}>{j.status === 'open' ? 'Active' : j.status}</Text></View>
          </View>
        );
      })}

      {receivedApps.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Applications Received</Text>
          {receivedApps.map(a => {
            const teen = a.teen;
            const initials = teen?.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';
            return (
              <View key={a.id} style={s.appCard}>
                <View style={s.appRow}>
                  <View style={s.appCircle}><Text style={s.appInitials}>{initials}</Text></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.appName}>{teen?.full_name ?? '—'}{teen?.age ? `, ${teen.age}` : ''} · ⭐ {teen?.rating ?? 0}</Text>
                    <Text style={s.appJob}>Applied for: {a.job?.title ?? '—'}</Text>
                    <View style={s.skillsRow}>
                      {(teen?.skills ?? []).slice(0, 3).map(sk => <Text key={sk} style={s.skillTag}>{sk}</Text>)}
                    </View>
                  </View>
                </View>
                {a.message ? <Text style={s.appNote}>💬 "{a.message}"</Text> : null}
                <TouchableOpacity style={s.viewProfileInline} onPress={() => router.push(`/teen-profile?id=${a.teen_id}&parentName=${profile?.full_name ?? ''}`)}>
                  <Text style={s.viewProfileInlineText}>View Profile →</Text>
                </TouchableOpacity>
                <View style={s.appBtns}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(a.id, teen?.full_name ?? 'Teen')}>
                    <Text style={s.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.declineBtn} onPress={() => handleDecline(a.id)}>
                    <Text style={s.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function HomeTab() {
  const { profile } = useAuth();
  return profile?.role === 'parent' ? <ParentHome /> : <TeenHome />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  location: { fontSize: 13, color: '#64748b', marginTop: 2 },
  bellIcon: { fontSize: 24 },

  trustCard: { backgroundColor: '#22c55e', borderRadius: 16, marginHorizontal: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  trustLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  trustLevel: { fontSize: 18, fontWeight: '700', color: '#fff' },
  trustRight: { alignItems: 'flex-end' },
  trustEarnings: { fontSize: 24, fontWeight: '800', color: '#fff' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginHorizontal: 20, marginBottom: 12 },

  jobCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parentCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  parentInitials: { fontSize: 13, fontWeight: '700' },
  parentName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  jobTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  pill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  pillText: { fontSize: 12, fontWeight: '700' },
  jobMeta: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  pay: { fontSize: 15, fontWeight: '800', color: '#22c55e' },
  metaText: { fontSize: 13, color: '#64748b' },
  applyBtn: { backgroundColor: '#22c55e', borderRadius: 12, padding: 14, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  postJobBtn: { backgroundColor: '#22c55e', marginHorizontal: 20, marginBottom: 20, padding: 18, borderRadius: 14, alignItems: 'center' },
  postJobBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  teenCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginRight: 12, width: 158, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  teenCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  teenInitials: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
  teenName: { fontWeight: '700', fontSize: 14, color: '#0f172a', textAlign: 'center', marginBottom: 2 },
  teenRating: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 10 },
  skillTag: { backgroundColor: '#f0fdf4', color: '#16a34a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontSize: 11, fontWeight: '600' },
  viewProfileBtn: { backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  viewProfileText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  postedCard: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  postedTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  postedSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  activeBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

  appCard: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  appRow: { flexDirection: 'row', marginBottom: 12 },
  appCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  appInitials: { fontSize: 15, fontWeight: '800', color: '#16a34a' },
  appName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  appJob: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  appBtns: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#22c55e', padding: 10, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  declineBtn: { flex: 1, backgroundColor: '#fee2e2', padding: 10, borderRadius: 10, alignItems: 'center' },
  declineText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  appNote: { fontSize: 13, color: '#475569', fontStyle: 'italic', marginBottom: 10, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  viewProfileInline: { marginBottom: 10 },
  viewProfileInlineText: { color: '#22c55e', fontWeight: '700', fontSize: 13 },

  appStatusCard: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginBottom: 10, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  appStatusTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  appStatusSub: { fontSize: 12, color: '#64748b' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11, color: '#0f172a' },
  clearX: { fontSize: 14, color: '#94a3b8', padding: 4 },
  filterBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  filterIcon: { fontSize: 18 },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', position: 'absolute', top: 6, right: 6 },

  activeChipScroll: { paddingLeft: 20, marginBottom: 8 },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  activeChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  activeChipX: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  resultCount: { fontSize: 13, color: '#64748b', fontWeight: '500', marginHorizontal: 20, marginBottom: 12 },
  emptyBox: { marginHorizontal: 20, backgroundColor: '#f8fafc', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  filterModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterModalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  clearAllText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  filterSection: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginTop: 16 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fChip: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  fChipOn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  fChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  fChipTextOn: { color: '#fff' },
  applyFilterBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  applyFilterText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelFilterBtn: { padding: 14, alignItems: 'center' },
  cancelFilterText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },

  postServicesBtn: { marginHorizontal: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#22c55e', borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: '#f0fdf4' },
  postServicesBtnText: { color: '#16a34a', fontSize: 15, fontWeight: '700' },
});
