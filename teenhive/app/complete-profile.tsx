import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';

export default function CompleteProfile() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.');
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
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo. Make sure the avatars storage bucket exists in Supabase.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>

      <Text style={{ fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary, textAlign: 'center', letterSpacing: -0.5, marginBottom: 12, lineHeight: 40 }}>
        Add a profile photo.
      </Text>
      <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, textAlign: 'center', lineHeight: 23, marginBottom: 40 }}>
        A clear photo helps {profile?.role === 'teen' ? 'parents' : 'teens'} know who they're working with. This is required to use Teen Hive.
      </Text>

      {/* Photo picker */}
      <TouchableOpacity
        onPress={pickImage}
        style={{
          width: 140, height: 140, borderRadius: 70,
          backgroundColor: ds.c.surfaceContainerLow,
          borderWidth: 2, borderColor: ds.c.outlineVariant,
          borderStyle: 'dashed',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 36,
          overflow: 'hidden',
        }}
      >
        {imageUri
          ? <Image source={{ uri: imageUri }} style={{ width: 140, height: 140, borderRadius: 70 }} />
          : <>
              <Ionicons name="camera-outline" size={36} color={ds.c.onSurfaceVariant} />
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurfaceVariant, marginTop: 8 }}>Choose photo</Text>
            </>
        }
      </TouchableOpacity>

      {imageUri && (
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
      )}

      {!imageUri && (
        <TouchableOpacity
          style={{
            backgroundColor: ds.c.primary, borderRadius: 9999,
            paddingVertical: 18, alignItems: 'center', width: '100%',
          }}
          onPress={pickImage}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white }}>Choose from library</Text>
        </TouchableOpacity>
      )}

      {imageUri && (
        <TouchableOpacity style={{ marginTop: 12, paddingVertical: 10 }} onPress={pickImage}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Choose a different photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
