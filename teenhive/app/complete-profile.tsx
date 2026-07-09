import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isTeen = profile?.role === 'teen';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photos access needed',
        'Go to Settings → Teen Hive → Photos and allow access, then try again.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const upload = async () => {
    if (!imageUri || !user) return;
    setUploading(true);
    try {
      const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      // Refresh profile in context so AuthGate sees the new avatar_url
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

      {/* Avatar circle */}
      <TouchableOpacity
        onPress={pickImage}
        activeOpacity={0.85}
        style={{
          width: 148, height: 148, borderRadius: 74,
          backgroundColor: ds.c.surfaceContainerLow,
          borderWidth: 2,
          borderColor: imageUri ? ds.c.secondary : ds.c.outlineVariant,
          borderStyle: imageUri ? 'solid' : 'dashed',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 32, overflow: 'hidden',
        }}
      >
        {imageUri
          ? <Image source={{ uri: imageUri }} style={{ width: 148, height: 148, borderRadius: 74 }} />
          : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: ds.c.primaryContainer,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="camera-outline" size={26} color={ds.c.secondary} />
              </View>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurfaceVariant }}>
                Tap to choose
              </Text>
            </View>
          )
        }
      </TouchableOpacity>

      <Text style={{
        fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary,
        textAlign: 'center', letterSpacing: -0.5, marginBottom: 12, lineHeight: 38,
      }}>
        Add a photo.
      </Text>

      <Text style={{
        fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant,
        textAlign: 'center', lineHeight: 23, marginBottom: 36,
      }}>
        {isTeen
          ? 'Parents trust teens they can see. Add a clear profile photo to continue.'
          : 'Teens feel safer knowing who they\'re working for. Add a profile photo to continue.'
        }
      </Text>

      {imageUri ? (
        <>
          <TouchableOpacity
            style={{
              backgroundColor: ds.c.primary, borderRadius: 9999,
              paddingVertical: 18, alignItems: 'center', width: '100%', marginBottom: 12,
              opacity: uploading ? 0.6 : 1,
            }}
            onPress={upload}
            disabled={uploading}
          >
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white }}>
              {uploading ? 'Uploading...' : 'Use this photo →'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 12 }} onPress={pickImage}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>
              Choose a different photo
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: ds.c.primary, borderRadius: 9999,
            paddingVertical: 18, alignItems: 'center', width: '100%',
          }}
          onPress={pickImage}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white }}>
            Choose from library
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}
