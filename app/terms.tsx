import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SECTIONS = [
  {
    title: 'Who can use Teen Hive',
    body: 'Teen Hive is for users aged 13 and over and parents/guardians aged 18 and over. By creating an account, you confirm you meet these requirements and that the information you provide is accurate.',
  },
  {
    title: 'What Teen Hive is',
    body: 'Teen Hive is a platform that helps teens find local jobs and parents find local help. We connect people — we are not an employer, staffing agency, or party to any job agreement made through the app.',
  },
  {
    title: 'Your responsibilities',
    body: 'You are responsible for your own safety when meeting in person. Always meet in public places first. Tell a trusted adult about any job you accept. Never share your home address until you are comfortable.',
  },
  {
    title: 'Payments',
    body: 'Teen Hive does not process payments. All payment arrangements are made directly between teens and parents. We are not responsible for payment disputes.',
  },
  {
    title: 'Community rules',
    body: 'Be respectful. No harassment, spam, fake profiles, or inappropriate content. Violations may result in account suspension or removal. Report bad behavior using the in-app report tool.',
  },
  {
    title: 'Content you post',
    body: 'By posting on Teen Hive, you give us permission to display your content within the app. You retain ownership. Do not post content that is illegal, harmful, or violates anyone\'s privacy.',
  },
  {
    title: 'Termination',
    body: 'We reserve the right to suspend or delete accounts that violate these terms. You can delete your own account at any time from your profile.',
  },
  {
    title: 'Changes to these terms',
    body: 'We may update these terms as the app grows. We\'ll notify you of major changes. Continued use of the app means you accept the updated terms.',
  },
  {
    title: 'Contact',
    body: 'Questions? Email us at hello@teenhive.app',
  },
];

export default function Terms() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 32 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <Ionicons name="chevron-back" size={18} color={ds.c.secondary} />
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, lineHeight: 38, letterSpacing: -0.3, marginBottom: 8 }}>
          Terms of Service
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>
          Last updated: April 2026
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, gap: 24 }}>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, lineHeight: 24 }}>
          By using Teen Hive, you agree to these terms. Please read them — they're written to be simple and fair.
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
