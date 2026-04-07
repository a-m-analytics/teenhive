import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'We collect your name, email address, age, and the information you choose to add to your profile (bio, skills, availability, neighborhood). We also collect messages sent through the app and records of jobs posted or applied to.',
  },
  {
    title: 'How we use it',
    body: 'Your information is used to run the app — connecting teens with parents, enabling messaging, and showing your profile. We never sell your data to third parties.',
  },
  {
    title: 'Who can see your profile',
    body: 'Other users on Teen Hive can see your public profile (name, skills, rating, bio). Your email address and exact address are never shown to other users.',
  },
  {
    title: 'Messages',
    body: 'Messages between users are stored securely. We may review flagged conversations to enforce our community guidelines.',
  },
  {
    title: 'Minors',
    body: 'Teen Hive is designed for users 13 and older. If you are under 18, please review this policy with a parent or guardian. We do not knowingly collect data from children under 13.',
  },
  {
    title: 'Data deletion',
    body: 'You can delete your account at any time from your profile settings. All associated data will be permanently removed within 30 days.',
  },
  {
    title: 'Contact us',
    body: 'Questions about your privacy? Email us at privacy@teenhive.app',
  },
];

export default function Privacy() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 32 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <Ionicons name="chevron-back" size={18} color={ds.c.secondary} />
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, lineHeight: 38, letterSpacing: -0.3, marginBottom: 8 }}>
          Privacy Policy
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>
          Last updated: April 2026
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, gap: 24 }}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>
          Teen Hive is a neighborhood platform connecting teens with parents for local jobs. We take privacy seriously — especially because many of our users are minors.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, marginBottom: 10 }}>
              {section.title}
            </Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface, lineHeight: 22 }}>
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
