import { supabase } from './supabase';

export const applyToJob = async (jobId: string, teenId: string, parentId: string, message: string) => {
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('teen_id', teenId)
    .single();

  if (existing) throw new Error('You already applied to this job');

  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, teen_id: teenId, parent_id: parentId, status: 'pending', message })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: parentId,
    type: 'new_application',
    title: 'New Application',
    body: 'A teen applied to your job',
    data: { job_id: jobId, teen_id: teenId },
  });

  return data;
};

export const acceptApplication = async (
  applicationId: string,
  jobId: string,
  teenId: string,
  parentId: string,
) => {
  await supabase.from('applications').update({ status: 'accepted' }).eq('id', applicationId);

  await supabase
    .from('jobs')
    .update({ status: 'in_progress', accepted_teen_id: teenId })
    .eq('id', jobId);

  await supabase.from('messages').insert({
    sender_id: parentId,
    receiver_id: teenId,
    content: "Hi! I've accepted your application. Looking forward to working with you!",
    job_id: jobId,
    read: false,
  });

  await supabase.from('notifications').insert({
    user_id: teenId,
    type: 'application_accepted',
    title: 'Application Accepted!',
    body: 'A parent accepted your application. You can now chat!',
    data: { job_id: jobId, parent_id: parentId },
  });
};

export const declineApplication = async (applicationId: string, teenId: string) => {
  await supabase.from('applications').update({ status: 'declined' }).eq('id', applicationId);

  await supabase.from('notifications').insert({
    user_id: teenId,
    type: 'application_declined',
    title: 'Application Update',
    body: 'A parent has declined your application',
    data: {},
  });
};

export const completeJob = async (jobId: string, applicationId: string, teenId: string) => {
  await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);

  await supabase.from('applications').update({ status: 'completed' }).eq('id', applicationId);

  // Increment jobs_completed
  const { data: p } = await supabase.from('profiles').select('jobs_completed').eq('id', teenId).single();
  await supabase
    .from('profiles')
    .update({ jobs_completed: ((p as any)?.jobs_completed ?? 0) + 1 })
    .eq('id', teenId);

  await supabase.from('notifications').insert({
    user_id: teenId,
    type: 'job_completed',
    title: 'Job Complete!',
    body: 'Great work! The job has been marked complete.',
    data: { job_id: jobId },
  });
};

export const submitReview = async (
  reviewerId: string,
  revieweeId: string,
  jobId: string,
  rating: number,
  comment: string,
) => {
  await supabase.from('reviews').insert({
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    job_id: jobId,
    rating,
    comment,
  });

  // Recalculate average rating
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId);

  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
    await supabase
      .from('profiles')
      .update({ rating: Math.round(avg * 10) / 10, rating_count: reviews.length })
      .eq('id', revieweeId);
  }

  await supabase.from('notifications').insert({
    user_id: revieweeId,
    type: 'new_review',
    title: 'New Review!',
    body: `You received a ${rating} star review`,
    data: { job_id: jobId },
  });
};
