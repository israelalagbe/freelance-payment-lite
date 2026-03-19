import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

/**
 * Key function: use profile_id header as rate-limit key so limits are
 * per-user rather than per-IP (which would penalise NAT-ed offices).
 * Falls back to the built-in ipKeyGenerator (which handles IPv6 correctly)
 * for unauthenticated routes such as admin analytics.
 */
const keyGenerator = (req: Request): string =>
  (req.headers['profile_id'] as string | undefined) ?? ipKeyGenerator(req.ip ?? 'unknown');

/** General limiter: 100 requests / minute applied to all routes. */
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  keyGenerator,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/** Analytics limiter: 30 requests / minute for expensive admin endpoints. */
export const analyticsLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analytics requests, please try again later.' },
});
