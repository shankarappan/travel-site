import { identityRepository } from '../persistence/repos';

export const MAGIC_LINK_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxPerEmail: 5,
  maxPerIp: 20,
} as const;

export type MagicLinkRateLimitResult =
  { ok: true } | { ok: false; retryAfterSeconds: number; scope: 'email' | 'ip' };

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp ? realIp.slice(0, 64) : null;
}

export async function assertMagicLinkRateLimit(input: {
  email: string;
  requestIp: string | null;
}): Promise<MagicLinkRateLimitResult> {
  const repo = identityRepository();
  const emailCount = await repo.countRecentMagicLinkRequests({
    email: input.email,
    windowMs: MAGIC_LINK_RATE_LIMIT.windowMs,
  });
  if (emailCount >= MAGIC_LINK_RATE_LIMIT.maxPerEmail) {
    return {
      ok: false,
      scope: 'email',
      retryAfterSeconds: Math.ceil(MAGIC_LINK_RATE_LIMIT.windowMs / 1000),
    };
  }

  if (input.requestIp) {
    const ipCount = await repo.countRecentMagicLinkRequests({
      requestIp: input.requestIp,
      windowMs: MAGIC_LINK_RATE_LIMIT.windowMs,
    });
    if (ipCount >= MAGIC_LINK_RATE_LIMIT.maxPerIp) {
      return {
        ok: false,
        scope: 'ip',
        retryAfterSeconds: Math.ceil(MAGIC_LINK_RATE_LIMIT.windowMs / 1000),
      };
    }
  }

  return { ok: true };
}
