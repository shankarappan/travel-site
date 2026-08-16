import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isEmailDeliveryConfigured,
  sendMagicLinkEmail,
  sendTransactionalEmail,
} from '../email/send';

describe('transactional email sender', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports unconfigured without calling the network', async () => {
    const fetchImpl = vi.fn();
    const result = await sendTransactionalEmail(
      { to: 'a@example.com', subject: 's', text: 't', html: '<p>t</p>' },
      {},
      fetchImpl as unknown as typeof fetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unconfigured');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(isEmailDeliveryConfigured({})).toBe(false);
  });

  it('sends via Resend when configured', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' }),
    });
    const result = await sendMagicLinkEmail({
      to: 'traveller@example.com',
      verifyUrl: 'https://travel.example/api/auth/verify-magic-link?token=secret-token-value',
    });
    const sent = await sendTransactionalEmail(
      {
        to: 'traveller@example.com',
        subject: 'Your Aotearoa Trails sign-in link',
        text: 'https://travel.example/api/auth/verify-magic-link?token=secret-token-value',
        html: '<p>link</p>',
      },
      {
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'Aotearoa Trails <noreply@example.com>',
      },
      fetchImpl as unknown as typeof fetch,
    );
    expect(result.ok).toBe(false);
    expect(sent).toEqual({ ok: true, provider: 'resend', providerMessageId: 'email_123' });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(String(init.headers)).not.toContain('secret-token-value');
    const body = JSON.parse(String(init.body)) as { text: string };
    expect(body.text).toContain('secret-token-value');
  });

  it('maps provider errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'invalid api key' }),
    });
    const sent = await sendTransactionalEmail(
      { to: 'a@example.com', subject: 's', text: 't', html: 'h' },
      { RESEND_API_KEY: 'bad', EMAIL_FROM: 'Aotearoa Trails <noreply@example.com>' },
      fetchImpl as unknown as typeof fetch,
    );
    expect(sent.ok).toBe(false);
    if (!sent.ok) {
      expect(sent.reason).toBe('provider_error');
      expect(sent.message).toContain('invalid api key');
    }
  });
});
