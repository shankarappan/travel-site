import { beforeEach, describe, expect, it } from 'vitest';
import {
  ensureTransactionalConsent,
  getConsentStatuses,
  issueUnsubscribeToken,
  maySend,
  recordConsent,
  resetConsentStore,
  withdrawByUnsubscribeToken,
} from './store';

describe('consent store facade', () => {
  beforeEach(() => {
    resetConsentStore();
  });

  it('records and materializes preferences', () => {
    ensureTransactionalConsent('u1');
    recordConsent({
      userId: 'u1',
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'toggle on',
    });
    expect(maySend('u1', 'marketing_email')).toBe(true);
    expect(getConsentStatuses('u1').length).toBeGreaterThan(0);
  });

  it('withdraws via unsubscribe token', () => {
    recordConsent({
      userId: 'u1',
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'toggle on',
    });
    const token = issueUnsubscribeToken('u1', 'marketing_email');
    expect(withdrawByUnsubscribeToken(token)?.granted).toBe(false);
    expect(maySend('u1', 'marketing_email')).toBe(false);
  });
});
