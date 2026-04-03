import { FAKE_LISTINGS, updateListingStatus } from '@/lib/store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = ['Active', 'In Progress', 'Completed'];
const CAT_COLORS: Record<string, string> = {
  'Yard Work': '#22c55e', Babysitting: '#ec4899', Tutoring: '#3b82f6',
  'Pet Care': '#f59e0b', 'Tech Help': '#8b5cf6', Cleaning: '#06b6d4', Errands: '#f97316',
};

export default function MyListings() {
  const router = useRouter();
  const [tab, setTab] = useState('Active');
  const [listings, setListings] = useState(FAKE_LISTINGS);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const shown = listings.filter(l => l.status === tab);

  const markComplete = (id: string) => {
    Alert.alert('Mark as Complete?', 'This will move the job to your completed listings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: () => {
          updateListingStatus(id, 'Completed');
          setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'Completed' as const } : l));
        },
      },
    ]);
  };

  const leaveReview = (id: string, title: string) => {
    router.push(`/review-modal?targetId=${id}&jobTitle=${title}`);
  };

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.header}>My Listings</Text>

      <View style={s.tabRow}>
        {TABS.map(t => {
          const count = listings.filter(l => l.status === t).length;
          return (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t}</Text>
              {count > 0 && <View style={[s.dot, tab === t && s.dotOn]}><Text style={s.dotText}>{count}</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {shown.length === 0 && <Text style={s.empty}>No {tab.toLowerCase()} listings.</Text>}
        {shown.map(l => {
          const color = CAT_COLORS[l.category] || '#22c55e';
          const reviewed = reviewedIds.includes(l.id);
          return (
            <View key={l.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.pill, { backgroundColor: color + '20' }]}>
                  <Text style={[s.pillText, { color }]}>{l.category}</Text>
                </View>
                <View style={s.appsBadge}>
                  <Text style={s.appsBadgeText}>{l.applicants} applicant{l.applicants !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{l.title}</Text>
              <Text style={s.cardSub}>{l.pay} · {l.location}</Text>
              {l.recurring && <Text style={s.recurring}>🔁 {l.frequency}</Text>}

              {l.status === 'In Progress' && (
                <TouchableOpacity style={s.completeBtn} onPress={() => markComplete(l.id)}>
                  <Text style={s.completeBtnText}>✓ Mark as Complete</Text>
                </TouchableOpacity>
              )}

              {l.status === 'Completed' && (
                reviewed
                  ? <View style={s.reviewedBadge}><Text style={s.reviewedText}>✓ Review Submitted</Text></View>
                  : <TouchableOpacity style={s.reviewBtn} onPress={() => {
                      leaveReview(l.id, l.title);
                      setReviewedIds(r => [...r, l.id]);
                    }}>
                      <Text style={s.reviewBtnText}>⭐ Leave a Review</Text>
                    </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', paddingTop: 56 },
  backBtn: { paddingHorizontal: 20, marginBottom: 4 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  header: { fontSize: 24, fontWeight: '800', color: '#0f172a', paddingHorizontal: 20, marginBottom: 16 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#e2f5e9', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  tabBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextOn: { color: '#22c55e' },
  dot: { backgroundColor: '#94a3b8', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dotOn: { backgroundColor: '#22c55e' },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 15, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  appsBadge: { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  appsBadgeText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  recurring: { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginBottom: 8 },
  completeBtn: { marginTop: 12, backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewBtn: { marginTop: 12, backgroundColor: '#fef9c3', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#fbbf24' },
  reviewBtnText: { color: '#92400e', fontWeight: '700', fontSize: 14 },
  reviewedBadge: { marginTop: 12, backgroundColor: '#dcfce7', borderRadius: 10, padding: 12, alignItems: 'center' },
  reviewedText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
});
