import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function ProfileTab() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user || !profile) return;
    if (profile.role === 'teen') {
      supabase.from('applications').select('id, created_at, job:jobs(id, title, category, pay_rate, pay_type, date)').eq('teen_id', user.id).eq('status', 'completed').order('created_at', { ascending: false }).limit(10).then(({ data }) => {
        if (data) setJobHistory(data.map((a: any) => ({ ...a.job, completedAt: a.created_at })));
      });
    } else {
      supabase.from('jobs').select('id, title, category, pay_rate, pay_type, date, updated_at').eq('parent_id', user.id).eq('status', 'completed').order('updated_at', { ascending: false }).limit(10).then(({ data }) => {
        if (data) setJobHistory(data.map((j: any) => ({ ...j, completedAt: j.updated_at })));
      });
    }
  }, [user, profile]));

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ds.c.bg }}>
        <ActivityIndicator size="large" color={ds.c.secondary} />
      </View>
    );
  }

  const isTeen = profile?.role !== 'parent';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets[0] || !user) return;
    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl + '?t=' + Date.now());
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              // Delete profile data first (cascades via RLS)
              await supabase.from('profiles').delete().eq('id', user.id);
              // Sign out and redirect
              await signOut();
              router.replace('/welcome' as any);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome' as any);
        },
      },
    ]);
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message: "I'm using Teen Hive to find local jobs! Download it and join me.",
        title: 'Teen Hive',
      });
    } catch {}
  };

  const menuItems = [
    { label: 'Edit Profile', icon: 'person-outline' as const, onPress: () => router.push(isTeen ? '/teen-setup' : '/parent-setup' as any) },
    { label: 'Notifications', icon: 'notifications-outline' as const, onPress: () => router.push('/notifications' as any) },
    ...(isTeen ? [{ label: 'Saved Jobs', icon: 'bookmark-outline' as const, onPress: () => router.push('/saved-jobs' as any) }] : []),
    ...(isTeen ? [] : [{ label: 'Browse Teens', icon: 'people-outline' as const, onPress: () => router.push('/browse-teens' as any) }]),
    { label: 'Invite a Friend', icon: 'share-outline' as const, onPress: handleInvite },
    { label: 'Help & Feedback', icon: 'chatbubble-outline' as const, onPress: () => router.push('/feedback' as any) },
    { label: 'Privacy Policy', icon: 'shield-outline' as const, onPress: () => router.push('/privacy' as any) },
    { label: 'Terms of Service', icon: 'document-text-outline' as const, onPress: () => router.push('/terms' as any) },
    { label: 'About', icon: 'information-circle-outline' as const, onPress: () => router.push('/about' as any) },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 28 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Your Account</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>Profile</Text>
      </View>

      {/* Avatar + identity */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 28 }}>
        <TouchableOpacity onPress={handlePickAvatar} style={{ marginBottom: 14 }} activeOpacity={0.8}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 88, height: 88, borderRadius: 44 }} />
            ) : (
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 30, color: ds.c.white }}>{initials}</Text>
            )}
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: ds.c.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: ds.c.bg }}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={ds.c.white} />
            ) : (
              <Ionicons name="camera" size={13} color={ds.c.white} />
            )}
          </View>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 8 }}>
          {profile?.full_name ?? 'Your Name'}
        </Text>
        <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: profile?.neighborhood ? 8 : 0 }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurfaceVariant }}>
            {isTeen ? 'Teen' : 'Parent'}
          </Text>
        </View>
        {profile?.neighborhood ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={13} color={ds.c.onSurfaceVariant} />
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>{profile.neighborhood}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats (teens only) */}
      {isTeen && (
        <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
          <View style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 20, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.secondaryContainer, letterSpacing: -0.3, marginBottom: 2 }}>{profile?.jobs_completed ?? 0}</Text>
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 11, color: 'rgba(243,251,244,0.6)', letterSpacing: 0.5 }}>Jobs Done</Text>
          </View>
        </View>
      )}

      {/* Job History */}
      <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 20, color: ds.c.primary, letterSpacing: -0.3 }}>
            {isTeen ? 'Job History' : 'Completed Jobs'}
          </Text>
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.onSurfaceVariant }}>{jobHistory.length} total</Text>
          </View>
        </View>
        {jobHistory.length === 0 ? (
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 20, alignItems: 'center' }}>
            <Ionicons name="briefcase-outline" size={24} color={ds.c.outlineVariant} style={{ marginBottom: 8 }} />
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant, textAlign: 'center' }}>
              {isTeen ? 'Complete your first job to see it here.' : 'Completed jobs will appear here.'}
            </Text>
          </View>
        ) : (
          jobHistory.map((job, i) => (
            <View key={job.id ?? i} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Ionicons name="checkmark-circle" size={20} color={ds.c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface, marginBottom: 2 }} numberOfLines={1}>{job.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{job.category}</Text>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant }}>·</Text>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>${job.pay_rate}{job.pay_type === 'hourly' ? '/hr' : ' flat'}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.outlineVariant }}>{job.completedAt ? formatDate(job.completedAt) : ''}</Text>
            </View>
          ))
        )}
      </View>

      {/* Menu */}
      <View style={{ marginHorizontal: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: ds.c.surfaceContainerHigh }}
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
        style={{ marginHorizontal: 24, backgroundColor: '#fef2f2', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.error, letterSpacing: 0.5 }}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete account */}
      <TouchableOpacity
        style={{ marginHorizontal: 24, borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 32 }}
        onPress={handleDeleteAccount}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
