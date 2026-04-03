import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PARENTS: Record<string, any> = {
  SM: { name: 'Sarah M.', area: 'Maplewood, NJ', since: 'March 2024', initials: 'SM', jobsPosted: 12, avgRating: 4.9, responseRate: '97%' },
  TB: { name: 'Tom B.', area: 'South Orange, NJ', since: 'Jan 2024', initials: 'TB', jobsPosted: 7, avgRating: 4.7, responseRate: '91%' },
  LK: { name: 'Lisa K.', area: 'Millburn, NJ', since: 'Aug 2023', initials: 'LK', jobsPosted: 21, avgRating: 4.8, responseRate: '99%' },
  MR: { name: 'Mike R.', area: 'Maplewood, NJ', since: 'Nov 2023', initials: 'MR', jobsPosted: 9, avgRating: 5.0, responseRate: '100%' },
  CS: { name: 'Carol S.', area: 'Summit, NJ', since: 'May 2024', initials: 'CS', jobsPosted: 4, avgRating: 4.6, responseRate: '88%' },
};

const ACTIVE_JOBS: Record<string, any[]> = {
  SM: [{ id: '1', title: 'Lawn Mowing', pay: '$20/hr', category: 'Yard Work', color: '#22c55e' }],
  TB: [{ id: '2', title: 'Babysitting (Fri eve)', pay: '$15/hr', category: 'Babysitting', color: '#ec4899' }],
  LK: [{ id: '3', title: 'Math Tutoring', pay: '$25/hr', category: 'Tutoring', color: '#3b82f6' }],
  MR: [{ id: '4', title: 'Dog Walking', pay: '$12/hr', category: 'Pet Care', color: '#f59e0b' }],
  CS: [{ id: '5', title: 'Phone Setup Help', pay: '$18/hr', category: 'Tech Help', color: '#8b5cf6' }],
};

const REVIEWS: Record<string, any[]> = {
  SM: [
    { author: 'Jordan M.', stars: 5, text: 'Super clear instructions and paid on time. Great to work for!' },
    { author: 'Alex R.', stars: 5, text: 'Very kind and professional. Would definitely work for her again.' },
    { author: 'Sam K.', stars: 4, text: 'Good communication, job was exactly as described.' },
  ],
  default: [
    { author: 'Jordan M.', stars: 5, text: 'Great parent to work for, very respectful.' },
    { author: 'Sam K.', stars: 5, text: 'Paid promptly and left a great review!' },
    { author: 'Alex R.', stars: 4, text: 'Clear instructions and very organized.' },
  ],
};

export default function ParentProfile() {
  const { initials, chatId } = useLocalSearchParams<{ initials: string; chatId: string }>();
  const router = useRouter();
  const parent = PARENTS[initials ?? 'SM'] ?? PARENTS.SM;
  const jobs = ACTIVE_JOBS[initials ?? 'SM'] ?? [];
  const reviews = REVIEWS[initials ?? 'SM'] ?? REVIEWS.default;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Profile header */}
      <View style={s.profileCard}>
        <View style={s.circle}>
          <Text style={s.initials}>{parent.initials}</Text>
        </View>
        <Text style={s.name}>{parent.name}</Text>
        <View style={s.verifiedBadge}>
          <Text style={s.verifiedText}>✓ Verified Parent</Text>
        </View>
        <Text style={s.area}>📍 {parent.area}</Text>
        <Text style={s.since}>Member since {parent.since}</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statNum}>{parent.jobsPosted}</Text>
          <Text style={s.statLabel}>Jobs Posted</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statNum}>⭐ {parent.avgRating}</Text>
          <Text style={s.statLabel}>Avg Rating</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statNum}>{parent.responseRate}</Text>
          <Text style={s.statLabel}>Response Rate</Text>
        </View>
      </View>

      {/* Active listings */}
      <Text style={s.section}>Active Job Listings</Text>
      {jobs.map(job => (
        <TouchableOpacity key={job.id} style={s.jobCard} onPress={() => router.push(`/job-detail?id=${job.id}`)}>
          <View style={[s.jobPill, { backgroundColor: job.color + '20' }]}>
            <Text style={[s.jobPillText, { color: job.color }]}>{job.category}</Text>
          </View>
          <Text style={s.jobTitle}>{job.title}</Text>
          <Text style={s.jobPay}>{job.pay}</Text>
        </TouchableOpacity>
      ))}

      {/* Reviews */}
      <Text style={s.section}>Reviews from Teens</Text>
      {reviews.map((r, i) => (
        <View key={i} style={s.reviewCard}>
          <View style={s.reviewTop}>
            <View style={s.reviewCircle}>
              <Text style={s.reviewInitial}>{r.author[0]}</Text>
            </View>
            <View>
              <Text style={s.reviewAuthor}>{r.author}</Text>
              <Text style={s.reviewStars}>{'⭐'.repeat(r.stars)}</Text>
            </View>
          </View>
          <Text style={s.reviewText}>{r.text}</Text>
        </View>
      ))}

      {/* Message button */}
      <TouchableOpacity
        style={s.messageBtn}
        onPress={() => router.push(`/chat?id=${chatId ?? '1'}&name=${parent.name}`)}
      >
        <Text style={s.messageBtnText}>💬  Message {parent.name.split(' ')[0]}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },

  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  circle: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  verifiedBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 10 },
  verifiedText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  area: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  since: { fontSize: 13, color: '#94a3b8' },

  statsRow: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: '#e2e8f0' },

  section: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },

  jobCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  jobPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 6 },
  jobPillText: { fontSize: 11, fontWeight: '700' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  jobPay: { fontSize: 14, fontWeight: '700', color: '#22c55e' },

  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  reviewInitial: { fontSize: 15, fontWeight: '800', color: '#16a34a' },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  reviewStars: { fontSize: 12, marginTop: 2 },
  reviewText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  messageBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  messageBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
