import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryConsentLedger } from './index.js';

describe('InMemoryConsentLedger', () => {
  const ledger = new InMemoryConsentLedger();

  beforeEach(() => {
    ledger.reset();
  });

  it('records marketing opt-in and enforces send checks', () => {
    ledger.ensureTransactional('u1');
    ledger.record({
      userId: 'u1',
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'toggle on',
    });
    expect(ledger.maySend('u1', 'marketing_email')).toBe(true);
    expect(ledger.maySend('u1', 'transactional_email')).toBe(true);
  });

  it('withdraws via unsubscribe token', () => {
    ledger.record({
      userId: 'u1',
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'toggle on',
    });
    const token = ledger.issueUnsubscribeToken('u1', 'marketing_email');
    const event = ledger.withdrawByUnsubscribeToken(token);
    expect(event?.granted).toBe(false);
    expect(ledger.maySend('u1', 'marketing_email')).toBe(false);
  });
});
