/**
 * messageService.ts
 * Clean API for all messaging operations. Wraps lib/messages.ts with thread-oriented helpers.
 */
import { notify } from './pushNotifications';
import { supabase } from './supabase';

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  job_id?: string | null;
};

export type Conversation = {
  other_id: string;
  other_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

// ─── Thread ──────────────────────────────────────────────────────────────────

/**
 * Returns true if a message exists between these two users (for a given job).
 * Used to avoid sending duplicate system messages on repeated accept clicks.
 */
export async function hasThread(userId1: string, userId2: string, jobId?: string): Promise<boolean> {
  let query = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);

  if (jobId) query = query.eq('job_id', jobId);

  const { count } = await query;
  return (count ?? 0) > 0;
}

/**
 * Send a system/auto message to open a thread.
 * Called when a parent accepts an application — creates the initial "Let's connect" message.
 */
export async function openThread(
  senderId: string,
  receiverId: string,
  content: string,
  jobId?: string,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content, job_id: jobId ?? null, read: false })
    .select('id, sender_id, receiver_id, content, created_at, read, job_id')
    .single();
  if (error) return null;
  return data as Message;
}

// ─── Send ────────────────────────────────────────────────────────────────────

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  jobId?: string,
): Promise<{ data: Message | null; error: any }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content, job_id: jobId ?? null, read: false })
    .select('id, sender_id, receiver_id, content, created_at, read, job_id')
    .single();

  if (!error && data) {
    // Push notification — best effort, don't await
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()
      .then(({ data: p }) => {
        if (p?.full_name) notify.newMessage(receiverId, p.full_name);
      });
  }

  return { data: data as Message | null, error };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function getMessages(userId: string, otherUserId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, read, job_id')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  return (data ?? []) as Message[];
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: msgs } = await supabase
    .from('messages')
    .select(
      'id, sender_id, receiver_id, content, created_at, read, sender:profiles!sender_id(id, full_name), receiver:profiles!receiver_id(id, full_name)',
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (!msgs) return [];

  const convMap = new Map<string, Conversation>();
  for (const msg of msgs) {
    const isMe = msg.sender_id === userId;
    const otherId: string = isMe ? msg.receiver_id : msg.sender_id;
    const otherProfile: any = isMe ? msg.receiver : msg.sender;
    const otherName: string = otherProfile?.full_name ?? 'Unknown';

    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        other_id: otherId,
        other_name: otherName,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: !isMe && !msg.read ? 1 : 0,
      });
    } else {
      if (!isMe && !msg.read) convMap.get(otherId)!.unread_count += 1;
    }
  }
  return Array.from(convMap.values());
}

// ─── Read receipts ───────────────────────────────────────────────────────────

export async function markMessagesAsRead(senderId: string, receiverId: string) {
  return supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId);
}

// ─── Real-time ───────────────────────────────────────────────────────────────

export function subscribeToMessages(userId: string, onNewMessage: (msg: Message) => void) {
  return supabase
    .channel(`messages-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
      (payload) => onNewMessage(payload.new as Message),
    )
    .subscribe();
}
