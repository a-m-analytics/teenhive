import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Teen = {
  id: string;
  full_name: string;
  age: number | null;
  neighborhood: string | null;
  bio: string | null;
  skills: string[];
  hourly_rate: number | null;
  jobs_completed?: number;
  created_at?: string;
  is_verified?: boolean;
};

type SortOption = 'jobs' | 'newest' | 'pay_asc';
type AgeFilter = 'any' | '13-14' | '15-16' | '17+';
type PayFilter = 'any' | '10' | '15' | '20';

function getInitials(name: string) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const SKILL_CATEGORIES = ['Any', 'Babysitting', 'Tutoring', 'Yard Work', 'Pet Care', 'Tech Help', 'Cleaning', 'Errands'];
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Most Jobs', value: 'jobs' },
  { label: 'Newest', value: 'newest' },
  { label: 'Lowest Pay', value: 'pay_asc' },
];
const PAY_OPTIONS: { label: string; value: PayFilter }[] = [
  { label: 'Any Rate', value: 'any' },
  { label: 'Under $10', value: '10' },
  { label: 'Under $15', value: '15' },
  { label: 'Under $20', value: '20' },
];

export default function BrowseTeens() {
  const router = useRouter();
  const { user } = useAuth();
  const { jobId, jobTitle } = useLocalSearchParams<{ jobId: string; jobTitle: string }>();
  const [teens, setTeens] = useState<Teen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('any');
  const [skillFilter, setSkillFilter] = useState('Any');
  const [sortBy, setSortBy] = useState<SortOption>('jobs');
  const [payFilter, setPayFilter] = useState<PayFilter>('any');
  const [neighborhood, setNeighborhood] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<{ name: string; count: number }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeens();
    fetchNeighborhoods();
  }, []);

  const fetchTeens = async () => {
    setLoading(true);
    // Only show teens who have posted at least one active service
    const { data: serviceRows } = await supabase
      .from('teen_services')
      .select('teen_id')
      .eq('is_active', true);
    const teenIds = [...new Set((serviceRows ?? []).map((r: any) => r.teen_id))];
    if (teenIds.length === 0) { setTeens([]); setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, age, neighborhood, bio, skills, hourly_rate, jobs_completed, created_at, is_verified')
      .eq('role', 'teen')
      .in('id', teenIds);
    if (data) setTeens(data as Teen[]);
    setLoading(false);
  };

  const fetchNeighborhoods = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('neighborhood').not('neighborhood', 'is', null);
    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach((p: any) => { if (p.neighborhood) counts[p.neighborhood] = (counts[p.neighborhood] ?? 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    setNeighborhoods(sorted);
  }, []);

  const handleInvite = async (teen: Teen) => {
    if (!user || !jobId) return;
    setInviting(teen.id);
    try {
      // Check if already invited/applied
      const { data: existing } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('teen_id', teen.id)
        .maybeSingle();

      if (existing) {
        Alert.alert('Already invited', `${teen.full_name} has already been invited or applied to this job.`);
        return;
      }

      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        teen_id: teen.id,
        parent_id: user.id,
        status: 'invited',
        message: '',
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: teen.id,
        type: 'job_invitation',
        title: 'You got an invite!',
        body: `A parent invited you to: ${decodeURIComponent(jobTitle ?? 'a job')}`,
        read: false,
      });

      setInvited((prev) => new Set([...prev, teen.id]));
      Alert.alert('Invited!', `${teen.full_name} has been notified.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setInviting(null);
    }
  };

  const AGE_FILTERS: { label: string; value: AgeFilter }[] = [
    { label: 'Any Age', value: 'any' },
    { label: '13–14', value: '13-14' },
    { label: '15–16', value: '15-16' },
    { label: '17+', value: '17+' },
  ];

  const hasActiveFilters = ageFilter !== 'any' || skillFilter !== 'Any' || payFilter !== 'any' || sortBy !== 'jobs' || neighborhood !== '';

  const filtered = teens
    .filter((t) => {
      const searchMatch = !search.trim() || (() => {
        const q = search.toLowerCase();
        return t.full_name.toLowerCase().includes(q) || t.neighborhood?.toLowerCase().includes(q) || t.skills?.some((s) => s.toLowerCase().includes(q));
      })();
      const ageMatch =
        ageFilter === 'any' ||
        (ageFilter === '13-14' && t.age != null && t.age >= 13 && t.age <= 14) ||
        (ageFilter === '15-16' && t.age != null && t.age >= 15 && t.age <= 16) ||
        (ageFilter === '17+' && t.age != null && t.age >= 17);
      const skillMatch =
        skillFilter === 'Any' || t.skills?.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()));
      const payMatch =
        payFilter === 'any' ||
        (payFilter === '10' && (t.hourly_rate == null || t.hourly_rate < 10)) ||
        (payFilter === '15' && (t.hourly_rate == null || t.hourly_rate < 15)) ||
        (payFilter === '20' && (t.hourly_rate == null || t.hourly_rate < 20));
      const neighborhoodMatch = neighborhood === '' || t.neighborhood?.toLowerCase() === neighborhood.toLowerCase();
      return searchMatch && ageMatch && skillMatch && payMatch && neighborhoodMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'jobs') return (b.jobs_completed ?? 0) - (a.jobs_completed ?? 0);
      if (sortBy === 'newest') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (sortBy === 'pay_asc') return (a.hourly_rate ?? 999) - (b.hourly_rate ?? 999);
      return 0;
    });

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>
          {jobTitle ? `For: ${decodeURIComponent(jobTitle)}` : 'Invite to job'}
        </Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, letterSpacing: -0.5 }}>
          Browse Teens
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 14, gap: 10 }}>
          <Ionicons name="search-outline" size={18} color={ds.c.onSurfaceVariant} />
          <TextInput
            style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, paddingVertical: 14 }}
            placeholder="Search by name, skill, or neighborhood..."
            placeholderTextColor={ds.c.outlineVariant}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Neighbourhood quick chips */}
      {neighborhoods.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: 'center', paddingBottom: 8 }}
          style={{ marginBottom: 4 }}
        >
          {neighborhoods.map(({ name, count }) => {
            const active = neighborhood === name;
            return (
              <TouchableOpacity
                key={name}
                onPress={() => setNeighborhood(active ? '' : name)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
                  backgroundColor: active ? ds.c.primary : ds.c.surfaceContainerLow,
                  borderWidth: active ? 0 : 1, borderColor: ds.c.outlineVariant,
                }}
              >
                <Ionicons name="location-outline" size={11} color={active ? ds.c.white : ds.c.onSurfaceVariant} />
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: active ? ds.c.white : ds.c.onSurfaceVariant }}>
                  {name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Filter toggle row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 8, gap: 8, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: hasActiveFilters ? ds.c.primary : ds.c.surfaceContainerLow }}
        >
          <Ionicons name="options-outline" size={14} color={hasActiveFilters ? ds.c.white : ds.c.onSurfaceVariant} />
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: hasActiveFilters ? ds.c.white : ds.c.onSurfaceVariant }}>
            {hasActiveFilters ? 'Filters applied' : 'Filters'}
          </Text>
        </TouchableOpacity>
        {hasActiveFilters && (
          <TouchableOpacity onPress={() => { setAgeFilter('any'); setSkillFilter('Any'); setPayFilter('any'); setSortBy('jobs'); setNeighborhood(''); }}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <View style={{ paddingHorizontal: 24, marginBottom: 14, gap: 16 }}>
          {/* Age */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>AGE</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {AGE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setAgeFilter(f.value)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: ageFilter === f.value ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: ageFilter === f.value ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ageFilter === f.value ? ds.c.white : ds.c.onSurfaceVariant }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Neighbourhood */}
          {neighborhoods.length > 0 && (
            <View>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>NEIGHBOURHOOD</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {neighborhoods.map(({ name, count }) => {
                  const active = neighborhood === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      onPress={() => setNeighborhood(active ? '' : name)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
                        backgroundColor: active ? ds.c.primary : ds.c.surfaceContainerLow,
                        borderWidth: active ? 0 : 1, borderColor: ds.c.outlineVariant,
                      }}
                    >
                      <Ionicons name="location-outline" size={11} color={active ? ds.c.white : ds.c.onSurfaceVariant} />
                      <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: active ? ds.c.white : ds.c.onSurfaceVariant }}>
                        {name} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Skill/Category */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>SKILL / CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {SKILL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSkillFilter(cat)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: skillFilter === cat ? ds.c.secondary : ds.c.surfaceContainerLow, borderWidth: skillFilter === cat ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: skillFilter === cat ? ds.c.white : ds.c.onSurfaceVariant }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>SORT BY</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSortBy(s.value)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: sortBy === s.value ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: sortBy === s.value ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: sortBy === s.value ? ds.c.white : ds.c.onSurfaceVariant }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pay rate */}
          <View>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 8 }}>HOURLY RATE</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {PAY_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPayFilter(p.value)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: payFilter === p.value ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderWidth: payFilter === p.value ? 0 : 1, borderColor: ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: payFilter === p.value ? ds.c.white : ds.c.onSurfaceVariant }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={teens.length === 0 ? 'No teens available yet' : 'No teens match your filters'}
          subtitle={teens.length === 0 ? 'Teens who post their services will appear here' : 'Try adjusting your search or filters'}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {filtered.map((teen) => {
            const initials = getInitials(teen.full_name);
            const isInvited = invited.has(teen.id);
            const isInviting = inviting === teen.id;
            return (
              <View key={teen.id} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.white }}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface }}>
                        {teen.full_name}{teen.age ? `, ${teen.age}` : ''}
                      </Text>
                      {teen.is_verified && (
                        <Ionicons name="checkmark-circle" size={16} color={ds.c.secondary} />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 }}>
                      {teen.neighborhood ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="location-outline" size={11} color={ds.c.onSurfaceVariant} />
                          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{teen.neighborhood}</Text>
                        </View>
                      ) : null}
                      {(teen.jobs_completed ?? 0) > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="briefcase-outline" size={11} color={ds.c.onSurfaceVariant} />
                          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{teen.jobs_completed} jobs done</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.primary }}>New</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {teen.hourly_rate ? (
                    <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>${teen.hourly_rate}/hr</Text>
                    </View>
                  ) : null}
                </View>

                {teen.bio ? (
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 19, marginBottom: 12 }} numberOfLines={2}>
                    {teen.bio}
                  </Text>
                ) : null}

                {teen.skills && teen.skills.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {teen.skills.slice(0, 4).map((s) => (
                      <View key={s} style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => router.push(`/teen-profile?id=${teen.id}` as any)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface }}>View Profile</Text>
                  </TouchableOpacity>
                  {jobId ? (
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: isInvited ? ds.c.surfaceContainerHigh : ds.c.primary, borderRadius: 9999, paddingVertical: 12, alignItems: 'center', opacity: isInviting ? 0.5 : 1 }}
                      onPress={() => !isInvited && handleInvite(teen)}
                      disabled={isInvited || isInviting}
                    >
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: isInvited ? ds.c.onSurfaceVariant : ds.c.white }}>
                        {isInviting ? 'Inviting...' : isInvited ? 'Invited ✓' : 'Invite'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
