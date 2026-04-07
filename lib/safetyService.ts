/**
 * safetyService.ts
 * User reporting and blocking.
 *
 * Required Supabase tables:
 *   reports(id, reporter_id, reported_id, reason, description, created_at)
 *   blocks(id, blocker_id, blocked_id, created_at)
 * Both tables need RLS: users can only insert/select their own rows.
 */
import { supabase } from './supabase';

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'underage'
  | 'other';

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  description?: string,
): Promise<{ error: any }> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    description: description?.trim() ?? null,
  });
  return { error };
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
  return { error };
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  return { error };
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { count } = await supabase
    .from('blocks')
    .select('id', { count: 'exact', head: true })
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  return (count ?? 0) > 0;
}

/** Returns all user IDs that `userId` has blocked. */
export async function getBlockedIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  return (data ?? []).map((r: any) => r.blocked_id);
}
