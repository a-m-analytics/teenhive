import { supabase } from './supabase';
import { trackJobApplied, trackApplicationAccepted, trackInviteSent, trackJobCompleted } from './analytics';
import { sendPushToUser } from './pushService';

const COLORS = ['RED', 'BLUE', 'GREEN', 'GOLD', 'SILVER', 'PURPLE', 'ORANGE', 'CORAL', 'AMBER', 'JADE'];
const ANIMALS = ['FOX', 'BEAR', 'EAGLE', 'HAWK', 'LION', 'TIGER', 'WOLF', 'DEER', 'OWL', 'CRANE'];
const NUMBERS = ['SEVEN', 'THREE', 'FIVE', 'NINE', 'FOUR', 'EIGHT', 'TWO', 'SIX', 'ONE', 'TEN'];

function generateSafetyCode(): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(COLORS)} ${pick(ANIMALS)} ${pick(NUMBERS)}`;
}

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

  const applyBody = teenName && jobTitle
    ? `${teenName} applied to your job "${jobTitle}"`
    : 'A teen applied to your job';

  await Promise.all([
    supabase.from('notifications').insert({
      user_id: parentId,
      type: 'new_application',
      title: 'New Application',
      body: applyBody,
      data: { job_id: jobId, teen_id: teenId },
    }),
    sendPushToUser(parentId, 'New Application', applyBody, { job_id: jobId, teen_id: teenId }),
  ]);

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
  // Accept this application and generate safety code
  const safetyCode = generateSafetyCode();
  const { error: appError } = await supabase
    .from('applications')
    .update({ status: 'accepted', safety_code: safetyCode })
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

  const acceptBody = jobTitle
    ? `Your application for "${jobTitle}" was accepted! Check your messages.`
    : 'Your application was accepted! You can now chat with the parent.';

  await Promise.all([
    supabase.from('notifications').insert({
      user_id: teenId,
      type: 'application_accepted',
      title: 'Application Accepted!',
      body: acceptBody,
      data: { job_id: jobId, parent_id: parentId },
    }),
    sendPushToUser(teenId, 'Application Accepted! 🎉', acceptBody, { job_id: jobId, parent_id: parentId }),
  ]);
};

export const declineApplication = async (applicationId: string, teenId: string, jobTitle?: string) => {
  await supabase.from('applications').update({ status: 'declined' }).eq('id', applicationId);

  const declineBody = jobTitle
    ? `Update on your application for "${jobTitle}".`
    : 'A parent has reviewed your application.';

  await Promise.all([
    supabase.from('notifications').insert({
      user_id: teenId,
      type: 'application_declined',
      title: 'Application Update',
      body: declineBody,
      data: {},
    }),
    sendPushToUser(teenId, 'Application Update', declineBody),
  ]);
};

// Step 1 of dual completion: parent requests — sets job to pending_teen_confirmation
export const requestJobCompletion = async (
  jobId: string,
  teenId: string,
  parentId: string,
  jobTitle?: string,
) => {
  await supabase.from('jobs').update({ status: 'pending_teen_confirmation' }).eq('id', jobId);

  const body = jobTitle
    ? `"${jobTitle}" has been marked complete — please confirm it's done.`
    : 'A job has been marked complete. Please confirm.';

  await Promise.all([
    supabase.from('notifications').insert({
      user_id: teenId,
      type: 'job_pending_confirmation',
      title: 'Confirm Job Complete',
      body,
      data: { job_id: jobId, parent_id: parentId },
    }),
    sendPushToUser(teenId, 'Confirm Job Complete', body, { job_id: jobId }),
  ]);
};

const CATEGORY_TO_SKILL: Record<string, string> = {
  'Babysitting': 'babysitting',
  'Tutoring': 'tutoring',
  'Yard Work': 'yard_work',
  'Lawn Mowing': 'yard_work',
  'Pet Care': 'pet_sitting',
  'Pet Sitting': 'pet_sitting',
  'Tech Help': 'tech_help',
  'Cleaning': 'cleaning',
  'Errands': 'errands',
  'Moving Help': 'moving_help',
  'Cooking': 'cooking',
  'Car Wash': 'car_wash',
};

// Step 2 of dual completion: teen confirms
export const confirmJobCompletion = async (
  jobId: string,
  applicationId: string,
  teenId: string,
  parentId: string,
  jobTitle?: string,
) => {
  await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
  await supabase.from('applications').update({ status: 'completed' }).eq('id', applicationId);
  trackJobCompleted(jobId, teenId, '');

  const [{ data: jobData }, { data: p }] = await Promise.all([
    supabase.from('jobs').select('category').eq('id', jobId).single(),
    supabase.from('profiles').select('jobs_completed, verified_skills').eq('id', teenId).single(),
  ]);

  const profileUpdates: Record<string, any> = {
    jobs_completed: ((p as any)?.jobs_completed ?? 0) + 1,
  };

  const skillKey = jobData?.category ? CATEGORY_TO_SKILL[jobData.category] : undefined;
  if (skillKey) {
    const currentSkills: Record<string, number> = (p as any)?.verified_skills ?? {};
    profileUpdates.verified_skills = { ...currentSkills, [skillKey]: (currentSkills[skillKey] ?? 0) + 1 };
  }

  await supabase.from('profiles').update(profileUpdates).eq('id', teenId);

  const teenBody = 'Job confirmed complete. Great work!';
  const parentBody = jobTitle ? `"${jobTitle}" confirmed complete.` : 'Job confirmed complete.';

  await Promise.all([
    supabase.from('notifications').insert({
      user_id: teenId,
      type: 'job_completed',
      title: 'Job Complete!',
      body: teenBody,
      data: { job_id: jobId },
    }),
    sendPushToUser(teenId, 'Job Complete! ✅', teenBody, { job_id: jobId }),
    supabase.from('notifications').insert({
      user_id: parentId,
      type: 'job_completed',
      title: 'Job Confirmed!',
      body: parentBody,
      data: { job_id: jobId },
    }),
    sendPushToUser(parentId, 'Job Confirmed! ✅', parentBody, { job_id: jobId }),
  ]);
};

// Teen disputes completion
export const disputeJob = async (
  jobId: string,
  teenId: string,
  parentId: string,
  jobTitle?: string,
) => {
  await supabase.from('jobs').update({ status: 'disputed' }).eq('id', jobId);

  const body = "We've been notified and will reach out within 24 hours.";
  await Promise.all([
    supabase.from('notifications').insert({
      user_id: teenId, type: 'job_disputed', title: 'Dispute Submitted', body, data: { job_id: jobId },
    }),
    supabase.from('notifications').insert({
      user_id: parentId, type: 'job_disputed', title: 'Job Dispute', body, data: { job_id: jobId },
    }),
    sendPushToUser(teenId, 'Dispute Submitted', body),
    sendPushToUser(parentId, 'Job Dispute', body),
  ]);

  // Log for admin review
  const [{ data: tp }, { data: pp }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', teenId).single(),
    supabase.from('profiles').select('full_name').eq('id', parentId).single(),
  ]);
  console.warn(`DISPUTE: "${jobTitle ?? jobId}" — teen: ${(tp as any)?.full_name}, parent: ${(pp as any)?.full_name}`);
};

// Legacy alias — kept so old call sites (markComplete in my-listings) still compile until migrated
export const completeJob = requestJobCompletion;

