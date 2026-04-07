import { supabase } from './supabase';
import { notifyNewMessage } from './notifications';

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  jobId?: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      job_id: jobId ?? null,
      read: false,
    })
    .select('id, sender_id, receiver_id, content, created_at')
    .single();

  if (!error && data) {
    // Get sender name to notify recipient
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()
      .then(({ data: senderProfile }) => {
        if (senderProfile?.full_name) {
          notifyNewMessage(receiverId, senderProfile.full_name, senderId);
        }
      });
  }

  return { data, error };
}

export async function getMessages(userId: string, otherUserId: string) {
  return supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, read')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });
}

export async function getConversations(userId: string) {
  const { data: msgs } = await supabase
    .from('messages')
    .select(
      'id, sender_id, receiver_id, content, created_at, read, sender:profiles!sender_id(id, full_name), receiver:profiles!receiver_id(id, full_name)'
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (!msgs) return [];

  const convMap = new Map<
    string,
    { id: string; other_id: string; other_name: string; last_message: string; last_message_at: string; unread_count: number }
  >();

  for (const msg of msgs) {
    const isMe = msg.sender_id === userId;
    const otherId: string = isMe ? msg.receiver_id : msg.sender_id;
    const otherProfile: any = isMe ? msg.receiver : msg.sender;
    const otherName: string = otherProfile?.full_name ?? 'Unknown';

    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        id: otherId,
        other_id: otherId,
        other_name: otherName,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: !isMe && !msg.read ? 1 : 0,
      });
    } else {
      const existing = convMap.get(otherId)!;
      if (!isMe && !msg.read) existing.unread_count += 1;
    }
  }

  return Array.from(convMap.values());
}

export async function markMessageRead(messageId: string) {
  return supabase.from('messages').update({ read: true }).eq('id', messageId);
}

export async function markConversationRead(userId: string, otherUserId: string) {
  return supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', userId);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);
  return count ?? 0;
}

export function subscribeToMessages(
  userId: string,
  onNewMessage: (msg: any) => void
) {
  return supabase
    .channel(`messages-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe();
}
