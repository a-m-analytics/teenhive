import Logo from '@/components/Logo';
import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Replace with your actual App Store app ID once the listing is created
const APP_STORE_ID = 'YOUR_APP_STORE_ID';
const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export default function About() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <Ionicons name="chevron-back" size={18} color={ds.c.secondary} />
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 32, padding: 28, marginBottom: 20 }}>
            <Logo variant="light" size="lg" />
          </View>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 6 }}>
            Teen Hive
          </Text>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>
            Version 1.0.0
          </Text>
        </View>

        <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 24, marginBottom: 24 }}>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24, textAlign: 'center' }}>
            Teen Hive connects teens and young adults (13+) with parents in their neighborhood for local jobs — babysitting, tutoring, yard work, pet care, and more.{'\n\n'}Safe by design. Local by nature.
          </Text>
        </View>

        <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: ds.c.surfaceContainerHigh }}
            onPress={() => router.push('/privacy' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-outline" size={16} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17 }}
            onPress={() => router.push('/terms' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={16} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.outlineVariant} />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: ds.c.surfaceContainerHigh }}
            onPress={() => router.push('/feedback' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="chatbubble-outline" size={16} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>Send Feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17 }}
            onPress={() => Linking.openURL(APP_STORE_URL)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: ds.c.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="star-outline" size={16} color={ds.c.onSurfaceVariant} />
              </View>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: ds.c.onSurface }}>Rate the App</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ds.c.outlineVariant} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, textAlign: 'center', marginTop: 8 }}>
          Made with care · Teen Hive © 2026
        </Text>
      </View>
    </ScrollView>
  );
}
