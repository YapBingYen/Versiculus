import type { Request, Response, NextFunction } from 'express';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
};

export function rateLimit({ windowMs, max, key }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const k = key(req);
    const existing = hits.get(k);

    if (!existing || existing.resetAt <= now) {
      hits.set(k, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    hits.set(k, existing);
    next();
  };
}

