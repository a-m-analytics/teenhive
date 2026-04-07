import { supabase } from './supabase';
import { awardPoints } from './trustScore';
import { notifyNewReview } from './notifications';

export async function submitReview(
  reviewerId: string,
  revieweeId: string,
  jobId: string,
  rating: number,
  comment: string
): Promise<{ error: string | null }> {
  // Prevent duplicate reviews for the same job
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (existing) return { error: 'You have already reviewed this job.' };

  const { error } = await supabase.from('reviews').insert({
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    job_id: jobId,
    rating,
    comment: comment.trim() || null,
  });

  if (error) return { error: error.message };

  // Recalculate average rating and count in profiles
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await supabase
      .from('profiles')
      .update({ rating: Math.round(avg * 10) / 10, rating_count: allReviews.length })
      .eq('id', revieweeId);
  }

  // Award trust score points to teen for receiving review
  if (rating >= 5) await awardPoints(revieweeId, 'review_5_star');
  else if (rating >= 4) await awardPoints(revieweeId, 'review_4_star');
  else if (rating >= 3) await awardPoints(revieweeId, 'review_3_star');

  // Notify the reviewee
  const { data: reviewer } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', reviewerId)
    .single();

  if (reviewer?.full_name) {
    await notifyNewReview(revieweeId, reviewer.full_name, rating);
  }

  return { error: null };
}

export async function getReviews(userId: string) {
  return supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
}

export async function hasReviewed(reviewerId: string, jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('job_id', jobId)
    .maybeSingle();
  return !!data;
}
