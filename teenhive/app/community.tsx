import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

const CATEGORIES = ['All', 'Volunteer', 'Events', 'Local Orgs'];
const LOCATIONS = ['All', 'Southlake', 'Plano', 'McKinney', 'Dallas', 'Grapevine', 'Collin County', 'DFW Area'];
const TIMINGS = ['All', 'Weekdays', 'Weekends', 'Flexible', 'Monthly', 'Saturdays'];

type CommunityPost = {
  id: string;
  title: string;
  description: string;
  organization: string | null;
  location: string | null;
  date: string | null;
  time_str: string | null;
  category: string | null;
  is_official: boolean;
  created_at: string;
};

export default function CommunityScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [timing, setTiming] = useState('All');
  const [timingOpen, setTimingOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data as CommunityPost[]);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filtered = posts.filter((p) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.organization ?? '').toLowerCase().includes(q)) return false;
    }
    if (category !== 'All' && p.category !== category) return false;
    if (location !== 'All' && !(p.location ?? '').toLowerCase().includes(location.toLowerCase())) return false;
    if (timing !== 'All') {
      const combined = ((p.date ?? '') + ' ' + (p.time_str ?? '')).toLowerCase();
      if (timing === 'Weekdays' && !combined.includes('weekday') && !combined.includes('mon') && !combined.includes('tue') && !combined.includes('wed') && !combined.includes('thu') && !combined.includes('fri')) return false;
      if (timing === 'Weekends' && !combined.includes('weekend') && !combined.includes('sat') && !combined.includes('sun')) return false;
      if (timing === 'Flexible' && !combined.includes('flexible')) return false;
      if (timing === 'Monthly' && !combined.includes('month')) return false;
      if (timing === 'Saturdays' && !combined.includes('sat')) return false;
    }
    return true;
  });

  const hasExtraFilters = timing !== 'All';

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 36, color: ds.c.primary, letterSpacing: -0.5, lineHeight: 42 }}>
            Community
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, marginTop: 6, lineHeight: 20 }}>
            Volunteer opportunities and local events near you
          </Text>
        </View>

        {/* Trust note */}
        <View style={{ marginHorizontal: 24, marginBottom: 20, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 16 }}>💚</Text>
          <Text style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 13, color: '#065f46', lineHeight: 19 }}>
            Opportunities are curated by Teen Hive and local parents. Always verify details with the organiser before attending.
          </Text>
        </View>

        {/* Search */}
        <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 14, paddingHorizontal: 14, gap: 10 }}>
            <Ionicons name="search-outline" size={16} color={ds.c.secondary} />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.primary, paddingVertical: 13 }}
              placeholder="Search opportunities..."
              placeholderTextColor={ds.c.secondary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={ds.c.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.secondary, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 24 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: category === c ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: category === c ? 0 : 1, borderColor: ds.c.outlineVariant }}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: category === c ? '#fff' : ds.c.onSurfaceVariant }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={{ marginTop: 16, marginBottom: 4 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.secondary, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 24 }}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
            {LOCATIONS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLocation(l)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: location === l ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: location === l ? 0 : 1, borderColor: ds.c.outlineVariant }}
              >
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: location === l ? '#fff' : ds.c.onSurfaceVariant }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timing (collapsible) */}
        <View style={{ marginTop: 16, marginBottom: 20, paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={() => setTimingOpen((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: hasExtraFilters ? '#dcfce7' : ds.c.surfaceContainerLow, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: hasExtraFilters ? '#86efac' : ds.c.outlineVariant }}
          >
            <Ionicons name="time-outline" size={13} color={hasExtraFilters ? '#16a34a' : ds.c.onSurfaceVariant} />
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: hasExtraFilters ? '#16a34a' : ds.c.onSurfaceVariant }}>
              {timing !== 'All' ? timing : 'Any time'}
            </Text>
            <Ionicons name={timingOpen ? 'chevron-up' : 'chevron-down'} size={13} color={hasExtraFilters ? '#16a34a' : ds.c.onSurfaceVariant} />
          </TouchableOpacity>

          {timingOpen && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {TIMINGS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setTiming(t); setTimingOpen(false); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: timing === t ? ds.c.primary : ds.c.surfaceContainerLow, borderWidth: 1, borderColor: timing === t ? ds.c.primary : ds.c.outlineVariant }}
                >
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: timing === t ? '#fff' : ds.c.onSurface }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Clear filters */}
        {(category !== 'All' || location !== 'All' || timing !== 'All') && (
          <TouchableOpacity
            onPress={() => { setCategory('All'); setLocation('All'); setTiming('All'); }}
            style={{ marginHorizontal: 24, marginBottom: 16 }}
          >
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: '#dc2626' }}>✕ Clear all filters</Text>
          </TouchableOpacity>
        )}

        {/* Results */}
        {loading ? (
          <ActivityIndicator size="large" color={ds.c.secondary} style={{ marginTop: 48 }} />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>💚</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, textAlign: 'center', marginBottom: 8 }}>
              {posts.length === 0 ? 'No community posts yet' : 'No results'}
            </Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }}>
              {posts.length === 0 ? 'Check back soon — local opportunities are added regularly.' : 'Try adjusting your filters.'}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, gap: 14 }}>
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.secondary, marginBottom: 2 }}>
              {filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'}
            </Text>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/community-detail', params: { id: item.id } } as any)}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}
              >
                {/* Badge row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 11 }}>💚</Text>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 11, color: '#065f46' }}>
                      {item.is_official ? 'Teen Hive Official' : 'Community'}
                    </Text>
                  </View>
                  {item.category && (
                    <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant }}>{item.category}</Text>
                    </View>
                  )}
                </View>

                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 19, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 6, lineHeight: 24 }}>
                  {item.title}
                </Text>

                {item.description ? (
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 19, marginBottom: 12 }} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Meta row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  {item.organization && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="business-outline" size={12} color={ds.c.onSurfaceVariant} />
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{item.organization}</Text>
                    </View>
                  )}
                  {item.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={12} color={ds.c.onSurfaceVariant} />
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{item.location}</Text>
                    </View>
                  ) : null}
                  {item.date ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="calendar-outline" size={12} color={ds.c.onSurfaceVariant} />
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{item.date}</Text>
                    </View>
                  ) : null}
                  {item.time_str ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color={ds.c.onSurfaceVariant} />
                      <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{item.time_str}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: '#16a34a' }}>View details →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
