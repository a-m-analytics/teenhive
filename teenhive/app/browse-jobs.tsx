import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['All', 'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const PAY_FILTERS = [
  { label: 'Any', min: null, max: null },
  { label: 'Under $10', min: null, max: 9.99 },
  { label: '$10–$15', min: 10, max: 15 },
  { label: '$15+', min: 15, max: null },
];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Pay: High', value: 'pay_high' },
  { label: 'Pay: Low', value: 'pay_low' },
];

type SortVal = 'newest' | 'pay_high' | 'pay_low';

export default function BrowseJobs() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [payIdx, setPayIdx] = useState(0);
  const [sortBy, setSortBy] = useState<SortVal>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [neighborhood, setNeighborhood] = useState('All');
  const [neighborhoods, setNeighborhoods] = useState<{ name: string; count: number }[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async (q: string, cat: string, pIdx: number, sort: SortVal) => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, parent:profiles!parent_id(id, full_name, is_verified, neighborhood)')
      .eq('status', 'open');
    if (cat !== 'All') query = query.eq('category', cat);
    if (q.trim()) query = query.ilike('title', `%${q.trim()}%`);
    const pay = PAY_FILTERS[pIdx];
    if (pay.min != null) query = query.gte('pay_rate', pay.min);
    if (pay.max != null) query = query.lte('pay_rate', pay.max);
    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'pay_high') query = query.order('pay_rate', { ascending: false });
    else query = query.order('pay_rate', { ascending: true });

    const { data } = await query;
    if (data) setJobs(data);
    setLoading(false);
  }, []);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_jobs').select('job_id').eq('teen_id', user.id);
    if (data) setSavedJobs(new Set(data.map((s: any) => s.job_id)));
  }, [user]);

  const fetchNeighborhoods = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('neighborhood')
      .not('neighborhood', 'is', null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((p: any) => {
        if (p.neighborhood) counts[p.neighborhood] = (counts[p.neighborhood] ?? 0) + 1;
      });
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
      setNeighborhoods(sorted);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
    fetchJobs('', 'All', 0, 'newest');
    fetchNeighborhoods();
  }, [fetchJobs, fetchSaved, fetchNeighborhoods]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchJobs(search, category, payIdx, sortBy), 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [search, category, payIdx, sortBy, fetchJobs]);

  const visibleJobs = neighborhood === 'All'
    ? jobs
    : jobs.filter((j) => j.parent?.neighborhood === neighborhood);

  async function toggleSave(jobId: string) {
    if (!user) return;
    if (savedJobs.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('teen_id', user.id).eq('job_id', jobId);
      setSavedJobs((p) => { const n = new Set(p); n.delete(jobId); return n; });
    } else {
      await supabase.from('saved_jobs').insert({ teen_id: user.id, job_id: jobId });
      setSavedJobs((p) => new Set([...p, jobId]));
    }
  }

  const hasFilters = category !== 'All' || payIdx !== 0 || sortBy !== 'newest' || neighborhood !== 'All';

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, letterSpacing: -0.5, marginBottom: 4 }}>
          Browse Jobs
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>
          All open jobs near you
        </Text>
      </View>

      {/* Search + filter toggle */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12, flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}>
          <Ionicons name="search-outline" size={16} color={ds.c.onSurfaceVariant} />
          <TextInput
            style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
            placeholder="Search jobs..."
            placeholderTextColor={ds.c.outlineVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={ds.c.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: hasFilters ? ds.c.secondary : ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={18} color={hasFilters ? ds.c.white : ds.c.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={{ paddingHorizontal: 24, marginBottom: 14, gap: 14 }}>
          {/* Category */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: category === c ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: category === c ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: category === c ? ds.c.white : ds.c.onSurfaceVariant }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Pay */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>PAY RATE</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {PAY_FILTERS.map((p, i) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setPayIdx(i)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: payIdx === i ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: payIdx === i ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: payIdx === i ? ds.c.white : ds.c.onSurfaceVariant }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>SORT BY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SORT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSortBy(s.value as SortVal)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: sortBy === s.value ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: sortBy === s.value ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: sortBy === s.value ? ds.c.white : ds.c.onSurfaceVariant }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Neighbourhood */}
          {neighborhoods.length > 0 && (
            <View>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>NEIGHBOURHOOD</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setNeighborhood('All')}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: neighborhood === 'All' ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: neighborhood === 'All' ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: neighborhood === 'All' ? ds.c.white : ds.c.onSurfaceVariant }}>All areas</Text>
                </TouchableOpacity>
                {neighborhoods.map((n) => (
                  <TouchableOpacity
                    key={n.name}
                    onPress={() => setNeighborhood(n.name)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: neighborhood === n.name ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: neighborhood === n.name ? 0 : 1, borderColor: ds.c.outlineVariant }}
                  >
                    <Ionicons name="location-outline" size={11} color={neighborhood === n.name ? ds.c.white : ds.c.onSurfaceVariant} />
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: neighborhood === n.name ? ds.c.white : ds.c.onSurfaceVariant }}>
                      {n.name} <Text style={{ opacity: 0.7 }}>({n.count})</Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {hasFilters && (
            <TouchableOpacity onPress={() => { setCategory('All'); setPayIdx(0); setSortBy('newest'); setNeighborhood('All'); }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Category chips quick-select */}
      {!showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: 'center' }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: category === c ? ds.c.secondaryContainer : ds.c.surfaceContainerLow, borderWidth: category === c ? 0 : 1, borderColor: ds.c.outlineVariant }}
            >
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: category === c ? ds.c.primary : ds.c.onSurfaceVariant }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Neighbourhood chips quick-select */}
      {!showFilters && neighborhoods.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setNeighborhood('All')}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: neighborhood === 'All' ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: neighborhood === 'All' ? 0 : 1, borderColor: ds.c.outlineVariant }}
          >
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: neighborhood === 'All' ? ds.c.white : ds.c.onSurfaceVariant }}>All areas</Text>
          </TouchableOpacity>
          {neighborhoods.map((n) => (
            <TouchableOpacity
              key={n.name}
              onPress={() => setNeighborhood(n.name)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: neighborhood === n.name ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: neighborhood === n.name ? 0 : 1, borderColor: ds.c.outlineVariant }}
            >
              <Ionicons name="location-outline" size={11} color={neighborhood === n.name ? ds.c.white : ds.c.onSurfaceVariant} />
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: neighborhood === n.name ? ds.c.white : ds.c.onSurfaceVariant }}>
                {n.name} <Text style={{ opacity: 0.7 }}>({n.count})</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Result count */}
      {!loading && (
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant, paddingHorizontal: 24, marginBottom: 10 }}>
          {visibleJobs.length} {visibleJobs.length === 1 ? 'job' : 'jobs'} found
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={ds.c.secondary} style={{ marginTop: 40 }} />
      ) : visibleJobs.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No jobs match" subtitle="Try different filters" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {visibleJobs.map((job) => {
            const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
            const isSaved = savedJobs.has(job.id);
            return (
              <TouchableOpacity
                key={job.id}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}
                onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, lineHeight: 24, marginBottom: 4 }}>
                      {job.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant }}>{job.category}</Text>
                      </View>
                      {job.location_area ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="location-outline" size={11} color={ds.c.onSurfaceVariant} />
                          <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant }}>{job.location_area}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary }}>{pay}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleSave(job.id)}>
                      <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? ds.c.secondary : ds.c.outlineVariant} />
                    </TouchableOpacity>
                  </View>
                </View>

                {job.description ? (
                  <Text numberOfLines={2} style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 18, marginBottom: 10 }}>
                    {job.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>
                      by {job.parent?.full_name ?? 'Parent'}
                    </Text>
                    {job.parent?.is_verified && (
                      <Ionicons name="shield-checkmark" size={12} color={ds.c.secondary} />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ds.c.primaryContainer, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>View Job</Text>
                    <Ionicons name="arrow-forward" size={12} color={ds.c.white} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
