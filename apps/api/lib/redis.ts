import { Redis } from '@upstash/redis';

// Shared Upstash client — used by rate-limit.ts and weather-cache.ts.
// Returns null (never throws) when unconfigured; callers decide how to
// degrade (rate-limit fails open, weather cache just skips caching).
let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — caching/rate-limiting disabled');
    client = null;
    return null;
  }
  client = new Redis({ url, token });
  return client;
}
