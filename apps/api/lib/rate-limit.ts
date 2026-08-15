// TODO: Upstash Redis-backed rate limiter, keyed by user id.
// Budgets per architecture.md: 1000 req/h general, 60/h assistant, 500 MB/day upload.
export async function checkRateLimit(_userId: string, _bucket: 'general' | 'assistant' | 'upload'): Promise<boolean> {
  return true;
}
