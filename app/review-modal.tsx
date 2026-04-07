import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel } from '@/lib/design';
import { submitReview } from '@/lib/reviews';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export default function ReviewModal() {
  const { jobId, revieweeId, jobTitle } = useLocalSearchParams<{
    jobId: string; revieweeId: string; jobTitle: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!stars || !user || !jobId || !revieweeId) {
      Alert.alert('Please select a star rating first.');
      return;
    }
    setSubmitting(true);
    const { error } = await submitReview(user.id, revieweeId, jobId, stars, comment);
    setSubmitting(false);
    if (error) { Alert.alert('Error', error); return; }
    Alert.alert('Review submitted', 'Thank you for your feedback!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>

        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 30, color: ds.c.primary, letterSpacing: -0.3, marginBottom: 4 }}>
          Leave a Review
        </Text>
        {jobTitle ? (
          <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: 28 }}>
            for "{jobTitle}"
          </Text>
        ) : <View style={{ height: 20 }} />}

        <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 16 }}>Your Rating</Text>

        {/* Star selector */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setStars(n)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 42, color: n <= stars ? '#f59e0b' : ds.c.outlineVariant }}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        {stars > 0 && (
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary, marginBottom: 24 }}>
            {STAR_LABELS[stars]}
          </Text>
        )}
        {stars === 0 && <View style={{ height: 24 }} />}

        <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
          Write a Review{' '}
          <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.outlineVariant, letterSpacing: 0 }}>(optional)</Text>
        </Text>
        <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 6 }}>
          <TextInput
            style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 90, textAlignVertical: 'top' }}
            placeholder="Describe your experience..."
            placeholderTextColor={ds.c.outlineVariant}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />
        </View>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.outlineVariant, textAlign: 'right', marginBottom: 24 }}>
          {comment.length}/500
        </Text>

        <GradientButton label="Submit Review" onPress={submit} loading={submitting} fullWidth />

        <TouchableOpacity style={{ paddingVertical: 16, alignItems: 'center' }} onPress={() => router.back()}>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
