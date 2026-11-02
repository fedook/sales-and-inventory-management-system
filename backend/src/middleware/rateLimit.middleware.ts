import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Very small in-memory rate limiter for the authentication endpoints.
 *
 * It protects against simple password guessing (many POSTs from one client).
 * For a multi-server production deployment you would store these counters in
 * Redis instead, but for this project one process is used.
 */
const buckets = new Map<string, Bucket>();

function removeExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit({ windowMs, max, message }: RateLimitOptions): RequestHandler {
  return (req, _res, next) => {
    const now = Date.now();

    // Keep the map small if the app runs for a long time.
    if (buckets.size > 1_000) {
      removeExpiredBuckets(now);
    }

    const key = `${req.ip ?? 'unknown'}:${req.method}:${req.baseUrl}${req.path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000));
      _res.setHeader('Retry-After', String(retryAfterSeconds));
      throw new AppError(
        `${message} Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
        429,
      );
    }

    next();
  };
}
