import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const keyGenerator = (req: Request): string =>
  (req.headers['profile_id'] as string | undefined) ?? ipKeyGenerator(req.ip ?? 'unknown');

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const analyticsLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analytics requests, please try again later.' },
});
