import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ParentProfile = {
  id: string;
  full_name: string;
  neighborhood: string | null;
  bio: string | null;
  rating: number;
  rating_count: number;
  is_verified: boolean;
  created_at: string;
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

function formatMemberSince(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ParentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, neighborhood, bio, rating, rating_count, is_verified, created_at')
        .eq('id', id)
        .single(),
      supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name)')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id),
    ]).then(([profileRes, reviewsRes, jobsRes]) => {
      if (profileRes.data) setParent(profileRes.data as ParentProfile);
      if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[]);
      if (jobsRes.count != null) setJobCount(jobsRes.count);
      setLoading(false);
    });
  }, [id]);

  const handleBlock = async () => {
    if (!user || !id) return;
    Alert.alert('Block User', 'This user will no longer appear in your feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: id });
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ds.c.bg }}>
        <ActivityIndicator size="large" color={ds.c.secondary} />
      </View>
    );
  }

  if (!parent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ds.c.bg }}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant }}>Profile not found.</Text>
      </View>
    );
  }

  const initials = getInitials(parent.full_name);

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={ds.gradient} style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: 'rgba(243,251,244,0.7)' }}>← Back</Text>
            </TouchableOpacity>
            {user?.id !== id && (
              <TouchableOpacity
                onPress={handleBlock}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="rgba(243,251,244,0.7)" />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 32, color: ds.c.primary }}>{initials}</Text>
            </View>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 36, color: ds.c.white, lineHeight: 42, letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' }}>
              {parent.full_name}
            </Text>
            {parent.neighborhood ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="location-outline" size={14} color="rgba(243,251,244,0.55)" />
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: 'rgba(243,251,244,0.55)' }}>{parent.neighborhood}</Text>
              </View>
            ) : null}
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.4)' }}>
              Member since {formatMemberSince(parent.created_at)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'center' }}>
            {parent.is_verified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Ionicons name="shield-checkmark" size={12} color={ds.c.primary} />
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>Verified</Text>
              </View>
            )}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>Parent</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Jobs Posted', value: String(jobCount) },
              { label: 'Rating', value: parent.rating_count > 0 ? Number(parent.rating).toFixed(1) : '—' },
              { label: 'Reviews', value: String(parent.rating_count) },
            ].map((s, i) => (
              <View
                key={s.label}
                style={{ flex: 1, backgroundColor: i === 0 ? ds.c.primaryContainer : ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: i === 0 ? ds.c.secondaryContainer : ds.c.primary, letterSpacing: -0.3, marginBottom: 2 }}>
                  {s.value}
                </Text>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: i === 0 ? 'rgba(243,251,244,0.6)' : ds.c.onSurfaceVariant, letterSpacing: 0.5 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Bio */}
          {parent.bio ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 10 }}>About</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>{parent.bio}</Text>
            </View>
          ) : null}

          {/* Reviews */}
          <View style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 24, padding: 22, marginBottom: 8 }}>
            <Text style={{ ...dsLabel, color: ds.c.secondaryContainer, marginBottom: 14 }}>Reviews</Text>
            {reviews.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: 'rgba(243,251,244,0.5)' }}>No reviews yet</Text>
              </View>
            ) : (
              reviews.map((r, i) => (
                <View
                  key={r.id}
                  style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: 'rgba(243,251,244,0.1)', paddingTop: i > 0 ? 16 : 0, marginTop: i > 0 ? 16 : 0 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: 'rgba(243,251,244,0.8)' }}>
                      {r.reviewer?.full_name ?? 'Anonymous'}
                    </Text>
                    <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{r.rating}/5</Text>
                    </View>
                  </View>
                  {r.comment ? (
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.6)', lineHeight: 20 }}>{r.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
