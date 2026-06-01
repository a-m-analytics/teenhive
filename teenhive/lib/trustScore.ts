import { supabase } from './supabase';

export type TrustLevel = 'Newcomer' | 'Rising' | 'Trusted' | 'Elite';

export const POINT_VALUES = {
  complete_job: 15,
  first_job_bonus: 20,
  review_5_star: 10,
  review_4_star: 5,
  review_3_star: 2,
  profile_complete: 10,
} as const;

export type PointReason = keyof typeof POINT_VALUES;

export function calculateLevel(score: number): TrustLevel {
  if (score >= 101) return 'Elite';
  if (score >= 51) return 'Trusted';
  if (score >= 21) return 'Rising';
  return 'Newcomer';
}

export async function awardPoints(teenId: string, reason: PointReason): Promise<void> {
  const points = POINT_VALUES[reason];

  const { data: profile } = await supabase
    .from('profiles')
    .select('trust_score')
    .eq('id', teenId)
    .single();

  const current = (profile?.trust_score as number) ?? 0;

  await supabase
    .from('profiles')
    .update({ trust_score: current + points })
    .eq('id', teenId);
}

export async function checkAndAwardProfileCompletion(teenId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, neighborhood, skills, availability, hourly_rate, profile_bonus_awarded')
    .eq('id', teenId)
    .single();

  if (!profile || profile.profile_bonus_awarded) return false;

  const isComplete =
    profile.full_name &&
    profile.bio &&
    profile.neighborhood &&
    profile.skills?.length > 0 &&
    profile.availability?.length > 0 &&
    profile.hourly_rate != null;

  if (isComplete) {
    await awardPoints(teenId, 'profile_complete');
    await supabase.from('profiles').update({ profile_bonus_awarded: true }).eq('id', teenId);
    return true;
  }
  return false;
}

export function getProfileCompletion(profile: {
  bio?: string | null;
  neighborhood?: string | null;
  skills?: string[];
  availability?: string[];
  hourly_rate?: number | null;
}): number {
  const checks = [
    !!profile.bio,
    !!profile.neighborhood,
    (profile.skills?.length ?? 0) > 0,
    (profile.availability?.length ?? 0) > 0,
    profile.hourly_rate != null,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
