// Small in-process rate limiter.
//
// The platform keeps its data in memory on a single node, so a shared store
// (Redis and friends) would add a dependency without buying anything here. Each
// limiter keeps its own bucket map and drops entries as they expire, so memory
// stays bounded by the number of distinct callers inside one window.
const buckets = new Map();

function getClientKey(request) {
  // Behind Railway/NGINX the socket address is the proxy, so prefer the
  // forwarded client address when the platform provides one.
  const forwarded = request.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
}

/**
 * @param {object} options
 * @param {string} options.name     Bucket namespace, so limiters never collide.
 * @param {number} options.max      Allowed requests per window.
 * @param {number} options.windowMs Window length in milliseconds.
 * @param {string} [options.message] Response message once the limit is hit.
 */
export function rateLimit({ name, max, windowMs, message }) {
  if (!buckets.has(name)) {
    buckets.set(name, new Map());
  }
  const bucket = buckets.get(name);

  return (request, response, next) => {
    // Tests hammer these endpoints deliberately; leaving the limiter on would
    // make the suite fail for reasons unrelated to what it is checking.
    if (process.env.RATE_LIMIT_DISABLED === 'true') {
      return next();
    }

    const key = getClientKey(request);
    const now = Date.now();
    const entry = bucket.get(key);

    if (!entry || entry.resetAt <= now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });

      // Opportunistic sweep so abandoned keys cannot accumulate forever.
      if (bucket.size > 5000) {
        for (const [existingKey, existingEntry] of bucket.entries()) {
          if (existingEntry.resetAt <= now) {
            bucket.delete(existingKey);
          }
        }
      }

      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      response.set('Retry-After', String(retryAfterSeconds));

      return response.status(429).json({
        message: message ?? 'Too many requests. Please wait and try again.',
        retryAfterSeconds,
      });
    }

    return next();
  };
}

// Exposed so a successful login can clear the failed-attempt budget for that
// caller — otherwise one person fumbling their password locks out everyone
// sharing an office NAT for the rest of the window.
export function resetRateLimit(name, request) {
  buckets.get(name)?.delete(getClientKey(request));
}
