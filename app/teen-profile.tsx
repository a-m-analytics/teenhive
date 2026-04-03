import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DATA: Record<string, any> = {
  '1': { name: 'Jordan M.', age: 16, initials: 'JM', bio: 'Hardworking teen who loves being outdoors. Reliable and punctual.', skills: ['Yard Work', 'Errands', 'Cleaning'], rating: 4.8, reviews: 12, completed: 15, availability: 'Weekends, After School' },
  '2': { name: 'Sam K.', age: 15, initials: 'SK', bio: 'Experienced babysitter, great with kids ages 2–10. First aid certified.', skills: ['Babysitting', 'Pet Care', 'Tutoring'], rating: 4.6, reviews: 8, completed: 10, availability: 'Weekdays after 3pm, Weekends' },
  '3': { name: 'Alex R.', age: 17, initials: 'AR', bio: 'Tech-savvy and patient tutor. Can help with most school subjects and devices.', skills: ['Tech Help', 'Tutoring', 'Errands'], rating: 5.0, reviews: 21, completed: 23, availability: 'Weekends only' },
};
const JOBS = [{ id: '1', title: 'Lawn Mowing' }, { id: '2', title: 'Babysitting' }];
const REVIEWS = [
  { author: 'Sarah M.', text: 'Great work, very reliable!', stars: 5 },
  { author: 'Tom B.', text: 'Showed up on time and did a fantastic job.', stars: 5 },
  { author: 'Lisa K.', text: 'Would hire again without hesitation.', stars: 4 },
];

export default function TeenProfile() {
  const { id, parentName } = useLocalSearchParams<{ id: string; parentName: string }>();
  const router = useRouter();
  const teen = DATA[id ?? '1'];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');

  const sendInvite = () => {
    if (!selectedJob) return Alert.alert('Select a job first');
    setModalVisible(false);
    Alert.alert('Invite Sent! 🎉', `${teen.name} has been invited to "${selectedJob}".`);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={s.profileTop}>
        <View style={s.circle}><Text style={s.initials}>{teen.initials}</Text></View>
        <Text style={s.name}>{teen.name}, {teen.age}</Text>
        <Text style={s.rating}>⭐ {teen.rating} · {teen.reviews} reviews</Text>
        <Text style={s.bio}>{teen.bio}</Text>
      </View>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{teen.completed}</Text><Text style={s.statLabel}>Jobs Done</Text></View>
        <View style={s.stat}><Text style={s.statNum}>{teen.rating}</Text><Text style={s.statLabel}>Rating</Text></View>
        <View style={s.stat}><Text style={s.statNum}>{teen.reviews}</Text><Text style={s.statLabel}>Reviews</Text></View>
      </View>
      <Text style={s.section}>Skills</Text>
      <View style={s.skillsRow}>{teen.skills.map((sk: string) => <Text key={sk} style={s.tag}>{sk}</Text>)}</View>
      <Text style={s.section}>Availability</Text>
      <Text style={s.avail}>{teen.availability}</Text>
      <Text style={s.section}>Reviews</Text>
      {REVIEWS.map((r, i) => (
        <View key={i} style={s.reviewCard}>
          <Text style={s.reviewAuthor}>{r.author}  {'⭐'.repeat(r.stars)}</Text>
          <Text style={s.reviewText}>{r.text}</Text>
        </View>
      ))}
      {parentName ? (
        <TouchableOpacity style={s.inviteBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.inviteBtnText}>Invite to Job</Text>
        </TouchableOpacity>
      ) : null}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Select a Job to Invite</Text>
            {JOBS.map(j => (
              <TouchableOpacity key={j.id} style={[s.jobOption, selectedJob === j.title && s.jobSelected]} onPress={() => setSelectedJob(j.title)}>
                <Text style={{ fontWeight: selectedJob === j.title ? '700' : '400', color: selectedJob === j.title ? '#22c55e' : '#0f172a' }}>{j.title}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.inviteBtn} onPress={sendInvite}><Text style={s.inviteBtnText}>Send Invite</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  profileTop: { alignItems: 'center', marginBottom: 20 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  rating: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  bio: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, justifyContent: 'space-around', marginBottom: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 16, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#f0fdf4', color: '#16a34a', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: '600' },
  avail: { fontSize: 14, color: '#475569' },
  reviewCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 10 },
  reviewAuthor: { fontWeight: '700', fontSize: 13, marginBottom: 4, color: '#0f172a' },
  reviewText: { fontSize: 13, color: '#475569' },
  inviteBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  inviteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  jobOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10 },
  jobSelected: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  cancel: { color: '#94a3b8', textAlign: 'center', marginTop: 14, fontSize: 15 },
});
