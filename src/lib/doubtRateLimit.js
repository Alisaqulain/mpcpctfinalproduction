const buckets = new Map();

export function rateLimitDoubtCreate(userId, limit = 10, windowMs = 60_000) {
  const key = String(userId);
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) {
    b.count = 0;
    b.reset = now + windowMs;
  }
  b.count++;
  buckets.set(key, b);
  return b.count <= limit;
}
