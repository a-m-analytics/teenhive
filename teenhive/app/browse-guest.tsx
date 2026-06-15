import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

function getInitials(name: string) {
  return (name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default function BrowseGuest() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [teens, setTeens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isJobs = mode !== 'teens';

  useEffect(() => {
    if (isJobs) {
      supabase
        .from('jobs')
        .select('*, parent:profiles!parent_id(id, full_name, is_verified)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => {
          if (data) setJobs(data);
          setLoading(false);
        });
    } else {
      supabase
        .from('teen_services')
        .select('id, title, category, hourly_rate, teen:profiles!teen_id(id, full_name, age, neighborhood)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => {
          if (data) setTeens(data);
          setLoading(false);
        });
    }
  }, [mode]);

  const signUpAction = isJobs ? 'apply and message parents' : 'post jobs and invite teens';

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, letterSpacing: -0.5 }}>
          {isJobs ? 'Jobs Near You' : 'Teens Offering Help'}
        </Text>
      </View>

      {/* Persistent sign-up banner */}
      <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: ds.c.secondaryContainer, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="sparkles-outline" size={18} color={ds.c.primary} style={{ flexShrink: 0 }} />
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.primary, flex: 1, lineHeight: 18 }}>
          Sign up to {signUpAction} — it's free
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 9 }}
          onPress={() => router.push('/welcome' as any)}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ds.c.secondary} style={{ marginTop: 40 }} />
      ) : isJobs ? (
        /* ── Jobs list ── */
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {jobs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="briefcase-outline" size={32} color={ds.c.outlineVariant} style={{ marginBottom: 10 }} />
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>No open jobs right now — check back soon.</Text>
            </View>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}
                activeOpacity={0.75}
                onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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

                <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.onSurface, letterSpacing: 0.5 }}>VIEW JOB</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        /* ── Teens list ── */
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {teens.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={32} color={ds.c.outlineVariant} style={{ marginBottom: 10 }} />
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>No teens available right now — check back soon.</Text>
            </View>
          ) : (
            teens.map((service) => {
              const teen = service.teen as any;
              if (!teen) return null;
              return (
                <TouchableOpacity
                  key={service.id}
                  style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 12 }}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/teen-profile?id=${teen.id}` as any)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary }}>
                        {getInitials(teen.full_name || 'U')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.onSurface }}>
                        {teen.full_name}{teen.age ? `, ${teen.age}` : ''}
                      </Text>
                      {teen.neighborhood ? (
                        <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{teen.neighborhood}</Text>
                      ) : null}
                    </View>
                    {service.hourly_rate ? (
                      <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>${service.hourly_rate}/hr</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={{ fontFamily: ds.f.serifBold, fontSize: 16, color: ds.c.primary, letterSpacing: -0.2, marginBottom: 8 }}>
                    {service.title}
                  </Text>

                  <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{service.category}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
