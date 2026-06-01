import { PostHog } from 'posthog-react-native';

// Initialize PostHog — swap in your real project API key from posthog.com
const posthog = new PostHog('phc_qVsg9AXx8pZ4cQ6tA2rmNk4pBsZNgsPNRgpb3kzhCKkP', {
  host: 'https://us.i.posthog.com',
  disabled: false, // set to __DEV__ to disable tracking during local development
});

export default posthog;

// ─── Event helpers ────────────────────────────────────────────────────────────

export function trackSignUp(userId: string, role: 'teen' | 'parent') {
  posthog.identify(userId, { role });
  posthog.capture('user_signed_up', { role });
}

export function trackLogIn(userId: string, role?: string) {
  posthog.identify(userId, role ? { role } : {});
  posthog.capture('user_logged_in', role ? { role } : {});
}

export function trackJobPosted(jobId: string, category: string, payRate: number, payType: string) {
  posthog.capture('job_posted', { job_id: jobId, category, pay_rate: payRate, pay_type: payType });
}

export function trackJobApplied(jobId: string, teenId: string, parentId: string) {
  posthog.capture('job_applied', { job_id: jobId, teen_id: teenId, parent_id: parentId });
}

export function trackApplicationAccepted(applicationId: string, jobId: string, teenId: string) {
  posthog.capture('application_accepted', { application_id: applicationId, job_id: jobId, teen_id: teenId });
}

export function trackMessageSent(senderId: string, receiverId: string) {
  posthog.capture('message_sent', { sender_id: senderId, receiver_id: receiverId });
}

export function trackProfileViewed(viewerId: string, profileId: string, profileRole: string) {
  posthog.capture('profile_viewed', { viewer_id: viewerId, profile_id: profileId, profile_role: profileRole });
}

export function trackInviteSent(parentId: string, teenId: string, jobId: string) {
  posthog.capture('invite_sent', { parent_id: parentId, teen_id: teenId, job_id: jobId });
}

export function trackJobCompleted(jobId: string, teenId: string, parentId: string) {
  posthog.capture('job_completed', { job_id: jobId, teen_id: teenId, parent_id: parentId });
}

export function trackReviewSubmitted(reviewerId: string, revieweeId: string, jobId: string, rating: number) {
  posthog.capture('review_submitted', { reviewer_id: reviewerId, reviewee_id: revieweeId, job_id: jobId, rating });
}
