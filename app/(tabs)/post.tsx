import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PostTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isParent = profile?.role === 'parent';
  const [myServices, setMyServices] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    if (!user || isParent) return;
    supabase.from('teen_services').select('id, title, category, hourly_rate, is_active, created_at').eq('teen_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMyServices(data);
    });
  }, [user, isParent]));

  async function toggleService(id: string, current: boolean) {
    await supabase.from('teen_services').update({ is_active: !current }).eq('id', id);
    setMyServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  }

  async function deleteService(id: string) {
    Alert.alert('Delete Service', 'Remove this service listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('teen_services').delete().eq('id', id);
        setMyServices((prev) => prev.filter((s) => s.id !== id));
      }},
    ]);
  }

  if (isParent) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, paddingTop: 64, paddingHorizontal: 24 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 12 }}>Community Exchange</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 40, color: ds.c.primary, lineHeight: 46, letterSpacing: -0.5, marginBottom: 8 }}>
          Post an{'\n'}Opportunity.
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22, marginBottom: 40 }}>
          Describe the job and teens in your area will apply.
        </Text>
        <GradientButton label="Post a Job" onPress={() => router.push('/post-job' as any)} fullWidth />
      </View>
    );
  }

  // Teen view
  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: 64, paddingHorizontal: 24, marginBottom: 32 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 12 }}>Create</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 40, color: ds.c.primary, lineHeight: 46, letterSpacing: -0.5, marginBottom: 8 }}>
          Share Your{'\n'}Skills.
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22, marginBottom: 32 }}>
          Let families discover what you can do.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 24, padding: 24 }}
          onPress={() => router.push('/post-service' as any)}
          activeOpacity={0.85}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
            <Ionicons name="add-circle-outline" size={20} color={ds.c.primary} />
          </View>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.white, lineHeight: 28, letterSpacing: -0.2, marginBottom: 6 }}>
            Post a New Service
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.65)', lineHeight: 20 }}>
            Offer your skills to families in your neighborhood.
          </Text>
        </TouchableOpacity>
      </View>

      {/* My Services */}
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.primary, letterSpacing: -0.3 }}>My Services</Text>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>{myServices.length} listing{myServices.length !== 1 ? 's' : ''}</Text>
        </View>

        {myServices.length === 0 ? (
          <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 28, alignItems: 'center' }}>
            <Ionicons name="star-outline" size={28} color={ds.c.outlineVariant} style={{ marginBottom: 10 }} />
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center' }}>
              No services posted yet.{'\n'}Post one above to appear in Browse Teens.
            </Text>
          </View>
        ) : (
          myServices.map((service) => (
            <View key={service.id} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontFamily: ds.f.serifBold, fontSize: 17, color: ds.c.primary, letterSpacing: -0.2, lineHeight: 23 }}>{service.title}</Text>
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, marginTop: 2 }}>{service.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {service.hourly_rate ? (
                    <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>${service.hourly_rate}/hr</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={{ backgroundColor: service.is_active ? '#d1fae5' : ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}
                    onPress={() => toggleService(service.id, service.is_active)}
                  >
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: service.is_active ? '#065f46' : ds.c.onSurfaceVariant }}>
                      {service.is_active ? 'Active' : 'Hidden'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, borderRadius: 9999, borderWidth: 1, borderColor: ds.c.outlineVariant, paddingVertical: 9, alignItems: 'center' }}
                  onPress={() => router.push(`/post-service?serviceId=${service.id}` as any)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurface }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 9, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => deleteService(service.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={ds.c.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
