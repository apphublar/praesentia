type Hit = {
  count: number;
  resetAt: number;
};

const hits = new Map<string, Hit>();

export function checkRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const hit = hits.get(key);

  if (!hit || hit.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  hit.count += 1;
  return {
    ok: hit.count <= limit,
    remaining: Math.max(0, limit - hit.count),
    retryAfterMs: Math.max(0, hit.resetAt - now)
  };
}
