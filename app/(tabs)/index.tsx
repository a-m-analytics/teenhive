import GradientButton from '@/components/GradientButton';
import PressableScale from '@/components/PressableScale';
import ServiceCard, { ServiceCardData } from '@/components/ServiceCard';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { acceptApplication, declineApplication } from '@/lib/applicationService';
import { getUnreadCount } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORIES = ['All', 'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const PAY_FILTERS = [
  { label: 'Any', value: null },
  { label: '$10+/hr', value: 10 },
  { label: '$15+/hr', value: 15 },
  { label: '$20+/hr', value: 20 },
];

const CATEGORY_GRID = [
  { label: 'Creative Arts', icon: 'color-palette-outline' as const },
  { label: 'Home Help', icon: 'home-outline' as const },
  { label: 'Tech Support', icon: 'laptop-outline' as const },
  { label: 'Moving', icon: 'cube-outline' as const },
];

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

// ─── Teen Home ────────────────────────────────────────────────────────────────
function TeenHome() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [payFilterIdx, setPayFilterIdx] = useState(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const fetchJobs = useCallback(async (search: string, category: string, minPay: number | null) => {
    setLoadingJobs(true);
    let query = supabase
      .from('jobs')
      .select('*, parent:profiles!parent_id(id, full_name, is_verified)')
      .eq('status', 'open');
    if (category !== 'All') query = query.eq('category', category);
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);
    if (minPay != null) query = query.gte('pay_rate', minPay);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoadingJobs(false);
  }, []);

  const fetchServices = useCallback(async () => {
    if (!user) return;
    setLoadingServices(true);
    const { data, error } = await supabase
      .from('teen_services')
      .select('id, title, category, hourly_rate, availability, travel_distance, teen:profiles!teen_id(id, full_name, age)')
      .eq('is_active', true)
      .neq('teen_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data) setServices(data as unknown as ServiceCardData[]);
    setLoadingServices(false);
  }, [user]);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_jobs').select('job_id').eq('teen_id', user.id);
    if (data) setSavedJobs(new Set(data.map((s) => s.job_id)));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs('', 'All', null);
      fetchServices();
      fetchSaved();
      if (user) getUnreadCount(user.id).then(setUnreadCount);
    }, [fetchJobs, fetchServices, fetchSaved, user])
  );

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchJobs(searchText, selectedCategory, PAY_FILTERS[payFilterIdx].value);
    }, 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchText, selectedCategory, payFilterIdx, fetchJobs]);

  async function toggleSave(jobId: string) {
    if (!user) return;
    if (savedJobs.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('teen_id', user.id).eq('job_id', jobId);
      setSavedJobs((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
    } else {
      await supabase.from('saved_jobs').insert({ teen_id: user.id, job_id: jobId });
      setSavedJobs((prev) => new Set([...prev, jobId]));
    }
  }

  const hasActiveFilters = payFilterIdx !== 0;

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 14, color: ds.c.secondary, fontStyle: 'italic' }}>Good day, {firstName}</Text>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="notifications-outline" size={18} color={ds.c.onSurface} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: ds.c.error }} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, lineHeight: 40, letterSpacing: -0.5, paddingHorizontal: 24, marginBottom: 16 }}>
          What do you need{'\n'}help with?
        </Text>

        {/* Beta feedback banner */}
        <TouchableOpacity
          style={{ marginHorizontal: 24, marginBottom: 20, backgroundColor: ds.c.secondaryContainer, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          onPress={() => router.push('/feedback' as any)}
          activeOpacity={0.75}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, letterSpacing: 1, backgroundColor: ds.c.primary, color: ds.c.secondaryContainer, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>BETA</Text>
          <Text style={{ flex: 1, fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.primary }}>Found a bug or have feedback? Tap here →</Text>
        </TouchableOpacity>

        {/* ── Search bar ── */}
        <View style={{ marginHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, gap: 10 }}>
            <Ionicons name="search-outline" size={16} color={ds.c.onSurfaceVariant} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
              placeholder="Search jobs..."
              placeholderTextColor={ds.c.outlineVariant}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={15} color={ds.c.outlineVariant} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: hasActiveFilters ? ds.c.secondary : ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? ds.c.white : ds.c.onSurface} />
          </TouchableOpacity>
        </View>

        {/* ── Bento action cards ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24, gap: 12 }}>
          {/* Primary card: Browse Available Teens */}
          <PressableScale onPress={() => router.push('/teen-profile' as any)}>
            <LinearGradient colors={ds.gradient} style={{ borderRadius: 24, padding: 24 }}>
              <Text style={{ ...dsLabel, color: ds.c.secondaryContainer, marginBottom: 10 }}>Community</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.white, lineHeight: 32, letterSpacing: -0.3, marginBottom: 6 }}>Browse Available Teens</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.65)', marginBottom: 16 }}>Find trusted local help</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>Explore Teens</Text>
              </View>
            </LinearGradient>
          </PressableScale>

          {/* Secondary card: Browse Jobs */}
          <PressableScale
            style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => {}}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary, lineHeight: 26, letterSpacing: -0.2, marginBottom: 4 }}>Browse Jobs</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>Find work near you</Text>
            </View>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={22} color={ds.c.primary} />
            </View>
          </PressableScale>
        </View>

        {/* ── Top Categories ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 14 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Top Categories</Text>
          <TouchableOpacity>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }} style={{ marginBottom: 16 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
                backgroundColor: selectedCategory === cat ? ds.c.secondaryContainer : ds.c.surfaceContainerLow,
                borderWidth: selectedCategory === cat ? 0 : 1,
                borderColor: ds.c.outlineVariant,
              }}
            >
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: selectedCategory === cat ? ds.c.primary : ds.c.onSurfaceVariant }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category grid 2x2 */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {CATEGORY_GRID.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={{ width: '47.5%', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18 }}
              onPress={() => setSelectedCategory(item.label)}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name={item.icon} size={20} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Jobs list ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Jobs Near You</Text>
          {!loadingJobs && (
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>{jobs.length} found</Text>
          )}
        </View>

        {hasActiveFilters && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, gap: 8 }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.primary }}>{PAY_FILTERS[payFilterIdx].label}</Text>
              <TouchableOpacity onPress={() => setPayFilterIdx(0)}>
                <Ionicons name="close" size={13} color={ds.c.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loadingJobs ? (
          <ActivityIndicator size="large" color={ds.c.secondary} style={{ marginVertical: 32 }} />
        ) : jobs.length === 0 ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 32 }}>
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
              No jobs found. Try different filters or check back soon.
            </Text>
            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 10 }}
              onPress={() => { setPayFilterIdx(0); setSelectedCategory('All'); setSearchText(''); }}
            >
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          jobs.map((job) => (
            <PressableScale
              key={job.id}
              style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}
              onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{getInitials(job.parent?.full_name ?? 'U')}</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurface }}>{job.parent?.full_name ?? 'Parent'}</Text>
                    {job.parent?.is_verified && (
                      <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 10, color: ds.c.secondary, letterSpacing: 0.5 }}>VERIFIED</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => toggleSave(job.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={savedJobs.has(job.id) ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={savedJobs.has(job.id) ? ds.c.secondary : ds.c.outlineVariant}
                  />
                </TouchableOpacity>
              </View>

              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary, lineHeight: 26, letterSpacing: -0.3, marginBottom: 12 }}>
                {job.title}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.category}</Text>
                </View>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>
                    ${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}
                  </Text>
                </View>
                {job.location_area ? <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.location_area}</Text> : null}
                {job.date ? <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{formatDate(job.date)}</Text> : null}
              </View>

              <View style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 13, alignItems: 'center' }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white, letterSpacing: 1 }}>APPLY NOW</Text>
              </View>
            </PressableScale>
          ))
        )}

        {/* ── Teens offering services ── */}
        {!loadingServices && services.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
              <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Community</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Teens Near You</Text>
            </View>
            {services.map((service) => (
              <View key={service.id} style={{ marginHorizontal: 24, marginBottom: 12 }}>
                <ServiceCard service={service} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter modal */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, marginBottom: 6, letterSpacing: -0.3 }}>Filter Jobs</Text>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 16, marginTop: 8 }}>Minimum Pay</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
              {PAY_FILTERS.map((f, i) => (
                <TouchableOpacity
                  key={f.label}
                  style={{
                    flex: 1, borderRadius: 9999, paddingVertical: 12, alignItems: 'center',
                    backgroundColor: payFilterIdx === i ? ds.c.primary : ds.c.surfaceContainerLow,
                    borderWidth: payFilterIdx === i ? 0 : 1, borderColor: ds.c.outlineVariant,
                  }}
                  onPress={() => setPayFilterIdx(i)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: payFilterIdx === i ? ds.c.white : ds.c.onSurfaceVariant }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <GradientButton label="Apply Filter" onPress={() => setShowFilter(false)} fullWidth />
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 16 }} onPress={() => { setPayFilterIdx(0); setShowFilter(false); }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Parent Home ──────────────────────────────────────────────────────────────
function ParentHome() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [allTeens, setAllTeens] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoadingJobs(true);
    const { data, error } = await supabase.from('jobs').select('*').eq('parent_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoadingJobs(false);
  }, [user]);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApps(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*, teen:profiles!teen_id(id, full_name, age, skills, rating), job:jobs!job_id(id, title)')
      .eq('parent_id', user.id)
      .eq('status', 'pending');
    if (!error && data) setApplications(data);
    setLoadingApps(false);
  }, [user]);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    const { data, error } = await supabase
      .from('teen_services')
      .select('id, title, category, hourly_rate, availability, travel_distance, teen:profiles!teen_id(id, full_name, age)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(15);
    if (!error && data) setServices(data as unknown as ServiceCardData[]);
    setLoadingServices(false);
  }, []);

  const fetchAllTeens = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, age, skills, rating, rating_count').eq('role', 'teen').order('rating', { ascending: false }).limit(20);
    if (data) setAllTeens(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      fetchApplications();
      fetchServices();
      fetchAllTeens();
      if (user) getUnreadCount(user.id).then(setUnreadCount);
    }, [fetchJobs, fetchApplications, fetchServices, fetchAllTeens, user])
  );

  async function handleAccept(appId: string) {
    const app = applications.find((a) => a.id === appId);
    if (!app?.job?.id || !app?.teen_id || !user) return;
    try {
      await acceptApplication(appId, app.job.id, app.teen_id, user.id);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch {}
  }

  async function handleDecline(appId: string) {
    const app = applications.find((a) => a.id === appId);
    if (!app?.teen_id) return;
    try {
      await declineApplication(appId, app.teen_id);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch {}
  }

  function statusLabel(status: string) {
    if (status === 'open') return { label: 'Open', bg: ds.c.secondaryContainer, color: ds.c.primary };
    if (status === 'in_progress') return { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' };
    return { label: 'Closed', bg: ds.c.surfaceContainerHigh, color: ds.c.onSurfaceVariant };
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 14, color: ds.c.secondary, fontStyle: 'italic' }}>Good day, {firstName}</Text>
        <TouchableOpacity
          onPress={() => router.push('/notifications' as any)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="notifications-outline" size={18} color={ds.c.onSurface} />
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: ds.c.error }} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, lineHeight: 40, letterSpacing: -0.5, paddingHorizontal: 24, marginBottom: 16 }}>
        What do you need{'\n'}help with?
      </Text>

      {/* Beta feedback banner */}
      <TouchableOpacity
        style={{ marginHorizontal: 24, marginBottom: 20, backgroundColor: ds.c.secondaryContainer, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        onPress={() => router.push('/feedback' as any)}
        activeOpacity={0.75}
      >
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.primary, letterSpacing: 1, backgroundColor: ds.c.primary, color: ds.c.secondaryContainer, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>BETA</Text>
        <Text style={{ flex: 1, fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.primary }}>Found a bug or have feedback? Tap here →</Text>
      </TouchableOpacity>

      {/* Bento action cards */}
      <View style={{ paddingHorizontal: 24, marginBottom: 28, gap: 12 }}>
        <PressableScale onPress={() => router.push('/post-job' as any)}>
          <LinearGradient colors={ds.gradient} style={{ borderRadius: 24, padding: 24 }}>
            <Text style={{ ...dsLabel, color: ds.c.secondaryContainer, marginBottom: 10 }}>Post Work</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.white, lineHeight: 32, letterSpacing: -0.3, marginBottom: 6 }}>Post a New Job</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.65)', marginBottom: 16 }}>Connect with trusted teens nearby</Text>
            <View style={{ alignSelf: 'flex-start', backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>Get Started</Text>
            </View>
          </LinearGradient>
        </PressableScale>

        <PressableScale
          style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => {}}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary, lineHeight: 26, letterSpacing: -0.2, marginBottom: 4 }}>Browse Available Teens</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>Find skilled help in your area</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="people-outline" size={22} color={ds.c.primary} />
          </View>
        </PressableScale>
      </View>

      {/* Available Teens */}
      <View style={{ paddingHorizontal: 24, marginBottom: 6 }}>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Available Now</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Available Teens</Text>
          {!loadingServices && services.length > 0 && (
            <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{services.length}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, paddingHorizontal: 24, marginBottom: 16, lineHeight: 20 }}>
        Teens who've posted their availability
      </Text>

      {loadingServices ? (
        <ActivityIndicator size="small" color={ds.c.secondary} style={{ marginBottom: 20 }} />
      ) : services.length === 0 ? (
        <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center' }}>No teens have posted their availability yet.</Text>
        </View>
      ) : (
        services.map((service) => (
          <View key={service.id} style={{ marginHorizontal: 24, marginBottom: 12 }}>
            <ServiceCard service={service} />
          </View>
        ))
      )}

      {/* Browse All Teens */}
      {allTeens.length > 0 && (
        <View style={{ marginBottom: 28, marginTop: 8 }}>
          <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
            <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Community</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Browse All Teens</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {allTeens.map((teen) => (
              <PressableScale
                key={teen.id}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 18, width: 140, alignItems: 'center' }}
                onPress={() => router.push(`/teen-profile?id=${teen.id}` as any)}
              >
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 18, color: ds.c.primary }}>{getInitials(teen.full_name)}</Text>
                </View>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface, textAlign: 'center', marginBottom: 2 }} numberOfLines={1}>{teen.full_name}</Text>
                {teen.age ? <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginBottom: 6 }}>Age {teen.age}</Text> : null}
                {teen.rating_count > 0 ? (
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.secondary }}>{Number(teen.rating).toFixed(1)} ★</Text>
                ) : null}
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Applications */}
      {applications.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Pending Review</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>Applications</Text>
          </View>
          {loadingApps ? (
            <ActivityIndicator size="small" color={ds.c.secondary} />
          ) : (
            applications.map((app) => (
              <View key={app.id} style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary }}>{getInitials(app.teen?.full_name ?? 'U')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface }}>
                      {app.teen?.full_name ?? 'Unknown'}{app.teen?.age ? `, ${app.teen.age}` : ''}
                    </Text>
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, marginTop: 2 }}>{app.job?.title ?? ''}</Text>
                  </View>
                  {app.teen?.rating ? <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>{Number(app.teen.rating).toFixed(1)} ★</Text> : null}
                </View>
                {app.teen?.skills?.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(app.teen.skills as string[]).slice(0, 4).map((skill: string, i: number) => (
                      <View key={i} style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={{ flex: 1, height: 44, borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.outlineVariant, justifyContent: 'center', alignItems: 'center' }} onPress={() => handleDecline(app.id)}>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurfaceVariant }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: ds.c.primary, justifyContent: 'center', alignItems: 'center' }} onPress={() => handleAccept(app.id)}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.white }}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

export default function HomeTab() {
  const { profile } = useAuth();
  return profile?.role === 'parent' ? <ParentHome /> : <TeenHome />;
}
