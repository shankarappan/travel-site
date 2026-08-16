import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  handleVoiceTool,
  handleWhatsAppInbound,
  verifyWhatsAppSignature,
} from './adapters';

describe('channel adapters', () => {
  it('verifies WhatsApp HMAC signatures', () => {
    const body = '{"from":"+64","body":"hi"}';
    const signature = `sha256=${createHmac('sha256', 'secret').update(body).digest('hex')}`;
    expect(verifyWhatsAppSignature(body, signature, 'secret')).toBe(true);
    expect(verifyWhatsAppSignature(body, 'sha256=deadbeef', 'secret')).toBe(false);
  });

  it('requires consent for promotional WhatsApp and supports opt-out without persistence', async () => {
    await expect(
      handleWhatsAppInbound({
        from: '+642111',
        body: 'promo deal',
        isPromotional: true,
        hasMarketingConsent: false,
      }),
    ).rejects.toThrow(/consent/i);

    const optOut = await handleWhatsAppInbound({ from: '+642111', body: 'STOP' });
    expect(optOut.reply).toMatch(/opted out/i);
  });

  it('requires voice read-back confirmation for sensitive fields', () => {
    const blocked = handleVoiceTool({
      tool: 'identify_customer',
      values: { email: 'a@example.com' },
      confirmedReadback: false,
    });
    expect(blocked.ok).toBe(false);

    const ok = handleVoiceTool({
      tool: 'transfer_human',
      values: { reason: 'billing' },
      confirmedReadback: true,
    });
    expect(ok.ok).toBe(true);
  });
});
