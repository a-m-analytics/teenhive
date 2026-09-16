import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

export default function CommunityDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('community_posts').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setPost(data as CommunityPost);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ds.c.secondary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: ds.f.sans, color: ds.c.secondary }}>Listing not found.</Text>
      </View>
    );
  }

  // Extract any URL from description to use as sign-up link
  const urlMatch = post.description?.match(/https?:\/\/[^\s]+/);
  const signUpUrl = urlMatch?.[0];
  const cleanDescription = post.description?.replace(/https?:\/\/[^\s]+/g, '').trim();

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>← Back</Text>
          </TouchableOpacity>

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>💚</Text>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: '#065f46' }}>
                {post.is_official ? 'Teen Hive Official' : 'Community'}
              </Text>
            </View>
            {post.category && (
              <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{post.category}</Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 30, color: ds.c.primary, letterSpacing: -0.5, lineHeight: 36, marginBottom: 8 }}>
            {post.title}
          </Text>

          {post.organization && (
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.secondary }}>
              {post.organization}
            </Text>
          )}
        </View>

        {/* Details card */}
        <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 20, gap: 14, marginBottom: 20 }}>
          {post.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</Text>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.primary }}>{post.location}</Text>
              </View>
            </View>
          )}
          {post.date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>When</Text>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.primary }}>{post.date}</Text>
              </View>
            </View>
          )}
          {post.time_str && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</Text>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.primary }}>{post.time_str}</Text>
              </View>
            </View>
          )}
        </View>

        {/* About */}
        <View style={{ marginHorizontal: 24, marginBottom: 20 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary, marginBottom: 12 }}>About</Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 23 }}>
            {cleanDescription}
          </Text>
        </View>

        {/* Sign up link if available */}
        {signUpUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(signUpUrl)}
            style={{ marginHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 20 }}
          >
            <Ionicons name="open-outline" size={18} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: '#16a34a' }}>Sign up / Learn more</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.secondary, marginTop: 2 }} numberOfLines={1}>{signUpUrl}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.secondary} />
          </TouchableOpacity>
        )}

        {/* Disclaimer */}
        <View style={{ marginHorizontal: 24, backgroundColor: '#fffbeb', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#fde68a' }}>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: '#92400e', lineHeight: 18 }}>
            Always verify details directly with the organiser before attending. Teen Hive is not responsible for third-party events.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {signUpUrl && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: ds.c.bg, borderTopWidth: 1, borderTopColor: ds.c.outlineVariant }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(signUpUrl)}
            style={{ backgroundColor: '#16a34a', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: '#fff', letterSpacing: 0.5 }}>Sign Up Now 💚</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
