type RateLimitBucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const SWEEP_THRESHOLD = 1000;

export function createRateLimiter(maxAttempts: number = MAX_ATTEMPTS, windowMs: number = WINDOW_MS) {
  const buckets = new Map<string, RateLimitBucket>();

  function sweep(now: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return function rateLimitBeforeHandle({ request, set }: any) {
    const now = Date.now();
    if (buckets.size > SWEEP_THRESHOLD) sweep(now);

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count += 1;

    if (bucket.count > maxAttempts) {
      set.status = 429;
      return { error: { message: "Too many attempts", code: "RATE_LIMITED" } };
    }
  };
}

export const authRateLimit = createRateLimiter();
