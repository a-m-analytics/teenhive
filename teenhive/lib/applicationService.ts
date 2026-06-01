import { supabase } from './supabase';
import { trackJobApplied, trackApplicationAccepted, trackInviteSent, trackJobCompleted } from './analytics';

export const applyToJob = async (
  jobId: string,
  teenId: string,
  parentId: string,
  message: string,
  teenName?: string,
  jobTitle?: string,
) => {
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('teen_id', teenId)
    .maybeSingle();

  if (existing) throw new Error('You already applied to this job');

  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, teen_id: teenId, parent_id: parentId, status: 'pending', message })
    .select()
    .single();

  if (error) throw error;

  trackJobApplied(jobId, teenId, parentId);

  await supabase.from('notifications').insert({
    user_id: parentId,
    type: 'new_application',
    title: 'New Application',
    body: teenName && jobTitle
      ? `${teenName} applied to your job "${jobTitle}"`
      : 'A teen applied to your job',
    data: { job_id: jobId, teen_id: teenId },
  });

  return data;
};

export const acceptApplication = async (
  applicationId: string,
  jobId: string,
  teenId: string,
  parentId: string,
  teenName?: string,
  jobTitle?: string,
) => {
  // Accept this application
  const { error: appError } = await supabase
    .from('applications')
    .update({ status: 'accepted' })
    .eq('id', applicationId);
  if (appError) throw new Error(`Failed to accept application: ${appError.message}`);

  trackApplicationAccepted(applicationId, jobId, teenId);

  // Decline all other pending/invited apps for the same job
  await supabase
    .from('applications')
    .update({ status: 'declined' })
    .eq('job_id', jobId)
    .neq('id', applicationId)
    .in('status', ['pending', 'invited']);

  // Mark job in progress
  const { error: jobError } = await supabase
    .from('jobs')
    .update({ status: 'in_progress' })
    .eq('id', jobId);
  if (jobError) throw new Error(`Failed to update job status: ${jobError.message}`);

  // Send opening message from parent to teen
  const name = teenName ?? 'there';
  const title = jobTitle ? ` for "${jobTitle}"` : '';
  await supabase.from('messages').insert({
    sender_id: parentId,
    receiver_id: teenId,
    content: `Hi ${name}! I've accepted your application${title}. Looking forward to working with you!`,
    job_id: jobId,
    read: false,
  });

  await supabase.from('notifications').insert({
    user_id: teenId,
    type: 'application_accepted',
    title: 'Application Accepted!',
    body: jobTitle
      ? `Your application for "${jobTitle}" was accepted! Check your messages.`
      : 'Your application was accepted! You can now chat with the parent.',
    data: { job_id: jobId, parent_id: parentId },
  });
};

export const declineApplication = async (applicationId: string, teenId: string, jobTitle?: string) => {
  await supabase.from('applications').update({ status: 'declined' }).eq('id', applicationId);

  await supabase.from('notifications').insert({
    user_id: teenId,
    type: 'application_declined',
    title: 'Application Update',
    body: jobTitle
      ? `Update on your application for "${jobTitle}".`
      : 'A parent has reviewed your application.',
    data: {},
  });
};

export const completeJob = async (jobId: string, applicationId: string, teenId: string) => {
  await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
  await supabase.from('applications').update({ status: 'completed' }).eq('id', applicationId);
  trackJobCompleted(jobId, teenId, '');

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

