import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SECTIONS = [
  {
    title: '1. What Information Do We Collect?',
    body: 'We collect personal information that you voluntarily provide when you register on the Services or participate in activities on the app.\n\nPersonal information we collect includes: names, email addresses, usernames, passwords, and contact or authentication data.\n\nWe do not process sensitive information (such as racial or ethnic origins, sexual orientation, or religious beliefs).\n\nApplication Data: We may request to send you push notifications regarding your account or certain features of the app. You may turn these off in your device settings.\n\nWe also automatically collect certain information when you use the Services, including your IP address, device type, operating system, and usage data such as the date/time stamps associated with your activity.',
  },
  {
    title: '2. How Do We Process Your Information?',
    body: 'We process your personal information to:\n\n• Facilitate account creation, authentication, and account management\n• Deliver and facilitate the services you request\n• Respond to your inquiries and provide user support\n• Send administrative information (updates, policy changes)\n• Enable user-to-user communications within the app\n• Request feedback and improve our Services\n• Post testimonials on our Services that may contain personal information\n• Comply with legal obligations and prevent fraud\n\nWe process your information only when we have a valid legal reason to do so.',
  },
  {
    title: '3. When and With Whom Do We Share Your Information?',
    body: 'We do not sell your personal information to third parties.\n\nWe may share information with:\n\n• Service providers who assist in operating our platform (e.g., hosting, analytics)\n• Analytics providers such as PostHog for anonymized usage analytics\n• Law enforcement or government authorities when required by law\n\nAll third-party service providers are contractually required to keep your information confidential and use it only for the purposes we specify.',
  },
  {
    title: '4. How Long Do We Keep Your Information?',
    body: 'We keep your personal information for as long as your account is active or as needed to provide you with the Services.\n\nIf you delete your account, we will delete or anonymize your personal information within 30 days, unless we are legally required to retain it longer (for example, for fraud prevention or legal compliance).\n\nMessages and job records may be retained in anonymized form for safety and dispute-resolution purposes.',
  },
  {
    title: '5. How Do We Keep Your Information Safe?',
    body: 'We have implemented appropriate technical and organizational security measures to protect your personal information, including:\n\n• Encrypted data transmission (HTTPS/TLS)\n• Secure cloud storage via Supabase with row-level security\n• Authentication via hashed passwords and session tokens\n\nHowever, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure. We cannot promise that unauthorized third parties will never be able to defeat our security measures.',
  },
  {
    title: '6. What Are Your Privacy Rights?',
    body: 'Depending on where you are located, you may have the right to:\n\n• Access the personal information we hold about you\n• Correct inaccurate or incomplete information\n• Request deletion of your personal information\n• Withdraw consent where processing is based on consent\n• Lodge a complaint with a data protection authority\n\nTo exercise any of these rights, contact us at teenhive8149buisness@gmail.com. We will respond to all requests in accordance with applicable data protection laws.',
  },
  {
    title: '7. Controls for Do-Not-Track Features',
    body: 'Most web browsers and some mobile operating systems include a Do-Not-Track (DNT) feature or setting. At this time, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.',
  },
  {
    title: '8. Do United States Residents Have Specific Privacy Rights?',
    body: 'If you are a resident of California or another US state with applicable privacy laws, you may have additional rights regarding your personal information, including:\n\n• The right to know what personal information we have collected about you\n• The right to delete your personal information\n• The right to correct inaccurate personal information\n• The right to opt out of the sale of personal information (we do not sell personal information)\n• The right to non-discrimination for exercising your privacy rights\n\nTo submit a request, contact us at teenhive8149buisness@gmail.com.',
  },
  {
    title: '9. Minors',
    body: 'TeenHive is designed for users 13 and older. Users under 18 should review this policy with a parent or guardian.\n\nWe do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13 without parental consent, we will delete that information promptly.\n\nIf you believe we have inadvertently collected information from a child under 13, please contact us at teenhive8149buisness@gmail.com.',
  },
  {
    title: '10. Do We Make Updates to This Notice?',
    body: 'We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Last updated" date at the top of this notice.\n\nWe will notify you of any material changes by updating the date of this notice and, where appropriate, through in-app notifications. We encourage you to review this notice periodically.',
  },
  {
    title: '11. How Can You Contact Us?',
    body: 'If you have questions or comments about this notice, you may contact us at:\n\nTeenHive\nEmail: teenhive8149buisness@gmail.com\n\nFor rights requests (access, deletion, correction), email the same address with the subject line "Privacy Rights Request."',
  },
  {
    title: '12. How Can You Review, Update, or Delete Your Data?',
    body: 'You can review or update your profile information at any time from within the app (Profile → Edit Profile).\n\nTo request full deletion of your account and all associated data, go to Profile → Delete Account, or email us at teenhive8149buisness@gmail.com.\n\nAll associated data will be permanently removed within 30 days of your request.',
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
          Last updated: April 23, 2026
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, gap: 8, marginBottom: 24 }}>
        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.secondary, letterSpacing: 0.5 }}>
          SUMMARY
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface, lineHeight: 22 }}>
          This Privacy Notice for TeenHive ("we," "us," or "our") describes how and why we collect, store, use, and share your personal information when you use our app. We do not sell your data. We do not process sensitive information. We do not collect data from children under 13. Questions? Email us at teenhive8149buisness@gmail.com.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, gap: 16 }}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary, marginBottom: 10 }}>
              {section.title}
            </Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurface, lineHeight: 21 }}>
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
