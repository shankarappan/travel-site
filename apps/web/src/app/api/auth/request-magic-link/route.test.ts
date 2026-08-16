import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const issueMagicLinkToken = vi.fn();
const sendMagicLinkEmail = vi.fn();
const assertMagicLinkRateLimit = vi.fn();
const isEmailDeliveryConfigured = vi.fn();

vi.mock('../../../../server/identity/store', () => ({
  issueMagicLinkToken: (...args: unknown[]) => issueMagicLinkToken(...args),
}));

vi.mock('../../../../server/email/send', () => ({
  sendMagicLinkEmail: (...args: unknown[]) => sendMagicLinkEmail(...args),
  isEmailDeliveryConfigured: (...args: unknown[]) => isEmailDeliveryConfigured(...args),
}));

vi.mock('../../../../server/identity/rate-limit', async () => {
  const actual =
    await vi.importActual('../../../../server/identity/rate-limit');
  return {
    ...(actual as object),
    assertMagicLinkRateLimit: (...args: unknown[]) => assertMagicLinkRateLimit(...args),
  };
});

describe('POST /api/auth/request-magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    issueMagicLinkToken.mockReset();
    sendMagicLinkEmail.mockReset();
    assertMagicLinkRateLimit.mockReset();
    isEmailDeliveryConfigured.mockReset();
    assertMagicLinkRateLimit.mockResolvedValue({ ok: true });
    issueMagicLinkToken.mockResolvedValue('raw-token-value-abcdefghijklmnopqrstuvwxyz');
    isEmailDeliveryConfigured.mockReturnValue(true);
    sendMagicLinkEmail.mockResolvedValue({
      ok: true,
      provider: 'resend',
      providerMessageId: 'email_1',
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds canonical verify URL and omits token from production JSON', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://travel-site-chi-five.vercel.app');
    vi.stubEnv('AUTH_URL', 'https://travel-site-chi-five.vercel.app');

    const { POST } = await import('./route');
    const response = await POST(
      new Request('https://internal.example/api/auth/request-magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.9',
        },
        body: JSON.stringify({ email: 'traveller@example.com' }),
      }),
    );
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.devMagicLink).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('raw-token-value');
    expect(sendMagicLinkEmail).toHaveBeenCalledWith({
      to: 'traveller@example.com',
      verifyUrl:
        'https://travel-site-chi-five.vercel.app/api/auth/verify-magic-link?token=raw-token-value-abcdefghijklmnopqrstuvwxyz',
    });
    expect(issueMagicLinkToken).toHaveBeenCalledWith({
      email: 'traveller@example.com',
      requestIp: '203.0.113.9',
    });
  });

  it('returns 429 when rate limited', async () => {
    assertMagicLinkRateLimit.mockResolvedValue({
      ok: false,
      scope: 'email',
      retryAfterSeconds: 900,
    });
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'traveller@example.com' }),
      }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('900');
    expect(issueMagicLinkToken).not.toHaveBeenCalled();
  });

  it('includes devMagicLink outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'dev@example.com' }),
      }),
    );
    const body = (await response.json()) as { devMagicLink?: string };
    expect(body.devMagicLink).toContain('token=raw-token-value');
  });
});
