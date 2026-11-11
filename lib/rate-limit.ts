/**
 * Fixed-window in-memory rate limiter for the Node.js runtime.
 *
 * Fine for a single-instance VPS. Counters reset when the process restarts;
 * move to Redis if the app ever runs on more than one instance.
 */

type Bucket = { count: number; startTime: number };

const buckets = new Map<string, Bucket>();

/**
 * Records one attempt for `key`. Returns false once more than `max` attempts
 * were made within `windowMs`.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Drop expired entries so the map doesn't grow unbounded
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (now - v.startTime > windowMs) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startTime > windowMs) {
    buckets.set(key, { count: 1, startTime: now });
    return true;
  }

  bucket.count++;
  return bucket.count <= max;
}

/** First address in x-forwarded-for (set by nginx), falling back to x-real-ip. */
export function clientIpFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string {
  if (!headers) return "unknown";
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  };
  return get("x-forwarded-for")?.split(",")[0]?.trim() || get("x-real-ip") || "unknown";
}
