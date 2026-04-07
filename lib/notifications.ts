import { supabase } from './supabase';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    data,
    read: false,
  });
  return error;
}

export async function markAsRead(notificationId: string) {
  return supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllAsRead(userId: string) {
  return supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function getNotifications(userId: string) {
  return supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}

// ─── Domain-specific notification helpers ────────────────────────────────────

export async function notifyNewApplication(parentId: string, teenName: string, jobTitle: string, jobId: string, teenId: string) {
  return createNotification(
    parentId,
    'application',
    'New application received',
    `${teenName} applied for your "${jobTitle}" job`,
    { job_id: jobId, teen_id: teenId }
  );
}

export async function notifyApplicationAccepted(teenId: string, parentName: string, jobTitle: string, jobId: string) {
  return createNotification(
    teenId,
    'accepted',
    'Application accepted!',
    `${parentName} accepted your application for "${jobTitle}"`,
    { job_id: jobId }
  );
}

export async function notifyApplicationDeclined(teenId: string, parentName: string, jobTitle: string) {
  return createNotification(
    teenId,
    'declined',
    'Application update',
    `${parentName} could not accept your application for "${jobTitle}"`,
    {}
  );
}

export async function notifyNewMessage(receiverId: string, senderName: string, senderId: string) {
  return createNotification(
    receiverId,
    'message',
    'New message',
    `${senderName} sent you a message`,
    { sender_id: senderId }
  );
}

export async function notifyNewReview(revieweeId: string, reviewerName: string, rating: number) {
  return createNotification(
    revieweeId,
    'review',
    'New review received',
    `${reviewerName} left you a ${rating}-star review`,
    {}
  );
}

export async function notifyJobComplete(teenId: string, jobTitle: string, jobId: string) {
  return createNotification(
    teenId,
    'job_complete',
    'Job marked complete',
    `Your "${jobTitle}" job is complete. Time to leave a review!`,
    { job_id: jobId }
  );
}
