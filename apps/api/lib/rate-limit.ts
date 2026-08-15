import { getRedis } from './redis';

// Budgets per architecture.md: 1000 req/h general, 60/h assistant,
// 500 MB/day upload. `amount` lets one function cover both request-count
// buckets (amount defaults to 1) and the byte-count upload bucket (call
// with the file size).
const BUDGETS = {
  general: { limit: 1000, windowSeconds: 3600 },
  assistant: { limit: 60, windowSeconds: 3600 },
  upload: { limit: 500 * 1024 * 1024, windowSeconds: 24 * 3600 },
} as const;

export async function checkRateLimit(key: string, bucket: keyof typeof BUDGETS, amount = 1): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // fail open when not configured — dev convenience, not a security stance

  const { limit, windowSeconds } = BUDGETS[bucket];
  const redisKey = `ratelimit:${bucket}:${key}`;
  const total = await redis.incrby(redisKey, amount);
  if (total === amount) await redis.expire(redisKey, windowSeconds);
  return total <= limit;
}
