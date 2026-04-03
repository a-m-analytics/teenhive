import { addReview } from '@/lib/store';
import { currentUser } from '@/lib/user';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReviewModal() {
  const { targetId, jobTitle } = useLocalSearchParams<{ targetId: string; jobTitle: string }>();
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');

  const submit = () => {
    if (stars === 0) return Alert.alert('Select a star rating first');
    addReview({ targetId: targetId ?? '', author: currentUser.name || 'Anonymous', stars, text });
    Alert.alert('Review Submitted! ⭐', 'Thank you for your feedback.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <Text style={s.title}>Leave a Review</Text>
        {jobTitle ? <Text style={s.sub}>for "{jobTitle}"</Text> : null}

        {/* Stars */}
        <Text style={s.label}>Your Rating</Text>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setStars(n)} style={s.starBtn}>
              <Text style={[s.star, n <= stars && s.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.starLabel}>
          {stars === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
        </Text>

        {/* Written review */}
        <Text style={s.label}>Write a Review <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={s.input}
          placeholder="Describe your experience..."
          value={text}
          onChangeText={setText}
          multiline
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity style={[s.submitBtn, stars === 0 && s.submitBtnDisabled]} onPress={submit} disabled={stars === 0}>
          <Text style={s.submitText}>Submit Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginTop: 16 },
  optional: { fontWeight: '400', color: '#94a3b8' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 42, color: '#e2e8f0' },
  starOn: { color: '#f59e0b' },
  starLabel: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top', color: '#0f172a', backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
});
