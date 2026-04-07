// Simple in-memory rate limiter. Resets on app reload; sufficient for client-side abuse prevention.
// Server-side enforcement should be handled via Supabase RLS + postgres functions.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/**
 * @throws Error if the user has exceeded the rate limit for the given action.
 */
export function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowMs: number,
): void {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= maxRequests) {
    throw new Error("You're doing that too fast. Please wait a moment.");
  }

  entry.count += 1;
}

// Predefined limits for each action
export const LIMITS = {
  sendMessage:      { max: 20, windowMs: 60 * 1000 },           // 20 per minute
  applyToJob:       { max: 10, windowMs: 60 * 60 * 1000 },      // 10 per hour
  postJob:          { max: 5,  windowMs: 60 * 60 * 1000 },      // 5 per hour
  postTeenService:  { max: 3,  windowMs: 24 * 60 * 60 * 1000 }, // 3 per day
} as const;

export type RateLimitAction = keyof typeof LIMITS;

/** Convenience wrapper — reads limit config automatically. */
export function rateLimit(userId: string, action: RateLimitAction): void {
  const { max, windowMs } = LIMITS[action];
  checkRateLimit(userId, action, max, windowMs);
}
