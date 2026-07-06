import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function VerificationPending() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'You can sign back in any time. We\'ll reach out once your account is verified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: ds.c.bg }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon */}
      <View style={{
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: ds.c.primaryContainer,
        justifyContent: 'center', alignItems: 'center',
        alignSelf: 'center', marginBottom: 32,
      }}>
        <Ionicons name="shield-checkmark-outline" size={44} color={ds.c.secondary} />
      </View>

      <Text style={{
        fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary,
        textAlign: 'center', letterSpacing: -0.5, marginBottom: 14, lineHeight: 40,
      }}>
        You're almost in.
      </Text>

      <Text style={{
        fontFamily: ds.f.sans, fontSize: 16, color: ds.c.onSurfaceVariant,
        textAlign: 'center', lineHeight: 25, marginBottom: 36,
      }}>
        We do a quick verification call with every teen before they go live on Teen Hive. This keeps the community safe for everyone.
      </Text>

      {/* Call info card */}
      <View style={{
        backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24,
        padding: 24, marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="call-outline" size={20} color={ds.c.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, marginBottom: 2 }}>Verification call</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>
              We'll call {profile?.phone ?? 'the number you provided'} within 24 hours
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={20} color={ds.c.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, marginBottom: 2 }}>Takes about 5 minutes</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>Just a quick chat so we know you're who you say you are</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ds.c.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={20} color={ds.c.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, marginBottom: 2 }}>Add a profile photo</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>Helps parents recognise you — add one from your profile</Text>
          </View>
        </View>
      </View>

      {/* Add photo CTA */}
      <TouchableOpacity
        style={{
          backgroundColor: ds.c.primary, borderRadius: 9999,
          paddingVertical: 16, alignItems: 'center', marginBottom: 12,
        }}
        onPress={() => router.push('/(tabs)/profile' as any)}
      >
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white }}>Add profile photo →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ paddingVertical: 14, alignItems: 'center' }}
        onPress={handleSignOut}
      >
        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurfaceVariant }}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
