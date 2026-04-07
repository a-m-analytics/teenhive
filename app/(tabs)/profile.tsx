import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, Share, Switch,
  Text, TouchableOpacity, View,
} from 'react-native';

type MyService = { id: string; title: string; category: string; hourly_rate: number | null; is_active: boolean };

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text key={n} style={{ fontSize: 16, color: n <= stars ? '#f59e0b' : ds.c.outlineVariant }}>★</Text>
        ))}
      </View>
      {count > 0 ? (
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>
          {Number(rating).toFixed(1)} ({count} review{count !== 1 ? 's' : ''})
        </Text>
      ) : (
        <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>No reviews yet</Text>
      )}
    </View>
  );
}

export default function ProfileTab() {
  const router = useRouter();
  const { profile, signOut, user } = useAuth();
  const isTeen = profile?.role !== 'parent';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const [myServices, setMyServices] = useState<MyService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const fetchMyServices = useCallback(async () => {
    if (!user || !isTeen) return;
    setLoadingServices(true);
    const { data } = await supabase.from('teen_services').select('id, title, category, hourly_rate, is_active').eq('teen_id', user.id).order('created_at', { ascending: false });
    if (data) setMyServices(data);
    setLoadingServices(false);
  }, [user, isTeen]);

  useEffect(() => { fetchMyServices(); }, [fetchMyServices]);

  async function toggleServiceActive(serviceId: string, currentValue: boolean) {
    await supabase.from('teen_services').update({ is_active: !currentValue }).eq('id', serviceId);
    setMyServices((prev) => prev.map((s) => s.id === serviceId ? { ...s, is_active: !currentValue } : s));
  }

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message: "I'm using Teen Hive to find local jobs! It connects teens with families in the neighborhood. Download it and join me.",
        title: 'Teen Hive',
      });
    } catch {}
  };

  const teenMenu = [
    { label: 'Edit Profile', icon: 'person-outline' as const, onPress: () => router.push('/teen-setup' as any) },
    { label: 'Saved Jobs', icon: 'bookmark-outline' as const, onPress: () => router.push('/saved-jobs' as any) },
    { label: 'Invite a Friend', icon: 'share-outline' as const, onPress: handleInvite },
    { label: 'Privacy Policy', icon: 'shield-outline' as const, onPress: () => router.push('/privacy' as any) },
    { label: 'Help & Feedback', icon: 'chatbubble-outline' as const, onPress: () => router.push('/feedback' as any) },
  ];

  const parentMenu = [
    { label: 'Edit Profile', icon: 'person-outline' as const, onPress: () => router.push('/parent-setup' as any) },
    { label: 'My Listings', icon: 'list-outline' as const, onPress: () => router.push('/(tabs)/jobs' as any) },
    { label: 'Invite a Friend', icon: 'share-outline' as const, onPress: handleInvite },
    { label: 'Privacy Policy', icon: 'shield-outline' as const, onPress: () => router.push('/privacy' as any) },
    { label: 'Help & Feedback', icon: 'chatbubble-outline' as const, onPress: () => router.push('/feedback' as any) },
  ];

  const menu = isTeen ? teenMenu : parentMenu;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 28 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Your Account</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>Profile</Text>
      </View>

      {/* Avatar + identity */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: isTeen ? ds.c.primaryContainer : ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 30, color: isTeen ? ds.c.white : ds.c.primary }}>{initials}</Text>
        </View>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 4 }}>
          {profile?.full_name ?? 'Your Name'}
        </Text>
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: isTeen ? 12 : 6 }}>
          {isTeen ? 'Teen Worker' : 'Parent'}
        </Text>
        {!isTeen && profile?.neighborhood ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={14} color={ds.c.onSurfaceVariant} />
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>{profile.neighborhood}</Text>
          </View>
        ) : null}
        {isTeen && (
          <StarRating
            rating={profile?.rating ?? 0}
            count={profile?.rating_count ?? 0}
          />
        )}
      </View>

      {/* Stats strip */}
      <View style={{ marginHorizontal: 24, marginBottom: 28, flexDirection: 'row', gap: 10 }}>
        {isTeen ? (
          <>
            <View style={{ flex: 1, backgroundColor: ds.c.primaryContainer, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.secondaryContainer, letterSpacing: -0.3, marginBottom: 2 }}>{profile?.jobs_completed ?? 0}</Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: 'rgba(243,251,244,0.6)', letterSpacing: 0.5 }}>Jobs Done</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 2 }}>
                {(profile?.rating_count ?? 0) > 0 ? Number(profile?.rating).toFixed(1) : '—'}
              </Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.5 }}>Rating</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 2 }}>{profile?.rating_count ?? 0}</Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.5 }}>Reviews</Text>
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 2 }}>{profile?.jobs_completed ?? 0}</Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.5 }}>Jobs Posted</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 2 }}>{profile?.rating_count ?? 0}</Text>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.5 }}>Reviews Given</Text>
            </View>
          </>
        )}
      </View>

      {/* My Services (teens only) */}
      {isTeen && (
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
            <View>
              <Text style={{ ...dsSecondaryLabel, marginBottom: 4 }}>What I Offer</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>My Services</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 }}
              onPress={() => router.push('/post-service' as any)}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {loadingServices ? (
            <ActivityIndicator size="small" color={ds.c.secondary} style={{ marginLeft: 24 }} />
          ) : myServices.length === 0 ? (
            <TouchableOpacity
              style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 28, alignItems: 'center' }}
              onPress={() => router.push('/post-service' as any)}
            >
              <Ionicons name="add-circle-outline" size={32} color={ds.c.outlineVariant} style={{ marginBottom: 10 }} />
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: 4 }}>No services posted yet</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.secondary }}>Tap to post your first service</Text>
            </TouchableOpacity>
          ) : (
            myServices.map((service) => (
              <View key={service.id} style={{ marginHorizontal: 24, marginBottom: 10, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.onSurface, marginBottom: 6 }}>{service.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{service.category}</Text>
                      </View>
                      {service.hourly_rate ? (
                        <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>${service.hourly_rate}/hr</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Switch
                    value={service.is_active}
                    onValueChange={() => toggleServiceActive(service.id, service.is_active)}
                    trackColor={{ true: ds.c.secondary, false: ds.c.outlineVariant }}
                    thumbColor={ds.c.white}
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: service.is_active ? ds.c.secondary : ds.c.outlineVariant }}>
                  {service.is_active ? 'Active — visible to parents' : 'Paused — hidden from feed'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Menu */}
      <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: i < menu.length - 1 ? 1 : 0, borderBottomColor: ds.c.surfaceContainerHigh }}
            onPress={item.onPress}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={item.icon} size={16} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.outlineVariant} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={{ marginHorizontal: 24, borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 9999, paddingVertical: 14, alignItems: 'center', marginBottom: 20 }}
        onPress={handleSignOut}
      >
        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.error }}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, textAlign: 'center', marginBottom: 8 }}>
        Teen Hive · Version 0.1.0 Beta
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant }}>·</Text>
        <TouchableOpacity onPress={() => router.push('/terms' as any)}>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}
