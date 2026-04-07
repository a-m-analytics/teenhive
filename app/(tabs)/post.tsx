import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function PostTab() {
  const { profile } = useAuth();
  const router = useRouter();
  const isParent = profile?.role === 'parent';

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

  // Teen view: two options
  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg, paddingTop: 64, paddingHorizontal: 24 }}>
      <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 12 }}>Create</Text>
      <Text style={{ fontFamily: ds.f.serifBold, fontSize: 40, color: ds.c.primary, lineHeight: 46, letterSpacing: -0.5, marginBottom: 8 }}>
        Share Your{'\n'}Skills.
      </Text>
      <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 22, marginBottom: 40 }}>
        Let families discover what you can do, or post tasks you need help with.
      </Text>

      <View style={{ gap: 14 }}>
        {/* Post My Services */}
        <TouchableOpacity
          style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 24, padding: 24 }}
          onPress={() => router.push('/post-service' as any)}
          activeOpacity={0.85}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
            <Ionicons name="star-outline" size={20} color={ds.c.primary} />
          </View>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 22, color: ds.c.white, lineHeight: 28, letterSpacing: -0.2, marginBottom: 6 }}>
            Post My Services
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.65)', lineHeight: 20 }}>
            Offer your skills to families in your neighborhood.
          </Text>
        </TouchableOpacity>

        {/* Post a Job */}
        <TouchableOpacity
          style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}
          onPress={() => router.push('/post-job' as any)}
          activeOpacity={0.85}
        >
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="briefcase-outline" size={22} color={ds.c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.onSurface, marginBottom: 3 }}>Post a Task</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant, lineHeight: 18 }}>
              Need something done? Post a job and get help.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={ds.c.outlineVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
